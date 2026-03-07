# Auto Company Consensus

## Last Updated
2026-03-07 - Cycle #89

## Current Phase
🟢 **插件更新功能** - 自动检查 + 一键更新

## 🚨 Boss 指令：推送前必须本地验证

**问题**：很多 PR 提交后 CI 失败，导致 Boss 收到大量失败邮件。

**强制规则（从现在开始执行）**：

### 推送前必须运行的检查
```bash
cd huluchat-v3

# 1. TypeScript 类型检查
npm run typecheck

# 2. 前端构建（会检查 JSON 语法）
npm run build

# 3. Lint 检查（必须无错误）
npm run lint
```

### 检查清单
- [x] `npm run typecheck` 通过（无 TypeScript 错误）
- [x] `npm run build` 成功（验证所有 JSON 文件语法）
- [x] `npm run lint` 无错误（警告可以接受）
- [x] 新增 i18n 文件必须用 `jq . xxx.json` 验证

### 禁止行为
- ❌ 直接推送，等 CI 失败再修
- ❌ 忽略本地错误强制推送

## What We Did This Cycle (#89)
- ✅ **实现插件自动更新功能**：
  - 扩展 `PluginManifest` 类型（添加 `updateUrl`, `downloadUrl` 字段）
  - 添加 `PluginUpdateInfo`, `PluginUpdateState` 类型
  - 实现 `checkForUpdate()`, `checkForAllUpdates()`, `updatePlugin()` 方法
  - 更新 `PluginSettings` UI（添加检查更新/更新按钮）
- ✅ **本地验证通过**：
  - `npm run typecheck` ✅
  - `npm run build` ✅
  - `npm run lint` ✅ (只有警告)

## Previous Cycle (#88)
- ✅ 创建快捷回复和代码格式化示例插件
- ✅ 编写插件开发者文档
- ✅ 验证 v3.45.0 发布成功
- ✅ 发送进度汇报邮件给 Boss
- ✅ 创建 word-count 和 export-chat 插件

## Plugin System Architecture

### 核心组件
- **PluginManifest** - 插件元数据 (manifest.json)
- **PluginManager** - 插件生命周期管理
- **PluginContext** - 提供给插件的 API
- **PluginStorage** - 插件持久化存储

### 扩展点
- **Commands** - 命令面板扩展
- **Message Hooks** - 消息发送/接收钩子
- **Toolbar Buttons** - 工具栏按钮
- **Settings Panels** - 设置面板

### 权限系统
- `chat.read` - 读取聊天消息
- `chat.write` - 发送消息
- `storage` - 插件存储
- `api` - HuluChat API 访问
- `clipboard` - 剪贴板访问
- `network` - 网络请求
- `files` - 文件系统访问

### 示例插件
| Plugin | 功能 | Commands |
|--------|------|----------|
| `sample-hello` | 基础示例 | Say Hello, Show Stats, Insert Timestamp |
| `word-count` | 字数统计 | Count Selection, Count Last Message, Show Total Stats |
| `export-chat` | 导出聊天 | Export Markdown, Export JSON, Copy as Markdown |
| `quick-reply` | 快捷回复 | Add Template, List Templates, Insert Template, Clear |
| `code-formatter` | 代码格式化 | Format JSON, Minify JSON, Format Code, Extract Code |

## Active Projects
- **HuluChat**: **v3.45.0 已发布** ✅ | 插件系统功能完整 + 5 个示例插件
- **Product Hunt**: 等待用户完成截图和视频

## Next Action (Cycle #90)
1. **测试插件更新功能**：
   - 创建测试插件验证更新检查
   - 手动测试更新流程
2. **官网部署** (TASK-104)：
   - 配置 Cloudflare secrets
   - 部署 website/
3. **Product Hunt 发布准备**：
   - 用户需要完成截图和视频
   - 准备发布日社区推广

