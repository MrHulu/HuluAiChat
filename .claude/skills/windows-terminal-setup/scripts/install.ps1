# =============================================================================
# Windows Terminal 现代化配置一键安装脚本
# =============================================================================
# 使用方法：以管理员身份运行 PowerShell 5.1，然后：
# Set-ExecutionPolicy Bypass -Scope Process -Force
# .\install.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Windows Terminal 现代化配置安装" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否为管理员
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "请以管理员身份运行此脚本！" -ForegroundColor Red
    exit 1
}

# 步骤 1: 安装 PowerShell 7
Write-Host "[1/7] 安装 PowerShell 7..." -ForegroundColor Yellow
winget install Microsoft.PowerShell --accept-source-agreements --accept-package-agreements
Write-Host "  PowerShell 7 安装完成" -ForegroundColor Green

# 步骤 2: 安装 Oh My Posh
Write-Host "[2/7] 安装 Oh My Posh..." -ForegroundColor Yellow
winget install JanDeDobbeleer.OhMyPosh --accept-source-agreements --accept-package-agreements
Write-Host "  Oh My Posh 安装完成" -ForegroundColor Green

# 步骤 3: 安装 Nerd Font
Write-Host "[3/7] 安装 JetBrainsMono Nerd Font..." -ForegroundColor Yellow
winget install DEVCOM.JetBrainsMonoNerdFont --accept-source-agreements --accept-package-agreements
Write-Host "  Nerd Font 安装完成" -ForegroundColor Green

# 步骤 4: 添加 PowerShell 7 到 PATH
Write-Host "[4/7] 添加 PowerShell 7 到 PATH..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\PowerShell\7\", [EnvironmentVariableTarget]::User)
Write-Host "  PATH 更新完成（需要重启终端生效）" -ForegroundColor Green

# 步骤 5: 安装 Terminal-Icons
Write-Host "[5/7] 安装 Terminal-Icons 模块..." -ForegroundColor Yellow
& "C:\Program Files\PowerShell\7\pwsh.exe" -Command "Install-Module -Name Terminal-Icons -Repository PSGallery -Force -Scope CurrentUser"
Write-Host "  Terminal-Icons 安装完成" -ForegroundColor Green

# 步骤 6: 配置 PowerShell Profile
Write-Host "[6/7] 配置 PowerShell Profile..." -ForegroundColor Yellow
$profileDir = "$env:USERPROFILE\Documents\PowerShell"
$profileFile = "$profileDir\Microsoft.PowerShell_profile.ps1"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sourceProfile = Join-Path $scriptDir "..\assets\Microsoft.PowerShell_profile.ps1"

# 创建目录
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# 复制配置文件（备份现有文件）
if (Test-Path $profileFile) {
    $backupFile = "$profileFile.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $profileFile $backupFile
    Write-Host "  已备份现有配置到: $backupFile" -ForegroundColor DarkYellow
}

Copy-Item $sourceProfile $profileFile -Force
Write-Host "  PowerShell Profile 配置完成" -ForegroundColor Green

# 步骤 7: 配置 Windows Terminal settings.json
Write-Host "[7/7] 配置 Windows Terminal settings.json..." -ForegroundColor Yellow
$settingsDir = "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState"
$settingsFile = "$settingsDir\settings.json"
$sourceSettings = Join-Path $scriptDir "..\assets\settings.json"

# 备份现有配置
if (Test-Path $settingsFile) {
    $backupSettings = "$settingsFile.backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item $settingsFile $backupSettings
    Write-Host "  已备份现有设置到: $backupSettings" -ForegroundColor DarkYellow

    # 合并配置：保留现有的 profiles.list（如果有其他 profile）
    Write-Host "  提示：此脚本会覆盖 settings.json，如需保留其他配置请手动合并" -ForegroundColor DarkYellow
}

Copy-Item $sourceSettings $settingsFile -Force
Write-Host "  Windows Terminal settings.json 配置完成" -ForegroundColor Green

# 完成
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "重要提示：" -ForegroundColor Yellow
Write-Host "  1. 完全关闭 Windows Terminal" -ForegroundColor White
Write-Host "  2. 重新打开 Windows Terminal" -ForegroundColor White
Write-Host "  3. 选择 'PowerShell 7' 配置文件" -ForegroundColor White
Write-Host ""
Write-Host "功能验证：" -ForegroundColor Yellow
Write-Host "  - 应该看到 Oh My Posh 主题（彩色路径 + git 状态）" -ForegroundColor White
Write-Host "  - 输入命令时会有预测提示" -ForegroundColor White
Write-Host "  - cd 到目录后，新建标签页应继承该目录" -ForegroundColor White
Write-Host ""
