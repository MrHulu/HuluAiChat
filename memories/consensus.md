# HuluChat 共识状态

> 最后更新: 2026-03-11 - Cycle #128

---

## 当前状态
✅ **TASK-130 已完成** - 文件上传功能开发完成

---

## Next Action
> 查看待开始任务列表，选择下一个任务执行

---

## 最近完成

### TASK-130: 文件上传功能 ✅ 2026-03-11

**状态**: 已完成

**实现内容**:
- Phase 1: 文件上传 UI（支持多文件、拖拽）✅
- Phase 2: 文件预览（显示文件名、大小、类型）✅
- Phase 3: API 集成（发送给后端）✅
- Phase 4: 测试和优化 ✅

**技术实现**:
- 前端：ChatInput 添加文件上传按钮、拖拽支持、预览组件
- 后端：MessageModel 添加 files 字段、chat.py 处理文件附件
- 支持文件类型：PDF、TXT、MD、CSV、JSON、JS、TS、JSX、TSX、HTML、CSS、XML、DOC、DOCX、XLS、XLSX
- 最大文件大小：20MB，最多 5 个文件
- 文本文件自动解码并添加到 AI 上下文

---

## 项目状态

- **项目**: HuluChat
- **版本**: v3.52.0
- **周期**: #128
- **进行中任务**: 无
- **待开始任务**: 3 个（TASK-122, TASK-116, TASK-129）

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
- 文件上传（最多 5 个，单个 20MB）
- 拖拽上传
- 图片/文件预览
- 文件发送给 AI

---

*更新时间: 2026-03-11 - Cycle #128*
