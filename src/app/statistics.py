"""会话统计功能：计算和展示会话的使用数据。"""
import csv
import json
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from datetime import datetime, date
from io import StringIO
from pathlib import Path

from src.persistence import Message, Session, SessionRepository, MessageRepository


@dataclass
class GlobalDayStats:
    """全局单日统计数据（跨所有会话）。"""
    date: date
    message_count: int = 0
    word_count: int = 0
    session_count: int = 0  # 当天活跃的会话数

    def get_day_label(self) -> str:
        """获取日期标签（月-日）。"""
        return self.date.strftime("%m-%d")

    def get_weekday(self) -> str:
        """获取星期几（中文）。"""
        weekdays = ["一", "二", "三", "四", "五", "六", "日"]
        return f"周{weekdays[self.date.weekday()]}"


@dataclass
class GlobalStats:
    """全局统计数据（跨所有会话）。"""
    total_sessions: int
    total_messages: int
    total_words: int
    word_count_user: int
    word_count_ai: int
    message_count_user: int
    message_count_ai: int
    first_message_time: str | None
    last_message_time: str | None
    duration_total_minutes: float
    active_days: int  # 有活动的天数
    daily_stats: list[GlobalDayStats] = field(default_factory=list)
    top_sessions: list[tuple[str, str, int]] = field(default_factory=list)  # (session_id, title, msg_count)

    @property
    def avg_messages_per_session(self) -> float:
        """平均每会话消息数。"""
        if self.total_sessions == 0:
            return 0.0
        return round(self.message_count_total / self.total_sessions, 1)

    @property
    def avg_messages_per_day(self) -> float:
        """平均每日消息数。"""
        if self.active_days == 0:
            return 0.0
        return round(self.message_count_total / self.active_days, 1)

    @property
    def message_count_total(self) -> int:
        """总消息数。"""
        return self.message_count_user + self.message_count_ai

    @property
    def duration_formatted(self) -> str:
        """格式化总时长为易读字符串。"""
        if self.duration_total_minutes < 1:
            return "< 1 分钟"
        minutes = int(self.duration_total_minutes)
        if minutes < 60:
            return f"{minutes} 分钟"
        hours = minutes // 60
        mins = minutes % 60
        if mins == 0:
            return f"{hours} 小时"
        return f"{hours} 小时 {mins} 分钟"

    @property
    def has_data(self) -> bool:
        """是否有有效数据。"""
        return self.message_count_total > 0


@dataclass
class DayStats:
    """单日统计数据。"""
    date: date
    message_count: int = 0
    word_count: int = 0

    def get_day_label(self) -> str:
        """获取日期标签（月-日）。"""
        return self.date.strftime("%m-%d")

    def get_weekday(self) -> str:
        """获取星期几（中文）。"""
        weekdays = ["一", "二", "三", "四", "五", "六", "日"]
        return f"周{weekdays[self.date.weekday()]}"


@dataclass
class SessionStats:
    """会话统计数据。"""
    session_id: str
    session_title: str
    word_count_user: int
    word_count_ai: int
    word_count_total: int
    message_count_user: int
    message_count_ai: int
    message_count_total: int
    duration_minutes: float
    first_message_time: str | None
    last_message_time: str | None
    daily_stats: list[DayStats] = field(default_factory=list)

    @property
    def duration_formatted(self) -> str:
        """格式化时长为易读字符串。"""
        if self.duration_minutes < 1:
            return "< 1 分钟"
        minutes = int(self.duration_minutes)
        if minutes < 60:
            return f"{minutes} 分钟"
        hours = minutes // 60
        mins = minutes % 60
        if mins == 0:
            return f"{hours} 小时"
        return f"{hours} 小时 {mins} 分钟"

    @property
    def has_data(self) -> bool:
        """是否有有效数据。"""
        return self.message_count_total > 0


def _count_words(text: str) -> int:
    """统计文本中的字数（支持中英文）。"""
    if not text:
        return 0
    # 移除 Markdown 符号和多余空白
    import re
    cleaned = re.sub(r'[#*`_\-\[\](){}]', ' ', text)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if not cleaned:
        return 0
    # 统计中文字符
    chinese_chars = len(re.findall(r'[\u4e00-\u9fff]', cleaned))
    # 统计英文单词
    english_words = len(re.findall(r'[a-zA-Z]+', cleaned))
    return chinese_chars + english_words


