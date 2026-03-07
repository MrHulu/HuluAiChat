"""RAG API 测试 - TDD 红灯阶段。

Phase 2: RAG 单文档对话基础版
- POST /upload - 上传文档
- POST /query - 查询相关内容
- GET /documents - 列出文档
- DELETE /documents/{doc_id} - 删除文档
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from io import BytesIO


class TestRAGAPIExists:
    """测试 RAG API 模块存在。"""

    def test_rag_api_module_exists(self):
        """测试 rag API 模块可导入。"""
        from api import rag
        assert rag is not None

    def test_rag_router_exists(self):
        """测试 rag router 存在。"""
        from api.rag import router
        assert router is not None


class TestUploadDocument:
    """测试文档上传端点。"""

    @pytest.mark.asyncio
    async def test_upload_txt_file(self):
        """测试上传 TXT 文件。"""
        from api.rag import upload_document
        from fastapi import UploadFile

        # Mock file
        file_content = b"This is a test document."
        file = UploadFile(
            filename="test.txt",
            file=BytesIO(file_content)
        )

        with patch("api.rag.rag_service") as mock_service:
            mock_service.index_document = AsyncMock(
                return_value=MagicMock(
                    success=True,
                    doc_id="test-doc-1",
                    chunk_count=1
                )
            )

            result = await upload_document(file)

            assert result.success is True
            # doc_id 是 API 生成的 UUID，格式正确即可
            assert result.doc_id is not None

    @pytest.mark.asyncio
    async def test_upload_md_file(self):
        """测试上传 Markdown 文件。"""
        from api.rag import upload_document
        from fastapi import UploadFile

        file_content = b"# Title\n\nThis is markdown content."
        file = UploadFile(
            filename="test.md",
            file=BytesIO(file_content)
        )

        with patch("api.rag.rag_service") as mock_service:
            mock_service.index_document = AsyncMock(
                return_value=MagicMock(
                    success=True,
                    doc_id="test-doc-2",
                    chunk_count=1
                )
            )

            result = await upload_document(file)

            assert result.success is True

    @pytest.mark.asyncio
    async def test_upload_pdf_file(self):
        """测试上传 PDF 文件。"""
        from api.rag import upload_document
        from fastapi import UploadFile

        # Mock PDF (实际 PDF 内容需要更复杂，这里简化)
        file_content = b"%PDF-1.4 mock pdf content"
        file = UploadFile(
            filename="test.pdf",
            file=BytesIO(file_content)
        )

        with patch("api.rag.rag_service") as mock_service, \
             patch("api.rag.document_processor") as mock_processor:
            mock_processor.process_pdf_bytes = MagicMock(
                return_value=MagicMock(
                    success=True,
                    content="Extracted PDF text",
                    file_type="pdf"
                )
            )
            mock_service.index_document = AsyncMock(
                return_value=MagicMock(
                    success=True,
                    doc_id="test-doc-3",
                    chunk_count=1
                )
            )

            result = await upload_document(file)

            assert result.success is True

    @pytest.mark.asyncio
    async def test_upload_unsupported_file(self):
        """测试上传不支持的文件类型。"""
        from api.rag import upload_document
        from fastapi import UploadFile, HTTPException

        file_content = b"some content"
        file = UploadFile(
            filename="test.docx",
            file=BytesIO(file_content)
        )

        with pytest.raises(HTTPException) as exc_info:
            await upload_document(file)

        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_upload_file_too_large(self):
        """测试上传超大文件。"""
        from api.rag import upload_document
        from fastapi import UploadFile, HTTPException

        # 模拟 10MB 文件（超过 5MB 限制）
        file_content = b"x" * (6 * 1024 * 1024)
        file = UploadFile(
            filename="large.txt",
            file=BytesIO(file_content)
        )

        with pytest.raises(HTTPException) as exc_info:
            await upload_document(file)

        assert exc_info.value.status_code == 413


class TestQueryDocuments:
    """测试文档查询端点。"""

    @pytest.mark.asyncio
    async def test_query_documents(self):
        """测试查询文档。"""
        from api.rag import query_documents, QueryRequest

        request = QueryRequest(
            query="test query",
            n_results=3
        )

        with patch("api.rag.rag_service") as mock_service:
            mock_service.retrieve = AsyncMock(
                return_value=[
                    MagicMock(
                        content="content 1",
                        source="doc.txt",
                        chunk_index=0,
                        score=0.9
                    )
                ]
            )
            mock_service.build_context = MagicMock(
                return_value="[doc.txt#0]\ncontent 1"
            )

            result = await query_documents(request)

            assert result.success is True
            assert len(result.chunks) == 1
            assert result.context is not None

    @pytest.mark.asyncio
    async def test_query_with_empty_result(self):
        """测试查询无结果。"""
        from api.rag import query_documents, QueryRequest

        request = QueryRequest(
            query="nonexistent",
            n_results=5
        )

        with patch("api.rag.rag_service") as mock_service:
            mock_service.retrieve = AsyncMock(return_value=[])
            mock_service.build_context = MagicMock(return_value="")

            result = await query_documents(request)

            assert result.success is True
            assert len(result.chunks) == 0
            assert result.context == ""


class TestListDocuments:
    """测试列出文档端点。"""

    @pytest.mark.asyncio
    async def test_list_documents(self):
        """测试列出文档。"""
        from api.rag import list_documents

        with patch("api.rag.rag_service") as mock_service:
            mock_service.list_documents = AsyncMock(
                return_value=[
                    MagicMock(doc_id="doc-1", filename="a.txt", chunk_count=3),
                    MagicMock(doc_id="doc-2", filename="b.md", chunk_count=2),
                ]
            )

            result = await list_documents()

            assert len(result.documents) == 2

    @pytest.mark.asyncio
    async def test_list_documents_empty(self):
        """测试列出空文档。"""
        from api.rag import list_documents

        with patch("api.rag.rag_service") as mock_service:
            mock_service.list_documents = AsyncMock(return_value=[])

            result = await list_documents()

            assert len(result.documents) == 0


class TestDeleteDocument:
    """测试删除文档端点。"""

    @pytest.mark.asyncio
    async def test_delete_document(self):
        """测试删除文档。"""
        from api.rag import delete_document

        with patch("api.rag.rag_service") as mock_service:
            mock_service.delete_document = AsyncMock(
                return_value=MagicMock(success=True, doc_id="doc-1", error=None)
            )

            result = await delete_document("doc-1")

            assert result.success is True
            assert result.doc_id == "doc-1"

    @pytest.mark.asyncio
    async def test_delete_nonexistent_document(self):
        """测试删除不存在的文档。"""
        from api.rag import delete_document

        with patch("api.rag.rag_service") as mock_service:
            mock_service.delete_document = AsyncMock(
                return_value=MagicMock(success=True, doc_id="nonexistent", error=None)
            )

            result = await delete_document("nonexistent")

            # 删除不存在的文档也算成功
            assert result.success is True


class TestQueryRequest:
    """测试 QueryRequest 数据模型。"""

    def test_query_request_required_fields(self):
        """测试 QueryRequest 必需字段。"""
        from api.rag import QueryRequest

        request = QueryRequest(query="test")

        assert request.query == "test"
        assert request.n_results == 5  # 默认值

    def test_query_request_custom_n_results(self):
        """测试自定义 n_results。"""
        from api.rag import QueryRequest

        request = QueryRequest(query="test", n_results=10)

        assert request.n_results == 10
