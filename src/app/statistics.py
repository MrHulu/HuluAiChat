"""会话统计功能：计算和展示会话的使用数据。"""
from dataclasses import dataclass
from datetime import datetime

from src.persistence import Message, Session


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


def calculate_session_stats(session: Session, messages: list[Message]) -> SessionStats:
    """计算会话统计数据。

    Args:
        session: 会话对象
        messages: 会话中的所有消息列表

    Returns:
        SessionStats: 统计数据对象
    """
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
    )
