# 提案：AI 聊天桌面应用 MVP

## 为什么

需要一个轻量、可分发的桌面聊天应用，统一接入多种 AI 模型 API，支持多模型切换、流式对话和本地历史存储。用户希望完全掌控模型配置（API Key、Base URL 等），类似 Cursor 的设置方式，而非绑定单一厂商。

## 什么变化

- 新增独立的 Windows 桌面应用，基于 Python + Tkinter/CustomTkinter
- 支持用户自定义多个 AI Provider（OpenAI 兼容接口），可随时切换当前模型
- 对话支持流式输出，响应以打字机效果呈现
- 本地 SQLite 持久化对话历史
- 应用可打包为可分发的 exe
- 代码遵循 SOLID、KISS、DRY，架构考虑跨平台（Windows → Linux，远期 Android）

## 能力

### 新能力

- **多模型接入与切换**：用户可配置多个 Provider（name、base_url、api_key、model_id），运行时切换当前使用的模型
- **对话与流式输出**：发送消息并接收 AI 流式回复，界面实时追加文本
- **对话持久化**：会话与消息存入本地 SQLite，支持加载历史、新建会话
- **配置管理**：类似 Cursor，用户自定义 Provider 列表，配置持久化（如 JSON/YAML）
- **可分发**：应用可打包为 exe，供未安装 Python 的用户使用

### 修改的能力

无（新项目，无现有能力修改）。

## 影响

- `src/`：新增应用代码
- `config/` 或 `~/.config/ai-chat/`：配置文件与 SQLite 数据库
- `requirements.txt`：依赖（Tkinter/CustomTkinter、openai、sqlite3 等）
- `pyproject.toml` 或 `setup.py`：打包配置（如 PyInstaller）
- `README.md`：项目说明与使用方式

## 非目标（MVP 之外，后续迭代）

- 文件/图片分析、语音输入、翻译等扩展功能
- 与 元宝 等产品的功能对标
- Android 平台支持（架构预留，实现暂不纳入）
