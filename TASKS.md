# 任务清单

## 🔴 紧急任务
- [x] **TASK-182**: 📋 规划 v3.56.0 版本 ✅ 2026-03-12
  - 主题：AI 知识中心 + 帮助支持体系
  - 已完成：版本路线图 `docs/v3.56.0-roadmap.md`
  - MVP 功能：10 个，预计 9-12 Cycles
  - Cycle #172

## v3.56.0 任务（按优先级）

### Phase 1: 基础设施 (P0)
- [x] **TASK-183**: ⌨️ 快捷命令面板 (Ctrl+K) ✅ 2026-03-12
  - 全局快捷键注册 (Tauri global-shortcut 插件) - 待系统级实现
  - 命令面板 UI 组件 (fzf 模糊搜索) ✅
  - 命令注册机制 ✅
  - 基础导航命令 ✅
  - 快捷键帮助列表更新 ✅
  - i18n 翻译更新 ✅
  - Cycle #173
- [x] **TASK-184**: 📚 提示词技巧指南 ✅ 2026-03-12
  - 8 个核心提示词技巧文档
  - Markdown 渲染页面 (ArticleViewer)
  - 知识中心组件 (KnowledgeCenter)
  - 命令面板集成
  - i18n 翻译更新 (EN/ZH)
  - Cycle #173
- [x] **TASK-185**: ❓ FAQ 常见问题 ✅ 2026-03-12
  - 19 个常见问题
  - Accordion UI 组件
  - 5 个分类显示
  - i18n 翻译 (EN/ZH)
  - Cycle #174
- [x] **TASK-186**: ⌨️ 快捷键列表 ✅ 2026-03-12
  - 复用现有 KEYBOARD_SHORTCUTS 数据
  - 分类展示 UI（常规/导航）
  - 平台适配 (Cmd/Ctrl)
  - 集成到知识中心 help 分类
  - i18n 翻译 (EN/ZH)
  - Cycle #175

### Phase 2: 帮助体系 (P1)
- [x] **TASK-187**: 💬 反馈入口 ✅ 2026-03-12
  - GitHub Issues 链接
  - 邮件联系入口
  - 社区讨论链接
  - 隐私提示（不收集用户数据）
  - i18n 翻译 (EN/ZH)
  - Cycle #176
- [x] **TASK-188**: 🔀 模型对比说明 ✅ 2026-03-12
  - 7 个模型（OpenAI/DeepSeek/Ollama）
  - 模型特点展示
  - 适用场景推荐
  - 价格和速度对比
  - i18n 翻译 (EN/ZH)
  - Cycle #177
- [x] **TASK-189**: 🔍 帮助文档搜索 ✅ 2026-03-12
  - minisearch 集成
  - 搜索结果 UI（高亮显示）
  - 知识中心集成
  - i18n 翻译 (EN/ZH)
  - Cycle #178

### Phase 3: 新手体验 (P1)
- [x] **TASK-190**: 🎯 首次使用引导 ✅ 2026-03-12
  - 欢迎页面
  - 5 步功能介绍（欢迎、多模型、文档对话、快捷键、知识中心）
  - localStorage 状态保存
  - i18n 翻译 (EN/ZH)
  - Cycle #179
- [x] **TASK-191**: 💡 功能发现提示 ✅ 2026-03-12
  - useFeatureDiscovery hook - 功能使用状态检测
  - FeatureDiscoveryTip 组件 - 提示卡片 UI
  - 6 个可发现功能（命令面板、知识中心、文档对话、导出、文件夹、模型切换）
  - 可关闭/永久关闭
  - 隐私约束：只存储布尔值
  - i18n 翻译 (EN/ZH)
  - Cycle #180

### Phase 4: 体验增强 (P2)
- [x] **TASK-192**: 🔖 书签消息跳转 ✅ 2026-03-12
  - ChatView 添加 ref 暴露 scrollToMessage 方法
  - BookmarkJumpDialog 组件 - 书签选择对话框
  - CommandPalette 添加 jumpToBookmark 命令
  - App.tsx 集成书签跳转功能
  - i18n 翻译 (EN/ZH)
  - 测试：10 个测试用例通过
  - Cycle #181
