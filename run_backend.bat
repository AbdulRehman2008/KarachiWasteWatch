@echo off
echo ========================================================
echo Starting Karachi WasteWatch AI - Backend API (FastAPI)
echo Docs: http://127.0.0.1:8000/docs
echo ========================================================
call .\venv\Scripts\activate.bat
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause
