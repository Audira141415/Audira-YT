@echo off
echo ========================================================
echo Stopping YouTube Intelligence Monitor Services...
echo ========================================================

echo 1. Stopping Database, Redis, and Backend API (Docker)...
docker compose down

echo.
echo 2. Stopping Frontend (Port 3005) & Desktop (Port 1420) processes...
call npx --yes kill-port 3005 1420 >nul 2>&1

echo.
echo ========================================================
echo All YouTube Intelligence Monitor Services stopped successfully!
echo ========================================================
pause
