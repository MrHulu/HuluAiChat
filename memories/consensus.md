# HuluChat 共识状态

> 最后更新: 2026-03-11 - Cycle #146

---

## 当前状态
🎯 **TASK-130 已完成** - 等待下一个任务

---

## Next Action
> 继续执行 TASK-122（UI/UX 美化优化）或等待 Boss 指示

---

## 项目状态

- **项目**: HuluChat
- **版本**: v3.51.0
- **周期**: #146
- **进行中任务**: 无
- **待开始任务**: 3 个

---

## 待开始任务

| 任务 | 状态 | 说明 |
|------|------|------|
| TASK-129 | ⏸️ 暂缓 | 官网素材未准备好 |
| TASK-122 | 🔄 可执行 | UI/UX 美化优化（长期任务） |
| TASK-116 | ⏳ 等待 Boss | Product Hunt 素材 |

---

## 最近完成

### TASK-130: 文件上传功能 ✅ 2026-03-11

**完成内容**:
- Phase 1: 文件上传 UI（支持多文件、拖拽）✅
- Phase 2: 文件预览（显示文件名、大小、类型）✅
- Phase 3: API 集成（发送给后端）✅
- Phase 4: 测试和优化 ✅

**技术实现**:
- 前端：ChatInput 添加文件上传按钮、拖拽支持、预览组件
- 后端：MessageModel 添加 files 字段、chat.py 处理文件附件
- 支持文件类型：PDF、TXT、MD、CSV、JSON、JS、TS、JSX、TSX、HTML、CSS、XML、DOC、DOCX、XLS、XLSX
- 最大文件大小：20MB，最多 5 个文件

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Tauri 2.0, React 19, TypeScript, Tailwind v4, shadcn/ui |
| 后端 | FastAPI, Python 3.14, SQLite |
| 运维 | GitHub Actions CI/CD, Cloudflare Pages |

---

## 核心原则 ⚠️

**隐私优先**:
- ❌ 不做埋点
- ❌ 不追踪用户行为
- ❌ 不上传用户数据

**Boss 明确要求**: 任何版本规划都不得包含上述功能

---

## 限制条件

- **禁止功能**: 用户行为埋点、数据追踪、遥测
- **文件保护**: CLAUDE.md, PROMPT.md, auto_loop.py 不能被 AI 修改

---

## 已知能力

### ✅ 已支持
- 图片上传（最多 5 张，单张 10MB）
- 文件上传（PDF、Word、代码等，最多 5 个，每个 20MB）
- 拖拽上传
- 图片预览
- 文件预览
- 消息引用回复

### ❌ 待开发
- 后端引用消息存储（当前仅前端）
- RAG 文档解析增强

---

*更新时间: 2026-03-11 - Cycle #146*
