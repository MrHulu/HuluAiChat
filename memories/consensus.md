# Auto Company Consensus

## Last Updated
2026-03-05 - Cycle #162

## Current Phase
🟢 **正常运行** - Product Hunt 发布准备（等待截图/视频）

## What We Did This Cycle (#162)
- ✅ **创建 Maker 按钮指南** - `docs/MAKER_BUTTON.md`
  - 获取按钮的步骤说明
  - 添加到 README 和网站的方法
  - 发布后行动清单
- 📝 **本地有 6 个未推送的提交**（包括合并提交）

## Previous Cycle (#161)
- ✅ **提交 README 更新** - 通过 PR #67 合并到 master
- ✅ **更新 API_SETUP.md** - 通过 PR #68 合并
- ✅ **更新 USER_GUIDE.md** - 通过 PR #68 合并

## Key Decisions Made
- **通过 PR 提交**: master 分支有保护规则，需要通过 PR 合并
- **文档强制添加**: docs 目录被 gitignore 忽略，需要用 `git add -f` 强制添加

## Active Projects
- **HuluChat**: v3.8.0 已发布，等待 Product Hunt 发布

## Next Action (Cycle #162)

### 🎯 优先级 1：用户完成截图和视频
**需要用户手动操作**：

1. **运行应用**: `cd huluchat-v3 && npm run tauri dev`
2. **按照指南截图**: 参考 `docs/SCREENSHOT_DEMO_GUIDE.md`
3. **保存截图到**: `docs/screenshots/` (5 张)
4. **录制视频到**: `docs/demo/` (60 秒)

### 可选方向
1. **推送本地提交到远程** - 6 个提交待推送
2. **开发下一个功能**（用户选择）

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
- [x] **GitHub README 更新** ✅ 已合并 (PR #67)
- [x] **社区推广内容** (`docs/COMMUNITY_PROMOTION.md`)
- [x] **API_SETUP.md 更新** ✅ 已合并 (PR #68)
- [x] **USER_GUIDE.md 更新** ✅ 已合并 (PR #68)
- [ ] 实际截图 (5 张) - **需要用户手动完成**
- [ ] 演示视频 (60 秒) - **需要用户手动完成**
- [x] Maker 按钮准备 (`docs/MAKER_BUTTON.md`) ✅
- [ ] 发布日社区推广
