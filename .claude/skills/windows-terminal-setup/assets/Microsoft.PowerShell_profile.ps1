# =============================================================================
# Windows Terminal PowerShell 7 现代化配置
# 类似 macOS + Oh My Zsh 的体验
# =============================================================================

# -----------------------------------------------------------------------------
# 1. Oh My Posh - 主题引擎
# -----------------------------------------------------------------------------
# 主题列表: https://ohmyposh.dev/docs/themes
# 推荐主题: atomic, clean-detailed, jandedobbeleer, paradox, powerlevel10k_rainbow
# 使用 URL 加载主题（兼容 Microsoft Store 版本）
oh-my-posh init pwsh --config https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/atomic.omp.json | Invoke-Expression

# 保存 Oh My Posh 的原始 prompt 函数（用于 Shell Integration）
$Global:__OriginalPrompt = $function:prompt

# -----------------------------------------------------------------------------
# 2. Shell Integration - 新标签页继承当前目录
# -----------------------------------------------------------------------------
# 使用 Microsoft 官方文档的 OSC 9;9 escape sequence
# 参考: https://learn.microsoft.com/zh-cn/windows/terminal/tutorials/new-tab-same-directory
# -----------------------------------------------------------------------------
$Global:__LastHistoryId = -1

function prompt {
    $loc = $executionContext.SessionState.Path.CurrentLocation
    $out = ""

    # OSC 9;9 - 告诉 Windows Terminal 当前工作目录
    if ($loc.Provider.Name -eq "FileSystem") {
        $out += "$([char]27)]9;9;`"$($loc.ProviderPath)`"$([char]27)\"
    }

    # Oh My Posh 主题
    $out += & $Global:__OriginalPrompt

    $Global:__LastHistoryId = $(Get-History -Count 1).Id
    return $out
}

# -----------------------------------------------------------------------------
# 3. PSReadLine - 智能命令行编辑
# -----------------------------------------------------------------------------

# 基础配置
Set-PSReadLineOption -EditMode Windows
Set-PSReadLineOption -PredictionSource History
Set-PSReadLineOption -PredictionViewStyle ListView
Set-PSReadLineOption -HistorySearchCursorMovesToEnd
Set-PSReadLineOption -MaximumHistoryCount 10000
Set-PSReadLineOption -HistorySaveStyle SaveIncrementally

# 语法高亮颜色
Set-PSReadLineOption -Colors @{
    Command = 'Yellow'
    Parameter = 'Green'
    String = 'DarkCyan'
    Variable = 'Magenta'
    Comment = 'DarkGray'
    Keyword = 'Blue'
    Type = 'Cyan'
    Number = 'White'
    Operator = 'Gray'
    Member = 'DarkYellow'
}

# 高级键绑定
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -Key Ctrl+d -Function DeleteChar
Set-PSReadLineKeyHandler -Key Ctrl+h -Function BackwardDeleteChar
Set-PSReadLineKeyHandler -Key Ctrl+w -Function BackwardDeleteWord
Set-PSReadLineKeyHandler -Key Ctrl+a -Function BeginningOfLine
Set-PSReadLineKeyHandler -Key Ctrl+e -Function EndOfLine
Set-PSReadLineKeyHandler -Key Ctrl+u -Function BackwardDeleteInput
Set-PSReadLineKeyHandler -Key Ctrl+k -Function ForwardDeleteInput
Set-PSReadLineKeyHandler -Key Ctrl+l -Function ClearScreen
Set-PSReadLineKeyHandler -Key Ctrl+r -Function ReverseSearchHistory
Set-PSReadLineKeyHandler -Key Ctrl+LeftArrow -Function BackwardWord
Set-PSReadLineKeyHandler -Key Ctrl+RightArrow -Function ForwardWord
Set-PSReadLineKeyHandler -Key Escape -Function RevertLine

# F2: 切换预测视图
Set-PSReadLineKeyHandler -Key F2 -ScriptBlock {
    $current = (Get-PSReadLineOption).PredictionViewStyle
    if ($current -eq 'ListView') {
        Set-PSReadLineOption -PredictionViewStyle InlineView
    } else {
        Set-PSReadLineOption -PredictionViewStyle ListView
    }
}

# -----------------------------------------------------------------------------
# 4. Terminal-Icons - 文件图标增强
# -----------------------------------------------------------------------------
if (Get-Module -ListAvailable -Name Terminal-Icons) {
    Import-Module Terminal-Icons
}

# -----------------------------------------------------------------------------
# 5. 实用别名和函数
# -----------------------------------------------------------------------------

# 类似 Unix 的 ls 别名
function la { Get-ChildItem -Force }
function ll { Get-ChildItem -Hidden -System }
function l  { Get-ChildItem }

# 快速打开配置文件
function Edit-Profile {
    code $PROFILE
}
function Edit-Settings {
    code "$env:LOCALAPPDATA\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"
}

# 重新加载配置
function Reload-Profile {
    . $PROFILE
}

# -----------------------------------------------------------------------------
# 6. 欢迎信息
# -----------------------------------------------------------------------------
$IsFirstRun = -not (Test-Path "$env:LOCALAPPDATA\PowerShell\FirstRunDone")
if ($IsFirstRun) {
    New-Item -ItemType Directory -Force -Path "$env:LOCALAPPDATA\PowerShell" | Out-Null
    New-Item -ItemType File -Path "$env:LOCALAPPDATA\PowerShell\FirstRunDone" | Out-Null
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  PowerShell 7 + Oh My Posh 配置已启用！" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "快捷键:" -ForegroundColor Yellow
    Write-Host "  Ctrl+R     - 历史命令搜索" -ForegroundColor White
    Write-Host "  F2         - 切换预测视图 (列表/行内)" -ForegroundColor White
    Write-Host "  Ctrl+Up/Down - 在命令之间跳转" -ForegroundColor White
    Write-Host "  Tab        - 智能补全" -ForegroundColor White
    Write-Host ""
    Write-Host "命令:" -ForegroundColor Yellow
    Write-Host "  Edit-Profile   - 编辑配置文件" -ForegroundColor White
    Write-Host "  Edit-Settings  - 编辑 Windows Terminal 设置" -ForegroundColor White
    Write-Host "  Reload-Profile - 重新加载配置" -ForegroundColor White
    Write-Host ""
}
