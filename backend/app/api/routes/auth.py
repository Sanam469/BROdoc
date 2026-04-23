from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token,
)

router = APIRouter()


@router.post(
    "/auth/register",
    response_model=TokenResponse,
    status_code=201,
    summary="Register a new user",
    description="Create an account with email, password, and full name. Returns a JWT.",
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await register_user(db, body.email, body.password, body.full_name)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.post(
    "/auth/login",
    response_model=TokenResponse,
    summary="Login with email and password",
    description="Authenticate and receive a JWT for subsequent requests.",
)
async def login(
    body: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    user = await authenticate_user(db, body.email, body.password)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.get(
    "/auth/me",
    response_model=UserResponse,
    summary="Get current user info",
    description="Returns the currently authenticated user's profile.",
)
async def me(
    current_user: User = Depends(get_current_user),
):
    return UserResponse.model_validate(current_user)
