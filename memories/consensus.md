# Auto Company Consensus

> 最后更新: 2026-03-13

---

## 当前状态
🟢 **v3.59.1 热修复版本发布中**

### 🚨 Boss 指令 (2026-03-13)

> **"修复完这些问题，要回归测试一下，然后发这个热修复版本"**

### 执行计划

**Step 1**: 修复剩余问题 (TASK-221 ~ TASK-225) ✅ **全部完成**
- [x] TASK-221: 自定义模型选择不生效 [P1] ✅
- [x] TASK-222: 设置 API 窗口尺寸问题 [P2] ✅
- [x] TASK-223: 设置窗口快捷键和 Tab 重叠 [P2] ✅
- [x] TASK-224: 消息图标悬浮文字错误 [P3] ✅
- [x] TASK-225: 文档对话状态说明 [P3] ✅

**Step 2**: TASK-226 - 全面回归测试 ✅ **完成**
- 结果: 83 个测试文件，1909 个测试用例全部通过

**Step 3**: TASK-227 - 发布热修复版本 v3.59.1 ⏳ **进行中**

### Next Action
> **更新版本号 → 更新 CHANGELOG → 创建 tag → 推送发布**

---

### 已修复问题 (v3.59.1)

**TASK-222**: 设置 API 窗口尺寸问题 ✅ **已修复** (2026-03-13)
- **问题**: 设置 API 时，窗口比程序还大
- **修复**: DialogContent 添加 `max-h-[85vh] overflow-y-auto` 限制最大高度并支持滚动
- **变更文件**: `src/components/settings/SettingsDialog.tsx`

**TASK-223**: 设置窗口快捷键和 Tab 重叠 ✅ **已修复** (2026-03-13)
- **问题**: 设置窗口里面快捷键和后面的 tab 重叠了
- **修复**: 增加对话框宽度到 640px，TabsList 改用 `flex flex-wrap` 自动换行
- **变更文件**: `src/components/settings/SettingsDialog.tsx`

**TASK-224**: 消息图标悬浮文字错误 ✅ **已修复** (2026-03-13)
- **问题**: 发出的文本消息里的所有图标悬浮文字都是"双击引用消息"
- **修复**: 将 title 属性从外层容器移到消息气泡内层，并添加条件判断
- **变更文件**: `src/components/chat/MessageItem.tsx`

**TASK-225**: 文档对话状态说明 ✅ **已修复** (2026-03-13)
- **问题**: 用户不清楚文档对话右边的状态（chunks 数量）是什么意思
- **修复**: 添加 tooltip 解释 chunks 的含义
- **变更文件**: `src/components/rag/DocumentList.tsx`, `src/i18n/locales/*.json`

### 已修复问题 (v3.59.0)

**TASK-221**: 自定义模型选择不生效 ✅ **已修复** (2026-03-13)
- **问题**: 设置自定义模型后，在聊天会话里仍然显示 GPT-4o
- **根因**: useModel.ts 初始加载时只检查模型是否在预定义列表中，忽略自定义模型
- **修复**: 初始加载时也支持自定义模型，添加到模型列表并设置
- **变更文件**: `src/hooks/useModel.ts`, `src/hooks/useModel.test.ts`

**TASK-219**: `/api/chat/{id}/messages` 返回 500 错误 ✅ **已修复**
- **根因**: 数据库 messages 表缺少 `images` 和 `files` 列
- **修复**: 添加 Alembic 迁移脚本 + 手动修复现有数据库
- **PR**: #395

**TASK-220**: 发送消息一直显示思考中然后报错 ✅ **已修复**
- **根因**: WebSocket 错误消息字段名不一致
- **修复**: 统一使用 `error` 字段名
- **PR**: #396

---

### v3.59.0 发布记录

✅ **GitHub Release: https://github.com/MrHulu/HuluAiChat/releases/tag/v3.59.0**

**发布结果**:
1. ✅ 测试验证通过（1909/1909 测试用例）
2. ✅ 版本号确认（package.json + tauri.conf.json = 3.59.0）
3. ✅ Tag v3.59.0 已推送
4. ✅ GitHub Release 创建成功
5. ✅ 4 个平台构建产物上传成功

---

## v3.59.0 规划摘要（暂停）

