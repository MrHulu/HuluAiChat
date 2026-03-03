@echo off
echo Building HuluChat Backend Sidecar...
echo.

cd /d "%~dp0..\backend"

:: Activate virtual environment
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else (
    echo Error: Virtual environment not found at backend\.venv
    echo Please run: python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt
    exit /b 1
)

:: Install PyInstaller if not present
pip install pyinstaller

:: Set target from argument or default to Windows x64
set TARGET=%1
if "%TARGET%"=="" set TARGET=x86_64-pc-windows-msvc

:: Build the executable with Tauri naming convention
:: Tauri expects: binaries/huluchat-backend-{target}.exe
pyinstaller --onefile --name huluchat-backend-%TARGET% --distpath ../src-tauri/binaries main.py

echo.
if exist ..\src-tauri\binaries\huluchat-backend-%TARGET%.exe (
    echo Sidecar built successfully!
    echo Output: src-tauri/binaries/huluchat-backend-%TARGET%.exe
) else (
    echo Build failed!
    exit /b 1
)
