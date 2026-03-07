# Changelog

All notable changes to HuluChat will be documented in this file.

## [3.47.0] - 2026-03-07

### ✨ Features

- **用户体验优化**: 提升聊天交互流畅度
  - **输入框自动聚焦**: 打开应用/发送消息后自动聚焦到输入框
  - **发送按钮 Loading 状态**: 发送消息时显示旋转图标和 "Sending..." 提示

### 🔧 Technical Details

- **ChatInput 组件**:
  - 添加 `useEffect` 实现自动聚焦逻辑
  - 新增 `isLoading` prop 控制按钮状态
  - 发送后保持输入焦点

### 🧪 Testing

- 前端：675 tests passed (31 files)
- TypeScript 检查通过
- ESLint 通过 (0 errors)

## [3.46.0] - 2026-03-07

### ✨ Features

- **DeepSeek 默认模型**: DeepSeek V3 作为新的默认 AI 模型选项
  - 高性价比、高性能的国产大模型
  - 在模型列表中排在首位
  - 支持 Provider 路由切换

- **RAG 单文档对话**: 上传文档进行基于内容的智能对话
  - 支持格式：TXT, MD, PDF
  - 一次性上传一个文档
  - 自动语义检索相关内容
  - 对话时显示引用来源
  - 简洁的上传界面和文档管理

### 🔧 Technical Details

- **RAG Pipeline**:
  - Chroma 嵌入式向量存储
  - OpenAI text-embedding-3-small 嵌入模型
  - 递归字符分块（500 字符）
  - 相似度检索

- **前端组件**:
  - `DocumentUploader`: 文档上传组件
  - `DocumentList`: 文档列表管理
  - `RAGPanel`: RAG 面板集成到 ChatView

### 🧪 Testing

- 后端：95 tests passed
- 前端：669 tests passed
- **总计：764 tests passed**

## [3.45.0] - 2026-03-07

### ✨ Features

- **插件管理 UI**: 完整的插件安装/卸载用户界面
  - 插件列表展示已安装插件
  - 一键卸载插件功能
  - 插件启用/禁用开关

## [3.44.0] - 2026-03-07

### ✨ Features

- **Tauri FS API 插件加载**: 使用 Tauri 文件系统 API 加载插件
  - 更安全的插件加载机制
  - 支持热重载

## [3.43.0] - 2026-03-07

### ✨ Features

- **插件系统**: 基础插件架构
  - 插件加载机制
  - 插件 API 接口
  - 插件生命周期管理

## [2.8.0] - 2026-03-03

### ✨ Features

- **Message Pagination**: Large sessions now load in pages for better performance
  - Automatically paginates sessions with more than 50 messages
  - Page navigation controls at the bottom (Previous/Next)
  - Shows message range: "📄 1-50 / 150 条消息"
  - Pagination resets when switching sessions
  - Sending new messages jumps to the last page
  - Disabled when using search or starred-only filters (shows all results)

### 🔧 Improvements

- Significantly improved performance for sessions with 100+ messages
- Reduced memory usage when loading large chat histories
- Faster UI rendering with fewer widgets created
- New `list_by_session_paginated()` method in MessageRepository
- New `load_messages_paginated()` method in AppService

### 🧪 Testing

- All 415 tests passing

## [2.7.0] - 2026-03-03

### ✨ Features

- **Custom Session Titles**: Rename your chat sessions for better organization
  - Double-click any session in the sidebar to rename it
  - Right-click context menu with "Rename" and "Delete" options
  - Clean dialog for editing session titles
  - Changes are saved immediately to the database
  - Perfect for organizing your conversations by topic

### 🔧 Improvements

- Better session management with custom titles
- More intuitive ways to organize your chat history
- Context menu provides quick access to session actions

### 🧪 Testing

- All tests passing

## [2.6.0] - 2026-03-03

### ✨ Features

