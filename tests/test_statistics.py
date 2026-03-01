"""会话统计模块测试。"""
import pytest
from datetime import datetime, timezone, timedelta

from src.app.statistics import (
    SessionStats,
    calculate_session_stats,
    _count_words,
    _format_timestamp,
)
from src.persistence import Session, Message


class TestCountWords:
    """字数统计函数测试。"""

    def test_empty_string(self):
        """测试空字符串。"""
        assert _count_words("") == 0
        assert _count_words("   ") == 0
        assert _count_words(None) == 0

    def test_english_only(self):
        """测试纯英文。"""
        assert _count_words("hello") == 1
        assert _count_words("hello world") == 2
        assert _count_words("hello, world!") == 2
        assert _count_words("The quick brown fox") == 4

    def test_chinese_only(self):
        """测试纯中文。"""
        assert _count_words("你好") == 2
        assert _count_words("你好世界") == 4
        assert _count_words("我是中国人") == 5

    def test_mixed(self):
        """测试中英文混合。"""
        assert _count_words("hello你好") == 3  # 1 英文单词 + 2 中文字符
        assert _count_words("hello world 你好") == 4  # 2 英文单词 + 2 中文字符

    def test_markdown(self):
        """测试 Markdown 符号被忽略。"""
        assert _count_words("# Title") == 1  # # 被替换为空格，Title 算 1 个单词
        assert _count_words("**bold** text") == 2  # ** 不算，bold + text
        assert _count_words("*italic*") == 1
        assert _count_words("`code`") == 1
        assert _count_words("- list item") == 2


class TestFormatTimestamp:
    """时间格式化测试。"""

    def test_none_input(self):
        """测试 None 输入。"""
        assert _format_timestamp(None) is None

    def test_valid_iso_format(self):
        """测试有效 ISO 格式。"""
        result = _format_timestamp("2025-03-01T10:30:00Z")
        assert result == "2025-03-01 10:30"

    def test_iso_with_offset(self):
        """测试带时区偏移的 ISO 格式。"""
        result = _format_timestamp("2025-03-01T10:30:00+08:00")
        assert result == "2025-03-01 10:30"


class TestCalculateSessionStats:
    """会话统计计算测试。"""

    def test_empty_session(self):
        """测试空会话。"""
        session = Session(
            id="s1",
            title="测试会话",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        stats = calculate_session_stats(session, [])

        assert stats.session_id == "s1"
        assert stats.session_title == "测试会话"
        assert stats.word_count_user == 0
        assert stats.word_count_ai == 0
        assert stats.word_count_total == 0
        assert stats.message_count_user == 0
        assert stats.message_count_ai == 0
        assert stats.message_count_total == 0
        assert stats.duration_minutes == 0.0
        assert stats.first_message_time is None
        assert stats.last_message_time is None
        assert not stats.has_data

    def test_single_user_message(self):
        """测试单条用户消息。"""
        session = Session(
            id="s1",
            title="测试会话",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="你好世界",
                created_at="2025-03-01T10:05:00Z",
            )
        ]
        stats = calculate_session_stats(session, messages)

        assert stats.word_count_user == 4  # 4 个中文字符
        assert stats.word_count_ai == 0
        assert stats.word_count_total == 4
        assert stats.message_count_user == 1
        assert stats.message_count_ai == 0
        assert stats.message_count_total == 1
        assert stats.duration_minutes == 0.0  # 单条消息时长为 0
        assert stats.has_data

    def test_user_and_ai_messages(self):
        """测试用户和 AI 消息。"""
        session = Session(
            id="s1",
            title="测试会话",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="你好",
                created_at="2025-03-01T10:00:00Z",
            ),
            Message(
                id="m2",
                session_id="s1",
                role="assistant",
                content="你好！很高兴见到你。",
                created_at="2025-03-01T10:01:00Z",
            ),
        ]
        stats = calculate_session_stats(session, messages)

        assert stats.word_count_user == 2  # "你好"
        assert stats.word_count_ai == 8  # "你好！很高兴见到你。" 标点符号不算
        assert stats.message_count_user == 1
        assert stats.message_count_ai == 1
        assert stats.message_count_total == 2
        assert stats.duration_minutes == 1.0  # 1 分钟
        assert stats.has_data

    def test_mixed_content(self):
        """测试中英文混合内容。"""
        session = Session(
            id="s1",
            title="测试会话",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="Hello 你好",
                created_at="2025-03-01T10:00:00Z",
            ),
        ]
        stats = calculate_session_stats(session, messages)

        # "Hello" 是 1 个英文单词，"你好" 是 2 个中文字符
        assert stats.word_count_user == 3

    def test_duration_calculation(self):
        """测试时长计算。"""
        session = Session(
            id="s1",
            title="测试会话",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        start_time = "2025-03-01T10:00:00Z"
        end_time = "2025-03-01T12:30:00Z"  # 2.5 小时后
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="开始",
                created_at=start_time,
            ),
            Message(
                id="m2",
                session_id="s1",
                role="assistant",
                content="结束",
                created_at=end_time,
            ),
        ]
        stats = calculate_session_stats(session, messages)

        assert stats.duration_minutes == 150.0  # 2.5 小时 = 150 分钟

    def test_unordered_messages(self):
        """测试无序消息（应按时间排序）。"""
        session = Session(
            id="s1",
            title="测试会话",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        messages = [
            Message(
                id="m2",
                session_id="s1",
                role="assistant",
                content="回复",
                created_at="2025-03-01T10:02:00Z",
            ),
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="问题",
                created_at="2025-03-01T10:00:00Z",
            ),
        ]
        stats = calculate_session_stats(session, messages)

        # 应该按时间排序，第一条是用户消息
        assert stats.first_message_time == "2025-03-01 10:00"
        assert stats.last_message_time == "2025-03-01 10:02"
        assert stats.duration_minutes == 2.0

    def test_default_session_title(self):
        """测试默认会话标题。"""
        session = Session(
            id="s1",
            title="",  # 空标题
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        stats = calculate_session_stats(session, [])

        assert stats.session_title == "未命名会话"

    def test_markdown_content_counting(self):
        """测试 Markdown 内容的字数统计。"""
        session = Session(
            id="s1",
            title="测试",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="# 标题\n**粗体**和*斜体*",
                created_at="2025-03-01T10:00:00Z",
            ),
        ]
        stats = calculate_session_stats(session, messages)

        # Markdown 符号被忽略，只统计实际内容
        assert stats.word_count_user > 0


