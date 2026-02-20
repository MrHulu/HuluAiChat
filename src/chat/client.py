"""Chat 层抽象：流式接口与错误类型。"""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Callable, Union

from src.config.models import Provider


@dataclass
class ChatError:
    """API/网络错误的结构化报告；不包含 API Key。"""
    message: str
    code: str | None = None  # 如 "rate_limit", "invalid_request"
    transient: bool = False  # 是否可重试


@dataclass
class TextChunk:
    """流式文本片段。"""
    content: str

    def is_done(self) -> bool:
        return False

    def text(self) -> str:
        return self.content


@dataclass
class DoneChunk:
    """流结束标记。"""
    def is_done(self) -> bool:
        return True

    def text(self) -> str:
        return ""


StreamChunk = Union[TextChunk, DoneChunk, ChatError]


def is_error(chunk: StreamChunk) -> bool:
    return isinstance(chunk, ChatError)


class ChatClient(ABC):
    """OpenAI 兼容聊天客户端抽象。"""

    @abstractmethod
    def stream_chat(
        self,
        provider: Provider,
        messages: list[dict[str, str]],
        on_chunk: Callable[[StreamChunk], None],
    ) -> None:
        """
        流式聊天：在调用方线程中执行（通常由用例层在后台线程调用）。
        通过 on_chunk 逐片段回调 TextChunk/DoneChunk；错误时回调 ChatError。
        不将 API Key 写入日志。
        """
        ...
