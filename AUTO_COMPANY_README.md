# Auto-Company 组件移植说明

本项目已集成 auto-company 框架，实现 AI 自主编程能力。

## 目录结构

```
.claude/
├── agents/          # 14个专家AI Agent定义
│   ├── ceo-bezos.md
│   ├── fullstack-dhh.md
│   └── ...
└── skills/          # 30+专业技能
    ├── team/
    ├── deep-research/
    ├── web-scraping/
    └── ...

memories/
└── consensus.md     # 跨周期状态记忆

docs/                # Agent工作产出目录
├── ceo/
├── fullstack/
└── ...

auto_loop.py         # 主循环脚本 (跨平台)
monitor.py           # 监控脚本 (跨平台)
Makefile             # Make 命令
```

## 快速开始

### 方式 1: 使用 Make (推荐)

```bash
# 启动自动循环
make start

# 查看状态
make status

# 查看实时日志
make monitor

# 停止运行
make stop

# 查看所有命令
make help
```

### 方式 2: 直接使用 Python

```bash
# 启动自动循环
python auto_loop.py

# 查看状态
python monitor.py --status

# 查看实时日志
python monitor.py

# 停止运行
python auto_loop.py --stop
```

### 方式 3: 单次任务

在 Claude Code 中使用 team 技能：

```
/team 为 HuluChat 添加多语言切换功能
```

## 可用 Agent

| Agent | 专长 |
|-------|------|
| fullstack-dhh | 代码实现、技术方案、开发 |
| ceo-bezos | 战略决策、优先级 |
| cto-vogels | 技术架构、系统设计 |
| critic-munger | 质疑决策、识别缺陷 |
| product-norman | 产品定义、用户体验 |
| ui-duarte | 视觉设计、配色排版 |
| interaction-cooper | 用户流程、交互模式 |
| qa-bach | 测试策略、质量把控 |
| devops-hightower | 部署流水线、CI/CD |
| marketing-godin | 定位、品牌、获客 |
| operations-pg | 用户运营、增长 |
| sales-ross | 销售漏斗、转化策略 |
| cfo-campbell | 定价策略、财务模型 |
| research-thompson | 市场调研、竞品分析 |

## Make 命令

| 命令 | 说明 |
|------|------|
| `make start` | 启动自动循环 |
| `make stop` | 停止循环 |
| `make status` | 显示状态和最新共识 |
| `make last` | 显示上一个周期的完整输出 |
| `make cycles` | 显示周期历史摘要 |
| `make monitor` | 实时查看日志 (Ctrl+C 退出) |
| `make team` | 启动交互式 Claude 会话 |
| `make clean-logs` | 清除所有周期日志 |
| `make help` | 显示帮助信息 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `AUTO_MODEL` | opus | Claude 模型选择 |
| `AUTO_LOOP_INTERVAL` | 30 | 周期间隔秒数 |
| `AUTO_CYCLE_TIMEOUT` | 1800 | 单个周期超时秒数 |
| `AUTO_MAX_ERRORS` | 5 | 熔断器阈值 |
| `AUTO_COOLDOWN` | 300 | 熔断后冷却秒数 |
| `AUTO_LIMIT_WAIT` | 3600 | API 限额等待秒数 |
| `AUTO_MAX_LOGS` | 200 | 最大保留日志数 |

示例：
```bash
AUTO_MODEL=sonnet AUTO_LOOP_INTERVAL=60 make start
```

## 工作流程

1. **看共识** - 读取 `memories/consensus.md` 获取当前状态
2. **决策** - 根据共识决定下一步行动
3. **组队** - 使用 team 技能组建 2-5 人团队
4. **执行** - 各 Agent 协作完成任务
5. **更新共识** - 记录进展和下一步行动

## 共识格式

每次更新 `memories/consensus.md` 需遵循：

```markdown
# HuluChat Auto-Code Consensus

## Last Updated
[时间戳]

## Current Phase
[当前阶段]

## What We Did This Cycle
- [做了什么]

## Key Decisions Made
- [决策 + 理由]

## Active Projects
- [项目]: [状态] — [下一步]

## Next Action
[下一轮最重要的一件事]

## Project State
- 当前功能: [描述]
- 技术栈: [框架]
- 待处理: [事项]

## Open Questions
- [待思考的问题]
```

## 核心技能

| 技能 | 用途 |
|------|------|
| team | 组建临时团队 |
| deep-research | 深度研究分析 |
| web-scraping | 网页数据抓取 |
| code-review-security | 代码审查 |
| micro-saas-launcher | 快速启动项目 |

## 安全红线

- 禁止删除 GitHub 仓库
- 禁止删除系统文件
- 禁止非法活动
- 禁止泄露 API 密钥

## 平台支持

- ✅ Windows (Python 脚本)
- ✅ macOS (Python 脚本 + Make)
- ✅ Linux (Python 脚本 + Make)

## 原始项目

移植自: auto-company
