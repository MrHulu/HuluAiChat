"""消息仓储接口与 SQLite 实现."""
import sqlite3
from abc import ABC, abstractmethod
from contextlib import closing
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

    @abstractmethod
    def delete_by_session(self, session_id: str) -> None:
        """删除指定会话下的所有消息。"""
        ...

    @abstractmethod
    def delete(self, message_id: str) -> None:
        """删除指定 ID 的消息。"""
        ...

    @abstractmethod
    def search(self, session_id: str, query: str, start_date: str | None = None, end_date: str | None = None,
              case_sensitive: bool = False, whole_word: bool = False) -> list[Message]:
        """在指定会话中搜索包含查询字符串的消息。

        Args:
            session_id: 会话ID
            query: 搜索关键词
            start_date: 起始日期 (ISO 8601 格式，如 "2024-01-01" 或 "2024-01-01T00:00:00Z")
            end_date: 结束日期 (ISO 8601 格式)
            case_sensitive: 是否区分大小写 (v1.4.8)
            whole_word: 是否全词匹配 (v1.4.8)
        """
        ...

    @abstractmethod
    def list_all(self) -> list[Message]:
        """获取所有消息（用于统计）。"""
        ...

    @abstractmethod
    def search_all(self, query: str, limit: int = 100, start_date: str | None = None, end_date: str | None = None,
                   case_sensitive: bool = False, whole_word: bool = False) -> list[Message]:
        """在所有会话中搜索包含查询字符串的消息。

        Args:
            query: 搜索关键词
            limit: 最大返回结果数
            start_date: 起始日期 (ISO 8601 格式)
            end_date: 结束日期 (ISO 8601 格式)
            case_sensitive: 是否区分大小写 (v1.4.8)
            whole_word: 是否全词匹配 (v1.4.8)
        """
        ...

    @abstractmethod
    def set_pinned(self, message_id: str, pinned: bool) -> None:
        """设置消息的置顶状态。"""
        ...

    @abstractmethod
    def list_pinned(self, session_id: str) -> list[Message]:
        """获取指定会话中所有置顶的消息（按时间倒序）。"""
        ...

    @abstractmethod
    def update_content(self, message_id: str, content: str) -> None:
        """更新指定消息的内容。"""
        ...

    @abstractmethod
    def count_by_session(self, session_id: str) -> int:
        """获取指定会话的消息数量。"""
        ...


def _row_to_message(row: tuple) -> Message:
    is_pinned = bool(row[5]) if len(row) > 5 else False
    quoted_message_id = row[6] if len(row) > 6 else None
    quoted_content = row[7] if len(row) > 7 else None
    return Message(
        id=row[0],
        session_id=row[1],
        role=row[2],
        content=row[3],
        created_at=row[4],
        is_pinned=is_pinned,
        quoted_message_id=quoted_message_id,
        quoted_content=quoted_content,
    )


