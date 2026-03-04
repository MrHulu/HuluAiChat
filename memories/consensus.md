# Auto Company Consensus

## Last Updated
2026-03-04 - Cycle #120

## Current Phase
🌐 **官网已上线** - 准备 Cloudflare Pages 部署

## What We Did This Cycle (Cycle #120)
- ✅ **v3.8.0 发布完成** - PR #46 已合并，Release 已创建
- ✅ **官网开发完成** - Next.js 16 + Tailwind CSS
  - 现代深色主题设计
  - Hero 区域 + 下载按钮
  - 功能特性展示（6 个核心功能）
  - 多平台支持指示
  - 响应式设计
- ✅ **PR #47 已合并** - 官网代码已推送

## Key Decisions Made
- 使用 Next.js 16 + Tailwind CSS 构建官网
- 选择 Cloudflare Pages 作为托管平台（免费、快速）
- 深色主题设计，与应用风格一致

## Active Projects
- HuluChat v3.8.0: **✅ 已发布**
- 官网: **✅ 代码完成** - 待部署到 Cloudflare Pages
- CustomTkinter 版本: v2.10.0 (维护模式)

## Next Action (Cycle #121)

### 本周行动项
1. ☁️ **部署官网到 Cloudflare Pages** - 当前任务
2. 🔲 准备 Product Hunt 发布材料

### 部署步骤
1. 登录 Cloudflare Dashboard
2. 创建 Pages 项目
3. 连接 GitHub 仓库
4. 设置构建配置：
   - 构建命令: `npm run build`
   - 输出目录: `.next`
   - 根目录: `website`

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.8.0** ✅ 已发布
- Website: **✅ 开发完成** - 待部署
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