**MVP 范围** (6 个任务):
- P0: ~~TASK-211 全局热键~~ ✅、~~TASK-212 快速面板~~ ✅、~~TASK-213 剪贴板~~ ✅、~~TASK-214 权限引导~~ ✅
- P1: TASK-215 Sidecar 监控 ⏸️、TASK-216 WebSocket 优化 ⏸️

**状态**: ⏸️ 暂停，优先发布

---

## 最近完成

### TASK-213: 剪贴板增强（Cycle #21）

**完成时间**: 2026-03-12

**产出**:
- 剪贴板内容检测（打开 QuickPanel 时自动填充）✅
- 8 个预设 Quick Actions（翻译/摘要/润色/解释/代码审查/修复语法/扩展/简化）✅
- QuickActions 组件（图标支持）✅
- QuickActionsSettings 设置组件（自定义 Actions）✅
- 设置对话框 Quick Actions Tab ✅
- 复制回复到剪贴板 ✅
- i18n 翻译（EN/ZH）✅
- 测试：22 个测试用例通过 ✅

**变更文件**:
- `src/data/quickActions.ts` - Quick Actions 数据和工具函数
- `src/data/quickActions.test.ts` - 数据测试
- `src/components/quickpanel/QuickActions.tsx` - QuickActions 组件
- `src/components/quickpanel/QuickActions.test.tsx` - 组件测试
- `src/components/settings/QuickActionsSettings.tsx` - 设置组件
- `src/components/settings/SettingsDialog.tsx` - 添加 Quick Actions Tab
- `src/i18n/locales/*.json` - 添加 quickActions 翻译

**验证结果**: 所有 1882 个测试通过（81 个测试文件）

**隐私约束**: 剪贴板数据仅本地处理，不发送到服务器

---

### TASK-212: 快速提问面板（Cycle #20）

**完成时间**: 2026-03-12

**产出**:
- QuickPanel 浮动小窗口组件（400px 宽）✅
- 模型选择器 ✅
- Enter 发送，Shift+Enter 换行，Esc 关闭 ✅
- 回复显示区域（支持流式）✅
- 复制回复到剪贴板 ✅
- 暗色/亮色主题适配 ✅
- i18n 翻译（EN/ZH）✅
- 测试：10 个测试用例通过 ✅

**变更文件**:
- `src/components/quickpanel/QuickPanel.tsx` - 新建组件
- `src/components/quickpanel/QuickPanel.test.tsx` - 测试文件
- `src/components/quickpanel/index.ts` - 导出
- `src/i18n/locales/*.json` - 添加 quickPanel 翻译

**验证结果**: 所有 1854 个测试通过（79 个测试文件）

**隐私约束**: 所有数据本地处理，不发送到服务器

---

### TASK-211: 全局热键注册（Cycle #19）

**完成时间**: 2026-03-12

**产出**:
- Tauri global-shortcut 插件集成 ✅
- useGlobalShortcut hook（注册/注销/自定义/冲突检测）✅
- 默认快捷键: Ctrl+Shift+Space (Win/Linux), Cmd+Shift+Space (macOS) ✅
- 系统快捷键冲突检测 ✅
- 快捷键验证工具函数 ✅
- i18n 翻译（EN/ZH）✅
- 测试：18 个测试用例通过 ✅

**变更文件**:
- `src-tauri/Cargo.toml` - 添加 tauri-plugin-global-shortcut
- `src-tauri/src/lib.rs` - 初始化 global-shortcut 插件
- `src-tauri/capabilities/default.json` - 添加权限
- `package.json` - 添加 @tauri-apps/plugin-global-shortcut
- `src/hooks/useGlobalShortcut.ts` - 新建 hook
- `src/hooks/useGlobalShortcut.test.ts` - 测试文件
- `src/i18n/locales/en.json` - 添加 globalShortcut 翻译
- `src/i18n/locales/zh.json` - 添加 globalShortcut 翻译

**验证结果**: 所有 1844 个测试通过（78 个测试文件）

**隐私约束**: 快捷键配置仅存储在 localStorage，不发送到服务器

---

### TASK-210: 添加集成测试框架（Cycle #18）

**完成时间**: 2026-03-12

**产出**:
- `src/integration/` 目录结构 ✅
- `src/integration/utils.tsx` - 集成测试工具函数 ✅
- `src/integration/app-components.integration.test.tsx` - 31 个集成测试 ✅

**测试覆盖**:
1. Component Export Verification: 13 个测试
2. Hook Integration: 7 个测试
3. API Client Integration: 3 个测试
4. Service Integration: 2 个测试
5. BackendStatusIndicator Rendering: 5 个测试
6. Import Path Consistency: 1 个测试

