from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.job_service import get_job_by_id, list_jobs, delete_job
from app.schemas.document import JobDetailResponse, JobListResponse, JobsQueryParams, JobStatus

router = APIRouter()

@router.get(
    "/jobs",
    summary="List all document jobs",
    description="Returns paginated list of jobs for the authenticated user.",
)
async def get_jobs(

    search:   Optional[str]       = Query(None, description="Search by filename"),
    status_filter: Optional[JobStatus] = Query(None, alias="status", description="Filter by job status"),
    sort_by:  str                 = Query("created_at", description="Sort field"),
    order:    str                 = Query("desc", description="Sort direction: asc or desc"),
    page:     int                 = Query(1, ge=1, description="Page number"),
    per_page: int                 = Query(20, ge=1, le=100, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    params = JobsQueryParams(
        search=search,
        status=status_filter,
        sort_by=sort_by,
        order=order,
        page=page,
        per_page=per_page,
    )

    result = await list_jobs(db, params, user_id=str(current_user.id))

    return {
        "items":       [JobListResponse.model_validate(job) for job in result["items"]],
        "total":       result["total"],
        "page":        result["page"],
        "per_page":    result["per_page"],
        "total_pages": result["total_pages"],
    }

@router.get(
    "/jobs/{job_id}",
    response_model=JobDetailResponse,
    summary="Get single job details",
    description="Returns full job details including extracted data, error info, and timestamps.",
)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    job = await get_job_by_id(db, job_id, user_id=str(current_user.id))
    return JobDetailResponse.model_validate(job)

@router.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a job",
    description="Permanently deletes a job and its physical file from the disk.",
)
async def delete_job_route(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    await delete_job(db, job_id, user_id=str(current_user.id))
    return None