"""配置存储接口与 JSON 文件实现。"""
from abc import ABC, abstractmethod
import json
import os

from src.app_data import get_app_data_dir
from src.config.models import AppConfig, default_config


class ConfigStore(ABC):
    """配置存储抽象：读/写。"""

    @abstractmethod
    def load(self) -> AppConfig:
        """读取配置；文件不存在或无效时由调用方决定是否使用默认。"""
        ...

    @abstractmethod
    def save(self, config: AppConfig) -> None:
        """写入配置。"""
        ...


class JsonConfigStore(ConfigStore):
    """基于 config.json 的存储，路径在应用数据根目录。"""

    def __init__(self, config_path: str | None = None) -> None:
        self._path = config_path or os.path.join(get_app_data_dir(), "config.json")

    def load(self) -> AppConfig:
        if not os.path.isfile(self._path):
            return default_config()
        try:
            with open(self._path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return AppConfig.from_json(data)
        except (json.JSONDecodeError, KeyError, TypeError):
            return default_config()

    def save(self, config: AppConfig) -> None:
        os.makedirs(os.path.dirname(self._path), exist_ok=True)
        with open(self._path, "w", encoding="utf-8") as f:
            json.dump(config.to_json(), f, ensure_ascii=False, indent=2)


def load_or_default(store: ConfigStore | None = None) -> AppConfig:
    """从存储加载配置；不存在或失败时返回默认。应用启动时调用。"""
    s = store or JsonConfigStore()
    return s.load()
