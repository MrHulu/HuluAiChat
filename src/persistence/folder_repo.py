"""文件夹仓储接口与 SQLite 实现."""
import sqlite3
from abc import ABC, abstractmethod
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

from src.app_data import get_app_data_dir
from src.persistence.db import init_db
from src.persistence.models import Folder


class FolderRepository(ABC):
    """文件夹仓储：创建、列表、按 id 获取、更新、删除。"""

    @abstractmethod
    def create(self, name: str, color: str = "#60A5FA") -> Folder:
        """创建新文件夹。"""
        ...

    @abstractmethod
    def list_folders(self) -> list[Folder]:
        """获取所有文件夹，按 sort_order 排序。"""
        ...

    @abstractmethod
    def get_by_id(self, folder_id: str) -> Folder | None:
        """按 id 获取文件夹。"""
        ...

    @abstractmethod
    def update_name(self, folder_id: str, name: str) -> None:
        """更新文件夹名称。"""
        ...

    @abstractmethod
    def update_color(self, folder_id: str, color: str) -> None:
        """更新文件夹颜色。"""
        ...

    @abstractmethod
    def update_sort_order(self, folder_id: str, sort_order: int) -> None:
        """更新文件夹排序序号。"""
        ...

    @abstractmethod
    def delete(self, folder_id: str) -> None:
        """删除文件夹（不会删除该文件夹下的会话，而是将它们移至根目录）。"""
        ...

    @abstractmethod
    def set_folder_collapsed(self, folder_id: str, collapsed: bool) -> None:
        """设置文件夹折叠状态。"""
        ...

    @abstractmethod
    def is_folder_collapsed(self, folder_id: str) -> bool:
        """检查文件夹是否折叠。"""
        ...


def _row_to_folder(row: tuple) -> Folder:
    # row: (id, name, color, created_at, sort_order)
    return Folder(
        id=row[0],
        name=row[1],
        color=row[2],
        created_at=row[3],
        sort_order=row[4] if len(row) > 4 else 0
    )


class SqliteFolderRepository(FolderRepository):
    def __init__(self, db_path: str | None = None) -> None:
        self._path = db_path or str(Path(get_app_data_dir()) / "chat.db")
        self._ensure_table()

    def _conn(self) -> closing:
        return closing(sqlite3.connect(self._path))

    def _ensure_table(self) -> None:
        """确保文件夹表存在。"""
        with self._conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS folder (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    color TEXT DEFAULT '#60A5FA',
                    created_at TEXT NOT NULL,
                    sort_order INTEGER DEFAULT 0
                )
            """)
            # 文件夹折叠状态表
            conn.execute("""
                CREATE TABLE IF NOT EXISTS folder_state (
                    folder_id TEXT PRIMARY KEY,
                    collapsed INTEGER DEFAULT 0
                )
            """)
            conn.commit()

    def create(self, name: str, color: str = "#60A5FA") -> Folder:
        import uuid
        folder_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        # 获取当前最大 sort_order
        with self._conn() as conn:
            cur = conn.execute("SELECT MAX(sort_order) FROM folder")
            max_order = cur.fetchone()[0] or 0
            sort_order = max_order + 1

            conn.execute(
                "INSERT INTO folder (id, name, color, created_at, sort_order) VALUES (?, ?, ?, ?, ?)",
                (folder_id, name, color, now, sort_order),
            )
            conn.commit()

        return Folder(id=folder_id, name=name, color=color, created_at=now, sort_order=sort_order)

    def list_folders(self) -> list[Folder]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, name, color, created_at, sort_order FROM folder ORDER BY sort_order ASC"
            )
            return [_row_to_folder(r) for r in cur.fetchall()]

    def get_by_id(self, folder_id: str) -> Folder | None:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, name, color, created_at, sort_order FROM folder WHERE id = ?",
                (folder_id,)
            )
            row = cur.fetchone()
            return _row_to_folder(row) if row else None

    def update_name(self, folder_id: str, name: str) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE folder SET name = ? WHERE id = ?", (name, folder_id))
            conn.commit()

    def update_color(self, folder_id: str, color: str) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE folder SET color = ? WHERE id = ?", (color, folder_id))
            conn.commit()

    def update_sort_order(self, folder_id: str, sort_order: int) -> None:
        with self._conn() as conn:
            conn.execute("UPDATE folder SET sort_order = ? WHERE id = ?", (sort_order, folder_id))
            conn.commit()

    def delete(self, folder_id: str) -> None:
        """删除文件夹，并将该文件夹下的会话移至根目录。"""
        with self._conn() as conn:
            # 检查 session 表是否存在
            cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='session'")
            session_table_exists = cur.fetchone() is not None

            # 先将文件夹下的会话移至根目录
            if session_table_exists:
                conn.execute("UPDATE session SET folder_id = NULL WHERE folder_id = ?", (folder_id,))
            # 删除文件夹折叠状态
            conn.execute("DELETE FROM folder_state WHERE folder_id = ?", (folder_id,))
            # 删除文件夹
            conn.execute("DELETE FROM folder WHERE id = ?", (folder_id,))
            conn.commit()

    def set_folder_collapsed(self, folder_id: str, collapsed: bool) -> None:
        with self._conn() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO folder_state (folder_id, collapsed) VALUES (?, ?)",
                (folder_id, 1 if collapsed else 0)
            )
            conn.commit()

    def is_folder_collapsed(self, folder_id: str) -> bool:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT collapsed FROM folder_state WHERE folder_id = ?",
                (folder_id,)
            )
            row = cur.fetchone()
            return bool(row[0]) if row else False
