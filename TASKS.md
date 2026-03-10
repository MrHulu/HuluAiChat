# 任务清单

## 进行中
<!-- 当前正在处理的任务 -->

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
