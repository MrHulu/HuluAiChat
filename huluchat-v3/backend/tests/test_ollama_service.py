"""Ollama Service 单元测试 —— 使用 Mock，无需真实 Ollama。"""
import json
from typing import AsyncIterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import httpx

from services.ollama_service import OllamaService
from services.openai_service import StreamChunk


async def async_iter(lines: list[str]) -> AsyncIterator[str]:
    """将字符串列表转换为异步迭代器。"""
    for line in lines:
        yield line


class TestOllamaServiceIsAvailable:
    """OllamaService.is_available() 方法测试。"""

    @pytest.mark.asyncio
    async def test_returns_true_when_ollama_is_running(self):
        """Ollama 服务运行时返回 True。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value = mock_response

            service = OllamaService()
            result = await service.is_available()

            assert result is True
            mock_get.assert_called_once_with("/api/tags", timeout=5.0)

    @pytest.mark.asyncio
    async def test_returns_false_when_ollama_is_not_running(self):
        """Ollama 服务未运行时返回 False。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.ConnectError("Connection refused")

            service = OllamaService()
            result = await service.is_available()

            assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_when_ollama_returns_error_status(self):
        """Ollama 返回非 200 状态码时返回 False。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 503
            mock_get.return_value = mock_response

            service = OllamaService()
            result = await service.is_available()

            assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_on_timeout(self):
        """Ollama 响应超时时返回 False。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.TimeoutException("Request timeout")

            service = OllamaService()
            result = await service.is_available()

            assert result is False


class TestOllamaServiceListModels:
    """OllamaService.list_models() 方法测试。"""

    @pytest.mark.asyncio
    async def test_returns_models_when_ollama_is_available(self):
        """Ollama 可用时返回模型列表。"""
        mock_models_data = {
            "models": [
                {"name": "llama3:latest", "size": 4661224676, "modified_at": "2026-03-06T00:00:00Z"},
                {"name": "mistral:latest", "size": 4123456789, "modified_at": "2026-03-05T00:00:00Z"},
            ]
        }

        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = mock_models_data
            mock_get.return_value = mock_response

            service = OllamaService()
            models = await service.list_models()

            assert len(models) == 2
            assert models[0]["name"] == "llama3:latest"
            assert models[1]["name"] == "mistral:latest"
            mock_get.assert_called_once_with("/api/tags", timeout=10.0)

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_ollama_unavailable(self):
        """Ollama 不可用时返回空列表。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_get.side_effect = httpx.ConnectError("Connection refused")

            service = OllamaService()
            models = await service.list_models()

            assert models == []

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_response_has_no_models_key(self):
        """响应中没有 models 键时返回空列表。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {}
            mock_get.return_value = mock_response

            service = OllamaService()
            models = await service.list_models()

            assert models == []

    @pytest.mark.asyncio
    async def test_returns_empty_list_on_http_error(self):
        """HTTP 错误时返回空列表。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 500
            mock_get.return_value = mock_response

            service = OllamaService()
            models = await service.list_models()

            assert models == []

    @pytest.mark.asyncio
    async def test_returns_empty_list_on_json_decode_error(self):
        """JSON 解析错误时返回空列表。"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.json.side_effect = json.JSONDecodeError("Invalid JSON", "", 0)
            mock_get.return_value = mock_response

            service = OllamaService()
            models = await service.list_models()

            assert models == []


