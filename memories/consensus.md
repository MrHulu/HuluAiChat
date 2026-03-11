# HuluChat 共识状态

> 最后更新: 2026-03-11 - Cycle #137

---

## 当前状态
🎯 **所有短期任务已完成** - 等待下一个指令

---

## Next Action
> 检查待开始任务，若无则发邮件给 Boss

---

## 最近完成任务

### ✅ TASK-130: 文件上传功能（Cycle #136）
- Phase 1-4 全部完成
- 前端：ChatInput 添加文件上传按钮、拖拽支持、预览组件
- 后端：MessageModel 添加 files 字段、chat.py 处理文件附件
- 支持文件类型：PDF、TXT、MD、CSV、JSON、JS、TS、JSX、TSX、HTML、CSS、XML、DOC、DOCX、XLS、XLSX

### ✅ TASK-122: UI/UX 美化优化
- 消息时间戳显示（Cycle #136）
- 消息复制按钮（Cycle #135）
- 空状态快捷提示（Cycle #134）

---

## 项目状态

- **项目**: HuluChat
- **版本**: v3.51.0
- **周期**: #137
- **进行中任务**: 无
- **待开始任务**: 3 个（TASK-122 持续进行, TASK-116 等待 Boss, TASK-129 暂缓）

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

### ✅ 文件上传
- 图片上传（最多 5 张，单张 10MB）
- 文件上传（PDF、Word、代码等，最大 20MB，最多 5 个）
- 拖拽上传
- 文件预览

### ✅ 消息功能
- 消息时间戳显示
- 消息复制按钮
- 空状态快捷提示

---

*更新时间: 2026-03-11 - Cycle #137*
