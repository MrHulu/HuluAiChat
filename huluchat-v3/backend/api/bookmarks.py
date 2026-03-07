"""Message bookmarks API"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import uuid
import json

from core.database import get_session as get_db_session
from models.tags_bookmarks import (
    MessageBookmarkModel,
    BookmarkCreate,
    BookmarkUpdate,
    BookmarkResponse,
)
from models.schemas import MessageModel, SessionModel

router = APIRouter()


class BookmarkWithMessage(BookmarkResponse):
    """Bookmark with message content"""
    message_content: str
    message_role: str


class BookmarkExportItem(BookmarkResponse):
    """Full bookmark data for export"""
    message_content: str
    message_role: str
    session_name: Optional[str] = None
    model: Optional[str] = None


@router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(
    bookmark_data: BookmarkCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Bookmark a message"""
    # Verify message exists
    msg_result = await db.execute(
        select(MessageModel).where(MessageModel.id == bookmark_data.message_id)
    )
    message = msg_result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if already bookmarked
    existing = await db.execute(
        select(MessageBookmarkModel)
        .where(MessageBookmarkModel.message_id == bookmark_data.message_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Message already bookmarked")

    # Create bookmark
    bookmark = MessageBookmarkModel(
        id=str(uuid.uuid4()),
        message_id=bookmark_data.message_id,
        session_id=bookmark_data.session_id,
        note=bookmark_data.note
    )
    db.add(bookmark)
    await db.commit()
    await db.refresh(bookmark)
    return bookmark


@router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(
    bookmark_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Remove a bookmark"""
    result = await db.execute(
        select(MessageBookmarkModel).where(MessageBookmarkModel.id == bookmark_id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    await db.delete(bookmark)
    await db.commit()
    return {"status": "deleted"}


@router.put("/bookmarks/{bookmark_id}", response_model=BookmarkResponse)
async def update_bookmark(
    bookmark_id: str,
    update_data: BookmarkUpdate,
    db: AsyncSession = Depends(get_db_session)
):
    """Update bookmark note"""
    result = await db.execute(
        select(MessageBookmarkModel).where(MessageBookmarkModel.id == bookmark_id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    if update_data.note is not None:
        bookmark.note = update_data.note

    await db.commit()
    await db.refresh(bookmark)
    return bookmark


@router.get("/sessions/{session_id}/bookmarks", response_model=List[BookmarkWithMessage])
async def get_session_bookmarks(
    session_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get all bookmarks for a session with message content"""
    # Join bookmarks with messages
    result = await db.execute(
        select(MessageBookmarkModel, MessageModel)
        .join(MessageModel, MessageBookmarkModel.message_id == MessageModel.id)
        .where(MessageBookmarkModel.session_id == session_id)
        .order_by(MessageBookmarkModel.created_at.desc())
    )
    rows = result.all()

    bookmarks = []
    for bookmark, message in rows:
        bookmarks.append(BookmarkWithMessage(
            id=bookmark.id,
            message_id=bookmark.message_id,
            session_id=bookmark.session_id,
            note=bookmark.note,
            created_at=bookmark.created_at,
            message_content=message.content[:200] + "..." if len(message.content) > 200 else message.content,
            message_role=message.role
        ))

    return bookmarks


@router.get("/bookmarks", response_model=List[BookmarkWithMessage])
async def list_all_bookmarks(
    db: AsyncSession = Depends(get_db_session)
):
    """Get all bookmarks with message content"""
    result = await db.execute(
        select(MessageBookmarkModel, MessageModel)
        .join(MessageModel, MessageBookmarkModel.message_id == MessageModel.id)
        .order_by(MessageBookmarkModel.created_at.desc())
    )
    rows = result.all()

    bookmarks = []
    for bookmark, message in rows:
        bookmarks.append(BookmarkWithMessage(
            id=bookmark.id,
            message_id=bookmark.message_id,
            session_id=bookmark.session_id,
            note=bookmark.note,
            created_at=bookmark.created_at,
            message_content=message.content[:200] + "..." if len(message.content) > 200 else message.content,
            message_role=message.role
        ))

    return bookmarks


@router.get("/messages/{message_id}/bookmark", response_model=BookmarkResponse)
async def get_message_bookmark(
    message_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get bookmark for a specific message"""
    result = await db.execute(
        select(MessageBookmarkModel)
        .where(MessageBookmarkModel.message_id == message_id)
    )
    bookmark = result.scalar_one_or_none()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    return bookmark


# ============================================================
# Export Endpoints
# ============================================================

async def get_full_bookmarks_with_sessions(db: AsyncSession) -> List[dict]:
    """Get all bookmarks with full message content and session info"""
    # Join bookmarks with messages and sessions
    result = await db.execute(
        select(MessageBookmarkModel, MessageModel, SessionModel)
        .join(MessageModel, MessageBookmarkModel.message_id == MessageModel.id)
        .join(SessionModel, MessageBookmarkModel.session_id == SessionModel.id)
        .order_by(MessageBookmarkModel.created_at.desc())
    )
    rows = result.all()

    bookmarks = []
    for bookmark, message, session in rows:
        bookmarks.append({
            "id": bookmark.id,
            "message_id": bookmark.message_id,
            "session_id": bookmark.session_id,
            "session_name": session.title if session else "Unknown",
            "note": bookmark.note,
            "created_at": bookmark.created_at.isoformat() if bookmark.created_at else None,
            "message_content": message.content,
            "message_role": message.role,
            "model": message.model,
        })

    return bookmarks


@router.get("/bookmarks/export/json")
async def export_bookmarks_json(
    db: AsyncSession = Depends(get_db_session)
):
    """Export all bookmarks as JSON"""
    bookmarks = await get_full_bookmarks_with_sessions(db)

    export_data = {
        "exported_at": datetime.utcnow().isoformat(),
        "source": "HuluChat",
        "version": "3.51.0",
        "bookmarks": bookmarks
    }

    return JSONResponse(
        content=export_data,
        headers={
            "Content-Disposition": "attachment; filename=huluchat-bookmarks.json"
        }
    )


@router.get("/bookmarks/export/markdown")
async def export_bookmarks_markdown(
    db: AsyncSession = Depends(get_db_session)
):
    """Export all bookmarks as Markdown"""
    bookmarks = await get_full_bookmarks_with_sessions(db)

    lines = [
        "# HuluChat Bookmarks Export",
        "",
        f"> Exported: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        f"> Total bookmarks: {len(bookmarks)}",
        "",
        "---",
        "",
    ]

    # Group by session
    sessions = {}
    for b in bookmarks:
        session_name = b["session_name"]
        if session_name not in sessions:
            sessions[session_name] = []
        sessions[session_name].append(b)

    for session_name, session_bookmarks in sessions.items():
        lines.append(f"## {session_name}")
        lines.append("")

        for b in session_bookmarks:
            # Bookmark header
            role_emoji = "🤖" if b["message_role"] == "assistant" else "👤"
            lines.append(f"### {role_emoji} {b['message_role'].title()} Message")
            lines.append("")

            # Metadata
            if b.get("note"):
                lines.append(f"**Note:** {b['note']}")
                lines.append("")
            if b.get("model"):
                lines.append(f"**Model:** {b['model']}")
                lines.append("")
            lines.append(f"**Created:** {b['created_at']}")
            lines.append("")

            # Content
            lines.append("**Content:**")
            lines.append("```")
            lines.append(b["message_content"])
            lines.append("```")
            lines.append("")

        lines.append("---")
        lines.append("")

    lines.append("")
    lines.append("*Generated by [HuluChat](https://github.com/MrHulu/HuluAiChat)*")

    markdown_content = "\n".join(lines)

    return PlainTextResponse(
        content=markdown_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": "attachment; filename=huluchat-bookmarks.md"
        }
    )
