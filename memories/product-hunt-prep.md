# Product Hunt 发布素材准备计划

> **Boss 指令**: 既然安装了 agent-browser，提供了 API Key，可以自己准备素材了
> **时间**: 2026-03-13

---

## 🎯 目标

使用 agent-browser 自动化准备 Product Hunt 发布所需的所有素材：
1. 📸 **应用截图** - 展示核心功能
2. 🎬 **演示视频** - GIF/短视频展示工作流
3. 📝 **产品描述** - 英文介绍
4. 🏷️ **标签** - Product Hunt 分类标签

---

## 📋 素材清单

### 必需素材 (P0)

#### 1. 应用截图 (5-10 张)
- [ ] **主界面截图** - 展示整体 UI
  - 深色模式
  - 浅色模式
- [ ] **多模型切换** - 展示模型选择和切换
- [ ] **文档对话** - 展示 RAG 功能
- [ ] **会话管理** - 展示文件夹、搜索、导出
- [ ] **快速面板** - 展示 QuickPanel 功能
- [ ] **设置界面** - 展示 API Key 配置

#### 2. 演示视频 (1-2 个)
- [ ] **核心功能演示** (30-60秒)
  - 启动应用
  - 创建会话
  - 发送消息
  - 切换模型
  - 导出对话
- [ ] **特色功能演示** (15-30秒)
  - QuickPanel 快速提问
  - 文档对话

#### 3. 产品文案
- [ ] **产品名称** - HuluChat
- [ ] **一句话描述** - AI Chat Desktop App for Power Users
- [ ] **详细描述** - 英文 100-200 字
- [ ] **亮点列表** - 3-5 个核心卖点

---

## 🤖 agent-browser 自动化计划

### Phase 1: 启动应用并截图

```bash
# 1. 启动 HuluChat 应用
cd D:/HuluMan/project/HuluChat/huluchat-v3
npm run tauri dev

# 2. 使用 agent-browser 连接到应用
# (Tauri dev server 通常在 localhost:1420)
agent-browser open http://localhost:1420

# 3. 截取主界面
agent-browser screenshot --output product-hunt/screenshots/main-dark.png
agent-browser screenshot --output product-hunt/screenshots/main-light.png

# 4. 更多功能截图...
```

### Phase 2: 录制演示视频

```bash
# 使用 agent-browser 录制功能
agent-browser record --output product-hunt/videos/demo-core.gif
# 执行操作...
agent-browser stop-record
```

### Phase 3: 测试真实功能

使用 Boss 提供的 API Key:
- API Key: `3dd751ddf5044ef1bdb7516b9a515803.t9ED8Z9mbfPdrwlc`
- Base URL: `https://open.bigmodel.cn/api/coding/paas/v4`
- Model: `glm-5`

测试场景:
1. 配置 API Key
2. 创建新会话
3. 发送真实消息
4. 验证 AI 回复
5. 测试多模型切换

---

## 📁 输出目录结构

```
product-hunt/
├── screenshots/
│   ├── main-dark.png
│   ├── main-light.png
│   ├── multi-model.png
│   ├── doc-chat.png
│   ├── session-management.png
│   ├── quickpanel.png
│   └── settings.png
├── videos/
│   ├── demo-core.gif
│   └── demo-quickpanel.gif
├── copy/
│   ├── title.md
│   ├── description.md
│   └── highlights.md
└── checklist.md
```

---

## 🎬 执行计划

### Step 1: 创建目录结构
```bash
cd D:/HuluMan/project/HuluChat
mkdir -p product-hunt/screenshots
mkdir -p product-hunt/videos
mkdir -p product-hunt/copy
```

### Step 2: 启动应用并截图
使用 agent-browser:
1. 启动 Tauri dev server
2. 打开 localhost:1420
3. 截取各种功能界面

### Step 3: 录制演示视频
1. 准备演示脚本
2. 使用 agent-browser 录制
3. 转换为 GIF (优化大小)

### Step 4: 编写产品文案
1. 分析竞品 (Product Hunt 类似产品)
2. 编写吸引人的标题和描述
3. 突出核心卖点

### Step 5: 质量检查
1. 所有截图清晰美观
2. 视频流畅展示核心功能
3. 文案语法正确、吸引力强

---

## ✅ 验收标准

- [ ] 至少 5 张高质量截图
- [ ] 至少 1 个演示视频 (GIF)
- [ ] 完整的产品文案 (英文)
- [ ] 所有素材准备就绪，可直接上传 Product Hunt

---

*立即开始执行！*
