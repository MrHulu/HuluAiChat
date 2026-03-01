# Changelog

All notable changes to HuluChat will be documented in this file.

## [1.0.0-beta] - 2025-03-01

### ✨ Features

- **Multi-model Support**: Connect to any OpenAI-compatible API with custom Base URL, API Key, and Model ID
- **Streaming Chat**: Real-time streaming responses for smooth conversation experience
- **Local Persistence**: SQLite database for sessions and messages, stored in user directory
- **Theme System**: Light/dark theme with sidebar toggle
- **Session Management**: Create, rename, delete sessions with auto-generated titles
- **Search**: In-session search with F3/Shift+F3 navigation and visual highlighting
- **Markdown Rendering**: Rich markdown display for assistant messages
- **Export**: Export conversations to Markdown files
- **Copy Messages**: One-click copy for any message with toast notification
- **Keyboard Shortcuts**: Ctrl+F (search), Ctrl+Enter (send), F3/Shift+F3 (navigate), Escape (close)

### 🏗️ Architecture

- **Clean Architecture**: UI → App → Infrastructure layers
- **Modular Design**: Separate packages for chat, config, persistence, and UI
- **Cross-platform**: Works on Windows, Linux, macOS with proper app data directories

### 📦 Distribution

- PyInstaller spec for single-file Windows exe build
- User data stored in `%APPDATA%/HuluChat` (Windows), `~/.config/HuluChat` (Linux), `~/Library/Application Support/HuluChat` (macOS)

### 🧪 Testing

- 75 tests covering core functionality
- Modules: config, persistence (session/message repos), app service, search UX

## [0.1.0] - 2025-02-20

### Initial Release

- Basic chat functionality
- Session and message persistence
- Theme switching
- Sidebar management
