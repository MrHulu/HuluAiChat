"""应用/用例层：编排发消息、会话、配置与主题，依赖抽象接口。"""
import logging
import queue
import threading
from datetime import datetime, timezone
from typing import Callable

from src.config.models import AppConfig, Provider
from src.config.store import ConfigStore
from src.persistence import Session, Message, SessionRepository, MessageRepository
from src.chat import ChatClient, ChatError, StreamChunk, TextChunk, DoneChunk, is_error

logger = logging.getLogger(__name__)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _gen_id() -> str:
    import uuid
    return str(uuid.uuid4())


class AppService:
    """薄协调层：发消息、会话、配置、主题；不依赖 UI。"""

    def __init__(
        self,
        config_store: ConfigStore,
        session_repo: SessionRepository,
        message_repo: MessageRepository,
        chat_client: ChatClient,
    ) -> None:
        self._config_store = config_store
        self._session_repo = session_repo
        self._message_repo = message_repo
        self._chat_client = chat_client
        self._config = config_store.load()
        self._current_session_id: str | None = None

    def config(self) -> AppConfig:
        return self._config

    def current_session_id(self) -> str | None:
        return self._current_session_id

    def get_current_provider(self) -> Provider | None:
        if not self._config.current_provider_id:
            return self._config.providers[0] if self._config.providers else None
        for p in self._config.providers:
            if p.id == self._config.current_provider_id:
                return p
        return self._config.providers[0] if self._config.providers else None

    def send_message(
        self,
        session_id: str,
        user_content: str,
        chunk_queue: queue.Queue,
        *,
        on_done: Callable[[], None] | None = None,
        on_error: Callable[[str], None] | None = None,
    ) -> None:
        """发送用户消息，在后台线程执行流式请求，将片段放入 chunk_queue；完成后写库并调用 on_done/on_error。"""
        provider = self.get_current_provider()
        if not provider:
            logger.warning("send_message: 未选择模型")
            if on_error:
                on_error("请先配置并选择模型")
            return
        session = self._session_repo.get_by_id(session_id)
        if not session:
            logger.warning("send_message: 会话不存在 session_id=%s", session_id)
            if on_error:
                on_error("会话不存在")
            return
        logger.info("send_message: session_id=%s, provider=%s", session_id, provider.name)

        user_id = _gen_id()
        user_msg = Message(
            id=user_id,
            session_id=session_id,
            role="user",
            content=user_content,
            created_at=_now(),
        )
        self._message_repo.append(user_msg)
        self._session_repo.update_updated_at(session_id, _now())

        history = self._message_repo.list_by_session(session_id)
        messages = [{"role": m.role, "content": m.content} for m in history]

        def run() -> None:
            acc: list[str] = []

            def on_chunk(c: StreamChunk) -> None:
                if is_error(c):
                    logger.warning("send_message: 流式错误 %s", c.message)
                    chunk_queue.put(c)
                    if on_error:
                        on_error(c.message)
                    return
                if isinstance(c, TextChunk):
                    acc.append(c.content)
                    chunk_queue.put(c)
                elif isinstance(c, DoneChunk):
                    chunk_queue.put(c)
                    assistant_id = _gen_id()
                    assistant_msg = Message(
                        id=assistant_id,
                        session_id=session_id,
                        role="assistant",
                        content="".join(acc),
                        created_at=_now(),
                    )
                    self._message_repo.append(assistant_msg)
                    self._session_repo.update_updated_at(session_id, _now())
                    logger.info("send_message: 流式完成, 助手消息长度=%d", len("".join(acc)))
                    if on_done:
                        on_done()

            self._chat_client.stream_chat(provider, messages, on_chunk)

        t = threading.Thread(target=run, daemon=True)
        t.start()

    def new_session(self) -> Session:
        """新建会话，设为当前会话；返回新会话。"""
        sid = _gen_id()
        session = self._session_repo.create(sid, "新对话")
        self._current_session_id = sid
        return session

    def switch_session(self, session_id: str) -> None:
        """切换当前会话。"""
        self._current_session_id = session_id

    def load_sessions(self) -> list[Session]:
        """加载会话列表（按时间排序）。"""
        return self._session_repo.list_sessions()

    def load_messages(self, session_id: str) -> list[Message]:
        """加载指定会话的消息列表。"""
        return self._message_repo.list_by_session(session_id)

    def set_current_provider(self, provider_id: str) -> None:
        """切换当前模型并写回配置。"""
        self._config.current_provider_id = provider_id
        self._config_store.save(self._config)

    def save_config(self, config: AppConfig | None = None) -> None:
        """保存配置；不传则保存当前内存中的配置。"""
        if config is not None:
            self._config = config
        self._config_store.save(self._config)

    def set_theme(self, theme: str) -> None:
        """切换主题并写回配置。"""
        self._config.theme = theme
        self._config_store.save(self._config)

    def set_sidebar_expanded(self, expanded: bool) -> None:
        """切换侧边栏展开/收起并写回配置。"""
        self._config.sidebar_expanded = expanded
        self._config_store.save(self._config)

    def update_session_title(self, session_id: str, title: str) -> None:
        """更新会话标题。"""
        self._session_repo.update_title(session_id, title)
