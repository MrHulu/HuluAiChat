"""SQLite 初始化与建表。"""
import sqlite3
from pathlib import Path

from src.app_data import get_app_data_dir

# 已迁移的标记，避免重复迁移
_MIGRATION_PINNED_ADDED = False
_MIGRATION_SESSION_PINNED_ADDED = False
_MIGRATION_QUOTE_ADDED = False


def ensure_migrations() -> None:
    """确保所有数据库迁移都已执行。"""
    global _MIGRATION_PINNED_ADDED
    global _MIGRATION_SESSION_PINNED_ADDED
    global _MIGRATION_QUOTE_ADDED
    if not _MIGRATION_PINNED_ADDED:
        migrate_add_pinned_column()
        _MIGRATION_PINNED_ADDED = True
    if not _MIGRATION_SESSION_PINNED_ADDED:
        migrate_add_session_pinned_column()
        _MIGRATION_SESSION_PINNED_ADDED = True
    if not _MIGRATION_QUOTE_ADDED:
        migrate_add_quote_columns()
        _MIGRATION_QUOTE_ADDED = True

SESSION_TABLE = """
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0
);
"""

MESSAGE_TABLE = """
CREATE TABLE IF NOT EXISTS message (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    quoted_message_id TEXT,
    quoted_content TEXT,
    FOREIGN KEY (session_id) REFERENCES session(id)
);
"""

def migrate_add_pinned_column(db_path: str | None = None) -> None:
    """为现有数据库添加 is_pinned 列（向后兼容）。"""
    path = db_path or str(Path(get_app_data_dir()) / "chat.db")
    if not Path(path).exists():
        return
    conn = sqlite3.connect(path)
    try:
        cursor = conn.execute("PRAGMA table_info(message)")
        columns = {row[1] for row in cursor.fetchall()}
        if "is_pinned" not in columns:
            conn.execute("ALTER TABLE message ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0")
            conn.commit()
    finally:
        conn.close()


def migrate_add_session_pinned_column(db_path: str | None = None) -> None:
    """为 session 表添加 is_pinned 列（向后兼容）。"""
    path = db_path or str(Path(get_app_data_dir()) / "chat.db")
    if not Path(path).exists():
        return
    conn = sqlite3.connect(path)
    try:
        cursor = conn.execute("PRAGMA table_info(session)")
        columns = {row[1] for row in cursor.fetchall()}
        if "is_pinned" not in columns:
            conn.execute("ALTER TABLE session ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0")
            conn.commit()
    finally:
        conn.close()


def migrate_add_quote_columns(db_path: str | None = None) -> None:
    """为 message 表添加 quoted_message_id 和 quoted_content 列（向后兼容）。"""
    path = db_path or str(Path(get_app_data_dir()) / "chat.db")
    if not Path(path).exists():
        return
    conn = sqlite3.connect(path)
    try:
        cursor = conn.execute("PRAGMA table_info(message)")
        columns = {row[1] for row in cursor.fetchall()}
        if "quoted_message_id" not in columns:
            conn.execute("ALTER TABLE message ADD COLUMN quoted_message_id TEXT")
        if "quoted_content" not in columns:
            conn.execute("ALTER TABLE message ADD COLUMN quoted_content TEXT")
        conn.commit()
    finally:
        conn.close()


def init_db(db_path: str | None = None) -> str:
    """初始化数据库（建表），路径基于应用数据根目录；返回数据库路径。"""
    path = db_path or str(Path(get_app_data_dir()) / "chat.db")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path)
    try:
        conn.executescript(SESSION_TABLE + MESSAGE_TABLE)
        conn.commit()
    finally:
        conn.close()
    ensure_migrations()
    return path
