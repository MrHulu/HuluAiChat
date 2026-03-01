"""聊天记录导出服务."""
import json
from datetime import datetime
from pathlib import Path

from src.persistence import Session, Message


class ChatExporter:
    """聊天记录导出器，支持 Markdown 和 JSON 格式."""

    def __init__(self, session: Session, messages: list[Message]) -> None:
        self._session = session
        self._messages = messages

    def to_markdown(self) -> str:
        """导出为 Markdown 格式."""
        lines = [
            f"# {self._session.title or '新对话'}\n",
            f"**创建时间**: {self._format_time(self._session.created_at)}  \n",
            f"**更新时间**: {self._format_time(self._session.updated_at)}\n",
            "---\n\n",
        ]

        for msg in self._messages:
            role_name = "你" if msg.role == "user" else "助手"
            lines.append(f"## {role_name}\n")
            lines.append(f"{msg.content}\n\n")

        return "".join(lines)

    def to_json(self) -> str:
        """导出为 JSON 格式."""
        data = {
            "session": {
                "id": self._session.id,
                "title": self._session.title,
                "created_at": self._session.created_at,
                "updated_at": self._session.updated_at,
            },
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at,
                }
                for m in self._messages
            ],
        }
        return json.dumps(data, ensure_ascii=False, indent=2)

    def save(self, path: str, format: str) -> None:
        """保存到文件.

        Args:
            path: 文件路径
            format: "md" 或 "json"
        """
        content = self.to_markdown() if format == "md" else self.to_json()
        Path(path).write_text(content, encoding="utf-8")

    @staticmethod
    def _format_time(iso_time: str) -> str:
        """格式化 ISO 时间为可读格式."""
        try:
            dt = datetime.fromisoformat(iso_time.replace("Z", "+00:00"))
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return iso_time