- [x] **TASK-193**: 🤖 上下文智能提示 ✅ 2026-03-12
  - contextualTips.ts - 5 个提示配置（no-api-key, no-model, empty-session, first-visit, settings-incomplete）
  - useContextualTip.ts - 状态检测 hook（当前状态、设置加载）
  - ContextualTip.tsx - 提示显示组件
  - 集成到 App.tsx（优先级高于功能发现提示）
  - i18n 翻译 (EN/ZH)
  - 测试：21 个测试用例通过
  - 隐私约束：只检测当前状态，不存储历史行为
  - Cycle #182
- [x] **TASK-194**: ⚠️ 错误解决建议 ✅ 2026-03-12
  - errorCodes.ts - 17 个错误码配置（6 个分类）
  - ErrorSolutions.tsx - 错误解决建议组件
  - 知识中心 help 分类集成
  - i18n 翻译 (EN/ZH)
  - 测试：28 个测试用例通过
  - 隐私约束：静态内容，不收集用户错误信息
  - Cycle #183

## 待开始

### 🔴 优先任务
- [x] **TASK-206**: 🧪 全面回归测试 - v3.55.0 ~ v3.58.0 ✅ 2026-03-12
  - 暂停新功能开发，进行全面回归测试
  - 结果：**所有 1795 个测试通过** (76 个测试文件)
  - 修复内容：
    - useChat.test.ts: 添加 createChatWebSocket mock
    - App.test.tsx: 添加 useContextualTip mock
    - 更新 sendMessage 断言使用 objectContaining
    - 更新删除会话测试匹配 AlertDialog 流程
  - Cycle #14

- [x] **TASK-207**: 🔄 官网版本号自动同步机制 ✅ 2026-03-12
  - 问题：官网版本号硬编码在 `website/src/app/page.tsx`，显示 3.52.0
  - 解决方案：
    - 创建 `website/src/lib/version.ts` 集中管理版本号
    - page.tsx 使用动态版本号
    - release.yml 添加 `update-website-version` job
    - 发布时自动更新版本号并推送，触发网站重新部署
  - 当前版本：v3.58.0
  - Cycle #15

### v3.58.0 - 消息交互增强 + 个性化体验
**主题**: 消息交互增强 + 个性化体验 + 技术韧性
**路线图**: `docs/v3.58.0-roadmap.md`
**预计周期**: 5-6 Cycles

#### Phase 1: 消息交互增强 (P0)
- [x] **TASK-200**: 💬 完善引用回复 ✅ 2026-03-12
  - 引用预览组件（输入框上方）✅ 已存在
  - 前端发送 quoted_message_id ✅
  - 后端 API 支持 quoted_message_id ✅
  - 后端将引用消息添加到 AI 上下文 ✅
  - Cycle #8

- [x] **TASK-202**: 🔍 会话内搜索 ✅ 2026-03-12
  - ChatSearch 组件（搜索栏 UI）✅
  - 搜索工具函数✅
  - 消息高亮支持✅
  - Ctrl+F 快捷键支持✅
  - i18n 翻译（EN/ZH）✅
  - 测试：33 个测试用例通过✅
  - Cycle #9

#### Phase 2: 个性化体验 (P1)
- [x] **TASK-203**: 🎨 主题定制（仅预设） ✅ 2026-03-12
  - SettingsDialog 添加外观 Tab ✅
  - 预设主题：Light / Dark / System ✅
  - localStorage 存储主题偏好 ✅
  - i18n 翻译（EN/ZH）✅
  - 测试：12 个测试用例通过 ✅
  - Cycle #10

- [x] **TASK-204**: ⌨️ 快捷键自定义 ✅ 2026-03-12
  - SettingsDialog 添加快捷键 Tab ✅
  - useShortcutSettings hook（状态管理 + localStorage 存储）✅
  - ShortcutSettings 组件（快捷键列表 + 录制 + 冲突检测）✅
  - useKeyboardShortcuts hook 读取自定义快捷键 ✅
  - i18n 翻译（EN/ZH）✅
  - 测试：29 个测试用例通过 ✅
  - Cycle #11

