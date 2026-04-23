import uuid
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base


class User(Base):
    """User account for authentication and document ownership."""

    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    email = Column(
        String(320),
        nullable=False,
        unique=True,
        index=True,
    )

    hashed_password = Column(
        String(1024),
        nullable=False,
    )

    full_name = Column(
        String(256),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self):
        return f"<User id={self.id} email={self.email!r}>"
