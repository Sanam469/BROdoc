import time
import json
import logging
import os
from datetime import datetime, timezone

import redis
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from PIL import Image
import PyPDF2
import docx

from google import genai
from google.genai import types

from app.workers.celery_app import celery_app
from app.core.config import settings
from app.models.document import DocumentJob, JobStatus

logger = logging.getLogger(__name__)

api_key = settings.GEMINI_API_KEY
if api_key:
    genai_client = genai.Client(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY is missing from environment! AI tasks will fail.")
    genai_client = None

sync_engine = create_engine(
    settings.SYNC_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

SyncSessionLocal = sessionmaker(
    bind=sync_engine,
    autocommit=False,
    autoflush=False,
)

def get_sync_db() -> Session:
    return SyncSessionLocal()

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def publish_progress(job_id: str, stage: str, status: str, message: str):
    event = {
        "job_id":    job_id,
        "stage":     stage,
        "status":    status,
        "message":   message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    channel = f"{settings.REDIS_PUBSUB_CHANNEL}:{job_id}"
    try:
        redis_client.publish(channel, json.dumps(event))
        logger.info(f"[PubSub] Published → {channel}: {stage} ({status})")
    except Exception as e:
        logger.error(f"[PubSub] Publish failed for job {job_id}: {e}")

def update_job(db: Session, job_id: str, **kwargs):
    db.query(DocumentJob).filter(
        DocumentJob.id == job_id
    ).update({**kwargs, "updated_at": datetime.now(timezone.utc)})
    db.commit()

def extract_document_text(file_path: str, filename: str) -> str:
    
    ext = os.path.splitext(filename)[1].lower()
    raw_text = ""
    try:
        if ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read()
        elif ext == ".pdf":
            with open(file_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text = page.extract_text()
                    if text:
                        raw_text += text + "\n"
        elif ext in [".docx", ".doc"]:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                raw_text += para.text + "\n"
    except Exception as e:
        logger.error(f"[Extraction Error] Failed to read {filename}: {e}")
        raw_text = f"Error extracting text locally: {e}"

    if not raw_text.strip():
        raw_text = "No extractable text found in this document."
    return raw_text.strip()

def extract_fields_via_gemini(file_path: str, filename: str, file_type: str) -> dict:
    
    name_without_ext = os.path.splitext(filename)[0]
    title = name_without_ext.replace("_", " ").replace("-", " ").title()

    category_map = {
        ".pdf":  "PDF Document",
        ".docx": "Word Document",
        ".doc":  "Word Document",
        ".txt":  "Text File",
        ".png":  "Image Document",
        ".jpg":  "Image Document",
        ".jpeg": "Image Document",
    }
    category = category_map.get(file_type.lower(), "Unknown Document")

    if not genai_client:
        raise Exception("GEMINI_API_KEY is not configured.")

    prompt = (
        "Analyze the following document content.\n"
        "Return exactly a JSON object matching this schema:\n"
        "{\n"
        "  \"summary\": \"A highly accurate 3-4 line summary of the contents\",\n"
        "  \"keywords\": [\"keyword1\", \"keyword2\", \"keyword3\", \"keyword4\"]\n"
        "}\n"
    )

    ext = file_type.lower()
    contents = []

    if ext in [".png", ".jpg", ".jpeg"]:

        img = Image.open(file_path)
        img.thumbnail((2000, 2000)) 
        contents = [img, prompt]
    else:

        raw_text = extract_document_text(file_path, filename)

        contents = [f"{prompt}\n\nDocument Text:\n{raw_text[:30000]}"]

    # Try multiple common model names in order of reliability
    model_names = ['gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro', 'gemini-1.5-flash-002']
    
    last_error = None
    response = None
    
    for model_name in model_names:
        try:
            print(f"🤖 Attempting to use model: {model_name}")
            response = genai_client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                )
            )
            break # Success!
        except Exception as e:
            last_error = e
            print(f"⚠️ Model {model_name} failed: {e}")
            continue
            
    if response is None:
        raise last_error

    try:
        parsed = json.loads(response.text)
        summary = parsed.get("summary", "No summary generated.")
        keywords = parsed.get("keywords", [])
    except Exception as e:
        logger.error(f"[JSON Parse Error] Gemini response invalid: {response.text}")
        summary = "Error parsing AI response."
        keywords = []

    return {
        "title": title,
        "category": category,
        "summary": summary,
        "keywords": keywords,
        "status": "completed"
    }

@celery_app.task(
    name="process_document",
    bind=True,                  
    max_retries=5,              
    default_retry_delay=15,     
    queue="documents",          
)
def process_document(self, job_id: str):
    db = get_sync_db()
    logger.info(f"[Task] Starting process_document for job_id={job_id}")

    try:
        job = db.query(DocumentJob).filter(DocumentJob.id == job_id).first()
        if not job:
            return {"error": "Job not found"}

        update_job(db, job_id, celery_task_id=self.request.id)

        update_job(db, job_id, status=JobStatus.PROCESSING, current_stage="job_started")
        publish_progress(job_id, "job_started", "in_progress", "Worker picked up the job.")

        update_job(db, job_id, current_stage="document_parsing_started")
        publish_progress(job_id, "document_parsing_started", "in_progress", f"Sending {job.filename} to Gemini AI...")

        extracted_data = extract_fields_via_gemini(job.file_path, job.filename, job.file_type)

        update_job(db, job_id, current_stage="field_extraction_completed")
        publish_progress(job_id, "field_extraction_completed", "completed", "Gemini successfully analyzed the document.")

        update_job(db, job_id, status=JobStatus.COMPLETED, current_stage="job_completed", extracted_data=extracted_data)
        publish_progress(job_id, "job_completed", "completed", "Processing complete. Document ready for review.")

        return {"job_id": job_id, "status": "completed"}

    except Exception as exc:
        error_msg = str(exc)

        if "429" in error_msg:
            logger.warning(f"[Rate Limit Hit] Retrying job {job_id} in 20s...")
            publish_progress(job_id, "job_paused", "in_progress", "Gemini rate limit hit. Sleeping for 20s before retry...")
            db.close() 
            raise self.retry(exc=exc, countdown=20)

        logger.error(f"[Task] ❌ Job {job_id} failed: {error_msg}", exc_info=True)

        try:
            update_job(db, job_id, status=JobStatus.FAILED, current_stage="job_failed", error_message=error_msg)
            publish_progress(job_id, "job_failed", "failed", f"Processing failed: {error_msg[:200]}")
        except Exception as db_exc:
            pass

        raise

    finally:
        db.close()