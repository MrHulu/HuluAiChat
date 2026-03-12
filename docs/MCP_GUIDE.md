# MCP (Model Context Protocol) 使用指南

MCP (Model Context Protocol) 是 HuluChat 的核心扩展功能，让 AI 能够连接外部工具和服务，大大扩展 AI 的能力边界。

---

## 🤔 什么是 MCP？

MCP 是 Anthropic 开发的开放协议，用于 AI 助手与外部工具、数据源的标准化连接。

### 核心价值

| 功能 | 说明 |
|------|------|
| **文件系统** | AI 可以读写本地文件 |
| **数据库查询** | 连接 SQLite、PostgreSQL 等 |
| **Web 搜索** | 实时搜索互联网信息 |
| **API 调用** | 调用任意 REST API |
| **自定义工具** | 创建你自己的 MCP Server |

### 隐私优先

- ✅ MCP Servers 在**本地运行**，数据不离开你的电脑
- ✅ 你完全控制连接哪些服务器
- ✅ 无遥测、无数据收集
- ✅ 敏感操作需要用户确认

---

## 🚀 快速开始

### 步骤 1：打开 MCP 设置

1. 点击右上角的 **⚙️ 设置** 按钮
2. 在设置窗口中，点击 **"MCP"** 标签

### 步骤 2：添加 MCP Server

点击 **"添加服务"** 按钮，填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| **服务名称** | 给服务器起个名字 | "文件系统" |
| **描述** | 可选的描述信息 | "本地文件访问" |
| **传输类型** | 连接方式 | stdio / HTTP / SSE |
| **命令** | stdio 模式的可执行命令 | `uvx` |
| **参数** | 命令行参数 | `mcp-server-filesystem --root /path` |

### 步骤 3：连接服务器

添加完成后，点击 **"连接"** 按钮启动服务器。连接成功后，你可以看到该服务器提供的工具列表。

### 步骤 4：在聊天中使用

连接 MCP Server 后，AI 会在需要时**自动调用**相应的工具。你只需要正常聊天，AI 会判断何时使用工具。

---

## 📦 推荐 MCP Servers

### 1. 文件系统访问

让 AI 读写指定目录下的文件：

```
名称: 文件系统
传输类型: stdio
命令: uvx
参数: mcp-server-filesystem --root /path/to/your/files
```

**安装依赖**：
```bash
# 需要 uvx (uv 包管理器)
pip install uv
```

### 2. SQLite 数据库

让 AI 查询 SQLite 数据库：

```
名称: SQLite
传输类型: stdio
命令: uvx
参数: mcp-server-sqlite --db-path /path/to/database.db
```

### 3. Puppeteer (Web 自动化)

让 AI 控制浏览器进行网页操作：

```
名称: Puppeteer
传输类型: stdio
命令: npx
参数: -y @modelcontextprotocol/server-puppeteer
```

**安装依赖**：
```bash
# 需要 Node.js
npm install -g npx
```

### 4. GitHub

让 AI 访问 GitHub API：

```
名称: GitHub
传输类型: stdio
命令: npx
参数: -y @modelcontextprotocol/server-github
```

**环境变量**：需要设置 `GITHUB_PERSONAL_ACCESS_TOKEN`

---

## 📝 使用示例

### 示例 1：文件操作

**配置**：已添加文件系统 MCP Server，根目录为 `/home/user/documents`

**对话**：
```
用户: 帮我读取 report.md 文件的内容

AI: [调用 read_file 工具]
     文件内容如下：
     # 项目报告
     ... (文件内容)
```

### 示例 2：数据库查询

**配置**：已添加 SQLite MCP Server

**对话**：
```
用户: 查询 users 表中有多少条记录

AI: [调用 query 工具]
     users 表中共有 1,234 条记录。
```

### 示例 3：Web 搜索

**配置**：已添加 Web 搜索 MCP Server

**对话**：
```
用户: 今天北京的天气怎么样？

AI: [调用 web_search 工具]
     根据搜索结果，今天北京天气晴朗，气温 15-25°C...
```

---

## 🔧 高级配置

### HTTP/SSE 传输

对于远程 MCP Server，使用 HTTP 或 SSE 传输：

```
名称: 远程服务
传输类型: HTTP
URL: http://localhost:8080/mcp
```

### 环境变量

某些 MCP Server 需要环境变量（如 API Key）：

1. 在系统环境中设置变量
2. 或在启动命令中传递

**示例**（GitHub）：
```bash
# Linux/macOS
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxx

# Windows PowerShell
$env:GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxx"
```

### 批量连接

点击 **"全部连接"** 按钮可以一次性连接所有已配置的服务器。

---

## 🛠️ 创建自定义 MCP Server

你可以用 Python 创建自己的 MCP Server：

### 安装 MCP SDK

```bash
pip install mcp
```

### 示例代码

```python
from mcp.server import Server
from mcp.types import Tool, TextContent

server = Server("my-custom-server")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="hello",
            description="Say hello",
            inputSchema={
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name to greet"}
                },
                "required": ["name"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "hello":
        return [TextContent(
            type="text",
            text=f"Hello, {arguments['name']}!"
        )]

# 运行服务器
server.run()
```

### 在 HuluChat 中使用

```
名称: 自定义服务
传输类型: stdio
命令: python
参数: /path/to/my_server.py
```

---

## ❓ 常见问题

### Q: MCP Server 连接失败怎么办？

**A:** 检查以下几点：
1. 命令是否正确（检查路径和参数）
2. 依赖是否已安装（uvx、npx、python 等）
3. 查看 Server 卡片中的错误信息

### Q: AI 没有调用工具怎么办？

**A:** 可能的原因：
1. MCP Server 未连接（确保状态显示"已连接"）
2. 问题不需要使用工具
3. AI 模型不支持 tool calling（确保使用支持的模型）

### Q: 如何查看可用的工具？

**A:** 在 MCP 设置中，点击已连接 Server 卡片的 **"{{count}} 个工具"** 链接，可以展开查看所有可用工具及其描述。

### Q: MCP Server 会影响性能吗？

**A:** MCP Server 是独立进程，对 HuluChat 主程序影响很小。如果遇到问题，可以断开不需要的服务器。

### Q: 数据安全吗？

**A:** MCP Server 在本地运行，数据不会离开你的电脑。请只添加你信任的 MCP Server。

---

## 📚 更多资源

- 🔗 [MCP 官方文档](https://modelcontextprotocol.io)
- 🔗 [MCP Server 列表](https://github.com/modelcontextprotocol/servers)
- 🔗 [HuluChat GitHub](https://github.com/MrHulu/HuluAiChat)

---

<p align="center">
  <sub>🔧 MCP 让 AI 更强大！有问题随时反馈。</sub>
</p>
