"""Session Template API for TASK-197.

Session templates allow users to quickly create sessions with preset configurations
including system prompt, default model, temperature, and MCP servers.
"""
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel

from core.database import get_session as get_db_session, Base

router = APIRouter(prefix="/session-templates", tags=["session-templates"])
logger = logging.getLogger(__name__)


class SessionTemplateModel(Base):
    """Database model for session templates."""
    __tablename__ = "session_templates"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    description: Mapped[Optional[str]] = mapped_column(nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(nullable=True)  # Emoji or icon name
    # System prompt to prepend to conversations
    system_prompt: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Default model to use (e.g., "gpt-4o", "deepseek-chat")
    default_model: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Default parameters
    temperature: Mapped[Optional[float]] = mapped_column(nullable=True)
    top_p: Mapped[Optional[float]] = mapped_column(nullable=True)
    max_tokens: Mapped[Optional[int]] = mapped_column(nullable=True)
    # MCP servers to enable (JSON array of server IDs)
    mcp_servers: Mapped[Optional[str]] = mapped_column(nullable=True)
    # Whether this is a built-in template
    is_builtin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class SessionTemplateCreate(BaseModel):
    """Schema for creating a session template."""
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    system_prompt: Optional[str] = None
    default_model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    mcp_servers: Optional[List[str]] = None


class SessionTemplateUpdate(BaseModel):
    """Schema for updating a session template."""
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    system_prompt: Optional[str] = None
    default_model: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None
    mcp_servers: Optional[List[str]] = None


class SessionTemplateResponse(BaseModel):
    """Schema for session template response."""
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
    def from_model(cls, model: SessionTemplateModel) -> "SessionTemplateResponse":
        """Convert database model to response schema."""
        mcp_servers = None
        if model.mcp_servers:
            try:
                mcp_servers = json.loads(model.mcp_servers)
            except json.JSONDecodeError as e:
                # Log the error but don't fail - return None for mcp_servers
                logger.warning(
                    f"Failed to parse mcp_servers JSON for template {model.id}: {e}. "
                    f"Raw value: {model.mcp_servers[:100] if len(model.mcp_servers) > 100 else model.mcp_servers}"
                )
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


# Built-in session templates
BUILTIN_SESSION_TEMPLATES = [
    {
        "id": "general-chat",
        "name": "通用对话",
        "description": "适用于日常问答和通用对话",
        "icon": "💬",
        "system_prompt": None,
        "default_model": None,
        "temperature": None,
        "top_p": None,
        "max_tokens": None,
        "mcp_servers": None,
        "is_builtin": True,
    },
    {
        "id": "code-assistant",
        "name": "代码助手",
        "description": "专注于代码编写、调试和代码审查",
        "icon": "💻",
        "system_prompt": "你是一个专业的编程助手。请用简洁、准确的方式回答编程问题，优先提供代码示例和最佳实践。",
        "default_model": None,
        "temperature": 0.3,
        "top_p": None,
        "max_tokens": None,
        "mcp_servers": None,
        "is_builtin": True,
    },
    {
        "id": "translation",
        "name": "翻译助手",
        "description": "专业的多语言翻译服务",
        "icon": "🌐",
        "system_prompt": "你是一个专业的翻译助手。请准确翻译用户提供的文本，保持原文的语气和风格。如果需要，可以提供翻译说明。",
        "default_model": None,
        "temperature": 0.2,
        "top_p": None,
        "max_tokens": None,
        "mcp_servers": None,
        "is_builtin": True,
    },
    {
        "id": "creative-writing",
        "name": "创意写作",
        "description": "帮助撰写文章、邮件和创意内容",
        "icon": "✍️",
        "system_prompt": "你是一个专业的写作助手。帮助用户撰写、编辑和改进各种文本内容，包括文章、邮件、报告和创意写作。",
        "default_model": None,
        "temperature": 0.7,
        "top_p": None,
        "max_tokens": None,
        "mcp_servers": None,
        "is_builtin": True,
    },
]


async def ensure_builtin_session_templates(db: AsyncSession):
    """Ensure built-in session templates exist in the database."""
    for template_data in BUILTIN_SESSION_TEMPLATES:
        result = await db.execute(
            select(SessionTemplateModel).where(SessionTemplateModel.id == template_data["id"])
        )
        existing = result.scalar_one_or_none()
        if not existing:
            template = SessionTemplateModel(
                id=template_data["id"],
                name=template_data["name"],
                description=template_data["description"],
                icon=template_data["icon"],
                system_prompt=template_data["system_prompt"],
                default_model=template_data["default_model"],
                temperature=template_data["temperature"],
                top_p=template_data["top_p"],
                max_tokens=template_data["max_tokens"],
                mcp_servers=json.dumps(template_data["mcp_servers"]) if template_data["mcp_servers"] else None,
                is_builtin=True,
            )
            db.add(template)
    await db.commit()


@router.get("", response_model=List[SessionTemplateResponse])
async def list_session_templates(
    db: AsyncSession = Depends(get_db_session),
):
    """List all session templates (built-in + user-created)."""
    # Ensure built-in templates exist
    await ensure_builtin_session_templates(db)

    result = await db.execute(
        select(SessionTemplateModel).order_by(
            SessionTemplateModel.is_builtin.desc(),
            SessionTemplateModel.name
        )
    )
    templates = result.scalars().all()
    return [SessionTemplateResponse.from_model(t) for t in templates]


@router.post("", response_model=SessionTemplateResponse)
async def create_session_template(
    template: SessionTemplateCreate,
    db: AsyncSession = Depends(get_db_session),
):
    """Create a new user session template."""
    template_model = SessionTemplateModel(
        id=str(uuid.uuid4()),
        name=template.name,
        description=template.description,
        icon=template.icon,
        system_prompt=template.system_prompt,
        default_model=template.default_model,
        temperature=template.temperature,
        top_p=template.top_p,
        max_tokens=template.max_tokens,
        mcp_servers=json.dumps(template.mcp_servers) if template.mcp_servers else None,
        is_builtin=False,
    )
    db.add(template_model)
    await db.commit()
    await db.refresh(template_model)
    return SessionTemplateResponse.from_model(template_model)


@router.get("/{template_id}", response_model=SessionTemplateResponse)
async def get_session_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Get a specific session template by ID."""
    result = await db.execute(
        select(SessionTemplateModel).where(SessionTemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Session template not found")
    return SessionTemplateResponse.from_model(template)


@router.put("/{template_id}", response_model=SessionTemplateResponse)
async def update_session_template(
    template_id: str,
    template_update: SessionTemplateUpdate,
    db: AsyncSession = Depends(get_db_session),
):
    """Update a session template. Built-in templates cannot be modified."""
    result = await db.execute(
        select(SessionTemplateModel).where(SessionTemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Session template not found")

    if template.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot modify built-in templates")

    # Update only provided fields
    update_data = template_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "mcp_servers" and value is not None:
            value = json.dumps(value)
        setattr(template, field, value)

    template.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(template)
    return SessionTemplateResponse.from_model(template)


@router.delete("/{template_id}")
async def delete_session_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Delete a session template. Built-in templates cannot be deleted."""
    result = await db.execute(
        select(SessionTemplateModel).where(SessionTemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Session template not found")

    if template.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot delete built-in templates")

    await db.delete(template)
    await db.commit()
    return {"status": "deleted", "template_id": template_id}
