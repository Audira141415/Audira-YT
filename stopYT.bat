@echo off
echo ========================================================
echo Stopping YouTube Intelligence Monitor Services...
echo ========================================================

echo 1. Stopping Database, Redis, and Backend API (Docker)...
docker compose down

echo.
echo ========================================================
echo Docker containers stopped successfully!
echo.
echo IMPORTANT: Please manually close the Command Prompt 
echo windows that were running the Frontend and Desktop app.
echo ========================================================
pause
