@echo off
echo ========================================================
echo Cleaning up previous instances (Killing Ports & Stray Containers) ...
echo ========================================================

echo Force stopping any stray frontend Docker container...
docker rm -f ytim_frontend >nul 2>&1

echo Stopping Docker containers...
docker compose down >nul 2>&1

echo Killing processes on Web Dashboard Port (3005)...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| findstr :3005') DO (
    IF NOT "%%a"=="0" TaskKill.exe /F /PID %%a >nul 2>&1
)

echo Killing processes on Desktop App Port (1420)...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| findstr :1420') DO (
    IF NOT "%%a"=="0" TaskKill.exe /F /PID %%a >nul 2>&1
)

echo ========================================================
echo Starting YouTube Intelligence Monitor Services...
echo ========================================================

echo 1. Starting Database, Redis, and Backend API (Docker)...
docker compose up -d db redis backend worker scheduler

echo Waiting 3 seconds for Backend API and Database to initialize...
timeout /t 3 /nobreak >nul

echo.
echo 2. Starting Next.js Web Dashboard (Port 3005)...
start cmd /k "cd frontend && npm run dev"

echo.
echo 3. Starting Tauri Desktop App...
start cmd /k "cd desktop && npm run tauri dev"

echo.
echo ========================================================
echo ALL SERVICES INITIATED!
echo - Web Dashboard: http://localhost:3005
echo - Backend API: http://localhost:8005
echo - Database (PostgreSQL): localhost:5432
echo - Redis Cache: localhost:6380
echo ========================================================
echo Note: Desktop app window will open automatically.
pause
