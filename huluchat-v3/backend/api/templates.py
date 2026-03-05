"""Prompt Templates API"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from enum import Enum

from core.database import get_session as get_db_session, Base
from sqlalchemy.orm import Mapped, mapped_column

router = APIRouter()


class TemplateCategory(str, Enum):
    """Template categories"""
    writing = "writing"
    coding = "coding"
    analysis = "analysis"
    translation = "translation"
    custom = "custom"


class PromptTemplateModel(Base):
    """Database model for prompt templates"""
    __tablename__ = "prompt_templates"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column()
    content: Mapped[str] = mapped_column()
    category: Mapped[str] = mapped_column(default=TemplateCategory.custom.value)
    is_builtin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class TemplateCreate(BaseModel):
    """Schema for creating a template"""
    name: str
    content: str
    category: Optional[TemplateCategory] = TemplateCategory.custom


class TemplateUpdate(BaseModel):
    """Schema for updating a template"""
    name: Optional[str] = None
    content: Optional[str] = None
    category: Optional[TemplateCategory] = None


class TemplateResponse(BaseModel):
    """Schema for template response"""
    id: str
    name: str
    content: str
    category: str
    is_builtin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Built-in templates
BUILTIN_TEMPLATES = [
    {
        "id": "builtin-writing-email",
        "name": "Email Writer",
        "content": "Write a professional email about the following topic:\n\n{topic}\n\nThe email should be:\n- Professional and polite\n- Clear and concise\n- Include a proper greeting and closing",
        "category": "writing",
        "is_builtin": True,
    },
    {
        "id": "builtin-writing-blog",
        "name": "Blog Post",
        "content": "Write a blog post about:\n\n{topic}\n\nRequirements:\n- Engaging introduction\n- Well-structured body with subheadings\n- Clear conclusion\n- Around 500-800 words",
        "category": "writing",
        "is_builtin": True,
    },
    {
        "id": "builtin-coding-explain",
        "name": "Explain Code",
        "content": "Please explain the following code in detail:\n\n```\n{code}\n```\n\nInclude:\n1. What the code does\n2. How it works step by step\n3. Any potential improvements",
        "category": "coding",
        "is_builtin": True,
    },
    {
        "id": "builtin-coding-review",
        "name": "Code Review",
        "content": "Please review the following code:\n\n```\n{code}\n```\n\nCheck for:\n- Bugs or errors\n- Performance issues\n- Best practices\n- Security concerns\n- Code style and readability",
        "category": "coding",
        "is_builtin": True,
    },
    {
        "id": "builtin-coding-refactor",
        "name": "Refactor Code",
        "content": "Refactor the following code to improve its quality:\n\n```\n{code}\n```\n\nFocus on:\n- Readability\n- Performance\n- Maintainability\n- Following best practices",
        "category": "coding",
        "is_builtin": True,
    },
    {
        "id": "builtin-analysis-summarize",
        "name": "Summarize",
        "content": "Please summarize the following text:\n\n{text}\n\nProvide:\n1. A brief summary (2-3 sentences)\n2. Key points (bullet list)\n3. Main conclusion",
        "category": "analysis",
        "is_builtin": True,
    },
    {
        "id": "builtin-analysis-pros-cons",
        "name": "Pros and Cons",
        "content": "Analyze the pros and cons of:\n\n{topic}\n\nPresent the analysis as:\n\n## Pros\n- [List positive aspects]\n\n## Cons\n- [List negative aspects]\n\n## Conclusion\n[Brief conclusion]",
        "category": "analysis",
        "is_builtin": True,
    },
    {
        "id": "builtin-translation-translate",
        "name": "Translate",
        "content": "Translate the following text:\n\n{text}\n\nTarget language: {target_language}\n\nProvide:\n1. The translation\n2. Notes on any idioms or cultural references",
        "category": "translation",
        "is_builtin": True,
    },
]


async def ensure_builtin_templates(db: AsyncSession):
    """Ensure built-in templates exist in the database"""
    for template_data in BUILTIN_TEMPLATES:
        result = await db.execute(
            select(PromptTemplateModel).where(PromptTemplateModel.id == template_data["id"])
        )
        if not result.scalar_one_or_none():
            template = PromptTemplateModel(**template_data)
            db.add(template)
    await db.commit()


@router.get("/", response_model=List[TemplateResponse])
async def list_templates(
    category: Optional[TemplateCategory] = None,
    db: AsyncSession = Depends(get_db_session)
):
    """List all templates, optionally filtered by category"""
    # Ensure built-in templates exist
    await ensure_builtin_templates(db)

    query = select(PromptTemplateModel).order_by(PromptTemplateModel.created_at.asc())
    if category:
        query = query.where(PromptTemplateModel.category == category.value)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new custom template"""
    import uuid
    new_template = PromptTemplateModel(
        id=str(uuid.uuid4()),
        name=template.name,
        content=template.content,
        category=template.category.value if template.category else TemplateCategory.custom.value,
        is_builtin=False,
    )
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)
    return new_template


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a template by ID"""
    result = await db.execute(
        select(PromptTemplateModel).where(PromptTemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    update: TemplateUpdate,
    db: AsyncSession = Depends(get_db_session)
):
    """Update a template (only custom templates can be modified)"""
    result = await db.execute(
        select(PromptTemplateModel).where(PromptTemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot modify built-in templates")

    if update.name is not None:
        template.name = update.name
    if update.content is not None:
        template.content = update.content
    if update.category is not None:
        template.category = update.category.value
    template.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a template (only custom templates can be deleted)"""
    result = await db.execute(
        select(PromptTemplateModel).where(PromptTemplateModel.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.is_builtin:
        raise HTTPException(status_code=400, detail="Cannot delete built-in templates")

    await db.delete(template)
    await db.commit()
    return {"status": "deleted"}
