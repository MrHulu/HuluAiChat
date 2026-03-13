"""Message models and schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text, Index

from core.database import Base


class MessageModel(Base):
    """Database model for messages."""
    __tablename__ = "messages"
    __table_args__ = (
        Index('ix_messages_session_created', 'session_id', 'created_at'),
    )

    id: Mapped[str] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(index=True)
    role: Mapped[str] = mapped_column()  # 'user' or 'assistant'
    content: Mapped[str] = mapped_column()
    # Store images as JSON string: [{"type": "image_url", "image_url": {"url": "data:..."}}]
    images: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Store files as JSON string: [{"id": "...", "name": "...", "type": "...", "size": 123, "content": "data:..."}]
    files: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Model used to generate this message (for AI messages)
    model_id: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Original message ID if this is a regenerated response
    regenerated_from: Mapped[Optional[str]] = mapped_column(nullable=True)
    # When this message was regenerated
    regenerated_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class MessageCreate(BaseModel):
    """Schema for creating a message."""
    session_id: str
    role: str
    content: str


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: str
    session_id: str
    role: str
    content: str
    model_id: Optional[str] = None
    regenerated_from: Optional[str] = None
    regenerated_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
