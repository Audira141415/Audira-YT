@echo off
title Audira YT Monitor - Setup Mini PC 24/7 Auto Startup
color 0A

echo ========================================================
echo   AUDIRA YT MONITOR - SETUP MINI PC 24/7 AUTO STARTUP
echo ========================================================
echo.

cd /d %~dp0

echo [*] Memasang registrasi Task Scheduler Windows untuk Mini PC Server...
schtasks /create /tn "AudiraYT_Server_247" /tr "\"%CD%\startYT.bat\"" /sc onstart /ru SYSTEM /f >nul 2>&1

if errorlevel 1 (
    echo [*] Memasang shortcut di Startup User Folder...
    set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
    copy /y "startYT.bat" "%STARTUP_FOLDER%\AudiraYT_Start.bat" >nul
)

echo.
echo ========================================================
echo   BERHASIL! AUDIRA YT MONITOR SIAP NYALA 24/7 DI MINI PC! 🚀
echo ========================================================
echo.
echo Setiap kali Mini PC Anda dinyalakan atau mati lampu & restart,
echo server Audira YT Monitor akan otomatis aktif sendiri di background!
echo.
pause
