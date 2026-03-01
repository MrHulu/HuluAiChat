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


class TestGlobalSearch:
    """全局搜索功能测试。"""

    def test_search_all_empty_query_returns_empty(self, message_repo: SqliteMessageRepository) -> None:
        """测试：空查询字符串返回空列表。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Hello world", created_at=now)
        message_repo.append(m)

        results = message_repo.search_all("")
        assert results == []

    def test_search_all_finds_matches_across_sessions(self, message_repo: SqliteMessageRepository) -> None:
        """测试：在所有会话中搜索找到匹配。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="Python is great", created_at=now)
        m2 = Message(id="m2", session_id="s2", role="assistant", content="Java is also good", created_at=now)
        m3 = Message(id="m3", session_id="s1", role="assistant", content="JavaScript is powerful", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)
        message_repo.append(m3)

        results = message_repo.search_all("is")
        assert len(results) == 3
        session_ids = {r.session_id for r in results}
        assert session_ids == {"s1", "s2"}

    def test_search_all_case_insensitive(self, message_repo: SqliteMessageRepository) -> None:
        """测试：搜索不区分大小写。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="HELLO World", created_at=now)
        message_repo.append(m)

        results_lower = message_repo.search_all("hello")
        results_upper = message_repo.search_all("HELLO")
        results_mixed = message_repo.search_all("HeLLo")

        assert len(results_lower) == 1
        assert len(results_upper) == 1
        assert len(results_mixed) == 1

    def test_search_all_respects_limit(self, message_repo: SqliteMessageRepository) -> None:
        """测试：搜索结果数量受 limit 参数限制。"""
        now = datetime.now(timezone.utc).isoformat()
        for i in range(10):
            m = Message(
                id=f"m{i}",
                session_id="s1",
                role="user",
                content=f"Message {i}",
                created_at=now,
            )
            message_repo.append(m)

        results = message_repo.search_all("Message", limit=5)
        assert len(results) == 5

    def test_search_all_ordered_by_created_at_desc(self, message_repo: SqliteMessageRepository) -> None:
        """测试：结果按时间倒序排列（最新的在前）。"""
        base_time = datetime(2024, 1, 1, tzinfo=timezone.utc)
        m1 = Message(
            id="m1",
            session_id="s1",
            role="user",
            content="test",
            created_at=base_time.isoformat(),
        )
        m2 = Message(
            id="m2",
            session_id="s1",
            role="user",
            content="test",
            created_at=(base_time.replace(hour=1)).isoformat(),
        )

        message_repo.append(m1)
        message_repo.append(m2)

        results = message_repo.search_all("test")
        assert len(results) == 2
        assert results[0].id == "m2"  # 更新的在前


class TestAdvancedSearchOptions:
    """v1.4.8: 高级搜索选项测试。"""

    def test_search_case_sensitive_true(self, message_repo: SqliteMessageRepository) -> None:
        """测试：区分大小写搜索。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="Hello World", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="user", content="HELLO World", created_at=now)
        m3 = Message(id="m3", session_id="s1", role="user", content="hello world", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)
        message_repo.append(m3)

        # 不区分大小写（默认）
        results_default = message_repo.search_all("Hello")
        assert len(results_default) == 3

        # 区分大小写
        results_case_sensitive = message_repo.search_all("Hello", case_sensitive=True)
        assert len(results_case_sensitive) == 1
        assert results_case_sensitive[0].id == "m1"

    def test_search_case_sensitive_uppercase(self, message_repo: SqliteMessageRepository) -> None:
        """测试：区分大小写搜索大写关键词。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="Hello World", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="user", content="HELLO World", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        results = message_repo.search_all("HELLO", case_sensitive=True)
        assert len(results) == 1
        assert results[0].id == "m2"

    def test_search_whole_word_true(self, message_repo: SqliteMessageRepository) -> None:
        """测试：全词匹配搜索。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="Hello World", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="user", content="HelloWorld", created_at=now)
        m3 = Message(id="m3", session_id="s1", role="user", content="Hello, World!", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)
        message_repo.append(m3)

        # 不启用全词匹配（默认）
        results_default = message_repo.search_all("Hello")
        assert len(results_default) == 3

        # 启用全词匹配
        results_whole_word = message_repo.search_all("Hello", whole_word=True)
        assert len(results_whole_word) == 2
        message_ids = {r.id for r in results_whole_word}
        assert message_ids == {"m1", "m3"}  # HelloWorld 不应匹配

    def test_search_whole_word_with_punctuation(self, message_repo: SqliteMessageRepository) -> None:
        """测试：全词匹配支持标点符号边界。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="test, test. test!", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="user", content="testing", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        results = message_repo.search_all("test", whole_word=True)
        assert len(results) == 1
        assert results[0].id == "m1"

    def test_search_case_sensitive_and_whole_word_combined(self, message_repo: SqliteMessageRepository) -> None:
        """测试：区分大小写和全词匹配组合使用。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="Hello World", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="user", content="HELLO World", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        results = message_repo.search_all("Hello", case_sensitive=True, whole_word=True)
        assert len(results) == 1
        assert results[0].id == "m1"

    def test_search_case_sensitive_in_session(self, message_repo: SqliteMessageRepository) -> None:
        """测试：会话内搜索支持区分大小写。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="Python code", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="user", content="python CODE", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        results_default = message_repo.search("s1", "Python")
        assert len(results_default) == 2

        results_case = message_repo.search("s1", "Python", case_sensitive=True)
        assert len(results_case) == 1
        assert results_case[0].id == "m1"

    def test_search_whole_word_in_session(self, message_repo: SqliteMessageRepository) -> None:
        """测试：会话内搜索支持全词匹配。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="I love Python", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="user", content="I love Pythonic code", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        results_whole = message_repo.search("s1", "Python", whole_word=True)
        assert len(results_whole) == 1
        assert results_whole[0].id == "m1"


