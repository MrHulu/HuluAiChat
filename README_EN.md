# 🍵 HuluChat

> **Minimal, Cross-Platform AI Chat Desktop App**
> Quick model switching between GPT-4, Claude, Gemini, organized folder management, and 18 languages

English | [中文](README.md)

---

## ✨ Features

### 🤖 Multi-Model Support
One-click switching between GPT-4, Claude, Gemini and other OpenAI-compatible APIs.

### 📁 Session Folders
Organize your chat history with folders to keep everything tidy.

### 🔍 Global Search
Quickly search through all your conversations with real-time highlighting.

### 📤 Multi-Format Export
Export to Markdown, JSON, or TXT for easy backup and sharing.

### ⌨️ Efficient Shortcuts
Full keyboard shortcut support for faster workflow.

### 🌙 Dark Mode
Carefully designed dark theme to protect your eyes.

### 🌐 Multi-Language Support
18 languages: English, 中文, 日本語, 한국어, Español, Français, Deutsch, Português, Italiano, Русский, العربية, Nederlands, Polski, Türkçe, हिन्दी, Tiếng Việt, ไทย, Bahasa Indonesia

### ⚡ Auto-Update
Always stay up to date without manual downloads.

---

## 📸 Screenshots

<!-- Screenshot placeholders - User needs to add actual screenshots -->

| Main Interface | Session Folders | Model Switching |
|:---:|:---:|:---:|
| ![Main](docs/screenshots/01-hero-main-interface.png) | ![Folders](docs/screenshots/02-session-folders.png) | ![Models](docs/screenshots/03-model-switching.png) |

| Search | Export |
|:---:|:---:|
| ![Search](docs/screenshots/04-search-feature.png) | ![Export](docs/screenshots/05-export-feature.png) |

---

## 🚀 Quick Start

### Download

Visit the [Releases](https://github.com/MrHulu/HuluChat/releases) page:

| Platform | Format | Notes |
|----------|--------|-------|
| **Windows** | `.msi` / `.exe` | Installer or portable |
| **macOS** | `.dmg` | Intel & Apple Silicon |
| **Linux** | `.AppImage` / `.deb` | Universal formats |

### First Run

1. Launch the app and click the **Settings** icon
2. Add your API configuration:
   - **Base URL**: API endpoint (e.g., `https://api.openai.com/v1`)
   - **API Key**: Your key
   - **Model ID**: Model name (e.g., `gpt-4o`)
3. Start chatting!

### API Configuration Examples

| Provider | Base URL | Model ID |
|----------|----------|----------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o`, `gpt-4o-mini` |
| Anthropic | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| Google AI | `https://generativelanguage.googleapis.com/v1beta` | `gemini-2.0-flash` |
| Local Model | `http://localhost:11434/v1` | `llama3` |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New session |
| `Ctrl/Cmd + B` | Toggle sidebar |
| `Ctrl/Cmd + K` | Open search |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + /` | Show shortcut help |
| `Enter` | Send message |
| `Shift + Enter` | New line |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Desktop Framework** | Tauri 2.0 (Rust + System WebView) |
| **Frontend** | React 19 + TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Backend** | FastAPI (Python) |
| **Database** | SQLite |
| **Communication** | HTTP REST + WebSocket |
| **Testing** | Vitest + React Testing Library (94% coverage) |

---

## 🔧 Development

### Requirements

- Node.js 18+
- Python 3.10+
- Rust (Tauri CLI)
- pnpm / npm

### Local Development

```bash
# Clone the repo
git clone https://github.com/MrHulu/HuluChat.git
cd HuluChat/huluchat-v3

# Install dependencies
npm install

# Install Python dependencies
pip install -r ../requirements.txt

# Start dev environment
npm run tauri dev
```

### Build

```bash
# Build for production
npm run tauri build
```

### Testing

```bash
# Run tests
npm run test:run

# View coverage
npm run test:coverage
```

---

## 📁 Project Structure

```
huluchat-v3/
├── src/                    # React frontend source
│   ├── components/         # UI components
│   │   ├── chat/          # Chat-related components
│   │   ├── sidebar/       # Sidebar components
│   │   ├── settings/      # Settings dialog
│   │   ├── keyboard/      # Shortcut help
│   │   └── ui/            # shadcn/ui base components
│   ├── hooks/             # React Hooks
│   ├── api/               # API client
│   └── lib/               # Utility functions
├── src-tauri/             # Tauri/Rust backend
├── backend/               # FastAPI Python backend
└── docs/                  # Documentation
```

---

## 📋 Changelog

See full changelog: [docs/changelog.md](docs/changelog.md)

### Latest v3.22.0 (2026-03-06)

- 🌐 18 languages - Covers 65% of global users
- ⚡ i18n lazy loading - 94% smaller initial load
- 🤖 Quick model switching - Switch between models in one click
- 📁 Session folders - Organize chats with folders
- 🔄 GitHub Actions CI/CD - Multi-platform builds
- ⚡ Virtual list optimization - Smooth scrolling with many messages
- ⌨️ Shortcut help - Press `/` or `?` to view
- 📤 Session export - MD/JSON/TXT support
- 🔍 Message search - Global search with highlighting

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

---

## 📄 License

[MIT License](LICENSE)

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Modern desktop app framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful React components
- [FastAPI](https://fastapi.tiangolo.com/) - High-performance Python backend
- [Lucide Icons](https://lucide.dev/) - Beautiful icons

---

<p align="center">
  <sub>🍵 HuluChat — Minimal, cross-platform, multi-model AI chat desktop app</sub>
</p>

<p align="center">
  <a href="https://github.com/MrHulu/HuluChat/releases">Download</a> ·
  <a href="https://github.com/MrHulu/HuluChat/issues">Feedback</a> ·
  <a href="https://github.com/MrHulu/HuluChat/stargazers">Star ⭐</a>
</p>
