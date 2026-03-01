# HuluChat Build Script for Windows
# Usage: .\build.ps1 -Target installer

param(
    [ValidateSet("exe", "installer", "clean")]
    [string]$Target = "installer"
)

$ErrorActionPreference = "Stop"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Build-Exe {
    Write-ColorOutput Green "Building HuluChat.exe with PyInstaller..."
    pyinstaller HuluChat.spec --clean
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Built dist/HuluChat.exe"
    } else {
        Write-ColorOutput Red "✗ PyInstaller build failed"
        exit 1
    }
}

function Build-Installer {
    Write-ColorOutput Green "Building NSIS installer..."

    # Check for makensis
    try {
        $null = Get-Command makensis -ErrorAction Stop
    } catch {
        Write-ColorOutput Red "❌ makensis not found. Install NSIS from:"
        Write-ColorOutput Yellow "https://nsis.sourceforge.io/Download"
        exit 1
    }

    # Build exe first
    Build-Exe

    # Build installer
    makensis installer/HuluChat.nsi
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Built dist/HuluChat-Setup-*.exe"
    } else {
        Write-ColorOutput Red "✗ NSIS build failed"
        exit 1
    }
}

function Clean-Build {
    Write-ColorOutput Yellow "Cleaning build artifacts..."
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
    Write-ColorOutput Green "✓ Build artifacts cleaned"
}

# Main
switch ($Target) {
    "exe" { Build-Exe }
    "installer" { Build-Installer }
    "clean" { Clean-Build }
}
