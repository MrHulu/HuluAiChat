"""配置数据结构与 JSON 序列化。"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class PromptTemplate:
    """快捷提示词模板。"""
    id: str
    title: str
    content: str
    category: str = "通用"  # 分类：通用、代码、写作、翻译等

    def to_json(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "category": self.category,
        }

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "PromptTemplate":
        return cls(
            id=data["id"],
            title=data["title"],
            content=data["content"],
            category=data.get("category", "通用"),
        )


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
    """应用配置：providers、当前 Provider、主题、侧边栏状态、提示词模板、最近搜索、代码块主题、代码块字号。"""
    providers: list[Provider] = field(default_factory=list)
    current_provider_id: str | None = None
    theme: str = "dark"
    sidebar_expanded: bool = True
    prompt_templates: list[PromptTemplate] = field(default_factory=list)
    recent_searches: list[str] = field(default_factory=list)  # 最近搜索，最多10条
    code_block_theme: str = "github_dark"  # v1.4.5: 代码块主题，默认 GitHub Dark
    code_block_font_size: int = 10  # v1.4.6: 代码块字号，默认 10 (范围 8-16)

    def to_json(self) -> dict[str, Any]:
        return {
            "providers": [p.to_json() for p in self.providers],
            "current_provider_id": self.current_provider_id,
            "theme": self.theme,
            "sidebar_expanded": self.sidebar_expanded,
            "prompt_templates": [t.to_json() for t in self.prompt_templates],
            "recent_searches": self.recent_searches,
            "code_block_theme": self.code_block_theme,
            "code_block_font_size": self.code_block_font_size,
        }

    @classmethod
    def from_json(cls, data: dict[str, Any]) -> "AppConfig":
        providers = [Provider.from_json(p) for p in data.get("providers", [])]
        templates = [PromptTemplate.from_json(t) for t in data.get("prompt_templates", [])]
        # 确保字号在有效范围内 (8-16)
        font_size = data.get("code_block_font_size", 10)
        if not isinstance(font_size, int) or font_size < 8 or font_size > 16:
            font_size = 10
        return cls(
            providers=providers,
            current_provider_id=data.get("current_provider_id"),
            theme=data.get("theme", "dark"),
            sidebar_expanded=data.get("sidebar_expanded", True),
            prompt_templates=templates,
            recent_searches=data.get("recent_searches", []),
            code_block_theme=data.get("code_block_theme", "github_dark"),
            code_block_font_size=font_size,
        )


def default_config() -> AppConfig:
    """默认配置：空 providers、暗色主题、侧边栏展开、默认提示词模板。"""
    return AppConfig(
        theme="dark",
        sidebar_expanded=True,
        prompt_templates=default_prompt_templates(),
    )


def default_prompt_templates() -> list[PromptTemplate]:
    """内置默认提示词模板。"""
    return [
        PromptTemplate(
            id="tpl-1",
            title="代码解释",
            category="代码",
            content="请详细解释以下代码的工作原理、关键逻辑和潜在改进点：\n\n```\n{selection}\n```"
        ),
        PromptTemplate(
            id="tpl-2",
            title="代码优化",
            category="代码",
            content="请分析以下代码，提供优化建议并重构：\n\n```\n{selection}\n```"
        ),
        PromptTemplate(
            id="tpl-3",
            title="翻译中英",
            category="翻译",
            content="请将以下内容翻译成{target_lang}：\n\n{selection}"
        ),
        PromptTemplate(
            id="tpl-4",
            title="总结摘要",
            category="通用",
            content="请用简洁的语言总结以下内容的要点：\n\n{selection}"
        ),
        PromptTemplate(
            id="tpl-5",
            title="扩写润色",
            category="写作",
            content="请对以下内容进行扩写和润色，使其更加丰富和流畅：\n\n{selection}"
        ),
        PromptTemplate(
            id="tpl-6",
            title="Bug 诊断",
            category="代码",
            content="请帮我分析以下代码可能存在的问题和错误：\n\n```\n{selection}\n```"
        ),
    ]
