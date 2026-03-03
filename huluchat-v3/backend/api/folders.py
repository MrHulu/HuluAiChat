"""Folder management API for session organization"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Mapped, mapped_column

from core.database import get_session as get_db_session, Base

router = APIRouter()


class FolderModel(Base):
    """Database model for folders"""
    __tablename__ = "folders"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(default="New Folder")
    parent_id: Mapped[Optional[str]] = mapped_column(nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class FolderCreate(BaseModel):
    """Schema for creating a folder"""
    name: str
    parent_id: Optional[str] = None


class FolderUpdate(BaseModel):
    """Schema for updating a folder"""
    name: str


class FolderResponse(BaseModel):
    """Pydantic response model for folders"""
    id: str
    name: str
    parent_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/", response_model=List[FolderResponse])
async def list_folders(
    db: AsyncSession = Depends(get_db_session)
):
    """List all folders"""
    result = await db.execute(select(FolderModel).order_by(FolderModel.name))
    folders = result.scalars().all()
    return folders


@router.post("/", response_model=FolderResponse)
async def create_folder(
    folder: FolderCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new folder"""
    import uuid

    # Validate parent_id if provided
    if folder.parent_id:
        parent_result = await db.execute(
            select(FolderModel).where(FolderModel.id == folder.parent_id)
        )
        parent = parent_result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    new_folder = FolderModel(
        id=str(uuid.uuid4()),
        name=folder.name,
        parent_id=folder.parent_id
    )
    db.add(new_folder)
    await db.commit()
    await db.refresh(new_folder)
    return new_folder


@router.get("/{folder_id}", response_model=FolderResponse)
async def get_folder(
    folder_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a folder by ID"""
    result = await db.execute(
        select(FolderModel).where(FolderModel.id == folder_id)
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return folder


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: str,
    folder_update: FolderUpdate,
    db: AsyncSession = Depends(get_db_session)
):
    """Update a folder's name"""
    result = await db.execute(
        select(FolderModel).where(FolderModel.id == folder_id)
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    folder.name = folder_update.name
    folder.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(folder)
    return folder


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a folder. Sessions in this folder will be moved to root."""
    result = await db.execute(
        select(FolderModel).where(FolderModel.id == folder_id)
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Import here to avoid circular imports
    from api.sessions import SessionModel

    # Move all sessions in this folder to root (folder_id = None)
    sessions_result = await db.execute(
        select(SessionModel).where(SessionModel.folder_id == folder_id)
    )
    sessions = sessions_result.scalars().all()
    for session in sessions:
        session.folder_id = None

    # Delete child folders (or move them to root)
    child_folders_result = await db.execute(
        select(FolderModel).where(FolderModel.parent_id == folder_id)
    )
    child_folders = child_folders_result.scalars().all()
    for child in child_folders:
        child.parent_id = None

    await db.delete(folder)
    await db.commit()
    return {"status": "deleted", "sessions_moved": len(sessions)}
