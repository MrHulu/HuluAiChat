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
