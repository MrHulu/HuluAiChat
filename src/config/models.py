"""配置数据结构与 JSON 序列化。"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Provider:
    """单个 AI Provider 配置（OpenAI 兼容）。"""
    id: str
    name: str
    base_url: str
    api_key: str
    model_id: str

    def to_json(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "base_url": self.base_url,
            "api_key": self.api_key,
            "model_id": self.model_id,
        }

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "Provider":
        return cls(
            id=data["id"],
            name=data["name"],
            base_url=data["base_url"],
            api_key=data["api_key"],
            model_id=data["model_id"],
        )


@dataclass
class AppConfig:
    """应用配置：providers、当前 Provider、主题、侧边栏状态。"""
    providers: list[Provider] = field(default_factory=list)
    current_provider_id: str | None = None
    theme: str = "dark"
    sidebar_expanded: bool = True

    def to_json(self) -> dict[str, Any]:
        return {
            "providers": [p.to_json() for p in self.providers],
            "current_provider_id": self.current_provider_id,
            "theme": self.theme,
            "sidebar_expanded": self.sidebar_expanded,
        }

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "AppConfig":
        providers = [Provider.from_json(p) for p in data.get("providers", [])]
        return cls(
            providers=providers,
            current_provider_id=data.get("current_provider_id"),
            theme=data.get("theme", "dark"),
            sidebar_expanded=data.get("sidebar_expanded", True),
        )


def default_config() -> AppConfig:
    """默认配置：空 providers、暗色主题、侧边栏展开。"""
    return AppConfig(theme="dark", sidebar_expanded=True)
