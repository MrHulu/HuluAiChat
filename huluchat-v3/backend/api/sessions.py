"""Session management API"""
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from core.database import get_session as get_db_session, Base
from sqlalchemy.orm import Mapped, mapped_column
from models.schemas import MessageModel

router = APIRouter()


class SessionModel(Base):
    """Database model for sessions"""
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(default="New Chat")
    folder_id: Mapped[Optional[str]] = mapped_column(nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class SessionResponse(BaseModel):
    """Pydantic response model"""
    id: str
    title: str
    folder_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionMoveToFolder(BaseModel):
    """Schema for moving session to folder"""
    folder_id: Optional[str] = None  # None = move to root


class MessageMatch(BaseModel):
    """Matched message snippet for search results"""
    id: str
    session_id: str
    role: str
    content_snippet: str  # Truncated content with match highlighted
    created_at: datetime


class SessionSearchResult(BaseModel):
    """Search result for a session"""
    session: SessionResponse
    matched_messages: List[MessageMatch] = []
    match_type: str  # 'title' or 'content' or 'both'


@router.get("/", response_model=List[SessionResponse])
async def list_sessions(
    folder_id: Optional[str] = Query(None, description="Filter by folder ID"),
    db: AsyncSession = Depends(get_db_session)
):
    """List all sessions, optionally filtered by folder"""
    query = select(SessionModel).order_by(SessionModel.updated_at.desc())
    if folder_id is not None:
        query = query.where(SessionModel.folder_id == folder_id)
    result = await db.execute(query)
    sessions = result.scalars().all()
    return sessions


@router.get("/search/", response_model=List[SessionSearchResult])
async def search_sessions(
    q: str = Query(..., min_length=1, description="Search query"),
    db: AsyncSession = Depends(get_db_session)
):
    """Search sessions by title and message content"""
    query = q.lower().strip()
    results = []

    # Search in session titles
    title_result = await db.execute(
        select(SessionModel)
        .where(SessionModel.title.ilike(f"%{query}%"))
        .order_by(SessionModel.updated_at.desc())
    )
    title_sessions = {s.id: s for s in title_result.scalars().all()}

    # Search in message content
    message_result = await db.execute(
        select(MessageModel, SessionModel)
        .join(SessionModel, MessageModel.session_id == SessionModel.id)
        .where(MessageModel.content.ilike(f"%{query}%"))
        .order_by(SessionModel.updated_at.desc())
    )
    message_rows = message_result.all()

    # Group messages by session
    session_messages = {}
    sessions_from_messages = {}
    for msg, session in message_rows:
        if session.id not in session_messages:
            session_messages[session.id] = []
            sessions_from_messages[session.id] = session
        session_messages[session.id].append(msg)

    # Combine results
    all_session_ids = set(title_sessions.keys()) | set(sessions_from_messages.keys())

    for session_id in all_session_ids:
        # Get session (from either source)
        session = title_sessions.get(session_id) or sessions_from_messages.get(session_id)
        if not session:
            continue

        # Determine match type
        in_title = session_id in title_sessions
        in_content = session_id in session_messages
        match_type = "both" if (in_title and in_content) else ("title" if in_title else "content")

        # Get matched messages
        matched_messages = []
        if in_content:
            for msg in session_messages[session_id][:3]:  # Limit to 3 messages
                # Create snippet around match
                content = msg.content
                idx = content.lower().find(query)
                if idx != -1:
                    # Extract context around match (50 chars before and after)
                    start = max(0, idx - 50)
                    end = min(len(content), idx + len(query) + 50)
                    snippet = content[start:end]
                    if start > 0:
                        snippet = "..." + snippet
                    if end < len(content):
                        snippet = snippet + "..."
                else:
                    snippet = content[:100] + "..." if len(content) > 100 else content

                matched_messages.append(MessageMatch(
                    id=msg.id,
                    session_id=msg.session_id,
                    role=msg.role,
                    content_snippet=snippet,
                    created_at=msg.created_at
                ))

        results.append(SessionSearchResult(
            session=SessionResponse(
                id=session.id,
                title=session.title,
                created_at=session.created_at,
                updated_at=session.updated_at
            ),
            matched_messages=matched_messages,
            match_type=match_type
        ))

    # Sort by updated_at desc
    results.sort(key=lambda x: x.session.updated_at, reverse=True)
    return results


@router.post("/", response_model=SessionResponse)
async def create_session(
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new session"""
    import uuid
    session = SessionModel(id=str(uuid.uuid4()))
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a session by ID"""
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}")
async def delete_session(
    session_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a session"""
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
    return {"status": "deleted"}


@router.put("/{session_id}/folder", response_model=SessionResponse)
async def move_session_to_folder(
    session_id: str,
    move_request: SessionMoveToFolder,
    db: AsyncSession = Depends(get_db_session)
):
    """Move a session to a folder (or root if folder_id is None)"""
    # Get session
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Validate folder_id if provided
    if move_request.folder_id:
        from api.folders import FolderModel
        folder_result = await db.execute(
            select(FolderModel).where(FolderModel.id == move_request.folder_id)
        )
        folder = folder_result.scalar_one_or_none()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

    session.folder_id = move_request.folder_id
    session.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(session)
    return session


class ExportFormat(str, Enum):
    """Export format options"""
    markdown = "markdown"
    json = "json"
    txt = "txt"


class ExportMessage(BaseModel):
    """Message format for export"""
    role: str
    content: str
    created_at: datetime


class ExportData(BaseModel):
    """Full export data structure"""
    session: SessionResponse
    messages: List[ExportMessage]


@router.get("/{session_id}/export")
async def export_session(
    session_id: str,
    format: ExportFormat = Query(default=ExportFormat.markdown, description="Export format"),
    db: AsyncSession = Depends(get_db_session)
):
    """Export a session with all messages in specified format"""
    # Get session
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get messages
    msg_result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session_id)
        .order_by(MessageModel.created_at.asc())
    )
    messages = msg_result.scalars().all()

    # Build export data
    export_messages = [
        ExportMessage(
            role=msg.role,
            content=msg.content,
            created_at=msg.created_at
        )
        for msg in messages
    ]

    export_data = ExportData(
        session=SessionResponse(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at
        ),
        messages=export_messages
    )

    # Generate export content based on format
    if format == ExportFormat.json:
        content = export_data.model_dump_json(indent=2)
        filename = f"{session.title}_{session.created_at.strftime('%Y%m%d')}.json"
        media_type = "application/json"
    elif format == ExportFormat.txt:
        content = _export_as_txt(export_data)
        filename = f"{session.title}_{session.created_at.strftime('%Y%m%d')}.txt"
        media_type = "text/plain"
    else:  # markdown
        content = _export_as_markdown(export_data)
        filename = f"{session.title}_{session.created_at.strftime('%Y%m%d')}.md"
        media_type = "text/markdown"

    # Sanitize filename (remove invalid characters)
    import re
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)

    return PlainTextResponse(
        content=content,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


def _export_as_markdown(data: ExportData) -> str:
    """Export session as Markdown format"""
    lines = [
        f"# {data.session.title}",
        "",
        f"> Created: {data.session.created_at.strftime('%Y-%m-%d %H:%M')}",
        f"> Last Updated: {data.session.updated_at.strftime('%Y-%m-%d %H:%M')}",
        "",
        "---",
        "",
        "## Conversation",
        ""
    ]

    for msg in data.messages:
        role_emoji = "👤" if msg.role == "user" else "🤖"
        role_label = "User" if msg.role == "user" else "Assistant"
        lines.extend([
            f"### {role_emoji} {role_label}",
            f"*{msg.created_at.strftime('%Y-%m-%d %H:%M')}*",
            "",
            msg.content,
            "",
            "---",
            ""
        ])

    lines.extend([
        "",
        "---",
        "",
        f"*Exported from HuluChat on {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}*"
    ])

    return "\n".join(lines)


def _export_as_txt(data: ExportData) -> str:
    """Export session as plain text format"""
    lines = [
        f"Title: {data.session.title}",
        f"Created: {data.session.created_at.strftime('%Y-%m-%d %H:%M')}",
        f"Last Updated: {data.session.updated_at.strftime('%Y-%m-%d %H:%M')}",
        "",
        "=" * 50,
        "",
        "Conversation:",
        ""
    ]

    for msg in data.messages:
        role_label = "USER" if msg.role == "user" else "ASSISTANT"
        lines.extend([
            f"[{role_label}] {msg.created_at.strftime('%Y-%m-%d %H:%M')}",
            msg.content,
            "",
            "-" * 50,
            ""
        ])

    lines.extend([
        "",
        f"Exported from HuluChat on {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}"
    ])

    return "\n".join(lines)