class TestSessionStats:
    """SessionStats 数据类测试。"""

    def test_duration_formatted_less_than_minute(self):
        """测试小于 1 分钟的时长格式化。"""
        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=0,
            word_count_ai=0,
            word_count_total=0,
            message_count_user=0,
            message_count_ai=0,
            message_count_total=0,
            duration_minutes=0.5,
            first_message_time=None,
            last_message_time=None,
        )
        assert stats.duration_formatted == "< 1 分钟"

    def test_duration_formatted_minutes(self):
        """测试分钟格式化。"""
        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=0,
            word_count_ai=0,
            word_count_total=0,
            message_count_user=0,
            message_count_ai=0,
            message_count_total=0,
            duration_minutes=45,
            first_message_time=None,
            last_message_time=None,
        )
        assert stats.duration_formatted == "45 分钟"

    def test_duration_formatted_hours(self):
        """测试小时格式化。"""
        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=0,
            word_count_ai=0,
            word_count_total=0,
            message_count_user=0,
            message_count_ai=0,
            message_count_total=0,
            duration_minutes=120,
            first_message_time=None,
            last_message_time=None,
        )
        assert stats.duration_formatted == "2 小时"

    def test_duration_formatted_hours_and_minutes(self):
        """测试小时和分钟格式化。"""
        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=0,
            word_count_ai=0,
            word_count_total=0,
            message_count_user=0,
            message_count_ai=0,
            message_count_total=0,
            duration_minutes=150,
            first_message_time=None,
            last_message_time=None,
        )
        assert stats.duration_formatted == "2 小时 30 分钟"

    def test_has_data(self):
        """测试 has_data 属性。"""
        stats_empty = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=0,
            word_count_ai=0,
            word_count_total=0,
            message_count_user=0,
            message_count_ai=0,
            message_count_total=0,
            duration_minutes=0,
            first_message_time=None,
            last_message_time=None,
        )
        assert not stats_empty.has_data

        stats_with_data = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=10,
            word_count_ai=5,
            word_count_total=15,
            message_count_user=1,
            message_count_ai=1,
            message_count_total=2,
            duration_minutes=1,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 10:01",
        )
        assert stats_with_data.has_data
