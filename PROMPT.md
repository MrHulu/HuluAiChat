# Auto Company - 工作流程

> 本文档定义 AI Agent 的自主工作流程

## 核心原则

1. **自主决策** - 完成任务后自动规划下一个版本，无需等待
2. **TDD 优先** - 测试驱动开发
3. **小步提交** - 频繁提交，便于回滚
4. **文档同步** - 代码和文档同步更新
5. **减少邮件打扰** - 只在必要时发邮件
6. **隐私优先** - ❌ **不做埋点功能** ⚠️ **Boss 明确要求**

---

## ⚠️ 完成定义（Definition of Done）🔴 **强制遵守**

**任务完成 = 以下全部满足**：

| 步骤 | 强制 | 说明 |
|------|------|------|
| 1. 代码实现 | ✅ | 功能/修复已完成 |
| 2. 本地验证 | ✅ | `npm run typecheck` + `npm run lint` 通过 |
| 3. **测试通过** | ✅ | **`npm test` 全部通过，无例外** |
| 4. 集成验证 | ✅ | 调用 test-integration-kent agent |
| 5. 提交推送 | ✅ | `git add . && git commit && git push` |

**❌ 以下情况不算完成**：
- 测试有失败
- 跳过测试
- 声称"测试通过"但实际未运行

---

## ⚠️ 诚实报告规则 🔴 **强制遵守**

**必须如实报告**：
1. **测试结果** - 多少通过/失败，不能只说"测试通过"
2. **版本号** - 实际的 package.json 版本，不能夸大
3. **遇到的问题** - 不能隐瞒

**报告格式**：
```
测试结果: X passed, Y failed (Z test files)
版本: v3.XX.0 (package.json)
```

**❌ 禁止行为**：
- 声称"所有测试通过"但实际有失败
- 声称版本号高于实际
- 跳过验证直接报告完成

---

## ⚠️ 版本发布规则 🔴 **强制遵守**

**版本完成（所有 MVP 任务完成）后必须**：

| 步骤 | 命令/操作 |
|------|----------|
| 1. 更新版本号 | `package.json` + `tauri.conf.json` |
| 2. 更新 CHANGELOG | 添加版本变更记录 |
| 3. 创建 git tag | `git tag v3.XX.0` |
| 4. 推送 tag | `git push origin v3.XX.0` |
| 5. 触发 release | tag 推送自动触发 GitHub Actions |

**❌ 禁止行为**：
- 开发新版本但不发布旧版本
- 声称完成版本但不创建 tag
- 版本号停留在旧版本但声称开发新版本

---

## ⚠️ 收敛规则 - 工作流文件保护

**以下文件不能被 AI Agent 修改或提交**（只能由 Boss 或 Secretary 修改）：

| 文件 | 原因 |
|------|------|
| `CLAUDE.md` | 项目使命和架构定义 |
| `PROMPT.md` | 本文件 - 工作流程定义 |
| `auto_loop.py` | 自主循环脚本 |
| `.claude/rules/*.md` | 规则文件 |

**以下文件可以被 AI Agent 正常提交**：

| 文件 | 说明 |
|------|------|
| `TASKS.md` | ✅ 可以提交 - 任务清单 |
| `memories/consensus.md` | ✅ 可以提交 - 项目状态 |
| `CHANGELOG.md` | ✅ 可以提交 - 变更日志 |
| 所有代码文件 | ✅ 可以提交 |

---

## 禁止事项

根据 Boss 明确要求，以下功能**禁止实施**：

| 功能 | 状态 | 原因 |
|------|------|------|
| **用户行为埋点** | ❌ 禁止 | Boss 明确要求不做 |
| **数据追踪** | ❌ 禁止 | 隐私优先原则 |
| **遥测功能** | ❌ 禁止 | 无需数据收集 |

**注意**：任何涉及用户数据收集、行为追踪的功能都需要先获得 Boss 批准！

---

## 工作流程

```
git add .
git commit -m "feat: 简短描述"

git push
   ```

### Phase 1: 取任务

1. **读取 TASKS.md**
   - 查看"待开始"区域
   - 选择优先级最高的任务

2. **读取 memories/consensus.md**
   - 了解当前项目状态
   - 查看最近的决策和背景

3. **更新 consensus.md Next Action**
   - 记录即将开始的任务

### Phase 2: 执行任务

#### 技术任务（开发/修复）

1. **分析需求**
   - 阅读相关文档（CLAUDE.md, README, 技术文档）
   - 查看现有代码结构
   - **确认不涉及埋点功能**

