"""应用/用例层：编排发消息、会话、配置与主题，依赖抽象接口。"""
import logging
import queue
import threading
from datetime import datetime, timezone
from typing import Callable

from src.config.models import AppConfig, Provider
from src.config.store import ConfigStore
from src.persistence import Session, Message, Folder, SessionRepository, MessageRepository, FolderRepository
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
        folder_repo: FolderRepository | None = None,
    ) -> None:
        self._config_store = config_store
        self._session_repo = session_repo
        self._message_repo = message_repo
        self._chat_client = chat_client
        self._folder_repo = folder_repo
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
        quoted_message_id: str | None = None,
        quoted_content: str | None = None,
        on_done: Callable[[], None] | None = None,
        on_error: Callable[[str], None] | None = None,
    ) -> None:
        """发送用户消息，在后台线程执行流式请求，将片段放入 chunk_queue；完成后写库并调用 on_done/on_error。

        Args:
            session_id: 会话 ID
            user_content: 用户消息内容
            chunk_queue: 用于传递流式响应的队列
            quoted_message_id: 引用的消息 ID（可选）
            quoted_content: 引用的消息内容（可选）
            on_done: 完成回调
            on_error: 错误回调
        """
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
            quoted_message_id=quoted_message_id,
            quoted_content=quoted_content,
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

    def search_messages(self, session_id: str, query: str, start_date: str | None = None, end_date: str | None = None,
                       case_sensitive: bool = False, whole_word: bool = False, regex: bool = False) -> list[Message]:
        """在指定会话中搜索消息。

        Args:
            session_id: 会话ID
            query: 搜索关键词
            start_date: 起始日期 (ISO 8601 格式，如 "2024-01-01")
            end_date: 结束日期 (ISO 8601 格式)
            case_sensitive: 是否区分大小写 (v1.4.8)
            whole_word: 是否全词匹配 (v1.4.8)
            regex: 是否使用正则表达式 (v1.4.9)
        """
        return self._message_repo.search(session_id, query, start_date, end_date, case_sensitive, whole_word, regex)

    def search_all_messages(self, query: str, limit: int = 100, start_date: str | None = None, end_date: str | None = None,
                           case_sensitive: bool = False, whole_word: bool = False, regex: bool = False) -> list[Message]:
        """在所有会话中搜索消息。

        Args:
            query: 搜索关键词
            limit: 最大返回结果数
            start_date: 起始日期 (ISO 8601 格式)
            end_date: 结束日期 (ISO 8601 格式)
            case_sensitive: 是否区分大小写 (v1.4.8)
            whole_word: 是否全词匹配 (v1.4.8)
            regex: 是否使用正则表达式 (v1.4.9)
        """
        return self._message_repo.search_all(query, limit, start_date, end_date, case_sensitive, whole_word, regex)

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

    # ========== 代码块主题管理 (v1.4.5) ==========

    def get_code_block_theme(self) -> str:
        """获取当前代码块主题。"""
        return self._config.code_block_theme

    def set_code_block_theme(self, theme_name: str) -> bool:
        """
        设置代码块主题并写回配置。

        Args:
            theme_name: 主题名称，必须是已注册的主题之一

        Returns:
            bool: 主题是否有效并已设置
        """
        from src.ui.enhanced_markdown import CodeBlockTheme
        if theme_name in CodeBlockTheme.THEMES:
            self._config.code_block_theme = theme_name
            self._config_store.save(self._config)
            return True
        return False

    # ========== 代码块字号管理 (v1.4.6) ==========

    def get_code_block_font_size(self) -> int:
        """获取当前代码块字号。"""
        return self._config.code_block_font_size

    def set_code_block_font_size(self, font_size: int) -> bool:
        """
        设置代码块字号并写回配置。

        Args:
            font_size: 字号，必须在 8-16 之间

        Returns:
            bool: 字号是否有效并已设置
        """
        if isinstance(font_size, int) and 8 <= font_size <= 16:
            self._config.code_block_font_size = font_size
            self._config_store.save(self._config)
            return True
        return False

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

    # ========== 会话统计 ==========

    def get_session_stats(self, session_id: str | None = None) -> "SessionStats | None":
        """获取会话统计数据。

        Args:
            session_id: 会话ID，不传则使用当前会话

        Returns:
            SessionStats: 统计数据对象，如果会话不存在返回 None
        """
        from src.app.statistics import calculate_session_stats

        sid = session_id or self._current_session_id
        if not sid:
            return None

        session = self._session_repo.get_by_id(sid)
        if not session:
            return None

        messages = self._message_repo.list_by_session(sid)
        return calculate_session_stats(session, messages)

    def get_global_stats(self) -> "GlobalStats":
        """获取全局统计数据（跨所有会话）。

        Returns:
            GlobalStats: 全局统计数据对象
        """
        from src.app.statistics import calculate_global_stats

        sessions = self._session_repo.list_all()
        all_messages = self._message_repo.list_all()
        return calculate_global_stats(sessions, all_messages)

    # ========== 文件夹管理 ==========

    def create_folder(self, name: str, color: str = "#60A5FA", icon: str = "📁") -> Folder:
        """创建新文件夹。"""
        if not self._folder_repo:
            raise RuntimeError("FolderRepository not initialized")
        return self._folder_repo.create(name, color, icon)

    def list_folders(self) -> list[Folder]:
        """获取所有文件夹。"""
        if not self._folder_repo:
            return []
        return self._folder_repo.list_folders()

    def get_folder(self, folder_id: str) -> Folder | None:
        """获取指定文件夹。"""
        if not self._folder_repo:
            return None
        return self._folder_repo.get_by_id(folder_id)

    def update_folder_name(self, folder_id: str, name: str) -> None:
        """更新文件夹名称。"""
        if not self._folder_repo:
            return
        self._folder_repo.update_name(folder_id, name)

    def update_folder_color(self, folder_id: str, color: str) -> None:
        """更新文件夹颜色。"""
        if not self._folder_repo:
            return
        self._folder_repo.update_color(folder_id, color)

    def update_folder_icon(self, folder_id: str, icon: str) -> None:
        """更新文件夹图标。"""
        if not self._folder_repo:
            return
        self._folder_repo.update_icon(folder_id, icon)

    def update_folder_sort_order(self, folder_id: str, sort_order: int) -> None:
        """更新文件夹排序序号。"""
        if not self._folder_repo:
            return
        self._folder_repo.update_sort_order(folder_id, sort_order)

    def swap_folder_order(self, folder_id: str, direction: str) -> Folder | None:
        """交换文件夹排序序号。

        Args:
            folder_id: 要移动的文件夹 ID
            direction: "up" 或 "down"

        Returns:
            交换后的文件夹列表（用于 UI 更新），如果失败返回 None
        """
        if not self._folder_repo:
            return None

        folders = self._folder_repo.list_folders()
        if not folders:
            return None

        # 找到当前文件夹的索引
        current_index = next((i for i, f in enumerate(folders) if f.id == folder_id), None)
        if current_index is None:
            return None

        # 计算目标索引
        if direction == "up" and current_index > 0:
            target_index = current_index - 1
        elif direction == "down" and current_index < len(folders) - 1:
            target_index = current_index + 1
        else:
            return None  # 已经在边界位置

        # 交换排序值
        target_folder = folders[target_index]
        self._folder_repo.swap_folder_order(folder_id, target_folder.id)

        # 返回更新后的文件夹列表
        return self._folder_repo.list_folders()

    def delete_folder(self, folder_id: str) -> None:
        """删除文件夹（会话会移至根目录）。"""
        if not self._folder_repo:
            return
        self._folder_repo.delete(folder_id)

    def set_session_folder(self, session_id: str, folder_id: str | None) -> None:
        """设置会话所属文件夹（None 表示移至根目录）。"""
        self._session_repo.set_folder(session_id, folder_id)

    def get_sessions_by_folder(self, folder_id: str | None) -> list[Session]:
        """获取指定文件夹下的会话（None 表示根目录）。"""
        return self._session_repo.get_sessions_by_folder(folder_id)

    def toggle_folder_collapsed(self, folder_id: str) -> bool:
        """切换文件夹折叠状态，返回新状态。"""
        if not self._folder_repo:
            return False
        current = self._folder_repo.is_folder_collapsed(folder_id)
        new_state = not current
        self._folder_repo.set_folder_collapsed(folder_id, new_state)
        return new_state

    def is_folder_collapsed(self, folder_id: str) -> bool:
        """检查文件夹是否折叠。"""
        if not self._folder_repo:
            return False
        return self._folder_repo.is_folder_collapsed(folder_id)

    # ========== 消息转发 (v1.5.0) ==========

    def forward_messages(self, message_ids: list[str], target_session_id: str) -> int:
        """将消息转发到另一个会话。

        Args:
            message_ids: 要转发的消息 ID 列表
            target_session_id: 目标会话 ID

        Returns:
            int: 成功转发的消息数量
        """
        # 验证目标会话是否存在
        target_session = self._session_repo.get_by_id(target_session_id)
        if not target_session:
            logger.warning("forward_messages: 目标会话不存在 session_id=%s", target_session_id)
            return 0

        # 执行转发
        count = self._message_repo.forward_to_session(message_ids, target_session_id)

        # 更新目标会话的时间戳
        if count > 0:
            self._session_repo.update_updated_at(target_session_id, _now())

        logger.info("forward_messages: 转发了 %d 条消息到会话 %s", count, target_session_id)
        return count

    # ========== 消息收藏/星标 (v2.2.0) ==========

    def toggle_message_starred(self, message_id: str) -> bool:
        """切换消息的收藏（星标）状态，返回新状态。"""
        # 从当前会话中查找消息
        messages = self._message_repo.list_by_session(self._current_session_id or "")
        for m in messages:
            if m.id == message_id:
                new_state = not m.is_starred
                self._message_repo.set_starred(message_id, new_state)
                logger.info("toggle_message_starred: 消息 %s 收藏状态=%s", message_id, new_state)
                return new_state
        # 如果在当前会话没找到，尝试从全局搜索
        all_messages = self._message_repo.list_all()
        for m in all_messages:
            if m.id == message_id:
                new_state = not m.is_starred
                self._message_repo.set_starred(message_id, new_state)
                logger.info("toggle_message_starred: 消息 %s 收藏状态=%s", message_id, new_state)
                return new_state
        return False

    def star_message(self, message_id: str) -> None:
        """收藏（星标）消息。"""
        self._message_repo.set_starred(message_id, True)

    def unstar_message(self, message_id: str) -> None:
        """取消收藏（星标）消息。"""
        self._message_repo.set_starred(message_id, False)

    def list_starred_messages(self, session_id: str | None = None) -> list[Message]:
        """获取收藏的消息。
        Args:
            session_id: 如果指定，只返回该会话的收藏消息；否则返回所有收藏消息
        Returns:
            按创建时间倒序排列的收藏消息列表
        """
        return self._message_repo.list_starred(session_id)
