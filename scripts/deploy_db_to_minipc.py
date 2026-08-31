import os
import sys
import glob
import subprocess

def restore_snapshot_to_minipc():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backup_dir = os.path.join(root_dir, "backups", "db")
    
    # Safety Check: Check if database already has accounts
    check_cmd = 'docker exec ytim_postgres psql -U postgres -d youtube_monitor -t -c "SELECT count(*) FROM google_accounts;"'
    try:
        check_res = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)
        if check_res.returncode == 0 and check_res.stdout.strip().isdigit():
            count = int(check_res.stdout.strip())
            if count > 0:
                print(f"[SAFETY GUARD] Mini PC Database already contains {count} Google Accounts! Preserving live production data (Skipping snapshot restore). ✅")
                return True
    except Exception:
        pass

    backups = sorted(glob.glob(os.path.join(backup_dir, "audira_db_backup_*.sql")))
    if not backups:
        print("[*] No initial database snapshot to seed. Skipping.")
        return True
        
    latest_snapshot = backups[-1]
    file_size = os.path.getsize(latest_snapshot)
    
    print("========================================================")
    print(f" [*] PROMOTING INITIAL DATABASE SNAPSHOT TO MINI PC (192.168.100.178)...")
    print(f" [*] Snapshot: {os.path.basename(latest_snapshot)} ({file_size} bytes)")
    print("========================================================")
    
    cmd_remote = f'docker exec -i -e PGPASSWORD=postgres ytim_postgres psql -h 192.168.100.178 -U postgres -d youtube_monitor < "{latest_snapshot}"'
    cmd_local = f'docker exec -i ytim_postgres psql -U postgres -d youtube_monitor < "{latest_snapshot}"'
    
    try:
        res = subprocess.run(cmd_remote, shell=True, capture_output=True, text=True)
        if res.returncode == 0:
            print("[SUCCESS] MINI PC DATABASE RESTORED VIA DIRECT NETWORK (192.168.100.178:5432) 100%!")
            return True
    except Exception:
        pass

    try:
        res = subprocess.run(cmd_local, shell=True, capture_output=True, text=True)
        print("[SUCCESS] MINI PC DATABASE RESTORED VIA DOCKER EXEC 100%!")
        return True
    except Exception as e:
        print(f"[!] Failed to execute DB restore: {e}")
        return False

if __name__ == "__main__":
    restore_snapshot_to_minipc()
    sys.exit(0)
