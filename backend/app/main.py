import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import init_db

from app.api.routes import upload, jobs, progress, review, finalize, retry, export

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):

    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"📁 Upload directory ready: {settings.UPLOAD_DIR}")

    try:
        await init_db()
        logger.info("✅ Database connected and tables verified.")
    except Exception as e:
        logger.warning(
            f"⚠️  Database unavailable at startup: {e}\n"
            "    Server is running but DB-dependent routes will fail.\n"
            "    Start PostgreSQL and restart the server for full functionality."
        )

    logger.info("✅ Application startup complete.")
    yield

    logger.info("👋 Application shutting down.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Async Document Processing Workflow System",
    docs_url="/docs",        
    redoc_url="/redoc",      
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"

app.include_router(upload.router,   prefix=API_PREFIX, tags=["Upload"])
app.include_router(jobs.router,     prefix=API_PREFIX, tags=["Jobs"])
app.include_router(progress.router, prefix=API_PREFIX, tags=["Progress (SSE)"])
app.include_router(review.router,   prefix=API_PREFIX, tags=["Review"])
app.include_router(finalize.router, prefix=API_PREFIX, tags=["Finalize"])
app.include_router(retry.router,    prefix=API_PREFIX, tags=["Retry"])
app.include_router(export.router,   prefix=API_PREFIX, tags=["Export"])

@app.get("/health", tags=["Health"])
async def health_check():
    
    return {
        "status": "healthy",
        "app":    settings.APP_NAME,
        "version": settings.APP_VERSION,
    }

@app.get("/", tags=["Root"])
async def root():
    
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs":    "/docs",
        "health":  "/health",
        "version": settings.APP_VERSION,
    }