class SqliteMessageRepository(MessageRepository):
    def __init__(self, db_path: str | None = None) -> None:
        self._path = db_path or str(Path(get_app_data_dir()) / "chat.db")
        init_db(self._path)

    def _conn(self) -> closing:
        return closing(sqlite3.connect(self._path))

    def append(self, message: Message) -> None:
        with self._conn() as c:
            c.execute(
                """INSERT INTO message (id, session_id, role, content, created_at, is_pinned, quoted_message_id, quoted_content)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (message.id, message.session_id, message.role, message.content, message.created_at,
                 int(message.is_pinned), message.quoted_message_id, message.quoted_content),
            )
            c.commit()

    def list_by_session(self, session_id: str) -> list[Message]:
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, session_id, role, content, created_at, is_pinned, quoted_message_id, quoted_content FROM message WHERE session_id = ? ORDER BY created_at ASC",
                (session_id,),
            )
            return [_row_to_message(r) for r in cur.fetchall()]

    def delete_by_session(self, session_id: str) -> None:
        with self._conn() as conn:
            conn.execute("DELETE FROM message WHERE session_id = ?", (session_id,))
            conn.commit()

    def delete(self, message_id: str) -> None:
        with self._conn() as conn:
            conn.execute("DELETE FROM message WHERE id = ?", (message_id,))
            conn.commit()

    def search(self, session_id: str, query: str, start_date: str | None = None, end_date: str | None = None,
              case_sensitive: bool = False, whole_word: bool = False) -> list[Message]:
        """在指定会话中搜索包含查询字符串的消息。

        支持日期范围过滤：
        - start_date: 只返回创建日期 >= start_date 的消息
        - end_date: 只返回创建日期 <= end_date 的消息
        v1.4.8: 支持 case_sensitive 和 whole_word 选项
        """
        if not query:
            return []
        with self._conn() as conn:
            # v1.4.8: 启用区分大小写的 LIKE
            if case_sensitive:
                conn.execute("PRAGMA case_sensitive_like = ON")

            # 构建 WHERE 子句
            where_conditions = ["session_id = ?"]
            params = [session_id]

            # 构建搜索条件
            if whole_word:
                # 全词匹配：使用正则表达式或词边界
                # SQLite 的 REGEXP 需要额外加载，这里用 LIKE 模拟
                # 匹配 " word " 或 " word," 或 " word." 或行首/行尾
                if case_sensitive:
                    where_conditions.append("""(
                        content = ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ?
                    )""")
                    params.extend([
                        query,  # 完全匹配
                        f"{query} %",  # 行首
                        f"% {query}",  # 行尾
                        f"% {query} %",  # 中间（空格包围）
                        f"% {query}.%",  # 句号
                        f"% {query},%",  # 逗号
                        f"% {query};%",  # 分号
                        f"{query},%",  # 行首+逗号 (v1.4.8: for "Hello, World!")
                    ])
                else:
                    where_conditions.append("""(
                        LOWER(content) = LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?)
                    )""")
                    params.extend([
                        query,
                        f"{query} %",
                        f"% {query}",
                        f"% {query} %",
                        f"% {query}.%",
                        f"% {query},%",
                        f"% {query};%",
                        f"{query},%",  # 行首+逗号
                    ])
            else:
                # 普通匹配
                if case_sensitive:
                    where_conditions.append("content LIKE ?")
                    params.append(f"%{query}%")
                else:
                    where_conditions.append("LOWER(content) LIKE LOWER(?)")
                    params.append(f"%{query}%")

            sql = (
                "SELECT id, session_id, role, content, created_at, is_pinned, quoted_message_id, quoted_content FROM message "
                f"WHERE {' AND '.join(where_conditions)}"
            )

            # 添加日期过滤条件
            if start_date:
                sql += " AND created_at >= ?"
                params.append(start_date)
            if end_date:
                sql += " AND created_at <= ?"
                params.append(end_date)

            sql += " ORDER BY created_at ASC"
            cur = conn.execute(sql, tuple(params))
            return [_row_to_message(r) for r in cur.fetchall()]

    def search_all(self, query: str, limit: int = 100, start_date: str | None = None, end_date: str | None = None,
                   case_sensitive: bool = False, whole_word: bool = False) -> list[Message]:
        """在所有会话中搜索包含查询字符串的消息，按时间倒序。

        支持日期范围过滤：
        - start_date: 只返回创建日期 >= start_date 的消息
        - end_date: 只返回创建日期 <= end_date 的消息
        v1.4.8: 支持 case_sensitive 和 whole_word 选项
        """
        if not query:
            return []
        with self._conn() as conn:
            # v1.4.8: 启用区分大小写的 LIKE
            if case_sensitive:
                conn.execute("PRAGMA case_sensitive_like = ON")

            # 构建 WHERE 子句
            where_conditions = ["1=1"]  # 基础条件，方便后续添加
            params = []

            # 构建搜索条件
            if whole_word:
                # 全词匹配
                if case_sensitive:
                    where_conditions.append("""(
                        content = ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ? OR
                        content LIKE ?
                    )""")
                    params.extend([
                        query,
                        f"{query} %",
                        f"% {query}",
                        f"% {query} %",
                        f"% {query}.%",
                        f"% {query},%",
                        f"% {query};%",
                        f"{query},%",  # 行首+逗号 (v1.4.8)
                    ])
                else:
                    where_conditions.append("""(
                        LOWER(content) = LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?) OR
                        LOWER(content) LIKE LOWER(?)
                    )""")
                    params.extend([
                        query,
                        f"{query} %",
                        f"% {query}",
                        f"% {query} %",
                        f"% {query}.%",
                        f"% {query},%",
                        f"% {query};%",
                        f"{query},%",  # 行首+逗号
                    ])
            else:
                # 普通匹配
                if case_sensitive:
                    where_conditions.append("content LIKE ?")
                    params.append(f"%{query}%")
                else:
                    where_conditions.append("LOWER(content) LIKE LOWER(?)")
                    params.append(f"%{query}%")

            sql = (
                "SELECT id, session_id, role, content, created_at, is_pinned, quoted_message_id, quoted_content FROM message "
                f"WHERE {' AND '.join(where_conditions)}"
            )

            # 添加日期过滤条件
            if start_date:
                sql += " AND created_at >= ?"
                params.append(start_date)
            if end_date:
                sql += " AND created_at <= ?"
                params.append(end_date)

            sql += " ORDER BY created_at DESC LIMIT ?"
            params.append(limit)
            cur = conn.execute(sql, tuple(params))
            return [_row_to_message(r) for r in cur.fetchall()]

    def set_pinned(self, message_id: str, pinned: bool) -> None:
        """设置消息的置顶状态。"""
        with self._conn() as conn:
            conn.execute("UPDATE message SET is_pinned = ? WHERE id = ?", (int(pinned), message_id))
            conn.commit()

    def list_pinned(self, session_id: str) -> list[Message]:
        """获取指定会话中所有置顶的消息（按时间倒序）。"""
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, session_id, role, content, created_at, is_pinned, quoted_message_id, quoted_content FROM message "
                "WHERE session_id = ? AND is_pinned = 1 "
                "ORDER BY created_at DESC",
                (session_id,),
            )
            return [_row_to_message(r) for r in cur.fetchall()]

    def list_all(self) -> list[Message]:
        """获取所有消息（用于统计）。"""
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT id, session_id, role, content, created_at, is_pinned, quoted_message_id, quoted_content FROM message "
                "ORDER BY created_at ASC"
            )
            return [_row_to_message(r) for r in cur.fetchall()]

    def update_content(self, message_id: str, content: str) -> None:
        """更新指定消息的内容。"""
        with self._conn() as conn:
            conn.execute("UPDATE message SET content = ? WHERE id = ?", (content, message_id))
            conn.commit()

    def count_by_session(self, session_id: str) -> int:
        """获取指定会话的消息数量。"""
        with self._conn() as conn:
            cur = conn.execute(
                "SELECT COUNT(*) FROM message WHERE session_id = ?",
                (session_id,),
            )
            row = cur.fetchone()
            return row[0] if row else 0
