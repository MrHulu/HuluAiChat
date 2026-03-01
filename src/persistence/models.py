"""会话与消息领域模型。"""
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Folder:
    """文件夹：id、名称、颜色、创建时间、排序序号。"""
    id: str
    name: str
    color: str = "#60A5FA"  # 默认蓝色 (Tailwind blue-400)
    created_at: str = ""  # ISO 格式
    sort_order: int = 0  # 排序序号，越小越靠前


@dataclass
class Session:
    """会话：id、标题、创建与更新时间、置顶状态、所属文件夹。"""
    id: str
    title: str
    created_at: str  # ISO 格式
    updated_at: str  # ISO 格式
    is_pinned: bool = False  # 是否置顶
    folder_id: str | None = None  # 所属文件夹 ID，None 表示在根目录

    @property
    def pinned(self) -> bool:
        """向后兼容的 pinned 属性。"""
        return self.is_pinned

    @pinned.setter
    def pinned(self, value: bool) -> None:
        """向后兼容的 pinned 设置器。"""
        self.is_pinned = value


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
