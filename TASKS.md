# 任务清单

## 🔴 紧急任务（阻塞 Boss 工作）
- [x] **TASK-150**: 🔧 修复 CI - ESLint 错误 ✅ 2026-03-11
  - 文件: `ChatInput.tsx` Line 101, 132
  - 问题: `useCallback` 依赖数组不正确
  - 修复: 依赖改为 `[t, images.length]` 和 `[t, files.length]`
  - Cycle #150

- [ ] **TASK-151**: 🚀 发布 GitHub Release（最新版本）
  - 原因: Boss 需要最新版本准备素材
  - 前置: TASK-150 ✅ 完成，可以发布

## 进行中
- [x] **TASK-129**: 🚀 README 优化 ✅ 2026-03-11
  - 修复缺失的图片引用（Demo GIF、截图占位符）
  - 更新功能列表（添加文件上传、消息引用、交互增强等）
  - 优化营销文案（Why HuluChat 部分）
  - **修正 GitHub URL**：`MrHulu/HuluChat` → `MrHulu/HuluAiChat`
  - Cycle #150

## 待开始
<!-- 新任务添加到这里 -->
- [ ] **TASK-122**: 🎨 UI/UX 美化优化（持续进行）
  - 状态：长期任务，持续进行
  - 方向：界面美化、交互优化、视觉一致性

- [ ] **TASK-116**: 🎬 准备 Product Hunt 发布素材(截图、视频) - 等待 Boss

## 已取消
- [x] ~~**TASK-127**: 🎤 用户访谈招募~~ ❌ **Boss 决定取消** - 暂停并删除相关内容
- [x] ~~**TASK-120**: 📊 添加用户行为埋点~~ ❌ **Boss 决定取消** - 隐私优先原则

## ⚠️ 永久禁止事项（Boss 明确要求）
- ❌ **禁止功能**：用户行为埋点、数据追踪、遥测功能、使用统计
- 📋 **原则**：隐私优先（Privacy-First），用户数据不上传、不收集
- 🚫 **执行**：任何版本规划或开发都不得包含上述功能
- 📄 **文档**：CLAUDE.md 和 PROMPT.md 已明确记录此要求

## 已完成
- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 消息发送成功反馈 ✅ 2026-03-11
  - ChatInput 添加发送成功反馈动画
  - 发送按钮短暂显示 Check 图标 + "已发送" 文字
  - 1.5 秒后自动恢复正常状态
  - i18n EN/ZH 翻译
  - 新增 3 个测试用例
  - Cycle #149

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 按钮涟漪效果 ✅ 2026-03-11
  - 新增 Ripple 组件实现点击涟漪动画
  - Button 组件集成 Ripple 效果
  - 支持自定义颜色和动画时长
  - asChild 模式不显示涟漪
  - 新增 11 个测试用例
  - Cycle #147

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 双击引用消息 ✅ 2026-03-11
  - MessageItem 添加 onDoubleClick 处理，双击快速引用
  - 悬停提示 "双击引用消息"
  - 编辑中或流式传输时不触发引用
  - 添加 cursor-pointer 样式指示可交互
  - 新增 5 个测试用例
  - i18n EN/ZH 翻译
  - Cycle #146

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 消息引用回复功能 ✅ 2026-03-11
  - MessageItem 添加引用按钮（Quote 图标）
  - ChatInput 添加引用预览显示
  - ChatView 添加引用状态管理
  - i18n EN/ZH 翻译
  - Cycle #145

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - AI 消息重新生成按钮 ✅ 2026-03-11
  - useChat hook 添加 regenerateMessage 函数
  - MessageItem 组件添加重新生成按钮（仅 AI 消息显示）
  - 加载状态显示旋转动画
  - 新增 7 个测试用例
  - Cycle #143

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 输入框字符计数 ✅ 2026-03-11
  - ChatInput 添加实时字符计数显示
  - 超过 4000 字符显示橙色警告
  - 超过 8000 字符显示红色警告
  - i18n EN/ZH 翻译
  - 新增 4 个测试用例
  - Cycle #142

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 消息日期分隔符 ✅ 2026-03-11
  - 新增 DateSeparator 组件，支持日期分组显示
  - MessageList 按日期自动分组消息（今天、昨天、其他日期）
  - 虚拟列表支持日期分隔符
  - i18n 中英文支持
  - Cycle #140

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 滚动到底部按钮 ✅ 2026-03-11
  - 当用户向上滚动查看历史消息时显示"滚动到底部"悬浮按钮
  - 点击按钮平滑滚动到最新消息
  - i18n EN/ZH 翻译
  - Cycle #139

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 会话删除确认对话框 ✅ 2026-03-11
  - 删除会话时显示确认对话框，防止误删除
  - 使用 AlertDialog 组件
  - i18n EN/ZH 翻译
  - Cycle #139

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 键盘快捷键 / 聚焦搜索 ✅ 2026-03-11
  - 添加全局键盘快捷键 `/` 聚焦搜索框
  - SessionList 使用 forwardRef 暴露 focusSearch 方法
  - 当侧边栏展开且不在输入框中时，按 `/` 聚焦搜索
  - Cycle #138

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 文件上传错误提示 ✅ 2026-03-11
  - ChatInput 添加 toast 错误提示
  - 文件过大时显示错误（图片 10MB、文件 20MB）
  - 达到最大数量时显示警告（5 个文件）
  - i18n EN/ZH 翻译
  - Cycle #138

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 消息时间戳显示 ✅ 2026-03-11
  - MessageItem 组件添加相对时间戳显示
  - 悬停时显示时间戳（"刚刚"、"2分钟前"、"1小时前"、"昨天"、"2天前"等）
  - 支持中英文双语
  - i18n EN/ZH 翻译
  - Cycle #136

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 消息复制按钮 ✅ 2026-03-11
  - MessageItem 组件添加复制按钮
  - 点击复制消息内容到剪贴板
  - 复制成功显示 toast 提示
  - 复制后图标变为对勾，2 秒后恢复
  - Cycle #135

