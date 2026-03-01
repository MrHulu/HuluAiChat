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
                    # 若会话标题仍为默认「新对话」，用首条用户消息摘要更新一次
                    session_after = self._session_repo.get_by_id(session_id)
                    if session_after and session_after.title == "新对话":
                        msgs = self._message_repo.list_by_session(session_id)
                        first_user = next((m for m in msgs if m.role == "user"), None)
                        if first_user and first_user.content:
                            summary = (first_user.content.strip() or first_user.content.split("\n")[0].strip())[:20]
                            if summary:
                                self._session_repo.update_title(session_id, summary)
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

    def delete_session(self, session_id: str) -> None:
        """删除会话及其消息；若为当前会话则清空当前会话。"""
        if self._current_session_id == session_id:
            self._current_session_id = None
        self._message_repo.delete_by_session(session_id)
        self._session_repo.delete(session_id)

    def load_sessions(self) -> list[Session]:
        """加载会话列表（按时间排序）。"""
        return self._session_repo.list_sessions()

    def get_session(self, session_id: str) -> Session | None:
        """获取指定会话。"""
        return self._session_repo.get_by_id(session_id)

    def load_messages(self, session_id: str) -> list[Message]:
        """加载指定会话的消息列表。"""
        return self._message_repo.list_by_session(session_id)

    def search_messages(self, session_id: str, query: str) -> list[Message]:
        """在指定会话中搜索消息。"""
        return self._message_repo.search(session_id, query)

    def search_all_messages(self, query: str, limit: int = 100) -> list[Message]:
        """在所有会话中搜索消息。"""
        return self._message_repo.search_all(query, limit)

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

    def toggle_session_pinned(self, session_id: str) -> bool:
        """切换会话置顶状态，返回新的置顶状态。"""
        session = self._session_repo.get_by_id(session_id)
        if session:
            new_pinned = not session.is_pinned
            self._session_repo.set_pinned(session_id, new_pinned)
            return new_pinned
        return False

    # ========== 提示词模板管理 ==========

    def list_prompt_templates(self) -> list:
        """获取所有提示词模板。"""
        from src.config.models import PromptTemplate
        return self._config.prompt_templates

    def add_prompt_template(self, title: str, content: str, category: str = "通用") -> None:
        """添加新的提示词模板。"""
        from src.config.models import PromptTemplate
        import uuid
        template = PromptTemplate(
            id=str(uuid.uuid4()),
            title=title,
            content=content,
            category=category,
        )
        self._config.prompt_templates.append(template)
        self._config_store.save(self._config)

    def update_prompt_template(self, template_id: str, title: str, content: str, category: str) -> None:
        """更新提示词模板。"""
        for t in self._config.prompt_templates:
            if t.id == template_id:
                t.title = title
                t.content = content
                t.category = category
                break
        self._config_store.save(self._config)

    def delete_prompt_template(self, template_id: str) -> None:
        """删除提示词模板。"""
        self._config.prompt_templates = [t for t in self._config.prompt_templates if t.id != template_id]
        self._config_store.save(self._config)

    def get_prompt_template(self, template_id: str):
        """获取指定模板。"""
        for t in self._config.prompt_templates:
            if t.id == template_id:
                return t
        return None

    def restore_default_templates(self) -> None:
        """恢复默认提示词模板。"""
        from src.config.models import default_prompt_templates
        self._config.prompt_templates = default_prompt_templates()
        self._config_store.save(self._config)

    def regenerate_response(
        self,
        session_id: str,
        chunk_queue: queue.Queue,
        *,
        on_done: Callable[[], None] | None = None,
        on_error: Callable[[str], None] | None = None,
    ) -> None:
        """重新生成最后一条助手回复。删除最后的助手消息，用相同的对话历史重新请求。"""
        messages = self._message_repo.list_by_session(session_id)
        if not messages:
            logger.warning("regenerate_response: 会话无消息 session_id=%s", session_id)
            if on_error:
                on_error("没有可重新生成的内容")
            return

        # 找到最后一条助手消息并删除
        last_assistant_idx = -1
        for i, m in enumerate(messages):
            if m.role == "assistant":
                last_assistant_idx = i

        if last_assistant_idx == -1:
            logger.warning("regenerate_response: 没有助手消息 session_id=%s", session_id)
            if on_error:
                on_error("没有助手回复可重新生成")
            return

        last_assistant = messages[last_assistant_idx]
        self._message_repo.delete(last_assistant.id)

        # 用删除助手消息后的历史重新请求
        history = self._message_repo.list_by_session(session_id)
        api_messages = [{"role": m.role, "content": m.content} for m in history]

        provider = self.get_current_provider()
        if not provider:
            logger.warning("regenerate_response: 未选择模型")
            if on_error:
                on_error("请先配置并选择模型")
            return

        logger.info("regenerate_response: session_id=%s, provider=%s", session_id, provider.name)

        def run() -> None:
            acc: list[str] = []

            def on_chunk(c: StreamChunk) -> None:
                if is_error(c):
                    logger.warning("regenerate_response: 流式错误 %s", c.message)
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
                    logger.info("regenerate_response: 流式完成, 助手消息长度=%d", len("".join(acc)))
                    if on_done:
                        on_done()

            self._chat_client.stream_chat(provider, api_messages, on_chunk)

        t = threading.Thread(target=run, daemon=True)
        t.start()

    def pin_message(self, message_id: str) -> None:
        """置顶消息。"""
        self._message_repo.set_pinned(message_id, True)

    def unpin_message(self, message_id: str) -> None:
        """取消置顶消息。"""
        self._message_repo.set_pinned(message_id, False)

    def list_pinned_messages(self, session_id: str) -> list[Message]:
        """获取会话中所有置顶的消息。"""
        return self._message_repo.list_pinned(session_id)

    def toggle_message_pin(self, message_id: str) -> bool:
        """切换消息的置顶状态，返回新状态。"""
        messages = self._message_repo.list_by_session(self._current_session_id or "")
        for m in messages:
            if m.id == message_id:
                new_state = not m.is_pinned
                self._message_repo.set_pinned(message_id, new_state)
                return new_state
        return False

    def update_message_content(self, message_id: str, content: str) -> bool:
        """更新消息内容。返回是否成功。"""
        try:
            self._message_repo.update_content(message_id, content)
            # 更新会话时间
            if self._current_session_id:
                self._session_repo.update_updated_at(self._current_session_id, _now())
            return True
        except Exception as e:
            logger.error("update_message_content: error=%s", e)
            return False

    def delete_message(self, message_id: str) -> bool:
        """删除指定消息。返回是否成功。"""
        try:
            self._message_repo.delete(message_id)
            # 更新会话时间
            if self._current_session_id:
                self._session_repo.update_updated_at(self._current_session_id, _now())
            return True
        except Exception as e:
            logger.error("delete_message: error=%s", e)
            return False

    def get_message_count(self, session_id: str) -> int:
        """获取指定会话的消息数量。"""
        return self._message_repo.count_by_session(session_id)

    # ========== 最近搜索管理 ==========

    def get_recent_searches(self) -> list[str]:
        """获取最近搜索列表（最多10条）。"""
        return self._config.recent_searches[:10]  # 最多返回10条

    def add_recent_search(self, query: str) -> None:
        """添加搜索到最近搜索列表（去重，最多10条，最新的在前）。"""
        query = query.strip()
        if not query:
            return
        # 去重：先删除已存在的
        searches = [s for s in self._config.recent_searches if s != query]
        # 插入到开头
        searches.insert(0, query)
        # 最多保留10条
        self._config.recent_searches = searches[:10]
        self._config_store.save(self._config)

    def clear_recent_searches(self) -> None:
        """清空最近搜索列表。"""
        self._config.recent_searches = []
        self._config_store.save(self._config)
