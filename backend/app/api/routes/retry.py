import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.job_service import retry_job
from app.schemas.document import JobDetailResponse
from app.workers.tasks import process_document

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post(
    "/jobs/{job_id}/retry",
    response_model=JobDetailResponse,
    summary="Retry a failed job",
    description="Resets a FAILED job to QUEUED and re-queues it for Celery processing. Max 3 retries.",
)
async def retry(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    
    job = await retry_job(db, job_id)

    process_document.delay(str(job.id))
    logger.info(f"[Retry] Re-queued job {job_id}")
    return JobDetailResponse.model_validate(job)