- [x] **TASK-122**: 🎨 UI/UX 美化优化 - 空状态快捷提示 ✅ 2026-03-11
  - EmptyState 组件添加 hints 和 action 属性
  - MessageList 空状态显示快捷提示词
  - 用户可点击提示词快速开始对话
  - i18n EN/ZH 翻译
  - Cycle #134

- [x] **TASK-130**: 📎 添加文件上传功能（文档、代码等）✅ 2026-03-11
  - Phase 1: 文件上传 UI（支持多文件、拖拽）✅
  - Phase 2: 文件预览（显示文件名、大小、类型）✅
  - Phase 3: API 集成（发送给后端）✅
  - Phase 4: 测试和优化 ✅
  - 前端：ChatInput 添加文件上传按钮、拖拽支持、预览组件
  - 后端：MessageModel 添加 files 字段、chat.py 处理文件附件
  - 支持文件类型：PDF、TXT、MD、CSV、JSON、JS、TS、JSX、TSX、HTML、CSS、XML、DOC、DOCX、XLS、XLSX
  - 最大文件大小：20MB，最多 5 个文件

- [x] **TASK-128**: ⚙ 支持自定义模型配置（智谱、中转 API 等）✅ 2026-03-10
  - SettingsDialog 添加 "Custom Model" 选项
  - 选择 Custom 时显示输入框让用户输入模型 ID
  - 支持任意 OpenAI 兼容 API 的模型（智谱 GLM、通义千问、Moonshot 等）
  - i18n EN/ZH 翻译

- [x] **TASK-121**: 💻 开发 v3.50.0 - 会话标签/消息书签功能 ✅ 2026-03-07
  - Phase 1: 数据库 Schema 设计（tags, bookmarks 表）✅
  - Phase 2: 会话标签 UI（打标签、按标签筛选）✅
  - Phase 3: 消息书签 UI（标记重要消息、快速跳转）✅
  - Phase 4: 发布 v3.50.0 ✅

- [x] **TASK-119**: 💻 开发 v3.49.0 - 键盘快捷键优化 ✅ 2026-03-07
  - Phase 1: Ctrl+1/2/3 快速切换最近会话 ✅
  - Phase 2: 发布 v3.49.0 ✅
  - PR #170 已合并
  - GitHub Release v3.49.0 已创建
  - https://github.com/MrHulu/HuluAiChat/releases/tag/v3.49.0
  - 注：命令面板增强推迟到后续版本（根据 Critic 建议）

