import os
import sys
import subprocess
import httpx
import asyncio

MINI_PC_IP = "192.168.100.178"

def main():
    print(f"[*] Menghubungi Mini PC Server ({MINI_PC_IP}) via SSH / Network Pipeline...")
    
    # 1. Try SSH pull to Mini PC Server
    ssh_cmd = [
        "ssh", "-o", "ConnectTimeout=3", f"administrator@{MINI_PC_IP}",
        "cd F:\\Audira-YT && git pull origin main"
    ]
    
    try:
        res = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=5)
        if res.returncode == 0:
            print(f"[SUCCESS] Mini PC Server ({MINI_PC_IP}) berhasil di-update via SSH!")
            print(res.stdout)
            return
    except Exception:
        pass

    # 2. Trigger HTTP Webhook Sync if backend is running on Mini PC Server
    try:
        async def trigger_remote_sync():
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.post(f"http://{MINI_PC_IP}:8005/api/v1/accounts/sync-all")
                if resp.status_code == 200:
                    print(f"[SUCCESS] Remote Backend Mini PC ({MINI_PC_IP}:8005) berhasil memicu Auto-Sync!")
        asyncio.run(trigger_remote_sync())
    except Exception:
        pass

    print("\n========================================================")
    print(f"PRODUKSI GITHUB UPDATED! UPDATE MINI PC ({MINI_PC_IP}):")
    print("========================================================")
    print("Kode terbaru sudah 100% didorong ke GitHub branch 'main'.")
    print(f"Pada Mini PC Server ({MINI_PC_IP}), jalankan perintah berikut:")
    print("  cd F:\\Audira-YT")
    print("  git pull origin main")
    print("  .\\startYT.bat")
    print("========================================================\n")

if __name__ == "__main__":
    main()
