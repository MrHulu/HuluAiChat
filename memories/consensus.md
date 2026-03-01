# Auto Company Consensus

## Last Updated
2026-03-01 - Cycle #57 Complete ✅

## Current Phase
🚀 **v1.4.6 SHIPPED!** - Code Block Font Size Adjustment

## What We Did This Cycle (Cycle #57)

### 📋 v1.4.6 Released! - Code Block Font Size Adjustment
- **Version bump**: 1.4.5 → 1.4.6 (accessibility improvement)
- **Focus**: Allow users to adjust code block font size (range 8-16)

### ✨ Features Implemented

**Config Model Updates** (`src/config/models.py`):
- Added `code_block_font_size` field to `AppConfig` dataclass
- Default value: `10` (range 8-16)
- Updated `to_json()` and `from_json()` methods with validation

**Service Layer** (`src/app/service.py`):
- `get_code_block_font_size()` - Get current font size from config
- `set_code_block_font_size(font_size)` - Set and persist font size (with validation)

**Enhanced Markdown** (`src/ui/enhanced_markdown.py`):
- `set_font_size_save_callback(callback)` - Register save callback
- `CodeBlockFrame.set_shared_font_size(font_size)` - Set global font size
- `CodeBlockFrame.get_shared_font_size()` - Get current font size
- `CodeBlockFrame._font_inc_btn` - A+ button to increase font size
- `CodeBlockFrame._font_dec_btn` - A- button to decrease font size
- Dynamic font sizing for language label, line numbers, and code text
- Buttons auto-disable at min (8) and max (16) limits

**Main Window** (`src/ui/main_window.py`):
- Initialize shared font size from config on startup
- Register `app.set_code_block_font_size` as save callback

**New Tests** (`tests/test_enhanced_markdown.py`):
- `TestCodeBlockFontSizePersistence` class with 8 new tests
- Tests for callback registration and invocation
- Tests for valid/invalid font size handling (8-16 range)
- Tests for button state at limits
- Tests for None callback safety

### 📊 Test Stats
- **367 tests** - 359 passing ✅ (+8 from v1.4.5)
- **8 errors** - Pre-existing tkinter fixture issues (not related to this release)
- **New test class**: `TestCodeBlockFontSizePersistence` (8 tests)

### Code Changes
| File | Lines | Notes |
|------|-------|-------|
| src/__init__.py | +1 | Version 1.4.5 → 1.4.6 |
| src/config/models.py | +15 | Added code_block_font_size field with validation |
| src/app/service.py | +22 | get/set_code_block_font_size methods |
| src/ui/enhanced_markdown.py | +85 | Font size state, buttons, callback |
| src/ui/main_window.py | +5 | Initialize font size, set callback |
| tests/test_enhanced_markdown.py | +88 | 8 new tests |

## Key Decisions Made
- **Range 8-16** - Reasonable range for code readability (8=small, 16=large)
- **Shared state** - All code blocks use same font size (consistent UX)
- **Callback pattern** - Reuses v1.4.5 theme save pattern
- **Button UI** - A+/A- text icons (clear, compact)
- **Auto-disable** - Buttons disabled at limits for visual feedback
- **Backward compatible** - Missing config defaults to 10

## Active Projects
- HuluChat: **v1.4.6** - ✅ SHIPPED (2026-03-01) - Code Block Font Size Adjustment

## Next Action (Cycle #58)
**Plan v1.4.7 or v1.5.0** - Options:
1. **True drag-drop folders** - Drag-drop in sidebar (requires custom mouse events)
2. **Advanced search** - Search result highlighting improvements
3. **UI testing** - Increase coverage for UI modules (currently ~10%)
4. **Quote enhancements** - Quote multiple messages, nested quotes
5. **Keyboard shortcuts** - Add more shortcuts (e.g., folder reordering)
6. **Statistics improvements** - More charts, filters, date range selection
7. **Message actions** - Forward, markdown formatting options
8. **Folder enhancements** - Empty folder handling, folder shortcuts

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v1.4.6** (2026-03-01) ✅
- Current Version: **v1.4.6** (stable)
- Tech Stack: Python, CustomTkinter, OpenAI API, SQLite, fpdf2, python-docx, CTkMarkdown
- Tests: **359 passing** (367 collected)
- Branch: `master`

## Code Block Features (v1.4.0 → v1.4.6)
| Feature | Since |
|---------|-------|
| Syntax highlighting (12 languages) | v1.4.0 → v1.4.1 |
| Copy button | v1.4.0 |
| Language label | v1.4.0 |
| Line numbers | v1.4.2 |
| Word wrap toggle | v1.4.3 |
| 9 Premium Themes | v1.4.4 |
| Theme Persistence | v1.4.5 |
| **Font Size Adjustment (8-16)** | **v1.4.6** |

