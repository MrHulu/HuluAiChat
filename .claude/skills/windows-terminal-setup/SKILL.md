---
name: windows-terminal-setup
description: Windows Terminal + PowerShell 7 + Oh My Posh 一键现代化配置。在新 Windows 机器上安装和配置类 macOS 的高效终端体验，包括：PowerShell 7、Oh My Posh 主题、Terminal-Icons 图标、PSReadLine 智能编辑、JetBrainsMono Nerd Font、Shell Integration（新标签页继承目录）。使用场景：新电脑配置、重装系统后配置、团队开发环境统一。
---

# Windows Terminal 现代化配置

在新 Windows 机器上一键配置类似 macOS + Oh My Zsh 的高效终端体验。

## 快速开始

运行安装脚本：

```powershell
# 以管理员身份运行 PowerShell 5.1
Set-ExecutionPolicy Bypass -Scope Process -Force
Invoke-RestMethod -Uri "https://raw.githubusercontent.com/..." -OutFile "$env:TEMP\setup.ps1"
& "$env:TEMP\setup.ps1"
```

或手动执行下面的安装步骤。

## 安装步骤

### 1. 安装 PowerShell 7

```powershell
winget install Microsoft.PowerShell --accept-source-agreements --accept-package-agreements
```

**⚠️ 踩坑：** 安装后需要添加到 PATH 并重启终端才能生效。用完整路径验证：
```powershell
"C:\Program Files\PowerShell\7\pwsh.exe" -Version
```

### 2. 安装 Oh My Posh

```powershell
winget install JanDeDobbeleer.OhMyPosh --accept-source-agreements --accept-package-agreements
```

### 3. 安装 Nerd Font

```powershell
winget install DEVCOM.JetBrainsMonoNerdFont --accept-source-agreements --accept-package-agreements
```

**⚠️ 踩坑：** 字体安装后需在 Windows Terminal settings.json 中设置 `font.face`，否则图标显示为方块。

### 4. 安装 Terminal-Icons 模块

```powershell
pwsh -Command "Install-Module -Name Terminal-Icons -Repository PSGallery -Force -Scope CurrentUser"
```

### 5. 配置 PowerShell 7 Profile

运行 `scripts/install_profile.ps1` 或手动复制 `assets/Microsoft.PowerShell_profile.ps1` 到：
```
C:\Users\<用户名>\Documents\PowerShell\Microsoft.PowerShell_profile.ps1
```

**⚠️ 踩坑：** Oh My Posh 主题 URL 方式加载可能慢，首次启动有延迟是正常的。

### 6. 配置 Windows Terminal

运行 `scripts/install_settings.ps1` 或手动配置 `settings.json`：
- 位置：`%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`
- 关键配置：
  - `defaultProfile`: PowerShell 7 的 GUID
  - `font.face`: "JetBrainsMono Nerd Font"
  - `font.size`: 10
  - `autoMarkPrompts`: true
  - `showMarksOnScrollbar`: true
  - `source`: "Windows.Terminal.PowershellCore" (启用 Shell Integration)

**⚠️ 踩坑：**
1. JSON 语法错误（如尾逗号）会导致终端无法加载配置，回退到默认设置
2. `pwsh.exe` 在 PATH 更新前无法启动，需用完整路径或重启
3. Shell Integration 功能在旧版 Windows Terminal 不支持，需版本 1.18+

### 7. 添加 PowerShell 7 到 PATH

```powershell
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PowerShell\7\", [EnvironmentVariableTarget]::User)
```

**⚠️ 踩坑：** PATH 更新后需**完全重启 Windows Terminal** 才能生效。

### 8. 验证配置

```powershell
# 1. 打开 Windows Terminal，选择 "PowerShell 7"
# 2. 应该看到 Oh My Posh 主题（带路径、git 状态）
# 3. 输入命令时应该有预测提示
# 4. cd 到某个目录，新建标签页应该继承该目录
```

## 踩坑总结

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `pwsh.exe` 找不到 | PATH 未更新 | 用完整路径 `C:\Program Files\PowerShell\7\pwsh.exe` 或添加 PATH 后重启终端 |
| JSON 配置加载失败 | 语法错误（如尾逗号、不支持的动作） | 删除不支持的 action，使用标准 JSON 格式 |
| CONFIG NOT FOUND | Oh My Posh 主题路径错误 | 使用 URL 方式加载或确保主题文件存在 |
| 字体显示方块 | Nerd Font 未安装或未设置 | 安装 JetBrainsMono Nerd Font 并在 settings.json 中设置 font.face |
| 新标签页不继承目录 | Shell Integration 未启用 | 确保 prompt 函数发送 OSC 9;9 escape sequence |
| Shell Integration 不生效 | Oh My Posh 需要显式启用 | 使用 `--enable-shell-integration` 参数 |
| 非 PowerShell 7 模块加载问题 | Profile 在 PS 5.1 中执行 | Profile 需要版本检查或使用 PS 7 特定路径 |
| Terminal-Icons 不显示 | 模块未安装或未导入 | 运行 `Install-Module Terminal-Icons` 并在 profile 中 `Import-Module` |

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+R` | 历史命令搜索 |
| `Ctrl+Space` | 命令建议菜单（需要手动添加 action，可能不兼容旧版本） |
| `F2` | 切换预测视图（列表/行内） |
| `Ctrl+Up/Down` | 在命令之间跳转 |
| `Tab` | 智能补全 |

## 自定义命令

```powershell
Edit-Profile   # 编辑配置文件
Edit-Settings  # 编辑 Windows Terminal 设置
Reload-Profile # 重新加载配置
```

## 切换主题

编辑 `$PROFILE`，修改 `--config` 后的主题名称：
```powershell
oh-my-posh init pwsh --config https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/THEME_NAME.omp.json | Invoke-Expression
```

主题预览：https://ohmyposh.dev/docs/themes

推荐主题：`atomic`, `jandedobbeleer`, `paradox`, `clean-detailed`, `powerlevel10k_rainbow`