- **Edit & Regenerate**: Edit user messages and optionally regenerate AI responses
  - Edit dialog now shows "🔄 Edit & Regenerate" checkbox when editing user messages with AI replies
  - When enabled, deletes the current AI response and generates a new one
  - Seamless workflow for refining prompts and getting improved responses
  - Edit dialog height adjusted from 400px to 450px to accommodate new option

### 🔧 Improvements

- Better UX for message editing workflow
- Checkbox only appears when editing user messages that have AI replies
- Hint text explains what will happen when regenerate is enabled

### 🧪 Testing

- All 415 tests passing

## [2.5.0] - 2026-03-03

### ✨ Features

- **Session Archive**: Archive sessions to keep your chat list organized
  - Click 📦/📂 button next to each session to toggle archive status
  - Toolbar 📂 button: Toggle between showing all sessions or archived only
  - Archived sessions are grouped at the bottom of the session list
  - Keyboard shortcut: `Ctrl+A` to toggle archive status of current session
  - Toast notifications for archive status changes

### 🔧 Improvements

- Session list now separates archived sessions into their own group
- Better organization for users with many conversations
- Archive filter button in toolbar matches star filter behavior

### 🧪 Testing

- All 415 tests passing
- Database migration for `is_archived` column tested

## [2.4.0] - 2026-03-03

### ✨ Features

- **Search Results Panel**: Dedicated sidebar for search results
  - Click 📋 button or press `Ctrl+Shift+H` to toggle panel
  - Results grouped by session with count badges
  - Message preview with context around matched text
  - One-click navigation to any search result
  - Automatic markdown stripping for clean previews
  - New component: `src/ui/search_results_panel.py`

### 🔧 Improvements

- Search results now display in a dedicated panel on the right
- Better visibility into search result distribution across sessions
- Cleaner preview text without markdown formatting

### 🧪 Testing

- All core tests passing (321 non-GUI tests)
- Code syntax validated

## [2.3.0] - 2026-03-03

### ✨ Features

- **Quick Action Bar**: Fast access to common features above input area
  - Template shortcuts: Click to apply frequently used templates directly
  - Star filter toggle: One-click switch to starred messages view
  - Recent sessions dropdown: Quick jump to last 5 active sessions
  - Variable support: `{date}`, `{time}`, `{datetime}` in templates
  - New component: `src/ui/quick_action_bar.py`

### 🧪 Testing

- All 415 tests passing
- Quick Action Bar fully integrated with existing star filter

## [2.2.0] - 2026-03-03

### ✨ Features

- **Message Star/Favorite**: Mark important messages with star
  - Right-click context menu: "⭐ 收藏" / "⭐ 取消收藏"
  - Toolbar star button: Filter to show only starred messages
  - Toast notification for star status changes
  - Backend: `Message.is_starred` field + service methods

### 🧪 Testing

- Added 26 new tests for star functionality
- All 133 tests passing

## [2.1.0] - 2026-03-02

### ✨ Features

- **Message Forwarding**: Forward messages to other sessions
  - Single message: Right-click → "➡️ 转发到..."
  - Batch: Selection mode → "📤 转发选中" button
  - Session picker dialog with scrollable list
  - Preserves: quote references, pinned status, original timestamps

## [2.0.0] - 2026-03-02

### 🎨 Major Redesign

- **Design System**: Unified design system (`src/ui/design_system.py`)
  - Colors: Brand, functional, background, text, border, message themes
  - Spacing: 4px grid system (XS=4, SM=8, MD=12, LG=16, XL=24, XXL=32)
  - Radius: Unified corner radius (XS=4, SM=6, MD=8, LG=12, XL=16)
  - FontSize: Consistent sizing (XS=11, SM=12, BASE=14, MD=15, LG=16, XL=18, XXL=20)
  - FontWeight: 400/500/600/700 scale
- **Refactored Components**: All major dialogs migrated to design system
  - main_window.py, statistics_dialog.py, folder_dialog.py, templates_dialog.py

### 🖱️ UX

- **Right-Click Context Menu**: Unified context menu for all message actions
  - Star, forward, pin, copy, edit, delete

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
