@echo off
title E-Store License Platform (Server + Admin Web)
echo ====================================================
echo Starting E-Store Business & License Platform
echo ====================================================

:: Start FastAPI Backend on dedicated port 8080 (avoids collision with iStore ERP port 8000)
start "E-Store License Backend" cmd /k "cd /d "%~dp0backend" && "c:\D\Projects\Websites\I Store Website\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload"

:: Start Vite Frontend on dedicated port 5180
start "E-Store Admin Dashboard" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Backend API running at: http://127.0.0.1:8080/docs
echo Admin Portal running at: http://localhost:5180
echo.
pause
