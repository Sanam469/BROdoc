import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func, asc, desc
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.document import DocumentJob, JobStatus
from app.schemas.document import ReviewUpdateRequest, JobsQueryParams
from app.core.config import settings

logger = logging.getLogger(__name__)

MAX_RETRY_COUNT = 3

async def create_job(
    db: AsyncSession,
    filename: str,
    file_path: str,
    file_size: int,
    file_type: str,
) -> DocumentJob:
    
    job = DocumentJob(
        id=uuid.uuid4(),
        filename=filename,
        file_path=file_path,
        file_size=file_size,
        file_type=file_type,
        status=JobStatus.QUEUED,
        current_stage="job_queued",
        retry_count=0,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    logger.info(f"[JobService] Created job {job.id} for file: {filename}")
    return job

async def get_job_by_id(db: AsyncSession, job_id: str) -> DocumentJob:
    
    result = await db.execute(
        select(DocumentJob).where(DocumentJob.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found.",
        )
    return job

async def list_jobs(
    db: AsyncSession,
    params: JobsQueryParams,
) -> dict:
    
    query = select(DocumentJob)

    if params.search:
        query = query.where(
            DocumentJob.filename.ilike(f"%{params.search}%")
        )

    if params.status:
        query = query.where(DocumentJob.status == params.status)

    count_result = await db.execute(
        select(func.count()).select_from(query.subquery())
    )
    total = count_result.scalar_one()

    sort_column_map = {
        "created_at": DocumentJob.created_at,
        "updated_at": DocumentJob.updated_at,
        "filename":   DocumentJob.filename,
        "file_size":  DocumentJob.file_size,
        "status":     DocumentJob.status,
    }
    sort_col = sort_column_map.get(params.sort_by, DocumentJob.created_at)
    sort_fn = desc if params.order == "desc" else asc
    query = query.order_by(sort_fn(sort_col))

    offset = (params.page - 1) * params.per_page
    query = query.offset(offset).limit(params.per_page)

    result = await db.execute(query)
    jobs = result.scalars().all()

    return {
        "items":      jobs,
        "total":      total,
        "page":       params.page,
        "per_page":   params.per_page,
        "total_pages": (total + params.per_page - 1) // params.per_page,
    }

async def update_review(
    db: AsyncSession,
    job_id: str,
    updates: ReviewUpdateRequest,
) -> DocumentJob:
    
    job = await get_job_by_id(db, job_id)

    if job.status not in (JobStatus.COMPLETED, JobStatus.FINALIZED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot review job in status '{job.status.value}'. "
                   "Job must be completed first.",
        )

    current_data = dict(job.extracted_data or {})
    patch = updates.model_dump(exclude_none=True)  

    if not patch:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update.",
        )

    current_data.update(patch)

    job.extracted_data = current_data
    flag_modified(job, "extracted_data")
    job.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(job)
    logger.info(f"[JobService] Review updated for job {job_id}: {list(patch.keys())}")
    return job

async def finalize_job(db: AsyncSession, job_id: str) -> DocumentJob:
    
    job = await get_job_by_id(db, job_id)

    if job.status != JobStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot finalize job in status '{job.status.value}'. "
                   "Only completed jobs can be finalized.",
        )

    job.status = JobStatus.FINALIZED
    job.finalized_at = datetime.now(timezone.utc)
    job.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(job)
    logger.info(f"[JobService] Job {job_id} finalized at {job.finalized_at}")
    return job

async def retry_job(db: AsyncSession, job_id: str) -> DocumentJob:
    
    job = await get_job_by_id(db, job_id)

    if job.status == JobStatus.QUEUED:
        logger.info(f"[JobService] Job {job_id} already queued. Skipping retry.")
        return job

    if job.status != JobStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot retry job in status '{job.status.value}'. "
                   "Only failed jobs can be retried.",
        )

    if job.retry_count >= MAX_RETRY_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job has reached maximum retry limit ({MAX_RETRY_COUNT}). "
                   "Manual intervention required.",
        )

    job.status = JobStatus.QUEUED
    job.current_stage = "job_queued"
    job.error_message = None
    job.retry_count = job.retry_count + 1
    job.celery_task_id = None           
    job.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(job)
    logger.info(f"[JobService] Job {job_id} reset for retry")
    return job

async def delete_job(db: AsyncSession, job_id: str) -> None:
    
    job = await get_job_by_id(db, job_id)

    if job.status == JobStatus.PROCESSING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a job that is actively processing. Wait for it to finish.",
        )

    if job.file_path and os.path.exists(job.file_path):
        try:
            os.remove(job.file_path)
            logger.info(f"[JobService] Deleted physical file: {job.file_path}")
        except Exception as e:
            logger.warning(f"[JobService] Failed to delete file {job.file_path}: {e}")

    await db.delete(job)
    await db.commit()
    logger.info(f"[JobService] Deleted job record: {job_id}")