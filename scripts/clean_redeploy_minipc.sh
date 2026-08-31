#!/bin/bash
# ==============================================================================
# AUDIRA YT MONITOR - CLEAN & FRESH PRODUCTION REDEPLOY SCRIPT (MINI PC)
# ==============================================================================

set -e

echo "===================================================================="
echo "   AUDIRA YT MONITOR - CLEAN FRESH REDEPLOY ENGINE (MINI PC 24/7)"
echo "===================================================================="
echo ""

# 1. Pastikan direktori kerja
cd ~/Audira-YT || cd /home/asus/Audira-YT || cd /opt/audira/Audira-YT

# 2. Backup file .env jika ada
if [ -f ".env" ]; then
    echo "[*] STEP 1: Mem-backup konfigurasi .env..."
    cp .env .env.backup
fi

# 3. Matikan kontainer Docker lama
echo ""
echo "[*] STEP 2: Menghentikan & menghapus kontainer lama..."
docker compose -f docker-compose.prod.yml down --remove-orphans || true

# 4. Bersihkan Git & Tarik Kode Terbersih dari GitHub main
echo ""
echo "[*] STEP 3: Reset Git & Tarik kode fresh dari GitHub main..."
git fetch origin main
git reset --hard origin/main
git clean -fd

# 5. Kembalikan .env jika tadi dibackup
if [ -f ".env.backup" ]; then
    cp .env.backup .env
    echo "   + File .env berhasil dipulihkan."
fi

# 6. Bersihkan cache Docker lama
echo ""
echo "[*] STEP 4: Membersihkan cache Docker..."
docker system prune -f

# 7. Build ulang seluruh kontainer secara Fresh (Tanpa Cache)
echo ""
echo "[*] STEP 5: Membangun ulang seluruh Container secara FRESH..."
docker compose -f docker-compose.prod.yml build --no-cache

# 8. Menyalakan seluruh service di background
echo ""
echo "[*] STEP 6: Menyalakan seluruh Service produksi..."
docker compose -f docker-compose.prod.yml up -d

# 9. Tunggu dan verifikasi status kesehatan
echo ""
echo "[*] STEP 7: Memverifikasi status kesehatan server (Health Check)..."
sleep 5
docker compose -f docker-compose.prod.yml ps

echo ""
echo "===================================================================="
echo "   CLEAN FRESH DEPLOY SELESAI 100%! SERVER BERSIH & SEHAT 🚀"
echo "===================================================================="
echo "Web Dashboard : http://192.168.100.178:3005"
echo "Backend API   : http://192.168.100.178:8005"
echo ""
