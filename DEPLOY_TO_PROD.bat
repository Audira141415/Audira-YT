@echo off
title Audira YT Monitor - Deploy to Production Mini PC (24/7)
color 0A

echo ========================================================
echo   AUDIRA YT MONITOR - PRODUCTION DEPLOYMENT ENGINE
echo ========================================================
echo.
echo [*] Memastikan kode di branch DEV sudah di-commit...
git status -s

echo.
echo [*] Menggabungkan (Merge) branch DEV ke branch MAIN (Production)...
git checkout main
if errorlevel 1 (
    echo [!] Gagal pindah ke branch main!
    pause
    exit /b 1
)

git merge dev -m "Promote dev features to production main branch"
if errorlevel 1 (
    echo [!] Terjadi konflik git merge! Harap selesaikan konflik terlebih dahulu.
    pause
    exit /b 1
)

echo.
echo [*] Mendorong (Push) kode produksi terbaru ke GitHub...
git push origin main
if errorlevel 1 (
    echo [!] Gagal push ke GitHub!
    pause
    exit /b 1
)

echo.
echo [*] Menghubungi Mini PC Server (192.168.100.178) via SSH untuk update 24/7...
if exist scratch\update_minipc_alert_system.py (
    python scratch\update_minipc_alert_system.py
) else (
    echo [*] Kode didorong ke GitHub main. Silakan git pull di Linux Mini PC.
)

echo.
echo [*] Kembalikan laptop ke branch DEV (Development Zone)...
git checkout dev

echo.
echo ========================================================
echo   BERHASIL! PRODUCTION DEPLOYMENT SELESAI 100%! 🚀
echo ========================================================
echo.
echo Server Mini PC (192.168.100.178) telah diperbarui secara aman.
echo Laptop Anda kembali ke branch DEV untuk pengembangan berikutnya.
echo.
pause
