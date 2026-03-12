"""Custom Commands API for TASK-198.

Custom commands allow users to create shortcuts that execute multiple actions.
"""
import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.database import get_session as get_db_session
from models.custom_commands import (
    CustomCommandModel,
    CustomCommandCreate,
    CustomCommandUpdate,
    CustomCommandResponse,
)

router = APIRouter(prefix="/custom-commands", tags=["custom-commands"])
logger = logging.getLogger(__name__)


# Built-in commands
BUILTIN_COMMANDS = [
    {
        "id": "builtin-clear-context",
        "name": "clear-context",
        "description": "清除当前会话上下文，开始新对话",
        "command_type": "prompt",
        "prompt_content": "让我们开始一个新的话题。请忘记之前我们讨论的所有内容，我们将讨论一个新的问题。",
        "shortcut": None,
        "icon": "🔄",
        "is_builtin": True,
    },
    {
        "id": "builtin-explain-code",
        "name": "explain-code",
        "description": "详细解释选中的代码",
        "command_type": "prompt",
        "prompt_content": "请详细解释以下代码的功能、逻辑和实现细节：\n\n```\n{selected_text}\n```\n\n请包括：\n1. 代码的整体功能\n2. 关键逻辑步骤\n3. 使用的技术和设计模式\n4. 可能的改进建议",
        "shortcut": None,
        "icon": "📖",
        "is_builtin": True,
    },
    {
        "id": "builtin-refactor-code",
        "name": "refactor-code",
        "description": "重构代码以提高质量",
        "command_type": "prompt",
        "prompt_content": "请重构以下代码，改进其可读性、性能和可维护性：\n\n```\n{selected_text}\n```\n\n请包括：\n1. 重构后的代码\n2. 重构的原因和好处\n3. 任何权衡或注意事项",
        "shortcut": None,
        "icon": "🔧",
        "is_builtin": True,
    },
    {
        "id": "builtin-translate-en",
        "name": "translate-en",
        "description": "翻译选中文本为英文",
        "command_type": "prompt",
        "prompt_content": "请将以下内容翻译成英文，保持原文的语气和风格：\n\n{selected_text}",
        "shortcut": None,
        "icon": "🌐",
        "is_builtin": True,
    },
    {
        "id": "builtin-translate-zh",
        "name": "translate-zh",
        "description": "翻译选中文本为中文",
        "command_type": "prompt",
        "prompt_content": "请将以下内容翻译成中文，保持原文的语气和风格：\n\n{selected_text}",
        "shortcut": None,
        "icon": "🌐",
        "is_builtin": True,
    },
    {
        "id": "builtin-summarize",
        "name": "summarize",
        "description": "总结当前对话内容",
        "command_type": "prompt",
        "prompt_content": "请总结我们到目前为止的对话内容，列出：\n1. 主要讨论的话题\n2. 关键结论和决定\n3. 待解决的问题（如果有）",
        "shortcut": None,
        "icon": "📝",
        "is_builtin": True,
    },
]


async def ensure_builtin_commands(db: AsyncSession):
    """Ensure built-in commands exist in the database."""
    for cmd_data in BUILTIN_COMMANDS:
        result = await db.execute(
            select(CustomCommandModel).where(CustomCommandModel.id == cmd_data["id"])
        )
        existing = result.scalar_one_or_none()
        if not existing:
            cmd = CustomCommandModel(
                id=cmd_data["id"],
                name=cmd_data["name"],
                description=cmd_data["description"],
                command_type=cmd_data["command_type"],
                prompt_content=cmd_data["prompt_content"],
                shortcut=cmd_data["shortcut"],
                icon=cmd_data["icon"],
                is_builtin=True,
            )
            db.add(cmd)
    await db.commit()


@router.get("", response_model=List[CustomCommandResponse])
async def list_custom_commands(
    db: AsyncSession = Depends(get_db_session),
):
    """List all custom commands (built-in + user-created)."""
    # Ensure built-in commands exist
    await ensure_builtin_commands(db)

    result = await db.execute(
        select(CustomCommandModel).order_by(
            CustomCommandModel.is_builtin.desc(),
            CustomCommandModel.name
        )
    )
    commands = result.scalars().all()
    return [CustomCommandResponse.from_model(c) for c in commands]


@router.post("", response_model=CustomCommandResponse)
async def create_custom_command(
    command: CustomCommandCreate,
    db: AsyncSession = Depends(get_db_session),
):
    """Create a new custom command."""
    command_model = CustomCommandModel(
        id=str(uuid.uuid4()),
        name=command.name,
        description=command.description,
        command_type=command.command_type,
        prompt_content=command.prompt_content,
        template_id=command.template_id,
        actions=json.dumps(command.actions) if command.actions else None,
        shortcut=command.shortcut,
        icon=command.icon,
        is_builtin=False,
    )
    db.add(command_model)
    await db.commit()
    await db.refresh(command_model)
    return CustomCommandResponse.from_model(command_model)


@router.get("/{command_id}", response_model=CustomCommandResponse)
async def get_custom_command(
    command_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Get a specific custom command by ID."""
    result = await db.execute(
        select(CustomCommandModel).where(CustomCommandModel.id == command_id)
    )
    command = result.scalar_one_or_none()
    if not command:
        raise HTTPException(status_code=404, detail="Command not found")
    return CustomCommandResponse.from_model(command)


@router.put("/{command_id}", response_model=CustomCommandResponse)
async def update_custom_command(
    command_id: str,
    command_update: CustomCommandUpdate,
    db: AsyncSession = Depends(get_db_session),
):
    """Update a custom command. Built-in commands cannot be modified."""
    result = await db.execute(
        select(CustomCommandModel).where(CustomCommandModel.id == command_id)
    )
    command = result.scalar_one_or_none()

    if not command:
        raise HTTPException(status_code=404, detail="Command not found")

    if command.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot modify built-in commands")

    # Update only provided fields
    update_data = command_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "actions" and value is not None:
            value = json.dumps(value)
        setattr(command, field, value)

    command.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(command)
    return CustomCommandResponse.from_model(command)


@router.delete("/{command_id}")
async def delete_custom_command(
    command_id: str,
    db: AsyncSession = Depends(get_db_session),
):
    """Delete a custom command. Built-in commands cannot be deleted."""
    result = await db.execute(
        select(CustomCommandModel).where(CustomCommandModel.id == command_id)
    )
    command = result.scalar_one_or_none()

    if not command:
        raise HTTPException(status_code=404, detail="Command not found")

    if command.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot delete built-in commands")

    await db.delete(command)
    await db.commit()
    return {"status": "deleted", "command_id": command_id}
