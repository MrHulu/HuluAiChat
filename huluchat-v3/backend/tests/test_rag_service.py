"""RAG 服务测试 - TDD 红灯阶段。

Phase 2: RAG 单文档对话基础版
- 单文档上传和处理
- 语义检索
- 对话时显示引用来源
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from typing import List


class TestRAGServiceExists:
    """测试 RAG 服务模块存在。"""

    def test_rag_service_module_exists(self):
        """测试 rag_service 模块可导入。"""
        from services import rag_service
        assert rag_service is not None

    def test_rag_service_class_exists(self):
        """测试 RAGService 类存在。"""
        from services.rag_service import RAGService
        assert RAGService is not None


class TestDocumentIndexing:
    """测试文档索引功能。"""

    @pytest.mark.asyncio
    async def test_index_document(self):
        """测试索引文档。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.add = MagicMock()

            # Mock embedding service
            mock_embedding = AsyncMock(return_value=[[0.1] * 1536])
            with patch.object(service.embedding_service, 'embed_batch', mock_embedding):
                result = await service.index_document(
                    doc_id="test-doc-1",
                    content="This is a test document.",
                    filename="test.txt"
                )

                assert result.success is True
                assert result.doc_id == "test-doc-1"

    @pytest.mark.asyncio
    async def test_index_document_with_chunks(self):
        """测试索引文档（分块）。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.add = MagicMock()

            # Mock embedding service
            mock_embedding = AsyncMock(return_value=[[0.1] * 1536] * 3)
            with patch.object(service.embedding_service, 'embed_batch', mock_embedding):
                # 长文档会被分块
                long_content = "A" * 1000
                result = await service.index_document(
                    doc_id="test-doc-2",
                    content=long_content,
                    filename="test.txt"
                )

                assert result.success is True
                # 应该被分成多个块
                assert result.chunk_count >= 1

    @pytest.mark.asyncio
    async def test_index_document_returns_doc_id(self):
        """测试索引文档返回文档 ID。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.add = MagicMock()

            # Mock embedding service
            mock_embedding = AsyncMock(return_value=[[0.1] * 1536])
            with patch.object(service.embedding_service, 'embed_batch', mock_embedding):
                result = await service.index_document(
                    doc_id="custom-id",
                    content="content",
                    filename="test.txt"
                )

                assert result.doc_id == "custom-id"