2. **TDD 流程**
   ```bash
   # 先写测试
   npm run test:watch -- <test-file>

   # 再写代码
   # 代码会让测试失败

   # 实现功能
   # 测试通过

   # 重构
   # 保持测试通过
   ```

3. **本地验证**
   ```bash
   # 类型检查
   npm run typecheck

   # Lint
   npm run lint

   # 构建
   npm run build

   # 完整测试
   npm test
   ```

4. **集成验证** ⚠️ **强制步骤**

   完成功能后，**调用 test-integration-kent agent** 进行集成检查：
   ```
   使用 test-integration-kent 检查刚才完成的功能集成情况
   ```

   agent 会自主思考：
   - 这个功能依赖哪些其他模块？
   - 用户会如何使用这个功能？从入口到完成的全路径是什么？
   - 哪些地方可能"组件存在但未被使用"？
   - 如果我是用户，什么情况会发现这个功能坏掉了？

   根据 agent 反馈针对性修复。

5. **提交并推送代码**
   ```bash
   git add .
   git commit -m "feat: 简短描述"
   git push
   ```

#### 规划任务（产品/设计）

1. **组建 Agent 团队**
   - 使用 `/team` 指令动态组建团队
   - 不同任务类型需要不同的 Agent 组合

2. **协作决策**
   - 每个 Agent 发挥专业能力
   - CEO 做最终决策
   - **确认不包含埋点功能**

3. **输出文档**
   - 保存到 `docs/` 目录
   - 更新 consensus.md

### Phase 3: 完成任务

1. **更新 TASKS.md**
   - 将任务从"待开始"移到"已完成"
   - 记录完成时间

2. **更新 consensus.md**
   - 记录完成情况
   - **任务完成计数 +1**
   - 检查是否达到 10 个任务

3. **检查下一个任务**
   - 查看 TASKS.md 是否还有待开始任务
   - 如果有 → 返回 Phase 1
   - 如果没有 → 进入 Phase 4

---

### Phase 4: 周期性汇总（每 10 个任务完成）⚠️ **修正**

**触发条件**：
- **完成 10 个有意义的开发任务**
- 无论耗时多久

**任务定义（什么是"有意义的任务"）**：

**是**（算 1 个任务）：
- ✅ 功能开发（如：添加一个按钮）
- ✅ Bug 修复（如：修复某个 bug）
- ✅ 功能规划（如：规划新版本）
- ✅ 文档更新（如：更新 README）
- ✅ 测试编写（如：添加测试用例）

**否**（不算任务）：
- ❌ 纯样式调整（如：调整一个颜色值）
- ❌ 小修改（如：改一个文案）
- ❌ 提交后撤回（commit 后又 revert）

**邮件内容**：
```json
{
  "to": "491849417@qq.com",
  "subject": "[HuluChat] 周期性汇总 - 已完成 {N} 个任务",
  "body": "Hi Boss,\n\n周期 #{last_email_cycle + 1} - #{current_cycle} 汇总：\n\n完成的任务：\n- {列出完成的 10 个任务}\n\n当前状态：\n- 版本：{当前版本}\n- 进行中任务：{进行中的任务}\n- 待开始任务：{待开始的任务}\n\n遇到的问题：\n- {如果有阻塞问题}\n\n下一步：\n- {计划执行的任务}\n\n耗时：{耗时}\n\n---\nAI Assistant\nAI Center Secretary"
}
```

**目的**：让 Boss 了解项目进展，不需要实时干预

---

### Phase 5: 无任务时的处理 ⚠️ **重要**

**当 TASKS.md 中"待开始"区域为空时，必须执行以下操作**：

#### 步骤 1: 检查当前状态

- 查看 `memories/consensus.md`
- 确认所有任务确实已完成
- 检查是否有未合并的 PR

#### 步骤 2: 发邮件给 Boss ✅ **必须发送**

**使用秘书的邮件系统发送决策请求邮件**

**邮件内容**：
```json
{
  "to": "491849417@qq.com",
  "subject": "[HuluChat] 所有任务完成 - 等待指示",
  "body": "Hi Boss,\n\nHuluChat 所有短期任务已完成，当前状态：\n- 版本：{当前版本}\n- 周期：{当前周期}\n- 已完成：{列出完成的任务}\n\n等待决策：下一步方向\n\n选项：\nA. 规划下一个版本（v3.XX.0）\nB. Product Hunt 准备\nC. 执行长期任务\n\n📧 若 5 分钟内未收到回复，将自动执行选项 A（规划下一个版本）\n\n请确认或给出其他指示。\n\n---\nAI Assistant\nAI Center Secretary"
}
```

