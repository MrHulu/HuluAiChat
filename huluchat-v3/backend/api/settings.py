"""
Settings API - Configuration management
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import json
from pathlib import Path

from core.config import settings

router = APIRouter()

# Settings file path
SETTINGS_FILE = Path(__file__).parent.parent / "user_settings.json"


class SettingsResponse(BaseModel):
    """Settings response model"""
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: str = "gpt-4o-mini"
    has_api_key: bool = False


class SettingsUpdate(BaseModel):
    """Settings update model"""
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: Optional[str] = None


class ModelInfo(BaseModel):
    """Model information"""
    id: str
    name: str
    description: str


# Available models
AVAILABLE_MODELS: List[ModelInfo] = [
    ModelInfo(id="gpt-4o", name="GPT-4o", description="Most capable model, best for complex tasks"),
    ModelInfo(id="gpt-4o-mini", name="GPT-4o Mini", description="Fast and affordable, great for daily use"),
    ModelInfo(id="gpt-4-turbo", name="GPT-4 Turbo", description="Previous generation flagship"),
    ModelInfo(id="gpt-3.5-turbo", name="GPT-3.5 Turbo", description="Fast and economical"),
    ModelInfo(id="claude-3-5-sonnet-20241022", name="Claude 3.5 Sonnet", description="Anthropic's latest"),
    ModelInfo(id="claude-3-opus-20240229", name="Claude 3 Opus", description="Most powerful Claude"),
]


def load_user_settings() -> dict:
    """Load user settings from file"""
    if SETTINGS_FILE.exists():
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def save_user_settings(data: dict) -> None:
    """Save user settings to file"""
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


@router.get("/", response_model=SettingsResponse)
async def get_settings():
    """Get current settings"""
    user_settings = load_user_settings()

    # Merge with defaults from env
    api_key = user_settings.get("openai_api_key") or settings.openai_api_key
    base_url = user_settings.get("openai_base_url") or settings.openai_base_url
    model = user_settings.get("openai_model") or settings.openai_model

    return SettingsResponse(
        openai_api_key=api_key[:8] + "..." if api_key and len(api_key) > 8 else None,
        openai_base_url=base_url,
        openai_model=model,
        has_api_key=bool(api_key),
    )


@router.post("/", response_model=SettingsResponse)
async def update_settings(update: SettingsUpdate):
    """Update settings"""
    user_settings = load_user_settings()

    # Update only provided fields
    if update.openai_api_key is not None:
        user_settings["openai_api_key"] = update.openai_api_key
    if update.openai_base_url is not None:
        user_settings["openai_base_url"] = update.openai_base_url
    if update.openai_model is not None:
        user_settings["openai_model"] = update.openai_model

    save_user_settings(user_settings)

    # Update runtime settings
    if update.openai_api_key:
        settings.openai_api_key = update.openai_api_key
    if update.openai_base_url:
        settings.openai_base_url = update.openai_base_url
    if update.openai_model:
        settings.openai_model = update.openai_model

    api_key = user_settings.get("openai_api_key") or settings.openai_api_key
    return SettingsResponse(
        openai_api_key=api_key[:8] + "..." if api_key and len(api_key) > 8 else None,
        openai_base_url=user_settings.get("openai_base_url") or settings.openai_base_url,
        openai_model=user_settings.get("openai_model") or settings.openai_model,
        has_api_key=bool(api_key),
    )


@router.get("/models", response_model=List[ModelInfo])
async def get_models():
    """Get available models"""
    return AVAILABLE_MODELS


@router.post("/test")
async def test_connection():
    """Test API connection with current settings"""
    user_settings = load_user_settings()
    api_key = user_settings.get("openai_api_key") or settings.openai_api_key
    base_url = user_settings.get("openai_base_url") or settings.openai_base_url

    if not api_key:
        raise HTTPException(status_code=400, detail="API key not configured")

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(
            api_key=api_key,
            base_url=base_url if base_url else None,
        )

        # Simple test - list models (or make a minimal request)
        await client.models.list()

        return {"status": "success", "message": "Connection successful"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")
