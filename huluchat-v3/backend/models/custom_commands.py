"""Custom Commands models for TASK-198.

Custom commands allow users to create shortcuts that execute multiple actions.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Text

from core.database import Base


class CustomCommandModel(Base):
    """Database model for custom commands."""
    __tablename__ = "custom_commands"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()  # Command name (e.g., "code-review")
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Command type: "prompt" (insert text), "action" (execute actions), "template" (apply template)
    command_type: Mapped[str] = mapped_column(default="prompt")
    # For "prompt" type: the text to insert
    prompt_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # For "template" type: template ID to apply
    template_id: Mapped[Optional[str]] = mapped_column(nullable=True)
    # For "action" type: JSON array of actions
    actions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Keyboard shortcut (e.g., "ctrl+shift+r")
    shortcut: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Icon (emoji or icon name)
    icon: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Whether this is a built-in command
    is_builtin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class CustomCommandCreate(BaseModel):
    """Schema for creating a custom command."""
    name: str
    description: Optional[str] = None
    command_type: str = "prompt"  # "prompt", "action", "template"
    prompt_content: Optional[str] = None
    template_id: Optional[str] = None
    actions: Optional[List[dict]] = None
    shortcut: Optional[str] = None
    icon: Optional[str] = None


class CustomCommandUpdate(BaseModel):
    """Schema for updating a custom command."""
    name: Optional[str] = None
    description: Optional[str] = None
    command_type: Optional[str] = None
    prompt_content: Optional[str] = None
    template_id: Optional[str] = None
    actions: Optional[List[dict]] = None
    shortcut: Optional[str] = None
    icon: Optional[str] = None


class CustomCommandResponse(BaseModel):
    """Schema for custom command response."""
    id: str
    name: str
    description: Optional[str] = None
    command_type: str = "prompt"
    prompt_content: Optional[str] = None
    template_id: Optional[str] = None
    actions: Optional[List[dict]] = None
    shortcut: Optional[str] = None
    icon: Optional[str] = None
    is_builtin: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_model(cls, model: CustomCommandModel) -> "CustomCommandResponse":
        """Convert database model to response schema."""
        import json
        actions = None
        if model.actions:
            try:
                actions = json.loads(model.actions)
            except json.JSONDecodeError:
                pass
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            command_type=model.command_type,
            prompt_content=model.prompt_content,
            template_id=model.template_id,
            actions=actions,
            shortcut=model.shortcut,
            icon=model.icon,
            is_builtin=model.is_builtin,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
