# MCP (Model Context Protocol) 架构设计

> **任务**: TASK-167
> **日期**: 2026-03-12
> **作者**: CTO-Vogels
> **版本**: v1.0

---

## 1. 概述

### 1.1 什么是 MCP？

MCP (Model Context Protocol) 是 Anthropic 开发的开放协议，用于 AI 助手与外部工具/数据源的标准化连接。

**核心价值**：
- 让 HuluChat 连接 100+ MCP servers（文件系统、数据库、Web 搜索等）
- 成为首个支持 MCP 的隐私优先 AI 桌面客户端
- 差异化竞争优势

### 1.2 MVP 范围

| 功能 | 优先级 | 描述 |
|------|--------|------|
| MCP Server 配置管理 | P0 | UI 配置多个 MCP servers |
| stdio 传输 | P0 | 本地 MCP server 连接 |
| Tool Calling 集成 | P0 | AI 自动调用 MCP tools |
| HTTP/SSE 传输 | P1 | 远程 MCP server 连接 |
| Resource 浏览 | P1 | 查看 MCP resources |
| Prompt 模板 | P2 | 使用 MCP prompts |

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        HuluChat Frontend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Chat Panel  │  │ Settings    │  │ MCP Settings Tab        │  │
│  │             │  │ Dialog      │  │ - Server List           │  │
│  │             │  │             │  │ - Add/Remove Server     │  │
│  │             │  │             │  │ - Server Status         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                │                     │                 │
│         │ WebSocket      │ REST API            │ REST API        │
│         ▼                ▼                     ▼                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Chat API    │  │ Settings    │  │ MCP API                 │  │
│  │ /chat/ws    │  │ API         │  │ /mcp/*                  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│         │                                  │                     │
│         ▼                                  ▼                     │
│  ┌─────────────┐                  ┌─────────────────────────┐   │
│  │ OpenAI      │                  │ MCP Service             │   │
│  │ Service     │◄─────────────────│ - Server Manager        │   │
│  └─────────────┘   Tool Calling   │ - Tool Executor         │   │
│                                    │ - Resource Manager      │   │
│                                    └─────────────────────────┘   │
│                                              │                   │
└──────────────────────────────────────────────│───────────────────┘
                                               │ stdio / HTTP
                                               ▼
                              ┌─────────────────────────────────┐
                              │       MCP Servers               │
                              │  ┌─────────┐  ┌─────────────┐  │
                              │  │ File    │  │ Web Search  │  │
                              │  │ System  │  │ Server      │  │
                              │  └─────────┘  └─────────────┘  │
                              │  ┌─────────┐  ┌─────────────┐  │
                              │  │ SQLite  │  │ Custom      │  │
                              │  │ Server  │  │ Servers     │  │
                              │  └─────────┘  └─────────────┘  │
                              └─────────────────────────────────┘
```

### 2.2 数据流

```
用户消息 → Chat API → OpenAI Service → [Tool Call 检测]
                                          ↓
                          如果需要 Tool Call → MCP Service
                                          ↓
                                   执行 MCP Tool
                                          ↓
                                   返回结果给 OpenAI
                                          ↓
                                   生成最终回复
                                          ↓
                                   返回给用户
```

---

## 3. 后端设计

### 3.1 文件结构

```
huluchat-v3/backend/
├── api/
│   └── mcp.py                    # MCP REST API 端点
├── services/
│   ├── mcp_service.py            # MCP 核心服务
│   ├── mcp_client.py             # MCP Client 包装
│   └── mcp_tool_executor.py      # Tool 执行器
├── models/
│   └── mcp_server.py             # MCP Server 数据模型
└── core/
    └── mcp_config.py             # MCP 配置
```

### 3.2 数据模型

```python
# models/mcp_server.py
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class TransportType(str, Enum):
    STDIO = "stdio"
    HTTP = "http"
    SSE = "sse"

class MCPServerConfig(BaseModel):
    """MCP Server 配置"""
    id: str                       # 唯一标识
    name: str                     # 显示名称
    description: Optional[str]    # 描述
    transport: TransportType      # 传输类型
    command: Optional[str]        # stdio 命令 (如 "uvx", "python")
    args: Optional[List[str]]     # 命令参数
    url: Optional[str]            # HTTP/SSE URL
    env: Optional[dict]           # 环境变量
    enabled: bool = True          # 是否启用

class MCPTool(BaseModel):
    """MCP Tool 定义"""
    name: str                     # Tool 名称
    description: str              # Tool 描述
    input_schema: dict            # JSON Schema 输入定义

class MCPToolCall(BaseModel):
    """Tool 调用请求"""
    server_id: str                # 调用哪个 server
    tool_name: str                # Tool 名称
    arguments: dict               # 调用参数

class MCPToolResult(BaseModel):
    """Tool 执行结果"""
    success: bool
    content: str                  # 结果内容
    error: Optional[str]          # 错误信息

class MCPServerStatus(BaseModel):
    """Server 状态"""
    id: str
    name: str
    connected: bool               # 是否已连接
    tools: List[MCPTool]          # 可用 tools
    error: Optional[str]          # 连接错误
```

### 3.3 API 端点设计

```python
# api/mcp.py
from fastapi import APIRouter

router = APIRouter(prefix="/mcp", tags=["mcp"])

# Server 管理
@router.get("/servers")
async def list_servers() -> List[MCPServerConfig]:
    """列出所有配置的 MCP servers"""

@router.post("/servers")
async def add_server(config: MCPServerConfig) -> MCPServerConfig:
    """添加新的 MCP server"""

@router.put("/servers/{server_id}")
async def update_server(server_id: str, config: MCPServerConfig) -> MCPServerConfig:
    """更新 MCP server 配置"""

@router.delete("/servers/{server_id}")
async def delete_server(server_id: str) -> dict:
    """删除 MCP server"""

# Server 连接
@router.post("/servers/{server_id}/connect")
async def connect_server(server_id: str) -> MCPServerStatus:
    """连接到 MCP server"""

@router.post("/servers/{server_id}/disconnect")
async def disconnect_server(server_id: str) -> dict:
    """断开 MCP server 连接"""

@router.get("/servers/{server_id}/status")
async def get_server_status(server_id: str) -> MCPServerStatus:
    """获取 server 状态"""

# Tools
@router.get("/servers/{server_id}/tools")
async def list_tools(server_id: str) -> List[MCPTool]:
    """列出 server 的所有 tools"""

@router.post("/tools/call")
async def call_tool(call: MCPToolCall) -> MCPToolResult:
    """调用 MCP tool"""

# 批量状态
@router.get("/status")
async def get_all_status() -> List[MCPServerStatus]:
    """获取所有 servers 状态"""

@router.post("/connect-all")
async def connect_all() -> List[MCPServerStatus]:
    """连接所有启用的 servers"""
```

### 3.4 MCP Service 设计

```python
# services/mcp_service.py
from typing import Dict, List, Optional
from mcp import Client
from models.mcp_server import MCPServerConfig, MCPTool, MCPServerStatus

class MCPService:
    """MCP 服务管理器"""

    def __init__(self):
        self._clients: Dict[str, Client] = {}  # server_id -> Client
        self._configs: Dict[str, MCPServerConfig] = {}

    async def add_server(self, config: MCPServerConfig) -> None:
        """添加 server 配置"""

    async def remove_server(self, server_id: str) -> None:
        """移除 server"""

    async def connect(self, server_id: str) -> MCPServerStatus:
        """连接到 server"""

    async def disconnect(self, server_id: str) -> None:
        """断开连接"""

    async def list_tools(self, server_id: str) -> List[MCPTool]:
        """获取 server 的 tools"""

    async def call_tool(
        self,
        server_id: str,
        tool_name: str,
        arguments: dict
    ) -> str:
        """调用 tool 并返回结果"""

    async def get_all_tools(self) -> Dict[str, List[MCPTool]]:
        """获取所有已连接 servers 的 tools"""

# 全局实例
mcp_service = MCPService()
```

### 3.5 与 OpenAI Service 集成

```python
# 修改 services/openai_service.py
# 在 stream_chat 中添加 tool calling 支持

async def stream_chat(
    self,
    messages: list[dict],
    tools: Optional[List[dict]] = None,  # 新增: MCP tools
    **kwargs
) -> AsyncIterator[StreamChunk]:
    """Stream chat with optional tool calling"""

    # 如果有 tools，传递给 OpenAI
    if tools:
        stream = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
            stream=True,
            **kwargs
        )
    else:
        # 原有逻辑
        ...

    # 处理 tool_calls
    async for chunk in stream:
        if chunk.choices[0].delta.tool_calls:
            # 返回 tool call 请求
            yield StreamChunk(
                content="",
                tool_calls=chunk.choices[0].delta.tool_calls
            )
        elif chunk.choices[0].delta.content:
            yield StreamChunk(content=chunk.choices[0].delta.content)
```

---

## 4. 前端设计

### 4.1 文件结构

```
huluchat-v3/src/
├── components/
│   └── settings/
│       └── MCPSettings.tsx       # MCP 设置面板
├── api/
│   └── client.ts                 # 添加 MCP API 函数
└── hooks/
    └── useMCP.ts                 # MCP 状态管理 hook
```

### 4.2 Settings Dialog 修改

```tsx
// 在 SettingsDialog.tsx 中添加 MCP Tab

<TabsList className="grid w-full grid-cols-4">  {/* 改为 4 列 */}
  <TabsTrigger value="api">{t("settings.tabApi")}</TabsTrigger>
  <TabsTrigger value="ollama">{t("settings.tabOllama")}</TabsTrigger>
  <TabsTrigger value="mcp">
    <Puzzle className="h-4 w-4 mr-1" />
    MCP
  </TabsTrigger>
  <TabsTrigger value="plugins">
    <Puzzle className="h-4 w-4 mr-1" />
    {t("settings.tabPlugins")}
  </TabsTrigger>
