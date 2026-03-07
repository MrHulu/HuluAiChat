# 🍵 HuluChat

> **极简、跨平台 AI 聊天桌面应用**
> 支持 GPT-4、Claude、Gemini、DeepSeek 等多模型快速切换，RAG 智能问答，插件系统，会话分组管理，18 种语言界面

[![GitHub release](https://img.shields.io/github/v/release/MrHulu/HuluChat?style=flat-square)](https://github.com/MrHulu/HuluChat/releases)
[![GitHub stars](https://img.shields.io/github/stars/MrHulu/HuluChat?style=flat-square&logo=github&color=yellow)](https://github.com/MrHulu/HuluChat/stargazers)
[![GitHub downloads](https://img.shields.io/github/downloads/MrHulu/HuluChat/total?style=flat-square&logo=github&color=blue)](https://github.com/MrHulu/HuluChat/releases)
[![GitHub issues](https://img.shields.io/github/issues/MrHulu/HuluChat?style=flat-square&logo=github)](https://github.com/MrHulu/HuluChat/issues)
[![License](https://img.shields.io/github/license/MrHulu/HuluChat?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)](https://github.com/MrHulu/HuluChat/releases)

[English](README_EN.md) | 中文

---

## ✨ 功能亮点

### 🤖 多模型支持
一键切换 GPT-4、Claude、Gemini、DeepSeek 等 OpenAI 兼容 API，无需切换应用。

### 🧠 RAG 智能问答
上传文档进行智能问答，基于检索增强生成技术，让 AI 理解你的私有知识。

### 🔌 插件系统
可扩展的插件架构，安装官方或第三方插件增强功能。

### 📁 会话分组管理
用文件夹整理你的对话历史，保持井井有条。

### 🔍 全局搜索
快速搜索所有对话内容，支持实时高亮匹配。

### 📤 多格式导出
支持 Markdown、JSON、TXT 三种格式导出，便于备份与分享。

### ⌨️ 高效快捷键
完整的键盘快捷键支持，让你的操作更高效。

### 🌙 深色模式
精心设计的深色主题，保护你的眼睛。

### 🌐 多语言支持
支持 18 种语言界面：English、中文、日本語、한국어、Español、Français、Deutsch、Português、Italiano、Русский、العربية、Nederlands、Polski、Türkçe、हिन्दी、Tiếng Việt、ไทย、Bahasa Indonesia

### ⚡ 自动更新
永远保持最新版本，无需手动下载。

---

## 📸 应用截图

<!-- 截图占位符 - 需要用户手动添加实际截图 -->

| 主界面 | 会话分组 | 模型切换 |
|:---:|:---:|:---:|
| ![主界面](docs/screenshots/01-hero-main-interface.png) | ![文件夹](docs/screenshots/02-session-folders.png) | ![模型切换](docs/screenshots/03-model-switching.png) |

| 搜索功能 | 导出选项 |
|:---:|:---:|
| ![搜索](docs/screenshots/04-search-feature.png) | ![导出](docs/screenshots/05-export-feature.png) |

---

## 🚀 快速开始

### 下载安装

前往 [Releases](https://github.com/MrHulu/HuluChat/releases) 页面下载最新版本：

| 平台 | 格式 | 说明 |
|------|------|------|
| **Windows** | `.msi` / `.exe` | 安装器或便携版 |
| **macOS** | `.dmg` | Intel 和 Apple Silicon |
| **Linux** | `.AppImage` / `.deb` | 通用格式 |

### 首次使用

1. 启动应用后，点击**设置**图标
2. 添加你的 API 配置：
   - **Base URL**: API 端点（如 `https://api.openai.com/v1`）
   - **API Key**: 你的密钥
   - **Model ID**: 模型名称（如 `gpt-4o`）
3. 开始对话！

### API 配置示例

| Provider | Base URL | Model ID |
|----------|----------|----------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| Anthropic | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-chat` ⭐ 默认推荐 |
| Google AI | `https://generativelanguage.googleapis.com/v1beta` | `gemini-2.0-flash` |
| Moonshot | `https://api.moonshot.cn/v1` | `moonshot-v1-8k` |
| 本地模型 | `http://localhost:11434/v1` | `llama3` |

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建会话 |
| `Ctrl/Cmd + B` | 切换侧边栏 |
| `Ctrl/Cmd + K` | 打开搜索 |
| `Ctrl/Cmd + ,` | 打开设置 |
| `Ctrl/Cmd + /` | 显示快捷键帮助 |
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| **桌面框架** | Tauri 2.0 (Rust + 系统 WebView) |
| **前端** | React 19 + TypeScript |
| **样式** | Tailwind CSS 4 + shadcn/ui |
| **后端** | FastAPI (Python) |
| **数据库** | SQLite |
| **通信** | HTTP REST + WebSocket |
| **测试** | Vitest + React Testing Library (94% 覆盖率) |

---

## 🔧 开发指南

### 环境要求

- Node.js 18+
- Python 3.10+
- Rust (Tauri CLI)
- pnpm / npm

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/MrHulu/HuluChat.git
cd HuluChat/huluchat-v3

# 安装依赖
npm install

# 安装 Python 依赖
pip install -r ../requirements.txt

# 启动开发环境
npm run tauri dev
```

### 构建

```bash
# 构建生产版本
npm run tauri build
```

### 测试

```bash
# 运行测试
npm run test:run

# 查看覆盖率
npm run test:coverage
```

---

## 📁 项目结构

```
huluchat-v3/
├── src/                    # React 前端源码
│   ├── components/         # UI 组件
│   │   ├── chat/          # 聊天相关组件
│   │   ├── sidebar/       # 侧边栏组件
│   │   ├── settings/      # 设置对话框
│   │   ├── keyboard/      # 快捷键帮助
│   │   └── ui/            # shadcn/ui 基础组件
│   ├── hooks/             # React Hooks
│   ├── api/               # API 客户端
│   └── lib/               # 工具函数
├── src-tauri/             # Tauri/Rust 后端
├── backend/               # FastAPI Python 后端
└── docs/                  # 文档
```

---

## 📋 更新日志

查看完整更新日志：[Releases](https://github.com/MrHulu/HuluChat/releases)

### 最新版本 v3.51.0 (2026-03-07)

- 📤 **书签导出** - 支持 Markdown + JSON 格式导出
- 🏷️ **会话标签** - 为会话添加标签，按标签筛选
- 📑 **消息书签** - 标记重要消息，快速跳转
- ⌨️ **快捷键增强** - Ctrl+1/2/3 快速切换最近会话
- 🎯 **智能引导** - 新用户 3 步引导系统
- 🧠 **RAG 智能问答** - 上传文档进行智能对话
- 🔌 **插件系统** - 可扩展的插件架构
- 🤖 **DeepSeek 默认模型** - 高性价比 AI 模型

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 许可证

[MIT License](LICENSE)

---

## 📊 项目指标

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=MrHulu/HuluChat&type=Date)](https://www.star-history.com/#MrHulu/HuluChat&Date)

### 贡献者

感谢所有为 HuluChat 做出贡献的开发者！

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

欢迎[加入贡献者行列](CONTRIBUTING.md)！

---

## 🙏 致谢

- [Tauri](https://tauri.app/) - 现代桌面应用框架
- [shadcn/ui](https://ui.shadcn.com/) - 精美的 React 组件库
- [FastAPI](https://fastapi.tiangolo.com/) - 高性能 Python 后端框架
- [Lucide Icons](https://lucide.dev/) - 美观的图标库

---

<p align="center">
  <sub>🍵 HuluChat — 极简、跨平台、多模型的 AI 聊天桌面应用</sub>
</p>

<p align="center">
  <a href="https://github.com/MrHulu/HuluChat/releases">下载</a> ·
  <a href="https://github.com/MrHulu/HuluChat/issues">反馈</a> ·
  <a href="https://github.com/MrHulu/HuluChat/stargazers">Star ⭐</a>
</p>
