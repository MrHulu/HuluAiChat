"""会话统计模块测试。"""
import pytest
from datetime import datetime, timezone, timedelta, date

from src.app.statistics import (
    SessionStats,
    DayStats,
    calculate_session_stats,
    _calculate_daily_stats,
    _count_words,
    _format_timestamp,
    GlobalStats,
    GlobalDayStats,
    calculate_global_stats,
    export_session_stats_json,
    export_session_stats_csv,
    export_session_stats_txt,
    export_global_stats_json,
    export_global_stats_csv,
    export_global_stats_txt,
    save_session_stats,
    save_global_stats,
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


class TestDayStats:
    """DayStats 数据类测试。"""

    def test_get_day_label(self):
        """测试日期标签。"""
        day = DayStats(date=date(2025, 3, 1))
        assert day.get_day_label() == "03-01"

    def test_get_weekday(self):
        """测试星期标签。"""
        day = DayStats(date=date(2025, 3, 1))  # 2025-03-01 是周六
        assert day.get_weekday() == "周六"


class TestCalculateDailyStats:
    """每日统计计算测试。"""

    def test_empty_messages(self):
        """测试空消息列表。"""
        stats = _calculate_daily_stats([])
        assert stats == []

    def test_single_day_messages(self):
        """测试单日消息。"""
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
                content="你好！",
                created_at="2025-03-01T10:01:00Z",
            ),
        ]
        stats = _calculate_daily_stats(messages)

        assert len(stats) == 1
        assert stats[0].date == date(2025, 3, 1)
        assert stats[0].message_count == 2
        assert stats[0].word_count == 4  # "你好" 2 + "你好！" 2

    def test_multiple_days(self):
        """测试多日消息。"""
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="第一天",
                created_at="2025-03-01T10:00:00Z",
            ),
            Message(
                id="m2",
                session_id="s1",
                role="user",
                content="第二天",
                created_at="2025-03-02T10:00:00Z",
            ),
        ]
        stats = _calculate_daily_stats(messages)

        assert len(stats) == 2
        assert stats[0].date == date(2025, 3, 1)
        assert stats[1].date == date(2025, 3, 2)

    def test_sorted_by_date(self):
        """测试按日期排序。"""
        messages = [
            Message(
                id="m3",
                session_id="s1",
                role="user",
                content="第三天",
                created_at="2025-03-03T10:00:00Z",
            ),
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="第一天",
                created_at="2025-03-01T10:00:00Z",
            ),
            Message(
                id="m2",
                session_id="s1",
                role="user",
                content="第二天",
                created_at="2025-03-02T10:00:00Z",
            ),
        ]
        stats = _calculate_daily_stats(messages)

        assert len(stats) == 3
        assert stats[0].date == date(2025, 3, 1)
        assert stats[1].date == date(2025, 3, 2)
        assert stats[2].date == date(2025, 3, 3)

    def test_invalid_timestamp(self):
        """测试无效时间戳处理。"""
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="有效",
                created_at="2025-03-01T10:00:00Z",
            ),
            Message(
                id="m2",
                session_id="s1",
                role="user",
                content="无效",
                created_at="invalid-timestamp",
            ),
        ]
        stats = _calculate_daily_stats(messages)

        assert len(stats) == 1
        assert stats[0].date == date(2025, 3, 1)
        assert stats[0].message_count == 1


class TestSessionStatsDaily:
    """SessionStats 每日统计集成测试。"""

    def test_daily_stats_in_session_stats(self):
        """测试 SessionStats 包含每日统计。"""
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
                content="第一天",
                created_at="2025-03-01T10:00:00Z",
            ),
            Message(
                id="m2",
                session_id="s1",
                role="user",
                content="第二天",
                created_at="2025-03-02T10:00:00Z",
            ),
        ]
        stats = calculate_session_stats(session, messages)

        assert len(stats.daily_stats) == 2
        assert stats.daily_stats[0].date == date(2025, 3, 1)
        assert stats.daily_stats[1].date == date(2025, 3, 2)

    def test_empty_session_has_empty_daily_stats(self):
        """测试空会话的每日统计为空。"""
        session = Session(
            id="s1",
            title="测试",
            created_at="2025-03-01T10:00:00Z",
            updated_at="2025-03-01T10:00:00Z",
        )
        stats = calculate_session_stats(session, [])

        assert stats.daily_stats == []