</TabsList>

{/* MCP Settings Tab */}
<TabsContent value="mcp" className="py-4">
  <MCPSettings />
</TabsContent>
```

### 4.3 MCPSettings 组件

```tsx
// components/settings/MCPSettings.tsx
interface MCPSettingsProps {}

export function MCPSettings({}: MCPSettingsProps) {
  const { t } = useTranslation();
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [statuses, setStatuses] = useState<MCPServerStatus[]>([]);

  // 加载 servers
  useEffect(() => {
    loadServers();
    loadStatuses();
  }, []);

  // 添加 server 对话框
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{t("mcp.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("mcp.description")}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t("mcp.addServer")}
        </Button>
      </div>

      {/* Server List */}
      <div className="space-y-2">
        {servers.map((server) => (
          <MCPServerCard
            key={server.id}
            server={server}
            status={statuses.find(s => s.id === server.id)}
            onConnect={() => connectServer(server.id)}
            onDisconnect={() => disconnectServer(server.id)}
            onDelete={() => deleteServer(server.id)}
          />
        ))}
      </div>

      {/* Add Server Dialog */}
      <AddMCPServerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={addServer}
      />
    </div>
  );
}
```

### 4.4 API Client 扩展

```typescript
// api/client.ts 新增

// ============== MCP APIs ==============

export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  transport: "stdio" | "http" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  enabled: boolean;
}

