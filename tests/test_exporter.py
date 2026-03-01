"""导出功能测试."""
from datetime import datetime, timezone

import pytest

from src.app.exporter import ChatExporter
from src.persistence.models import Session, Message


@pytest.fixture
def sample_session() -> Session:
    """示例会话 fixture."""
    return Session(
        id="s1",
        title="Test Session",
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )


@pytest.fixture
def sample_messages() -> list[Message]:
    """示例消息列表 fixture."""
    now = datetime.now(timezone.utc).isoformat()
    return [
        Message(id="m1", session_id="s1", role="user", content="Hello", created_at=now),
        Message(id="m2", session_id="s1", role="assistant", content="Hi there!", created_at=now),
    ]


class TestChatExporter:
    """ChatExporter 测试."""

    def test_to_markdown(self, sample_session: Session, sample_messages: list[Message]) -> None:
        """测试：导出为 Markdown 格式."""
        exporter = ChatExporter(sample_session, sample_messages)
        md = exporter.to_markdown()

        assert "# Test Session" in md
        assert "**创建时间**" in md
        assert "## 你" in md
        assert "Hello" in md
        assert "## 助手" in md
        assert "Hi there!" in md

    def test_to_json(self, sample_session: Session, sample_messages: list[Message]) -> None:
        """测试：导出为 JSON 格式."""
        exporter = ChatExporter(sample_session, sample_messages)
        json_str = exporter.to_json()

        import json
        data = json.loads(json_str)

        assert data["session"]["id"] == "s1"
        assert data["session"]["title"] == "Test Session"
        assert len(data["messages"]) == 2
        assert data["messages"][0]["role"] == "user"
        assert data["messages"][0]["content"] == "Hello"
        assert data["messages"][1]["role"] == "assistant"
        assert data["messages"][1]["content"] == "Hi there!"

    def test_save_markdown(self, sample_session: Session, sample_messages: list[Message], temp_dir) -> None:
        """测试：保存 Markdown 文件."""
        exporter = ChatExporter(sample_session, sample_messages)
        path = str(temp_dir / "export.md")
        exporter.save(path, "md")

        import os
        assert os.path.exists(path)
        content = open(path, encoding="utf-8").read()
        assert "# Test Session" in content

    def test_save_json(self, sample_session: Session, sample_messages: list[Message], temp_dir) -> None:
        """测试：保存 JSON 文件."""
        exporter = ChatExporter(sample_session, sample_messages)
        path = str(temp_dir / "export.json")
        exporter.save(path, "json")

        import os
        import json
        assert os.path.exists(path)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        assert data["session"]["id"] == "s1"

    def test_empty_session(self, sample_session: Session) -> None:
        """测试：空会话导出."""
        exporter = ChatExporter(sample_session, [])
        md = exporter.to_markdown()
        json_str = exporter.to_json()

        assert "# Test Session" in md
        assert "## 你" not in md

        import json
        data = json.loads(json_str)
        assert data["messages"] == []

    def test_to_pdf_returns_bytes(self, sample_session: Session, sample_messages: list[Message]) -> None:
        """测试：导出为 PDF 格式返回字节数据."""
        exporter = ChatExporter(sample_session, sample_messages)
        pdf_bytes = exporter.to_pdf()

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0
        # PDF 文件以 %PDF- 开头
        assert pdf_bytes[:4] == b"%PDF"

    def test_to_pdf_with_empty_session(self, sample_session: Session) -> None:
        """测试：空会话导出为 PDF."""
        exporter = ChatExporter(sample_session, [])
        pdf_bytes = exporter.to_pdf()

        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 0
        assert pdf_bytes[:4] == b"%PDF"

    def test_save_pdf(self, sample_session: Session, sample_messages: list[Message], temp_dir) -> None:
        """测试：保存 PDF 文件."""
        exporter = ChatExporter(sample_session, sample_messages)
        path = str(temp_dir / "export.pdf")
        exporter.save(path, "pdf")

        import os
        assert os.path.exists(path)
        with open(path, "rb") as f:
            content = f.read()
        assert content[:4] == b"%PDF"

    def test_save_unsupported_format_raises_error(self, sample_session: Session, sample_messages: list[Message]) -> None:
        """测试：不支持的格式抛出异常."""
        exporter = ChatExporter(sample_session, sample_messages)

        with pytest.raises(ValueError, match="Unsupported format"):
            exporter.save("export.txt", "txt")

    def test_wrap_text_short(self, sample_session: Session, sample_messages: list[Message]) -> None:
        """测试：短文本换行."""
        exporter = ChatExporter(sample_session, sample_messages)
        lines = exporter._wrap_text("Short text", 190)

        assert len(lines) == 1
        assert lines[0] == "Short text"

    def test_wrap_text_long(self, sample_session: Session, sample_messages: list[Message]) -> None:
        """测试：长文本换行."""
        exporter = ChatExporter(sample_session, sample_messages)
        long_text = "This is a very long text that should be wrapped into multiple lines for testing purposes."
        lines = exporter._wrap_text(long_text, 50)

        assert len(lines) > 1

    def test_wrap_text_empty(self, sample_session: Session, sample_messages: list[Message]) -> None:
        """测试：空文本换行."""
        exporter = ChatExporter(sample_session, sample_messages)
        lines = exporter._wrap_text("", 190)

        assert lines == [""]
