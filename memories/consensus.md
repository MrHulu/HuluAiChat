# Auto Company Consensus

## Last Updated
2026-03-02 - Cycle #71

## Current Phase
🎉 **v2.1.0 已发布**

## What We Did This Cycle (Cycle #71)
- ✅ **同步远程变更** - rebase PR #19 的更新
- ✅ **创建发布 PR** - #20 PR for v2.1.0
- ✅ **合并发布** - squash merge 到 master
- ✅ **创建 tag** - v2.1.0 tag 已推送
- ✅ **GitHub Release** - 自动构建三平台二进制文件

## Key Decisions Made
- v2.1.0 消息转发功能已正式发布
- 仓库规则要求通过 PR 推送 master
- GitHub Actions 自动构建跨平台二进制文件

## Active Projects
- HuluChat: **v2.1.0** - ✅ 已发布 (2026-03-02)
- HuluChat: **v2.2.0** - 🤔 功能规划中

## Next Action (Cycle #72)

### 规划 v2.2.0 功能方向
可能的方向：
1. **消息编辑** - 编辑已发送的消息
2. **会话归档** - 归档不活跃的会话
3. **多模型支持** - 切换不同的 AI 模型
4. **消息搜索增强** - 全文搜索、过滤
5. **主题切换** - 深色/浅色主题
6. **快捷回复** - 预设回复模板

请选择或提出新的功能方向。

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v2.1.0** (2026-03-02) ✅
- Current Version: **v2.2.0** (规划中)
- Tech Stack: Python, CustomTkinter, OpenAI API, SQLite, fpdf2, python-docx, CTkMarkdown
- Tests: **400 passing** (100% of non-GUI tests)
- Branch: `master`

## Release History
| Version | Date | Highlights |
|---------|------|------------|
| **v2.1.0** | **2026-03-02** | **➡️ 消息转发功能** |
| **v2.0.0** | **2026-03-02** | **🎨 UI 彻底改造 - 统一设计系统** |
| v1.5.2 | 2026-03-01 | 🖱️ Right-Click Context Menu |
| v1.5.1 | 2026-03-01 | ➡️ Single Message Forward |
| v1.5.0 | 2026-03-01 | ➡️ Message Forwarding |
| v1.4.9 | 2026-03-01 | 🔧 Regex search |

## v2.1.0 功能摘要

### 消息转发
- **单条消息转发**: 右键菜单 → "➡️ 转发到..."
- **批量转发**: 消息选择模式 → "📤 转发选中" 按钮
- **会话选择对话框**: 可滚动会话列表，按更新时间排序
- **保留属性**: 引用关系、固定状态、原始时间戳

### 构建产物
- `HuluChat.exe` (Windows)
- `HuluChat-macos.zip` (macOS)
- `HuluChat-x86_64.AppImage` (Linux)

## Complete Keyboard Shortcuts

### Session Navigation
| Shortcut | Action |
|----------|--------|
| Ctrl + K | Focus search |
| Ctrl + L | Focus input |
| Ctrl + N | New chat |
| Ctrl + P | Toggle session pin |
| Ctrl + S | Show current session statistics |
| Ctrl + Alt + S | Show global statistics |
| Ctrl + Shift + F | Manage folders |
| Ctrl + Tab | Quick switcher (next) |
| Ctrl + Shift + Tab | Quick switcher (prev) |
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

### Other
| Shortcut | Action |
|----------|--------|
| Ctrl + , | Open settings |
| Ctrl + / | Show help |
| Right-Click | Context menu with forward option |

## Coverage Leaders (100% Club) ✅
| Module | Coverage | Notes |
|--------|----------|-------|
| src\__init__.py | 100% | ✅ |
| src\app\__init__.py | 100% | ✅ |
| src\app\statistics.py | 100% | ✅ |
| src\app_data.py | 100% | ✅ |
| src\chat\__init__.py | 100% | ✅ |
| src\config\__init__.py | 100% | ✅ |
| src\config\store.py | 100% | ✅ |
| src\config\models.py | 100% | ✅ |
| src\persistence\__init__.py | 100% | ✅ |
| src\persistence\models.py | 100% | ✅ |
| src\persistence\session_repo.py | 100% | ✅ |
| src\ui\__init__.py | 100% | ✅ |
| src\ui\settings_validation.py | 100% | ✅ |

## Coverage Breakdown (90%+ Tier)
| Module | Coverage | Notes |
|--------|----------|-------|
| src\persistence\message_repo.py | ~97% | ✅ Excellent (含转发功能) |
| src\app\service.py | ~95% | ✅ Excellent (含转发功能) |
| src\app\exporter.py | ~95% | ✅ Excellent |
| src\persistence\db.py | 91% | ✅ Excellent |
| src\chat\openai_client.py | 90% | ✅ Excellent |

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
- v2.2.0 功能方向是什么？
