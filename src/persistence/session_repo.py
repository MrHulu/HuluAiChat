"""会话仓储接口与 SQLite 实现."""
import sqlite3
from abc import ABC, abstractmethod
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from src.app_data import get_app_data_dir
from src.persistence.db import init_db
from src.persistence.models import Session


class SessionRepository(ABC):
    """会话仓储：创建、列表、按 id 获取、更新 title/updated_at/pinned/folder。"""

    @abstractmethod
    def create(self, session_id: str, title: str) -> Session:
        ...

    @abstractmethod
    def list_sessions(self) -> list[Session]:
        """置顶优先，然后按时间排序（updated_at 降序）。"""
        ...

    @abstractmethod
    def list_all(self) -> list[Session]:
        """获取所有会话（用于统计，不排序）。"""
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
    def set_pinned(self, session_id: str, pinned: bool) -> None:
        """设置会话置顶状态。"""
        ...

    @abstractmethod
    def set_folder(self, session_id: str, folder_id: str | None) -> None:
        """设置会话所属文件夹。"""
        ...

    @abstractmethod
    def get_sessions_by_folder(self, folder_id: str | None) -> list[Session]:
        """获取指定文件夹下的会话（None 表示根目录）。"""
        ...

    @abstractmethod
    def delete(self, session_id: str) -> None:
        """删除会话（调用方需先删除该会话下所有消息）。"""
        ...


def _row_to_session(row: tuple) -> Session:
    # row: (id, title, created_at, updated_at, is_pinned, [folder_id])
    is_pinned = bool(row[4]) if len(row) > 4 else False
    folder_id = row[5] if len(row) > 5 else None
    return Session(
        id=row[0],
        title=row[1],
        created_at=row[2],
        updated_at=row[3],
        is_pinned=is_pinned,
        folder_id=folder_id
    )


class SqliteSessionRepository(SessionRepository):
    def __init__(self, db_path: str | None = None) -> None:
        self._path = db_path or str(Path(get_app_data_dir()) / "chat.db")
        init_db(self._path)
        self._ensure_folder_column()

    def _conn(self) -> closing:
        return closing(sqlite3.connect(self._path))

    def _ensure_folder_column(self) -> None:
        """确保 session 表有 folder_id 列（向后兼容）。"""
        with self._conn() as conn:
            # 检查列是否存在
            cur = conn.execute("PRAGMA table_info(session)")
            columns = [row[1] for row in cur.fetchall()]
            if "folder_id" not in columns:
                conn.execute("ALTER TABLE session ADD COLUMN folder_id TEXT")
                conn.commit()

    def create(self, session_id: str, title: str) -> Session:
        now = datetime.now(timezone.utc).isoformat()
        with self._conn() as conn:
            conn.execute(
                "INSERT INTO session (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (session_id, title, now, now),
            )
            conn.commit()
        return Session(id=session_id, title=title, created_at=now, updated_at=now)

    def list_sessions(self) -> list[Session]:
        with self._conn() as conn:
            # 置顶优先，然后按更新时间降序
            cur = conn.execute(
                "SELECT id, title, created_at, updated_at, is_pinned, folder_id FROM session ORDER BY is_pinned DESC, updated_at DESC"
            )
            return [_row_to_session(r) for r in cur.fetchall()]

    def list_all(self) -> list[Session]:
        """获取所有会话（用于统计）。"""
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, title, created_at, updated_at, is_pinned, folder_id FROM session"
            )
            return [_row_to_session(r) for r in cur.fetchall()]

    def get_by_id(self, session_id: str) -> Session | None:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, title, created_at, updated_at, is_pinned, folder_id FROM session WHERE id = ?",
                (session_id,)
            )
            row = cur.fetchone()
            return _row_to_session(row) if row else None

    def update_title(self, session_id: str, title: str) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE session SET title = ? WHERE id = ?", (title, session_id))
            conn.commit()

    def update_updated_at(self, session_id: str, updated_at: str) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE session SET updated_at = ? WHERE id = ?", (updated_at, session_id))
            conn.commit()

    def set_pinned(self, session_id: str, pinned: bool) -> None:
        with self._conn() as conn:
            conn.execute(
                "UPDATE session SET is_pinned = ? WHERE id = ?",
                (1 if pinned else 0, session_id)
            )
            conn.commit()

    def set_folder(self, session_id: str, folder_id: str | None) -> None:
        with self._conn() as conn:
            conn.execute(
                "UPDATE session SET folder_id = ? WHERE id = ?",
                (folder_id, session_id)
            )
            conn.commit()

    def get_sessions_by_folder(self, folder_id: str | None) -> list[Session]:
        with self._conn() as conn:
            if folder_id is None:
                # 根目录的会话（folder_id IS NULL）
                cur = conn.execute(
                    "SELECT id, title, created_at, updated_at, is_pinned, folder_id FROM session WHERE folder_id IS NULL ORDER BY is_pinned DESC, updated_at DESC"
                )
            else:
                # 指定文件夹的会话
                cur = conn.execute(
                    "SELECT id, title, created_at, updated_at, is_pinned, folder_id FROM session WHERE folder_id = ? ORDER BY is_pinned DESC, updated_at DESC",
                    (folder_id,)
                )
            return [_row_to_session(r) for r in cur.fetchall()]

    def delete(self, session_id: str) -> None:
        with self._conn() as conn:
            conn.execute("DELETE FROM session WHERE id = ?", (session_id,))
            conn.commit()
