"""Session management API"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from core.database import get_session as get_db_session, Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Index
from models.schemas import MessageModel

router = APIRouter()
logger = logging.getLogger(__name__)


class SessionModel(Base):
    """Database model for sessions"""
    __tablename__ = "sessions"
    __table_args__ = (
        Index('ix_sessions_folder_updated', 'folder_id', 'updated_at'),
    )

    id: Mapped[str] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(default="New Chat")
    folder_id: Mapped[Optional[str]] = mapped_column(nullable=True, index=True)
    source: Mapped[str] = mapped_column(default="main", index=True)  # 'main' or 'quickpanel'
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class SessionResponse(BaseModel):
    """Pydantic response model"""
    id: str
    title: str
    folder_id: Optional[str] = None
    source: str = "main"  # 'main' or 'quickpanel'
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
    source: Optional[str] = Query(None, description="Filter by session source (main/quickpanel)"),
    db: AsyncSession = Depends(get_db_session)
):
    """List all sessions, optionally filtered by folder and source"""
    query = select(SessionModel).order_by(SessionModel.updated_at.desc())
    if folder_id is not None:
        query = query.where(SessionModel.folder_id == folder_id)
    if source is not None:
        query = query.where(SessionModel.source == source)
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


class SessionCreate(BaseModel):
    """Schema for creating a session"""
    source: str = "main"  # 'main' or 'quickpanel'


@router.post("/", response_model=SessionResponse)
async def create_session(
    request: SessionCreate = Body(default=SessionCreate()),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new session"""
    import uuid
    session = SessionModel(
        id=str(uuid.uuid4()),
        source=request.source
    )
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


class SessionTitleUpdate(BaseModel):
    """Schema for updating session title"""
    title: str


class GeneratedTitle(BaseModel):
    """Schema for AI-generated title response"""
    title: str
    session_id: str


@router.put("/{session_id}/title", response_model=SessionResponse)
async def update_session_title(
    session_id: str,
    title_update: SessionTitleUpdate,
    db: AsyncSession = Depends(get_db_session)
):
    """Update a session's title"""
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.title = title_update.title
    session.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(session)
    return session


