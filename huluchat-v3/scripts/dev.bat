@echo off
echo Starting HuluChat v3 Development Environment...
echo.

:: Start FastAPI backend in background
echo Starting FastAPI backend on http://127.0.0.1:8765...
start "HuluChat Backend" cmd /c "cd backend && .venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8765 --reload"

:: Wait a moment for backend to start
timeout /t 2 /nobreak > nul

:: Start Tauri dev
echo Starting Tauri frontend...
call npm run tauri dev
