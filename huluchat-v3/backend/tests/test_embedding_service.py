"""嵌入服务测试 - TDD 红灯阶段。

Phase 2: RAG 单文档对话基础版
- 使用 OpenAI text-embedding-3-small
- 支持批量嵌入
- 集成 Chroma 向量存储
"""
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from typing import List


class TestEmbeddingServiceExists:
    """测试嵌入服务模块存在。"""

    def test_embedding_service_module_exists(self):
        """测试 embedding_service 模块可导入。"""
        from services import embedding_service
        assert embedding_service is not None

    def test_embedding_service_class_exists(self):
        """测试 EmbeddingService 类存在。"""
        from services.embedding_service import EmbeddingService
        assert EmbeddingService is not None


class TestEmbeddingServiceConfig:
    """测试嵌入服务配置。"""

    def test_default_embedding_model(self):
        """测试默认嵌入模型。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService()
        assert service.model == "text-embedding-3-small"

    def test_custom_embedding_model(self):
        """测试自定义嵌入模型。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService(model="text-embedding-3-large")
        assert service.model == "text-embedding-3-large"


class TestEmbeddingServiceEmbed:
    """测试嵌入生成功能。"""

    @pytest.mark.asyncio
    async def test_embed_single_text(self):
        """测试生成单个文本的嵌入。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService()

        # Mock OpenAI 客户端
        with patch.object(service, '_get_client') as mock_client:
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
            mock_client.return_value.embeddings.create = AsyncMock(
                return_value=mock_response
            )

            embedding = await service.embed("Hello world")

            assert len(embedding) == 1536
            assert all(isinstance(x, float) for x in embedding)

    @pytest.mark.asyncio
    async def test_embed_batch_texts(self):
        """测试批量生成嵌入。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService()

        with patch.object(service, '_get_client') as mock_client:
            mock_response = MagicMock()
            mock_response.data = [
                MagicMock(embedding=[0.1] * 1536),
                MagicMock(embedding=[0.2] * 1536),
            ]
            mock_client.return_value.embeddings.create = AsyncMock(
                return_value=mock_response
            )

            texts = ["Hello", "World"]
            embeddings = await service.embed_batch(texts)

            assert len(embeddings) == 2
            assert len(embeddings[0]) == 1536

    @pytest.mark.asyncio
    async def test_embed_empty_text_raises_error(self):
        """测试嵌入空文本抛出错误。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService()

        with pytest.raises(ValueError, match="empty"):
            await service.embed("")

    @pytest.mark.asyncio
    async def test_embed_returns_correct_dimension(self):
        """测试嵌入维度正确。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService()

        with patch.object(service, '_get_client') as mock_client:
            # text-embedding-3-small 返回 1536 维
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.0] * 1536)]
            mock_client.return_value.embeddings.create = AsyncMock(
                return_value=mock_response
            )

            embedding = await service.embed("test")

            assert len(embedding) == 1536


class TestEmbeddingServiceWithChroma:
    """测试与 Chroma 集成。"""

    def test_get_embedding_dimension(self):
        """测试获取嵌入维度。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService(model="text-embedding-3-small")
        dim = service.get_embedding_dimension()

        assert dim == 1536

    def test_get_embedding_dimension_large(self):
        """测试获取大模型嵌入维度。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService(model="text-embedding-3-large")
        dim = service.get_embedding_dimension()

        assert dim == 3072


class TestEmbeddingCache:
    """测试嵌入缓存。"""

    def test_embedding_service_has_cache(self):
        """测试嵌入服务有缓存属性。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService()
        assert hasattr(service, '_cache')

    @pytest.mark.asyncio
    async def test_cache_hits_on_same_text(self):
        """测试相同文本命中缓存。"""
        from services.embedding_service import EmbeddingService

        service = EmbeddingService()

        with patch.object(service, '_get_client') as mock_client:
            mock_response = MagicMock()
            mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
            mock_client.return_value.embeddings.create = AsyncMock(
                return_value=mock_response
            )

            # 第一次调用
            await service.embed("test")

            # 第二次相同文本
            await service.embed("test")

            # 应该只调用一次 API（第二次命中缓存）
            assert mock_client.return_value.embeddings.create.call_count == 1


class TestEmbeddingError:
    """测试嵌入错误处理。"""

    @pytest.mark.asyncio
    async def test_api_error_handling(self):
        """测试 API 错误处理。"""
        from services.embedding_service import EmbeddingService
        from openai import APIError

        service = EmbeddingService()

        with patch.object(service, '_get_client') as mock_client:
            mock_client.return_value.embeddings.create = AsyncMock(
                side_effect=APIError("API error", request=None, body=None)
            )

            with pytest.raises(Exception):
                await service.embed("test")

    @pytest.mark.asyncio
    async def test_rate_limit_handling(self):
        """测试速率限制处理。"""
        from services.embedding_service import EmbeddingService
        from openai import RateLimitError

        service = EmbeddingService()

        with patch.object(service, '_get_client') as mock_client:
            mock_client.return_value.embeddings.create = AsyncMock(
                side_effect=RateLimitError(
                    "Rate limit",
                    response=MagicMock(status_code=429),
                    body=None
                )
            )

            with pytest.raises(Exception):
                await service.embed("test")
