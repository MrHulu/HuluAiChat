"""Application configuration"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Database
    database_url: str = "sqlite+aiosqlite:///./huluchat.db"

    # OpenAI
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    openai_model: str = "gpt-4o-mini"

    # Model parameters (can be overridden per-request)
    temperature: float = 0.7
    top_p: float = 1.0
    max_tokens: int = 4096

    # Ollama
    ollama_enabled: bool = True
    ollama_base_url: str = "http://localhost:11434"
    ollama_timeout: int = 120

    # Server
    host: str = "127.0.0.1"
    port: int = 8765

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
