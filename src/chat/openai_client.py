"""OpenAI 兼容流式聊天实现。"""
import logging
from typing import Callable

from openai import OpenAI
from openai import APIConnectionError, APIStatusError

from src.config.models import Provider
from src.chat.client import ChatClient, ChatError, DoneChunk, TextChunk, StreamChunk

logger = logging.getLogger(__name__)


def _safe_log(message: str, *args: object) -> None:
    """记录日志时避免输出敏感信息。"""
    logger.warning(message, *args)


class OpenHuluChatClient(ChatClient):
    """基于 openai 库的客户端：base_url、api_key、model 来自 Provider。"""

    def stream_chat(
        self,
        provider: Provider,
        messages: list[dict[str, str]],
        on_chunk: Callable[[StreamChunk], None],
    ) -> None:
        client = OpenAI(
            base_url=provider.base_url.rstrip("/") + "/" if provider.base_url else None,
            api_key=provider.api_key or "dummy",
        )
        model = provider.model_id or "gpt-3.5-turbo"
        try:
            logger.info("stream_chat: model=%s, messages_count=%d", model, len(messages))
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    on_chunk(TextChunk(content=chunk.choices[0].delta.content))
            on_chunk(DoneChunk())
        except APIConnectionError as e:
            _safe_log("API connection error: %s", str(e))
            on_chunk(ChatError(message=str(e) or "连接失败", code="connection", transient=True))
        except APIStatusError as e:
            _safe_log("API status error: %s %s", e.status_code, e.message)
            on_chunk(
                ChatError(
                    message=e.message or "请求失败",
                    code="api_error",
                    transient=e.status_code and 500 <= e.status_code < 600,
                )
            )
        except Exception as e:
            _safe_log("Chat request error: %s", type(e).__name__)
            on_chunk(ChatError(message=str(e), transient=False))