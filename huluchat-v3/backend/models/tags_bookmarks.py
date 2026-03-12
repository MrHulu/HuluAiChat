"""Session tags and message bookmarks models."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text, Index

from core.database import Base


# ============================================================
# Session Tags
# ============================================================

class SessionTagModel(Base):
    """Database model for session tags.

    A session can have multiple tags.
    Tags are stored as individual rows for efficient querying.
    """
    __tablename__ = "session_tags"
    __table_args__ = (
        Index('ix_session_tags_session_tag', 'session_id', 'tag_name'),
    )

    id: Mapped[str] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(index=True)
    tag_name: Mapped[str] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class TagCreate(BaseModel):
    """Schema for creating a tag."""
    session_id: str
    tag_name: str


class TagResponse(BaseModel):
    """Schema for tag response."""
    id: str
    session_id: str
    tag_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class TagList(BaseModel):
    """Schema for listing tags on a session."""
    session_id: str
    tags: List[str]


# ============================================================
# Message Bookmarks
# ============================================================

class MessageBookmarkModel(Base):
    """Database model for message bookmarks.

    Users can bookmark important messages for quick access.
    A message can only have one bookmark.
    """
    __tablename__ = "message_bookmarks"
    __table_args__ = (
        Index('ix_message_bookmarks_session_created', 'session_id', 'created_at'),
    )

    id: Mapped[str] = mapped_column(primary_key=True)
    message_id: Mapped[str] = mapped_column(index=True, unique=True)
    session_id: Mapped[str] = mapped_column(index=True)  # Denormalized for efficient queries
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class BookmarkCreate(BaseModel):
    """Schema for creating a bookmark."""
    message_id: str
    session_id: str
    note: Optional[str] = None


class BookmarkUpdate(BaseModel):
    """Schema for updating a bookmark."""
    note: Optional[str] = None


class BookmarkResponse(BaseModel):
    """Schema for bookmark response."""
    id: str
    message_id: str
    session_id: str
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
