# HuluChat

轻量桌面 AI 聊天应用：多模型切换、流式对话、本地历史、可打包分发。

## 运行开发环境

1. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```
2. 启动应用：
   ```bash
   python main.py
   ```
   或：
   ```bash
   python -m src.main
   ```

## 打包为 exe（Windows）

1. 安装 PyInstaller：
   ```bash
   pip install pyinstaller
   ```
2. 在项目根目录执行：
   ```bash
   pyinstaller HuluChat.spec
   ```
3. 生成的可执行文件在 `dist/HuluChat.exe`。运行 exe 时，配置与数据库仍使用用户目录，不写入 exe 所在目录。

## 配置与数据文件位置

应用使用**应用数据根目录**存放配置与 SQLite 数据库，不依赖进程当前工作目录：

- **Windows**：`%APPDATA%/HuluChat`
- **Linux**：`$XDG_CONFIG_HOME/HuluChat` 或 `~/.config/HuluChat`
- **macOS**：`~/Library/Application Support/HuluChat`

目录内文件：

- `config.json`：Provider 列表、当前模型、主题、侧边栏展开状态
- `chat.db`：会话与消息 SQLite 数据库

首次运行时会自动创建该目录；未配置任何 Provider 时需在「设置」中添加模型（Base URL、API Key、Model ID）后再发送消息。
