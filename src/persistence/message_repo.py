"""消息仓储接口与 SQLite 实现。"""
import sqlite3
from abc import ABC, abstractmethod
from pathlib import Path

from src.app_data import get_app_data_dir
from src.persistence.db import init_db
from src.persistence.models import Message


class MessageRepository(ABC):
    """消息仓储：追加消息、按 session_id 获取列表（按时间排序）。"""

    @abstractmethod
    def append(self, message: Message) -> None:
        ...

    @abstractmethod
    def list_by_session(self, session_id: str) -> list[Message]:
        """按 created_at 升序。"""
        ...


def _row_to_message(row: tuple) -> Message:
    return Message(id=row[0], session_id=row[1], role=row[2], content=row[3], created_at=row[4])


class SqliteMessageRepository(MessageRepository):
    def __init__(self, db_path: str | None = None) -> None:
        self._path = db_path or str(Path(get_app_data_dir()) / "chat.db")
        init_db(self._path)

    def _conn(self) -> sqlite3.Connection:
        return sqlite3.connect(self._path)

    def append(self, message: Message) -> None:
        with self._conn() as c:
            c.execute(
                "INSERT INTO message (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
                (message.id, message.session_id, message.role, message.content, message.created_at),
            )

    def list_by_session(self, session_id: str) -> list[Message]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, session_id, role, content, created_at FROM message WHERE session_id = ? ORDER BY created_at ASC",
                (session_id,),
            )
            return [_row_to_message(r) for r in cur.fetchall()]
