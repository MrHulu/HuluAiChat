"""Database configuration and initialization"""
import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from alembic.config import Config
from alembic import command

from core.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all database models"""
    pass


def run_alembic_migrations():
    """Run Alembic migrations synchronously."""
    try:
        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
        command.upgrade(alembic_cfg, "head")
        logger.info("Alembic migrations completed successfully")
    except Exception as e:
        logger.warning(f"Alembic migration warning: {e}")
        # Fallback to create_all if migrations fail (e.g., first run)
        pass


async def init_db():
    """Initialize database tables and run migrations.

    Uses Alembic for migrations with fallback to create_all for first run.
    """
    # Try Alembic migrations first
    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, run_alembic_migrations)
    except Exception as e:
        logger.warning(f"Alembic migration failed, using create_all: {e}")
        # Fallback: create all tables directly
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Dependency to get database session"""
    async with async_session() as session:
        yield session