class TestOllamaServiceStreamChat:
    """OllamaService.stream_chat() 方法测试。"""

    @pytest.mark.asyncio
    async def test_yields_content_chunks_from_ollama_stream(self):
        """从 Ollama 流式响应中提取内容块。"""
        # 模拟 Ollama 的流式响应行
        stream_lines = [
            '{"message": {"content": "Hello"}}',
            '{"message": {"content": " world"}}',
            '{"done": true}',
        ]

        with patch("httpx.AsyncClient.stream") as mock_stream:
            # 设置模拟的响应
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.aiter_lines = MagicMock(return_value=async_iter(stream_lines))
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock()
            mock_stream.return_value = mock_response

            service = OllamaService()
            messages = [{"role": "user", "content": "Say hello"}]

            chunks = []
            async for chunk in service.stream_chat(messages, "llama3"):
                chunks.append(chunk)

            assert len(chunks) == 3
            assert chunks[0].content == "Hello"
            assert chunks[1].content == " world"
            assert chunks[2].is_done is True
            assert chunks[2].content == ""

    @pytest.mark.asyncio
    async def test_yields_error_when_connection_fails(self):
        """连接失败时返回错误块。"""
        with patch("httpx.AsyncClient.stream") as mock_stream:
            mock_stream.side_effect = httpx.ConnectError("Connection refused")

            service = OllamaService()
            messages = [{"role": "user", "content": "Hello"}]

            chunks = []
            async for chunk in service.stream_chat(messages, "llama3"):
                chunks.append(chunk)

            assert len(chunks) == 1
            assert chunks[0].error is not None
            assert "无法连接到 Ollama 服务" in chunks[0].error

    @pytest.mark.asyncio
    async def test_yields_error_when_timeout(self):
        """请求超时时返回错误块。"""
        with patch("httpx.AsyncClient.stream") as mock_stream:
            mock_stream.side_effect = httpx.TimeoutException("Request timeout")

            service = OllamaService()
            messages = [{"role": "user", "content": "Hello"}]

            chunks = []
            async for chunk in service.stream_chat(messages, "llama3"):
                chunks.append(chunk)

            assert len(chunks) == 1
            assert chunks[0].error is not None
            assert "超时" in chunks[0].error

    @pytest.mark.asyncio
    async def test_yields_error_when_ollama_returns_error_status(self):
        """Ollama 返回错误状态码时返回错误块。"""
        with patch("httpx.AsyncClient.stream") as mock_stream:
            mock_response = MagicMock()
            mock_response.status_code = 404
            mock_response.aread = AsyncMock(return_value=b"Model not found")
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock()
            mock_stream.return_value = mock_response

            service = OllamaService()
            messages = [{"role": "user", "content": "Hello"}]

            chunks = []
            async for chunk in service.stream_chat(messages, "llama3"):
                chunks.append(chunk)

            assert len(chunks) == 1
            assert chunks[0].error is not None
            assert "404" in chunks[0].error

    @pytest.mark.asyncio
    async def test_handles_malformed_json_lines_gracefully(self):
        """优雅处理格式错误的 JSON 行。"""
        stream_lines = [
            '{"message": {"content": "Hello"}}',
            'invalid json line',
            '{"done": true}',
        ]

        with patch("httpx.AsyncClient.stream") as mock_stream:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.aiter_lines = MagicMock(return_value=async_iter(stream_lines))
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock()
            mock_stream.return_value = mock_response

            service = OllamaService()
            messages = [{"role": "user", "content": "Hello"}]

            chunks = []
            async for chunk in service.stream_chat(messages, "llama3"):
                chunks.append(chunk)

            # 应该跳过无效 JSON，继续处理
            assert len(chunks) >= 2
            assert chunks[0].content == "Hello"

    @pytest.mark.asyncio
    async def test_handles_empty_message_content(self):
        """处理空内容的消息。"""
        stream_lines = [
            '{"message": {}}',
            '{"message": {"content": "Hello"}}',
            '{"done": true}',
        ]

        with patch("httpx.AsyncClient.stream") as mock_stream:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.aiter_lines = MagicMock(return_value=async_iter(stream_lines))
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock()
            mock_stream.return_value = mock_response

            service = OllamaService()
            messages = [{"role": "user", "content": "Hello"}]

            chunks = []
            async for chunk in service.stream_chat(messages, "llama3"):
                chunks.append(chunk)

            # 空内容的消息不应该产生 chunk
            assert chunks[0].content == "Hello"

    @pytest.mark.asyncio
    async def test_sends_correct_payload_to_ollama(self):
        """验证发送给 Ollama 的请求负载正确。"""
        with patch("httpx.AsyncClient.stream") as mock_stream:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.aiter_lines = AsyncMock(return_value=iter([]))
            mock_response.__aenter__ = AsyncMock(return_value=mock_response)
            mock_response.__aexit__ = AsyncMock()
            mock_stream.return_value = mock_response

            service = OllamaService()
            messages = [
                {"role": "user", "content": "Hello"},
                {"role": "assistant", "content": "Hi"},
            ]

            async for _ in service.stream_chat(messages, "llama3"):
                pass

            # 验证调用参数
            mock_stream.assert_called_once()
            call_args = mock_stream.call_args
            assert call_args[0][0] == "POST"
            assert call_args[0][1] == "/api/chat"

            sent_payload = call_args[1]["json"]
            assert sent_payload["model"] == "llama3"
            assert sent_payload["messages"] == messages
            assert sent_payload["stream"] is True


class TestOllamaServiceClientProperty:
    """OllamaService.client 属性测试。"""

    @pytest.mark.asyncio
    async def test_client_lazy_initialization(self):
        """测试客户端延迟初始化。"""
        with patch("httpx.AsyncClient") as mock_client_class:
            service = OllamaService()

            # 创建前 client 为 None
            assert service._client is None

            # 访问 client 属性触发初始化
            _ = service.client

            # 验证创建了客户端
            assert service._client is not None
            mock_client_class.assert_called_once()

    @pytest.mark.asyncio
    async def test_client_reuses_existing_instance(self):
        """测试客户端重用现有实例。"""
        with patch("httpx.AsyncClient") as mock_client_class:
            mock_instance = MagicMock()
            mock_client_class.return_value = mock_instance

            service = OllamaService()

            # 第一次访问
            client1 = service.client
            # 第二次访问
            client2 = service.client

            # 应该是同一个实例
            assert client1 is client2
            mock_client_class.assert_called_once()
