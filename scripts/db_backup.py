import os
import sys
import datetime
import subprocess

def create_db_backup():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backup_dir = os.path.join(root_dir, "backups", "db")
    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"audira_db_backup_{timestamp}.sql"
    filepath = os.path.join(backup_dir, filename)

    print("========================================================")
    print(f" [*] CREATING POSTGRESQL DATABASE SNAPSHOT BACKUP ...")
    print(f" [*] Backup Target: {filepath}")
    print("========================================================")

    # Dump Postgres via Docker container ytim_postgres
    cmd = f"docker exec ytim_postgres pg_dump -U postgres youtube_monitor"
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True)
        if res.returncode == 0 and res.stdout:
            with open(filepath, "wb") as f:
                f.write(res.stdout)
            print(f"[SUCCESS] DATABASE BACKUP SUCCESSFUL! File size: {os.path.getsize(filepath)} bytes.")
            
            # Clean up old backups (Keep last 10 snapshots)
            backups = sorted([os.path.join(backup_dir, f) for f in os.listdir(backup_dir) if f.startswith("audira_db_backup_")])
            if len(backups) > 10:
                for old_file in backups[:-10]:
                    try:
                        os.remove(old_file)
                        print(f"[*] Rotated old backup: {os.path.basename(old_file)}")
                    except Exception:
                        pass
            return True
        else:
            print(f"[!] Backup warning: {res.stderr or 'Postgres container not running or DB empty.'}")
            return False
    except Exception as e:
        print(f"[!] Could not run pg_dump: {e}")
        return False

if __name__ == "__main__":
    create_db_backup()
    sys.exit(0)