#### Phase 3: 技术韧性 (P1) - CTO 建议
- [x] **TASK-205**: 🩺 前端健康监控 ✅ 2026-03-12
  - useBackendHealth hook（状态管理 + 轮询 + 回调）✅
  - BackendStatusIndicator 组件（状态指示器 UI）✅
  - App.tsx 集成（Header 添加状态指示器）✅
  - 四种状态：checking / healthy / degraded / offline ✅
  - i18n 翻译（EN/ZH）✅
  - 测试：25 个测试用例通过 ✅
  - Cycle #12

---

### v3.57.0 - 对话控制增强 ✅ **已完成**
**主题**: 智能对话增强 + 工作流效率
**路线图**: `docs/v3.57.0-roadmap.md`
**实际周期**: 6 Cycles

#### Phase 1: 核心对话增强 (P0) ✅
- [x] **TASK-195**: 🔄 消息重新生成 ✅ 2026-03-12
- [x] **TASK-196**: ✏️ 消息编辑 ✅ 2026-03-12
- [x] **TASK-197**: 📋 会话模板 ✅ 2026-03-12

#### Phase 2: 效率工具 (P1) ✅
- [x] **TASK-198**: ⚡ 自定义命令 ✅ 2026-03-12
- [x] **TASK-199**: 📁 批量会话操作 ✅ 2026-03-12

---

### Phase 1: 基础修复 (阻塞问题)
- [x] **TASK-161**: 🔒 实现 Content Security Policy (CSP) ✅ 2026-03-12
  - 生产环境 CSP：严格策略
  - 开发环境 CSP：支持 Vite dev server
  - 允许资源：本地 API、WebSocket、Ollama、OpenAI API
  - Cycle #164
- [x] **TASK-162**: 🔧 提取 API_BASE 到环境变量 ✅ 2026-03-12
  - 添加 VITE_API_BASE 环境变量支持
  - 创建 .env.example 文档
  - 更新 WebSocket URL 生成逻辑
  - Cycle #164
- [ ] **TASK-163**: 🩺 添加后端 sidecar 进程健康监控和自动重启 ⚠️ **阻塞：Rust 编译内存不足**
- [ ] **TASK-164**: 🔐 添加更新签名验证 ⚠️ **需要 Boss 配置 GitHub Secrets**
- [x] **TASK-165**: 🔄 实现 WebSocket 指数退避重连策略 ✅ 2026-03-12
  - 添加指数退避算法（baseDelay * 2^attempt）
  - 添加 jitter 避免同时重连
  - 向后兼容 reconnectInterval 参数
  - Cycle #164
- [x] **TASK-166**: ⏱️ 添加 OpenAI/Ollama 请求超时配置 ✅ 2026-03-12
  - 新增配置：openai_timeout、http_connect_timeout、http_read_timeout
  - OpenAI/DeepSeek/Ollama 客户端统一使用可配置超时
  - 添加 APITimeoutError 错误处理
  - Cycle #164

### Phase 2: MCP 支持 (核心功能)
- [x] **TASK-167**: 🏗️ 设计 MCP 架构（前端面板 + 后端 client）✅ 2026-03-12
  - 架构设计文档: docs/cto/mcp-architecture.md
  - 包含后端服务设计、前端组件设计、API 端点设计
  - Tool Calling 集成流程
  - Cycle #165
- [x] **TASK-168**: 🐍 实现 Python MCP client（使用 mcp SDK）✅ 2026-03-12
  - 安装 mcp SDK (v1.26.0)
  - 创建 models/mcp_server.py (数据模型)
  - 创建 services/mcp_service.py (核心服务)
  - 创建 api/mcp.py (REST API 端点)
  - 更新 main.py 添加 MCP 路由
  - Cycle #165
- [x] **TASK-169**: ⚙️ 创建 MCP 设置面板（Settings 新 Tab）✅ 2026-03-12
  - 扩展 src/api/client.ts 添加 MCP API 函数
  - 创建 src/components/settings/MCPSettings.tsx
  - 更新 SettingsDialog.tsx 添加 MCP Tab
  - Server 卡片、添加对话框、连接管理
  - Cycle #165
