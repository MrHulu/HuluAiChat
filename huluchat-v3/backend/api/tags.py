"""Session tags API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
import uuid

from core.database import get_session as get_db_session
from models.tags_bookmarks import (
    SessionTagModel,
    TagCreate,
    TagResponse,
    TagList,
)

router = APIRouter()


@router.get("/sessions/{session_id}/tags", response_model=TagList)
async def get_session_tags(
    session_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get all tags for a session"""
    result = await db.execute(
        select(SessionTagModel)
        .where(SessionTagModel.session_id == session_id)
        .order_by(SessionTagModel.tag_name)
    )
    tags = result.scalars().all()
    return TagList(
        session_id=session_id,
        tags=[tag.tag_name for tag in tags]
    )


@router.post("/sessions/{session_id}/tags", response_model=TagResponse)
async def add_session_tag(
    session_id: str,
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Add a tag to a session"""
    # Verify session exists
    from api.sessions import SessionModel
    session_result = await db.execute(
        select(SessionModel).where(SessionModel.id == session_id)
    )
    if not session_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Session not found")

    # Check if tag already exists
    existing = await db.execute(
        select(SessionTagModel)
        .where(SessionTagModel.session_id == session_id)
        .where(SessionTagModel.tag_name == tag_data.tag_name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tag already exists on this session")

    # Create tag
    tag = SessionTagModel(
        id=str(uuid.uuid4()),
        session_id=session_id,
        tag_name=tag_data.tag_name
    )
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/sessions/{session_id}/tags/{tag_name}")
async def remove_session_tag(
    session_id: str,
    tag_name: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Remove a tag from a session"""
    result = await db.execute(
        select(SessionTagModel)
        .where(SessionTagModel.session_id == session_id)
        .where(SessionTagModel.tag_name == tag_name)
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await db.delete(tag)
    await db.commit()
    return {"status": "deleted"}


@router.get("/tags", response_model=List[str])
async def list_all_tags(
    db: AsyncSession = Depends(get_db_session)
):
    """Get all unique tag names"""
    result = await db.execute(
        select(SessionTagModel.tag_name)
        .distinct()
        .order_by(SessionTagModel.tag_name)
    )
    tags = result.scalars().all()
    return tags


@router.get("/tags/{tag_name}/sessions")
async def get_sessions_by_tag(
    tag_name: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get all sessions with a specific tag"""
    from api.sessions import SessionModel, SessionResponse

    # Get all session IDs with this tag
    tag_result = await db.execute(
        select(SessionTagModel.session_id)
        .where(SessionTagModel.tag_name == tag_name)
    )
    session_ids = [row[0] for row in tag_result.all()]

    if not session_ids:
        return []

    # Get sessions
    session_result = await db.execute(
        select(SessionModel)
        .where(SessionModel.id.in_(session_ids))
        .order_by(SessionModel.updated_at.desc())
    )
    sessions = session_result.scalars().all()

    # Get tags for each session
    response = []
    for session in sessions:
        tags_result = await db.execute(
            select(SessionTagModel.tag_name)
            .where(SessionTagModel.session_id == session.id)
        )
        tags = [row[0] for row in tags_result.all()]

        response.append({
            "id": session.id,
            "title": session.title,
            "folder_id": session.folder_id,
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "tags": tags
        })

    return response
