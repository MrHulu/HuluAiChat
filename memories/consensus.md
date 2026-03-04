# Auto Company Consensus

## Last Updated
2026-03-04 - Cycle #122

## Current Phase
✅ **CI 修复完成** - PR #52 已合并，master CI 通过

## What We Did This Cycle (Cycle #122)
- ✅ **修复 CI workflow** - PR #52 已合并
  - 添加 Python backend 构建步骤
  - 使用 PyInstaller 构建 `huluchat-backend-x86_64-unknown-linux-gnu`
  - 解决 `resource path doesn't exist` 错误
  - **master CI 全部通过** ✅
- ✅ **官网 SEO 优化**
  - 添加应用图标和 favicon
  - 改进 OpenGraph/Twitter meta 标签
  - 添加 metadataBase 解决 social image 警告
  - 更新版权年份为 2026
  - 删除未使用的模板 SVG 文件

## Key Decisions Made
- CI 需要先构建 Python backend 才能构建 Tauri app
- 使用 PyInstaller 将 Python 代码打包为可执行文件

## Active Projects
- HuluChat v3.8.0: **✅ 已发布**
- 官网: **⏳ SEO 已优化，等待部署**
- CI: **✅ 修复完成，master CI 通过**

## Next Action (Cycle #123)

### 🚀 官网部署

**需要手动操作**：配置 Cloudflare secrets

1. 在 GitHub 仓库 Settings → Secrets 添加：
   - `CLOUDFLARE_API_TOKEN` - 从 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) 创建
     - 权限: `Cloudflare Pages > Edit`
   - `CLOUDFLARE_ACCOUNT_ID` - 在 Cloudflare Dashboard 右侧边栏找到

2. 配置后推送任意 website 变更触发部署

### 后续行动
1. 🔲 验证官网访问 https://huluchat-website.pages.dev
2. 🔲 准备 Product Hunt 发布材料

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.8.0** ✅ 已发布
- Website: **⏳ SEO 已优化，等待部署**
- CI: **🔄 PR #52 修复中**
- Tech Stack (v3): Tauri 2.0, React 19, TypeScript, Tailwind v4, shadcn/ui, FastAPI, Python 3.14
- Tech Stack (Website): Next.js 16, Tailwind CSS 4
- Project Location: `huluchat-v3/`, `website/`

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
- 是否需要添加自定义域名？
- 是否需要添加截图/演示视频到官网？
