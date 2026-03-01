"""消息搜索功能测试。"""
import pytest
from pathlib import Path
import tempfile
import os

from src.persistence.message_repo import SqliteMessageRepository
from src.persistence.models import Message


@pytest.fixture
def temp_db():
    """创建临时数据库。"""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield path
    os.unlink(path)


@pytest.fixture
def repo(temp_db):
    """创建测试用的 MessageRepository。"""
    return SqliteMessageRepository(db_path=temp_db)


class TestMessageSearch:
    """消息搜索测试。"""

    def test_search_empty_query_returns_empty(self, repo):
        """空搜索词应返回空结果。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="Hello world", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="assistant", content="Hi there", created_at="2024-01-01T00:01:00Z"))

        result = repo.search(sid, "")
        assert result == []

    def test_search_by_content_case_insensitive(self, repo):
        """搜索应不区分大小写。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="Hello World", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="assistant", content="hello there", created_at="2024-01-01T00:01:00Z"))
        repo.append(Message(id="m3", session_id=sid, role="user", content="Goodbye", created_at="2024-01-01T00:02:00Z"))

        # 搜索 "hello" 应该匹配两条消息
        result = repo.search(sid, "hello")
        assert len(result) == 2
        assert {m.id for m in result} == {"m1", "m2"}

        # 搜索 "HELLO" (大写) 也应该匹配两条消息
        result = repo.search(sid, "HELLO")
        assert len(result) == 2
        assert {m.id for m in result} == {"m1", "m2"}

    def test_search_partial_match(self, repo):
        """搜索应支持部分匹配。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="The quick brown fox", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="assistant", content="jumps over the lazy dog", created_at="2024-01-01T00:01:00Z"))

        # 搜索 "quick" 应该匹配第一条
        result = repo.search(sid, "quick")
        assert len(result) == 1
        assert result[0].id == "m1"

        # 搜索 "the" 应该匹配两条（不区分大小写）
        result = repo.search(sid, "the")
        assert len(result) == 2

    def test_search_only_in_specified_session(self, repo):
        """搜索应只在指定会话中进行。"""
        sid1 = "session-1"
        sid2 = "session-2"
        repo.append(Message(id="m1", session_id=sid1, role="user", content="unique keyword", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid2, role="user", content="unique keyword", created_at="2024-01-01T00:01:00Z"))

        # 在 session-1 中搜索只应返回 m1
        result = repo.search(sid1, "unique")
        assert len(result) == 1
        assert result[0].id == "m1"

        # 在 session-2 中搜索只应返回 m2
        result = repo.search(sid2, "unique")
        assert len(result) == 1
        assert result[0].id == "m2"

    def test_search_no_match_returns_empty(self, repo):
        """无匹配时应返回空列表。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="Hello world", created_at="2024-01-01T00:00:00Z"))

        result = repo.search(sid, "nonexistent")
        assert result == []

    def test_search_with_chinese_characters(self, repo):
        """搜索应支持中文。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="你好世界", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="assistant", content="这是一个测试", created_at="2024-01-01T00:01:00Z"))

        # 搜索中文
        result = repo.search(sid, "你好")
        assert len(result) == 1
        assert result[0].id == "m1"

        result = repo.search(sid, "测试")
        assert len(result) == 1
        assert result[0].id == "m2"

    def test_search_results_ordered_by_time(self, repo):
        """搜索结果应按时间顺序返回。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="keyword 1", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m3", session_id=sid, role="user", content="keyword 3", created_at="2024-01-01T00:02:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="user", content="keyword 2", created_at="2024-01-01T00:01:00Z"))

        result = repo.search(sid, "keyword")
        assert len(result) == 3
        assert result[0].id == "m1"
        assert result[1].id == "m2"
        assert result[2].id == "m3"

    def test_search_with_start_date(self, repo):
        """搜索应支持起始日期过滤。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="hello world", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="assistant", content="hello there", created_at="2024-01-05T00:00:00Z"))
        repo.append(Message(id="m3", session_id=sid, role="user", content="hello again", created_at="2024-01-10T00:00:00Z"))

        # 搜索从 2024-01-05 开始的消息
        result = repo.search(sid, "hello", start_date="2024-01-05T00:00:00Z")
        assert len(result) == 2
        assert {m.id for m in result} == {"m2", "m3"}

    def test_search_with_end_date(self, repo):
        """搜索应支持结束日期过滤。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="hello world", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="assistant", content="hello there", created_at="2024-01-05T00:00:00Z"))
        repo.append(Message(id="m3", session_id=sid, role="user", content="hello again", created_at="2024-01-10T00:00:00Z"))

        # 搜索到 2024-01-05 为止的消息
        result = repo.search(sid, "hello", end_date="2024-01-05T23:59:59Z")
        assert len(result) == 2
        assert {m.id for m in result} == {"m1", "m2"}

    def test_search_with_date_range(self, repo):
        """搜索应支持日期范围过滤。"""
        sid = "session-1"
        repo.append(Message(id="m1", session_id=sid, role="user", content="hello world", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid, role="assistant", content="hello there", created_at="2024-01-05T00:00:00Z"))
        repo.append(Message(id="m3", session_id=sid, role="user", content="hello again", created_at="2024-01-10T00:00:00Z"))
        repo.append(Message(id="m4", session_id=sid, role="assistant", content="hello once more", created_at="2024-01-15T00:00:00Z"))

        # 搜索 2024-01-03 到 2024-01-12 之间的消息
        result = repo.search(sid, "hello", start_date="2024-01-03T00:00:00Z", end_date="2024-01-12T23:59:59Z")
        assert len(result) == 2
        assert {m.id for m in result} == {"m2", "m3"}

    def test_search_all_with_date_range(self, repo):
        """全局搜索应支持日期范围过滤。"""
        sid1 = "session-1"
        sid2 = "session-2"
        repo.append(Message(id="m1", session_id=sid1, role="user", content="keyword", created_at="2024-01-01T00:00:00Z"))
        repo.append(Message(id="m2", session_id=sid1, role="assistant", content="keyword", created_at="2024-01-05T00:00:00Z"))
        repo.append(Message(id="m3", session_id=sid2, role="user", content="keyword", created_at="2024-01-10T00:00:00Z"))
        repo.append(Message(id="m4", session_id=sid2, role="assistant", content="keyword", created_at="2024-01-15T00:00:00Z"))

        # 搜索 2024-01-05 到 2024-01-12 之间的消息
        result = repo.search_all("keyword", limit=100, start_date="2024-01-05T00:00:00Z", end_date="2024-01-12T23:59:59Z")
        assert len(result) == 2
        assert {m.id for m in result} == {"m2", "m3"}
