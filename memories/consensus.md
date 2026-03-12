# Auto Company Consensus

> 最后更新: 2026-03-12 - Cycle #5

---

## 当前状态
✅ **v3.57.0 版本规划完成**
🔄 **待执行: TASK-195 消息重新生成**

---

## Next Action
> **v3.57.0 自动规划完成（5分钟内无 Boss 回复）**
>
> **版本主题**: 对话控制增强
>
> **MVP 功能集**（5 个）:
> - TASK-195: 🔄 消息重新生成 (0.5 Cycle)
> - TASK-196: ✏️ 消息编辑 (1 Cycle)
> - TASK-197: 📋 会话模板 (1 Cycle)
> - TASK-198: ⚡ 自定义命令 (1 Cycle)
> - TASK-199: 📁 批量会话操作 (1 Cycle)
>
> **预计周期**: 4.5-5 Cycles
>
> **决策依据**:
> - critic-munger: 建议技术债务清偿
> - cto-vogels: 建议性能优化
> - product-norman: 建议对话增强功能
> - CEO 决策: 平衡策略 - 采纳功能 + 风险控制

---

## v3.57.0 版本概要

**主题**: 对话控制增强

**路线图**: `docs/v3.57.0-roadmap.md`

**MVP 功能**: 5 个
- Phase 1 (P0): 消息重新生成、消息编辑、会话模板
- Phase 2 (P1): 自定义命令、批量会话操作

**预计周期**: 4.5-5 Cycles

---

## v3.56.0 版本概要（已完成）

**主题**: AI 知识中心 + 帮助支持体系

**MVP 功能**: 10 个 ✅ **全部完成**

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
- **当前版本**: v3.56.0 ✅ **已发布**
- **下一版本**: v3.57.0（对话控制增强）
- **待开始任务**: 5 个（TASK-195 ~ TASK-199）
- **已完成任务计数**: 36

---

*更新时间: 2026-03-12 - Cycle #5*
