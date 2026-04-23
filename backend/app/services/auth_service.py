import uuid
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
import bcrypt
from jose import jwt

from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    # bcrypt expects bytes and has a 72 byte limit
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')[:72]
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(plain_bytes, hashed_bytes)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def register_user(
    db: AsyncSession,
    email: str,
    password: str,
    full_name: str,
) -> User:
    # Check duplicate
    result = await db.execute(select(User).where(User.email == email.lower().strip()))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        id=uuid.uuid4(),
        email=email.lower().strip(),
        hashed_password=hash_password(password),
        full_name=full_name.strip(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    logger.info(f"[Auth] Registered user {user.id} ({user.email})")
    return user


async def authenticate_user(
    db: AsyncSession,
    email: str,
    password: str,
) -> User:
    result = await db.execute(select(User).where(User.email == email.lower().strip()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    logger.info(f"[Auth] User {user.id} ({user.email}) logged in")
    return user
