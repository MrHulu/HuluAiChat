"""会话与消息领域模型。"""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Session:
    """会话：id、标题、创建与更新时间。"""
    id: str
    title: str
    created_at: str  # ISO 格式
    updated_at: str  # ISO 格式


@dataclass
class Message:
    """消息：id、会话 id、角色、内容、创建时间。"""
    id: str
    session_id: str
    role: str  # "user" | "assistant"
    content: str
    created_at: str  # ISO 格式