**变更文件**:
- `huluchat-v3/src/integration/utils.tsx` - 新建集成测试工具
- `huluchat-v3/src/integration/app-components.integration.test.tsx` - 新建集成测试

**验证结果**: 所有 1826 个测试通过（77 个测试文件）

**目的**: 防止类似 BackendStatusIndicator 未集成的集成遗漏问题

---

### TASK-209: 更新模型列表（Cycle #17）

**完成时间**: 2026-03-12

**更新内容**:
- **OpenAI**: GPT-4.1, GPT-4o, GPT-4o-mini, o3-mini, o1, o1-mini
- **Claude**: Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3.5 Haiku
- **DeepSeek**: V3, R1 (保持不变)
- **Ollama**: Llama 3.3, Qwen 2.5

**变更文件**:
- `huluchat-v3/backend/api/settings.py` - 后端模型列表 (16 个模型)
- `huluchat-v3/src/data/modelComparison.ts` - 前端模型比较数据
- `huluchat-v3/src/i18n/locales/en.json` - 英文翻译
- `huluchat-v3/src/i18n/locales/zh.json` - 中文翻译

**验证结果**: 所有 1795 个测试通过

---

### TASK-208: 修复多个开发环境问题（Cycle #16）

**完成时间**: 2026-03-12

**修复内容**:
- BackendStatusIndicator 已集成到 App.tsx header ✅
- Python 导入正确（`from api.sessions import SessionModel`）✅
- Rust 依赖版本正确（`tauri-plugin-keyring = "0.1"`）✅

**验证结果**: 所有 1795 个测试通过

**变更文件**:
- `huluchat-v3/src/App.tsx` - 集成 BackendStatusIndicator
- `huluchat-v3/src/App.test.tsx` - 添加 useContextualTip mock

---

## v3.58.0 版本概要 ✅ **已完成**

**主题**: 消息交互增强 + 个性化体验 + 技术韧性

**MVP 功能**: 5 个 ✅ **全部完成**
- Phase 1 (P0): 完善引用回复 ✅、会话内搜索 ✅
- Phase 2 (P1): 主题定制 ✅、快捷键自定义 ✅
- Phase 3 (P1): 前端健康监控 ✅

