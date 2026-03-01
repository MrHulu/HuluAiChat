"""会话仓储接口与 SQLite 实现。"""
import sqlite3
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path

from src.app_data import get_app_data_dir
from src.persistence.db import init_db
from src.persistence.models import Session


class SessionRepository(ABC):
    """会话仓储：创建、列表、按 id 获取、更新 title/updated_at。"""

    @abstractmethod
    def create(self, session_id: str, title: str) -> Session:
        ...

    @abstractmethod
    def list_sessions(self) -> list[Session]:
        """按时间排序（updated_at 降序）。"""
        ...

    @abstractmethod
    def get_by_id(self, session_id: str) -> Session | None:
        ...

    @abstractmethod
    def update_title(self, session_id: str, title: str) -> None:
        ...

    @abstractmethod
    def update_updated_at(self, session_id: str, updated_at: str) -> None:
        ...

    @abstractmethod
    def delete(self, session_id: str) -> None:
        """删除会话（调用方需先删除该会话下所有消息）。"""
        ...


def _row_to_session(row: tuple) -> Session:
    return Session(id=row[0], title=row[1], created_at=row[2], updated_at=row[3])


class SqliteSessionRepository(SessionRepository):
    def __init__(self, db_path: str | None = None) -> None:
        self._path = db_path or str(Path(get_app_data_dir()) / "chat.db")
        init_db(self._path)

    def _conn(self) -> sqlite3.Connection:
        return sqlite3.connect(self._path)

    def create(self, session_id: str, title: str) -> Session:
        now = datetime.now(timezone.utc).isoformat()
        with self._conn() as conn:
            conn.execute(
                "INSERT INTO session (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (session_id, title, now, now),
            )
        return Session(id=session_id, title=title, created_at=now, updated_at=now)

    def list_sessions(self) -> list[Session]:
        with self._conn() as conn:
            cur = conn.execute("SELECT id, title, created_at, updated_at FROM session ORDER BY updated_at DESC")
            return [_row_to_session(r) for r in cur.fetchall()]

    def get_by_id(self, session_id: str) -> Session | None:
        with self._conn() as conn:
            cur = conn.execute("SELECT id, title, created_at, updated_at FROM session WHERE id = ?", (session_id,))
            row = cur.fetchone()
            return _row_to_session(row) if row else None

    def update_title(self, session_id: str, title: str) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE session SET title = ? WHERE id = ?", (title, session_id))

    def update_updated_at(self, session_id: str, updated_at: str) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE session SET updated_at = ? WHERE id = ?", (updated_at, session_id))

    def delete(self, session_id: str) -> None:
        with self._conn() as conn:
            conn.execute("DELETE FROM session WHERE id = ?", (session_id,))
