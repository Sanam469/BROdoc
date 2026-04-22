from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime
from uuid import UUID
from app.models.document import JobStatus

class ExtractedData(BaseModel):
    title:    str            = Field(..., description="Derived from filename")
    category: str            = Field(..., description="Derived from file extension (PDF, DOCX, etc.)")
    summary:  str            = Field(..., description="First 200 words of parsed text content")
    keywords: list[str]      = Field(default_factory=list, description="Top keywords extracted")
    status:   str            = Field(default="completed")

    model_config = {"from_attributes": True}

class JobBase(BaseModel):
    
    id:            UUID
    filename:      str
    file_size:     int
    file_type:     str
    status:        JobStatus
    current_stage: Optional[str]
    retry_count:   int
    created_at:    datetime
    updated_at:    datetime

    model_config = {"from_attributes": True}

class JobListResponse(JobBase):
    
    error_message: Optional[str] = None
    finalized_at:  Optional[datetime] = None

class JobDetailResponse(JobBase):
    
    extracted_data: Optional[dict[str, Any]] = None
    error_message:  Optional[str] = None
    celery_task_id: Optional[str] = None
    finalized_at:   Optional[datetime] = None

class ReviewUpdateRequest(BaseModel):
    
    title:    Optional[str]       = None
    category: Optional[str]       = None
    summary:  Optional[str]       = None
    keywords: Optional[list[str]] = None

    @field_validator("keywords", mode="before")
    @classmethod
    def clean_keywords(cls, v):
        
        if v is not None:
            return [kw.strip() for kw in v if kw.strip()]
        return v

class FinalizeRequest(BaseModel):
    
    pass

class UploadResponse(BaseModel):
    
    job_id:   UUID
    filename: str
    status:   JobStatus
    message:  str = "Job queued for processing"

class ProgressEvent(BaseModel):
    
    job_id:    str
    stage:     str
    status:    str            
    message:   str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class JobsQueryParams(BaseModel):
    
    search:   Optional[str]       = Field(None, description="Search by filename (ILIKE)")
    status:   Optional[JobStatus] = Field(None, description="Filter by status")
    sort_by:  str                 = Field("created_at", description="Column to sort by")
    order:    str                 = Field("desc", description="asc or desc")
    page:     int                 = Field(1, ge=1, description="Page number")
    per_page: int                 = Field(20, ge=1, le=100, description="Items per page")

    @field_validator("sort_by")
    @classmethod
    def validate_sort_field(cls, v):
        allowed = {"created_at", "filename", "file_size", "status", "updated_at"}
        if v not in allowed:
            raise ValueError(f"sort_by must be one of: {allowed}")
        return v

    @field_validator("order")
    @classmethod
    def validate_order(cls, v):
        if v not in {"asc", "desc"}:
            raise ValueError("order must be 'asc' or 'desc'")
        return v