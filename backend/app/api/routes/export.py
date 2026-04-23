from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.export_service import export_job_as_json, export_job_as_csv

router = APIRouter()

@router.get(
    "/jobs/{job_id}/export",
    summary="Export finalized job result",
    description="Downloads the finalized extracted data as JSON or CSV. Job must be FINALIZED.",
)
async def export_job(
    job_id: str,
    format: str = Query("json", description="Export format: 'json' or 'csv'"),
    db: AsyncSession = Depends(get_db),
):
    
    if format.lower() == "csv":
        csv_content = await export_job_as_csv(db, job_id)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="brodoc_job_{job_id}.csv"'
            },
        )

    json_data = await export_job_as_json(db, job_id)
    return JSONResponse(
        content=json_data,
        headers={
            "Content-Disposition": f'attachment; filename="brodoc_job_{job_id}.json"'
        },
    )