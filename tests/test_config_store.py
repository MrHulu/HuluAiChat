"""配置存储测试。"""
import json
import os

import pytest

from src.config.models import Provider, AppConfig
from src.config.store import JsonConfigStore, load_or_default


class TestJsonConfigStore:
    """JSON 配置存储测试。"""

    def test_load_nonexistent_returns_default(self, temp_config_path: str) -> None:
        """测试：文件不存在时返回默认配置。"""
        store = JsonConfigStore(config_path=temp_config_path)
        config = store.load()
        assert config.providers == []
        assert config.theme == "dark"

    def test_load_invalid_json_returns_default(self, temp_config_path: str) -> None:
        """测试：无效 JSON 时返回默认配置。"""
        # 写入无效 JSON
        with open(temp_config_path, "w", encoding="utf-8") as f:
            f.write("{ invalid json")

        store = JsonConfigStore(config_path=temp_config_path)
        config = store.load()
        assert config.providers == []
        assert config.theme == "dark"

    def test_load_valid_json(self, temp_config_path: str) -> None:
        """测试：加载有效 JSON。"""
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
        with open(temp_config_path, "w", encoding="utf-8") as f:
            json.dump(data, f)

        store = JsonConfigStore(config_path=temp_config_path)
        config = store.load()
        assert len(config.providers) == 1
        assert config.providers[0].id == "p1"
        assert config.current_provider_id == "p1"
        assert config.theme == "light"
        assert config.sidebar_expanded is False

    def test_save_creates_directory(self, temp_dir: str) -> None:
        """测试：保存时自动创建目录。"""
        nested_path = os.path.join(temp_dir, "nested", "config.json")
        store = JsonConfigStore(config_path=nested_path)

        config = AppConfig(theme="light")
        store.save(config)

        assert os.path.isfile(nested_path)

    def test_save_roundtrip(self, temp_config_path: str) -> None:
        """测试：保存后加载能恢复数据。"""
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

        store = JsonConfigStore(config_path=temp_config_path)
        store.save(original)
        restored = store.load()

        assert len(restored.providers) == 1
        assert restored.providers[0].id == "p1"
        assert restored.current_provider_id == "p1"
        assert restored.theme == "light"
        assert restored.sidebar_expanded is False

    def test_save_pretty_printed(self, temp_config_path: str) -> None:
        """测试：保存的 JSON 是格式化的（带缩进）。"""
        store = JsonConfigStore(config_path=temp_config_path)
        store.save(AppConfig())

        with open(temp_config_path, "r", encoding="utf-8") as f:
            content = f.read()

        # 应该有缩进和换行
        assert "\n" in content
        assert "  " in content


class TestLoadOrDefault:
    """load_or_default 函数测试。"""

    def test_uses_default_store_when_none_provided(self, temp_config_path: str) -> None:
        """测试：未提供 store 时使用默认路径。"""
        # 注意：这个测试使用默认路径，可能在真实环境中创建文件
        # 在 CI 中应该使用临时目录环境变量
        config = load_or_default(store=None)
        # 应该返回某种配置（可能是默认的）
        assert isinstance(config, AppConfig)

    def test_uses_provided_store(self, temp_config_path: str) -> None:
        """测试：使用提供的 store。"""
        store = JsonConfigStore(config_path=temp_config_path)
        config = load_or_default(store=store)
        assert isinstance(config, AppConfig)
