"""配置模型序列化测试。"""
import pytest

from src.config.models import Provider, AppConfig, default_config


class TestProvider:
    """Provider 模型测试。"""

    def test_to_json(self) -> None:
        """测试序列化为 JSON。"""
        provider = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            api_key="sk-test",
            model_id="gpt-4",
        )
        data = provider.to_json()
        assert data == {
            "id": "p1",
            "name": "OpenAI",
            "base_url": "https://api.openai.com/v1",
            "api_key": "sk-test",
            "model_id": "gpt-4",
        }

    def test_from_json(self) -> None:
        """测试从 JSON 反序列化。"""
        data = {
            "id": "p1",
            "name": "OpenAI",
            "base_url": "https://api.openai.com/v1",
            "api_key": "sk-test",
            "model_id": "gpt-4",
        }
        provider = Provider.from_json(data)
        assert provider.id == "p1"
        assert provider.name == "OpenAI"
        assert provider.base_url == "https://api.openai.com/v1"
        assert provider.api_key == "sk-test"
        assert provider.model_id == "gpt-4"

    def test_roundtrip(self) -> None:
        """测试序列化/反序列化往返。"""
        original = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            api_key="sk-test",
            model_id="gpt-4",
        )
        restored = Provider.from_json(original.to_json())
        assert restored.id == original.id
        assert restored.name == original.name
        assert restored.base_url == original.base_url
        assert restored.api_key == original.api_key
        assert restored.model_id == original.model_id


class TestAppConfig:
    """AppConfig 模型测试。"""

    def test_defaults(self) -> None:
        """测试默认值。"""
        config = AppConfig()
        assert config.providers == []
        assert config.current_provider_id is None
        assert config.theme == "dark"
        assert config.sidebar_expanded is True

    def test_to_json(self) -> None:
        """测试序列化为 JSON。"""
        provider = Provider(
            id="p1",
            name="OpenAI",
            base_url="https://api.openai.com/v1",
            api_key="sk-test",
            model_id="gpt-4",
        )
        config = AppConfig(
            providers=[provider],
            current_provider_id="p1",
            theme="light",
            sidebar_expanded=False,
        )
        data = config.to_json()
        assert data["providers"] == [provider.to_json()]
        assert data["current_provider_id"] == "p1"
        assert data["theme"] == "light"
        assert data["sidebar_expanded"] is False

    def test_from_json_empty(self) -> None:
        """测试从空 JSON 反序列化。"""
        config = AppConfig.from_json({})
        assert config.providers == []
        assert config.current_provider_id is None
        assert config.theme == "dark"  # 默认值
        assert config.sidebar_expanded is True  # 默认值

    def test_from_json_with_data(self) -> None:
        """测试从完整 JSON 反序列化。"""
        data = {
            "providers": [
                {
                    "id": "p1",
                    "name": "OpenAI",
                    "base_url": "https://api.openai.com/v1",
                    "api_key": "sk-test",
                    "model_id": "gpt-4",
                }
            ],
            "current_provider_id": "p1",
            "theme": "light",
            "sidebar_expanded": False,
        }
        config = AppConfig.from_json(data)
        assert len(config.providers) == 1
        assert config.providers[0].id == "p1"
        assert config.current_provider_id == "p1"
        assert config.theme == "light"
        assert config.sidebar_expanded is False

    def test_roundtrip(self) -> None:
        """测试序列化/反序列化往返。"""
        original = AppConfig(
            providers=[
                Provider(
                    id="p1",
                    name="OpenAI",
                    base_url="https://api.openai.com/v1",
                    api_key="sk-test",
                    model_id="gpt-4",
                )
            ],
            current_provider_id="p1",
            theme="light",
            sidebar_expanded=False,
        )
        restored = AppConfig.from_json(original.to_json())
        assert len(restored.providers) == 1
        assert restored.providers[0].id == original.providers[0].id
        assert restored.current_provider_id == original.current_provider_id
        assert restored.theme == original.theme
        assert restored.sidebar_expanded == original.sidebar_expanded


class TestDefaultConfig:
    """默认配置工厂测试。"""

    def test_default_config(self) -> None:
        """测试默认配置。"""
        config = default_config()
        assert config.providers == []
        assert config.current_provider_id is None
        assert config.theme == "dark"
        assert config.sidebar_expanded is True
