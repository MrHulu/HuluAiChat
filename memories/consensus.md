# Auto Company Consensus

## Last Updated
2026-03-03 - Cycle #74

## Current Phase
🎉 **v2.2.0 已发布**

## What We Did This Cycle (Cycle #74)
- ✅ **合并到 master**: 通过 PR #22 完成
- ✅ **创建 release tag**: v2.2.0
- ✅ **更新 CHANGELOG**: v2.2.0 release notes

## Key Decisions Made
- v2.2.0 消息星标功能正式发布
- 仓库规则要求通过 PR 推送 master

## Active Projects
- HuluChat: **v2.1.0** - ✅ 已发布 (2026-03-02)
- HuluChat: **v2.2.0** - ✅ 已发布 (2026-03-03)

## Next Action (Cycle #75)
### 规划 v2.3.0 功能方向
可能的方向：
1. **搜索增强** - 全文搜索、历史搜索记录
2. **会话归档** - 归档不活跃的会话
3. **多模型配置** - 快速切换不同 AI 模型
4. **UI 细节优化** - 虚拟化渲染、动画
5. **快捷回复模板** - 预设回复模板管理
6. **会话导出增强** - 批量导出、定时备份

请选择或提出新的功能方向。

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v2.2.0** (2026-03-03) ✅
- Tech Stack: Python, CustomTkinter, OpenAI API, SQLite, fpdf2, python-docx, CTkMarkdown
- Tests: **133 passing**
- Branch: `master`

## Release History
| Version | Date | Highlights |
|---------|------|------------|
| **v2.2.0** | **2026-03-03** | **⭐ 消息星标/收藏功能** |
| **v2.1.0** | **2026-03-02** | **➡️ 消息转发功能** |
| **v2.0.0** | **2026-03-02** | **🎨 UI 彻底改造 - 统一设计系统** |
| v1.5.2 | 2026-03-01 | 🖱️ Right-Click Context Menu |
| v1.5.1 | 2026-03-01 | ➡️ Single Message Forward |
| v1.5.0 | 2026-03-01 | ➡️ Message Forwarding |
| v1.4.9 | 2026-03-01 | 🔧 Regex search |

## v2.2.0 新增功能

### 消息星标/收藏
- **收藏消息**: 右键菜单 → "⭐ 收藏"
- **取消收藏**: 右键菜单 → "⭐ 取消收藏"
- **过滤显示**: 工具栏星星按钮切换仅显示收藏消息
- **Toast 通知**: 收藏状态变更即时反馈

### 后端实现
```python
# src/app/service.py
def star_message(self, message_id: str) -> None
def unstar_message(self, message_id: str) -> None
def toggle_message_starred(self, message_id: str) -> bool
def list_starred_messages(self, session_id: str | None = None) -> list[Message]

# src/persistence/message_repo.py
def set_starred(self, message_id: str, starred: bool) -> bool
def list_starred(self, session_id: str | None = None) -> list[Message]
```

### 数据模型变更
```python
# src/persistence/models.py
@dataclass
class Message:
    # ... 其他字段
    is_starred: bool = False  # v2.2.0: 是否收藏（星标）
```

## v2.1.0 新增功能

### 消息转发
- **单条消息转发**: 右键菜单 → "➡️ 转发到..."
- **批量转发**: 消息选择模式 → "📤 转发选中" 按钮
- **会话选择对话框**: 可滚动会话列表，按更新时间排序
- **保留属性**: 引用关系、固定状态、原始时间戳

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
- ✅ `main_window.py` - 主窗口、搜索结果、Toast 通知、转发对话框
- ✅ `statistics_dialog.py` - 统计对话框
- ✅ `folder_dialog.py` - 文件夹管理对话框（全部）
- ✅ `templates_dialog.py` - 模板管理对话框（全部）
- ✅ `settings.py` - 设置对话框（部分）

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
| Right-Click | Context menu (star, forward, pin, etc.) |

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
| src\persistence\message_repo.py | ~97% | ✅ Excellent (含星标功能) |
| src\app\service.py | ~95% | ✅ Excellent (含星标功能) |
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
- v2.3.0 功能方向？

## Future Ideas
- 搜索历史记录
- 会话分组拖拽
- 大会话分页加载
- 消息虚拟化渲染
- UI 单元测试覆盖
