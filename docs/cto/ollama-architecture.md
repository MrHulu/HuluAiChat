# Ollama 集成架构设计

**Date**: 2026-03-06
**Author**: CTO Agent (Werner Vogels 思维模型)
**Status**: Updated
**Version**: 2.0

---

## Executive Summary

基于 Werner Vogels 的 "Everything Fails, All the Time" 和 "API First" 原则，本文档为 HuluChat 设计 Ollama 本地模型集成的技术架构。

**核心决策**:
- 使用 Ollama 的 OpenAI 兼容 API，最大化代码复用
- Provider 抽象层，支持未来扩展更多本地模型服务
- 优雅降级，Ollama 不可用时自动回退到云端模型
- 零配置启动，自动检测本地 Ollama 服务

---

## 1. 架构原则 (Vogels 思维)

### 1.1 Everything Fails, All the Time

| 失败场景 | 应对策略 |
|----------|----------|
| Ollama 未安装 | UI 显示"安装 Ollama"引导，不阻塞应用 |
| Ollama 服务未启动 | 提供"启动 Ollama"按钮或自动尝试启动 |
| 端口冲突 (11434 被占用) | 允许用户自定义 Ollama 地址 |
| 模型加载失败 | 自动切换到已配置的云端模型 |
| 流式响应中断 | 重试机制 + 降级到完整响应 |

### 1.2 API First / Service-Oriented

所有模型交互通过统一的 Provider API：

```python
# Provider 抽象接口
class AIProvider(ABC):
    @abstractmethod
    async def stream_chat(self, messages: list[dict]) -> AsyncIterator[StreamChunk]:
        pass

    @abstractmethod
    async def get_models(self) -> list[ModelInfo]:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass
```

---

## 2. 系统架构

### 2.1 数据流图

```
用户操作 (点击发送)
    │
    ▼
前端: ChatView.tsx
    │ WebSocket (ws://127.0.0.1:8765/api/chat/ws/{session_id})
    │ Payload: {"content": "...", "model": "ollama:llama3"}
    ▼
后端: chat.py → ProviderRouter
    │ 根据 model 前缀选择 provider
    │ - ollama:* → OllamaService
    │ - gpt-* → OpenAIService
    │ - claude-* → OpenAIService (custom base_url)
    ▼
Provider: OllamaService.openai_client
    │ HTTP POST to http://localhost:11434/v1/chat/completions
    │ Stream: true
    ▼
Ollama Server (localhost:11434)
    │ SSE Stream
    ▼
后端: StreamChunk → WebSocket → 前端
```

### 2.2 组件架构

```
┌──────────────────────────────────────────────────────────────┐
│                        Tauri App                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Frontend (React)                                        │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ ModelSelector                                      │ │ │
│  │  │  ├── Provider Tab (OpenAI | Ollama)               │ │ │
│  │  │  └── Model List (动态加载)                         │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                            │                            │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ ChatView → WebSocket → MessageStream              │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Backend (FastAPI)                                      │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ ProviderRouter (根据 model 选择 provider)          │ │ │
│  │  │  ├── OpenAIService (gpt-*, claude-*)               │ │ │
│  │  │  └── OllamaService (ollama:*)                      │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                            │                            │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │ /api/settings/providers                            │ │ │
│  │  │  ├── GET: 返回可用 providers 和 models             │ │ │
│  │  │  └── POST: 更新 Ollama 配置                        │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  External Services                                     │ │
│  │  ├── OpenAI API (https://api.openai.com/v1)            │ │
│  │  └── Ollama Server (http://localhost:11434)            │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. API 设计

### 3.1 Provider 端点

**GET /api/settings/providers**

返回所有可用的 providers 及其状态：

```json
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "status": "configured",
      "models": [
        {"id": "gpt-4o", "name": "GPT-4o", "description": "..."},
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "..."}
      ]
    },
    {
      "id": "ollama",
      "name": "Ollama (Local)",
      "status": "available",
      "models": [
        {"id": "ollama:llama3", "name": "Llama 3", "description": "Local (4.6GB)"},
        {"id": "ollama:mistral", "name": "Mistral", "description": "Local (4.1GB)"}
      ],
      "config": {
        "base_url": "http://localhost:11434/v1",
        "health_url": "http://localhost:11434/api/tags"
      }
    }
  ]
}
```

**状态值**:
- `configured`: 已配置且可用
- `available`: 可检测到但未配置
- `unavailable`: 不可用

### 3.2 模型命名约定

| Provider | Model ID 格式 | 示例 |
|----------|--------------|------|
| OpenAI | `{model_name}` | `gpt-4o`, `gpt-4o-mini` |
| Claude | `claude-{model}` | `claude-3-5-sonnet-20241022` |
| Ollama | `ollama:{model}` | `ollama:llama3`, `ollama:mistral` |

**设计理由**: 前缀路由，后端根据前缀自动选择 provider。

### 3.3 Ollama 健康检查

```python
async def check_ollama_health() -> dict:
    """检查 Ollama 服务状态"""
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "available",
                    "models": [m["name"] for m in data.get("models", [])]
                }
    except Exception:
        pass
    return {"status": "unavailable", "models": []}
