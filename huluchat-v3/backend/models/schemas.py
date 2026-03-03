"""Message models and schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base


class MessageModel(Base):
    """Database model for messages."""
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(primary_key=True)
    session_id: Mapped[str] = mapped_column(index=True)
    role: Mapped[str] = mapped_column()  # 'user' or 'assistant'
    content: Mapped[str] = mapped_column()
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
    created_at: datetime

    class Config:
        from_attributes = True