- [x] **TASK-118**: 🚀 发布 v3.48.0（GitHub Release + 桌面构建）✅ 2026-03-07
  - 版本号更新：tauri.conf.json, Cargo.toml
  - CHANGELOG.md 更新
  - GitHub Release v3.48.0 已创建
  - https://github.com/MrHuluAiChat/releases/tag/v3.48.0

- [x] **TASK-117**: 🚀 开发 v3.48.0 - 智能引导系统 ✅ 2026-03-07
  - WelcomeDialog 组件（3 步引导）
  - i18n EN/ZH 翻译
  - localStorage 首次启动检测
  - PR #164 已合并

- [x] **TASK-115**: 📝 优化 GitHub README（营销优化）✅ 2026-03-07
  - 添加 shields.io badges (release, license, platform)
  - 添加新功能：RAG 智能问答、插件系统
  - 更新版本到 v3.47.0
  - 添加 DeepSeek 推荐标记
  - 添加 Moonshot API 配置

- [x] **TASK-114**: 📧 提醒 Boss 配置 Cloudflare Secrets ✅ 2026-03-07
  - 邮件已发送：详细配置指南
  - 部署失败原因：apiToken 未配置
  - 等待 Boss 配置

- [x] **TASK-111**: 💻 开发 v3.47.0 - 用户体验优化 ✅ 2026-03-07
  - Phase 1: 输入框自动聚焦 + 消息发送反馈 ✅
  - Phase 2: 空状态引导 + 搜索 loading ✅
  - Phase 3: 消息编辑键盘提示 ✅
  - 功能已存在，验证测试通过

- [x] **TASK-113**: 🚀 规划 v3.47.0（自主决策）✅ 2026-03-07
  - 版本号已更新为 3.47.0
  - CHANGELOG 已更新

- [x] **TASK-112**: 📱 手机版构建调研（团队协作）✅ 2026-03-07
  - Boss 决策：暂不开发手机版
  - 决策原因：聚焦桌面版，资源有限
  - 调研报告已归档

- [x] **TASK-104**: 🌐 官网部署配置（Cloudflare secrets）✅ 2026-03-07
  - GitHub Secrets 已配置:
    - CLOUDFLARE_API_TOKEN ✅
    CLOUDFLARE_ACCOUNT_ID ✅
  - GitHub Actions workflow 已就绪
  - 下次推送将自动部署

- [x] **TASK-110**: 💻 开发 v3.46.0 - DeepSeek 默认模型 + RAG 单文档对话 ✅ 2026-03-07
  - Phase 1: DeepSeek 默认模型 ✅
  - Phase 2: RAG 后端 Pipeline ✅ (PR #147)
  - Phase 2.5: RAG 前端 UI ✅ (Cycle #114)
  - Phase 3: 发布 v3.46.0 ✅ (Cycle #116)

- [x] **TASK-109**: 🚀 规划 v3.46.0 新功能（自主决策）✅ 2026-03-07 (Cycle #104)
- [x] **TASK-105**: ⚡ 性能优化 - Rust LTO + Mermaid 懒加载 ✅ 2026-03-07 (Cycle #98)
- [x] **TASK-108**: 🧹 清理项目目录结构 - 删除旧 Python 架构遗留文件 ✅ 2026-03-07 (Cycle #97)
- [x] TASK-107: 📧 发送测试邮件给 Boss（验证 SMTP 配置）✅ 2026-03-07 (Cycle #87)
- [x] TASK-106: 🚨 Boss 指令 - 补发进度邮件 ✅ 2026-03-07 (Cycle #82)
- [x] TASK-103: 修复 CI 构建失败 - Python sidecar 二进制文件不存在 ✅ 2026-03-07
- [x] TASK-100: 会话分组/文件夹功能 ✅ 2026-03-04
- [x] TASK-101: v3.7.0 发布 ✅ 2026-03-04
- [x] TASK-102: 数据库迁移和命名冲突修复 ✅ 2026-03-04

---

*添加任务：秘书/Boss 在"待开始"添加新任务*
