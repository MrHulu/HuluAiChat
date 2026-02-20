# 设计：聊天 UI 与侧边栏会话优化

## 上下文

- 基于现有 HuluChat：CustomTkinter、主窗口三区布局、侧边栏 220px/56px、会话与消息 SQLite 持久化，已有 `update_session_title` 与 `sidebar_expanded` 配置。
- 对话区当前使用 `CTkTextbox` 纯文本展示；侧边栏仅通过 `configure(width=w)` 改宽度，未约束根 grid 列宽，导致折叠可能无效；会话创建时标题固定为「新对话」且未在对话后更新；无删除会话能力，无图标化操作。

## 目标 / 非目标

**目标：**

- 对话区助手（及可选用户）消息支持 Markdown 富文本展示，流式与历史消息一致。
- 侧边栏折叠后实际收窄至约 56px，仅显示图标与展开把手。
- 会话标题在首轮对话完成后自动更新一次，且支持用户重命名；列表可删除会话，删除/重命名使用图标。

**非目标：**

- 不更换 GUI 框架；不实现完整 CommonMark；不改变现有 API/配置/主题架构。

## 决策

### 决策 1：消息区 Markdown 渲染

- **方案**：采用 **ctk-markdown**（或等价 CTk 可用之 Markdown 控件）渲染消息内容；若不可用则退化为「流式结束后对整段内容做 Markdown 渲染」的纯文本 + 标签方案。
- **范围**：至少对**助手消息**做 Markdown 渲染；用户消息是否渲染可配置或统一为纯文本/简单格式，以降低实现量。
- **流式策略**：流式进行中可继续用 `CTkTextbox` 显示纯文本；**流式结束后**将该条助手消息替换为 Markdown 控件并渲染完整内容，保证首屏可读与实现简单。若后续引入「边收边渲染」再单独迭代。
- **依赖**：在 `requirements.txt` 中增加 `ctk-markdown`（或选定库），版本按兼容性选定。

### 决策 2：侧边栏折叠修复

- **根因**：根窗口第 0 列（侧边栏）未配置 `grid_columnconfigure`，列宽由子控件撑开；仅改 `Frame` 的 `width` 不足以在 Tk 中强制收窄。
- **措施**：
  1. 对根窗口 **column 0** 设置 `grid_columnconfigure(0, weight=0, minsize=w)`，其中折叠时 `w=56`，展开时 `w=220`，使列宽受约束。
  2. **折叠时隐藏**侧边栏内「会话列表」及「新对话」文字：仅保留「新对话」图标按钮与折叠/展开箭头；展开时再显示列表与完整按钮文字，避免宽内容在 56px 内撑开。
- **持久化**：继续使用现有 `sidebar_expanded` 配置与 `set_sidebar_expanded`，无需改配置结构。

### 决策 3：会话标题自动更新与重命名

- **自动更新时机**：在**流式完成回调**（`on_done`）中，若当前会话的 `title` 仍为默认值「新对话」，则取该会话**第一条用户消息**的 `content` 做摘要（如 strip 后取前 15～20 个字符，或首行截断），调用 `update_session_title(session_id, summary)` 更新标题。
- **仅更新一次**：仅当 `session.title == "新对话"`（或与创建时默认一致）时才自动更新；用户已通过重命名改过的标题不再覆盖。
- **重命名**：在会话列表每一项上提供**重命名图标**（如 ✏️ 或笔形图标）；点击后弹出简单输入框（或内联编辑），确认后调用 `update_session_title` 并刷新列表。重命名后该会话不再参与「自动更新一次」逻辑（因 title 已非默认）。

### 决策 4：会话删除与图标化操作

- **持久层**：`SessionRepository` 新增 `delete(session_id: str) -> None`。删除会话时**级联删除**该会话下所有消息（在 repo 内先删 message 再删 session，或 DB 层外键 ON DELETE CASCADE，视当前表结构而定）。
- **应用层**：`AppService` 新增 `delete_session(session_id: str) -> None`。若 `session_id == current_session_id`，则清空 `_current_session_id`（或切换到列表中的另一会话）；然后调用 `session_repo.delete(session_id)`。
- **UI**：会话列表每行由「单按钮」改为一行容器：**标题（可点击切换会话）** + **重命名图标按钮** + **删除图标按钮**。删除图标点击后可选二次确认（如「确定删除该会话？」），确认后调用 `delete_session` 并刷新列表与对话区。
- **图标**：重命名与删除均使用**图标**（Unicode 符号如 ✏️ 🗑️，或 CustomTkinter 支持的 image/emoji），不再使用「重命名」「删除」文字，以节省空间并统一风格。

## UI 行为摘要

```
侧边栏（展开）:
┌─────────────────────────────┐
│ [ 新对话 ]            [ ◀ ] │
├─────────────────────────────┤
│ 会话标题1        [ ✏️ ] [ 🗑️ ] │
│ 会话标题2        [ ✏️ ] [ 🗑️ ] │
└─────────────────────────────┘

侧边栏（收起）:
┌──────┐
│ [ ＋ ]│
│ [ ▶ ]│
└──────┘

对话区：助手消息使用 Markdown 控件渲染（流式结束后替换为富文本）。
```

## 与现有架构的关系

- **Shell**：仅 MainWindow 与侧边栏/对话区控件变化；不新增窗口类。
- **AppService**：新增 `delete_session`；在 `send_message` 的 `on_done` 中增加「若 title 为默认则用首条用户消息摘要更新 title」的逻辑。
- **SessionRepository**：新增 `delete(session_id)`；Message 删除在 SessionRepository 或 MessageRepository 中按需实现（如 SessionRepository.delete 内先调 message_repo 清空再删 session）。
