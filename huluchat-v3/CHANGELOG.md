# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [3.50.0] - 2026-03-07

### Added
- **Session Tags**: Organize conversations with custom tags
  - Add/remove tags to any session
  - Filter sessions by tag in sidebar
  - TagInput component with autocomplete
  - TagFilter component for quick filtering

- **Message Bookmarks**: Mark important messages for quick access
  - Bookmark any message in a conversation
  - BookmarkPanel shows all bookmarks in current session
  - Click bookmark to scroll to message with highlight effect
  - Hover on message to reveal bookmark button

### Components
- `SessionTag`: Tag display component with delete support
- `TagInput`: Tag input with autocomplete suggestions
- `TagFilter`: Tag filter buttons for session list
- `BookmarkButton`: Toggle bookmark on messages
- `BookmarkPanel`: List bookmarks with jump-to-message

### Backend
- `SessionTagModel`: SQLite model for session tags
- `MessageBookmarkModel`: SQLite model for message bookmarks
- REST API endpoints for tags and bookmarks CRUD

### Technical
- 24 new tests for tags and bookmarks components
- i18n translations for EN/ZH
- Database migration for new tables

## [3.49.0] - 2026-03-07

### Added
- **Session Quick Switch**: Fast switching between recent sessions
  - Ctrl+1/2/3 to switch to 3 most recent sessions
  - Visual feedback on shortcut press
  - Works globally in app

### Technical
- Extended `useKeyboardShortcuts` hook with `onSwitchSession` callback
- i18n translations for EN/ZH
- 8 new test cases for keyboard shortcuts

## [3.48.0] - 2026-03-07

### Added
- **Welcome Guide System**: First-time user onboarding experience
  - 3-step interactive welcome dialog
  - Introduces core features: AI Chat, RAG, and Plugins
  - "Skip" and "Get Started" options
  - Only shown once (stored in localStorage)
  - Prepared for Product Hunt launch

### Components
- `WelcomeDialog`: Interactive welcome guide component
  - Step indicator with progress dots
  - Step navigation (Next/Skip)
  - Completion callback for tracking

### i18n
- Added welcome translations for EN/ZH:
  - `welcome.step1.title/description`: Welcome message
  - `welcome.step2.title/description`: RAG feature introduction
  - `welcome.step3.title/description`: Plugin system introduction
  - `welcome.skip/next/getStarted`: Navigation buttons

### Technical
- Tests: WelcomeDialog unit tests with mocked i18n
- localStorage key: `huluchat-welcome-shown`
- Version bump to 3.48.0

## [3.47.0] - 2026-03-07

### Improved
- **UX Enhancements**: Better user experience across the app
  - Auto-focus input after message sent
  - Auto-focus input when switching sessions
  - Loading indicator on send button during message sending
  - Empty state guidance for new conversations
  - Search loading indicator in session list
  - Keyboard shortcut hint for message editing (Ctrl+Enter to save)

### Components
- `ChatInput`: Auto-focus behavior, loading state on send button
- `MessageList`: Empty state with guidance message
- `SessionList`: Search loading spinner
- `MessageItem`: Keyboard shortcut hint for edit mode

### Technical
- Tests: Full coverage for auto-focus and loading states
- i18n: All new UI strings translated (EN/ZH)

## [3.46.0] - 2026-03-07

### Added
- **DeepSeek Default Model**: DeepSeek V3 as default AI model option
  - Provider routing for model selection
  - Updated model list with DeepSeek first

- **RAG Document Chat (Experimental)**: Chat with uploaded documents
  - Single document upload support
  - Supported formats: TXT, MD, PDF
  - Semantic search with OpenAI embeddings
  - In-chat document context integration
  - Document management panel

### Components
- `RAGPanel`: Document upload and management panel
- `DocumentUploader`: Drag-and-drop file upload component
- `DocumentList`: Uploaded documents list with delete support

### Technical
- Backend: Chroma vector store integration
- Backend: OpenAI text-embedding-3-small for embeddings
- Backend: Recursive character text chunking (500 chars)
- Frontend: 32 new tests for RAG components
- i18n: Full RAG translations (EN/ZH)

## [3.41.0] - 2026-03-07

### Added
- **Voice Input**: Speech-to-text for message input
  - Web Speech API integration (browser native)
  - Microphone button in chat input
  - Auto-detects browser support
  - Follows current language setting for recognition

### Components
- `VoiceInputButton`: Voice recording button component
- `useVoiceRecognition`: Custom hook for Web Speech API

### Technical
- 4 new tests for VoiceInputButton component
- i18n support for voice feature (EN/ZH)

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
