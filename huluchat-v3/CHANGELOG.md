# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.9.0] - 2026-03-06

### Added
- **Ollama Local Model Support**: Run AI models locally with Ollama
  - Cloud/Local model grouping in ModelSelector
  - Real-time Ollama connection status indicator
  - Ollama configuration in Settings dialog
  - Support for any Ollama-compatible model

### Components
- `OllamaStatus`: New status indicator component
- `ModelSelector`: Extended with Cloud/Local grouping
- `SettingsDialog`: Added Ollama configuration section

### Technical
- `backend/services/ollama_service.py`: Ollama API service
- Backend tests: 18 new tests for Ollama service
- Frontend tests: Extended coverage for new components

## [3.8.0] - 2026-03-04

### Added
- **Model Quick Switch**: Fast switching between AI models
  - Keyboard shortcut for model selection
  - Recently used models at top

## [3.6.0] - 2026-03-04

### Added
- **GitHub Actions CI/CD**: Automated multi-platform builds and releases
  - CI workflow for PR/push validation (typecheck, lint, build)
  - Release workflow for tag-triggered deployments
  - Multi-platform support: macOS (Intel & Apple Silicon), Windows, Linux

### Technical
- `ci.yml`: Frontend & backend testing, Tauri build verification
- `release.yml`: PyInstaller backend packaging, Tauri app bundling
- Auto-generated `latest.json` for in-app updates
- Platform-specific build optimizations and caching

## [3.5.0] - 2026-03-04

### Added
- **Virtual List**: Performance optimization for long conversations
  - @tanstack/react-virtual integration
  - Dynamic height estimation and measurement
  - Smooth scrolling with overscan for better UX

## [3.4.0] - 2026-03-04

### Added
- **Keyboard Shortcuts Help Dialog**: Press `?` to view all shortcuts

## [3.3.0] - 2026-03-04

### Added
- **Session Export**: Export conversations to Markdown, JSON, or TXT

## [3.2.0] - 2026-03-04

### Added
- **Message Search**: Search within conversation content with highlighting

## [3.1.0] - 2026-03-04

### Added
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Cross-platform**: macOS, Windows, Linux support

## [3.0.2] - 2026-03-04

### Added
- **Auto Update**: In-app update notification and installation

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
