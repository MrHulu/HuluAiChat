"""聊天记录导出服务."""
import json
from datetime import datetime
from io import BytesIO
from pathlib import Path

from fpdf import FPDF
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

    def to_pdf(self) -> bytes:
        """导出为 PDF 格式.

        Returns:
            PDF 文件的二进制数据
        """
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", "B", 16)

        # 标题
        title = self._session.title or "新对话"
        pdf.cell(0, 10, title.encode("latin-1", "replace").decode("latin-1"), new_x="LEFT", new_y="NEXT", align="C")

        pdf.set_font("Arial", "", 10)
        pdf.cell(0, 6, f"Created: {self._format_time(self._session.created_at)}", new_x="LEFT", new_y="NEXT")
        pdf.cell(0, 6, f"Updated: {self._format_time(self._session.updated_at)}", new_x="LEFT", new_y="NEXT")

        pdf.ln(5)
        pdf.set_line_width(0.5)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(5)

        # 消息
        pdf.set_font("Arial", "B", 12)
        for msg in self._messages:
            # 角色名称
            role_name = "You" if msg.role == "user" else "Assistant"
            pdf.set_fill_color(240 if msg.role == "user" else 200, 240 if msg.role == "user" else 220, 240 if msg.role == "user" else 220)
            pdf.cell(0, 8, role_name, new_x="LEFT", new_y="NEXT", fill=True)

            # 内容 - 支持中文和自动换行
            pdf.set_font("Arial", "", 10)
            content = msg.content or ""
            # FPDF 对中文支持有限，使用替代字符
            safe_content = content.encode("latin-1", "replace").decode("latin-1")

            # 简单的自动换行
            lines = self._wrap_text(safe_content, 190)
            for line in lines:
                pdf.cell(0, 6, line, new_x="LEFT", new_y="NEXT")

            pdf.ln(3)

        # 生成 PDF 二进制数据
        return BytesIO(pdf.output()).getvalue()

    def _wrap_text(self, text: str, max_width: float) -> list[str]:
        """将文本按指定宽度换行.

        Args:
            text: 要换行的文本
            max_width: 最大宽度（字符单位，近似值）

        Returns:
            换行后的文本列表
        """
        if not text:
            return [""]

        # 近似计算：每个字符约 2.8pt（10号字体）
        chars_per_line = int(max_width / 2.8)
        lines = []

        while len(text) > chars_per_line:
            # 尝试在空格处换行
            break_point = text[:chars_per_line + 1].rfind(" ")
            if break_point == -1 or break_point == 0:
                break_point = chars_per_line

            lines.append(text[:break_point].strip())
            text = text[break_point:].strip()

        if text:
            lines.append(text)

        return lines if lines else [""]

    def save(self, path: str, format: str) -> None:
        """保存到文件.

        Args:
            path: 文件路径
            format: "md", "json" 或 "pdf"
        """
        if format == "md":
            content = self.to_markdown()
            Path(path).write_text(content, encoding="utf-8")
        elif format == "json":
            content = self.to_json()
            Path(path).write_text(content, encoding="utf-8")
        elif format == "pdf":
            content = self.to_pdf()
            Path(path).write_bytes(content)
        else:
            raise ValueError(f"Unsupported format: {format}")

    @staticmethod
    def _format_time(iso_time: str) -> str:
        """格式化 ISO 时间为可读格式."""
        try:
            dt = datetime.fromisoformat(iso_time.replace("Z", "+00:00"))
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return iso_time
