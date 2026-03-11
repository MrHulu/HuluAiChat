"""Ollama streaming service for HuluChat."""
import logging
from typing import AsyncIterator, Optional
from dataclasses import dataclass
import json

import httpx

from core.config import settings
from services.openai_service import StreamChunk

logger = logging.getLogger(__name__)


class OllamaService:
    """Async Ollama service with streaming support."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._base_url = settings.ollama_base_url

    @property
    def client(self) -> httpx.AsyncClient:
        """Lazy initialization of HTTP client with configurable timeout."""
        if self._client is None:
            timeout = httpx.Timeout(
                connect=settings.http_connect_timeout,
                read=settings.ollama_timeout,
                write=settings.ollama_timeout,
                pool=settings.http_connect_timeout,
            )
            self._client = httpx.AsyncClient(
                base_url=self._base_url,
                timeout=timeout,
            )
        return self._client

    async def is_available(self) -> bool:
        """Check if Ollama service is running and accessible."""
        try:
            response = await self.client.get("/api/tags", timeout=5.0)
            return response.status_code == 200
        except Exception as e:
            logger.debug(f"Ollama availability check failed: {e}")
            return False

    async def list_models(self) -> list[dict]:
        """Get list of installed Ollama models.

        Returns:
            List of model dicts with keys: name, size, modified_at
        """
        try:
            response = await self.client.get("/api/tags", timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                return data.get("models", [])
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
        return []

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        model: str = "llama2",
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from Ollama.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name to use (without ollama: prefix)
            temperature: Sampling temperature (0-2), defaults to settings.temperature
            top_p: Nucleus sampling (0-1), defaults to settings.top_p

        Yields:
            StreamChunk objects containing content or error
        """
        temperature = temperature if temperature is not None else settings.temperature
        top_p = top_p if top_p is not None else settings.top_p

        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
            "options": {
                "temperature": temperature,
                "top_p": top_p,
            },
        }

        try:
            logger.info(f"Ollama stream_chat: model={model}, messages_count={len(messages)}, temp={temperature}, top_p={top_p}")

            async with self.client.stream(
                "POST",
                "/api/chat",
                json=payload,
                timeout=httpx.Timeout(settings.ollama_timeout, connect=10.0),
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(f"Ollama returned status {response.status_code}: {error_text}")
                    yield StreamChunk(content="", error=f"Ollama error: {response.status_code}")
                    return

                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            chunk = json.loads(line)
                            # Ollama streaming format
                            if "message" in chunk:
                                content = chunk["message"].get("content", "")
                                if content:
                                    yield StreamChunk(content=content)

                            if chunk.get("done"):
                                yield StreamChunk(content="", is_done=True)

                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse Ollama response line: {line[:100]}, error: {e}")

        except httpx.ConnectError as e:
            logger.error(f"Ollama connection error: {e}")
            yield StreamChunk(content="", error="无法连接到 Ollama 服务，请确认 Ollama 正在运行")

        except httpx.TimeoutException:
            logger.error("Ollama request timeout")
            yield StreamChunk(content="", error="Ollama 响应超时")

        except Exception as e:
            logger.error(f"Ollama chat request error: {type(e).__name__}: {e}")
            yield StreamChunk(content="", error=str(e))


# Global service instance
ollama_service = OllamaService()
