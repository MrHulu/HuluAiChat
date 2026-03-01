"""OpenAI 客户端测试。"""
from unittest.mock import MagicMock, Mock, patch

import pytest

from src.chat.openai_client import OpenHuluChatClient
from src.chat.client import ChatError, TextChunk, DoneChunk, is_error
from src.config.models import Provider


class TestOpenHuluChatClient:
    """OpenAI 流式客户端测试。"""

    def test_stream_chat_success(self):
        """测试成功流式响应。"""
        client = OpenHuluChatClient()
        provider = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            api_key="sk-test",
            model_id="gpt-4",
        )
        messages = [{"role": "user", "content": "Hello"}]

        chunks_received = []

        def on_chunk(chunk):
            chunks_received.append(chunk)

        # Mock OpenAI client
        mock_stream = MagicMock()
        mock_choice = MagicMock()
        mock_delta = MagicMock()
        mock_delta.content = "Hello"
        mock_choice.delta = mock_delta
        mock_choice.finish_reason = None
        mock_chunk = MagicMock()
        mock_chunk.choices = [mock_choice]

        # 模拟两个文本块和一个结束
        mock_stream.__iter__ = Mock(return_value=iter([
            mock_chunk,
            MagicMock(choices=[]),  # DoneChunk trigger
        ]))

        with patch("src.chat.openai_client.OpenAI") as mock_openai:
            mock_api = MagicMock()
            mock_api.chat.completions.create.return_value = mock_stream
            mock_openai.return_value = mock_api

            client.stream_chat(provider, messages, on_chunk)

        # 验证
        assert len(chunks_received) >= 1
        assert isinstance(chunks_received[0], TextChunk)
        assert chunks_received[0].content == "Hello"

    def test_stream_chat_connection_error(self):
        """测试连接错误。"""
        from openai import APIConnectionError

        client = OpenHuluChatClient()
        provider = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            api_key="sk-test",
            model_id="gpt-4",
        )
        messages = [{"role": "user", "content": "Hello"}]

        chunks_received = []

        def on_chunk(chunk):
            chunks_received.append(chunk)

        with patch("src.chat.openai_client.OpenAI") as mock_openai:
            mock_api = MagicMock()
            # APIConnectionError 需要 request 和 message 参数
            mock_request = MagicMock()
            mock_api.chat.completions.create.side_effect = APIConnectionError(
                request=mock_request,
                message="Connection failed"
            )
            mock_openai.return_value = mock_api

            client.stream_chat(provider, messages, on_chunk)

        assert len(chunks_received) == 1
        assert is_error(chunks_received[0])
        assert chunks_received[0].code == "connection"
        assert chunks_received[0].transient is True

    def test_stream_chat_api_error(self):
        """测试 API 错误。"""
        from openai import APIStatusError

        client = OpenHuluChatClient()
        provider = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            api_key="sk-test",
            model_id="gpt-4",
        )
        messages = [{"role": "user", "content": "Hello"}]

        chunks_received = []

        def on_chunk(chunk):
            chunks_received.append(chunk)

        with patch("src.chat.openai_client.OpenAI") as mock_openai:
            mock_api = MagicMock()
            error = APIStatusError(
                message="Rate limit exceeded",
                response=MagicMock(status_code=429),
                body=None,
            )
            mock_api.chat.completions.create.side_effect = error
            mock_openai.return_value = mock_api

            client.stream_chat(provider, messages, on_chunk)

        assert len(chunks_received) == 1
        assert isinstance(chunks_received[0], ChatError)
        assert chunks_received[0].code == "api_error"

    def test_stream_chat_sends_done_chunk(self):
        """测试流结束后发送 DoneChunk。"""
        client = OpenHuluChatClient()
        provider = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            api_key="sk-test",
            model_id="gpt-4",
        )
        messages = [{"role": "user", "content": "Hello"}]

        chunks_received = []

        def on_chunk(chunk):
            chunks_received.append(chunk)

        mock_stream = MagicMock()
        # 返回空的 choices 列表来触发循环结束
        mock_stream.__iter__ = Mock(return_value=iter([]))

        with patch("src.chat.openai_client.OpenAI") as mock_openai:
            mock_api = MagicMock()
            mock_api.chat.completions.create.return_value = mock_stream
            mock_openai.return_value = mock_api

            client.stream_chat(provider, messages, on_chunk)

        # 验证 DoneChunk 被发送
        done_chunks = [c for c in chunks_received if isinstance(c, DoneChunk)]
        assert len(done_chunks) == 1

    def test_base_url_normalization(self):
        """测试 base_url 标准化（去除尾部斜杠）。"""
        client = OpenHuluChatClient()
        provider = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1/",
            api_key="sk-test",
            model_id="gpt-4",
        )
        messages = []

        mock_stream = MagicMock()
        mock_stream.__iter__ = Mock(return_value=iter([]))

        with patch("src.chat.openai_client.OpenAI") as mock_openai:
            mock_api = MagicMock()
            mock_api.chat.completions.create.return_value = mock_stream
            mock_openai.return_value = mock_api

            client.stream_chat(provider, messages, lambda c: None)

            # 验证 base_url 被正确处理
            call_args = mock_openai.call_args
            assert call_args[1]["base_url"] == "https://api.openai.com/v1/"
