#!/usr/bin/env python3
"""
PostgreSQL Database Snapshot Restore Script
Restores a chosen .sql snapshot from backups/db/ into PostgreSQL container.
"""

import os
import sys
import subprocess

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKUP_DIR = os.path.join(ROOT_DIR, "backups", "db")

def restore_backup(filename=None):
    print("========================================================")
    print("   AUDIRA YT MONITOR - DB SNAPSHOT RESTORE UTILITY")
    print("========================================================")

    if not os.path.exists(BACKUP_DIR):
        print(f"[ERROR] Backup directory not found: {BACKUP_DIR}")
        sys.exit(1)

    sql_files = [f for f in os.listdir(BACKUP_DIR) if f.endswith(".sql")]
    if not sql_files:
        print("[ERROR] No .sql backup snapshots available in backups/db/!")
        sys.exit(1)

    sql_files.sort(key=lambda x: os.path.getmtime(os.path.join(BACKUP_DIR, x)), reverse=True)

    if not filename:
        filename = sql_files[0]
        print(f"[*] Target backup file not specified. Defaulting to latest snapshot: {filename}")

    target_filepath = os.path.join(BACKUP_DIR, filename)
    if not os.path.exists(target_filepath):
        print(f"[ERROR] Specified backup file does not exist: {target_filepath}")
        sys.exit(1)

    print(f"[*] Restoring PostgreSQL database from: {target_filepath}")

    # Docker container name
    container_name = "ytim_postgres"
    db_user = "audira_user"
    db_name = "audirayt"

    # Command to restore via psql inside Docker
    cmd = [
        "docker", "exec", "-i", container_name,
        "psql", "-U", db_user, "-d", db_name
    ]

    try:
        with open(target_filepath, "r", encoding="utf-8") as f:
            res = subprocess.run(cmd, stdin=f, capture_output=True, text=True)
            if res.returncode == 0:
                print(f"[SUCCESS] Database successfully restored from snapshot: {filename}")
                return True
            else:
                print(f"[ERROR] Failed to restore database: {res.stderr or res.stdout}")
                sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Failed to execute restore: {e}")
        sys.exit(1)

if __name__ == "__main__":
    target_file = sys.argv[1] if len(sys.argv) > 1 else None
    restore_backup(target_file)
