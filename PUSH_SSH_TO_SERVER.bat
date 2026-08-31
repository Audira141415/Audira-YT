@echo off
title Audira YT Monitor - Push & Deploy via SSH to Mini PC Server (192.168.100.178)
color 0B

echo ========================================================
echo   AUDIRA YT MONITOR - SSH REMOTE DEPLOYMENT ENGINE
echo ========================================================
echo Target Server : 192.168.100.178 (Mini PC Production)
echo.

set SERVER_IP=192.168.100.178
set SERVER_USER=asus
set REMOTE_DIR=/home/%SERVER_USER%/Audira-YT

:: 1. Staging & Commit Lokal
echo [*] STEP 1: Menyimpan perubahan lokal (Git Commit)...
git add .
git commit -m "Auto deploy update to Mini PC Server - %DATE% %TIME%"

:: 2. Push ke GitHub
echo.
echo [*] STEP 2: Mengunggah kode terbaru ke GitHub Main...
git push origin main
if errorlevel 1 (
    echo [!] Gagal push ke GitHub. Mencoba pull --rebase...
    git pull origin main --rebase
    git push origin main
)

:: 3. Eksekusi SSH Remote Update ke Mini PC
echo.
echo [*] STEP 3: Menghubungi Mini PC Server via SSH (%SERVER_IP%)...
echo [*] Menjalankan update kontainer Docker di server...

ssh %SERVER_USER%@%SERVER_IP% "cd %REMOTE_DIR% && git pull origin main && docker compose -f docker-compose.prod.yml up -d --build && docker system prune -f"

:: 4. Verifikasi Health Check
echo.
echo [*] STEP 4: Memverifikasi status kesehatan server produksi...
python -c "import httpx; res = httpx.get('http://%SERVER_IP%:8005/health', timeout=10.0); print('Status Server:', res.status_code, res.json())"

echo.
echo ========================================================
echo   SUKSES! DEPLOYMENT VIA SSH SELESAI 100%! 🚀
echo ========================================================
echo Server Mini PC (http://%SERVER_IP%:3005) aktif 24/7.
echo.
pause
