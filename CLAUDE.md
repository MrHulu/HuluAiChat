# HuluChat - AI Chat Desktop Application

## 🎯 Project Mission

Build a **privacy-first** AI chat desktop application with multi-model support, RAG capabilities, and plugin system.

### Core Principles

1. **Privacy First** - No telemetry, no analytics, no user tracking
2. **User Control** - Local-first, user owns their data
3. **Multi-Model** - Support OpenAI, DeepSeek, local models (Ollama)
4. **Extensible** - Plugin system for custom functionality
5. **Cross-Platform** - Windows, macOS, Linux (Tauri 2.0)

---

## 🚫 Prohibited Features

**BOSS REQUIREMENT**: The following features are **explicitly prohibited**:

| Feature | Status | Reason |
|---------|--------|--------|
| **User Analytics/Tracking** | ❌ **PROHIBITED** | Boss explicitly requested no analytics |
| **Telemetry** | ❌ **PROHIBITED** | Privacy-first principle |
| **Data Collection** | ❌ **PROHIBITED** | No user data collection without explicit consent |

**Important**: Any feature involving user data collection or behavior tracking requires **explicit Boss approval**!

---

## 🏗️ Architecture

### Tech Stack (v3.x)

| Layer | Technology |
|-------|-----------|
| **Frontend** | Tauri 2.0, React 19, TypeScript, Tailwind v4, shadcn/ui |
| **Backend** | FastAPI, Python 3.14, SQLite |
| **Build** | Tauri CLI, GitHub Actions CI/CD |
| **Testing** | Vitest, Playwright (E2E) |

### Project Structure

```
HuluChat/
├── huluchat-v3/              # Main application
│   ├── src/                  # Frontend source
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── plugins/          # Plugin system
│   │   ├── stores/           # State management
│   │   └── utils/            # Utilities
│   ├── src-tauri/            # Tauri Rust backend
│   └── backend/              # Python FastAPI backend
│       ├── api/              # REST API endpoints
│       ├── services/         # Business logic
│       └── tests/            # Backend tests
├── website/                  # Official website (Next.js)
├── docs/                     # Documentation
├── tests/                    # E2E tests
└── plugins/                  # Example plugins
```

---

## 🤖 AI Agent Team (14 Agents)

### Decision Layer
| Agent | Role |
|-------|------|
| `ceo-bezos` | Strategic decisions, priorities |
| `cfo-campbell` | Pricing, financial models |
| `critic-munger` | **Critical thinking** (must consult for major decisions) |

### Technical Layer
| Agent | Role |
|-------|------|
| `cto-vogels` | Architecture, technology selection |
| `fullstack-dhh` | Implementation, main developer |
| `qa-bach` | Testing, quality assurance |
| `devops-hightower` | CI/CD, deployment |

### Product Layer
| Agent | Role |
|-------|------|
| `product-norman` | Product definition, UX |
| `ui-duarte` | Visual design, UI |
| `interaction-cooper` | Interaction flow, user journey |

### Growth Layer
| Agent | Role |
|-------|------|
| `marketing-godin` | Brand, acquisition, content |
| `operations-pg` | User operations, growth |
| `sales-ross` | Sales, conversion |
| `research-thompson` | Market research, competitive analysis |

---

## 📋 Workflow

### Auto Company Pattern

This project uses the **Auto Company** pattern with autonomous AI agents:

1. **Boss (User)**: Gives directions, approves plans
2. **Secretary (This AI)**: Reports status, conveys orders
3. **Agents (Autonomous)**: Execute tasks independently

### Control Interface

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Mission, team, principles (this file) |
| `PROMPT.md` | Workflow instructions, cycle rules |
| `TASKS.md` | Task list |
| `memories/consensus.md` | Cross-cycle memory (main control) |
| `.claude/agents/` | Agent role definitions |
| `.claude/skills/team/SKILL.md` | Dynamic team assembly |

### Cycle Rules

**Every cycle must**:
1. ✅ Read consensus.md
2. ✅ Read TASKS.md
3. ✅ Execute one task (or complete a phase)
4. ✅ Update consensus.md
5. ✅ Update TASKS.md (if task completed)
6. ✅ Commit code (if changes)
7. ✅ **Check if phase completed** → Send email if yes
8. ✅ Check for remaining tasks
9. ⚠️ **If none** → Send email to Boss

---

## 🚫 Feature Restrictions

### No Analytics

**DO NOT** add any of the following without **explicit Boss approval**:
- User behavior tracking
- Usage analytics
- Telemetry
- Crash reporting (with data collection)
- A/B testing
- Funnel analysis

**Allowed**:
- Anonymous error logging (local only)
- Performance metrics (local only)
- User-initiated feedback

### Decision Process

If planning a feature that **might** involve data collection:

1. **Stop immediately**
2. **Consult Boss first**
3. **Get explicit approval** before proceeding

---

## 📊 Current Status

- **Version**: v3.48.0
- **Tech Stack**: Tauri 2.0, React 19, FastAPI, Python 3.14
- **Tests**: 760+ passing
- **Platform**: Windows, macOS, Linux
- **License**: Open Source

---

## 🎯 Success Metrics

**Privacy-First Metrics**:
- Zero user data collection
- Zero telemetry
- Zero analytics
- 100% local-first
- User data remains on device

**Quality Metrics**:
- Test coverage > 80%
- Zero critical bugs
- Fast startup time (< 2s)
- Low memory footprint (< 200MB)

---

## 📞 Contact

**Boss**: 491849417@qq.com
**Project**: https://github.com/MrHulu/HuluAiChat
**Website**: https://huluchat-website.pages.dev

---

*Remember: Privacy First, No Analytics, User Data Stays Local!*