class TestDocumentRetrieval:
    """测试文档检索功能。"""

    @pytest.mark.asyncio
    async def test_retrieve_relevant_chunks(self):
        """测试检索相关块。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.query = MagicMock(
                return_value={
                    'ids': [['chunk-1', 'chunk-2']],
                    'documents': [['content 1', 'content 2']],
                    'metadatas': [[
                        {'source': 'test.txt', 'chunk_index': 0},
                        {'source': 'test.txt', 'chunk_index': 1}
                    ]],
                    'distances': [[0.1, 0.2]]
                }
            )

            # Mock embedding service
            mock_embed = AsyncMock(return_value=[0.1] * 1536)
            with patch.object(service.embedding_service, 'embed', mock_embed):
                results = await service.retrieve(
                    query="test query",
                    n_results=2
                )

                assert len(results) == 2
                assert results[0].content == 'content 1'
                assert results[0].source == 'test.txt'

    @pytest.mark.asyncio
    async def test_retrieve_returns_metadata(self):
        """测试检索返回元数据。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.query = MagicMock(
                return_value={
                    'ids': [['chunk-1']],
                    'documents': [['content']],
                    'metadatas': [[{'source': 'doc.pdf', 'chunk_index': 0}]],
                    'distances': [[0.1]]
                }
            )

            # Mock embedding service
            mock_embed = AsyncMock(return_value=[0.1] * 1536)
            with patch.object(service.embedding_service, 'embed', mock_embed):
                results = await service.retrieve("test")

                assert results[0].source == 'doc.pdf'
                assert results[0].chunk_index == 0

    @pytest.mark.asyncio
    async def test_retrieve_empty_collection(self):
        """测试检索空集合。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.query = MagicMock(
                return_value={
                    'ids': [[]],
                    'documents': [[]],
                    'metadatas': [[]],
                    'distances': [[]]
                }
            )

            # Mock embedding service
            mock_embed = AsyncMock(return_value=[0.1] * 1536)
            with patch.object(service.embedding_service, 'embed', mock_embed):
                results = await service.retrieve("test")

                assert len(results) == 0


class TestDocumentDeletion:
    """测试文档删除功能。"""

    @pytest.mark.asyncio
    async def test_delete_document(self):
        """测试删除文档。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.delete = MagicMock()
            mock_collection.return_value.get = MagicMock(
                return_value={'ids': ['chunk-1', 'chunk-2']}
            )

            result = await service.delete_document("test-doc-1")

            assert result.success is True

    @pytest.mark.asyncio
    async def test_delete_nonexistent_document(self):
        """测试删除不存在的文档。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.delete = MagicMock()
            mock_collection.return_value.get = MagicMock(
                return_value={'ids': []}
            )

            result = await service.delete_document("nonexistent")

            # 删除不存在的文档也算成功
            assert result.success is True


class TestRAGContextBuilding:
    """测试 RAG 上下文构建。"""

    def test_build_context_from_chunks(self):
        """测试从块构建上下文。"""
        from services.rag_service import RAGService, RetrievedChunk

        service = RAGService()

        chunks = [
            RetrievedChunk(
                content="First chunk",
                source="test.txt",
                chunk_index=0,
                score=0.9
            ),
            RetrievedChunk(
                content="Second chunk",
                source="test.txt",
                chunk_index=1,
                score=0.8
            )
        ]

        context = service.build_context(chunks)

        assert "First chunk" in context
        assert "Second chunk" in context
        assert "test.txt" in context

    def test_build_context_with_citations(self):
        """测试构建带引用的上下文。"""
        from services.rag_service import RAGService, RetrievedChunk

        service = RAGService()

        chunks = [
            RetrievedChunk(
                content="Important fact",
                source="report.pdf",
                chunk_index=0,
                score=0.95
            )
        ]

        context = service.build_context(chunks, include_citations=True)

        # 上下文应该包含引用信息
        assert "[report.pdf]" in context or "report.pdf" in context


class TestRetrievedChunk:
    """测试 RetrievedChunk 数据结构。"""

    def test_retrieved_chunk_has_required_fields(self):
        """测试 RetrievedChunk 有必需字段。"""
        from services.rag_service import RetrievedChunk

        chunk = RetrievedChunk(
            content="test content",
            source="test.txt",
            chunk_index=0,
            score=0.9
        )

        assert chunk.content == "test content"
        assert chunk.source == "test.txt"
        assert chunk.chunk_index == 0
        assert chunk.score == 0.9


class TestIndexResult:
    """测试 IndexResult 数据结构。"""

    def test_index_result_has_required_fields(self):
        """测试 IndexResult 有必需字段。"""
        from services.rag_service import IndexResult

        result = IndexResult(
            success=True,
            doc_id="test-doc",
            chunk_count=5
        )

        assert result.success is True
        assert result.doc_id == "test-doc"
        assert result.chunk_count == 5

    def test_index_result_with_error(self):
        """测试 IndexResult 带错误。"""
        from services.rag_service import IndexResult

        result = IndexResult(
            success=False,
            doc_id="test-doc",
            chunk_count=0,
            error="Failed to index"
        )

        assert result.success is False
        assert result.error == "Failed to index"


class TestRAGServiceConfig:
    """测试 RAG 服务配置。"""

    def test_default_collection_name(self):
        """测试默认集合名称。"""
        from services.rag_service import RAGService

        service = RAGService()
        assert service.collection_name == "huluchat_documents"

    def test_custom_collection_name(self):
        """测试自定义集合名称。"""
        from services.rag_service import RAGService

        service = RAGService(collection_name="custom_collection")
        assert service.collection_name == "custom_collection"

    def test_default_n_results(self):
        """测试默认检索数量。"""
        from services.rag_service import RAGService

        service = RAGService()
        assert service.default_n_results == 5


class TestListDocuments:
    """测试列出文档功能。"""

    @pytest.mark.asyncio
    async def test_list_documents_empty(self):
        """测试列出空文档列表。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.get = MagicMock(
                return_value={'ids': [], 'metadatas': []}
            )

            docs = await service.list_documents()

            assert len(docs) == 0

    @pytest.mark.asyncio
    async def test_list_documents(self):
        """测试列出文档。"""
        from services.rag_service import RAGService

        service = RAGService()

        with patch.object(service, '_get_collection') as mock_collection:
            mock_collection.return_value.get = MagicMock(
                return_value={
                    'ids': ['doc1-chunk0', 'doc1-chunk1', 'doc2-chunk0'],
                    'metadatas': [
                        {'doc_id': 'doc1', 'source': 'a.txt'},
                        {'doc_id': 'doc1', 'source': 'a.txt'},
                        {'doc_id': 'doc2', 'source': 'b.txt'},
                    ]
                }
            )

            docs = await service.list_documents()

            # 应该去重，只返回唯一的文档
            assert len(docs) == 2
