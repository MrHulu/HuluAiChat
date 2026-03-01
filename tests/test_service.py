"""AppService 测试。"""
from unittest.mock import MagicMock, Mock, patch

import pytest

from src.app.service import AppService
from src.config.models import AppConfig, Provider
from src.persistence import Session, Message


class TestAppService:
    """AppService 核心方法测试。"""

    def test_config_returns_current_config(self):
        """测试 config() 返回当前配置。"""
        config = AppConfig(providers=[], theme="dark")
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        assert service.config() is config

    def test_get_current_provider_returns_first_when_no_selection(self):
        """测试未选择时返回第一个 provider。"""
        provider1 = Provider(id="p1", name="OpenAI", base_url="https://api.openai.com/v1", api_key="sk-1", model_id="gpt-4")
        provider2 = Provider(id="p2", name="Claude", base_url="https://api.anthropic.com", api_key="sk-2", model_id="claude-3")
        config = AppConfig(providers=[provider1, provider2])

        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.get_current_provider()
        assert result == provider1

    def test_get_current_provider_returns_selected(self):
        """测试返回选中的 provider。"""
        provider1 = Provider(id="p1", name="OpenAI", base_url="https://api.openai.com/v1", api_key="sk-1", model_id="gpt-4")
        provider2 = Provider(id="p2", name="Claude", base_url="https://api.anthropic.com", api_key="sk-2", model_id="claude-3")
        config = AppConfig(providers=[provider1, provider2], current_provider_id="p2")

        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.get_current_provider()
        assert result == provider2

    def test_get_current_provider_returns_none_when_empty(self):
        """测试无 provider 时返回 None。"""
        config = AppConfig(providers=[])

        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        assert service.get_current_provider() is None

    def test_new_session_creates_and_sets_current(self):
        """测试新建会话。"""
        session_repo = MagicMock()
        # new_session 内部使用 _gen_id() 生成 UUID，但我们不控制具体值
        # 只验证 create 被调用，且返回值被正确设置
        created_session = Session(id="sid-1", title="新对话", created_at="2024-01-01T00:00:00Z", updated_at="2024-01-01T00:00:00Z")
        session_repo.create.return_value = created_session

        with patch("src.app.service._gen_id", return_value="sid-1"):
            service = AppService(
                config_store=MagicMock(),
                session_repo=session_repo,
                message_repo=MagicMock(),
                chat_client=MagicMock(),
            )

            result = service.new_session()

            session_repo.create.assert_called_once_with("sid-1", "新对话")
            assert service.current_session_id() == "sid-1"
            assert result == created_session

    def test_switch_session(self):
        """测试切换会话。"""
        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.switch_session("sid-123")
        assert service.current_session_id() == "sid-123"

    def test_delete_session_clears_current_if_matches(self):
        """测试删除当前会话时清空。"""
        session_repo = MagicMock()
        message_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("sid-1")

        service.delete_session("sid-1")

        message_repo.delete_by_session.assert_called_once_with("sid-1")
        session_repo.delete.assert_called_once_with("sid-1")
        assert service.current_session_id() is None

    def test_delete_session_preserves_current_if_different(self):
        """测试删除其他会话时保持当前。"""
        session_repo = MagicMock()
        message_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("sid-1")

        service.delete_session("sid-2")

        message_repo.delete_by_session.assert_called_once_with("sid-2")
        session_repo.delete.assert_called_once_with("sid-2")
        assert service.current_session_id() == "sid-1"

    def test_load_sessions(self):
        """测试加载会话列表。"""
        sessions = [
            Session(id="s1", title="Chat 1", created_at="2024-01-01T00:00:00Z", updated_at="2024-01-01T01:00:00Z"),
            Session(id="s2", title="Chat 2", created_at="2024-01-02T00:00:00Z", updated_at="2024-01-02T01:00:00Z"),
        ]
        session_repo = MagicMock()
        session_repo.list_sessions.return_value = sessions

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.load_sessions()
        assert result == sessions

    def test_get_session(self):
        """测试获取指定会话。"""
        session = Session(id="s1", title="Chat", created_at="2024-01-01T00:00:00Z", updated_at="2024-01-01T00:00:00Z")
        session_repo = MagicMock()
        session_repo.get_by_id.return_value = session

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.get_session("s1")
        assert result == session

    def test_load_messages(self):
        """测试加载会话消息。"""
        messages = [
            Message(id="m1", session_id="s1", role="user", content="Hello", created_at="2024-01-01T00:00:00Z"),
            Message(id="m2", session_id="s1", role="assistant", content="Hi", created_at="2024-01-01T00:00:01Z"),
        ]
        message_repo = MagicMock()
        message_repo.list_by_session.return_value = messages

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        result = service.load_messages("s1")
        assert result == messages

    def test_set_current_provider(self):
        """测试设置当前 provider。"""
        config = AppConfig(providers=[], current_provider_id=None)
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.set_current_provider("p-123")

        assert service.config().current_provider_id == "p-123"
        store.save.assert_called_once_with(config)

    def test_set_theme(self):
        """测试设置主题。"""
        config = AppConfig(providers=[], theme="dark")
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.set_theme("light")

        assert service.config().theme == "light"
        store.save.assert_called_once_with(config)

    def test_set_sidebar_expanded(self):
        """测试设置侧边栏展开状态。"""
        config = AppConfig(providers=[], sidebar_expanded=True)
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.set_sidebar_expanded(False)

        assert service.config().sidebar_expanded is False
        store.save.assert_called_once_with(config)

    def test_update_session_title(self):
        """测试更新会话标题。"""
        session_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.update_session_title("s1", "New Title")

        session_repo.update_title.assert_called_once_with("s1", "New Title")

    def test_send_message_with_no_provider_calls_error(self):
        """测试无 provider 时调用 error 回调。"""
        errors = []

        def on_error(msg):
            errors.append(msg)

        mock_store = MagicMock()
        mock_store.load.return_value = AppConfig(providers=[])

        service = AppService(
            config_store=mock_store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        import queue
        q = queue.Queue()
        service.send_message("s1", "Hello", q, on_error=on_error)

        assert len(errors) == 1
        assert "请先配置" in errors[0]

    def test_send_message_with_nonexistent_session_calls_error(self):
        """测试会话不存在时调用 error 回调。"""
        provider = Provider(id="p1", name="OpenAI", base_url="https://api.openai.com/v1", api_key="sk-1", model_id="gpt-4")
        errors = []

        def on_error(msg):
            errors.append(msg)

        session_repo = MagicMock()
        session_repo.get_by_id.return_value = None

        mock_store = MagicMock()
        mock_store.load.return_value = AppConfig(providers=[provider], current_provider_id="p1")

        service = AppService(
            config_store=mock_store,
            session_repo=session_repo,
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        import queue
        q = queue.Queue()
        service.send_message("s1", "Hello", q, on_error=on_error)

        assert len(errors) == 1
        assert "会话不存在" in errors[0]

    def test_save_config(self):
        """测试保存配置。"""
        config = AppConfig(providers=[], theme="dark")
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        new_config = AppConfig(providers=[], theme="light")
        service.save_config(new_config)

        assert service.config() is new_config
        store.save.assert_called_once_with(new_config)

    def test_save_config_without_arg_saves_current(self):
        """测试不传参时保存当前配置。"""
        config = AppConfig(providers=[], theme="dark")
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.save_config()

        store.save.assert_called_once_with(config)

    def test_search_all_messages_delegates_to_repo(self):
        """测试全局搜索委托给仓储。"""
        message_repo = MagicMock()
        expected_results = [
            Message(id="m1", session_id="s1", role="user", content="Hello", created_at="2024-01-01T00:00:00Z")
        ]
        message_repo.search_all.return_value = expected_results

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        results = service.search_all_messages("test", limit=50)

        message_repo.search_all.assert_called_once_with("test", 50)
        assert results == expected_results

    def test_get_message_count_delegates_to_repo(self):
        """测试获取消息数量委托给仓储。"""
        message_repo = MagicMock()
        message_repo.count_by_session.return_value = 5

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        count = service.get_message_count("s1")

        message_repo.count_by_session.assert_called_once_with("s1")
        assert count == 5

    def test_toggle_session_pinned_to_true(self):
        """测试将会话设置为置顶。"""
        from src.persistence.models import Session
        session_repo = MagicMock()
        session = Session(id="s1", title="Test", created_at="2024-01-01T00:00:00+00:00", updated_at="2024-01-01T00:00:00+00:00", is_pinned=False)
        session_repo.get_by_id.return_value = session

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.toggle_session_pinned("s1")

        assert result is True
        session_repo.set_pinned.assert_called_once_with("s1", True)

    def test_toggle_session_pinned_to_false(self):
        """测试取消会话置顶。"""
        from src.persistence.models import Session
        session_repo = MagicMock()
        session = Session(id="s1", title="Test", created_at="2024-01-01T00:00:00+00:00", updated_at="2024-01-01T00:00:00+00:00", is_pinned=True)
        session_repo.get_by_id.return_value = session

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.toggle_session_pinned("s1")

        assert result is False
        session_repo.set_pinned.assert_called_once_with("s1", False)

    def test_toggle_session_pinned_nonexistent(self):
        """测试切换不存在的会话置顶状态返回 False。"""
        session_repo = MagicMock()
        session_repo.get_by_id.return_value = None

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.toggle_session_pinned("nonexistent")

        assert result is False
        session_repo.set_pinned.assert_not_called()

    # ========== Prompt Template Tests ==========

    def test_list_prompt_templates(self):
        """测试获取提示词模板列表。"""
        from src.config.models import PromptTemplate

        template = PromptTemplate(id="t1", title="Test", content="Content", category="通用")
        config = AppConfig(providers=[], prompt_templates=[template])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.list_prompt_templates()

        assert result == [template]

    def test_add_prompt_template(self):
        """测试添加提示词模板。"""
        config = AppConfig(providers=[], prompt_templates=[])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.add_prompt_template("New Template", "Content here", "测试")

        assert len(service._config.prompt_templates) == 1
        assert service._config.prompt_templates[0].title == "New Template"
        assert service._config.prompt_templates[0].content == "Content here"
        assert service._config.prompt_templates[0].category == "测试"
        store.save.assert_called_once()

    def test_update_prompt_template(self):
        """测试更新提示词模板。"""
        from src.config.models import PromptTemplate

        template = PromptTemplate(id="t1", title="Old", content="Old content", category="通用")
        config = AppConfig(providers=[], prompt_templates=[template])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.update_prompt_template("t1", "Updated", "New content", "更新")

        assert service._config.prompt_templates[0].title == "Updated"
        assert service._config.prompt_templates[0].content == "New content"
        assert service._config.prompt_templates[0].category == "更新"
        store.save.assert_called_once()

    def test_update_nonexistent_template_does_nothing(self):
        """测试更新不存在的模板时不报错。"""
        config = AppConfig(providers=[], prompt_templates=[])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.update_prompt_template("nonexistent", "Title", "Content", "通用")

        store.save.assert_called_once()  # Still saves even if template not found

    def test_delete_prompt_template(self):
        """测试删除提示词模板。"""
        from src.config.models import PromptTemplate

        t1 = PromptTemplate(id="t1", title="Keep", content="Content", category="通用")
        t2 = PromptTemplate(id="t2", title="Delete", content="Content", category="通用")
        config = AppConfig(providers=[], prompt_templates=[t1, t2])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.delete_prompt_template("t2")

        assert len(service._config.prompt_templates) == 1
        assert service._config.prompt_templates[0].id == "t1"
        store.save.assert_called_once()

    def test_get_prompt_template(self):
        """测试获取指定模板。"""
        from src.config.models import PromptTemplate

        template = PromptTemplate(id="t1", title="Test", content="Content", category="通用")
        config = AppConfig(providers=[], prompt_templates=[template])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.get_prompt_template("t1")

        assert result == template

    def test_get_prompt_template_returns_none_when_not_found(self):
        """测试获取不存在的模板返回 None。"""
        config = AppConfig(providers=[], prompt_templates=[])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.get_prompt_template("nonexistent")

        assert result is None

    def test_restore_default_templates(self):
        """测试恢复默认模板。"""
        config = AppConfig(providers=[], prompt_templates=[])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.restore_default_templates()

        assert len(service._config.prompt_templates) > 0
        store.save.assert_called_once()

    # ========== Pin/Unpin Message Tests ==========

    def test_pin_message(self):
        """测试置顶消息。"""
        message_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        service.pin_message("m1")

        message_repo.set_pinned.assert_called_once_with("m1", True)

    def test_unpin_message(self):
        """测试取消置顶消息。"""
        message_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        service.unpin_message("m1")

        message_repo.set_pinned.assert_called_once_with("m1", False)

    def test_list_pinned_messages(self):
        """测试获取置顶消息列表。"""
        message_repo = MagicMock()
        pinned = [
            Message(id="m1", session_id="s1", role="user", content="Pinned", created_at="2024-01-01T00:00:00Z", is_pinned=True)
        ]
        message_repo.list_pinned.return_value = pinned

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        result = service.list_pinned_messages("s1")

        assert result == pinned
        message_repo.list_pinned.assert_called_once_with("s1")

    def test_toggle_message_pin_from_unpinned_to_pinned(self):
        """测试从未置顶切换到置顶。"""
        message_repo = MagicMock()
        messages = [
            Message(id="m1", session_id="s1", role="user", content="Test", created_at="2024-01-01T00:00:00Z", is_pinned=False)
        ]
        message_repo.list_by_session.return_value = messages

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        result = service.toggle_message_pin("m1")

        assert result is True
        message_repo.set_pinned.assert_called_once_with("m1", True)

    def test_toggle_message_pin_from_pinned_to_unpinned(self):
        """测试从置顶切换到未置顶。"""
        message_repo = MagicMock()
        messages = [
            Message(id="m1", session_id="s1", role="user", content="Test", created_at="2024-01-01T00:00:00Z", is_pinned=True)
        ]
        message_repo.list_by_session.return_value = messages

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        result = service.toggle_message_pin("m1")

        assert result is False
        message_repo.set_pinned.assert_called_once_with("m1", False)

    def test_toggle_message_pin_returns_false_when_not_found(self):
        """测试切换不存在的消息返回 False。"""
        message_repo = MagicMock()
        message_repo.list_by_session.return_value = []

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        result = service.toggle_message_pin("nonexistent")

        assert result is False
        message_repo.set_pinned.assert_not_called()

    # ========== Send Message Happy Path Tests ==========

    def test_send_message_appends_user_message_and_starts_stream(self):
        """测试发送消息添加用户消息并启动流式请求。"""
        import queue
        import time

        provider = Provider(id="p1", name="OpenAI", base_url="https://api.openai.com/v1", api_key="sk-1", model_id="gpt-4")
        session = Session(id="s1", title="Chat", created_at="2024-01-01T00:00:00Z", updated_at="2024-01-01T00:00:00Z")

        session_repo = MagicMock()
        session_repo.get_by_id.return_value = session

        message_repo = MagicMock()
        message_repo.list_by_session.return_value = []

        chat_client = MagicMock()

        config = AppConfig(providers=[provider], current_provider_id="p1")
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=session_repo,
            message_repo=message_repo,
            chat_client=chat_client,
        )

        q = queue.Queue()
        service.send_message("s1", "Hello", q)

        # Wait a bit for the thread to start
        time.sleep(0.1)

        # Verify user message was appended
        assert message_repo.append.call_count >= 1
        session_repo.update_updated_at.assert_called()

        # Verify stream_chat was called
        chat_client.stream_chat.assert_called_once()

    # ========== Regenerate Response Tests ==========

    def test_regenerate_response_with_no_messages_calls_error(self):
        """测试无消息时重新生成调用 error 回调。"""
        message_repo = MagicMock()
        message_repo.list_by_session.return_value = []

        errors = []

        def on_error(msg):
            errors.append(msg)

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        import queue
        q = queue.Queue()
        service.regenerate_response("s1", q, on_error=on_error)

        assert len(errors) == 1
        assert "没有可重新生成" in errors[0]

    def test_regenerate_response_with_no_assistant_message_calls_error(self):
        """测试无助手消息时重新生成调用 error 回调。"""
        message_repo = MagicMock()
        message_repo.list_by_session.return_value = [
            Message(id="m1", session_id="s1", role="user", content="Hello", created_at="2024-01-01T00:00:00Z")
        ]

        errors = []

        def on_error(msg):
            errors.append(msg)

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )

        import queue
        q = queue.Queue()
        service.regenerate_response("s1", q, on_error=on_error)

        assert len(errors) == 1
        assert "没有助手回复" in errors[0]

    def test_regenerate_response_deletes_last_assistant_message(self):
        """测试重新生成删除最后的助手消息。"""
        import time

        provider = Provider(id="p1", name="OpenAI", base_url="https://api.openai.com/v1", api_key="sk-1", model_id="gpt-4")

        message_repo = MagicMock()
        message_repo.list_by_session.return_value = [
            Message(id="m1", session_id="s1", role="user", content="Hello", created_at="2024-01-01T00:00:00Z"),
            Message(id="m2", session_id="s1", role="assistant", content="Hi", created_at="2024-01-01T00:00:01Z"),
        ]

        chat_client = MagicMock()

        config = AppConfig(providers=[provider], current_provider_id="p1")
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=chat_client,
        )

        import queue
        q = queue.Queue()
        service.regenerate_response("s1", q)

        time.sleep(0.1)

        # Verify last assistant message was deleted
        message_repo.delete.assert_called_once_with("m2")
        chat_client.stream_chat.assert_called_once()

    # ========== Update Message Content Tests ==========

    def test_update_message_content_delegates_to_repo(self):
        """测试更新消息内容委托给仓储。"""
        message_repo = MagicMock()
        session_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        result = service.update_message_content("m1", "Updated content")

        message_repo.update_content.assert_called_once_with("m1", "Updated content")
        assert result is True

    def test_update_message_content_updates_session_timestamp(self):
        """测试更新消息内容时更新会话时间戳。"""
        message_repo = MagicMock()
        session_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        service.update_message_content("m1", "Updated content")

        session_repo.update_updated_at.assert_called_once()

    def test_update_message_content_returns_false_on_error(self):
        """测试更新失败时返回 False。"""
        message_repo = MagicMock()
        message_repo.update_content.side_effect = Exception("DB error")

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        result = service.update_message_content("m1", "Updated content")

        assert result is False

    def test_update_message_content_with_no_current_session(self):
        """测试无当前会话时更新消息仍能成功。"""
        message_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        # No current session set

        result = service.update_message_content("m1", "Updated content")

        # Should still call update_content, but not update_updated_at
        message_repo.update_content.assert_called_once_with("m1", "Updated content")
        assert result is True

    # ========== Delete Message Tests ==========

    def test_delete_message_delegates_to_repo(self):
        """测试删除消息委托给仓储。"""
        message_repo = MagicMock()
        session_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        result = service.delete_message("m1")

        message_repo.delete.assert_called_once_with("m1")
        assert result is True

    def test_delete_message_updates_session_timestamp(self):
        """测试删除消息时更新会话时间戳。"""
        message_repo = MagicMock()
        session_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=session_repo,
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        service.delete_message("m1")

        session_repo.update_updated_at.assert_called_once()

    def test_delete_message_returns_false_on_error(self):
        """测试删除失败时返回 False。"""
        message_repo = MagicMock()
        message_repo.delete.side_effect = Exception("DB error")

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        service.switch_session("s1")

        result = service.delete_message("m1")

        assert result is False

    def test_delete_message_with_no_current_session(self):
        """测试无当前会话时删除消息仍能成功。"""
        message_repo = MagicMock()

        service = AppService(
            config_store=MagicMock(),
            session_repo=MagicMock(),
            message_repo=message_repo,
            chat_client=MagicMock(),
        )
        # No current session set

        result = service.delete_message("m1")

        # Should still call delete, but not update_updated_at
        message_repo.delete.assert_called_once_with("m1")
        assert result is True

    # ========== Recent Searches Tests ==========

    def test_get_recent_searches_returns_empty_list_initially(self):
        """测试初始状态下最近搜索列表为空。"""
        config = AppConfig(providers=[], recent_searches=[])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.get_recent_searches()

        assert result == []

    def test_get_recent_searches_returns_existing_searches(self):
        """测试返回现有的最近搜索列表。"""
        config = AppConfig(providers=[], recent_searches=["python", "test", "code"])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        result = service.get_recent_searches()

        assert result == ["python", "test", "code"]

    def test_add_recent_search_adds_new_query(self):
        """测试添加新的搜索到最近搜索列表。"""
        config = AppConfig(providers=[], recent_searches=["old_search"])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.add_recent_search("new_search")

        assert service._config.recent_searches == ["new_search", "old_search"]
        store.save.assert_called_once()

    def test_add_recent_search_moves_existing_to_front(self):
        """测试添加已存在的搜索时，将其移动到列表开头。"""
        config = AppConfig(providers=[], recent_searches=["python", "test", "code"])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.add_recent_search("test")

        assert service._config.recent_searches == ["test", "python", "code"]
        store.save.assert_called_once()

    def test_add_recent_search_limits_to_10_items(self):
        """测试最近搜索列表最多保留10条。"""
        config = AppConfig(providers=[], recent_searches=[f"search{i}" for i in range(10)])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.add_recent_search("new")

        assert len(service._config.recent_searches) == 10
        assert service._config.recent_searches[0] == "new"
        assert "search9" not in service._config.recent_searches  # 最旧的(search9)被移除

    def test_add_recent_search_ignores_empty_query(self):
        """测试添加空字符串时不修改列表。"""
        config = AppConfig(providers=[], recent_searches=["existing"])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.add_recent_search("")
        service.add_recent_search("   ")

        assert service._config.recent_searches == ["existing"]
        store.save.assert_not_called()

    def test_add_recent_search_trims_whitespace(self):
        """测试添加搜索时自动去除首尾空格。"""
        config = AppConfig(providers=[], recent_searches=[])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.add_recent_search("  python test  ")

        assert service._config.recent_searches == ["python test"]

    def test_clear_recent_searches_clears_list(self):
        """测试清空最近搜索列表。"""
        config = AppConfig(providers=[], recent_searches=["python", "test", "code"])
        store = MagicMock()
        store.load.return_value = config

        service = AppService(
            config_store=store,
            session_repo=MagicMock(),
            message_repo=MagicMock(),
            chat_client=MagicMock(),
        )

        service.clear_recent_searches()

        assert service._config.recent_searches == []
        store.save.assert_called_once()
