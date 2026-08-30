@echo off
title Audira YT Monitor - Real-Time Terminal Log Streamer
color 0B

echo ========================================================
echo   AUDIRA YT MONITOR - REAL-TIME LOG MONITORING ENGINE
echo ========================================================
echo.
echo Select Log Stream Mode:
echo [1] Stream ALL Live Logs (Info, Sync, Warnings, Errors)
echo [2] Stream ONLY Errors ^& Warnings (High Priority Alert)
echo.
set /p mode="Enter choice [1 or 2, default 1]: "

if "%mode%"=="2" (
    echo.
    echo [*] Starting Real-time ERROR/WARNING Log Streamer...
    python scripts\monitor_logs.py --errors-only
) else (
    echo.
    echo [*] Starting Real-time FULL System Log Streamer...
    python scripts\monitor_logs.py
)

pause