- [x] **TASK-170**: 🔗 集成 MCP tool calling 与现有聊天流 ✅ 2026-03-12
  - 创建 services/mcp_tool_adapter.py（MCP → OpenAI 格式转换）
  - 修改 services/openai_service.py 支持 tools 参数和 tool_calls
  - 修改 api/chat.py 集成 MCP tools 和 tool calling 流程
  - 更新 useChat hook 添加 toolCalls 状态
  - 更新 ChatView 添加 ToolCallsIndicator 组件
  - 添加 i18n 翻译（EN/ZH）
  - Cycle #166
- [x] **TASK-171**: 🌐 添加 MCP i18n 支持（EN/ZH）✅ 2026-03-12
  - 添加 MCP 翻译到 en.json（26 个翻译键）
  - 添加 MCP 翻译到 zh.json（26 个翻译键）
  - 修复 MCPSettings.tsx 中的翻译键命名
  - Cycle #167
- [x] **TASK-172**: 📚 编写 MCP 使用文档 ✅ 2026-03-12
  - 创建 docs/MCP_GUIDE.md 用户指南
  - 包含：快速开始、推荐 Servers、使用示例、常见问题
  - Cycle #167

### Phase 3: 用户功能增强
- [x] **TASK-173**: 🔍 智能消息搜索（跨会话搜索）✅ 2026-03-12
  - 已存在：后端 `/sessions/search/` API
  - 已存在：前端 `searchSessions()` + 搜索 UI + 高亮
  - Cycle #168
- [x] **TASK-174**: 📝 会话摘要与智能标题（AI 自动生成）✅ 2026-03-12
  - 后端：PUT /sessions/{id}/title + POST /sessions/{id}/generate-title
  - 前端：updateSessionTitle() + generateSessionTitle() API
  - 自动触发：第一次对话完成后自动生成标题
  - openai_service.py 添加非流式 chat() 方法
  - Cycle #168
- [x] **TASK-175**: 📤 增强型导出（多选消息导出）✅ 2026-03-12
  - 前端：exportMessages() 函数（前端生成导出内容）
  - MessageItem：添加选择复选框和选中高亮
  - ChatView：多选模式、全选/取消全选、导出按钮
  - 支持 Markdown/JSON/TXT 三种导出格式
  - i18n：EN/ZH 翻译（12 个新键）
  - Cycle #169
- [x] **TASK-176**: 💬 提示词变量系统（模板变量插值） ✅ 2026-03-12
  - 变量格式：`{{variable_name}}`
  - 预定义变量：日期、时间、时间戳等自动填充
  - 自定义变量：用户在对话框中输入
  - 前端实现：变量输入对话框 + 工具函数
  - Cycle #170
- [x] **TASK-177**: 🧠 本地偏好学习（模型推荐）✅ 2026-03-12
  - 后端: `services/preference_service.py` - 偏好存储服务（JSON 文件）
  - 后端: `api/preferences.py` - 偏好 API 端点
  - 前端: `src/api/client.ts` - 偏好 API 函数
  - 前端: `src/hooks/useModel.ts` - 记录使用和推荐模型
  - 前端: `src/components/chat/ModelSelector.tsx` - 推荐标记
  - 隐私优先：所有数据存储在本地，不上传
  - i18n 翻译：EN/ZH
  - Cycle #171

### 技术债务
- [x] **TASK-178**: 🗃️ 迁移到 Alembic 数据库迁移 ✅ 2026-03-12
  - 添加 alembic 依赖到 requirements.txt
  - 创建 alembic.ini 配置文件
  - 创建 migrations/env.py (异步 SQLAlchemy 支持)
  - 创建初始迁移脚本 (001_initial)
  - 更新 database.py 移除手动迁移代码
  - 创建 migrate.py CLI 工具
  - Cycle #172
