# 任务：聊天 UI 与侧边栏会话优化

## 1. 依赖与基础设施

- [x] 1.1 在 `requirements.txt` 中增加 `ctk-markdown`（或选定 Markdown 控件库），并确认与当前 CustomTkinter 版本兼容
- [x] 1.2 若采用 ctk-markdown，在对话区可单独建一最小示例验证：插入一段 Markdown 文本并渲染，主题切换下显示正常

## 2. 持久层：会话删除

- [x] 2.1 在 `MessageRepository` 接口及 SQLite 实现中新增 `delete_by_session(session_id: str) -> None`，删除指定会话下所有消息
- [x] 2.2 在 `SessionRepository` 接口及 SQLite 实现中新增 `delete(session_id: str) -> None`；实现中先调 `message_repo.delete_by_session(session_id)`，再删除该 session 记录

## 3. 应用层：删除与会话标题自动更新

- [x] 3.1 在 `AppService` 中实现 `delete_session(session_id: str) -> None`：若为当前会话则清空 `_current_session_id`（或切换至其他会话）；调用 `session_repo.delete(session_id)`
- [x] 3.2 在 `send_message` 的流式完成回调（`on_done`）中：若当前会话的 title 仍为「新对话」，则取该会话第一条用户消息 content 做摘要（如前 15～20 字或首行），调用 `update_session_title(session_id, summary)`；仅当 title 为默认值时执行，避免覆盖用户已改标题

## 4. UI：侧边栏折叠修复

- [x] 4.1 在主窗口根 grid 上对 column 0 设置 `grid_columnconfigure(0, weight=0, minsize=...)`，折叠时 minsize=56，展开时 minsize=220，并在 `_toggle_sidebar` / `_refresh_sidebar_width` 中更新该 minsize
- [x] 4.2 折叠时隐藏侧边栏内会话列表（`_session_list_frame`）及「新对话」文字（仅保留图标）；展开时重新显示，确保收起后侧边栏仅显示图标与展开箭头

## 5. UI：会话列表项（标题 + 重命名/删除图标）

- [x] 5.1 将会话列表每行由单按钮改为一行容器：左侧为可点击的会话标题（或按钮），右侧为重命名图标按钮、删除图标按钮（使用 Unicode 或小图标，如 ✏️ 🗑️）
- [x] 5.2 重命名：点击图标后弹出输入框（或内联编辑），默认值为当前标题，确认后调用 `app.update_session_title(session_id, new_title)` 并刷新会话列表
- [x] 5.3 删除：点击删除图标后可选二次确认（如「确定删除该会话？」），确认后调用 `app.delete_session(session_id)`，刷新会话列表与对话区（若删除的是当前会话则显示空状态或切换至其他会话）

## 6. UI：对话区 Markdown 渲染

- [x] 6.1 历史消息加载时：助手消息使用 Markdown 控件（如 CTkMarkdown）渲染 `m.content`；用户消息可继续使用 CTkTextbox 或一并使用 Markdown，与设计一致
- [x] 6.2 流式消息：流式进行中仍用 CTkTextbox 追加纯文本；流式结束后将该条助手消息替换为 Markdown 控件并渲染完整内容，保持与历史消息展示一致
- [x] 6.3 新追加的用户消息若采用 Markdown，则用相同 Markdown 控件渲染；否则保持纯文本

## 7. 验证与收尾

- [x] 7.1 验证侧边栏折叠：展开/收起多次，宽度与内容正确，配置持久化生效
- [x] 7.2 验证会话标题：新建会话并发送一条消息，流式结束后侧边栏标题自动更新为首条消息摘要；重命名后再次发送，标题不再被自动覆盖
- [x] 7.3 验证重命名与删除：重命名会话后列表与持久化正确；删除会话后列表更新、当前会话切换或空状态正确，持久层该会话及消息已删除
- [x] 7.4 验证 Markdown：助手回复包含标题、列表、代码块、加粗等时，对话区正确渲染；流式结束后该条显示为富文本
