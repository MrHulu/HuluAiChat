"""消息仓储测试。"""
from datetime import datetime, timezone

import pytest

from src.persistence.models import Message
from src.persistence.message_repo import SqliteMessageRepository, _row_to_message


@pytest.fixture
def message_repo(temp_db_path: str) -> SqliteMessageRepository:
    """创建使用临时数据库的消息仓储。"""
    return SqliteMessageRepository(db_path=temp_db_path)


@pytest.fixture
def sample_message() -> Message:
    """示例消息 fixture。"""
    return Message(
        id="m1",
        session_id="s1",
        role="user",
        content="Hello, world!",
        created_at=datetime.now(timezone.utc).isoformat(),
    )


class TestRowToMessage:
    """_row_to_message 辅助函数测试。"""

    def test_convert_row_to_message(self) -> None:
        """测试：将数据库行转换为 Message 对象。"""
        row = ("m1", "s1", "user", "Hello", "2024-01-01T00:00:00+00:00")
        message = _row_to_message(row)
        assert message.id == "m1"
        assert message.session_id == "s1"
        assert message.role == "user"
        assert message.content == "Hello"
        assert message.created_at == "2024-01-01T00:00:00+00:00"


class TestSqliteMessageRepository:
    """SQLite 消息仓储测试。"""

    def test_append_message(self, message_repo: SqliteMessageRepository, sample_message: Message) -> None:
        """测试：追加消息。"""
        message_repo.append(sample_message)
        messages = message_repo.list_by_session("s1")
        assert len(messages) == 1
        assert messages[0].id == "m1"
        assert messages[0].content == "Hello, world!"

    def test_append_multiple_messages(self, message_repo: SqliteMessageRepository) -> None:
        """测试：追加多条消息。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="First", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="assistant", content="Second", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        messages = message_repo.list_by_session("s1")
        assert len(messages) == 2

    def test_list_by_session_empty(self, message_repo: SqliteMessageRepository) -> None:
        """测试：空会话返回空列表。"""
        messages = message_repo.list_by_session("nonexistent")
        assert messages == []

    def test_list_by_session_ordered_by_created_at(self, message_repo: SqliteMessageRepository) -> None:
        """测试：消息按 created_at 升序排列。"""
        base_time = datetime(2024, 1, 1, tzinfo=timezone.utc)
        m1 = Message(
            id="m1",
            session_id="s1",
            role="user",
            content="First",
            created_at=base_time.isoformat(),
        )
        m2 = Message(
            id="m2",
            session_id="s1",
            role="assistant",
            content="Second",
            created_at=(base_time.replace(second=30)).isoformat(),
        )

        # 反向插入，测试排序
        message_repo.append(m2)
        message_repo.append(m1)

        messages = message_repo.list_by_session("s1")
        assert len(messages) == 2
        assert messages[0].id == "m1"  # 更早的在前
        assert messages[1].id == "m2"

    def test_list_by_session_filters_by_session(self, message_repo: SqliteMessageRepository) -> None:
        """测试：只返回指定会话的消息。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="In s1", created_at=now)
        m2 = Message(id="m2", session_id="s2", role="user", content="In s2", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        s1_messages = message_repo.list_by_session("s1")
        s2_messages = message_repo.list_by_session("s2")

        assert len(s1_messages) == 1
        assert s1_messages[0].id == "m1"
        assert len(s2_messages) == 1
        assert s2_messages[0].id == "m2"

    def test_delete_by_session(self, message_repo: SqliteMessageRepository) -> None:
        """测试：删除会话的所有消息。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="First", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="assistant", content="Second", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        message_repo.delete_by_session("s1")

        messages = message_repo.list_by_session("s1")
        assert messages == []

    def test_delete_by_session_affects_only_target(self, message_repo: SqliteMessageRepository) -> None:
        """测试：删除只影响目标会话。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="In s1", created_at=now)
        m2 = Message(id="m2", session_id="s2", role="user", content="In s2", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        message_repo.delete_by_session("s1")

        assert len(message_repo.list_by_session("s1")) == 0
        assert len(message_repo.list_by_session("s2")) == 1

    def test_delete_by_session_nonexistent_is_noop(self, message_repo: SqliteMessageRepository) -> None:
        """测试：删除不存在的会话不报错。"""
        # 不应该抛出异常
        message_repo.delete_by_session("nonexistent")

    def test_role_values(self, message_repo: SqliteMessageRepository) -> None:
        """测试：不同的 role 值都能正确存储和读取。"""
        now = datetime.now(timezone.utc).isoformat()
        m_user = Message(id="m1", session_id="s1", role="user", content="User msg", created_at=now)
        m_assistant = Message(
            id="m2", session_id="s1", role="assistant", content="Assistant msg", created_at=now
        )

        message_repo.append(m_user)
        message_repo.append(m_assistant)

        messages = message_repo.list_by_session("s1")
        assert messages[0].role == "user"
        assert messages[1].role == "assistant"
