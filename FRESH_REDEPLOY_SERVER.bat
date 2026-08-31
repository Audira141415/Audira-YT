@echo off
title Audira YT Monitor - Clean Fresh Redeploy to Mini PC Server (192.168.100.178)
color 0E

echo ====================================================================
echo   AUDIRA YT MONITOR - CLEAN & FRESH REDEPLOY TO MINI PC SERVER
echo ====================================================================
echo Target Server : 192.168.100.178 (Mini PC 24/7)
echo.
echo [!] PERINGATAN: Perintah ini akan menghapus cache lama di server, 
echo     melakukan hard reset git ke GitHub main, dan me-rebuild Docker 
echo     secara Fresh (Tanpa Cache).
echo.
set /p CONFIRM="Lanjutkan Clean Fresh Redeploy? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo [*] Dibatalkan oleh pengguna.
    pause
    exit /b 0
)

echo.
echo [*] STEP 1: Memastikan kode laptop sudah di-push ke GitHub main...
git add .
git commit -m "Fresh deployment checkpoint"
git push origin dev
git checkout main
git merge dev -m "Promote dev to main for fresh deploy"
git push origin main
git checkout dev

echo.
echo [*] STEP 2: Mengirimkan instruksi Clean Fresh Deploy ke Mini PC Server via SSH...
ssh asus@192.168.100.178 "cd ~/Audira-YT && bash scripts/clean_redeploy_minipc.sh"

echo.
echo ====================================================================
echo   CLEAN FRESH DEPLOY KE MINI PC SELESAI 100%! 🚀
echo ====================================================================
echo Web Dashboard: http://192.168.100.178:3005
pause