## Company State
- Project: HuluChat - AI Chat Desktop Application
- Latest Release: **v3.45.0** (2026-03-07) - ✅ 已发布
- CI: **✅ 全部通过**
- Tech Stack (v3): Tauri 2.0, React 19, TypeScript, Tailwind v4, shadcn/ui, FastAPI, Python 3.14
- Project Location: `huluchat-v3/`, `website/`
- Supported Languages: **76**
- 新功能: **插件系统** (加载/安装/卸载/**更新检查**) + 多模态图片 + 语音输入 + Command Palette
- 示例插件: 5 个 (sample-hello, word-count, export-chat, quick-reply, code-formatter)
- 开发者文档: `docs/PLUGIN_DEVELOPER_GUIDE.md`

## Plugin System Files
| File | Description |
|------|-------------|
| `docs/PLUGIN_SYSTEM.md` | 设计文档 |
| `docs/PLUGIN_DEVELOPER_GUIDE.md` | 开发者指南 ✨ |
| `huluchat-v3/src/plugins/types.ts` | TypeScript 类型定义（含 PluginUpdateInfo/PluginUpdateState）|
| `huluchat-v3/src/plugins/manager.ts` | 插件管理器实现（含更新检查/安装）|
| `huluchat-v3/src/plugins/index.ts` | 模块导出 |
| `huluchat-v3/src/hooks/usePluginManager.ts` | React Hook（含更新方法）|
| `huluchat-v3/src/components/settings/PluginSettings.tsx` | 设置页面组件（含拖拽安装/更新 UI）|
| `huluchat-v3/src/components/ui/alert-dialog.tsx` | AlertDialog 组件 |
| `huluchat-v3/src-tauri/Cargo.toml` | 添加 tauri-plugin-fs, tauri-plugin-dialog |
| `huluchat-v3/src-tauri/capabilities/default.json` | FS + Dialog 权限配置 |
| `plugins/sample-hello/` | 示例插件 - Hello World |
| `plugins/word-count/` | 示例插件 - 字数统计 |
| `plugins/export-chat/` | 示例插件 - 导出聊天 |
| `plugins/quick-reply/` | 示例插件 - 快捷回复 |
| `plugins/code-formatter/` | 示例插件 - 代码格式化 |

## Release History
| Version | Date | Highlights | 状态 |
|---------|------|------------|------|
| **v3.45.0** | 2026-03-07 | 🔌 插件安装/卸载 UI + 拖拽安装 | ✅ 已发布 |
| **v3.44.0** | 2026-03-07 | 🔌 Tauri FS API 插件加载 | ✅ 已发布 |
| **v3.43.0** | 2026-03-07 | 🔌 插件系统 | ✅ 已发布 |
| **v3.42.0** | 2026-03-07 | 🖼️ 多模态图片支持 (GPT-4o Vision) | ✅ 已发布 |
| **v3.41.0** | 2026-03-07 | 🎤 语音输入 (Web Speech API) | ✅ 已发布 |
| **v3.40.0** | 2026-03-07 | ⌨️ Command Palette (Ctrl/Cmd+K) | ✅ 已发布 |

## BUG 清单

### 当前无 BUG
- **严重**: 无
- **中等**: 无
- **轻微**: 无

## Open Questions
- 插件系统是否需要沙箱执行环境？
- 是否需要官方插件市场？
- 如何处理插件冲突？

## Product Hunt 准备清单
- [x] 产品信息 (Tagline, 描述)
- [x] 社交媒体文案
- [x] 截图指南 (`docs/SCREENSHOT_DEMO_GUIDE.md`)
- [x] 演示视频脚本
- [x] **GitHub README 更新** ✅
- [x] **社区推广内容** (`docs/COMMUNITY_PROMOTION.md`) ✅
- [x] **性能分析报告** (`docs/PERFORMANCE_ANALYSIS.md`) ✅
- [x] **I18N 语言文档** (`docs/I18N_LANGUAGES.md`) ✅
- [ ] 实际截图 (5 张) - **需要用户手动完成**
- [ ] 演示视频 (60 秒) - **需要用户手动完成**
- [ ] 发布日社区推广

## 循环计数
当前周期: 89
上次发邮件: 88
