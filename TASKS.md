# 任务清单

## 🔴 紧急任务（阻塞 Boss 工作）
- 无

## 待开始
<!-- 新任务添加到这里 -->

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
- [ ] **TASK-164**: 🔐 添加更新签名验证
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
- [ ] **TASK-169**: ⚙️ 创建 MCP 设置面板（Settings 新 Tab）
- [ ] **TASK-170**: 🔗 集成 MCP tool calling 与现有聊天流
- [ ] **TASK-171**: 🌐 添加 MCP i18n 支持（EN/ZH）
- [ ] **TASK-172**: 📚 编写 MCP 使用文档

### Phase 3: 用户功能增强
- [ ] **TASK-173**: 🔍 智能消息搜索（跨会话搜索）
- [ ] **TASK-174**: 📝 会话摘要与智能标题（AI 自动生成）
- [ ] **TASK-175**: 📤 增强型导出（多选消息导出）- v3.56.0
- [ ] **TASK-176**: 💬 提示词变量系统（模板变量插值）- v3.56.0
- [ ] **TASK-177**: 🧠 本地偏好学习（模型推荐）- v3.56.0

### 技术债务
- [ ] **TASK-178**: 🗃️ 迁移到 Alembic 数据库迁移
- [ ] **TASK-179**: ⚡ ChromaDB 异步化包装
- [ ] **TASK-180**: 📊 添加复合数据库索引
- [ ] **TASK-181**: 🔑 API Key 存储改用系统钥匙串

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
