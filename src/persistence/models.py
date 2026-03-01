"""会话与消息领域模型。"""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Session:
    """会话：id、标题、创建与更新时间、置顶状态。"""
    id: str
    title: str
    created_at: str  # ISO 格式
    updated_at: str  # ISO 格式
    is_pinned: bool = False  # 是否置顶


@dataclass
class Message:
    """消息：id、会话 id、角色、内容、创建时间、置顶状态、引用消息。"""
    id: str
    session_id: str
    role: str  # "user" | "assistant"
    content: str
    created_at: str  # ISO 格式
    is_pinned: bool = False  # 是否置顶
    quoted_message_id: str | None = None  # 引用的消息 ID
    quoted_content: str | None = None  # 引用的消息内容（快照）