```

---

## 4. 代码实现

### 4.1 Provider 抽象层

**backend/services/provider.py** (新增):

```python
from abc import ABC, abstractmethod
from typing import AsyncIterator

class StreamChunk:
    content: str
    is_done: bool = False
    error: str | None = None

class AIProvider(ABC):
    @abstractmethod
    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        model: str
    ) -> AsyncIterator[StreamChunk]:
        pass

    @abstractmethod
    async def get_models(self) -> list[ModelInfo]:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass

    @property
    @abstractmethod
    def provider_id(self) -> str:
        pass
```

### 4.2 Ollama 服务

**backend/services/ollama_service.py** (新增):

```python
import httpx
from openai import AsyncOpenAI
from services.provider import AIProvider, StreamChunk

class OllamaService(AIProvider):
    DEFAULT_BASE_URL = "http://localhost:11434/v1"
    HEALTH_CHECK_URL = "http://localhost:11434/api/tags"

    def __init__(self, base_url: str | None = None):
        self._base_url = base_url or self.DEFAULT_BASE_URL
        self._client: AsyncOpenAI | None = None
        self._models: list[ModelInfo] | None = None

    @property
    def provider_id(self) -> str:
        return "ollama"

    @property
    def client(self) -> AsyncOpenAI:
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key="ollama",  # Ollama 不需要真实 key
                base_url=self._base_url,
            )
        return self._client

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
        model: str
    ) -> AsyncIterator[StreamChunk]:
        """使用 Ollama OpenAI 兼容 API 进行流式聊天"""
        # 移除 ollama: 前缀
        model_name = model.replace("ollama:", "")

        try:
            stream = await self.client.chat.completions.create(
                model=model_name,
                messages=messages,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield StreamChunk(content=chunk.choices[0].delta.content)

            yield StreamChunk(content="", is_done=True)

        except Exception as e:
            yield StreamChunk(content="", error=str(e))

    async def get_models(self) -> list[ModelInfo]:
        """从 Ollama 获取可用模型列表"""
        if self._models is not None:
            return self._models

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.HEALTH_CHECK_URL)
                if response.status_code == 200:
                    data = response.json()
                    self._models = [
                        ModelInfo(
                            id=f"ollama:{m['name']}",
                            name=m["name"].split(":")[0].capitalize(),
                            description=f"Local ({m['size'] // 1024**3}GB)"
                        )
                        for m in data.get("models", [])
                    ]
                    return self._models
        except Exception:
            pass

        return []

    def is_available(self) -> bool:
        """检查 Ollama 是否可用（异步检查在 get_models 中）"""
        return True  # 实际检查由 get_models 完成
```

### 4.3 Provider 路由器

**backend/services/provider_router.py** (新增):

```python
from services.provider import AIProvider
from services.openai_service import OpenAIService
from services.ollama_service import OllamaService

class ProviderRouter:
    """根据 model ID 路由到对应的 provider"""

    def __init__(self):
        self._providers: dict[str, AIProvider] = {
            "openai": OpenAIService(),
            "ollama": OllamaService(),
        }

    def get_provider(self, model: str) -> AIProvider:
        """根据 model ID 返回对应的 provider"""
        if model.startswith("ollama:"):
            return self._providers["ollama"]
        elif model.startswith("claude-"):
            return self._providers["openai"]  # Claude 使用 OpenAI SDK + custom base_url
        else:
            return self._providers["openai"]  # 默认

    async def get_all_providers(self) -> dict:
        """获取所有 providers 的状态和模型"""
        result = {}

        for provider_id, provider in self._providers.items():
            models = await provider.get_models()
            result[provider_id] = {
                "id": provider_id,
                "name": provider_id.capitalize(),
                "status": "available" if models else "unavailable",
                "models": models,
            }

        return result

# 全局实例
provider_router = ProviderRouter()
```

### 4.4 前端类型扩展

**src/api/client.ts** (修改):

```typescript
// 新增 Provider 类型
export interface Provider {
  id: string;
  name: string;
  status: "configured" | "available" | "unavailable";
  models: ModelInfo[];
  config?: {
    base_url?: string;
    health_url?: string;
  };
}

// 扩展 ModelInfo
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  provider?: string;  // 新增
}

