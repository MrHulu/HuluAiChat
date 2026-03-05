# HuluChat 用户指南

欢迎使用 HuluChat！这是一款极简、跨平台的 AI 聊天桌面应用，支持 GPT-4、Claude、Gemini 等多模型快速切换。

---

## 📥 下载与安装

### Windows 用户

1. 前往 [Releases 页面](https://github.com/MrHulu/HuluAiChat/releases)
2. 下载最新版本的 `.exe` 安装包（或 `.msi`）
3. 双击安装，按提示完成

### macOS 用户

1. 前往 [Releases 页面](https://github.com/MrHulu/HuluAiChat/releases)
2. 下载 `.dmg` 文件
3. 打开 DMG，将 HuluChat 拖入 Applications 文件夹

### Linux 用户

1. 前往 [Releases 页面](https://github.com/MrHulu/HuluAiChat/releases)
2. 下载 `.AppImage` 文件
3. 添加执行权限：`chmod +x HuluChat_*.AppImage`
4. 双击运行

### 开发者/源码运行

```bash
# 克隆仓库
git clone https://github.com/MrHulu/HuluAiChat.git
cd HuluAiChat/huluchat-v3

# 安装依赖
npm install

# 安装 Python 后端依赖
cd ../src-tauri/python
pip install -r requirements.txt

# 运行开发模式
cd ../../huluchat-v3
npm run tauri dev
```

---

## 🚀 首次配置

### 步骤 1：添加 AI 模型提供商

首次启动后，你需要配置至少一个 AI 模型提供商：

1. 点击右上角的 **⚙️ 设置** 按钮
2. 在弹出的设置窗口中，点击 **"添加提供商"** 按钮
3. 填写以下信息：

| 字段 | 说明 | 示例 |
|------|------|------|
| **名称** | 给这个模型起个名字 | "我的 GPT-4"、"DeepSeek" |
| **Base URL** | API 服务地址 | `https://api.openai.com/v1` |
| **API Key** | 你的 API 密钥 | `sk-xxxxxxxxxxxx` |
| **Model ID** | 模型标识符 | `gpt-4o`, `deepseek-chat` |

### 常用 API 配置示例

**OpenAI 官方**
```
名称: OpenAI
Base URL: https://api.openai.com/v1
API Key: sk-xxxxxxxxxxxx
Model ID: gpt-4o
```

**DeepSeek**
```
名称: DeepSeek
Base URL: https://api.deepseek.com/v1
API Key: sk-xxxxxxxxxxxx
Model ID: deepseek-chat
```

**详细配置指南**: 参考 [API 配置指南](API_SETUP.md)

### 步骤 2：快速切换模型

点击顶部的模型选择器，即可在不同模型间快速切换。

---

## 💬 开始聊天

### 发送消息

1. 在输入框中输入你的问题
2. 按 **Enter** 发送（或 **Shift + Enter** 换行）
3. AI 的回复会逐字流式显示

### 会话管理

| 操作 | 方法 |
|------|------|
| 新建会话 | 点击左侧 **+** 按钮或 `Ctrl/Cmd + N` |
| 切换会话 | 点击左侧会话列表 |
| 重命名会话 | 双击会话名称 |
| 删除会话 | 右键点击会话 → 删除 |

### 文件夹分组

用文件夹整理你的对话：

1. 点击侧边栏底部的 **"新建文件夹"** 按钮
2. 拖拽会话到文件夹中
3. 右键文件夹可以重命名或删除

---

## 🔍 搜索功能

### 全局搜索

快速搜索所有对话内容：

| 快捷键 | 功能 |
|--------|------|
| **Ctrl/Cmd + K** | 打开全局搜索 |
| **Escape** | 关闭搜索 |

搜索匹配的消息会高亮显示。

---

## 📤 导出对话

支持三种格式导出：

| 格式 | 说明 |
|------|------|
| **Markdown** | 保留格式，适合博客发布 |
| **JSON** | 结构化数据，适合备份 |
| **TXT** | 纯文本，适合快速分享 |

导出方法：右键点击会话 → 导出 → 选择格式

---

## ⌨️ 快捷键一览

### 通用

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建会话 |
| `Ctrl/Cmd + K` | 全局搜索 |
| `Ctrl/Cmd + ,` | 打开设置 |
| `Ctrl/Cmd + Q` | 退出应用 |

### 会话

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Shift + N` | 新建文件夹 |
| `Delete` | 删除选中项 |
| `F2` | 重命名 |

### 聊天

| 快捷键 | 功能 |
|--------|------|
| `Enter` | 发送消息 |
| `Shift + Enter` | 换行 |
| `Ctrl/Cmd + C` | 复制选中消息 |

### 帮助

| 快捷键 | 功能 |
|--------|------|
| `?` | 显示快捷键帮助 |
| `F1` | 打开用户指南 |

---

## 🎨 界面自定义

### 切换主题

1. 打开设置（`Ctrl/Cmd + ,`）
2. 在 **"外观"** 中选择：
   - **Light** - 亮色主题
   - **Dark** - 暗色主题
   - **System** - 跟随系统

### 折叠/展开侧边栏

- 点击左上角的 **☰** 图标
- 或使用快捷键 `Ctrl/Cmd + B`

---

## ❓ 常见问题

### Q: 提示 "未配置模型提供商" 怎么办？

**A:** 需要先在设置中添加至少一个模型提供商。参考上面的「首次配置」部分。

### Q: 消息发送失败怎么办？

**A:** 检查以下几点：
1. API Key 是否正确
2. Base URL 是否正确（注意不要有多余的空格）
3. 网络连接是否正常
4. API 配额是否用完

### Q: 数据存储在哪里？

**A:** 配置和聊天记录存储在系统应用数据目录：

| 系统 | 路径 |
|------|------|
| Windows | `%APPDATA%\HuluChat\` |
| Linux | `~/.config/HuluChat/` |
| macOS | `~/Library/Application Support/HuluChat/` |

### Q: 可以更换电脑后保留聊天记录吗？

**A:** 可以！将上述目录中的文件复制到新电脑的相同位置即可。

### Q: 支持哪些 AI 模型？

**A:** 任何兼容 OpenAI API 格式的模型都支持，包括：
- OpenAI 官方模型（GPT-4o、o1 等）
- DeepSeek、Claude（通过中转）
- Google Gemini
- Azure OpenAI
- 本地部署的模型（Ollama、LM Studio 等）

### Q: 如何使用本地模型？

**A:** 安装 Ollama 后，在设置中添加：
```
Base URL: http://localhost:11434/v1
API Key: ollama
Model ID: llama3（或你下载的模型）
```

---

## 🔄 更新应用

### 自动更新

HuluChat 支持自动更新。当有新版本时，会弹出提示。

### 手动更新

1. 前往 [Releases 页面](https://github.com/MrHulu/HuluAiChat/releases)
2. 下载最新版本
3. 安装覆盖

你的配置和聊天记录会自动保留。

---

## 📞 获取帮助

遇到问题？

- 🐛 [报告 Bug](https://github.com/MrHulu/HuluAiChat/issues)
- 💡 [功能建议](https://github.com/MrHulu/HuluAiChat/issues)
- 📖 [查看源码](https://github.com/MrHulu/HuluAiChat)

---

<p align="center">
  <sub>🍵 祝你使用愉快！有问题随时反馈。</sub>
</p>
