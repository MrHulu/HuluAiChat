# Auto Company - 工作流程

> 本文档定义 AI Agent 的自主工作流程

## 核心原则

1. **自主决策** - 完成任务后自动规划下一个版本，无需等待
2. **TDD 优先** - 测试驱动开发
3. **小步提交** - 频繁提交，便于回滚
4. **文档同步** - 代码和文档同步更新
5. **进度汇报** - 每完成一个 Phase 发邮件给 Boss ⚠️ **重要**

---

## 工作流程

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

4. **提交代码**
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

3. **输出文档**
   - 保存到 `docs/` 目录
   - 更新 consensus.md

### Phase 3: 完成任务

1. **更新 TASKS.md**
   - 将任务从"待开始"移到"已完成"
   - 记录完成时间

2. **更新 consensus.md**
   - 记录完成情况
   - 更新 Company State

3. **检查下一个任务**
   - 查看 TASKS.md 是否还有待开始任务
   - 如果有 → 返回 Phase 1
   - **如果没有 → 进入 Phase 4**

### Phase 3.5: 进度汇报 ⚠️ **新增**

**当开发任务包含多个 Phase 时，每个 Phase 完成后必须发邮件给 Boss**

#### 触发条件

- ✅ 完成一个开发 Phase（如 Phase 1, Phase 2, Phase 2.5）
- ✅ 代码已提交并合并
- ✅ 测试全部通过

#### 邮件模板

```bash
cd D:/HuluMan/project/ai-center
python .claude/skills/email-sender/scripts/send.py \
  --to "491849417@qq.com" \
  --subject "[HuluChat] 进度汇报 - TASK-XXX Phase Y 完成" \
  --body "Hi Boss,

TASK-XXX 进度更新：
- 任务：{任务名称}
- Phase {Y}: {Phase 名称} ✅ 完成

本阶段成果：
- {列出完成的功能}
- {代码改动统计}
- {测试结果}

下一步：
- Phase {Z}: {下一阶段名称}

整体进度：{X}%

---
AI Assistant
AI Center Secretary"
```

#### 记录发送

在 `memories/consensus.md` 中添加：

```markdown
## 进度汇报记录
- **Cycle #{N}**: Phase {Y} 完成 - ✅ 邮件已发送
```

---

### Phase 4: 无任务时的处理

**当 TASKS.md 中"待开始"区域为空时，必须执行以下操作**：

#### 步骤 1: 检查当前状态

- 查看 `memories/consensus.md`
- 确认所有任务确实已完成
- 检查是否有未合并的 PR

#### 步骤 2: 发邮件给 Boss

**使用秘书的邮件系统发送决策请求邮件**：

```bash
cd D:/HuluMan/project/ai-center
python .claude/skills/email-sender/scripts/send.py \
  --to "491849417@qq.com" \
  --subject "[HuluChat] 所有任务完成 - 等待指示" \
  --body "Hi Boss,

HuluChat 所有短期任务已完成，当前状态：
- 版本：{当前版本}
- 周期：{当前周期}
- 已完成：{列出完成的任务}

等待决策：下一步方向

选项：
A. 发布新版本
B. 规划下一个版本（v3.XX.0）
C. 执行长期任务（UI 重构、UI/UX 优化等）

默认推荐：B（规划下一个版本）

📧 若 5 分钟内未收到回复，将自动执行选项 B。

请确认或给出其他指示。

---
AI Assistant
AI Center Secretary"
```

#### 步骤 3: 记录邮件发送

在 `memories/consensus.md` 中添加：

```markdown
## 邮件发送记录
- **时间**: {当前时间}
- **主题**: [HuluChat] 所有任务完成 - 等待指示
- **状态**: ✅ 已发送
- **等待**: Boss 回复或 5 分钟后自动执行
```

#### 步骤 4: 等待或自动执行

**如果 5 分钟内收到 Boss 回复**：
- 按照 Boss 的指示执行

**如果 5 分钟内未收到回复**：
- **自动执行选项 B：规划下一个版本**
- 使用 `/team` 组建完整 Agent 团队
- 执行自主决策流程

---

## 循环规则

### 每个周期必须执行

1. ✅ 读取 consensus.md
2. ✅ 读取 TASKS.md
3. ✅ 执行一个任务（或完成一个阶段）
4. ✅ 更新 consensus.md
5. ✅ 更新 TASKS.md（如果任务完成）
6. ✅ 提交代码（如果有代码变更）
7. ✅ **检查是否完成一个 Phase** → 如果是，发邮件 ⚠️
8. ✅ 检查是否还有待开始任务
9. ⚠️ **如果没有 → 发邮件给 Boss**

### 中断条件

- 遇到无法解决的技术问题（记录到 consensus.md 的 Open Questions）
- 需要 Boss 手动操作（如配置 Cloudflare Secrets）

---

## 自动停止条件

以下情况会暂停自动循环，创建 `.auto-loop-paused` 文件：

1. 连续 3 个周期遇到同一个阻塞问题
2. CI 构建失败且无法自动修复
3. 发现 P0 级 Bug

---

## 长期任务清单

当自动执行"规划下一个版本"时，参考以下顺序：

1. **默认任务**：规划下一个版本（v3.XX.0）
   - 使用 Agent 团队协作
   - 必须咨询 critic-munger

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

# 提交
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
1. 每个 Phase 完成后**必须发进度邮件给 Boss**
2. 所有任务完成时**必须发邮件给 Boss**
3. 不要让 Boss 猜测进度！
