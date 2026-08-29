@echo off
title Audira YT Monitor - Desktop Application Launcher
color 0B

echo ========================================================
echo       AUDIRA YT MONITOR - DESKTOP APPLICATION LAUNCHER
echo ========================================================
echo.

cd /d %~dp0

:: Check if server is running on Port 3005
netstat -ano | findstr :3005 >nul 2>&1
if errorlevel 1 (
    echo [*] Web server backend/frontend belum aktif. Mengaktifkan startYT.bat...
    start /min startYT.bat
    timeout /t 5 >nul
)

echo [*] Mengaktifkan Jendela Aplikasi Desktop Windows (Tauri Native Framework)...
cd desktop
npx tauri dev

echo.
pause