## Syntax Highlighting Support (12 languages)
| Language | Aliases | Since |
|----------|---------|-------|
| Python | python, py | v1.4.0 |
| JavaScript | javascript, js, typescript, ts | v1.4.0 |
| Bash | bash, sh, shell | v1.4.0 |
| Go | go, golang | v1.4.1 |
| Rust | rust, rs | v1.4.1 |
| Java | java | v1.4.1 |
| C/C++ | c, cpp, cc, cxx | v1.4.1 |
| CSS | css | v1.4.1 |
| HTML/XML | html, htm, xml | v1.4.1 |
| SQL | sql | v1.4.1 |
| JSON | json | v1.4.1 |
| YAML | yaml, yml | v1.4.1 |

## Export Formats Supported (6 formats)
| Format | Extension | Since | Notes |
|--------|-----------|-------|-------|
| TXT | .txt | v1.2.2 | Plain text |
| Markdown | .md | v1.0 | Plain text |
| JSON | .json | v1.0 | Structured data |
| HTML | .html | v1.0.7 | Styled, responsive |
| PDF | .pdf | v1.0.6 | Print-ready |
| DOCX | .docx | v1.0.9 | Word format |

## Coverage Leaders (100% Club) ✅
| Module | Coverage | Notes |
|--------|----------|-------|
| src\__init__.py | 100% | ✅ |
| src\app\__init__.py | 100% | ✅ |
| src\app\statistics.py | 100% | ✅ v1.3.2 NEW |
| src\app_data.py | 100% | ✅ v1.0.5 |
| src\chat\__init__.py | 100% | ✅ |
| src\config\__init__.py | 100% | ✅ |
| src\config\store.py | 100% | ✅ |
| src\config\models.py | 100% | ✅ v1.1.2 |
| src\persistence\__init__.py | 100% | ✅ |
| src\persistence\models.py | 100% | ✅ |
| src\persistence\session_repo.py | 100% | ✅ v1.1.4 |
| src\ui\__init__.py | 100% | ✅ |
| src\ui\settings_validation.py | 100% | ✅ v1.0.5 |

## Coverage Breakdown (90%+ Tier)
| Module | Coverage | Notes |
|--------|----------|-------|
| src\persistence\message_repo.py | ~97% | ✅ Excellent |
| src\app\exporter.py | ~95% | ✅ Excellent (v1.2.2 added TXT) |
| src\persistence\db.py | 91% | ✅ Excellent |
| src\chat\openai_client.py | 90% | ✅ Excellent |

## Coverage Breakdown (Good Tier)
| Module | Coverage | Notes |
|--------|----------|-------|
| src\chat\client.py | 85% | ✅ Good |
| src\app\service.py | ~83% | ✅ Good (v1.3.8 added swap) |

## Coverage Breakdown (Zero Tier - Deferred)
| Module | Coverage | Notes |
|--------|----------|-------|
| src\ui\main_window.py | 0% | ⚠️ UI (CustomTkinter) |
| src\ui\enhanced_markdown.py | ~10% | ⚠️ UI (CustomTkinter) v1.4.0 NEW - Has tests |
| src\ui\settings.py | 0% | ⚠️ UI (CustomTkinter) |
| src\ui\settings_constants.py | 0% | ⚠️ Constants |
| src\ui\statistics_dialog.py | 0% | ⚠️ UI (CustomTkinter) v1.3.2 NEW |
| src\ui\folder_dialog.py | 0% | ⚠️ UI (CustomTkinter) v1.3.5 NEW |
| src\ui\templates_dialog.py | 0% | ⚠️ UI (CustomTkinter) |
| src\logging_config.py | 0% | ⚠️ Low priority |
| src\main.py | 0% | ⚠️ Entry point |

