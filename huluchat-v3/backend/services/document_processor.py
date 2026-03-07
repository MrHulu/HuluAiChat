"""Document processor for RAG.

支持格式：
- TXT: 纯文本
- MD: Markdown
- PDF: PDF 文档（基础解析）

功能：
- 文档解析
- 递归字符分块（默认 500 字符）
- 元数据跟踪
"""
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, List, BinaryIO

logger = logging.getLogger(__name__)


@dataclass
class Chunk:
    """A chunk of document content."""
    content: str
    chunk_index: int
    source: str
    start_char: int
    end_char: int


@dataclass
class ProcessResult:
    """Result of document processing."""
    success: bool
    content: str
    file_type: str
    chunk_count: int
    error: Optional[str] = None


class DocumentProcessor:
    """Process documents for RAG.

    支持格式：TXT, MD, PDF
    使用递归字符分块策略。
    """

    SUPPORTED_EXTENSIONS = {".txt", ".md", ".pdf"}
    DEFAULT_CHUNK_SIZE = 500
    DEFAULT_CHUNK_OVERLAP = 50

    def __init__(
        self,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def detect_file_type(self, filename: str) -> str:
        """Detect file type from filename extension.

        Args:
            filename: 文件名

        Returns:
            文件类型（txt, md, pdf）

        Raises:
            ValueError: 不支持的文件类型
        """
        ext = Path(filename).suffix.lower()
        type_map = {
            ".txt": "txt",
            ".md": "md",
            ".pdf": "pdf"
        }

        if ext not in type_map:
            raise ValueError(
                f"Unsupported file type: {ext}. "
                f"Supported types: {', '.join(self.SUPPORTED_EXTENSIONS)}"
            )

        return type_map[ext]

    def process_text(self, content: str, filename: str) -> ProcessResult:
        """Process text content from TXT or MD files.

        Args:
            content: 文本内容
            filename: 文件名（用于类型检测）

        Returns:
            ProcessResult 包含处理结果
        """
        try:
            file_type = self.detect_file_type(filename)

            # PDF 需要用 process_pdf_bytes
            if file_type == "pdf":
                raise ValueError(
                    "PDF files must be processed with process_pdf_bytes()"
                )

            return ProcessResult(
                success=True,
                content=content,
                file_type=file_type,
                chunk_count=1
            )

        except ValueError as e:
            logger.error(f"Failed to process {filename}: {e}")
            return ProcessResult(
                success=False,
                content="",
                file_type="",
                chunk_count=0,
                error=str(e)
            )

    def process_pdf_bytes(self, file_bytes: bytes, filename: str) -> ProcessResult:
        """Process PDF file from bytes.

        Args:
            file_bytes: PDF 文件字节
            filename: 文件名

        Returns:
            ProcessResult 包含处理结果
        """
        try:
            from pypdf import PdfReader
            from io import BytesIO

            reader = PdfReader(BytesIO(file_bytes))

            # 提取所有页面的文本
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)

            content = "\n\n".join(text_parts)

            return ProcessResult(
                success=True,
                content=content,
                file_type="pdf",
                chunk_count=1
            )

        except ImportError:
            logger.error("pypdf not installed")
            return ProcessResult(
                success=False,
                content="",
                file_type="pdf",
                chunk_count=0,
                error="pypdf library not installed"
            )
        except Exception as e:
            logger.error(f"Failed to process PDF {filename}: {e}")
            return ProcessResult(
                success=False,
                content="",
                file_type="pdf",
                chunk_count=0,
                error=str(e)
            )

    def chunk_text(
        self,
        text: str,
        source: Optional[str] = None
    ) -> List[Chunk]:
        """Split text into overlapping chunks.

        使用递归字符分块策略，优先在段落和句子边界分割。

        Args:
            text: 要分块的文本
            source: 来源文件名

        Returns:
            Chunk 列表
        """
        if not text:
            return []

        source = source or "unknown"

        # 如果文本小于 chunk_size，直接返回单个 chunk
        if len(text) <= self.chunk_size:
            return [
                Chunk(
                    content=text,
                    chunk_index=0,
                    source=source,
                    start_char=0,
                    end_char=len(text)
                )
            ]

        chunks = []
        start = 0
        chunk_index = 0

        while start < len(text):
            # 计算当前 chunk 的结束位置
            end = start + self.chunk_size

            if end >= len(text):
                # 最后一个 chunk
                chunk_content = text[start:].strip()
                if chunk_content:
                    chunks.append(Chunk(
                        content=chunk_content,
                        chunk_index=chunk_index,
                        source=source,
                        start_char=start,
                        end_char=len(text)
                    ))
                break

            # 尝试在句子边界分割
            split_pos = self._find_split_position(text, end)

            chunk_content = text[start:split_pos].strip()
            if chunk_content:
                chunks.append(Chunk(
                    content=chunk_content,
                    chunk_index=chunk_index,
                    source=source,
                    start_char=start,
                    end_char=split_pos
                ))
                chunk_index += 1

            # 下一个 chunk 的开始位置（考虑重叠）
            start = split_pos - self.chunk_overlap
            if start < 0:
                start = 0

        return chunks

    def _find_split_position(self, text: str, preferred_end: int) -> int:
        """Find a good position to split text.

        优先在以下位置分割：
        1. 段落边界（\n\n）
        2. 句子边界（. ! ?）
        3. 单词边界（空格）
        4. 直接在 preferred_end 位置分割

        Args:
            text: 文本
            preferred_end: 首选结束位置

        Returns:
            分割位置
        """
        # 在 preferred_end 附近搜索分割点
        search_start = max(0, preferred_end - 100)
        search_end = min(len(text), preferred_end + 50)
        search_text = text[search_start:search_end]

        # 优先级 1: 段落边界
        paragraph_break = search_text.rfind("\n\n")
        if paragraph_break != -1:
            return search_start + paragraph_break + 2

        # 优先级 2: 换行符
        newline = search_text.rfind("\n")
        if newline != -1:
            return search_start + newline + 1

        # 优先级 3: 句子边界
        for delimiter in ["。", "！", "？", ". ", "! ", "? ", "．", "！ ", "？ "]:
            pos = search_text.rfind(delimiter)
            if pos != -1:
                return search_start + pos + len(delimiter)

        # 优先级 4: 空格
        space = search_text.rfind(" ")
        if space != -1:
            return search_start + space + 1

        # 无法找到好的分割点，直接在 preferred_end 分割
        return preferred_end
