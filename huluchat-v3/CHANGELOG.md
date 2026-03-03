# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.0.1] - 2026-03-04

### Added
- **Session Search**: Real-time search/filter for conversation list
  - Search input in sidebar above session list
  - Clear button to reset search
  - Friendly "no results" message

### Changed
- **Performance**: 55% bundle size reduction through code splitting
  - Lazy loading for SettingsDialog
  - Lazy loading for highlight.js syntax highlighting
  - Optimized chunk splitting (markdown/radix/icons/utils)

### Technical
- Version updated to 3.0.1 across all config files
- Display version number in app header

## [3.0.0] - 2026-03-04

### Added
- **Complete Rewrite**: Tauri 2.0 + React 19 + FastAPI architecture
  - Native desktop app with system WebView
  - Modern React frontend with TypeScript
  - Python FastAPI backend as Sidecar

### Features
- Multi-model chat support (OpenAI, Claude, Gemini, etc.)
- Conversation management with SQLite persistence
- Dark/Light theme with system detection
- Markdown rendering with syntax highlighting
- Streaming responses
- API key management with secure storage

### Tech Stack
- Frontend: React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- Desktop: Tauri 2.0 (Rust)
- Backend: FastAPI, Python 3.14
- Database: SQLite

---

For older versions (v2.x CustomTkinter), see GitHub releases.
