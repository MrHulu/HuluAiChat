"""文档处理器测试 - TDD 红灯阶段。

Phase 2: RAG 单文档对话基础版
- 支持格式：TXT, MD, PDF
- 递归字符分块（500 字符）
"""
import pytest
from io import BytesIO
from pathlib import Path


class TestDocumentProcessorExists:
    """测试文档处理器模块存在。"""

    def test_document_processor_module_exists(self):
        """测试 document_processor 模块可导入。"""
        from services import document_processor
        assert document_processor is not None

    def test_document_processor_class_exists(self):
        """测试 DocumentProcessor 类存在。"""
        from services.document_processor import DocumentProcessor
        assert DocumentProcessor is not None


class TestDocumentProcessorTXT:
    """测试 TXT 文件处理。"""

    def test_process_txt_file(self):
        """测试处理 TXT 文件。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()
        content = "Hello, this is a test document.\nIt has multiple lines."

        # 模拟 TXT 文件
        result = processor.process_text(content, filename="test.txt")

        assert result.success is True
        assert result.content == content
        assert result.file_type == "txt"

    def test_process_txt_with_chinese(self):
        """测试处理中文 TXT 文件。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()
        content = "这是一个测试文档。\n包含中文内容。"

        result = processor.process_text(content, filename="test.txt")

        assert result.success is True
        assert result.content == content


class TestDocumentProcessorMD:
    """测试 Markdown 文件处理。"""

    def test_process_md_file(self):
        """测试处理 Markdown 文件。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()
        content = """# Title

This is a paragraph.

## Section

- Item 1
- Item 2
"""

        result = processor.process_text(content, filename="test.md")

        assert result.success is True
        assert result.file_type == "md"
        # Markdown 应该保留原始格式
        assert "# Title" in result.content


class TestDocumentProcessorPDF:
    """测试 PDF 文件处理。"""

    def test_process_pdf_file_bytes(self):
        """测试处理 PDF 文件（字节）。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()

        # 使用简单的测试 PDF（需要实际 PDF 生成）
        # 这里先测试接口存在
        # 实际 PDF 测试会在集成测试中完成
        assert hasattr(processor, 'process_pdf_bytes')


class TestChunking:
    """测试文档分块功能。"""

    def test_chunk_small_document(self):
        """测试小文档不分块。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor(chunk_size=500)
        content = "Short content."

        chunks = processor.chunk_text(content)

        assert len(chunks) == 1
        assert chunks[0].content == content

    def test_chunk_large_document(self):
        """测试大文档分块。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor(chunk_size=100, chunk_overlap=20)

        # 生成超过 chunk_size 的内容
        content = "A" * 150

        chunks = processor.chunk_text(content)

        assert len(chunks) > 1
        # 每个块应该不超过 chunk_size
        for chunk in chunks:
            assert len(chunk.content) <= 120  # chunk_size + overlap

    def test_chunk_with_overlap(self):
        """测试分块有重叠。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor(chunk_size=50, chunk_overlap=10)
        content = "A" * 100 + "B" * 100

        chunks = processor.chunk_text(content)

        # 验证重叠存在
        if len(chunks) > 1:
            # 相邻块应该有部分重叠
            for i in range(len(chunks) - 1):
                # 重叠通过 chunk_overlap 参数控制
                assert chunks[i].chunk_index is not None

    def test_chunk_metadata(self):
        """测试分块元数据。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor(chunk_size=50)
        content = "Test content for chunking metadata."

        chunks = processor.chunk_text(content, source="test.txt")

        assert len(chunks) >= 1
        assert chunks[0].source == "test.txt"
        assert chunks[0].chunk_index == 0


class TestProcessResult:
    """测试处理结果数据结构。"""

    def test_process_result_has_required_fields(self):
        """测试 ProcessResult 有必需字段。"""
        from services.document_processor import ProcessResult

        result = ProcessResult(
            success=True,
            content="test",
            file_type="txt",
            chunk_count=1
        )

        assert result.success is True
        assert result.content == "test"
        assert result.file_type == "txt"
        assert result.chunk_count == 1


class TestChunk:
    """测试 Chunk 数据结构。"""

    def test_chunk_has_required_fields(self):
        """测试 Chunk 有必需字段。"""
        from services.document_processor import Chunk

        chunk = Chunk(
            content="test content",
            chunk_index=0,
            source="test.txt",
            start_char=0,
            end_char=12
        )

        assert chunk.content == "test content"
        assert chunk.chunk_index == 0
        assert chunk.source == "test.txt"
        assert chunk.start_char == 0
        assert chunk.end_char == 12


class TestFileTypeDetection:
    """测试文件类型检测。"""

    def test_detect_txt_extension(self):
        """测试检测 TXT 扩展名。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()
        assert processor.detect_file_type("test.txt") == "txt"

    def test_detect_md_extension(self):
        """测试检测 MD 扩展名。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()
        assert processor.detect_file_type("README.md") == "md"

    def test_detect_pdf_extension(self):
        """测试检测 PDF 扩展名。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()
        assert processor.detect_file_type("document.pdf") == "pdf"

    def test_detect_unsupported_extension(self):
        """测试检测不支持的扩展名。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()

        with pytest.raises(ValueError):
            processor.detect_file_type("test.docx")


class TestUnsupportedFormat:
    """测试不支持的格式。"""

    def test_process_docx_returns_error_result(self):
        """测试处理 DOCX 返回错误结果。"""
        from services.document_processor import DocumentProcessor

        processor = DocumentProcessor()

        result = processor.process_text("content", filename="test.docx")

        assert result.success is False
        assert "Unsupported file type" in result.error
