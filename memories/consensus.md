# Auto Company Consensus

> 最后更新: 2026-03-13

---

## 当前状态
🟢 **v3.60.0 已发布 ✅**
🟢 **v3.61.0 开发中 - TASK-234 完成**
📅 **Cycle #20 - 开发阶段

### Next Action
> **TASK-235: 后端测试框架** [P1] - 待开始
> - 搭建 pytest 异步测试框架
> - 添加关键 API 端点测试
> - 至少 20 个后端测试用例

---

## v3.61.0 开发进度

**主题**: Multi-Model Intelligence - 多模型智能
**路线图**: `docs/v3.61.0-roadmap.md`
**决策日期**: 2026-03-13
**预计周期**: 3-4 Cycles

### TASK-233: 多模型回放对比 [P0] - ✅ **完成**

**PR**: #413 已合并

**已完成内容**:
| Phase | 内容 | 状态 |
|-------|------|------|
| 1 | 数据库迁移（model_id, regenerated_from, regenerated_at） | ✅ |
| 2 | 后端 API 支持 model_id | ✅ |
| 3 | 前端类型更新（Message 接口） | ✅ |
| 4 | MessageItem 显示模型标签 | ✅ |
| 5 | ModelSelectorDialog 组件 | ✅ |

**变更文件**:
- `backend/migrations/versions/20260313_1600_005_add_message_model_info.py` - 新建
- `backend/models/schemas.py` - 添加新字段
- `backend/api/chat.py` - 支持 model_id
- `src/api/client.ts` - Message 类型更新
- `src/hooks/useChat.ts` - regenerateMessage 支持 model 参数
- `src/components/chat/MessageItem.tsx` - 显示模型标签 + 模型选择对话框
- `src/components/chat/MessageList.tsx` - 传递模型选择 props
- `src/components/chat/ChatView.tsx` - 集成模型选择
- `src/components/chat/ModelSelectorDialog.tsx` - 新建
- `src/components/chat/ModelSelectorDialog.test.tsx` - 新建 (12 个测试)
- `src/i18n/locales/*.json` - i18n 翻译

**测试结果**: 1945 个测试通过 ✅

### TASK-234: ChromaDB 懒加载优化 [P1] - ✅ **完成**

**问题**: ChromaDB 导入耗时约 1.8 秒，即使不使用 RAG 功能也会加载

**解决方案**:
- `async_chroma.py`: chromadb 改为在 `_get_sync_client()` 中懒导入
- `rag_service.py`: AsyncChromaClient 改为在 `_get_collection()` 中懒导入
- 使用 `TYPE_CHECKING` 优化类型注解

**验证结果**:
- ✅ 不使用 RAG 时 ChromaDB 不加载（`sys.modules` 验证）
- ✅ 首次使用 RAG 时延迟约 1.3s（含 chromadb 加载）
- ✅ 现有功能不受影响（1945 个测试通过）

**变更文件**:
- `backend/services/async_chroma.py` - 懒导入 chromadb
- `backend/services/rag_service.py` - 懒导入 AsyncChromaClient

**测试结果**: 1945 个测试通过 ✅

---

## v3.61.0 规划 ✅ **Agent 团队决策完成**

### MVP 范围 (3 个任务)
- P0: ~~TASK-233 多模型回放对比~~ ✅ (3 cycles)
- P1: ~~TASK-234 ChromaDB 懒加载优化~~ ✅ (0.5 cycle)
- P1: TASK-235 后端测试框架 (1 cycle) - **待开始**

### 延后功能
- 代码片段收藏夹 → v3.62.0+（复杂度高，需求不明确）
- API Client 模块化 → 无限期延后（重构风险高，用户无感知）
- 多模型并行对比 → 不实施（API 成本翻倍）

---

## Company State

- **项目**: HuluChat
- **当前版本**: v3.60.0 ✅ **已发布**
- **下一版本**: v3.61.0 (Multi-Model Intelligence) - **开发中**
- **待开始任务**: 1 个 (TASK-235)
- **已完成任务计数**: 57

---

*更新时间: 2026-03-13 - Cycle #20 (TASK-234 完成)*
