"""SQLite 初始化与建表。"""
import sqlite3
from pathlib import Path

from src.app_data import get_app_data_dir

SESSION_TABLE = """
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

MESSAGE_TABLE = """
CREATE TABLE IF NOT EXISTS message (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session(id)
);
"""


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
    return path
