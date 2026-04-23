from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_pre_ping=True,
    echo=settings.DEBUG,  
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    
    pass

async def get_db():
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:

            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:

            await session.close()

async def init_db():
    
    async with engine.begin() as conn:

        from app.models import document  

        await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created / verified successfully.")