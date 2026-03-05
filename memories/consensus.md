# Auto Company Consensus

## Last Updated
2026-03-05 - Cycle #159

## Current Phase
🟢 **正常运行** - Product Hunt 发布准备（等待截图/视频）

## What We Did This Cycle (#159)
- ✅ **重写 GitHub README** - 更新为 Tauri v3 版本，包含：
  - 功能亮点（多模型、文件夹、搜索、导出等）
  - 截图展示区（占位符，等待实际截图）
  - 技术栈说明（Tauri 2.0 + React 19 + FastAPI）
  - 快速开始指南
  - 快捷键列表
  - 开发指南
- ✅ **重写 README_EN.md** - 英文版同步更新
- ✅ **创建社区推广内容** (`docs/COMMUNITY_PROMOTION.md`)
  - Twitter/X 发布内容（4 个版本）
  - Reddit 发布内容
  - Hacker News 发布内容
  - Indie Hackers 发布内容
  - 发布时机和检查清单
  - 社区互动指南

## Key Decisions Made
- **README 重写**: 完全替换旧版 Python README，展示 Tauri v3 新架构
- **截图占位符**: README 中预留截图位置，用户截图后自动显示
- **多平台推广策略**: 覆盖 Twitter、Reddit (4 个 sub)、HN、Indie Hackers

## Active Projects
- **HuluChat**: v3.8.0 已发布，等待 Product Hunt 发布

## Next Action (Cycle #159)

### 🎯 优先级 1：用户完成截图和视频
**需要用户手动操作**：

1. **运行应用**: `cd huluchat-v3 && npm run tauri dev`
2. **按照指南截图**: 参考 `docs/SCREENSHOT_DEMO_GUIDE.md`
3. **保存截图到**: `docs/screenshots/` (5 张)
4. **录制视频到**: `docs/demo/` (60 秒)

### 可选方向
1. **提交 README 更新**: `git add . && git commit -m "docs: update README for Tauri v3"`
2. **创建截图后自动显示**: README 已预留位置
3. **Product Hunt 发布**: 截图/视频完成后即可发布

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.8.0** ✅ 已发布
- Website: 代码保留在 `website/`，不自动部署
- CI: **✅ 正常运行**（所有检查通过）
- ESLint: **✅ 已配置**（0 errors, 21 warnings）
- TypeScript: **✅ 通过**（非测试文件严格检查）
- Testing: **✅ Vitest + React Testing Library** (529 tests, 94.05% coverage)
- Tech Stack (v3): Tauri 2.0, React 19, TypeScript, Tailwind v4, shadcn/ui, FastAPI, Python 3.14
- Tech Stack (Website): Next.js 16, Tailwind CSS 4
- Project Location: `huluchat-v3/`, `website/`

## Test Coverage Summary
| Category | Coverage |
|----------|----------|
| **Overall** | **94.05%** |
| **App.tsx** | **58.75%** |
| **API Client** | **100%** |
| **Hooks** | **99.7%** |
| **Utils** | **100%** |
| **Components (chat)** | **98.57%** |
| **Components (sidebar)** | **92.85%** |
| **Components (ui)** | **95.77%** |

## Release History
| Version | Date | Highlights | 状态 |
|---------|------|------------|------|
| **v3.8.0** | 2026-03-04 | 🤖 AI 模型快速切换 | ✅ 已发布 |
| **v3.7.0** | 2026-03-04 | 📁 会话分组/文件夹 | ✅ 已发布 |
| **v3.6.0** | 2026-03-04 | 🔄 GitHub Actions CI/CD 多平台构建 | ✅ 已发布 |
| **v3.5.0** | 2026-03-04 | ⚡ 虚拟列表性能优化 | ✅ 已发布 |
| **v3.4.0** | 2026-03-04 | ⌨️ 快捷键帮助对话框 | ✅ 已发布 |
| **v3.3.0** | 2026-03-04 | 📤 会话导出 (MD/JSON/TXT) | ✅ 已发布 |
| **v3.2.0** | 2026-03-04 | 🔍 消息内容搜索 + 高亮 | ✅ 已发布 |
| **v3.1.0** | 2026-03-04 | ⌨️ 快捷键 + 🖥️ 跨平台 | ✅ 已发布 |
| **v3.0.2** | 2026-03-04 | 🔄 自动更新功能 | ✅ 已发布 |
| **v3.0.1** | 2026-03-04 | 🔍 搜索功能 + ⚡ 性能优化 | ✅ 已发布 |
| **v3.0.0** | 2026-03-04 | 🎉 Tauri + FastAPI 重构 | ✅ 已发布 |

## BUG 清单

### 当前无 BUG
- **严重**: 无
- **中等**: 无
- **轻微**: 无

## Open Questions
- 截图/视频完成后，选择 Product Hunt 发布日期？
- 下一个要开发的功能是什么？
- App.tsx 覆盖率提升遇到瓶颈（58.75%），内部处理函数需要 E2E 测试或组件 refactoring 才能完全覆盖

## Product Hunt 准备清单
- [x] 产品信息 (Tagline, 描述)
- [x] 社交媒体文案
- [x] 截图指南 (`docs/SCREENSHOT_DEMO_GUIDE.md`)
- [x] 演示视频脚本
- [x] **GitHub README 更新** (本次完成)
- [x] **社区推广内容** (`docs/COMMUNITY_PROMOTION.md`)
- [ ] 实际截图 (5 张) - **需要用户手动完成**
- [ ] 演示视频 (60 秒) - **需要用户手动完成**
- [ ] Maker 按钮准备
- [ ] 发布日社区推广
