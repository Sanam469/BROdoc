from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.job_service import update_review
from app.schemas.document import ReviewUpdateRequest, JobDetailResponse

router = APIRouter()

@router.put(
    "/jobs/{job_id}/review",
    response_model=JobDetailResponse,
    summary="Update reviewed extracted fields",
    description="Allows partial update of extracted data fields. Job must be in COMPLETED status.",
)
async def review_job(
    job_id: str,
    updates: ReviewUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    
    job = await update_review(db, job_id, updates)
    return JobDetailResponse.model_validate(job)