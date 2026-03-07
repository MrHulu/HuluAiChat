# Contributing to HuluChat

感谢你对 HuluChat 的贡献兴趣！

## 快速开始

1. Fork 本仓库
2. 克隆你的 Fork：`git clone https://github.com/YOUR_USERNAME/HuluChat.git`
3. 进入项目目录：`cd HuluChat/huluchat-v3`
4. 安装依赖：`npm install`
5. 安装 Python 依赖：`pip install -r ../requirements.txt`
6. 启动开发环境：`npm run tauri dev`

## 开发规范

### 代码风格

- **TypeScript/React**: 使用 ESLint + Prettier
- **Python**: 使用 Black + isort
- **Rust**: 使用 rustfmt

### 提交信息

使用 Conventional Commits 格式：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 杂项

### 分支命名

- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `refactor/xxx` - 代码重构

## 提交 PR

1. 创建功能分支：`git checkout -b feature/your-feature`
2. 进行更改并测试：`npm run test:run`
3. 提交更改：`git commit -m "feat: your feature"`
4. 推送到 Fork：`git push origin feature/your-feature`
5. 在 GitHub 上创建 Pull Request

## 核心原则

### 隐私优先

**重要**：HuluChat 是一个隐私优先的应用，以下功能**禁止添加**：

- ❌ 用户行为埋点
- ❌ 数据追踪/遥测
- ❌ 使用统计上报

任何涉及用户数据收集的功能都需要在 PR 中明确说明并获得批准。

## 需要帮助？

- 查看 [README.md](README.md) 了解项目架构
- 在 [Issues](https://github.com/MrHulu/HuluChat/issues) 提问
- 加入讨论

## 许可证

贡献的代码将以 MIT 许可证发布。
