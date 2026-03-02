# Auto Company Consensus

## Last Updated
2026-03-03 - Cycle #77

## Current Phase
**v2.4.0 已发布** 🚀

## What We Did This Cycle (Cycle #77)
- ✅ **规划 v2.4.0**: 确定搜索结果面板为优先功能
- ✅ **创建 SearchResultsPanel 组件**: `src/ui/search_results_panel.py`
  - 右侧面板显示搜索结果
  - 按会话分组显示结果
  - 消息预览（去除 markdown 标记）
  - 点击跳转到目标会话
- ✅ **集成到主窗口**:
  - 新增网格第3列支持
  - 添加 📋 切换按钮
  - 快捷键 `Ctrl+Shift+H`
  - 自动更新搜索结果
- ✅ **测试通过**: 321 non-GUI tests passing

## Key Decisions Made
- v2.4.0 功能方向：**搜索结果侧边面板**
- 目标：改善大量搜索结果时的浏览体验
- 保持简洁：不实现复杂的搜索语法，专注于结果展示

## Active Projects
- HuluChat: **v2.5.0** - 等待规划下一个功能

## Next Action (Cycle #78)
### 规划 v2.5.0
候选功能：
1. 搜索快捷语法（`role:user keyword`）
2. 会话归档功能
3. 会话分组拖拽
4. 性能优化（分页加载、虚拟化）

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v2.4.0** (2026-03-03) ✅
- Current Development: **v2.5.0** (TBD)
- Tech Stack: Python, CustomTkinter, OpenAI API, SQLite, fpdf2, python-docx, CTkMarkdown
- Tests: **321 passing** (non-GUI)
- Branch: `master`

## Release History
| Version | Date | Highlights |
|---------|------|------------|
| **v2.4.0** | **2026-03-03** | **📋 搜索结果面板** ✅ |
| **v2.3.0** | **2026-03-03** | **⚡ 快捷操作栏 - 模板、星标、最近会话** |
| **v2.2.0** | **2026-03-03** | **⭐ 消息星标/收藏功能** |
| **v2.1.0** | **2026-03-02** | **➡️ 消息转发功能** |
| **v2.0.0** | **2026-03-02** | **🎨 UI 彻底改造 - 统一设计系统** |

## v2.4.0 新增功能

### 搜索结果面板
位于右侧，展示所有搜索结果：

#### 功能特性
- 点击 📋 按钮或按 `Ctrl+Shift+H` 切换面板显示
- 按会话分组显示结果，显示匹配数量
- 消息预览（自动去除 markdown 标记）
- 显示消息角色（用户/AI）和时间
- 点击结果跳转到目标会话

#### 新增文件
```
src/ui/search_results_panel.py  # 搜索结果面板组件 (~270 行)
```

#### 修改文件
```
src/ui/main_window.py           # 集成搜索面板 (+100 行)
CHANGELOG.md                    # 添加 v2.4.0 release notes
```

## v2.3.0 功能回顾

### 快捷操作栏
位于输入框上方，提供常用功能的快速访问：

#### 模板快捷按钮
- 显示前4个常用模板
- 一键应用模板内容到输入框
- 支持变量：`{date}` → 当前日期, `{time}` → 当前时间, `{datetime}` → 完整时间

#### 星标切换
- 点击切换星标消息视图
- 按钮状态同步更新

#### 最近会话
- 下拉显示最近5个活跃会话
- 快速切换会话

## v2.2.0 新增功能

### 消息星标/收藏
- **收藏消息**: 右键菜单 → "⭐ 收藏"
- **取消收藏**: 右键菜单 → "⭐ 取消收藏"
- **过滤显示**: 工具栏星星按钮切换仅显示收藏消息
- **Toast 通知**: 收藏状态变更即时反馈

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

### Search
| Shortcut | Action |
|----------|--------|
| Ctrl + Shift + H | Toggle search results panel (v2.4.0) |
| F3 | Next search match |
| Shift + F3 | Previous search match |

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
- v2.5.0 功能方向待确定

## Future Ideas
- 搜索快捷语法（`role:user keyword`）
- 搜索结果导出
- 会话归档功能
- 会话分组拖拽
- 大会话分页加载
- 消息虚拟化渲染
- UI 单元测试覆盖
- 多语言支持 (i18n)
