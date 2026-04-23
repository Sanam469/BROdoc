import os
import uuid
import logging
from typing import List

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.job_service import create_job
from app.schemas.document import UploadResponse
from app.workers.tasks import process_document
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

@router.post(
    "/upload",
    response_model=List[UploadResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Upload one or more documents",
    description="Accepts multiple files, saves to disk, creates jobs, queues with Celery.",
)
async def upload_documents(
    files: List[UploadFile] = File(..., description="One or more document files"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files provided.",
        )

    responses = []

    for file in files:

        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"File type '{ext}' not supported. "
                       f"Allowed: {settings.ALLOWED_EXTENSIONS}",
            )

        content = await file.read()
        if len(content) > settings.MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{file.filename}' exceeds max size of "
                       f"{settings.MAX_FILE_SIZE_BYTES // (1024*1024)} MB.",
            )

        safe_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        logger.info(f"[Upload] Saved file: {file_path} ({len(content)} bytes)")

        job = await create_job(
            db=db,
            filename=file.filename,
            file_path=file_path,
            file_size=len(content),
            file_type=ext,
            user_id=str(current_user.id),
        )

        try:
            # Dispatch to the specific queue the worker is listening to
            task = process_document.apply_async(args=[str(job.id)], queue='documents')
            
            # Save the task ID so the UI can track it
            job.celery_task_id = task.id
            await db.commit()
            
            logger.info(f"[Upload] Dispatched Task {task.id} to 'documents' queue for job {job.id}")
        except Exception as e:
            logger.error(f"[Upload] CRITICAL: Failed to dispatch task to Celery: {str(e)}")
            # Even if dispatch fails, we've saved the job. The user can retry later.

        responses.append(UploadResponse(
            job_id=job.id,
            filename=job.filename,
            status=job.status,
            message="Job queued for background processing.",
        ))

    return responses