@echo off
echo ==============================================
echo        Starting BroDoc Development Stack
echo ==============================================

:: 1. Start PostgreSQL
echo [1/4] Checking PostgreSQL...
"C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" status -D "%~dp0pgdata" >nul 2>&1
if errorlevel 1 (
    echo PostgreSQL is not running. Starting it now...
    start "PostgreSQL" cmd /c ""C:\Program Files\PostgreSQL\17\bin\pg_ctl.exe" start -D "%~dp0pgdata" -l "%~dp0pg.log" & echo Postgres Started & timeout /t 3"
) else (
    echo PostgreSQL is already running.
)

:: Brief pause to ensure DB connects
timeout /t 2 /nobreak >nul

:: 2. Start FastAPI Backend
echo [2/4] Starting FastAPI Backend...
cd "%~dp0backend"
start "BroDoc Backend (FastAPI)" cmd /k ".\venv\Scripts\activate.bat & uvicorn app.main:app --reload"

:: 3. Start Celery Worker
echo [3/4] Starting Celery Worker...
cd "%~dp0backend"
start "BroDoc Worker (Celery)" cmd /k ".\venv\Scripts\activate.bat & celery -A app.workers.celery_app worker -Q documents --loglevel=info --pool=solo"

:: 4. Start Next.js Frontend
echo [4/4] Starting Next.js Frontend...
cd "%~dp0frontend"
start "BroDoc Frontend (Next.js)" cmd /k "npm run dev"

echo ==============================================
echo   All services launched! Opening browser...
echo ==============================================

:: Wait a few seconds for servers to boot, then open browser
timeout /t 4 /nobreak >nul
start http://localhost:3000

cd "%~dp0"
echo Stack is running! You can close this window.