class TestMessagePinning:
    """消息置顶功能测试。"""

    def test_set_pinned_true(self, message_repo: SqliteMessageRepository) -> None:
        """测试：置顶消息。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Important", created_at=now)
        message_repo.append(m)

        message_repo.set_pinned("m1", True)
        messages = message_repo.list_by_session("s1")
        assert len(messages) == 1
        assert messages[0].is_pinned is True

    def test_set_pinned_false(self, message_repo: SqliteMessageRepository) -> None:
        """测试：取消置顶。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Important", created_at=now, is_pinned=True)
        message_repo.append(m)

        message_repo.set_pinned("m1", False)
        messages = message_repo.list_by_session("s1")
        assert len(messages) == 1
        assert messages[0].is_pinned is False

    def test_list_pinned_empty(self, message_repo: SqliteMessageRepository) -> None:
        """测试：无置顶消息时返回空列表。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Normal", created_at=now)
        message_repo.append(m)

        pinned = message_repo.list_pinned("s1")
        assert pinned == []

    def test_list_pinned_returns_only_pinned(self, message_repo: SqliteMessageRepository) -> None:
        """测试：只返回置顶的消息。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="Normal", created_at=now, is_pinned=False)
        m2 = Message(id="m2", session_id="s1", role="assistant", content="Important", created_at=now, is_pinned=True)
        m3 = Message(id="m3", session_id="s1", role="user", content="Also pinned", created_at=now, is_pinned=True)

        message_repo.append(m1)
        message_repo.append(m2)
        message_repo.append(m3)

        pinned = message_repo.list_pinned("s1")
        assert len(pinned) == 2
        pinned_ids = {p.id for p in pinned}
        assert pinned_ids == {"m2", "m3"}

    def test_list_pinned_ordered_by_created_at_desc(self, message_repo: SqliteMessageRepository) -> None:
        """测试：置顶消息按时间倒序排列。"""
        base_time = datetime(2024, 1, 1, tzinfo=timezone.utc)
        m1 = Message(id="m1", session_id="s1", role="user", content="First", created_at=base_time.isoformat(), is_pinned=True)
        m2 = Message(id="m2", session_id="s1", role="user", content="Second", created_at=(base_time.replace(hour=1)).isoformat(), is_pinned=True)

        message_repo.append(m1)
        message_repo.append(m2)

        pinned = message_repo.list_pinned("s1")
        assert len(pinned) == 2
        assert pinned[0].id == "m2"  # 更新的在前

    def test_toggle_pin_changes_state(self, message_repo: SqliteMessageRepository) -> None:
        """测试：切换置顶状态。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Test", created_at=now)
        message_repo.append(m)

        # 先置顶
        message_repo.set_pinned("m1", True)
        messages = message_repo.list_by_session("s1")
        assert messages[0].is_pinned is True

        # 再取消
        message_repo.set_pinned("m1", False)
        messages = message_repo.list_by_session("s1")
        assert messages[0].is_pinned is False


class TestMessageEditing:
    """消息编辑功能测试。"""

    def test_update_content_changes_message(self, message_repo: SqliteMessageRepository) -> None:
        """测试：更新消息内容。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Original", created_at=now)
        message_repo.append(m)

        message_repo.update_content("m1", "Updated content")

        messages = message_repo.list_by_session("s1")
        assert len(messages) == 1
        assert messages[0].content == "Updated content"
        assert messages[0].id == "m1"
        assert messages[0].role == "user"

    def test_update_content_empty_string(self, message_repo: SqliteMessageRepository) -> None:
        """测试：更新为空字符串。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Original", created_at=now)
        message_repo.append(m)

        message_repo.update_content("m1", "")

        messages = message_repo.list_by_session("s1")
        assert len(messages) == 1
        assert messages[0].content == ""

    def test_update_content_with_multiline(self, message_repo: SqliteMessageRepository) -> None:
        """测试：更新多行内容。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="assistant", content="Single line", created_at=now)
        message_repo.append(m)

        new_content = "Line 1\nLine 2\nLine 3"
        message_repo.update_content("m1", new_content)

        messages = message_repo.list_by_session("s1")
        assert messages[0].content == new_content

    def test_update_content_with_special_chars(self, message_repo: SqliteMessageRepository) -> None:
        """测试：更新包含特殊字符的内容。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Original", created_at=now)
        message_repo.append(m)

        new_content = "Hello 'world' \"test\" \n newline \t tab"
        message_repo.update_content("m1", new_content)

        messages = message_repo.list_by_session("s1")
        assert messages[0].content == new_content

    def test_update_content_with_unicode(self, message_repo: SqliteMessageRepository) -> None:
        """测试：更新包含 Unicode 字符的内容。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Original", created_at=now)
        message_repo.append(m)

        new_content = "你好世界 🚀 Hello 世界"
        message_repo.update_content("m1", new_content)

        messages = message_repo.list_by_session("s1")
        assert messages[0].content == new_content

    def test_update_content_nonexistent_message(self, message_repo: SqliteMessageRepository) -> None:
        """测试：更新不存在的消息不应报错。"""
        # 不应该抛出异常
        message_repo.update_content("nonexistent", "Some content")

    def test_update_content_affects_only_target_message(self, message_repo: SqliteMessageRepository) -> None:
        """测试：更新只影响目标消息。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="First", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="assistant", content="Second", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        message_repo.update_content("m1", "Updated First")

        messages = message_repo.list_by_session("s1")
        assert len(messages) == 2
        assert messages[0].content == "Updated First"
        assert messages[1].content == "Second"


class TestMessageCount:
    """消息计数功能测试。"""

    def test_count_by_session_empty(self, message_repo: SqliteMessageRepository) -> None:
        """测试：空会话返回 0。"""
        count = message_repo.count_by_session("nonexistent")
        assert count == 0

    def test_count_by_session_single_message(self, message_repo: SqliteMessageRepository) -> None:
        """测试：单条消息的会话返回 1。"""
        now = datetime.now(timezone.utc).isoformat()
        m = Message(id="m1", session_id="s1", role="user", content="Hello", created_at=now)
        message_repo.append(m)

        count = message_repo.count_by_session("s1")
        assert count == 1

    def test_count_by_session_multiple_messages(self, message_repo: SqliteMessageRepository) -> None:
        """测试：多条消息的会话返回正确数量。"""
        now = datetime.now(timezone.utc).isoformat()
        for i in range(5):
            m = Message(id=f"m{i}", session_id="s1", role="user", content=f"Msg {i}", created_at=now)
            message_repo.append(m)

        count = message_repo.count_by_session("s1")
        assert count == 5

    def test_count_by_session_filters_by_session(self, message_repo: SqliteMessageRepository) -> None:
        """测试：计数只统计指定会话的消息。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="In s1", created_at=now)
        m2 = Message(id="m2", session_id="s2", role="user", content="In s2", created_at=now)
        m3 = Message(id="m3", session_id="s1", role="assistant", content="Also in s1", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)
        message_repo.append(m3)

        assert message_repo.count_by_session("s1") == 2
        assert message_repo.count_by_session("s2") == 1

    def test_count_by_session_after_delete(self, message_repo: SqliteMessageRepository) -> None:
        """测试：删除消息后计数正确更新。"""
        now = datetime.now(timezone.utc).isoformat()
        m1 = Message(id="m1", session_id="s1", role="user", content="First", created_at=now)
        m2 = Message(id="m2", session_id="s1", role="assistant", content="Second", created_at=now)

        message_repo.append(m1)
        message_repo.append(m2)

        assert message_repo.count_by_session("s1") == 2

        message_repo.delete("m1")
        assert message_repo.count_by_session("s1") == 1
