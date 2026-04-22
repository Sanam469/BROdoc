from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    
    APP_NAME: str = "BroDoc — Async Document Processing System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "postgresql+asyncpg://brodoc_user:brodoc_pass@localhost:5432/brodoc_db"

    SYNC_DATABASE_URL: str = "postgresql+psycopg2://brodoc_user:brodoc_pass@localhost:5432/brodoc_db"

    REDIS_URL: str = "redis://localhost:6379/0"

    REDIS_PUBSUB_CHANNEL: str = "brodoc:progress"

    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    UPLOAD_DIR: str = "./uploads"

    MAX_FILE_SIZE_BYTES: int = 20 * 1024 * 1024  

    ALLOWED_EXTENSIONS: list[str] = [".pdf", ".docx", ".doc", ".txt", ".png", ".jpg", ".jpeg"]

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",   
        "http://127.0.0.1:3000",
    ]

    SECRET_KEY: str = "brodoc-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  

    GEMINI_API_KEY: str | None = None

    model_config = SettingsConfigDict(

        env_file=".env",

        extra="ignore",

        case_sensitive=False,
    )

@lru_cache()
def get_settings() -> Settings:
    
    return Settings()

settings = get_settings()