#### 步骤 3: 等待或自动执行

**如果 5 分钟内收到 Boss 回复**：
- 按照 Boss 的指示执行

**如果 5 分钟内未收到回复**：
- **自动执行：规划下一个版本**
- 使用 `/team` 组建完整 Agent 团队
- 执行自主决策流程

---

## 邮件发送规则总结 ⚠️ **重要**

### 📧 邮件发送方式（强制使用）

**使用 ai-center 的 email-sender skill**：

```python
# 1. 创建 JSON 文件
import json
email_content = {
    "to": "491849417@qq.com",
    "subject": "[HuluChat] 邮件主题",
    "body": """Hi Boss,

邮件正文...

---
AI Assistant"""
}
with open("/tmp/email.json", "w", encoding="utf-8") as f:
    json.dump(email_content, f, ensure_ascii=False, indent=2)

# 2. 发送邮件
import subprocess
subprocess.run([
    "python",
    "D:/HuluMan/project/ai-center/.claude/skills/email-sender/scripts/send_email.py",
    "/tmp/email.json"
])
```

**❌ 禁止使用**：
- `huluchat-v3/scripts/send-email.cjs` （旧脚本，授权码过期）
- `gh workflow run email-notification.yml` （GitHub Secrets 未配置）

### ✅ 发送邮件的场景

| 场景 | 说明 | 触发条件 |
|------|------|----------|
| **完成 10 个任务** | 周期性汇总 | task_count % 10 == 0 |
| **所有任务完成** | TASKS.md 空时 | - |
| **遇到阻塞问题** | 需要 Boss 手动操作 | - |
| **需要 Boss 决策** | 等待 Boss 指示 | - |

### ❌ 不发送邮件的场景

| 场景 | 原因 |
|------|------|
| **版本发布完成** | TASKS.md 空时会发，避免重复 |
| **Phase 完成** | 太频繁，等任务完成再发 |
| **等待状态** | 不打扰 Boss |
| **git commit** | 不算"有意义的任务" |

---

## 循环规则

### 每个周期必须执行

1. ✅ 读取 consensus.md
2. ✅ 读取 TASKS.md
3. ✅ 执行一个任务（或完成一个阶段）
4. ✅ 更新 consensus.md
5. ✅ 更新 TASKS.md（如果任务完成）
6. ✅ **任务计数 +1** ⚠️ **新增**
7. ✅ 提交代码（如果有代码变更）- **包含 git push**
8. ✅ **检查任务数是否是 10 的倍数** → 如果是，发汇总邮件 ⚠️ **重要**
9. ✅ 检查是否还有待开始任务
10. ⚠️ **如果没有 → 发邮件给 Boss**

### 中断条件

- 遇到无法解决的技术问题（记录到 consensus.md 的 Open Questions）
- 需要 Boss 手动操作（如配置 Cloudflare Secrets）
- **发现规划中包含埋点功能** → 立即停止并报告 Boss

---

## 长期任务清单

当自动执行"规划下一个版本"时，参考以下顺序：

1. **默认任务**：规划下一个版本（v3.XX.0）
   - 使用 Agent 团队协作
   - 必须咨询 critic-munger
   - **确保不包含埋点功能**

2. **其他长期任务**（需明确指定）：
   - UI 重构：Tauri + FastAPI
   - UI/UX 优化
   - 插件沙箱环境
   - 官方插件市场
   - 性能监控

---

## 快速参考

### 常用命令

```bash
# 查看任务
cat TASKS.md

# 查看状态
cat memories/consensus.md

# 运行测试
npm test

# 类型检查
npm run typecheck

# 构建
npm run build

# 提交并推送
git add . && git commit -m "message" && git push
```

### 文件位置

| 文件 | 用途 |
|------|------|
| `TASKS.md` | 任务清单 |
| `memories/consensus.md` | 项目状态和决策记录 |
| `CLAUDE.md` | 项目使命和架构 |
| `.claude/agents/` | Agent 角色定义 |
| `.claude/skills/team/SKILL.md` | 动态组队 |

---

**记住**：
1. **每完成 10 个有意义的任务** → 发周期汇总邮件
2. **git commit 不算任务**，只算功能开发/修复/规划
3. **版本完成不发邮件**（TASKS.md 空时会发，避免重复）
4. **永远不要添加埋点功能**
5. **⚠️ 工作流文件（CLAUDE.md、PROMPT.md、auto_loop.py）不能被修改**
6. **⚠️ 每次提交后必须 git push**
