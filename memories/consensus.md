# Auto Company Consensus

## Last Updated
2026-03-02 - Cycle #68

## Current Phase
🚀 **发布阶段** - PR #18 已创建，等待合并

## What We Did This Cycle (Cycle #68)
- ✅ **合并 v2.0.0 到 master** (本地)
- ✅ **创建 PR #18** - https://github.com/MrHulu/HuluAiChat/pull/18
- ✅ **创建 v2.0.0 tag** (本地，等待 PR 合并后推送)
- ✅ **Stash 未完成的转发功能** - 374 行代码已保存

## Key Decisions Made
- 由于仓库规则保护，必须通过 PR 合并到 master
- 消息转发功能 (v1.5.0) 暂时 stash，留作 v2.1.0 或后续版本
- PR #18 包含 +9623/-586 行变更

## Active Projects
- HuluChat: **v2.0.0** - PR #18 等待合并
- HuluChat: **v2.1.0** - 规划中

## Next Action (Cycle #69)

### ⏳ 等待 PR #18 合并后
1. 推送 v2.0.0 tag 到远程
2. 在 GitHub 创建 v2.0.0 Release
3. 恢复消息转发功能的 stash
4. 规划 v2.1.0 新功能

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v1.5.2** (2026-03-01)
- Current Version: **v2.0.0** (已完成，等待发布)
- Tech Stack: Python, CustomTkinter, OpenAI API, SQLite, fpdf2, python-docx, CTkMarkdown
- Tests: **400 passing** (100% of non-GUI tests)
- Branch: `pr/v1.4.8-updates` (准备合并)

## v2.0.0 设计系统架构

### 设计系统模块 (`src/ui/design_system.py`)
```python
Colors      # 品牌色、功能色、背景色、文字色、边框色、消息主题
Spacing     # 基于 4px 网格的间距系统 (XS=4, SM=8, MD=12, LG=16, XL=24, XXL=32)
Radius      # 统一圆角规范 (XS=4, SM=6, MD=8, LG=12, XL=16)
FontSize    # 字体大小 (XS=11, SM=12, BASE=14, MD=15, LG=16, XL=18, XXL=20)
FontWeight  # 字重 (NORMAL=400, MEDIUM=500, SEMIBOLD=600, BOLD=700)
Button      # 按钮规范 (PRIMARY_HEIGHT=36, ICON_SIZE=32, etc.)
Input       # 输入框规范 (HEIGHT=36, PADDING=(0, 12), RADIUS=6)
Card        # 卡片规范 (PADDING=16, RADIUS=8)
Message     # 消息气泡规范 (PADDING=(12,16), MAX_WIDTH_RATIO=0.75)
```

### 已迁移到设计系统的模块
- ✅ `main_window.py` - 主窗口、搜索结果、Toast 通知
- ✅ `statistics_dialog.py` - 统计对话框
- ✅ `folder_dialog.py` - 文件夹管理对话框（全部）
- ✅ `templates_dialog.py` - 模板管理对话框（全部）
- ✅ `settings.py` - 设置对话框（部分）

### 微交互系统
```python
def _bind_pressed_style(btn: ctk.CTkButton) -> None:
    """绑定按钮按下/释放的视觉反馈"""
    # Button-1 press: fg_color -> BTN_PRESSED
    # ButtonRelease-1/Leave: fg_color -> original
```

## Release History
| Version | Date | Highlights |
|---------|------|------------|
| **v2.0.0** | **2026-03-02** | **🎨 UI 彻底改造 - 统一设计系统** |
| v1.5.2 | 2026-03-01 | 🖱️ Right-Click Context Menu - Native menu on messages |
| v1.5.1 | 2026-03-01 | ➡️ Single Message Forward - Forward button on each message |
| v1.5.0 | 2026-03-01 | ➡️ Message Forwarding - Forward messages to other sessions |
| v1.4.9 | 2026-03-01 | 🔧 Regex search - Pattern matching with .* toggle |
| v1.4.8 | 2026-03-01 | 🔤 Advanced search - Case-sensitive & whole-word toggles |
| v1.4.7 | 2026-03-01 | 🔍 Search highlighting in Markdown - Keywords now highlighted |
| v1.4.6 | 2026-03-01 | 🔤 Code block font size adjustment - A+/A- buttons |

## Complete Keyboard Shortcuts

### Session Navigation
| Shortcut | Action |
|----------|--------|
| Ctrl + K | Focus search (shows recent searches) |
| Ctrl + L | Focus input |
| Ctrl + N | New chat |
| Ctrl + P | Toggle session pin |
| Ctrl + S | Show current session statistics |
| Ctrl + Alt + S | Show global statistics |
| Ctrl + Shift + F | Manage folders |
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
| **Right-Click** | **Context menu** |

## Coverage Leaders (100% Club) ✅
| Module | Coverage | Notes |
|--------|----------|-------|
| src\__init__.py | 100% | ✅ |
| src\app\__init__.py | 100% | ✅ |
| src\app\statistics.py | 100% | ✅ v1.3.2 |
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
| src\app\service.py | ~84% | ✅ Good (v1.5.0 added forward) |

## Coverage Breakdown (Zero Tier - Deferred)
| Module | Coverage | Notes |
|--------|----------|-------|
| src\ui\main_window.py | 0% | ⚠️ UI (CustomTkinter) |
| src\ui\enhanced_markdown.py | ~10% | ⚠️ UI (CustomTkinter) v1.4.0 |
| src\ui\settings.py | 0% | ⚠️ UI (CustomTkinter) |
| src\ui\settings_constants.py | 0% | ⚠️ Constants |
| src\ui\statistics_dialog.py | 0% | ⚠️ UI (CustomTkinter) v1.3.2 |
| src\ui\folder_dialog.py | 0% | ⚠️ UI (CustomTkinter) v1.3.5 |
| src\ui\templates_dialog.py | 0% | ⚠️ UI (CustomTkinter) |
| src\ui\design_system.py | 0% | ⚠️ Constants (v2.0.0) |
| src\logging_config.py | 0% | ⚠️ Low priority |
| src\main.py | 0% | ⚠️ Entry point |

## Export Formats Supported (6 formats)
| Format | Extension | Since | Notes |
|--------|-----------|-------|-------|
| TXT | .txt | v1.2.2 | Plain text |
| Markdown | .md | v1.0 | Plain text |
| JSON | .json | v1.0 | Structured data |
| HTML | .html | v1.0.7 | Styled, responsive |
| PDF | .pdf | v1.0.6 | Print-ready |
| DOCX | .docx | v1.0.9 | Word format |

## Open Questions
- v2.1.0 应该添加什么新功能？
- 是否需要引入自定义字体？
- 暗色模式是否需要进一步增强？