export interface MCPServerStatus {
  id: string;
  name: string;
  connected: boolean;
  tools: MCPTool[];
  error?: string;
}

export interface MCPTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

/**
 * 列出所有 MCP servers
 */
export async function listMCPServers(): Promise<MCPServerConfig[]> {
  const response = await fetch(`${API_BASE}/mcp/servers`);
  return response.json();
}

/**
 * 添加 MCP server
 */
export async function addMCPServer(
  config: Omit<MCPServerConfig, "id">
): Promise<MCPServerConfig> {
  const response = await fetch(`${API_BASE}/mcp/servers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return response.json();
}

/**
 * 更新 MCP server
 */
export async function updateMCPServer(
  id: string,
  config: Partial<MCPServerConfig>
): Promise<MCPServerConfig> {
  const response = await fetch(`${API_BASE}/mcp/servers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  return response.json();
}

/**
 * 删除 MCP server
 */
export async function deleteMCPServer(id: string): Promise<void> {
  await fetch(`${API_BASE}/mcp/servers/${id}`, { method: "DELETE" });
}

/**
 * 连接 MCP server
 */
export async function connectMCPServer(
  id: string
): Promise<MCPServerStatus> {
  const response = await fetch(`${API_BASE}/mcp/servers/${id}/connect`, {
    method: "POST",
  });
  return response.json();
}

/**
 * 断开 MCP server
 */
export async function disconnectMCPServer(id: string): Promise<void> {
  await fetch(`${API_BASE}/mcp/servers/${id}/disconnect`, {
    method: "POST",
  });
}

/**
 * 获取所有 servers 状态
 */
export async function getMCPStatus(): Promise<MCPServerStatus[]> {
  const response = await fetch(`${API_BASE}/mcp/status`);
  return response.json();
}

/**
 * 获取 server 的 tools
 */
export async function getMCPServerTools(
  serverId: string
): Promise<MCPTool[]> {
  const response = await fetch(`${API_BASE}/mcp/servers/${serverId}/tools`);
  return response.json();
}

/**
 * 调用 MCP tool
 */
export async function callMCPTool(
  serverId: string,
  toolName: string,
  arguments: Record<string, unknown>
): Promise<{ success: boolean; content: string; error?: string }> {
  const response = await fetch(`${API_BASE}/mcp/tools/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      server_id: serverId,
      tool_name: toolName,
      arguments,
    }),
  });
  return response.json();
}
```

---

## 5. Tool Calling 集成流程

### 5.1 Chat 流程修改

```
1. 用户发送消息
2. 前端通过 WebSocket 发送到 /chat/ws
3. 后端获取所有已连接 MCP servers 的 tools
4. 将 tools 转换为 OpenAI 格式
5. 调用 OpenAI API，传入 tools
6. 如果 OpenAI 返回 tool_call:
   a. 解析 tool_call (server_id, tool_name, arguments)
   b. 通过 MCP Service 执行 tool
   c. 将结果发送给 OpenAI 继续对话
   d. 返回最终回复
7. 如果没有 tool_call，直接返回内容
```

### 5.2 WebSocket 消息格式扩展

```typescript
// 前端发送
interface ChatMessage {
  content: string;
  images?: ImageContent[];
  files?: FileAttachment[];
  use_mcp?: boolean;  // 新增: 是否启用 MCP tools
}

// 后端推送
interface WSResponse {
  type: "content" | "done" | "error" | "tool_call";
  content?: string;
  tool_call?: {
    server_name: string;
    tool_name: string;
    status: "calling" | "success" | "error";
    result?: string;
  };
  error?: string;
}
```

### 5.3 OpenAI Tools 格式转换

```python
def mcp_tools_to_openai_format(tools: Dict[str, List[MCPTool]]) -> List[dict]:
    """将 MCP tools 转换为 OpenAI tools 格式"""
    openai_tools = []
    for server_id, server_tools in tools.items():
        for tool in server_tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": f"mcp_{server_id}_{tool.name}",
                    "description": tool.description,
                    "parameters": tool.input_schema
                }
            })
    return openai_tools
```

---

## 6. 配置存储

### 6.1 后端配置文件

```python
# MCP servers 配置存储在 user_settings.json 或单独的 mcp_servers.json
# 格式:
{
  "mcp_servers": [
    {
      "id": "filesystem",
      "name": "File System",
      "transport": "stdio",
      "command": "uvx",
      "args": ["mcp-server-filesystem", "--root", "/path/to/files"],
      "enabled": true
    },
    {
      "id": "web-search",
      "name": "Web Search",
      "transport": "http",
      "url": "http://localhost:8080/mcp",
      "enabled": true
    }
  ]
}
```

---

## 7. 依赖项

### 7.1 Python 依赖

```txt
# requirements.txt 新增
mcp>=1.0.0              # MCP Python SDK
```

### 7.2 安装命令

```bash
cd huluchat-v3/backend
pip install mcp
```

---

## 8. 任务分解

| 任务 | 描述 | 依赖 |
|------|------|------|
| TASK-167 | 架构设计（本文档） | - |
| TASK-168 | 实现 Python MCP Client | TASK-167 |
| TASK-169 | 创建 MCP 设置面板 | TASK-167 |
| TASK-170 | 集成 Tool Calling | TASK-168, TASK-169 |
| TASK-171 | 添加 i18n 支持 | TASK-169 |
| TASK-172 | 编写使用文档 | TASK-170 |

---

## 9. 测试策略

### 9.1 单元测试

- MCP Service CRUD 操作
- Tool 格式转换
- 配置读写

### 9.2 集成测试

- 连接真实 MCP server
- Tool 调用端到端流程
- Chat + Tool Calling 流程

### 9.3 测试用 MCP Server

```bash
# 使用官方 filesystem server 进行测试
uvx mcp-server-filesystem --root /tmp/test
```

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| MCP SDK 不稳定 | 低 | 高 | 使用官方 SDK，关注更新 |
| stdio 进程管理复杂 | 中 | 中 | 封装良好的进程管理器 |
| Tool 调用超时 | 中 | 中 | 设置合理超时，用户可配置 |
| 隐私问题 | 低 | 高 | MCP servers 本地运行，不上传数据 |

---

## 11. 隐私合规

**MCP 符合隐私优先原则**：
- ✅ MCP servers 在本地运行
- ✅ 用户完全控制连接哪些 servers
- ✅ 无遥测、无数据收集
- ✅ 敏感操作需要用户确认

---

*设计完成时间: 2026-03-12*
*下一步: TASK-168 - 实现 Python MCP Client*
