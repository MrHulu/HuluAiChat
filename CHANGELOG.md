# Changelog

All notable changes to HuluChat will be documented in this file.

## [1.2.9] - 2025-03-01

### 🔧 Fixes

- Fixed duplicate code in QuickSwitcher dialog that caused IndentationError
- Cleaned up redundant initialization code

## [1.2.8] - 2025-03-01

### ✨ Features

- **Message Timestamp Display**: Smart timestamp formatting below messages
  - Today: HH:MM (e.g., 14:30)
  - This week: 周X HH:MM (e.g., 周五 14:30)
  - Older: MM-DD HH:MM (e.g., 02-25 14:30)

## [1.2.7] - 2025-03-01

### ✨ Features

- **Shift+Click Range Selection**: Select multiple messages in range
- Anchor tracking for efficient range selection

## [1.2.6] - 2025-03-01

### ✨ Features

- **Selection Keyboard Shortcuts**:
  - `Ctrl+A` - Select all messages (in selection mode)
  - `ESC` - Exit selection mode

## [1.2.5] - 2025-03-01

### ✨ Features

- **Message Selection Mode**: Toggle selection mode with checkbox button
- **Batch Operations**: Copy/Export selected messages
- Visual feedback with checkboxes on selected messages

## [1.2.4] - 2025-03-01

### ✨ Features

- **Message Number Display**: Visual #N label above each message
- Complements Ctrl+G "go to message by number" feature

## [1.2.3] - 2025-03-01

### ✨ Features

- **Message Navigation Shortcuts**:
  - `Ctrl+Home` - Jump to first message
  - `Ctrl+End` - Jump to last message
  - `Ctrl+G` - Go to message by number (with dialog)
  - `Alt+Up` - Previous message
  - `Alt+Down` - Next message

## [1.2.2] - 2025-03-01

### ✨ Features

- **TXT Export**: Plain text export format with Chinese role indicators
- **Batch Export**: Export multiple sessions at once

## [1.2.1] - 2025-03-01

### ✨ Features

- **Search Date Range Filters**: Filter messages by start/end date
- Date picker UI for easy date selection

## [1.2.0] - 2025-03-01

### ✨ Features

- **Message Quote/Reply**: Reply to messages with quote context
- Quote preview bar above input area
- Visual quote display in chat area (gray box with 💬 icon)

## [1.1.9] - 2025-03-01

### ✨ Features

- **Ctrl+Tab Quick Switcher**: Browser/IDE-style session switching
- Modal popup with search and keyboard navigation
- `Ctrl+Shift+Tab` for previous session

## [1.1.8] - 2025-03-01

### ✨ Features

- **Search Result Counter**: Shows "X/Y" format (current/total matches)
- Auto-hides when no search is active

## [1.1.7] - 2025-03-01

### ✨ Features

- **Session Navigation Shortcuts**:
  - `Ctrl+Up` - Previous session
  - `Ctrl+Down` - Next session
- Circular navigation (wraps around at boundaries)

## [1.1.6] - 2025-03-01

### ✨ Features

- **Ctrl+Shift+C**: Copy last AI response to clipboard

## [1.1.5] - 2025-03-01

### ✨ Features

- **Ctrl+P**: Toggle session pin status

## [1.1.4] - 2025-03-01

### ✨ Features

- **Session Pinning**: Pin important sessions to top of sidebar
- Visual indicator with 📌/📍 icons

## [1.1.3] - 2025-03-01

### ✨ Features

- **Message Counts in Sidebar**: Shows number of messages per session
- Subtle gray number next to session title

## [1.1.2] - 2025-03-01

### ✨ Features

- **Recent Searches Dropdown**: Search history in dropdown
- Stores last 10 search queries

## [1.1.1] - 2025-03-01

### ✨ Features

- **Message Deletion**: Delete individual messages with confirmation
- 🗑️ button added to message actions

## [1.1.0] - 2025-03-01

### 🔧 Fixes

- Fixed template dialog bug where confirmation was ignored
- Properly handle "restore defaults" confirmation

## [1.0.9] - 2025-03-01

### ✨ Features

- **DOCX Export**: Export conversations to Word format (.docx)

## [1.0.8] - 2025-03-01

### ✨ Features

- **Message Editing**: Edit both user and assistant messages
- Modal edit dialog with save/cancel buttons
- ✏️ button added to message actions

## [1.0.7] - 2025-03-01

### ✨ Features

- **HTML Export**: Styled, responsive HTML export
- **PDF Improvements**: Unicode fallback support for better compatibility

## [1.0.6] - 2025-03-01

### ✨ Features

- **PDF Export**: Export conversations to PDF format
- PDF option in export dialog

## [1.0.5] - 2025-03-01

### ✨ Features

- **29 New Tests**: Improved test coverage
- 11 modules now at 100% coverage

## [1.0.4] - 2025-03-01

### ✨ Features

- **Test Coverage Improvements**: 40% → 46% overall coverage

## [1.0.3] - 2025-03-01

### ✨ Features

- **Keyboard Shortcuts Enhanced**:
  - `Ctrl+R` - Regenerate last assistant response
  - `Ctrl+T` - Toggle sidebar collapse/expand
  - `Ctrl+,` - Open settings dialog
  - Updated help dialog with all shortcuts

### 📝 Notes

- Added regenerate response functionality to UI (was available in AppService but not exposed)
- Improved keyboard workflow for power users

## [1.0.2] - 2025-03-01

### 🔧 Fixes

- Fixed macOS PyInstaller build (onedir mode, removed target_arch)
- Fixed Linux AppImage build (ARCH env variable)
- Fixed Linux icon display (copy to AppDir root)
- Fixed macOS release upload (zip .app bundle)
- All 3 platforms (Windows, macOS, Linux) now build successfully

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
