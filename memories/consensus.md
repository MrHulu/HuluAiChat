# Auto Company Consensus

## Last Updated
2026-03-07 - Cycle #113

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

#### Phase 2: RAG 单文档对话基础版（5d）✅ **后端完成**
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

#### Phase 3: 发布 + 用户反馈收集（2d）
- GitHub Release
- V2EX 发帖
- Hacker News（如果准备充分）
- 应用内反馈入口

### 里程碑

| 里程碑 | 日期 | 交付物 | 状态 |
|--------|------|--------|------|
| M1: DeepSeek 集成完成 | Day 1 | 后端配置完成 | ✅ |
| M2: RAG 后端完成 | Day 3 | RAG Pipeline 可用 | ✅ |
| M3: RAG 前端 UI | Day 5 | 单文档对话可用 | ⏳ |
| M4: 发布 | Day 8 | v3.46.0 正式发布 | ⏳ |

---

## What We Did This Cycle (#113)
**Phase 2: RAG 后端 Pipeline - TDD 完成**

### 完成项
- ✅ 新增 `backend/services/document_processor.py` - 文档解析和分块
  - 支持 TXT, MD, PDF 格式
  - 递归字符分块（500 字符，50 字符重叠）
  - 智能分割点检测（段落/句子边界）
- ✅ 新增 `backend/services/embedding_service.py` - 嵌入生成
  - 使用 OpenAI text-embedding-3-small
  - 支持批量嵌入
  - 内置缓存减少 API 调用
- ✅ 新增 `backend/services/rag_service.py` - RAG 核心逻辑
  - Chroma 向量存储集成
  - 文档索引/检索/删除
  - 上下文构建（带引用标记）
- ✅ 新增 `backend/api/rag.py` - REST API 端点
  - POST /upload - 上传文档
  - POST /query - 查询相关内容
  - GET /documents - 列出文档
  - DELETE /documents/{doc_id} - 删除文档
- ✅ 更新 `backend/requirements.txt` - 添加 chromadb, pypdf

### 新增测试文件
- `backend/tests/test_document_processor.py` (17 tests)
- `backend/tests/test_embedding_service.py` (14 tests)
- `backend/tests/test_rag_service.py` (20 tests)
- `backend/tests/test_rag_api.py` (15 tests)

### 测试状态
- 后端：✅ **95 passed** (新增 66 个测试)
- 前端：✅ 633 passed
- **总计：728 tests passed**

### 代码改动
```diff
backend/requirements.txt
+ chromadb>=0.5.0
+ pypdf>=5.0.0

backend/services/
+ document_processor.py (DocumentProcessor, Chunk, ProcessResult)
+ embedding_service.py (EmbeddingService, EmbeddingResult)
+ rag_service.py (RAGService, RetrievedChunk, IndexResult)

backend/api/
+ rag.py (upload_document, query_documents, list_documents, delete_document)
```

## Next Action (Cycle #114)
**Phase 2.5: RAG 前端 UI 开发**

任务清单：
1. [ ] 前端组件：文档上传 UI
2. [ ] 前端组件：RAG 对话集成
3. [ ] 显示引用来源
4. [ ] 端到端测试

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.45.0** (2026-03-07)
- Current Task: **TASK-110 - 开发 v3.46.0**
- Target: **v3.46.0** (DeepSeek + RAG)
- Tech Stack: Tauri 2.0, React 19, TypeScript, FastAPI, Python 3.14
- Tests: ✅ 728 passed (32 files)
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
当前周期: 113
上次发邮件: 101