def _format_timestamp(iso_time: str | None) -> str | None:
    """格式化时间戳为易读格式。"""
    if not iso_time:
        return None
    try:
        dt = datetime.fromisoformat(iso_time.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M')
    except (ValueError, AttributeError):
        return iso_time


def _calculate_daily_stats(messages: list[Message]) -> list[DayStats]:
    """计算每日统计数据。

    Args:
        messages: 消息列表

    Returns:
        按日期排序的每日统计列表
    """
    if not messages:
        return []

    # 按日期聚合
    daily_data: dict[date, DayStats] = {}

    for msg in messages:
        try:
            dt = datetime.fromisoformat(msg.created_at.replace('Z', '+00:00'))
            msg_date = dt.date()
            if msg_date not in daily_data:
                daily_data[msg_date] = DayStats(date=msg_date)
            daily_data[msg_date].message_count += 1
            daily_data[msg_date].word_count += _count_words(msg.content)
        except (ValueError, AttributeError):
            continue

    # 按日期排序
    return sorted(daily_data.values(), key=lambda s: s.date)


def calculate_session_stats(session: Session, messages: list[Message]) -> SessionStats:
    """计算会话统计数据。

    Args:
        session: 会话对象
        messages: 会话中的所有消息列表

    Returns:
        SessionStats: 统计数据对象
    """
    # 计算每日统计
    daily_stats = _calculate_daily_stats(messages)

    if not messages:
        return SessionStats(
            session_id=session.id,
            session_title=session.title or "未命名会话",
            word_count_user=0,
            word_count_ai=0,
            word_count_total=0,
            message_count_user=0,
            message_count_ai=0,
            message_count_total=0,
            duration_minutes=0.0,
            first_message_time=None,
            last_message_time=None,
            daily_stats=daily_stats,
        )

    # 按时间排序确保顺序正确
    sorted_messages = sorted(messages, key=lambda m: m.created_at)

    # 统计用户消息
    user_messages = [m for m in sorted_messages if m.role == "user"]
    word_count_user = sum(_count_words(m.content) for m in user_messages)
    message_count_user = len(user_messages)

    # 统计 AI 消息
    ai_messages = [m for m in sorted_messages if m.role == "assistant"]
    word_count_ai = sum(_count_words(m.content) for m in ai_messages)
    message_count_ai = len(ai_messages)

    # 总计
    word_count_total = word_count_user + word_count_ai
    message_count_total = len(sorted_messages)

    # 时间范围
    first_message_time = _format_timestamp(sorted_messages[0].created_at)
    last_message_time = _format_timestamp(sorted_messages[-1].created_at)

    # 计算时长（分钟）
    duration_minutes = 0.0
    if first_message_time and last_message_time and message_count_total > 1:
        try:
            start = datetime.fromisoformat(sorted_messages[0].created_at.replace('Z', '+00:00'))
            end = datetime.fromisoformat(sorted_messages[-1].created_at.replace('Z', '+00:00'))
            duration_minutes = (end - start).total_seconds() / 60
        except (ValueError, AttributeError):
            pass

    return SessionStats(
        session_id=session.id,
        session_title=session.title or "未命名会话",
        word_count_user=word_count_user,
        word_count_ai=word_count_ai,
        word_count_total=word_count_total,
        message_count_user=message_count_user,
        message_count_ai=message_count_ai,
        message_count_total=message_count_total,
        duration_minutes=duration_minutes,
        first_message_time=first_message_time,
        last_message_time=last_message_time,
        daily_stats=daily_stats,
    )


def calculate_global_stats(
    sessions: list[Session],
    all_messages: list[Message],
) -> GlobalStats:
    """计算全局统计数据（跨所有会话）。

    Args:
        sessions: 所有会话列表
        all_messages: 所有消息列表

    Returns:
        GlobalStats: 全局统计数据对象
    """
    total_sessions = len(sessions)

    if not all_messages:
        return GlobalStats(
            total_sessions=total_sessions,
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
            daily_stats=[],
            top_sessions=[],
        )

    # 按时间排序
    sorted_messages = sorted(all_messages, key=lambda m: m.created_at)

    # 统计用户和 AI 消息
    user_messages = [m for m in sorted_messages if m.role == "user"]
    ai_messages = [m for m in sorted_messages if m.role == "assistant"]

    word_count_user = sum(_count_words(m.content) for m in user_messages)
    word_count_ai = sum(_count_words(m.content) for m in ai_messages)
    message_count_user = len(user_messages)
    message_count_ai = len(ai_messages)
    total_messages = len(sorted_messages)
    total_words = word_count_user + word_count_ai

    # 时间范围
    first_message_time = _format_timestamp(sorted_messages[0].created_at)
    last_message_time = _format_timestamp(sorted_messages[-1].created_at)

    # 计算总时长（第一条消息到最后一条消息的时间跨度）
    duration_total_minutes = 0.0
    if first_message_time and last_message_time and len(sorted_messages) > 1:
        try:
            start = datetime.fromisoformat(sorted_messages[0].created_at.replace('Z', '+00:00'))
            end = datetime.fromisoformat(sorted_messages[-1].created_at.replace('Z', '+00:00'))
            duration_total_minutes = (end - start).total_seconds() / 60
        except (ValueError, AttributeError):
            pass

    # 计算每日统计
    daily_data: dict[date, GlobalDayStats] = {}
    session_counts_by_date: dict[date, set[str]] = defaultdict(set)

    for msg in sorted_messages:
        try:
            dt = datetime.fromisoformat(msg.created_at.replace('Z', '+00:00'))
            msg_date = dt.date()
            if msg_date not in daily_data:
                daily_data[msg_date] = GlobalDayStats(date=msg_date)
            daily_data[msg_date].message_count += 1
            daily_data[msg_date].word_count += _count_words(msg.content)
            session_counts_by_date[msg_date].add(msg.session_id)
        except (ValueError, AttributeError):
            continue

    # 更新每天的会话数
    for day_stat in daily_data.values():
        day_stat.session_count = len(session_counts_by_date[day_stat.date])

    daily_stats = sorted(daily_data.values(), key=lambda s: s.date)
    active_days = len(daily_stats)

    # 计算热门会话（消息数最多的前 5 个）
    session_msg_counts: dict[str, tuple[str, int]] = {}  # session_id -> (title, count)
    for session in sessions:
        count = sum(1 for m in all_messages if m.session_id == session.id)
        if count > 0:
            session_msg_counts[session.id] = (session.title or "未命名会话", count)

    top_sessions = sorted(
        session_msg_counts.items(),
        key=lambda x: x[1][1],
        reverse=True,
    )[:5]
    # 转换为 (session_id, title, count) 格式
    top_sessions = [(sid, title, count) for sid, (title, count) in top_sessions]

    return GlobalStats(
        total_sessions=total_sessions,
        total_messages=total_messages,
        total_words=total_words,
        word_count_user=word_count_user,
        word_count_ai=word_count_ai,
        message_count_user=message_count_user,
        message_count_ai=message_count_ai,
        first_message_time=first_message_time,
        last_message_time=last_message_time,
        duration_total_minutes=duration_total_minutes,
        active_days=active_days,
        daily_stats=daily_stats,
        top_sessions=top_sessions,
    )


# ============================================================================
# Statistics Export Functions
# ============================================================================

def export_session_stats_json(stats: SessionStats) -> str:
    """将会话统计数据导出为 JSON 格式。

    Args:
        stats: SessionStats 统计数据对象

    Returns:
        JSON 字符串
    """
    export_data = {
        "session": {
            "id": stats.session_id,
            "title": stats.session_title,
        },
        "statistics": {
            "word_count_total": stats.word_count_total,
            "word_count_user": stats.word_count_user,
            "word_count_ai": stats.word_count_ai,
            "message_count_total": stats.message_count_total,
            "message_count_user": stats.message_count_user,
            "message_count_ai": stats.message_count_ai,
            "duration_minutes": stats.duration_minutes,
            "duration_formatted": stats.duration_formatted,
        },
        "time_range": {
            "first_message": stats.first_message_time,
            "last_message": stats.last_message_time,
        },
        "daily_stats": [
            {
                "date": day.date.isoformat(),
                "day_label": day.get_day_label(),
                "weekday": day.get_weekday(),
                "message_count": day.message_count,
                "word_count": day.word_count,
            }
            for day in stats.daily_stats
        ],
    }
    return json.dumps(export_data, ensure_ascii=False, indent=2)


def export_session_stats_csv(stats: SessionStats) -> str:
    """将会话统计数据导出为 CSV 格式。

    Args:
        stats: SessionStats 统计数据对象

    Returns:
        CSV 字符串
    """
    output = StringIO()
    writer = csv.writer(output)

    # 写入概要统计
    writer.writerow(["统计项", "数值"])
    writer.writerow(["会话ID", stats.session_id])
    writer.writerow(["会话标题", stats.session_title])
    writer.writerow(["总字数", stats.word_count_total])
    writer.writerow(["用户字数", stats.word_count_user])
    writer.writerow(["AI字数", stats.word_count_ai])
    writer.writerow(["总消息数", stats.message_count_total])
    writer.writerow(["用户消息数", stats.message_count_user])
    writer.writerow(["AI消息数", stats.message_count_ai])
    writer.writerow(["时长(分钟)", stats.duration_minutes])
    writer.writerow(["时长格式化", stats.duration_formatted])
    writer.writerow(["开始时间", stats.first_message_time or ""])
    writer.writerow(["结束时间", stats.last_message_time or ""])

    # 写入每日统计
    if stats.daily_stats:
        writer.writerow([])
        writer.writerow(["每日统计"])
        writer.writerow(["日期", "星期", "消息数", "字数"])
        for day in stats.daily_stats:
            writer.writerow([
                day.date.isoformat(),
                day.get_weekday(),
                day.message_count,
                day.word_count,
            ])

    return output.getvalue()


def export_session_stats_txt(stats: SessionStats) -> str:
    """将会话统计数据导出为纯文本格式。

    Args:
        stats: SessionStats 统计数据对象

    Returns:
        文本字符串
    """
    lines = [
        "=" * 60,
        f"会话统计 - {stats.session_title}",
        "=" * 60,
        "",
        "📊 基本统计",
        "-" * 40,
        f"  会话ID: {stats.session_id}",
        f"  总字数: {stats.word_count_total:,} (用户: {stats.word_count_user:,}, AI: {stats.word_count_ai:,})",
        f"  总消息数: {stats.message_count_total} (用户: {stats.message_count_user}, AI: {stats.message_count_ai})",
        f"  时长: {stats.duration_formatted}",
        "",
        "⏱ 时间范围",
        "-" * 40,
    ]

    if stats.first_message_time:
        lines.append(f"  开始: {stats.first_message_time}")
    if stats.last_message_time:
        lines.append(f"  结束: {stats.last_message_time}")

    if stats.daily_stats:
        lines.extend([
            "",
            "📈 每日活动",
            "-" * 40,
        ])
        for day in stats.daily_stats:
            lines.append(f"  {day.date.isoformat} ({day.get_weekday()}): {day.message_count} 条消息, {day.word_count} 字")

    lines.append("")
    return "\n".join(lines)


def export_global_stats_json(stats: GlobalStats) -> str:
    """将全局统计数据导出为 JSON 格式。

    Args:
        stats: GlobalStats 统计数据对象

    Returns:
        JSON 字符串
    """
    export_data = {
        "summary": {
            "total_sessions": stats.total_sessions,
            "total_messages": stats.total_messages,
            "total_words": stats.total_words,
            "active_days": stats.active_days,
            "avg_messages_per_session": stats.avg_messages_per_session,
            "avg_messages_per_day": stats.avg_messages_per_day,
        },
        "user_stats": {
            "word_count": stats.word_count_user,
            "message_count": stats.message_count_user,
        },
        "ai_stats": {
            "word_count": stats.word_count_ai,
            "message_count": stats.message_count_ai,
        },
        "time_range": {
            "first_message": stats.first_message_time,
            "last_message": stats.last_message_time,
            "duration_formatted": stats.duration_formatted,
        },
        "daily_stats": [
            {
                "date": day.date.isoformat(),
                "day_label": day.get_day_label(),
                "weekday": day.get_weekday(),
                "message_count": day.message_count,
                "word_count": day.word_count,
                "session_count": day.session_count,
            }
            for day in stats.daily_stats
        ],
        "top_sessions": [
            {"id": sid, "title": title, "message_count": count}
            for sid, title, count in stats.top_sessions
        ],
    }
    return json.dumps(export_data, ensure_ascii=False, indent=2)


def export_global_stats_csv(stats: GlobalStats) -> str:
    """将全局统计数据导出为 CSV 格式。

    Args:
        stats: GlobalStats 统计数据对象

    Returns:
        CSV 字符串
    """
    output = StringIO()
    writer = csv.writer(output)

    # 写入概要统计
    writer.writerow(["统计项", "数值"])
    writer.writerow(["总会话数", stats.total_sessions])
    writer.writerow(["总消息数", stats.total_messages])
    writer.writerow(["总字数", stats.total_words])
    writer.writerow(["活跃天数", stats.active_days])
    writer.writerow(["平均每会话消息数", stats.avg_messages_per_session])
    writer.writerow(["平均每日消息数", stats.avg_messages_per_day])
    writer.writerow(["用户字数", stats.word_count_user])
    writer.writerow(["AI字数", stats.word_count_ai])
    writer.writerow(["用户消息数", stats.message_count_user])
    writer.writerow(["AI消息数", stats.message_count_ai])
    writer.writerow(["开始时间", stats.first_message_time or ""])
    writer.writerow(["结束时间", stats.last_message_time or ""])
    writer.writerow(["总时长", stats.duration_formatted])

    # 写入热门会话
    if stats.top_sessions:
        writer.writerow([])
        writer.writerow(["热门会话"])
        writer.writerow(["排名", "会话ID", "标题", "消息数"])
        for idx, (sid, title, count) in enumerate(stats.top_sessions, 1):
            writer.writerow([idx, sid, title, count])

    # 写入每日统计
    if stats.daily_stats:
        writer.writerow([])
        writer.writerow(["每日统计"])
        writer.writerow(["日期", "星期", "消息数", "字数", "活跃会话数"])
        for day in stats.daily_stats:
            writer.writerow([
                day.date.isoformat(),
                day.get_weekday(),
                day.message_count,
                day.word_count,
                day.session_count,
            ])

    return output.getvalue()


def export_global_stats_txt(stats: GlobalStats) -> str:
    """将全局统计数据导出为纯文本格式。

    Args:
        stats: GlobalStats 统计数据对象

    Returns:
        文本字符串
    """
    lines = [
        "=" * 60,
        "全局统计报告",
        "=" * 60,
        "",
        "📊 概览",
        "-" * 40,
        f"  会话数: {stats.total_sessions}",
        f"  总消息数: {stats.message_count_total:,}",
        f"  总字数: {stats.total_words:,}",
        f"  活跃天数: {stats.active_days}",
        f"  平均每会话: {stats.avg_messages_per_session} 条消息",
        f"  平均每日: {stats.avg_messages_per_day} 条消息",
        "",
        "👤 用户统计",
        "-" * 40,
        f"  字数: {stats.word_count_user:,}",
        f"  消息数: {stats.message_count_user}",
        "",
        "🤖 AI 统计",
        "-" * 40,
        f"  字数: {stats.word_count_ai:,}",
        f"  消息数: {stats.message_count_ai}",
        "",
        "⏱ 时间范围",
        "-" * 40,
    ]

    if stats.first_message_time:
        lines.append(f"  开始: {stats.first_message_time}")
    if stats.last_message_time:
        lines.append(f"  结束: {stats.last_message_time}")
    lines.append(f"  总时长: {stats.duration_formatted}")

    if stats.top_sessions:
        lines.extend([
            "",
            "🔥 热门会话",
            "-" * 40,
        ])
        for idx, (sid, title, count) in enumerate(stats.top_sessions, 1):
            lines.append(f"  {idx}. {title} - {count} 条消息")

    if stats.daily_stats:
        lines.extend([
            "",
            "📈 每日活动趋势",
            "-" * 40,
        ])
        for day in stats.daily_stats:
            lines.append(f"  {day.date.isoformat} ({day.get_weekday()}): {day.message_count} 条, {day.word_count} 字, {day.session_count} 会话")

    lines.append("")
    return "\n".join(lines)


def save_session_stats(stats: SessionStats, path: str, format: str) -> None:
    """保存会话统计数据到文件。

    Args:
        stats: SessionStats 统计数据对象
        path: 文件路径
        format: "json", "csv", 或 "txt"

    Raises:
        ValueError: 不支持的格式
    """
    if format == "json":
        content = export_session_stats_json(stats)
        Path(path).write_text(content, encoding="utf-8")
    elif format == "csv":
        content = export_session_stats_csv(stats)
        Path(path).write_text(content, encoding="utf-8-sig")  # BOM for Excel
    elif format == "txt":
        content = export_session_stats_txt(stats)
        Path(path).write_text(content, encoding="utf-8")
    else:
        raise ValueError(f"Unsupported format: {format}")


def save_global_stats(stats: GlobalStats, path: str, format: str) -> None:
    """保存全局统计数据到文件。

    Args:
        stats: GlobalStats 统计数据对象
        path: 文件路径
        format: "json", "csv", 或 "txt"

    Raises:
        ValueError: 不支持的格式
    """
    if format == "json":
        content = export_global_stats_json(stats)
        Path(path).write_text(content, encoding="utf-8")
    elif format == "csv":
        content = export_global_stats_csv(stats)
        Path(path).write_text(content, encoding="utf-8-sig")  # BOM for Excel
    elif format == "txt":
        content = export_global_stats_txt(stats)
        Path(path).write_text(content, encoding="utf-8")
    else:
        raise ValueError(f"Unsupported format: {format}")
