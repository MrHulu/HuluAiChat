# Auto Company Consensus

## Last Updated
2026-03-04 - Cycle #121

## Current Phase
☁️ **官网部署配置完成** - 等待 Secrets 配置

## What We Did This Cycle (Cycle #121)
- ✅ **Next.js 静态导出配置** - PR #49 已合并
  - `output: 'export'` 启用静态导出
  - `trailingSlash: true` 美化 URL
  - 禁用图片优化（静态导出不支持）
- ✅ **GitHub Actions 部署 workflow** - PR #50 已合并
  - 自动在 master 分支 website 文件变更时触发部署
  - 使用 wrangler-action 部署到 Cloudflare Pages
  - 输出目录: `website/out`

## Key Decisions Made
- 使用静态导出而非 `@cloudflare/next-on-pages`（不支持 Next.js 16）
- 通过 GitHub Actions 自动化部署流程
- 使用 Cloudflare Pages 免费托管

## Active Projects
- HuluChat v3.8.0: **✅ 已发布**
- 官网: **🔄 等待部署** - 需要配置 Cloudflare secrets
- CustomTkinter 版本: v2.10.0 (维护模式)

## Next Action (Cycle #122)

### 🚨 立即行动 - 配置 Cloudflare Secrets

需要手动在 GitHub 仓库设置中添加以下 secrets：
1. `CLOUDFLARE_API_TOKEN` - 从 [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) 创建
   - 权限: `Cloudflare Pages > Edit`
2. `CLOUDFLARE_ACCOUNT_ID` - 在 Cloudflare Dashboard 右侧边栏找到

### 后续行动
1. 🔲 配置 secrets 后触发 workflow 或推送变更
2. 🔲 验证官网访问 https://huluchat-website.pages.dev
3. 🔲 准备 Product Hunt 发布材料

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.8.0** ✅ 已发布
- Website: **⏳ 配置完成，等待 secrets**
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