class TestGlobalDayStats:
    """全局每日统计数据类测试。"""

    def test_get_day_label(self):
        """测试日期标签。"""
        day = GlobalDayStats(date=date(2025, 3, 1))
        assert day.get_day_label() == "03-01"

    def test_get_weekday(self):
        """测试星期标签。"""
        day = GlobalDayStats(date=date(2025, 3, 1))  # 2025-03-01 是周六
        assert day.get_weekday() == "周六"


class TestGlobalStats:
    """GlobalStats 数据类测试。"""

    def test_avg_messages_per_session_empty(self):
        """测试空会话时平均消息数为 0。"""
        stats = GlobalStats(
            total_sessions=0,
            total_messages=0,
            total_words=0,
            word_count_user=0,
            word_count_ai=0,
            message_count_user=0,
            message_count_ai=0,
            first_message_time=None,
            last_message_time=None,
            duration_total_minutes=0.0,
            active_days=0,
        )
        assert stats.avg_messages_per_session == 0.0

    def test_avg_messages_per_session(self):
        """测试平均每会话消息数计算。"""
        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time=None,
            last_message_time=None,
            duration_total_minutes=0.0,
            active_days=0,
        )
        assert stats.avg_messages_per_session == 20.0

    def test_avg_messages_per_day_empty(self):
        """测试无活跃天数时平均消息数为 0。"""
        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time=None,
            last_message_time=None,
            duration_total_minutes=0.0,
            active_days=0,
        )
        assert stats.avg_messages_per_day == 0.0

    def test_avg_messages_per_day(self):
        """测试平均每日消息数计算。"""
        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time=None,
            last_message_time=None,
            duration_total_minutes=0.0,
            active_days=10,
        )
        assert stats.avg_messages_per_day == 10.0

    def test_message_count_total(self):
        """测试总消息数计算。"""
        stats = GlobalStats(
            total_sessions=1,
            total_messages=0,
            total_words=0,
            word_count_user=30,
            word_count_ai=20,
            message_count_user=3,
            message_count_ai=2,
            first_message_time=None,
            last_message_time=None,
            duration_total_minutes=0.0,
            active_days=1,
        )
        assert stats.message_count_total == 5

    def test_duration_formatted(self):
        """测试时长格式化。"""
        stats = GlobalStats(
            total_sessions=1,
            total_messages=10,
            total_words=100,
            word_count_user=50,
            word_count_ai=50,
            message_count_user=5,
            message_count_ai=5,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 12:30",
            duration_total_minutes=150.0,
            active_days=1,
        )
        assert stats.duration_formatted == "2 小时 30 分钟"

    def test_has_data(self):
        """测试 has_data 属性。"""
        stats_empty = GlobalStats(
            total_sessions=0,
            total_messages=0,
            total_words=0,
            word_count_user=0,
            word_count_ai=0,
            message_count_user=0,
            message_count_ai=0,
            first_message_time=None,
            last_message_time=None,
            duration_total_minutes=0.0,
            active_days=0,
        )
        assert not stats_empty.has_data

        stats_with_data = GlobalStats(
            total_sessions=1,
            total_messages=10,
            total_words=100,
            word_count_user=50,
            word_count_ai=50,
            message_count_user=5,
            message_count_ai=5,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 12:00",
            duration_total_minutes=120.0,
            active_days=1,
        )
        assert stats_with_data.has_data


