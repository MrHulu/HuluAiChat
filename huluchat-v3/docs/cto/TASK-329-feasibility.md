# 技术可行性评估: TASK-329 Plugin API 扩展

**评估人**: CTO Werner Vogels
**评估日期**: 2026-03-14
**目标版本**: v3.69.0

---

## 1. 现有插件系统分析

### 1.1 架构概述

当前插件系统采用 **前端沙箱执行模型**:

```
+------------------+     +-------------------+     +------------------+
|  Plugin Manager  | --> |  Plugin Instance  | --> |  Plugin Context  |
|    (Singleton)   |     |  (manifest.json)  |     |     (API)        |
+------------------+     +-------------------+     +------------------+
         |                        |                         |
         v                        v                         v
   - loadPlugin            - manifest              - registerCommand
   - activatePlugin        - module (main.js)      - onBeforeSend
   - processBeforeSend     - state                 - onAfterReceive
   - processAfterReceive   - storage               - api.getSessions
```

### 1.2 当前能力

| 能力 | 状态 | 实现位置 |
|------|------|----------|
| 命令注册 | 已实现 | `PluginContext.registerCommand()` |
| 消息发送 Hook | 已实现 | `PluginContext.onBeforeSend()` |
| 消息接收 Hook | 已实现 | `PluginContext.onAfterReceive()` |
| 会话 API | 已实现 | `PluginContext.api.getSessions/Messages` |
| 持久化存储 | 已实现 | `PluginContext.storage` |
| 剪贴板访问 | 已实现 | `PluginContext.readClipboard/writeClipboard` |
| 网络请求 | 已实现 | `PluginContext.fetch` |
| 权限系统 | 已实现 | 7 种权限类型 |
| 更新机制 | 已实现 | `PluginManager.checkForUpdate/updatePlugin` |

### 1.3 关键扩展点

1. **消息处理集成点**:
   - `manager.ts:334-368`: `processBeforeSend()` / `processAfterReceive()` 已定义但 **未被调用**
   - `useChat.ts:273-326`: `sendMessage()` 函数 **未调用插件 hooks**

2. **命令执行集成点**:
   - `manager.ts:324-330`: `executeCommand()` 已实现
   - **缺失**: 命令面板 UI / 快捷键绑定

3. **沙箱机制**:
   - `manager.ts:555-587`: 使用 `new Function()` 构造器执行插件代码
   - **当前状态**: 基础隔离，无真正沙箱

---

## 2. 技术可行性评估

### 2.1 评估矩阵

| API 能力 | 可行性 | 实现难度 | 风险等级 | 说明 |
|----------|--------|----------|----------|------|
| **消息处理 Hook (增强)** | 高 | 低 | 低 | 已有接口，只需集成到消息流 |
| **自定义命令注册 (增强)** | 高 | 中 | 低 | 已有接口，需添加 UI 入口 |
| **会话上下文访问 (增强)** | 高 | 低 | 中 | 需谨慎暴露敏感数据 |
| **安全沙箱增强** | 中 | 高 | 高 | 需要架构级决策 |

### 2.2 详细分析

#### 2.2.1 消息处理 Hook 增强

**当前状态**: API 已定义，但未集成到消息流。

**实现方案**:

```typescript
// 在 useChat.ts sendMessage() 中集成
const sendMessage = useCallback((content, model, params, images, files, useMcp, options) => {
  // 获取 PluginManager 实例
  const manager = getPluginManager();

  // 创建消息对象
  let message: Message = {
    id: `temp-${Date.now()}`,
    session_id: sessionId || "",
    role: "user",
    content: content.trim(),
    images,
    files,
    created_at: new Date().toISOString(),
  };

  // 执行 beforeSend hooks (同步)
  message = manager.processBeforeSend(message);

  // 如果 hook 返回 null，取消发送
  if (!message) {
    return;
  }

  // 继续发送逻辑...
  sendOrQueue({ ... });
}, [...]);
```

**集成点**:
- 发送前: `useChat.ts:273-326` (sendMessage)
- 接收后: `useChat.ts:115-234` (handleWSMessage)

**预计工时**: 4-6 小时

**风险**:
- 异步 hooks 在同步上下文中被跳过 (当前设计)
- 需要 `processBeforeSendAsync()` 支持异步转换

---

#### 2.2.2 自定义命令注册增强

**当前状态**: 命令注册/执行 API 完整，缺少 UI 入口。

**实现方案**:

1. **命令面板组件** (类似 VS Code Cmd+K):

```typescript
// 新增组件: CommandPalette.tsx
interface CommandPaletteProps {
  commands: Command[];
  onExecute: (id: string) => void;
}
```

2. **快捷键注册**:

```typescript
// 扩展 manifest.json
{
  "contributes": {
    "commands": [{
      "id": "myPlugin.doSomething",
      "title": "Do Something",
      "shortcut": "ctrl+shift+d"  // 新增
    }]
  }
}
```

3. **全局命令注册**:

```typescript
// 在 PluginManager 中
registerGlobalShortcut(shortcut: string, commandId: string): Disposable;
```

**集成点**:
- `src/components/` 新增 CommandPalette 组件
- `manager.ts` 扩展 registerCommand 支持快捷键

**预计工时**: 8-12 小时

**风险**:
- 快捷键冲突需要优先级机制
- 需要处理命令的 enabled/disabled 状态

---

#### 2.2.3 会话上下文访问增强

**当前状态**: 基础 API 存在 (`getSessions`, `getMessages`, `sendMessage`)。

**增强方案**:

```typescript
// 扩展 PluginAPI 接口
interface PluginAPI {
  // 现有
  getSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | null>;
  getMessages(sessionId: string): Promise<Message[]>;

  // 新增 - 当前会话上下文
  getCurrentSession(): Session | null;
  getCurrentMessages(): Message[];

  // 新增 - 模型信息
  getAvailableModels(): Promise<Model[]>;
  getCurrentModel(): string;

  // 新增 - RAG 上下文
  getRAGContext(query: string): Promise<RAGResult>;
}
```

**安全考虑**:
- 需要新增权限: `session.current`, `model.read`, `rag.read`
- 敏感操作需要用户确认 (如发送消息)

**预计工时**: 6-8 小时

**风险**:
- 过度暴露内部状态可能导致 API 稳定性问题
- 需要 API 版本控制机制

---

#### 2.2.4 安全沙箱增强

**当前状态**: 使用 `new Function()` 执行，提供基础隔离。

**问题分析**:
- `new Function()` 仍可访问全局对象
- 恶意插件可能访问 `window`, `document`, `fetch`
- 当前依赖权限系统进行约束 (软性限制)

**增强方案**:

**方案 A: Web Worker 沙箱** (推荐)
```typescript
// 在 Web Worker 中执行插件代码
const worker = new Worker('plugin-sandbox.js');
worker.postMessage({ type: 'execute', code: pluginCode });
```

**优点**:
- 真正的线程隔离
- 无法访问主线程 DOM
- 可以限制网络访问

**缺点**:
- 通信开销
- 插件 API 需要 postMessage 代理
- 调试困难

**方案 B: iframe 沙箱**
```html
<iframe sandbox="allow-scripts" src="about:blank"></iframe>
```

**优点**:
- 浏览器原生隔离
- CSP 可以进一步限制

**缺点**:
- DOM 操作受限
- 通信复杂

**方案 C: QuickJS 嵌入** (通过 Tauri Rust)
```rust
// 在 Rust 侧使用 QuickJS 执行 JS
let context = Context::new();
context.eval(plugin_code)?;
```

**优点**:
- 最强隔离
- 完全控制执行环境

**缺点**:
- 需要跨语言通信
- 开发成本高

**推荐**: 对于 v3.69.0，采用 **方案 A (Web Worker)** 作为渐进增强。

**预计工时**: 20-30 小时

**风险**:
- 架构变更较大
- 需要充分测试兼容性
- 性能影响需要评估

---

## 3. 技术风险汇总

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 异步 Hook 处理 | 消息流可能被阻塞 | 超时机制 + 可选异步模式 |
| 快捷键冲突 | 用户体验差 | 优先级系统 + 冲突检测 |
| API 稳定性 | 插件生态碎片化 | 版本化 API + 废弃策略 |
| 沙箱绕过 | 安全漏洞 | 多层防护 + 代码审计 |
| 性能影响 | 用户卡顿 | Hook 执行时间限制 |

---

## 4. 推荐实现方案

### 4.1 分阶段实施

**Phase 1: 消息处理集成** (优先级: 高)
- 将现有 hooks 集成到消息流
- 添加异步 hook 支持
- 工时: 6-8 小时

**Phase 2: 命令系统增强** (优先级: 中)
- 添加命令面板 UI
- 支持快捷键注册
- 工时: 10-12 小时

**Phase 3: 会话上下文扩展** (优先级: 中)
- 扩展 PluginAPI 接口
- 添加细粒度权限
- 工时: 8-10 小时

**Phase 4: 沙箱增强** (优先级: 低，可延后)
- Web Worker 沙箱原型
- 性能测试
- 工时: 25-35 小时

### 4.2 v3.69.0 建议范围

考虑到版本周期和风险，建议 v3.69.0 包含:

- [x] Phase 1: 消息处理 Hook 集成
- [x] Phase 2: 命令系统增强 (命令面板)
- [x] Phase 3: 会话上下文扩展 (部分)
- [ ] Phase 4: 沙箱增强 (延后到 v3.70.0)

**总工时估算**: 24-30 小时

---

## 5. 最终建议

### 结论: **可行，建议继续**

TASK-329 Plugin API 扩展在技术上是可行的。现有架构已经提供了良好的基础:

1. **消息处理 hooks**: API 已定义，只需集成
2. **命令注册**: API 完整，需要 UI 入口
3. **会话上下文**: 可渐进式扩展

### 关键决策点

在开始实施前，需要确认:

1. **Hook 异步模式**: 是否需要支持异步消息转换?
   - 建议: 先实现同步模式，异步作为后续增强

2. **命令面板触发方式**: 全局快捷键还是菜单入口?
   - 建议: Ctrl/Cmd+K (与 VS Code 一致)

3. **沙箱增强优先级**: 是否需要在 v3.69.0 中实现?
   - 建议: 延后到 v3.70.0，先完善功能层

### 依赖条件

- 无外部依赖
- 现有测试覆盖率良好 (usePluginManager.test.ts 存在)
- 不需要后端改动

---

## 附录 A: 现有代码关键位置

| 文件 | 作用 | 关键行 |
|------|------|--------|
| `src/plugins/types.ts` | 类型定义 | 全文 |
| `src/plugins/manager.ts` | 插件管理器 | 334-368 (hooks), 555-587 (沙箱) |
| `src/hooks/useChat.ts` | 聊天逻辑 | 273-326 (sendMessage) |
| `src/hooks/usePluginManager.ts` | React Hook | 全文 |
| `plugins/sample-hello/main.js` | 示例插件 | 全文 |

## 附录 B: 参考实现

- VS Code Extension API: https://code.visualstudio.com/api
- Obsidian Plugin API: https://docs.obsidian.md/Reference/TypeScript+API
- Tauri Security: https://v2.tauri.app/reference/security/

---

*评估完成 - Werner Vogels, CTO*