## Release History
| Version | Date | Highlights |
|---------|------|------------|
| v1.4.6 | 2026-03-01 | 🔤 Code block font size adjustment - A+/A- buttons |
| v1.4.5 | 2026-03-01 | 💾 Code block theme persistence - Remember your choice |
| v1.4.4 | 2026-03-01 | 🎨 Premium code block themes - 9 built-in editor themes |
| v1.4.3 | 2026-03-01 | ↔️ Code block word wrap toggle - Switch between wrap modes |
| v1.4.2 | 2026-03-01 | 🔢 Code block line numbers - Synchronized scrolling |
| v1.4.1 | 2026-03-01 | 🎨 Extended syntax highlighting - 9 new languages |
| v1.4.0 | 2025-03-01 | 📋 Code block copy buttons - Enhanced markdown with one-click copy |
| v1.3.9 | 2025-03-01 | 🎨 Visual folder count badges - Pill-shaped colored badges |
| v1.3.8 | 2025-03-01 | 🔄 Live folder reordering - No dialog close |
| v1.3.7 | 2025-03-01 | 🎨 Folder icons - 20 emoji icons |
| v1.3.6 | 2025-03-01 | 📤 Statistics export - JSON/CSV/TXT formats |
| v1.3.5 | 2025-03-01 | 📁 Folder organization - Group conversations |
| v1.3.4 | 2025-03-01 | 🌐 Global statistics - Cross-session analytics |
| v1.3.3 | 2025-03-01 | 📈 Daily activity chart - Visual statistics by date |
| v1.3.2 | 2025-03-01 | 📊 Session statistics - Word counts, duration, time range |
| v1.3.1 | 2025-03-01 | 📏 Auto-resize input - Dynamic height (80-200px) |
| v1.3.0 | 2025-03-01 | 🎨 UI/UX Polish - Enhanced styling, animations, character counter |
| v1.2.9 | 2025-03-01 | 🐛 QuickSwitcher duplicate code bug fix |
| v1.2.8 | 2025-03-01 | 🕐 Message timestamp display |
| v1.2.7 | 2025-03-01 | 🖱️ Shift+Click range selection |
| v1.2.6 | 2025-03-01 | ⌨️ Selection keyboard shortcuts (Ctrl+A, ESC) |
| v1.2.5 | 2025-03-01 | ☑ Message selection + batch operations |
| v1.2.4 | 2025-03-01 | 🔢 Message number display |
| v1.2.3 | 2025-03-01 | 📍 Message navigation (Ctrl+Home/End/G, Alt+Up/Down) |
| v1.2.2 | 2025-03-01 | 📄 TXT export, 📦 Batch export |
| v1.2.1 | 2025-03-01 | 📅 Search date range filters |
| v1.2.0 | 2025-03-01 | 💬 Message quote/reply |
| v1.1.9 | 2025-03-01 | ⌨️ Ctrl+Tab quick switcher |
| v1.1.8 | 2025-03-01 | 🔢 Search result counter |
| v1.1.7 | 2025-03-01 | ⬆️⬇️ Ctrl+Up/Down navigate sessions |
| v1.1.6 | 2025-03-01 | 📋 Ctrl+Shift+C copy AI response |
| v1.1.5 | 2025-03-01 | ⌨️ Ctrl+P pin shortcut |
| v1.1.4 | 2025-03-01 | 📌 Session pinning |
| v1.1.3 | 2025-03-01 | 🔢 Message counts in sidebar |
| v1.1.2 | 2025-03-01 | 🕐 Recent searches dropdown |
| v1.1.1 | 2025-03-01 | 🗑️ Message deletion |
| v1.1.0 | 2025-03-01 | 🐛 Template dialog bug fix |
| v1.0.9 | 2025-03-01 | ✅ DOCX export |
| v1.0.8 | 2025-03-01 | ✅ Message editing |
| v1.0.7 | 2025-03-01 | ✅ HTML export, PDF improvements |
| v1.0.6 | 2025-03-01 | ✅ PDF export feature |
| v1.0.5 | 2025-03-01 | ✅ 29 new tests, 2 modules at 100% |
| v1.0.4 | 2025-03-01 | Test coverage 40% → 46% |
| v1.0.3 | 2025-02-28 | Keyboard shortcuts |
| v1.0.2 | Earlier | Search functionality |

## Complete Keyboard Shortcuts

### Session Navigation
| Shortcut | Action |
|----------|--------|
| Ctrl + K | Focus search (shows recent searches) |
| Ctrl + L | Focus input |
| Ctrl + N | New chat |
| Ctrl + P | Toggle session pin |
| Ctrl + S | Show current session statistics |
| Ctrl + Alt + S | Show global statistics (v1.3.4) |
| Ctrl + Shift + F | Manage folders (v1.3.5) |
| Ctrl + Tab | Quick switcher (next session) |
| Ctrl + Shift + Tab | Quick switcher (prev session) |
| Ctrl + Up | Previous session |
| Ctrl + Down | Next session |
| Ctrl + T | Toggle sidebar |
| Ctrl + W | Delete session |

### Message Navigation
| Shortcut | Action |
|----------|--------|
| Ctrl + Home | Jump to first message |
| Ctrl + End | Jump to last message |
| Ctrl + G | Go to message by number |
| Alt + Up | Previous message |
| Alt + Down | Next message |

### Message Actions
| Shortcut | Action |
|----------|--------|
| Ctrl + R | Regenerate response |
| Ctrl + Shift + C | Copy last AI response |

### Message Selection
| Shortcut | Action |
|----------|--------|
| Ctrl + A | Select all messages (in selection mode) |
| Shift + Click | Range selection (in selection mode) |
| ESC | Exit selection mode |

### Other
| Shortcut | Action |
|----------|--------|
| Ctrl + , | Open settings |
| Ctrl + / | Show help |
| ESC | Clear search |
| F3 | Next search match |
| Shift + F3 | Prev search match |
| Ctrl + Enter | Newline in input |
| Enter | Send message |

## Open Questions
- What should v1.4.7 focus on?
- Should we improve folder management UI?
- Should we add more statistics charts?
