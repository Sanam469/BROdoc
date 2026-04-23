import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    BigInteger,
    DateTime,
    Enum as SAEnum,
    Text,
    ForeignKey,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.database import Base
import enum

class JobStatus(str, enum.Enum):
    QUEUED      = "queued"        
    PROCESSING  = "processing"    
    COMPLETED   = "completed"     
    FAILED      = "failed"        
    FINALIZED   = "finalized"     

class DocumentJob(Base):
    
    __tablename__ = "document_jobs"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
        comment="Unique job identifier (UUID). Used in all API URLs: /jobs/{id}"
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="Owner of this job. NULL for legacy jobs created before auth."
    )

    filename = Column(
        String(512),
        nullable=False,
        index=True,       
        comment="Original filename as uploaded. Used for search on dashboard."
    )

    file_path = Column(
        String(1024),
        nullable=False,
        comment="Absolute path to file on disk. Celery reads this to process the file."
    )

    file_size = Column(
        BigInteger,        
        nullable=False,
        comment="File size in bytes. Used for sorting on dashboard."
    )

    file_type = Column(
        String(20),
        nullable=False,
        comment="File extension: .pdf, .docx, .txt, etc. Used for type badge in UI."
    )

    status = Column(
        SAEnum(JobStatus, name="job_status_enum"),
        nullable=False,
        default=JobStatus.QUEUED,
        index=True,        
        comment="Current job status. The primary filter on the dashboard."
    )

    current_stage = Column(
        String(100),
        nullable=True,
        default="job_queued",
        comment=(
            "The specific processing stage the worker is on right now. "
            "Published via Redis PubSub and displayed as live progress."
        )
    )

    extracted_data = Column(
        JSONB,             
        nullable=True,
        comment=(
            "The final extracted output stored as JSON. Example: "
            '{"title": "...", "category": "...", "summary": "...", "keywords": [...]}'
            " This is what users review, edit, and export."
        )
    )

    error_message = Column(
        Text,
        nullable=True,
        comment="If status=failed, stores the error/traceback. Shown on detail page."
    )

    retry_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment=(
            "How many times this job has been retried. "
            "Used to enforce max retry limit (e.g., max 3 retries) "
            "and for idempotent retry — prevents duplicate processing."
        )
    )

    celery_task_id = Column(
        String(255),
        nullable=True,
        index=True,
        comment=(
            "The Celery task ID of the currently running worker task. "
            "Stored so we can call celery.control.revoke() on retry "
            "to cancel the old task before starting a fresh one."
        )
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),  
        index=True,                 
        comment="When the job was created (file uploaded). Primary sort column."
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),        
        comment="Last time this record was modified. Shows 'last activity' in UI."
    )

    finalized_at = Column(
        DateTime(timezone=True),
        nullable=True,              
        comment=(
            "Set when user finalizes the reviewed output. "
            "Null means not yet finalized. "
            "Export is only allowed when this is not null (status=finalized)."
        )
    )

    def __repr__(self):
        return (
            f"<DocumentJob id={self.id} "
            f"filename={self.filename!r} "
            f"status={self.status.value}>"
        )