- [x] **TASK-179**: ⚡ ChromaDB 异步化包装 ✅ 2026-03-12
  - 创建 services/async_chroma.py - AsyncChromaClient/AsyncCollection
  - 更新 services/rag_service.py - 使用异步包装器
  - 添加 tests/test_async_chroma.py - 异步包装器测试
  - 更新 tests/test_rag_service.py - 使用 AsyncMock
  - 使用线程池执行器避免阻塞事件循环
  - Cycle #172
- [x] **TASK-180**: 📊 添加复合数据库索引 ✅ 2026-03-12
  - 创建 Alembic 迁移添加复合索引
  - messages: (session_id, created_at) - 优化消息查询
  - session_tags: (session_id, tag) - 优化标签查询
  - message_bookmarks: (session_id, created_at) - 优化书签查询
  - sessions: (folder_id, updated_at) - 优化会话列表查询
  - 更新 SQLAlchemy 模型添加 Index 声明
  - Cycle #186
- [x] **TASK-181**: 🔑 API Key 存储改用系统钥匙串 ✅ 2026-03-12
  - App.tsx 吝始化时从 keyring 加载 API key 发送给后端
  - keyring.ts 已支持 openai 和 deepseek provider
  - Settings.py 后端不持久化 API key
  - Cycle #187

### 等待 Boss
- [ ] **TASK-116**: 🎬 准备 Product Hunt 发布素材(截图、视频) - 等待 Boss

## 已完成（最近）
- [x] **TASK-160**: 🐛 修复测试内存溢出 ✅ 2026-03-12
  - 配置 Vitest 使用 forks pool 和 fileParallelism=false
  - 更新 empty-state.test.tsx 断言匹配新样式
  - Cycle #163

- [x] **TASK-122**: 🎨 UI/UX 美化优化 ✅ 2026-03-12
  - 状态：已完成
  - 内容：空状态组件增强、消息气泡层次感、按钮发光效果
  - 所有 UI 组件暗色模式增强
  - 全局 CSS 暗色模式增强
  - Cycle #158-160

- [x] **TASK-156**: 🔧 修复 GitHub Release Workflow URL 错误 + 发布 v3.54.0 ✅ 2026-03-12
  - 修复 `.github/workflows/release.yml` 中的 GitHub URL
  - `MrHulu/HuluChat` → `MrHulu/HuluAiChat`
  - 发布 v3.54.0
  - Cycle #156

- [x] **TASK-155**: ✨ 添加消息删除功能 ✅ 2026-03-11
  - 后端: DELETE /{session_id}/messages/{message_id} 端点
  - 前端: API 客户端、useChat hook、MessageItem 组件
  - i18n: EN/ZH 翻译
  - Cycle #155

- [x] **TASK-152**: 🐛 设置页模型下拉框为空 ✅ 2026-03-11
  - 问题: main.py 缺少服务器启动代码
  - 修复: 添加 `if __name__ == "__main__": uvicorn.run()` 启动服务器
  - 同时添加 `https://tauri.localhost` 到 CORS 允许列表
  - Cycle #153

- [x] **TASK-153**: 🐛 自动更新功能 URL 错误 ✅ 2026-03-11
  - 问题: `generate-latest-json.js` 生成的文件名格式不正确
  - 修复: 重写脚本，按实际 GitHub Release 文件名格式生成
  - Windows: `HuluChat_${version}_x64_en-US.msi`
  - macOS: `HuluChat_${version}_${arch}.dmg`
  - Linux: `HuluChat_${version}_amd64.AppImage`
  - Cycle #153

## 已取消
- [x] ~~**TASK-127**: 🎤 用户访谈招募~~ ❌ **Boss 决定取消** - 暂停并删除相关内容
- [x] ~~**TASK-120**: 📊 添加用户行为埋点~~ ❌ **Boss 决定取消** - 隐私优先原则

## ⚠️ 永久禁止事项（Boss 明确要求）
- ❌ **禁止功能**：用户行为埋点、数据追踪、遥测功能、使用统计
- 📋 **原则**：隐私优先（Privacy-First），用户数据不上传、不收集
- 🚫 **执行**：任何版本规划或开发都不得包含上述功能
- 📄 **文档**：CLAUDE.md 和 PROMPT.md 已明确记录此要求

---

*添加任务：秘书/Boss 在"待开始"添加新任务*