// 新增 API
export async function getProviders(): Promise<{ providers: Provider[] }> {
  const response = await fetch(`${API_BASE}/settings/providers`);
  return response.json();
}
```

---

## 5. 错误处理与降级

### 5.1 错误处理矩阵

| 错误类型 | 检测方式 | 处理策略 |
|----------|----------|----------|
| Ollama 未安装 | 健康检查失败 | UI 显示安装引导 |
| Ollama 服务未运行 | 连接拒绝 | 显示"启动 Ollama"按钮 |
| 模型未下载 | API 返回 404 | 提示用户 `ollama pull {model}` |
| 响应超时 | 120s 无响应 | 降级到提示用户重试 |
| 内存不足 | 系统监控 | 建议选择更小的模型 |

### 5.2 降级策略

```python
async def chat_with_fallback(
    messages: list[dict],
    model: str
) -> AsyncIterator[StreamChunk]:
    """带降级的聊天函数"""
    provider = provider_router.get_provider(model)

    try:
        async for chunk in provider.stream_chat(messages, model):
            yield chunk
    except Exception as e:
        # 降级到 OpenAI
        logger.warning(f"{model} failed, falling back to OpenAI: {e}")
        openai_provider = provider_router.get_provider("gpt-4o-mini")
        async for chunk in openai_provider.stream_chat(messages, "gpt-4o-mini"):
            yield chunk
```

---

## 6. 配置管理

### 6.1 后端配置

**backend/core/config.py** (扩展):

```python
class Settings(BaseSettings):
    # ... 现有配置

    # Ollama
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_enabled: bool = True  # 允许禁用 Ollama 检测
```

### 6.2 用户设置持久化

**user_settings.json** (新增字段):

```json
{
  "openai_api_key": "...",
  "openai_model": "gpt-4o-mini",
  "ollama_enabled": true,
  "ollama_base_url": "http://localhost:11434/v1",
  "selected_provider": "ollama",
  "selected_model": "ollama:llama3"
}
```

---

## 7. 测试策略

### 7.1 单元测试

```python
# tests/test_ollama_service.py
async def test_ollama_model_parsing():
    service = OllamaService()
    models = await service.get_models()
    assert all(m.id.startswith("ollama:") for m in models)

async def test_provider_routing():
    router = ProviderRouter()
    assert isinstance(router.get_provider("ollama:llama3"), OllamaService)
    assert isinstance(router.get_provider("gpt-4o"), OpenAIService)
```

### 7.2 集成测试

- 使用 `testcontainers-ollama` 启动测试用 Ollama 实例
- 测试完整的数据流：前端 → WebSocket → Provider → Ollama

---

## 8. 部署与运维

### 8.1 依赖管理

**requirements.txt** (新增):

```
httpx>=0.27.0
```

### 8.2 健康检查端点

扩展 `/api/health` 端点：

```python
@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": "3.0.0",
        "providers": {
            "openai": openai_service.is_available(),
            "ollama": await ollama_service.is_available(),
        }
    }
```

---

## 9. 未来扩展

### 9.1 支持更多本地模型服务

| 服务 | OpenAI 兼容 | 优先级 |
|------|-------------|--------|
| LM Studio | 是 | P1 |
| LocalAI | 是 | P2 |
| vLLM | 是 | P2 |
| llama.cpp | 否 | P3 |

### 9.2 高级功能

- 模型自动下载：`ollama pull` 集成
- 模型管理：删除、更新本地模型
- 性能监控：响应时间、内存使用

---

## 10. 决策记录 (ADR)

| ID | 决策 | 理由 | 状态 |
|----|------|------|------|
| ADR-001 | 使用 Ollama OpenAI 兼容 API | 代码复用最大化，维护成本低 | ✅ 采用 |
| ADR-002 | 模型 ID 使用前缀路由 | 前端无需知道 provider 逻辑 | ✅ 采用 |
| ADR-003 | 实时查询 Ollama 模型 | 避免缓存不一致，支持动态添加模型 | ✅ 采用 |
| ADR-004 | 默认隐藏 Ollama | Critic 建议，不干扰普通用户 | ✅ 采用 |

---

## 11. 实施计划

| 阶段 | 任务 | 估算 | 负责人 |
|------|------|------|--------|
| Phase 1 | Provider 抽象层 + OllamaService | 1 天 | Fullstack |
| Phase 2 | ProviderRouter + API 端点 | 1 天 | Fullstack |
| Phase 3 | 前端 ModelSelector 组件 | 1 天 | Fullstack |
| Phase 4 | 集成测试 + 文档 | 0.5 天 | QA |
| **总计** | | **3.5 天** | |

---

## 12. 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| Ollama 检测成功率 | >95% | 健康检查端点 |
| 流式响应延迟 | <500ms 首字 | WebSocket 时间戳 |
| 降级触发率 | <5% | 错误日志统计 |

---

*CTO Agent (Werner Vogels Mindset)*
*Date: 2026-03-06*
*Version: 2.0*
