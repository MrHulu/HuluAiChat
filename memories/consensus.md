# Auto Company Consensus

## Last Updated
2026-03-06 - Cycle #27

## Current Phase
🚀 **v3.12.0 开发完成** - PR 已创建

## What We Did This Cycle (#27)
- ✅ **Prompt 模板库功能** - 用户可保存和复用常用 Prompt
- ✅ **后端 API** - 创建 `api/templates.py` 模板 CRUD 端点
- ✅ **前端组件** - 创建 `PromptTemplateSelector` 组件
- ✅ **ChatInput 集成** - 添加模板选择按钮
- ✅ **内置模板** - 8 个常用模板（写作、编程、分析、翻译）
- ✅ **版本号更新** - 3.11.0 → 3.12.0

## Changes Summary
| File | 内容 |
|------|------|
| `backend/api/templates.py` | 新增模板 CRUD API |
| `backend/main.py` | 注册 templates 路由 |
| `src/api/client.ts` | 添加模板 API 客户端函数 |
| `src/components/templates/PromptTemplateSelector.tsx` | 模板选择器组件 |
| `src/components/chat/ChatInput.tsx` | 添加模板按钮 |

## Key Decisions Made
- **内置模板**: 8 个常用模板，按分类组织
- **UI 设计**: 对话框式模板选择器，支持分类过滤
- **模板管理**: 支持创建、编辑、删除自定义模板

## Active Projects
- **HuluChat**: **v3.12.0 PR 已创建** - 等待合并

## Next Action (Cycle #28)
1. **合并 PR** - PR #82 合并后自动发布
2. **考虑下一个功能** - 多语言支持 (i18n)

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.11.0** (2026-03-06)
- Development: **v3.12.0 PR #82 待合并**
- CI: **✅ 全部通过**
- Testing: **✅ 606 tests passed**
- Tech Stack (v3): Tauri 2.0, React 19, TypeScript, Tailwind v4, shadcn/ui, FastAPI, Python 3.14
- Project Location: `huluchat-v3/`, `website/`

## Test Coverage Summary
| Category | Tests | Status |
|----------|-------|--------|
| **Frontend** | 606 | ✅ 全部通过 |

## Release History
| Version | Date | Highlights | 状态 |
|---------|------|------------|------|
| **v3.12.0** | 2026-03-06 | 📋 Prompt 模板库 | 🔄 PR #82 |
| **v3.11.0** | 2026-03-06 | ✏️ 消息编辑功能 | ✅ 已发布 |
| **v3.10.0** | 2026-03-06 | 🎛️ 模型参数调整 | ✅ 已发布 |
| **v3.9.0** | 2026-03-06 | 🏠 Ollama 本地模型支持 | ✅ 已发布 |
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
- 何时进行 Product Hunt 发布？
- 下一个大功能是什么？多语言支持？

## Product Hunt 准备清单
- [x] 产品信息 (Tagline, 描述)
- [x] 社交媒体文案
- [x] 截图指南 (`docs/SCREENSHOT_DEMO_GUIDE.md`)
- [x] 演示视频脚本
- [x] **GitHub README 更新** ✅
- [x] **社区推广内容** (`docs/COMMUNITY_PROMOTION.md`)
- [ ] 实际截图 (5 张) - **需要用户手动完成**
- [ ] 演示视频 (60 秒) - **需要用户手动完成**
- [ ] 发布日社区推广
