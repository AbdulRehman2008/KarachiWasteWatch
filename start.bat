@echo off
echo ==============================================
echo   Starting Karachi WasteWatch AI Platform
echo ==============================================

echo [1/2] Launching FastAPI Backend on port 8000...
start "FastAPI Backend" cmd /k "cd /d %~dp0 && .\venv\Scripts\uvicorn.exe backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Launching React Frontend on port 3000...
start "React Frontend" cmd /k "cd /d %~dp0frontend-react && npm run dev"

echo.
echo Both servers are launching in separate windows!
echo Frontend: http://localhost:3000
echo Backend:  http://127.0.0.1:8000
echo ==============================================
