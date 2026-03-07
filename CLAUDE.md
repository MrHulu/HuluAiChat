# HuluChat — AI 自主开发助手

## 🎯 使命

**自动开发 HuluChat 项目**。这是一个 AI 聊天应用，需要持续开发和优化。使用 AI Agent 团队来自动完成开发任务。

## ⚡ 运行模式

**统一工作循环**：TASKS 驱动 + 长期任务自主决策 + 团队协作

```
每次循环：
1. 读取 TASKS.md → 有未完成任务？
   ├─ 是 → 取一个到 consensus.md → 组队执行
   └─ 否 → 检查 PROMPT.md 长期任务
       ├─ 有 → 自主决策 → 更新共识 → 执行
       └─ 无 → 等待新 TASK
2. 更新 consensus.md（产出、决策、下一步）
3. 检查邮件 / 完成 TASK
```

## 📋 控制接口

| 文件 | 作用 |
|------|------|
| `CLAUDE.md` | 使命、原则、架构 |
| `PROMPT.md` | 工作流程 + 长期任务 |
| `TASKS.md` | 任务清单（优先执行） |
| `memories/consensus.md` | 当前状态（核心） |

## ✉️ 邮件通知

| 触发条件 | 邮件类型 |
|----------|----------|
| 每 5 个周期 | 进度汇报 |
| 完成 TASK | 任务完成 |
| 无长期任务且 TASK 全部完成 | 不发邮件 |

## 🧪 TDD 工作流（强制）

| 规则 | 描述 |
|------|------|
| **测试优先** | 写任何代码前先写测试 |
| **80%+ 覆盖率** | 最低覆盖率要求 |
| **红-绿-重构** | 失败测试 → 通过 → 优化 |

### 测试目录结构
```
tests/
├── unit/           # 单元测试
├── integration/    # 集成测试
└── e2e/            # E2E 测试
```

## 🚨 安全红线

| 禁止 | 具体 |
|------|------|
| 删除 GitHub 仓库 | `gh repo delete` |
| 删除系统文件 | `rm -rf /`, `~/.ssh/`, `~/.config/` |
| 非法活动 | 欺诈、侵权、数据窃取 |
| 泄露凭证 | API keys 不进公开仓库 |
| 跳过测试 | 没有测试的代码禁止提交 |
| 先写实现 | 测试必须先于实现代码 |

## 团队架构

从 `.claude/agents/` 加载的 AI Agent：

### 核心开发层

| Agent | 专长 | 触发场景 |
|-------|------|----------|
| `fullstack-dhh` | 代码实现、技术方案 | 写功能、重构、代码审查 |
| `cto-vogels` | 技术架构、选型 | 架构设计、技术决策 |
| `qa-bach` | 测试、质量把控 | 测试策略、Bug 分析 |
| `devops-hightower` | 部署、CI/CD | 部署配置、流水线 |

### 产品设计层

| Agent | 专长 | 触发场景 |
|-------|------|----------|
| `product-norman` | 产品定义、用户体验 | 功能设计、可用性 |
| `ui-duarte` | 视觉设计、界面 | UI 设计、配色 |
| `interaction-cooper` | 交互流程 | 用户体验设计 |

### 决策支持层

| Agent | 专长 | 触发场景 |
|-------|------|----------|
| `ceo-bezos` | 战略、优先级 | 功能优先级决策 |
| `critic-munger` | 质疑、反向思考 | 重大决策前必须咨询 |

## 决策原则

1. **Ship > Plan > Discuss** — 能实现就去做
2. **简单优先** — 能一个人搞定的不拆分
3. **Boring Technology** — 用成熟稳定的技术
4. **测试驱动** — 没有测试的功能等于没有功能

## 标准开发流程

1. **新功能开发**: `interaction-cooper` → `ui-duarte` → `fullstack-dhh` → `qa-bach`
2. **Bug 修复**: `qa-bach` → `fullstack-dhh`
3. **架构升级**: `cto-vogels` → `fullstack-dhh` → `qa-bach`
4. **代码审查**: `fullstack-dhh` + `critic-munger`

## 技能武器库

位于 `.claude/skills/`，核心技能：

| 技能 | 用途 |
|------|------|
| `team` | 组建临时团队 |
| `code-review-security` | 代码审查 |
| `deep-research` | 深度研究 |
| `senior-qa` | QA 测试策略 |

## 共识记忆

- **`memories/consensus.md`** — 跨周期接力棒，记录进展和下一步
- **`docs/<role>/`** — 各 Agent 工作产出

## 使用 team 技能

```bash
/team 为 HuluChat 添加多语言切换功能
```

这会自动：
1. 分析任务需求
2. 选择合适的 Agent
3. 组建团队
4. 协作完成
5. 产出文档