class TestCalculateGlobalStats:
    """全局统计计算测试。"""

    def test_empty_data(self):
        """测试空数据。"""
        stats = calculate_global_stats([], [])

        assert stats.total_sessions == 0
        assert stats.total_messages == 0
        assert stats.total_words == 0
        assert stats.active_days == 0
        assert stats.daily_stats == []
        assert stats.top_sessions == []
        assert not stats.has_data

    def test_sessions_but_no_messages(self):
        """测试有会话但无消息。"""
        sessions = [
            Session(
                id="s1",
                title="会话1",
                created_at="2025-03-01T10:00:00Z",
                updated_at="2025-03-01T10:00:00Z",
            ),
            Session(
                id="s2",
                title="会话2",
                created_at="2025-03-01T10:00:00Z",
                updated_at="2025-03-01T10:00:00Z",
            ),
        ]
        stats = calculate_global_stats(sessions, [])

        assert stats.total_sessions == 2
        assert stats.total_messages == 0
        assert not stats.has_data

    def test_single_session_single_message(self):
        """测试单会话单消息。"""
        sessions = [
            Session(
                id="s1",
                title="测试会话",
                created_at="2025-03-01T10:00:00Z",
                updated_at="2025-03-01T10:00:00Z",
            )
        ]
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="你好",
                created_at="2025-03-01T10:00:00Z",
            )
        ]
        stats = calculate_global_stats(sessions, messages)

        assert stats.total_sessions == 1
        assert stats.message_count_user == 1
        assert stats.message_count_ai == 0
        assert stats.message_count_total == 1
        assert stats.word_count_user == 2  # "你好" 2 个中文字符
        assert stats.active_days == 1
        assert len(stats.daily_stats) == 1
        assert stats.has_data

    def test_multiple_sessions(self):
        """测试多会话统计。"""
        sessions = [
            Session(
                id="s1",
                title="会话1",
                created_at="2025-03-01T10:00:00Z",
                updated_at="2025-03-01T10:00:00Z",
            ),
            Session(
                id="s2",
                title="会话2",
                created_at="2025-03-01T11:00:00Z",
                updated_at="2025-03-01T11:00:00Z",
            ),
        ]
        messages = [
            Message(
                id="m1",
                session_id="s1",
                role="user",
                content="消息1",
                created_at="2025-03-01T10:00:00Z",
            ),
            Message(
                id="m2",
                session_id="s1",
                role="assistant",
                content="回复1",
                created_at="2025-03-01T10:01:00Z",
            ),
            Message(
                id="m3",
                session_id="s2",
                role="user",
                content="消息2",
                created_at="2025-03-02T10:00:00Z",
            ),
        ]
        stats = calculate_global_stats(sessions, messages)

        assert stats.total_sessions == 2
        assert stats.message_count_total == 3
        assert stats.message_count_user == 2
        assert stats.message_count_ai == 1
        assert stats.active_days == 2  # 两天有活动
        assert len(stats.daily_stats) == 2
        assert stats.daily_stats[0].date == date(2025, 3, 1)
        assert stats.daily_stats[0].message_count == 2
        assert stats.daily_stats[0].session_count == 1  # 第一天只有 s1
        assert stats.daily_stats[1].date == date(2025, 3, 2)
        assert stats.daily_stats[1].message_count == 1

    def test_top_sessions_ordering(self):
        """测试热门会话排序。"""
        sessions = [
            Session(
                id="s1",
                title="热门会话",
                created_at="2025-03-01T10:00:00Z",
                updated_at="2025-03-01T10:00:00Z",
            ),
            Session(
                id="s2",
                title="普通会话",
                created_at="2025-03-01T10:00:00Z",
                updated_at="2025-03-01T10:00:00Z",
            ),
            Session(
                id="s3",
                title="冷门会话",
                created_at="2025-03-01T10:00:00Z",
                updated_at="2025-03-01T10:00:00Z",
            ),
        ]
        messages = []
        # s1 有 10 条消息
        for i in range(10):
            messages.append(
                Message(
                    id=f"m1_{i}",
                    session_id="s1",
                    role="user",
                    content=f"消息{i}",
                    created_at="2025-03-01T10:00:00Z",
                )
            )
        # s2 有 5 条消息
        for i in range(5):
            messages.append(
                Message(
                    id=f"m2_{i}",
                    session_id="s2",
                    role="user",
                    content=f"消息{i}",
                    created_at="2025-03-01T10:00:00Z",
                )
            )
        # s3 有 1 条消息
        messages.append(
            Message(
                id="m3_1",
                session_id="s3",
                role="user",
                content="消息",
                created_at="2025-03-01T10:00:00Z",
            )
        )

        stats = calculate_global_stats(sessions, messages)

        assert len(stats.top_sessions) == 3
        assert stats.top_sessions[0][0] == "s1"  # 第一名
        assert stats.top_sessions[0][2] == 10
        assert stats.top_sessions[1][0] == "s2"  # 第二名
        assert stats.top_sessions[1][2] == 5
        assert stats.top_sessions[2][0] == "s3"  # 第三名
        assert stats.top_sessions[2][2] == 1

    def test_top_sessions_max_five(self):
        """测试热门会话最多显示 5 个。"""
        sessions = [Session(id=f"s{i}", title=f"会话{i}", created_at="2025-03-01T10:00:00Z", updated_at="2025-03-01T10:00:00Z") for i in range(10)]
        messages = []
        for i in range(10):
            messages.append(
                Message(
                    id=f"m{i}",
                    session_id=f"s{i}",
                    role="user",
                    content="消息",
                    created_at="2025-03-01T10:00:00Z",
                )
            )

        stats = calculate_global_stats(sessions, messages)

        assert len(stats.top_sessions) == 5  # 最多 5 个

    def test_daily_stats_session_count(self):
        """测试每日统计中的会话数。"""
        sessions = [
            Session(id="s1", title="会话1", created_at="2025-03-01T10:00:00Z", updated_at="2025-03-01T10:00:00Z"),
            Session(id="s2", title="会话2", created_at="2025-03-01T10:00:00Z", updated_at="2025-03-01T10:00:00Z"),
        ]
        messages = [
            Message(id="m1", session_id="s1", role="user", content="消息1", created_at="2025-03-01T10:00:00Z"),
            Message(id="m2", session_id="s1", role="assistant", content="回复1", created_at="2025-03-01T10:01:00Z"),
            Message(id="m3", session_id="s2", role="user", content="消息2", created_at="2025-03-01T10:02:00Z"),
        ]
        stats = calculate_global_stats(sessions, messages)

        assert stats.daily_stats[0].session_count == 2  # 第一天有 2 个会话活动

    def test_time_range_calculation(self):
        """测试时间范围计算。"""
        sessions = [
            Session(id="s1", title="会话1", created_at="2025-03-01T10:00:00Z", updated_at="2025-03-01T10:00:00Z"),
        ]
        messages = [
            Message(id="m1", session_id="s1", role="user", content="开始", created_at="2025-03-01T10:00:00Z"),
            Message(id="m2", session_id="s1", role="assistant", content="结束", created_at="2025-03-01T12:30:00Z"),
        ]
        stats = calculate_global_stats(sessions, messages)

        assert stats.first_message_time == "2025-03-01 10:00"
        assert stats.last_message_time == "2025-03-01 12:30"
        assert stats.duration_total_minutes == 150.0  # 2.5 小时


