"""Database configuration and initialization"""
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from core.config import settings


engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


async def init_db():
    """Initialize database tables and run migrations"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        # Migration: Add folder_id column to sessions table if missing
        try:
            await conn.execute(text("SELECT folder_id FROM sessions LIMIT 1"))
        except Exception:
            # Column doesn't exist, add it
            await conn.execute(text("ALTER TABLE sessions ADD COLUMN folder_id VARCHAR"))
            # Create index for folder_id
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_sessions_folder_id ON sessions(folder_id)"))

        # Migration: Create folders table if missing (handled by create_all, but ensure it exists)
        # The folders table is created by Base.metadata.create_all above


async def get_session() -> AsyncSession:
    """Dependency to get database session"""
    async with async_session() as session:
        yield session
