@echo off
title Audira YT Monitor - Automated Production Rollback Engine
color 0C

echo ========================================================
echo   AUDIRA YT MONITOR - AUTOMATED ROLLBACK ENGINE 🚨
echo ========================================================
echo.
echo [!] PERINGATAN: Anda akan melakukan Rollback sistem ke versi stabil sebelumnya.
echo.
set /p CONFIRM="Ketik Y untuk melanjutkan Rollback: "
if /i not "%CONFIRM%"=="Y" (
    echo [*] Rollback dibatalkan oleh pengguna.
    pause
    exit /b 0
)

echo.
echo [*] Menjalankan Automated Rollback Script...
python scripts\rollback_release.py

echo.
echo [*] Memulai ulang kontainer stabil...
call .\startYT.bat

echo.
echo ========================================================
echo   ROLLBACK SELESAI & SISTEM KEMBALI KE VERSI STABIL! 🚀
echo ========================================================
pause