class TestExportSessionStats:
    """会话统计导出功能测试。"""

    def test_export_session_stats_json(self):
        """测试导出会话统计为 JSON。"""
        from src.app.statistics import export_session_stats_json

        stats = SessionStats(
            session_id="s1",
            session_title="测试会话",
            word_count_user=100,
            word_count_ai=200,
            word_count_total=300,
            message_count_user=5,
            message_count_ai=3,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 11:00",
            daily_stats=[],
        )

        result = export_session_stats_json(stats)

        assert '"session"' in result
        assert '"测试会话"' in result
        assert '"word_count_total": 300' in result
        assert '"message_count_total": 8' in result

    def test_export_session_stats_csv(self):
        """测试导出会话统计为 CSV。"""
        from src.app.statistics import export_session_stats_csv

        stats = SessionStats(
            session_id="s1",
            session_title="测试会话",
            word_count_user=100,
            word_count_ai=200,
            word_count_total=300,
            message_count_user=5,
            message_count_ai=3,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 11:00",
            daily_stats=[],
        )

        result = export_session_stats_csv(stats)

        assert "统计项,数值" in result
        assert "会话ID,s1" in result
        assert "测试会话" in result
        assert "总字数,300" in result
        assert "总消息数,8" in result

    def test_export_session_stats_txt(self):
        """测试导出会话统计为 TXT。"""
        from src.app.statistics import export_session_stats_txt

        stats = SessionStats(
            session_id="s1",
            session_title="测试会话",
            word_count_user=100,
            word_count_ai=200,
            word_count_total=300,
            message_count_user=5,
            message_count_ai=3,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 11:00",
            daily_stats=[],
        )

        result = export_session_stats_txt(stats)

        assert "会话统计 - 测试会话" in result
        assert "总字数: 300" in result
        assert "总消息数: 8" in result

    def test_export_session_stats_with_daily_stats(self):
        """测试导出包含每日统计的数据。"""
        from src.app.statistics import export_session_stats_json

        daily_stats = [
            DayStats(date=date(2025, 3, 1), message_count=5, word_count=100),
            DayStats(date=date(2025, 3, 2), message_count=3, word_count=50),
        ]
        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=150,
            word_count_ai=0,
            word_count_total=150,
            message_count_user=8,
            message_count_ai=0,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-02 11:00",
            daily_stats=daily_stats,
        )

        result = export_session_stats_json(stats)

        assert '"daily_stats"' in result
        assert '"message_count": 5' in result
        assert '"message_count": 3' in result


