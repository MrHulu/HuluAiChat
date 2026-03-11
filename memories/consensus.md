# Auto Company Consensus

> 最后更新: 2026-03-12 - Cycle #165

---

## 当前状态
🚀 **Phase 2 MCP 支持进行中** - TASK-167 已完成，进入 MCP 实现

---

## Next Action
> **TASK-168: 实现 Python MCP Client**
> - 安装 mcp SDK
> - 创建 MCP Service 和 Client
> - 实现 Server 管理 API

---

## ⚠️ 阻塞问题

**TASK-163/164 (Rust 相关任务) 无法完成**:
- 系统内存不足，页面文件太小
- Rust 编译失败：`页面文件太小，无法完成操作。 (os error 1455)`
- 需要 Boss 重启系统或增加页面文件大小

---

## 最近完成

### TASK-167: MCP 架构设计（Cycle #165）

**完成时间**: 2026-03-12

**产出**: `docs/cto/mcp-architecture.md`

**架构内容**:
1. **系统架构**: 前端 MCP Settings Tab + 后端 MCP Service + MCP Servers
2. **后端设计**:
   - `api/mcp.py` - REST API 端点
   - `services/mcp_service.py` - 核心服务
   - `models/mcp_server.py` - 数据模型
3. **前端设计**:
   - `MCPSettings.tsx` - 设置面板
   - API Client 扩展
4. **Tool Calling 集成**: 修改 Chat 流程支持 AI 自动调用 MCP tools
5. **依赖**: `mcp>=1.0.0` Python SDK

**MVP 范围**:
- stdio 传输（P0）
- Server 配置管理（P0）
- Tool Calling 集成（P0）
- HTTP/SSE 传输（P1）

**结果**: 架构设计完成，可开始实现

---

### TASK-166: 请求超时配置（Cycle #164）

**完成时间**: 2026-03-12

**问题**: OpenAI/Ollama 请求没有显式超时配置，可能导致无限等待

**解决方案**:
1. 在 `config.py` 添加新配置项：
   - `openai_timeout`: OpenAI/DeepSeek API 超时（默认 120s）
   - `http_connect_timeout`: HTTP 连接超时（默认 10s）
   - `http_read_timeout`: HTTP 读取超时（默认 60s）
2. 更新 `openai_service.py`：
   - 使用 `httpx.Timeout` 配置超时
   - 添加 `APITimeoutError` 错误处理
   - 为所有 provider（OpenAI, DeepSeek, Ollama）配置超时
3. 更新 `ollama_service.py`：
   - 使用统一的超时配置

**结果**: 所有 API 请求现在都有可配置的超时

---

### TASK-165: WebSocket 指数退避重连（Cycle #164）

**完成时间**: 2026-03-12

**问题**: WebSocket 使用固定间隔重连，可能导致 thundering herd 问题

**解决方案**:
1. 实现指数退避算法：`delay = baseDelay * 2^attempt`
2. 添加 jitter（抖动）避免多个客户端同时重连
3. 新增配置项：
   - `exponentialBackoff`: 启用/禁用（默认启用）
   - `baseDelay`: 基础延迟（默认 1000ms）
   - `maxDelay`: 最大延迟（默认 30000ms）
   - `jitter`: 抖动因子（默认 0.3）
4. 向后兼容 `reconnectInterval` 参数

**结果**: 20 个测试通过，类型检查通过

---

### TASK-162: API 配置化（Cycle #164）

**完成时间**: 2026-03-12

**问题**: `API_BASE` 硬编码在源码中，缺乏灵活性

**解决方案**:
1. 添加 `VITE_API_BASE` 环境变量支持
2. 创建 `.env.example` 文件说明配置项
3. 更新 `vite-env.d.ts` 添加类型声明
4. 更新 `createChatWebSocket` 函数动态构建 WebSocket URL

**结果**: API 地址可配置，类型检查通过

---

### TASK-161: 实现 CSP（Cycle #164）

**完成时间**: 2026-03-12

**问题**: `tauri.conf.json` 中 CSP 设置为 `null`，存在安全风险

**解决方案**:
1. 实现生产环境 CSP：严格策略
   - `default-src 'self'`
   - `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`
   - `connect-src 'self' http://127.0.0.1:8765 ws://127.0.0.1:8765 http://localhost:11434 https://api.openai.com`
   - `object-src 'none'`, `frame-ancestors 'none'`
   - `upgrade-insecure-requests`

2. 实现开发环境 CSP（devCsp）：支持 Vite dev server
   - 允许 `http://localhost:1420`
   - 允许 `ws://localhost:1420` (HMR)
   - 允许 `unsafe-eval` (Vite 需要)

**结果**: CSP 安全策略已实现，类型检查通过

---

### TASK-160: 修复测试内存溢出（Cycle #163）

