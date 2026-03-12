"""Session template models for TASK-197."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text

from core.database import Base


class TemplateModel(Base):
    """Database model for session templates.

    Templates allow users to quickly create sessions with preset configurations.
    """
    __tablename__ = "templates"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(nullable=True)  # Emoji or icon name
    # System prompt to prepend to conversations
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Default model to use (e.g., "gpt-4o", "deepseek-chat")
    default_model: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Default temperature
    temperature: Mapped[Optional[float]] = mapped_column(nullable=True)
    # Default top_p
    top_p: Mapped[Optional[float]] = mapped_column(nullable=True)
    # Default max_tokens
    max_tokens: Mapped[Optional[int]] = mapped_column(nullable=True)
    # MCP servers to enable (JSON array of server IDs)
    mcp_servers: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Whether this is a built-in template (cannot be deleted by user)
    is_builtin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class TemplateCreate(BaseModel):
    """Schema for creating a template."""
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    system_prompt: Optional[str] = None
    default_model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    mcp_servers: Optional[List[str]] = None


class TemplateUpdate(BaseModel):
    """Schema for updating a template."""
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    system_prompt: Optional[str] = None
    default_model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    mcp_servers: Optional[List[str]] = None


class TemplateResponse(BaseModel):
    """Schema for template response."""
    id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    system_prompt: Optional[str] = None
    default_model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    mcp_servers: Optional[List[str]] = None
    is_builtin: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, model: TemplateModel) -> "TemplateResponse":
        """Convert database model to response schema."""
        import json
        mcp_servers = None
        if model.mcp_servers:
            try:
                mcp_servers = json.loads(model.mcp_servers)
            except json.JSONDecodeError:
                pass
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            icon=model.icon,
            system_prompt=model.system_prompt,
            default_model=model.default_model,
            temperature=model.temperature,
            top_p=model.top_p,
            max_tokens=model.max_tokens,
            mcp_servers=mcp_servers,
            is_builtin=model.is_builtin,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