class TestExportGlobalStats:
    """全局统计导出功能测试。"""

    def test_export_global_stats_json(self):
        """测试导出全局统计为 JSON。"""
        from src.app.statistics import export_global_stats_json

        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-05 11:00",
            duration_total_minutes=600.0,
            active_days=5,
            daily_stats=[],
            top_sessions=[],
        )

        result = export_global_stats_json(stats)

        assert '"summary"' in result
        assert '"total_sessions": 5' in result
        assert '"total_messages": 100' in result
        assert '"total_words": 1000' in result
        assert '"active_days": 5' in result

    def test_export_global_stats_csv(self):
        """测试导出全局统计为 CSV。"""
        from src.app.statistics import export_global_stats_csv

        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-05 11:00",
            duration_total_minutes=600.0,
            active_days=5,
            daily_stats=[],
            top_sessions=[("s1", "会话1", 10), ("s2", "会话2", 5)],
        )

        result = export_global_stats_csv(stats)

        assert "统计项,数值" in result
        assert "总会话数,5" in result
        assert "总消息数,100" in result
        assert "热门会话" in result
        assert "会话1,10" in result

    def test_export_global_stats_txt(self):
        """测试导出全局统计为 TXT。"""
        from src.app.statistics import export_global_stats_txt

        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-05 11:00",
            duration_total_minutes=600.0,
            active_days=5,
            daily_stats=[],
            top_sessions=[],
        )

        result = export_global_stats_txt(stats)

        assert "全局统计报告" in result
        assert "会话数: 5" in result
        assert "总消息数: 100" in result
        assert "活跃天数: 5" in result

    def test_export_global_stats_with_daily_stats(self):
        """测试导出包含每日统计的全局数据。"""
        from src.app.statistics import export_global_stats_json

        daily_stats = [
            GlobalDayStats(date=date(2025, 3, 1), message_count=20, word_count=200, session_count=2),
            GlobalDayStats(date=date(2025, 3, 2), message_count=15, word_count=150, session_count=1),
        ]
        stats = GlobalStats(
            total_sessions=2,
            total_messages=35,
            total_words=350,
            word_count_user=175,
            word_count_ai=175,
            message_count_user=18,
            message_count_ai=17,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-02 11:00",
            duration_total_minutes=150.0,
            active_days=2,
            daily_stats=daily_stats,
            top_sessions=[],
        )

        result = export_global_stats_json(stats)

        assert '"daily_stats"' in result
        assert '"session_count": 2' in result
        assert '"session_count": 1' in result


