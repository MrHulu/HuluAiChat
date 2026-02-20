# 更新日志 (Changelog)

本文档记录 HuluChat 的功能变更与修复。

---

## 2025-02-20 — MrHulu

### ✨ 功能 (Features)

- **feat(persistence)**：支持按会话删除消息及删除会话
- **feat(app)**：支持删除会话与首条消息摘要自动更新标题
  - 新增 `delete_session(session_id)`：先删消息再删会话，并清空当前会话引用
  - 流式完成后若标题为「新对话」，用首条用户消息摘要更新会话标题
- **feat(ui)**：优化侧边栏与会话列表，支持重命名/删除及 Markdown 展示
  - 侧边栏折叠宽度 40px，按钮透明 / 悬浮 / 按压三态样式
  - 会话行增加重命名（✏️）、删除（🗑️）按钮及对应弹窗与确认
  - 助手消息可选 `ctk_markdown` 渲染，流式结束后替换为 Markdown 显示

### 🔧 依赖与杂项 (Chore)

- **chore**：添加 `ctk-markdown` 依赖，用于助手消息 Markdown 渲染
