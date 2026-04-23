from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.job_service import finalize_job
from app.schemas.document import JobDetailResponse

router = APIRouter()

@router.post(
    "/jobs/{job_id}/finalize",
    response_model=JobDetailResponse,
    summary="Finalize a reviewed job",
    description="Marks the job as finalized. Only COMPLETED jobs can be finalized. Required before export.",
)
async def finalize(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    job = await finalize_job(db, job_id, user_id=str(current_user.id))
    return JobDetailResponse.model_validate(job)