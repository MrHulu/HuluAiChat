"""会话仓储测试。"""
from datetime import datetime, timezone

import pytest

from src.persistence.models import Session
from src.persistence.session_repo import SqliteSessionRepository, _row_to_session


@pytest.fixture
def session_repo(temp_db_path: str) -> SqliteSessionRepository:
    """创建使用临时数据库的会话仓储。"""
    return SqliteSessionRepository(db_path=temp_db_path)


class TestRowToSession:
    """_row_to_session 辅助函数测试。"""

    def test_convert_row_to_session(self) -> None:
        """测试：将数据库行转换为 Session 对象。"""
        row = ("s1", "Test Session", "2024-01-01T00:00:00+00:00", "2024-01-02T00:00:00+00:00")
        session = _row_to_session(row)
        assert session.id == "s1"
        assert session.title == "Test Session"
        assert session.created_at == "2024-01-01T00:00:00+00:00"
        assert session.updated_at == "2024-01-02T00:00:00+00:00"


class TestSqliteSessionRepository:
    """SQLite 会话仓储测试。"""

    def test_create_session(self, session_repo: SqliteSessionRepository) -> None:
        """测试：创建会话。"""
        session = session_repo.create("s1", "Test Session")
        assert session.id == "s1"
        assert session.title == "Test Session"
        # 时间戳应该是有效的 ISO 格式
        datetime.fromisoformat(session.created_at.replace("Z", "+00:00"))

    def test_create_multiple_sessions(self, session_repo: SqliteSessionRepository) -> None:
        """测试：创建多个会话。"""
        s1 = session_repo.create("s1", "Session 1")
        s2 = session_repo.create("s2", "Session 2")
        assert s1.id == "s1"
        assert s2.id == "s2"

    def test_list_sessions_empty(self, session_repo: SqliteSessionRepository) -> None:
        """测试：空列表。"""
        sessions = session_repo.list_sessions()
        assert sessions == []

    def test_list_sessions_ordered_by_updated_at(self, session_repo: SqliteSessionRepository) -> None:
        """测试：会话按 updated_at 降序排列。"""
        session_repo.create("s1", "First")
        session_repo.create("s2", "Second")
        session_repo.update_updated_at("s1", datetime.now(timezone.utc).isoformat())

        sessions = session_repo.list_sessions()
        assert len(sessions) == 2
        # s1 应该在前面（因为更晚更新）
        assert sessions[0].id == "s1"
        assert sessions[1].id == "s2"

    def test_get_by_id_exists(self, session_repo: SqliteSessionRepository) -> None:
        """测试：获取存在的会话。"""
        created = session_repo.create("s1", "Test")
        found = session_repo.get_by_id("s1")
        assert found is not None
        assert found.id == "s1"
        assert found.title == "Test"

    def test_get_by_id_not_exists(self, session_repo: SqliteSessionRepository) -> None:
        """测试：获取不存在的会话返回 None。"""
        found = session_repo.get_by_id("nonexistent")
        assert found is None

    def test_update_title(self, session_repo: SqliteSessionRepository) -> None:
        """测试：更新标题。"""
        session_repo.create("s1", "Old Title")
        session_repo.update_title("s1", "New Title")

        updated = session_repo.get_by_id("s1")
        assert updated is not None
        assert updated.title == "New Title"

    def test_update_updated_at(self, session_repo: SqliteSessionRepository) -> None:
        """测试：更新时间戳。"""
        session_repo.create("s1", "Test")
        new_time = "2024-03-01T12:00:00+00:00"
        session_repo.update_updated_at("s1", new_time)

        updated = session_repo.get_by_id("s1")
        assert updated is not None
        assert updated.updated_at == new_time

    def test_delete_session(self, session_repo: SqliteSessionRepository) -> None:
        """测试：删除会话。"""
        session_repo.create("s1", "Test")
        session_repo.delete("s1")

        found = session_repo.get_by_id("s1")
        assert found is None

    def test_delete_nonexistent_is_noop(self, session_repo: SqliteSessionRepository) -> None:
        """测试：删除不存在的会话不报错。"""
        # 不应该抛出异常
        session_repo.delete("nonexistent")

    def test_list_after_delete(self, session_repo: SqliteSessionRepository) -> None:
        """测试：删除后列表更新。"""
        session_repo.create("s1", "First")
        session_repo.create("s2", "Second")
        session_repo.delete("s1")

        sessions = session_repo.list_sessions()
        assert len(sessions) == 1
        assert sessions[0].id == "s2"

    def test_set_pinned_true(self, session_repo: SqliteSessionRepository) -> None:
        """测试：设置会话为置顶。"""
        session_repo.create("s1", "Test")
        session_repo.set_pinned("s1", True)

        session = session_repo.get_by_id("s1")
        assert session is not None
        assert session.is_pinned is True

    def test_set_pinned_false(self, session_repo: SqliteSessionRepository) -> None:
        """测试：取消会话置顶。"""
        session_repo.create("s1", "Test")
        session_repo.set_pinned("s1", True)
        session_repo.set_pinned("s1", False)

        session = session_repo.get_by_id("s1")
        assert session is not None
        assert session.is_pinned is False

    def test_list_sessions_pinned_first(self, session_repo: SqliteSessionRepository) -> None:
        """测试：置顶会话排在前面。"""
        session_repo.create("s1", "First")
        session_repo.create("s2", "Second")
        session_repo.create("s3", "Third")
        # 置顶 s2 和 s3
        session_repo.set_pinned("s2", True)
        session_repo.set_pinned("s3", True)

        sessions = session_repo.list_sessions()
        assert len(sessions) == 3
        # 置顶的会话排在前面，按 updated_at 降序（s3 最晚创建）
        assert sessions[0].id == "s3"
        assert sessions[1].id == "s2"
        # 未置顶的会话在后面
        assert sessions[2].id == "s1"

    def test_list_sessions_pinned_then_updated_at(self, session_repo: SqliteSessionRepository) -> None:
        """测试：先按置顶排序，然后按更新时间排序。"""
        session_repo.create("s1", "First")
        session_repo.create("s2", "Second")
        session_repo.create("s3", "Third")
        # s2 置顶，s1 更新
        session_repo.set_pinned("s2", True)
        session_repo.update_updated_at("s1", datetime.now(timezone.utc).isoformat())

        sessions = session_repo.list_sessions()
        assert len(sessions) == 3
        # s2 置顶，应该排在最前面
        assert sessions[0].id == "s2"
        # s1 最晚更新，应该在未置顶中排第一
        assert sessions[1].id == "s1"
        assert sessions[2].id == "s3"
