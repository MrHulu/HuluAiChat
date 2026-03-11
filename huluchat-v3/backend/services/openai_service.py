"""OpenAI streaming service for HuluChat."""
import logging
from typing import AsyncIterator, Optional, Union, List
from dataclasses import dataclass

from openai import AsyncOpenAI
from openai import APIConnectionError, APIStatusError, APITimeoutError
import httpx

from core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class StreamChunk:
    """A chunk of streaming response."""
    content: str
    is_done: bool = False
    error: Optional[str] = None


# Type for multimodal content
MultimodalContent = Union[str, List[dict]]


class OpenAIService:
    """Async OpenAI service with streaming support."""

    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None

    @property
    def client(self) -> AsyncOpenAI:
        """Lazy initialization of OpenAI client with configurable timeout."""
        if self._client is None:
            if not settings.openai_api_key:
                raise ValueError("OpenAI API key not configured")
            # Configure timeout for OpenAI requests
            timeout = httpx.Timeout(
                connect=settings.http_connect_timeout,
                read=settings.openai_timeout,
                write=settings.http_read_timeout,
                pool=settings.http_connect_timeout,
            )
            self._client = AsyncOpenAI(
                api_key=settings.openai_api_key,
                base_url=settings.openai_base_url,
                timeout=timeout,
            )
        return self._client

    async def stream_chat(
        self,
        messages: list[dict],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> AsyncIterator[StreamChunk]:
        """Stream chat completion from OpenAI.

        Args:
            messages: List of message dicts with 'role' and 'content'
                     content can be string (text only) or list (multimodal)
            model: Model to use, defaults to settings.openai_model
            temperature: Sampling temperature (0-2), defaults to settings.temperature
            top_p: Nucleus sampling (0-1), defaults to settings.top_p
            max_tokens: Max tokens in response, defaults to settings.max_tokens

        Yields:
            StreamChunk objects containing content or error
        """
        model = model or settings.openai_model
        temperature = temperature if temperature is not None else settings.temperature
        top_p = top_p if top_p is not None else settings.top_p
        max_tokens = max_tokens if max_tokens is not None else settings.max_tokens

        try:
            logger.info(f"stream_chat: model={model}, messages_count={len(messages)}, temp={temperature}, top_p={top_p}")
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield StreamChunk(content=chunk.choices[0].delta.content)

            yield StreamChunk(content="", is_done=True)

        except APIConnectionError as e:
            logger.error(f"API connection error: {e}")
            yield StreamChunk(content="", error=f"连接失败: {str(e)}")

        except APITimeoutError as e:
            logger.error(f"API timeout error: {e}")
            yield StreamChunk(content="", error=f"请求超时，请稍后重试")

        except APIStatusError as e:
            logger.error(f"API status error: {e.status_code} {e.message}")
            yield StreamChunk(content="", error=f"请求失败: {e.message}")

        except Exception as e:
            logger.error(f"Chat request error: {type(e).__name__}: {e}")
            yield StreamChunk(content="", error=str(e))

    def is_configured(self) -> bool:
        """Check if OpenAI is properly configured."""
        return settings.openai_api_key is not None


# Global service instance
openai_service = OpenAIService()


def get_client_for_provider(provider: str) -> AsyncOpenAI:
    """Get OpenAI-compatible client for different providers.

    Args:
        provider: Provider name ('deepseek', 'openai', 'ollama')

    Returns:
        AsyncOpenAI client configured for the specified provider

    Raises:
        ValueError: If provider is unknown or API key not configured
    """
    # Configure timeout for all providers
    timeout = httpx.Timeout(
        connect=settings.http_connect_timeout,
        read=settings.openai_timeout,
        write=settings.http_read_timeout,
        pool=settings.http_connect_timeout,
    )

    if provider == "deepseek":
        if not settings.deepseek_api_key:
            raise ValueError("DeepSeek API key not configured")
        return AsyncOpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
            timeout=timeout,
        )
    elif provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key not configured")
        return AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            timeout=timeout,
        )
    elif provider == "ollama":
        # Use longer timeout for Ollama (local inference may be slow)
        ollama_timeout = httpx.Timeout(
            connect=settings.http_connect_timeout,
            read=settings.ollama_timeout,
            write=settings.ollama_timeout,
            pool=settings.http_connect_timeout,
        )
        return AsyncOpenAI(
            api_key="ollama",  # Ollama doesn't need a real API key
            base_url=f"{settings.ollama_base_url}/v1",
            timeout=ollama_timeout,
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")
