import os
import sys
import subprocess
import glob
from datetime import datetime

# Set UTF-8 encoding for Windows terminals
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal
from app.models.system_release import SystemRelease

def execute_rollback():
    print("================================================================")
    print("      AUDIRA YT MONITOR - AUTOMATED ROLLBACK ENGINE 🚨")
    print("================================================================")

    db = SessionLocal()
    try:
        # Get active release and target previous stable release
        active = db.query(SystemRelease).filter(SystemRelease.status == "ACTIVE").first()
        previous = db.query(SystemRelease).filter(SystemRelease.status == "STABLE").order_by(SystemRelease.created_at.desc()).first()

        if not previous:
            print("[!] No previous stable release snapshot found to rollback.")
            return False

        print(f"\n[*] Current Active Release : {active.version if active else 'Unknown'} ({active.title if active else ''})")
        print(f"[*] Target Rollback Target : {previous.version} ({previous.title})")
        print(f"[*] Target Git Commit      : {previous.git_commit}")
        print(f"[*] Target DB Snapshot     : {previous.db_snapshot_file or 'Latest'}")

        print("\n[STEP 1]: Reverting Git branch to target stable commit...")
        git_res = subprocess.run(f"git checkout {previous.git_commit}", shell=True, capture_output=True, text=True)
        print(f"   + Git checkout output: {git_res.stdout.strip() or 'Checked out cleanly'}")

        # Update DB release status
        if active:
            active.status = "ROLLED_BACK"
        previous.status = "ACTIVE"
        db.commit()

        print(f"\n[STEP 2]: Release state updated in Database. Active Version is now: {previous.version} ✅")
        print("================================================================")
        print("   ROLLBACK COMPLETED SUCCESSFULLY! 🚀")
        print("================================================================")
        return True

    except Exception as e:
        print(f"[ERROR]: Rollback failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    execute_rollback()
