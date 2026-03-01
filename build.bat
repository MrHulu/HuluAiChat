@echo off
REM HuluChat Build Script for Windows (cmd.exe)
REM Usage: build.bat [exe|installer|clean]

setlocal EnableDelayedExpansion

set TARGET=%1
if "%TARGET%"=="" set TARGET=installer

if "%TARGET%"=="exe" goto BUILD_EXE
if "%TARGET%"=="installer" goto BUILD_INSTALLER
if "%TARGET%"=="clean" goto CLEAN
goto USAGE

:BUILD_EXE
echo Building HuluChat.exe with PyInstaller...
pyinstaller HuluChat.spec --clean
if %ERRORLEVEL% EQU 0 (
    echo [+] Built dist/HuluChat.exe
) else (
    echo [-] PyInstaller build failed
    exit /b 1
)
goto END

:BUILD_INSTALLER
echo Building NSIS installer...

where makensis >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [-] makensis not found. Install NSIS from:
    echo https://nsis.sourceforge.io/Download
    exit /b 1
)

call :BUILD_EXE
echo Building installer...
makensis installer/HuluChat.nsi
if %ERRORLEVEL% EQU 0 (
    echo [+] Built dist/HuluChat-Setup-*.exe
) else (
    echo [-] NSIS build failed
    exit /b 1
)
goto END

:CLEAN
echo Cleaning build artifacts...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build
echo [+] Build artifacts cleaned
goto END

:USAGE
echo HuluChat Build Script
echo.
echo Usage: build.bat [exe^|installer^|clean]
echo.
echo   exe       - Build standalone exe with PyInstaller
echo   installer - Build NSIS installer (requires NSIS)
echo   clean     - Clean build artifacts
echo.
exit /b 1

:END
endlocal
