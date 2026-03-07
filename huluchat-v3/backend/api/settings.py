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
    # Model parameters
    temperature: float = 0.7
    top_p: float = 1.0
    max_tokens: int = 4096


class SettingsUpdate(BaseModel):
    """Settings update model"""
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: Optional[str] = None
    # Model parameters
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None


class ModelInfo(BaseModel):
    """Model information"""
    id: str
    name: str
    description: str
    provider: str = "openai"  # openai, deepseek, ollama


# Available models - DeepSeek as default (first in list)
AVAILABLE_MODELS: List[ModelInfo] = [
    # DeepSeek Models (Recommended/Default)
    ModelInfo(
        id="deepseek-chat",
        name="DeepSeek V3",
        description="Recommended: Best value, high quality",
        provider="deepseek"
    ),
    ModelInfo(
        id="deepseek-reasoner",
        name="DeepSeek R1",
        description="Advanced reasoning model",
        provider="deepseek"
    ),
    # OpenAI Models
    ModelInfo(
        id="gpt-4o",
        name="GPT-4o",
        description="Most capable model, best for complex tasks",
        provider="openai"
    ),
    ModelInfo(
        id="gpt-4o-mini",
        name="GPT-4o Mini",
        description="Fast and affordable, great for daily use",
        provider="openai"
    ),
    ModelInfo(
        id="gpt-4-turbo",
        name="GPT-4 Turbo",
        description="Previous generation flagship",
        provider="openai"
    ),
    ModelInfo(
        id="gpt-3.5-turbo",
        name="GPT-3.5 Turbo",
        description="Fast and economical",
        provider="openai"
    ),
    # Claude Models (via OpenAI-compatible API)
    ModelInfo(
        id="claude-3-5-sonnet-20241022",
        name="Claude 3.5 Sonnet",
        description="Anthropic's latest",
        provider="openai"
    ),
    ModelInfo(
        id="claude-3-opus-20240229",
        name="Claude 3 Opus",
        description="Most powerful Claude",
        provider="openai"
    ),
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
    temperature = user_settings.get("temperature", settings.temperature)
    top_p = user_settings.get("top_p", settings.top_p)
    max_tokens = user_settings.get("max_tokens", settings.max_tokens)

    return SettingsResponse(
        openai_api_key=api_key[:8] + "..." if api_key and len(api_key) > 8 else None,
        openai_base_url=base_url,
        openai_model=model,
        has_api_key=bool(api_key),
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
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
    # Model parameters
    if update.temperature is not None:
        user_settings["temperature"] = update.temperature
    if update.top_p is not None:
        user_settings["top_p"] = update.top_p
    if update.max_tokens is not None:
        user_settings["max_tokens"] = update.max_tokens

    save_user_settings(user_settings)

    # Update runtime settings
    if update.openai_api_key:
        settings.openai_api_key = update.openai_api_key
    if update.openai_base_url:
        settings.openai_base_url = update.openai_base_url
    if update.openai_model:
        settings.openai_model = update.openai_model
    if update.temperature is not None:
        settings.temperature = update.temperature
    if update.top_p is not None:
        settings.top_p = update.top_p
    if update.max_tokens is not None:
        settings.max_tokens = update.max_tokens

    api_key = user_settings.get("openai_api_key") or settings.openai_api_key
    return SettingsResponse(
        openai_api_key=api_key[:8] + "..." if api_key and len(api_key) > 8 else None,
        openai_base_url=user_settings.get("openai_base_url") or settings.openai_base_url,
        openai_model=user_settings.get("openai_model") or settings.openai_model,
        has_api_key=bool(api_key),
        temperature=user_settings.get("temperature", settings.temperature),
        top_p=user_settings.get("top_p", settings.top_p),
        max_tokens=user_settings.get("max_tokens", settings.max_tokens),
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


# Ollama endpoints


class OllamaStatusResponse(BaseModel):
    """Ollama status response"""
    available: bool
    base_url: str


class OllamaModelInfo(BaseModel):
    """Ollama model information"""
    name: str
    size: int
    modified_at: Optional[str] = None


class OllamaModelsResponse(BaseModel):
    """Ollama models list response"""
    models: List[OllamaModelInfo]


@router.get("/ollama/status", response_model=OllamaStatusResponse)
async def get_ollama_status():
    """Check if Ollama service is available."""
    from services.ollama_service import ollama_service

    available = await ollama_service.is_available()
    return OllamaStatusResponse(
        available=available,
        base_url=settings.ollama_base_url,
    )


@router.get("/ollama/models", response_model=OllamaModelsResponse)
async def get_ollama_models():
    """Get list of installed Ollama models."""
    from services.ollama_service import ollama_service

    if not settings.ollama_enabled:
        return OllamaModelsResponse(models=[])

    models = await ollama_service.list_models()
    return OllamaModelsResponse(
        models=[
            OllamaModelInfo(
                name=m.get("name", ""),
                size=m.get("size", 0),
                modified_at=m.get("modified_at"),
            )
            for m in models
        ]
    )
