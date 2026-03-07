"""DeepSeek 配置测试 - TDD 红灯阶段。"""
import pytest
from unittest.mock import patch, MagicMock


class TestDeepSeekConfig:
    """DeepSeek 配置测试类。"""

    def test_deepseek_api_key_config_exists(self):
        """测试 DeepSeek API Key 配置存在。"""
        from core.config import Settings

        # 验证 Settings 类有 deepseek_api_key 属性
        settings = Settings()
        assert hasattr(settings, "deepseek_api_key")

    def test_deepseek_base_url_default(self):
        """测试 DeepSeek base_url 默认值。"""
        from core.config import Settings

        settings = Settings()
        assert hasattr(settings, "deepseek_base_url")
        assert settings.deepseek_base_url == "https://api.deepseek.com"

    def test_deepseek_model_default(self):
        """测试 DeepSeek 默认模型。"""
        from core.config import Settings

        settings = Settings()
        assert hasattr(settings, "deepseek_model")
        # DeepSeek V3 (deepseek-chat) 是默认模型
        assert settings.deepseek_model == "deepseek-chat"

    def test_default_provider_is_deepseek(self):
        """测试默认 provider 是 DeepSeek。"""
        from core.config import Settings

        settings = Settings()
        assert hasattr(settings, "default_provider")
        assert settings.default_provider == "deepseek"


class TestDeepSeekModelList:
    """DeepSeek 模型列表测试。"""

    def test_deepseek_models_in_available_models(self):
        """测试 DeepSeek 模型在可用列表中。"""
        from api.settings import AVAILABLE_MODELS

        model_ids = [m.id for m in AVAILABLE_MODELS]

        # DeepSeek Chat (V3) 应该在列表中
        assert "deepseek-chat" in model_ids

    def test_deepseek_chat_is_first_in_list(self):
        """测试 DeepSeek Chat 是列表第一个（默认推荐）。"""
        from api.settings import AVAILABLE_MODELS

        # DeepSeek 应该是第一个
        assert AVAILABLE_MODELS[0].id == "deepseek-chat"

    def test_deepseek_reasoner_in_list(self):
        """测试 DeepSeek Reasoner (R1) 在列表中。"""
        from api.settings import AVAILABLE_MODELS

        model_ids = [m.id for m in AVAILABLE_MODELS]
        assert "deepseek-reasoner" in model_ids

    def test_deepseek_models_have_provider_field(self):
        """测试 DeepSeek 模型有 provider 字段。"""
        from api.settings import AVAILABLE_MODELS

        deepseek_models = [m for m in AVAILABLE_MODELS if "deepseek" in m.id]
        for model in deepseek_models:
            assert hasattr(model, "provider")
            assert model.provider == "deepseek"


class TestModelInfoWithProvider:
    """ModelInfo 带 provider 字段测试。"""

    def test_model_info_has_provider_field(self):
        """测试 ModelInfo 有 provider 字段。"""
        from api.settings import ModelInfo

        model = ModelInfo(
            id="test-model",
            name="Test Model",
            description="Test",
            provider="test-provider"
        )
        assert model.provider == "test-provider"


class TestProviderRouting:
    """Provider 路由测试。"""

    def test_get_client_for_deepseek(self):
        """测试获取 DeepSeek 客户端。"""
        from services.openai_service import get_client_for_provider

        with patch("services.openai_service.settings") as mock_settings:
            mock_settings.deepseek_api_key = "sk-deepseek-test"
            mock_settings.deepseek_base_url = "https://api.deepseek.com"

            client = get_client_for_provider("deepseek")

            # 验证返回的是 AsyncOpenAI 客户端
            assert client is not None

    def test_get_client_for_openai(self):
        """测试获取 OpenAI 客户端。"""
        from services.openai_service import get_client_for_provider

        with patch("services.openai_service.settings") as mock_settings:
            mock_settings.openai_api_key = "sk-openai-test"
            mock_settings.openai_base_url = None

            client = get_client_for_provider("openai")

            assert client is not None