class TestSaveStats:
    """统计保存功能测试。"""

    def test_save_session_stats_json(self, tmp_path):
        """测试保存会话统计为 JSON 文件。"""
        from src.app.statistics import save_session_stats

        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=100,
            word_count_ai=200,
            word_count_total=300,
            message_count_user=5,
            message_count_ai=3,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 11:00",
            daily_stats=[],
        )

        file_path = tmp_path / "stats.json"
        save_session_stats(stats, str(file_path), "json")

        assert file_path.exists()
        content = file_path.read_text(encoding="utf-8")
        assert '"测试"' in content

    def test_save_session_stats_csv(self, tmp_path):
        """测试保存会话统计为 CSV 文件。"""
        from src.app.statistics import save_session_stats

        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=100,
            word_count_ai=200,
            word_count_total=300,
            message_count_user=5,
            message_count_ai=3,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 11:00",
            daily_stats=[],
        )

        file_path = tmp_path / "stats.csv"
        save_session_stats(stats, str(file_path), "csv")

        assert file_path.exists()
        content = file_path.read_text(encoding="utf-8-sig")
        assert "统计项" in content

    def test_save_session_stats_txt(self, tmp_path):
        """测试保存会话统计为 TXT 文件。"""
        from src.app.statistics import save_session_stats

        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=100,
            word_count_ai=200,
            word_count_total=300,
            message_count_user=5,
            message_count_ai=3,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 11:00",
            daily_stats=[],
        )

        file_path = tmp_path / "stats.txt"
        save_session_stats(stats, str(file_path), "txt")

        assert file_path.exists()
        content = file_path.read_text(encoding="utf-8")
        assert "会话统计" in content

    def test_save_session_stats_invalid_format(self, tmp_path):
        """测试保存会话统计使用不支持的格式。"""
        from src.app.statistics import save_session_stats
        import pytest

        stats = SessionStats(
            session_id="s1",
            session_title="测试",
            word_count_user=100,
            word_count_ai=200,
            word_count_total=300,
            message_count_user=5,
            message_count_ai=3,
            message_count_total=8,
            duration_minutes=60.0,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-01 11:00",
            daily_stats=[],
        )

        file_path = tmp_path / "stats.pdf"

        with pytest.raises(ValueError, match="Unsupported format"):
            save_session_stats(stats, str(file_path), "pdf")

    def test_save_global_stats_json(self, tmp_path):
        """测试保存全局统计为 JSON 文件。"""
        from src.app.statistics import save_global_stats

        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-05 11:00",
            duration_total_minutes=600.0,
            active_days=5,
            daily_stats=[],
            top_sessions=[],
        )

        file_path = tmp_path / "global.json"
        save_global_stats(stats, str(file_path), "json")

        assert file_path.exists()
        content = file_path.read_text(encoding="utf-8")
        assert '"total_sessions": 5' in content

    def test_save_global_stats_csv(self, tmp_path):
        """测试保存全局统计为 CSV 文件。"""
        from src.app.statistics import save_global_stats

        stats = GlobalStats(
            total_sessions=5,
            total_messages=100,
            total_words=1000,
            word_count_user=500,
            word_count_ai=500,
            message_count_user=50,
            message_count_ai=50,
            first_message_time="2025-03-01 10:00",
            last_message_time="2025-03-05 11:00",
            duration_total_minutes=600.0,
            active_days=5,
            daily_stats=[],
            top_sessions=[],
        )

        file_path = tmp_path / "global.csv"
        save_global_stats(stats, str(file_path), "csv")

        assert file_path.exists()
        content = file_path.read_text(encoding="utf-8-sig")
        assert "总会话数" in content
