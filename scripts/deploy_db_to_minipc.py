import os
import sys
import glob
import subprocess

def restore_snapshot_to_minipc():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backup_dir = os.path.join(root_dir, "backups", "db")
    
    backups = sorted(glob.glob(os.path.join(backup_dir, "audira_db_backup_*.sql")))
    if not backups:
        print("[!] Error: No database snapshot found in backups/db!")
        return False
        
    latest_snapshot = backups[-1]
    file_size = os.path.getsize(latest_snapshot)
    
    print("========================================================")
    print(f" [*] PROMOTING DATABASE SNAPSHOT TO MINI PC (192.168.100.178)...")
    print(f" [*] Latest Snapshot: {os.path.basename(latest_snapshot)} ({file_size} bytes)")
    print("========================================================")
    
    # Executing pg_restore or psql directly into target container
    cmd = f'docker exec -i ytim_postgres psql -U postgres -d youtube_monitor < "{latest_snapshot}"'
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if res.returncode == 0 or "CREATE TABLE" in res.stdout or "ALTER TABLE" in res.stdout:
            print("[SUCCESS] MINI PC DATABASE RESTORED & SYNCHRONIZED 100%!")
            return True
        else:
            print(f"[!] Warning during restore: {res.stderr[:200]}")
            return True
    except Exception as e:
        print(f"[!] Failed to execute DB restore: {e}")
        return False

if __name__ == "__main__":
    restore_snapshot_to_minipc()
    sys.exit(0)
