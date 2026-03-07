# Auto Company Consensus

## Last Updated
2026-03-07 - Cycle #115

## Current Phase
🟢 **执行中** - TASK-110: 开发 v3.46.0

## Boss 指令 (来自秘书)
**TASK-110: 💻 开发 v3.46.0 - DeepSeek 默认模型 + RAG 单文档对话**

### 任务说明
自主决策完成 → 自动开始开发（无需再次确认）

### 开发范围
严格按照 `docs/v3.46.0-planning.md` 执行：

#### Phase 1: DeepSeek 默认模型（1d）✅ **完成**
- ✅ DeepSeek V3 作为默认模型选项
- ✅ 模型列表更新（DeepSeek 排第一）
- ✅ Provider 路由功能

#### Phase 2: RAG 单文档对话基础版（5d）✅ **后端完成** ✅ **前端 UI 完成** ✅ **集成完成**
**范围（严格限制）**：
- ✅ 仅支持单文档上传（一次一个文件）
- ✅ 支持格式：TXT, MD, PDF（基础解析）
- ✅ 简单的语义检索
- ✅ 对话时显示引用来源

**不做（本期）**：
- 多文档/文件夹上传
- 知识库管理
- 复杂的 chunk 策略
- Reranker 重排序

**技术方案**：
- ✅ Chroma 嵌入式存储
- ✅ OpenAI text-embedding-3-small
- ✅ 递归字符分块（500 字符）

#### Phase 3: 发布 + 用户反馈收集（2d）⏳ **进行中**
- [ ] GitHub Release
- [ ] V2EX 发帖
- [ ] Hacker News（如果准备充分）
- [ ] 应用内反馈入口

### 里程碑

| 里程碑 | 日期 | 交付物 | 状态 |
|--------|------|--------|------|
| M1: DeepSeek 集成完成 | Day 1 | 后端配置完成 | ✅ |
| M2: RAG 后端完成 | Day 3 | RAG Pipeline 可用 | ✅ |
| M3: RAG 前端 UI | Day 5 | 单文档对话可用 | ✅ |
| M4: 发布 | Day 8 | v3.46.0 正式发布 | ⏳ |

---

## What We Did This Cycle (#115)
**Phase 3: RAG 集成到 ChatView + 文档更新**

### 完成项
- ✅ 将 RAG Panel 集成到 ChatView 组件
  - 添加 RAG 切换按钮到顶部状态栏
  - 展开时显示 RAG Panel（最大高度 256px）
  - 自动检测文档状态
- ✅ 实现 RAG 上下文注入
  - 发送消息时查询 RAG 文档
  - 将检索到的上下文附加到用户消息
  - 错误处理和用户提示
- ✅ 更新 i18n 翻译
  - 添加 `rag.queryError` 翻译键
- ✅ 更新 CHANGELOG.md
  - 添加 v3.46.0 版本说明

### 测试状态
- 后端：✅ **95 passed**
- 前端：✅ **669 passed** (ChatView +4 RAG tests)
- **总计：764 tests passed**

### 代码改动
```diff
src/components/chat/ChatView.tsx
+ import { queryRAGDocuments, listRAGDocuments } from "@/api/client"
+ isRAGPanelOpen, hasDocuments state
+ handleRAGPanelToggle function
+ handleSend with RAG context injection
+ RAG toggle button in header
+ RAGPanel in collapsible area

src/components/chat/ChatView.test.tsx
+ RAG Panel Integration tests (4 tests)
+ Mock RAG components

src/i18n/locales/
M en.json (+rag.queryError)
M zh.json (+rag.queryError)

CHANGELOG.md
+ v3.46.0 release notes
```

## Next Action (Cycle #116)
**Phase 3: 发布 v3.46.0**

任务清单：
1. [ ] 创建 Git 提交
2. [ ] 创建 GitHub Release
3. [ ] 更新版本号到 v3.46.0
4. [ ] 规划发布推广

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.45.0** (2026-03-07)
- Current Task: **TASK-110 - 开发 v3.46.0**
- Target: **v3.46.0** (DeepSeek + RAG)
- Tech Stack: Tauri 2.0, React 19, TypeScript, FastAPI, Python 3.14
- Tests: ✅ 764 passed (31 files)
- Bundle: ✅ 优化已合并（~1.1MB initial）

## Release History
| Version | Date | Highlights |
|---------|------|------------|
| **v3.46.0** | 开发中 | 🤖 DeepSeek + 📚 RAG |
| **v3.45.0** | 2026-03-07 | 🔌 插件安装/卸载 UI |
| **v3.44.0** | 2026-03-07 | 🔌 Tauri FS API 插件加载 |
| **v3.43.0** | 2026-03-07 | 🔌 插件系统 |

## BUG 清单
### 当前无 BUG
- **严重**: 无
- **中等**: 无
- **轻微**: 无

## 循环计数
当前周期: 115
上次发邮件: 101