**完成时间**: 2026-03-12

**问题**: 测试运行时内存溢出导致崩溃

**解决方案**:
1. 配置 Vitest 使用 `forks` pool（替代 threads）
2. 设置 `fileParallelism: false` 防止内存积累
3. 更新 empty-state.test.tsx 断言匹配新样式

**结果**: 1530+ 测试通过，内存使用稳定

---

### v3.55.0 版本规划（Cycle #162）

**完成时间**: 2026-03-12

**Agent 团队协作**:
- CEO (Bezos): 战略决策 - MCP First
- CTO (Vogels): 技术评估 - 基础修复优先
- 产品 (Norman): 功能规划 - 智能搜索、会话摘要
- 批评家 (Munger): 风险审查 - 测试崩溃阻塞
- 调研 (Thompson): 市场分析 - 竞品差异化

**核心决策**:
1. Phase 1: 基础修复（7 个任务）- 阻塞问题必须先解决
2. Phase 2: MCP 支持（6 个任务）- 核心差异化功能
3. Phase 3: 用户功能（5 个任务）- 体验提升
4. 技术债务（4 个任务）- 可推迟

**文档产出**:
- `docs/v3.55.0-roadmap.md` - 版本规划
- `docs/ceo/v3.55.0-strategy.md` - 战略决策
- `docs/cto/v3.55.0-tech-assessment.md` - 技术评估
- `docs/product/v3.55.0-product-plan.md` - 产品规划
- `docs/critic/v3.55.0-risk-review.md` - 风险审查
- `docs/research/v3.55.0-market-analysis.md` - 市场分析

---

## Company State

- **项目**: HuluChat
- **当前版本**: v3.54.0
- **下一版本**: v3.55.0
- **进行中任务**: 0 个
- **待开始任务**: 21 个（20 新 + TASK-116）
- **已完成任务计数**: 12 (本次周期)

---

## 待开始任务总览

### Phase 1: 基础修复 (P0 阻塞)
| 任务 | 描述 | 状态 |
|------|------|------|
| TASK-160 | 修复测试内存溢出 | ✅ 已完成 |
| TASK-161 | 实现 CSP | ✅ 已完成 |
| TASK-162 | API 配置化 | ✅ 已完成 |
| TASK-163 | 后端健康监控 | ⚠️ 阻塞（内存不足） |
| TASK-164 | 更新签名验证 | 待开始 |
| TASK-165 | WebSocket 重连优化 | ✅ 已完成 |
| TASK-166 | 请求超时配置 | ✅ 已完成 |
| TASK-166 | 请求超时配置 | 待开始 |

### Phase 2: MCP 支持 (核心差异化)
| 任务 | 描述 | 状态 |
|------|------|------|
| TASK-167 | MCP 架构设计 | ✅ 已完成 |
| TASK-168 ~ 172 | MCP 实现（5个任务） | 待开始 |

### Phase 3: 用户功能
| 任务 | 描述 | 状态 |
|------|------|------|
| TASK-173 ~ 177 | 功能增强（5个任务） | 待开始 |

### 技术债务
| 任务 | 描述 | 状态 |
|------|------|------|
| TASK-178 ~ 181 | 债务清理（4个任务） | 待开始 |

### 等待 Boss
| 任务 | 描述 | 状态 |
|------|------|------|
| TASK-116 | Product Hunt 素材 | 等待 Boss |

---

## 核心原则 ⚠️

**隐私优先**:
- ❌ 不做埋点
- ❌ 不追踪用户行为
- ❌ 不上传用户数据

**Boss 明确要求**: 任何版本规划都不得包含上述功能

---

*更新时间: 2026-03-12 - Cycle #165*

---

## 邮件记录

**Cycle #161** - 已发送状态报告邮件至 Boss
- 主题: [HuluChat] 所有可执行任务已完成 - 等待指示
- 选项: A. TASK-116 (需配合) / B. 规划 v3.55.0 / C. 其他

**Cycle #162** - 已自动执行选项 B（规划 v3.55.0）
- 22 个新任务已添加到 TASKS.md
- 版本规划文档已生成

**Cycle #163** - 完成 TASK-160（修复测试内存溢出）
- Vitest 配置优化
- 测试断言修复

**Cycle #164** - 完成 TASK-161/162/165/166（CSP + API 配置化 + WebSocket 退避 + 超时配置）
- CSP 安全策略实现
- API 环境变量配置
- WebSocket 指数退避重连
- OpenAI/Ollama 请求超时配置
- **TASK-163/164 阻塞**: Rust 编译内存不足

**Cycle #165** - 完成 TASK-167（MCP 架构设计）
- 创建 `docs/cto/mcp-architecture.md`
- 定义后端 MCP Service 结构
- 定义前端 MCP Settings 面板
- 设计 Tool Calling 集成流程
