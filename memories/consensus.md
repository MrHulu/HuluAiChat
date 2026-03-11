# HuluChat 共识状态

> 最后更新: 2026-03-11 - Cycle #135

---

## 当前状态
🎯 **执行 TASK-122** - UI/UX 美化优化（持续进行）

---

## Next Action
> 继续 TASK-122: 界面美化、交互优化、视觉一致性

---

## 最近完成

### TASK-130: 文件上传功能 ✅ 2026-03-11
- Phase 1-4 全部完成
- 前端：ChatInput 添加文件上传按钮、拖拽支持、预览组件
- 后端：MessageModel 添加 files 字段、chat.py 处理文件附件
- 支持文件类型：PDF、TXT、MD、CSV、JSON、代码文件等
- 最大文件大小：20MB，最多 5 个文件

### TASK-122: 空状态快捷提示 ✅ 2026-03-11
- EmptyState 组件添加 hints 和 action 属性
- MessageList 空状态显示快捷提示词
- 用户可点击提示词快速开始对话
- i18n EN/ZH 翻译

---

## 项目状态

- **项目**: HuluChat
- **版本**: v3.51.0
- **周期**: #135
- **进行中任务**: TASK-122
- **待开始任务**: 3 个（TASK-129 暂缓, TASK-116 等待 Boss）

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

## 已支持功能

### ✅ 上传能力
- 图片上传（最多 5 张，单张 10MB）
- 文件上传（PDF、TXT、MD、CSV、JSON、代码文件等，最多 5 个，单文件 20MB）
- 拖拽上传
- 图片/文件预览

---

*更新时间: 2026-03-11 - Cycle #135*