**预计周期**: 5-6 Cycles
**实际周期**: 5 Cycles (Cycle #8-12)

**文档**: `docs/v3.58.0-roadmap.md`

**审核**: ✅ 已通过 Critic Munger 审核（有修改）
- 删除 TASK-201（消息复制按钮已存在）
- TASK-200 改为"完善引用回复"

---

## v3.57.0 版本概要

**主题**: 对话控制增强 + 工作流效率

**MVP 功能**: 5 个 ✅ **全部完成**
- Phase 1 (P0): 消息重新生成 ✅、消息编辑 ✅、会话模板 ✅
- Phase 2 (P1): 自定义命令 ✅、批量会话操作 ✅

**预计周期**: 4.5-5 Cycles
**实际周期**: 6 Cycles

**文档**: `docs/v3.57.0-roadmap.md`

---

## v3.56.0 版本概要

**主题**: AI 知识中心 + 帮助支持体系

**MVP 功能**: 10 个 ✅ **全部完成**
- Phase 1 (P0): 命令面板、提示词指南、首次引导 ✅
- Phase 2 (P1): FAQ、快捷键、反馈、模型对比 ✅
- Phase 3 (P1): 功能发现提示 ✅
- Phase 4 (P2): 帮助搜索 ✅、书签跳转 ✅、智能提示 ✅、错误解决建议 ✅

**预计周期**: 9-12 Cycles
**实际周期**: 12 Cycles

**文档**: `docs/v3.56.0-roadmap.md`

---

## ⚠️ 隐私红线

**禁止**:
- ❌ 用户行为追踪/埋点
- ❌ 向服务器发送使用数据
- ❌ 记录用户操作历史

**允许**:
- ✅ 检测"当前状态"
- ✅ 本地存储布尔值
- ✅ 提供外部链接

---

## 最近完成

### TASK-207: 官网版本号自动同步（Cycle #15）

**完成时间**: 2026-03-12

**产出**:
- `website/src/lib/version.ts` - 版本号配置文件
- `website/src/app/page.tsx` - 使用动态版本号
- `.github/workflows/release.yml` - 添加 update-website-version job

**自动化流程**:
1. 发布时从 git tag 提取版本号
2. 从 CHANGELOG.md 提取 release notes
3. 更新 version.ts 并提交 `[skip ci]`
4. 推送触发 deploy-website.yml 重新部署

**当前版本**: v3.58.0

**变更文件**:
- `website/src/lib/version.ts` - 新建版本号配置
- `website/src/app/page.tsx` - 使用 VERSION 和 RELEASE_NOTES
- `.github/workflows/release.yml` - 添加 update-website-version job

---

### TASK-206: 全面回归测试（Cycle #14）

**完成时间**: 2026-03-12

**产出**:
- 修复 useChat.test.ts mock（添加 createChatWebSocket）
- 修复 App.test.tsx mock（添加 useContextualTip）
- 更新 sendMessage 断言使用 objectContaining
- 更新删除会话测试匹配 AlertDialog 流程
- **所有 1795 个测试通过** (76 个测试文件)

**变更文件**:
- `huluchat-v3/src/hooks/useChat.test.ts` - 添加 createChatWebSocket mock
- `huluchat-v3/src/App.test.tsx` - 添加 useContextualTip mock，更新删除测试

**回归测试范围**:
- v3.55.0: MCP 集成、智能搜索、会话摘要、导出增强、提示词变量、本地偏好
- v3.56.0: 命令面板、知识中心、FAQ、快捷键列表、首次引导、功能发现
- v3.57.0: 消息重新生成、消息编辑、会话模板、自定义命令、批量操作
- v3.58.0: 引用回复、会话内搜索、主题定制、快捷键自定义、健康监控

**结果**: ✅ 所有测试通过

---

### TASK-205: 前端健康监控（Cycle #12）

**完成时间**: 2026-03-12

**产出**:
- useBackendHealth hook（状态管理 + 轮询 + 回调）✅
- BackendStatusIndicator 组件（状态指示器 UI）✅
- App.tsx 集成（Header 添加状态指示器）✅
- 四种状态：checking / healthy / degraded / offline ✅
- i18n 翻译（EN/ZH）✅
- 测试：25 个测试用例通过 ✅

**变更文件**:
- `src/hooks/useBackendHealth.ts` - 新建健康监控 hook
- `src/hooks/useBackendHealth.test.ts` - hook 测试
- `src/components/BackendStatusIndicator.tsx` - 新建状态指示器组件
- `src/components/BackendStatusIndicator.test.tsx` - 组件测试
- `src/App.tsx` - 集成状态指示器到 Header
- `src/i18n/locales/en.json` - 添加 health 翻译
- `src/i18n/locales/zh.json` - 添加 health 翻译

**功能特性**:
- 实时后端健康状态指示器
- 四种状态显示：checking（检查中）、healthy（健康）、degraded（降级）、offline（离线）
- 自动轮询检测（每 30 秒）
- 点击显示状态详情
- 视觉指示器（颜色区分状态）

**隐私约束**: 仅检测本地后端状态，不发送数据

---

### TASK-204: 快捷键自定义（Cycle #11）

**完成时间**: 2026-03-12

**产出**:
- useShortcutSettings hook（状态管理 + localStorage 存储）✅
- ShortcutSettings 组件（快捷键列表 + 录制 + 冲突检测）✅
- SettingsDialog 添加快捷键 Tab ✅
- useKeyboardShortcuts hook 读取自定义快捷键 ✅
- i18n 翻译（EN/ZH）✅
- 测试：29 个测试用例通过 ✅

**变更文件**:
- `src/hooks/useShortcutSettings.ts` - 新建快捷键设置 hook
- `src/hooks/useShortcutSettings.test.ts` - hook 测试
- `src/components/settings/ShortcutSettings.tsx` - 新建快捷键设置组件
- `src/components/settings/ShortcutSettings.test.tsx` - 组件测试
- `src/components/settings/SettingsDialog.tsx` - 添加快捷键 Tab
- `src/hooks/useKeyboardShortcuts.ts` - 读取自定义快捷键
- `src/i18n/locales/en.json` - 添加 shortcuts 翻译
- `src/i18n/locales/zh.json` - 添加 shortcuts 翻译

**功能特性**:
- 设置对话框新增"快捷键"标签页
- 可自定义快捷键列表
- 快捷键录制功能（按键自动识别）
- 冲突检测（重复快捷键警告）
- 重置为默认功能
- 快捷键存储在 localStorage

**隐私约束**: 快捷键设置仅存储在本地

---

### TASK-203: 主题定制（Cycle #10）

**完成时间**: 2026-03-12

**产出**:
- ThemeSettings 组件（外观设置 Tab）✅
- SettingsDialog 添加第 5 个 Tab（外观）✅
- 预设主题：Light / Dark / System ✅
- 主题预览卡片（可点击切换）✅
- i18n 翻译（EN/ZH）✅
- 测试：12 个测试用例通过 ✅

**变更文件**:
- `src/components/settings/ThemeSettings.tsx` - 新建主题设置组件
- `src/components/settings/SettingsDialog.tsx` - 添加外观 Tab
- `src/i18n/locales/en.json` - 添加 appearance 翻译
- `src/i18n/locales/zh.json` - 添加 appearance 翻译
- `src/components/settings/ThemeSettings.test.tsx` - 新建测试
- `src/components/settings/SettingsDialog.test.tsx` - 更新测试（添加 keyring 和 theme mock）

**功能特性**:
- 设置对话框新增"外观"标签页
- 下拉选择器切换主题
- 可视化主题预览卡片
- 点击卡片直接切换主题
- 显示当前主题描述
- 隐私提示：主题偏好仅存储在本地

**隐私约束**: 主题偏好存储在 localStorage，不发送到服务器

---

### TASK-202: 会话内搜索（Cycle #9）

**完成时间**: 2026-03-12

**产出**:
- ChatSearch 组件（搜索栏 UI）✅
- 搜索工具函数✅
- MessageItem 搜索高亮支持✅
- ChatView 集成搜索功能✅
- Ctrl+F 快捷键支持✅
- i18n 翻译（EN/ZH）✅
- 测试：33 个测试用例通过✅

**变更文件**:
- `src/components/chat/ChatSearch.tsx` - 新建搜索组件
- `src/utils/search.ts` - 新建搜索工具函数
- `src/components/chat/MessageItem.tsx` - 添加 isSearchMatch/isCurrentMatch props
- `src/components/chat/MessageList.tsx` - 添加 searchMatchIds/currentMatchId props
- `src/components/chat/ChatView.tsx` - 集成搜索功能
- `src/hooks/useKeyboardShortcuts.ts` - 添加 Ctrl+F 快捷键
- `src/i18n/locales/en.json` - 搜索相关翻译
- `src/i18n/locales/zh.json` - 搜索相关翻译

**功能特性**:
- 点击搜索按钮或 Ctrl+F 打开搜索栏
- 输入关键词实时搜索
- 区分大小写选项
- 匹配的消息高亮显示
- 当前匹配项特殊高亮
- 上一个/下一个导航
- Enter/F3 快捷键支持
- Esc 关闭搜索

**隐私约束**: 搜索仅在前端进行，不发送到服务器

---

### TASK-200: 完善引用回复（Cycle #8）

**完成时间**: 2026-03-12

**产出**:
- 前端 ChatView 传递 quotedMessageId 给 handleSend
- 前端 useChat sendMessage 发送 quoted_message_id 到后端
- 后端 chat.py 接收 quoted_message_id 参数
- 后端获取引用消息并添加到 AI 上下文

**变更文件**:
- `huluchat-v3/src/components/chat/ChatView.tsx` - handleSend 传递 quotedMessageId
- `huluchat-v3/src/hooks/useChat.ts` - SendMessageOptions 添加 quotedMessageId，发送到后端
- `huluchat-v3/backend/api/chat.py` - 接收 quoted_message_id，获取引用消息添加到上下文

**功能特性**:
- 引用预览组件（输入框上方）- 已存在
- 引用按钮和双击引用 - 已存在
- 发送时包含 quoted_message_id ✅
- 后端将引用消息添加到 AI 上下文 ✅
- AI 能够理解用户正在回复哪条消息

**隐私约束**: 引用仅存在于当前会话，不额外存储

---

### TASK-181: API Key 存储改用系统钥匙串（Cycle #187-188）

**完成时间**: 2026-03-12

**产出**:
- App.tsx 启动时从 keyring 加载 API key 发送给后端
- keyring.ts 支持 openai 和 deepseek provider
- SettingsDialog 已使用 keyring 存储 API key
- 后端 settings.py 不持久化 API key 到文件
- Tauri keyring 插件集成

**变更文件**:
- `huluchat-v3/src/App.tsx` - 添加初始化 useEffect 从 keyring 加载 API key
- `huluchat-v3/src/services/keyring.ts` - 新建 keyring 服务
- `huluchat-v3/src/components/settings/SettingsDialog.tsx` - 使用 keyring 存储 API key
- `huluchat-v3/backend/api/settings.py` - 后端不持久化 API key
- `huluchat-v3/src-tauri/Cargo.toml` - 添加 tauri-plugin-keyring
- `huluchat-v3/src-tauri/src/lib.rs` - 初始化 keyring 插件
- `huluchat-v3/package.json` - 添加 tauri-plugin-keyring-api

**功能特性**:
- 应用启动时自动从系统钥匙串加载 API key
- 支持 macOS Keychain、Windows Credential Manager、Linux Secret Service
- API key 不再存储到后端文件（只存在运行时内存）
- 用户可清除存储的 API key

---

### TASK-180: 添加复合数据库索引（Cycle #186）

**完成时间**: 2026-03-12

**产出**:
- Alembic 迁移 - 4 个复合索引
- SQLAlchemy 模型更新 - Index 声明

**添加的索引**:
1. `ix_messages_session_created` - (session_id, created_at) - 优化消息查询
2. `ix_session_tags_session_tag` - (session_id, tag) - 优化标签查询
3. `ix_message_bookmarks_session_created` - (session_id, created_at) - 优化书签查询
4. `ix_sessions_folder_updated` - (folder_id, updated_at) - 优化会话列表查询

**变更文件**:
- `backend/migrations/versions/20260312_1300_002_add_composite_indexes.py` - 新建迁移
- `backend/models/schemas.py` - MessageModel 添加索引
- `backend/models/tags_bookmarks.py` - SessionTagModel, MessageBookmarkModel 添加索引
- `backend/api/sessions.py` - SessionModel 添加索引

---

### TASK-164: 更新签名验证（Cycle #185）- 代码完成

**完成时间**: 2026-03-12

**状态**: 代码修改完成，等待 Boss 配置 GitHub Secrets

**产出**:
- tauri.conf.json - 添加 `createUpdaterArtifacts: true`
- release.yml - 添加签名环境变量和签名文件上传
- generate-latest-json.js - 更新平台键格式为 `OS-ARCH`
- docs/update-signing-setup.md - 密钥生成指南

**变更文件**:
- `huluchat-v3/src-tauri/tauri.conf.json` - 添加 createUpdaterArtifacts
- `.github/workflows/release.yml` - 添加签名环境变量和 artifacts
- `huluchat-v3/scripts/generate-latest-json.js` - 修复平台键格式
- `docs/update-signing-setup.md` - 新建设置指南

**等待 Boss 操作**:
1. 生成密钥对：`npm run tauri signer generate -- -w ~/.tauri/huluchat.key`
2. 添加 GitHub Secrets：`TAURI_SIGNING_PRIVATE_KEY` 和 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
3. 提供公钥内容以更新 tauri.conf.json

---

### TASK-194: 错误解决建议（Cycle #183）

**完成时间**: 2026-03-12

**产出**:
- errorCodes.ts - 17 个错误码配置（6 个分类）
- ErrorSolutions.tsx - 错误解决建议组件
- 知识中心 help 分类集成
- i18n 翻译 (EN/ZH)
- 测试：28 个测试用例通过

**变更文件**:
- `src/data/errorCodes.ts` - 新建错误码映射数据
- `src/data/errorCodes.test.ts` - 错误码数据测试
- `src/components/knowledge/ErrorSolutions.tsx` - 新建组件
- `src/components/knowledge/ErrorSolutions.test.tsx` - 组件测试
- `src/components/knowledge/index.ts` - 导出 ErrorSolutions
- `src/components/knowledge/KnowledgeCenter.tsx` - 集成到 help 分类
- `src/i18n/locales/en.json` - 添加 errors 翻译
- `src/i18n/locales/zh.json` - 添加 errors 翻译

**功能特性**:
- 6 个错误分类：API Key、连接、模型、Ollama、文档对话、通用
- 17 个错误码配置
- 症状关键词匹配
- 分步解决方案
- 搜索过滤功能
- 隐私设计：静态内容，不收集用户错误信息

**错误分类**:
1. 🔑 API Key - 缺少/无效/格式错误
2. 🌐 连接 - 连接失败/超时/代理/后端离线
3. 🤖 模型 - 未找到/速率限制/配额不足/上下文过长
4. 💻 Ollama - 未运行/模型未找到/内存不足
5. 📄 文档对话 - 文件过大/格式不支持/无文档
6. ⚠️ 通用 - 未知错误

---

### TASK-193: 上下文智能提示（Cycle #182）

**完成时间**: 2026-03-12

**产出**:
- contextualTips.ts - 5 个提示配置（no-api-key, no-model, empty-session, first-visit, settings-incomplete）
- useContextualTip.ts - 状态检测 hook（当前状态、设置加载）
- ContextualTip.tsx - 提示显示组件
- 集成到 App.tsx（优先级高于功能发现提示）
- i18n 翻译 (EN/ZH)
- 测试：21 个测试用例通过
- 隐私约束：只检测当前状态，不存储历史行为

**变更文件**:
- `src/data/contextualTips.ts` - 新建提示配置数据
- `src/hooks/useContextualTip.ts` - 新建上下文检测 hook
- `src/hooks/useContextualTip.test.ts` - hook 测试
- `src/components/ContextualTip.tsx` - 新建组件
- `src/components/ContextualTip.test.tsx` - 组件测试
- `src/hooks/index.ts` - 导出新 hook
- `src/App.tsx` - 集成上下文提示
- `src/i18n/locales/en.json` - 添加 contextualTips 翻译
- `src/i18n/locales/zh.json` - 添加 contextualTips 翻译

**功能特性**:
- 基于当前状态智能提示（空会话、无API Key、无模型、首次访问、设置不完整）
- 优先级排序（数字越小优先级越高）
- 关闭状态仅存储于会话内存
- 可永久禁用所有上下文提示

---

### TASK-192: 书签消息跳转（Cycle #181）

**完成时间**: 2026-03-12

**产出**:
- ChatView 添加 ref 暴露 scrollToMessage 方法
- BookmarkJumpDialog 组件 - 书签选择对话框
- CommandPalette 添加 jumpToBookmark 命令
- App.tsx 集成书签跳转功能
- i18n 翻译 (EN/ZH)
- 测试：10 个测试用例通过

**变更文件**:
- `src/components/chat/ChatView.tsx` - 添加 forwardRef 和 ChatViewRef
- `src/components/chat/index.ts` - 导出 ChatViewRef
- `src/components/bookmark/BookmarkJumpDialog.tsx` - 新建书签跳转对话框
- `src/components/bookmark/index.ts` - 导出 BookmarkJumpDialog
- `src/components/command/CommandPalette.tsx` - 添加 onJumpToBookmark
- `src/App.tsx` - 集成 BookmarkJumpDialog
- `src/i18n/locales/en.json` - 添加 bookmark 翻译
- `src/i18n/locales/zh.json` - 添加 bookmark 翻译

**功能特性**:
- 通过命令面板（Ctrl+K）选择"跳转到书签"
- 搜索过滤书签（消息内容、笔记）
- 点击书签自动切换会话并跳转到消息
- 消息高亮显示 2 秒

---

### TASK-191: 功能发现提示（Cycle #180）

**完成时间**: 2026-03-12

**产出**:
- useFeatureDiscovery hook - 功能使用状态检测
- FeatureDiscoveryTip 组件 - 提示卡片 UI
- 6 个可发现功能（命令面板、知识中心、文档对话、导出、文件夹、模型切换）
- 可关闭/永久关闭
- 隐私约束：只存储布尔值
- i18n 翻译 (EN/ZH)
- 测试：26 个测试用例通过

**变更文件**:
- `src/hooks/useFeatureDiscovery.ts` - 新建 hook
- `src/hooks/useFeatureDiscovery.test.ts` - hook 测试
- `src/components/FeatureDiscoveryTip.tsx` - 新建组件
- `src/components/FeatureDiscoveryTip.test.tsx` - 组件测试
- `src/hooks/index.ts` - 导出新 hook
- `src/App.tsx` - 集成功能发现提示
- `src/i18n/locales/en.json` - featureDiscovery 翻译
- `src/i18n/locales/zh.json` - featureDiscovery 翻译

**可发现功能**:
1. ⌘ 命令面板 (Ctrl+K)
2. 📚 知识中心
3. 📄 文档对话 (RAG)
4. 📤 导出对话
5. 📁 文件夹整理
6. 🔄 切换模型

**隐私设计**:
- 只存储布尔值（是否使用过）
- 不记录使用次数、时间、频率
- 用户可永久关闭提示
- 所有数据存储在本地

---

### TASK-190: 首次使用引导（Cycle #179）

**完成时间**: 2026-03-12

**产出**:
- 增强 WelcomeDialog 组件 - 5 步引导流程
- 步骤内容：欢迎、多模型、文档对话、快捷键、知识中心
- localStorage 状态保存（已有）
- i18n 翻译更新 (EN/ZH)
- 测试更新 - 5 步流程测试

**变更文件**:
- `src/components/WelcomeDialog.tsx` - 5 步引导流程
- `src/components/WelcomeDialog.test.tsx` - 测试更新
- `src/i18n/locales/en.json` - 5 步翻译
- `src/i18n/locales/zh.json` - 5 步翻译

**引导流程**:
1. 👋 欢迎介绍 - 隐私优先
2. 🤖 多模型支持 - OpenAI/DeepSeek/Ollama
3. 📚 文档对话 - RAG 功能
4. ⌨️ 快捷导航 - Ctrl+K 命令面板
5. 💡 知识中心 - 提示词技巧和帮助

---

### TASK-189: 帮助文档搜索（Cycle #178）

**完成时间**: 2026-03-12

**产出**:
- SearchBar 组件 - 搜索框和结果展示
- searchData.ts - MiniSearch 索引和搜索逻辑
- 搜索范围：提示词技巧、FAQ、模型对比
- 搜索高亮显示
- KnowledgeCenter 集成 - 主页显示搜索框
- i18n 翻译更新 (EN/ZH)

**变更文件**:
- `src/data/searchData.ts` - 新建搜索索引
- `src/components/knowledge/SearchBar.tsx` - 新建搜索组件
- `src/components/knowledge/KnowledgeCenter.tsx` - 集成搜索
- `src/components/knowledge/index.ts` - 导出 SearchBar
- `src/i18n/locales/en.json` - 添加 search 翻译
- `src/i18n/locales/zh.json` - 添加 search 翻译
- `package.json` - 添加 minisearch 依赖

**搜索特性**:
- 模糊匹配 (fuzzy: 0.2)
- 前缀匹配
- 标题权重更高 (boost: 2)
- 最多显示 10 个结果
- 关键词高亮

---

### TASK-188: 模型对比说明（Cycle #177）

**完成时间**: 2026-03-12

**产出**:
- FeedbackLinks 组件 - 外部链接展示
- 3 个反馈渠道：GitHub Issues、邮件、社区讨论
- 隐私提示（不收集用户数据）
- KnowledgeCenter 集成 - help 分类底部
- i18n 翻译更新 (EN/ZH)

**变更文件**:
- `src/components/knowledge/FeedbackLinks.tsx` - 新建
- `src/components/knowledge/KnowledgeCenter.tsx` - 集成反馈链接
- `src/components/knowledge/index.ts` - 导出 FeedbackLinks
- `src/i18n/locales/en.json` - 添加 feedback 翻译
- `src/i18n/locales/zh.json` - 添加 feedback 翻译

**反馈渠道**:
- GitHub Issues: https://github.com/MrHulu/HuluAiChat/issues
- Email: mailto:491849417@qq.com
- Community: https://github.com/MrHulu/HuluAiChat/discussions

---

### TASK-186: 快捷键列表（Cycle #175）

**完成时间**: 2026-03-12

**产出**:
- ShortcutList 组件 - 分类快捷键展示
- KnowledgeCenter 集成 - help 分类显示快捷键
- 复用 KEYBOARD_SHORTCUTS 数据
- i18n 翻译更新 (EN/ZH)

---

### TASK-185: FAQ 常见问题（Cycle #174）

**完成时间**: 2026-03-12

**产出**:
- Accordion 组件 - 可折叠面板 UI
- FAQList 组件 - FAQ 列表展示
- faqData.ts - 19 个常见问题数据
- i18n 翻译更新 (EN/ZH)

---

## Company State

- **项目**: HuluChat
- **当前版本**: v3.59.0 开发中 (3/6 任务完成)
- **下一版本**: v3.60.0
- **待开始任务**: 3 个 (TASK-214, TASK-215, TASK-216)
- **已完成任务计数**: 50

---

*更新时间: 2026-03-12 - Cycle #21*