@router.post("/{session_id}/generate-title", response_model=GeneratedTitle)
async def generate_session_title(
    session_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Generate a title for the session using AI based on conversation content.

    This endpoint analyzes the conversation history and generates a concise,
    descriptive title (max 50 characters) using the configured AI model.
    """
    from services.openai_service import openai_service

    # Get session
    result = await db.execute(select(SessionModel).where(SessionModel.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Get messages for this session
    msg_result = await db.execute(
        select(MessageModel)
        .where(MessageModel.session_id == session_id)
        .order_by(MessageModel.created_at.asc())
        .limit(10)  # Use first 10 messages for context
    )
    messages = msg_result.scalars().all()

    if not messages:
        # No messages yet, return default
        return GeneratedTitle(title="New Chat", session_id=session_id)

    # Build conversation summary for title generation
    conversation_text = "\n".join([
        f"{msg.role}: {msg.content[:200]}{'...' if len(msg.content) > 200 else ''}"
        for msg in messages[:5]  # Use first 5 messages
    ])

    # Generate title using AI
    try:
        if not openai_service.is_configured():
            # Fallback: use first user message as title
            first_user_msg = next((m for m in messages if m.role == "user"), None)
            fallback_title = (first_user_msg.content[:50] if first_user_msg else "New Chat")
            return GeneratedTitle(title=fallback_title, session_id=session_id)

        title_prompt = [
            {
                "role": "system",
                "content": "You are a helpful assistant that generates concise, descriptive titles for conversations. Generate a short title (max 50 characters) that summarizes the main topic. Only respond with the title, nothing else. Use the same language as the conversation."
            },
            {
                "role": "user",
                "content": f"Generate a short title (max 50 characters) for this conversation:\n\n{conversation_text}"
            }
        ]

        generated_title = await openai_service.chat(
            messages=title_prompt,
            max_tokens=50,
            temperature=0.7
        )

        # Clean up and truncate title
        title = generated_title.strip().strip('"\'').strip()
        if len(title) > 50:
            title = title[:47] + "..."

        # Update session title
        session.title = title
        session.updated_at = datetime.utcnow()
        await db.commit()

        return GeneratedTitle(title=title, session_id=session_id)

    except Exception as e:
        logger.error(f"Failed to generate title: {e}")
        # Fallback: use first user message as title
        first_user_msg = next((m for m in messages if m.role == "user"), None)
        fallback_title = (first_user_msg.content[:50] if first_user_msg else "New Chat")
        return GeneratedTitle(title=fallback_title, session_id=session_id)


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


# ============== Batch Operations ==============

class BatchDeleteRequest(BaseModel):
    """Request body for batch delete sessions"""
    session_ids: List[str]


class BatchMoveRequest(BaseModel):
    """Request body for batch move sessions"""
    session_ids: List[str]
    folder_id: Optional[str] = None  # None = move to root


class BatchMoveResult(BaseModel):
    """Result for a single session in batch move"""
    session_id: str
    success: bool
    error: Optional[str] = None


class BatchMoveResponse(BaseModel):
    """Response for batch move operation"""
    results: List[BatchMoveResult]
    success_count: int
    failed_count: int


class BatchExportResponse(BaseModel):
    """Response for batch export operation"""
    sessions: List[ExportData]


@router.post("/batch-delete")
async def batch_delete_sessions(
    request: BatchDeleteRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Delete multiple sessions at once"""
    deleted_count = 0
    errors = []

    for session_id in request.session_ids:
        result = await db.execute(
            select(SessionModel).where(SessionModel.id == session_id)
        )
        session = result.scalar_one_or_none()
        if session:
            await db.delete(session)
            deleted_count += 1
        else:
            errors.append(f"Session {session_id} not found")

    await db.commit()

    return {
        "deleted_count": deleted_count,
        "errors": errors if errors else None
    }


@router.post("/batch-move", response_model=BatchMoveResponse)
async def batch_move_sessions(
    request: BatchMoveRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Move multiple sessions to a folder (or root if folder_id is None)"""
    results = []

    # Validate folder_id if provided
    if request.folder_id:
        from api.folders import FolderModel
        folder_result = await db.execute(
            select(FolderModel).where(FolderModel.id == request.folder_id)
        )
        folder = folder_result.scalar_one_or_none()
        if not folder:
            # Return error for all sessions if folder doesn't exist
            return BatchMoveResponse(
                results=[
                    BatchMoveResult(
                        session_id=sid,
                        success=False,
                        error="Folder not found"
                    )
                    for sid in request.session_ids
                ],
                success_count=0,
                failed_count=len(request.session_ids)
            )

    for session_id in request.session_ids:
        result = await db.execute(
            select(SessionModel).where(SessionModel.id == session_id)
        )
        session = result.scalar_one_or_none()

        if session:
            session.folder_id = request.folder_id
            session.updated_at = datetime.utcnow()
            results.append(BatchMoveResult(session_id=session_id, success=True))
        else:
            results.append(BatchMoveResult(
                session_id=session_id,
                success=False,
                error="Session not found"
            ))

    await db.commit()

    success_count = sum(1 for r in results if r.success)
    return BatchMoveResponse(
        results=results,
        success_count=success_count,
        failed_count=len(results) - success_count
    )


@router.post("/batch-export", response_model=BatchExportResponse)
async def batch_export_sessions(
    request: BatchDeleteRequest,  # Reuse for session_ids
    db: AsyncSession = Depends(get_db_session)
):
    """Export multiple sessions with all messages"""
    export_data_list = []

    for session_id in request.session_ids:
        # Get session
        result = await db.execute(
            select(SessionModel).where(SessionModel.id == session_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            continue

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

        export_data_list.append(ExportData(
            session=SessionResponse(
                id=session.id,
                title=session.title,
                folder_id=session.folder_id,
                created_at=session.created_at,
                updated_at=session.updated_at
            ),
            messages=export_messages
        ))

    return BatchExportResponse(sessions=export_data_list)
