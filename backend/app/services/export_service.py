import csv
import json
import io
import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import DocumentJob, JobStatus
from app.services.job_service import get_job_by_id

logger = logging.getLogger(__name__)

async def export_job_as_json(db: AsyncSession, job_id: str) -> dict:
    
    job = await get_job_by_id(db, job_id)
    _assert_exportable(job)

    export_data = {
        "export_metadata": {
            "job_id":       str(job.id),
            "filename":     job.filename,
            "file_type":    job.file_type,
            "file_size_bytes": job.file_size,
            "created_at":   job.created_at.isoformat(),
            "finalized_at": job.finalized_at.isoformat() if job.finalized_at else None,
        },
        "extracted_data": job.extracted_data,
    }

    logger.info(f"[ExportService] JSON export for job {job_id}")
    return export_data

async def export_job_as_csv(db: AsyncSession, job_id: str) -> str:
    
    job = await get_job_by_id(db, job_id)
    _assert_exportable(job)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["field", "value"])

    writer.writerow(["job_id",       str(job.id)])
    writer.writerow(["filename",     job.filename])
    writer.writerow(["file_type",    job.file_type])
    writer.writerow(["file_size_bytes", job.file_size])
    writer.writerow(["created_at",   job.created_at.isoformat()])
    writer.writerow(["finalized_at", job.finalized_at.isoformat() if job.finalized_at else ""])

    data = job.extracted_data or {}
    for key, value in data.items():
        if isinstance(value, list):
            writer.writerow([key, "; ".join(str(v) for v in value)])
        else:
            writer.writerow([key, str(value)])

    logger.info(f"[ExportService] CSV export for job {job_id}")
    return output.getvalue()

def _assert_exportable(job: DocumentJob):
    
    if job.status != JobStatus.FINALIZED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job must be FINALIZED before export. "
                   f"Current status: '{job.status.value}'.",
        )