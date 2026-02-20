# 任务：AI 聊天桌面应用 MVP

## 1. 项目与基础设施

- [x] 1.1 创建项目目录结构（`src/`、入口脚本、资源目录）
- [x] 1.2 添加 `requirements.txt`（customtkinter、openai、标准库 sqlite3 等）
- [x] 1.3 实现跨平台应用数据根目录 `get_app_data_dir()`（Windows / Linux / macOS）
- [x] 1.4 确保应用启动时该目录存在（不存在则创建）

## 2. 配置层

- [x] 2.1 定义配置数据结构（providers、current_provider_id、theme、sidebar_expanded）与 JSON 序列化
- [x] 2.2 实现配置存储接口（读/写 config.json），路径基于 `get_app_data_dir()`
- [x] 2.3 应用启动时加载配置；未存在时使用默认（空 providers、默认 theme、sidebar 展开）

## 3. 持久化层

- [x] 3.1 定义会话与消息表结构（session: id, title, created_at, updated_at；message: id, session_id, role, content, created_at）
- [x] 3.2 实现 SQLite 初始化与迁移（建表），数据库路径基于 `get_app_data_dir()`
- [x] 3.3 实现会话仓储接口：创建会话、列表（按时间排序）、按 id 获取、更新 title/updated_at
- [x] 3.4 实现消息仓储接口：追加消息、按 session_id 获取消息列表（按时间排序）

## 4. Chat / API 层

- [x] 4.1 封装 OpenAI 兼容客户端：根据 Provider 配置（base_url、api_key、model_id）构造请求
- [x] 4.2 实现流式聊天接口：接收 messages 列表，通过队列或回调逐片段返回助手内容
- [x] 4.3 在后台线程中执行流式请求，将 token/片段放入队列供主线程消费
- [x] 4.4 处理 API 与网络错误，以结构化方式向上层报告（不写 API Key 到日志）

## 5. 应用/用例层

- [x] 5.1 实现“发送消息”流程：取当前会话与当前 Provider，拼 messages，调 Chat 流式接口，将结果写入消息仓储并通知 UI 更新
- [x] 5.2 实现“新建会话”“切换会话”“加载会话列表与消息”流程，与持久化层和配置层协作
- [x] 5.3 实现“切换当前模型”“保存配置”流程，更新配置并刷新 UI 所用当前 Provider
- [x] 5.4 实现“切换主题”“切换侧边栏展开/收起”并写回配置

## 6. Shell / UI：主窗口与布局

- [x] 6.1 创建主窗口（CustomTkinter 或 Tkinter），三区布局：侧边栏（左）、主区（右含顶部栏/对话区/输入区）
- [x] 6.2 实现侧边栏：展开态（宽度约 220px，新对话按钮 + 会话列表），收起态（图标条或展开把手）；绑定展开/收起切换与持久化
- [x] 6.3 实现主区顶部栏：当前模型下拉（从配置 providers 填充）、设置按钮
- [x] 6.4 实现对话区：可滚动，展示当前会话消息列表；用户/助手消息视觉区分；支持在最后一条助手消息上追加流式内容
- [x] 6.5 实现输入区：多行输入框 + 发送按钮；回车发送，可选 Ctrl+Enter 换行
- [x] 6.6 主线程从流式队列取数据并追加到对话区控件（定时或事件驱动），不阻塞 UI

## 7. Shell / UI：设置与主题

- [x] 7.1 实现设置弹窗：Provider 列表（名称、Base URL、Model ID、API Key 脱敏编辑）、新增/编辑/删除、设为当前模型
- [x] 7.2 设置中保存后写回 config.json，并通知主窗口刷新模型下拉与当前 Provider
- [x] 7.3 实现主题切换（明亮 / 暗夜）：应用 CustomTkinter 或 Tk 的 theme/colors，切换时整窗生效并写回配置
- [x] 7.4 应用启动时根据配置应用主题与侧边栏展开状态

## 8. UI 体验与边界

- [x] 8.1 空状态：无会话时侧边栏列表为空；无消息时对话区显示简短引导文案
- [x] 8.2 发送中状态：请求进行中时显示“正在输入…”或加载指示，且可区分用户消息已发出
- [x] 8.3 错误提示：API/网络错误在对话区或输入区上方以非阻塞方式展示（小横幅或内联提示），不覆盖整屏
- [x] 8.4 无 Provider 或未选模型时，发送前校验并提示用户先配置/选择模型

## 9. 打包与可分发

- [x] 9.1 添加 PyInstaller（或等价）配置（spec 或 pyproject 脚本），包含 customtkinter、openai 等依赖
- [x] 9.2 确保 exe 运行时通过 `get_app_data_dir()` 使用用户目录存储配置与 SQLite，不写 exe 同目录
- [x] 9.3 在 README 中说明如何运行开发环境、如何打包为 exe、配置与数据文件所在位置

## 10. 验证

- [x] 10.1 按「多模型接入与切换」spec 验收：添加/切换 Provider、无 Provider 或单 Provider 行为
- [x] 10.2 按「对话与流式输出」spec 验收：发送消息、流式展示、上下文、错误与进行中状态
- [x] 10.3 按「对话持久化」spec 验收：消息落库、会话列表与加载、新建会话、数据路径跨平台
- [x] 10.4 按「配置管理」spec 验收：启动加载、编辑保存、路径与敏感信息处理
- [x] 10.5 按「可分发」spec 验收：打包 exe、运行后配置与数据库可读写、依赖完整

## 11. 设置页交互优化（design + 配置管理 spec）

- [x] 11.1 主题置于设置页第一项；使用下拉框，选项为文字+图标（☀️ 明亮 / 🌙 暗夜），图标随当前主题变色
- [x] 11.2 新增 Provider 草稿状态：视觉区分、无「删除」、主按钮「确定」；严格校验（名称/Base URL/Model ID/API Key），不通过则「确定」置灰；确定后退出草稿并显示「设为当前」「删除」
- [x] 11.3 Model ID 预设列表（OpenAI、DeepSeek、通义、Kimi、智谱、Claude）+ Custom；选 Custom 时显示自定义输入框并校验
