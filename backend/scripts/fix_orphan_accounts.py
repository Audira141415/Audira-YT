"""
Migration Script: Fix orphan GoogleAccounts with NULL user_id
Run this ONCE on production server after deploying the SaaS multi-tenant update.

Usage:
  cd /path/to/backend
  python scripts/fix_orphan_accounts.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.google_account import GoogleAccount
from app.models.user import User

def fix_orphan_accounts():
    db = SessionLocal()
    try:
        # Find the SUPERADMIN user (Audira)
        superadmin = db.query(User).filter(
            (User.email == "audira@audira.com") | (User.role == "SUPERADMIN")
        ).first()

        if not superadmin:
            print("[ERROR] SUPERADMIN user not found! Run server first to seed Audira account.")
            return

        print(f"[OK] Found SUPERADMIN: {superadmin.email} (id={superadmin.id})")

        # Find all GoogleAccounts with NULL user_id
        orphans = db.query(GoogleAccount).filter(GoogleAccount.user_id == None).all()
        print(f"[INFO] Found {len(orphans)} orphan GoogleAccount(s) with NULL user_id")

        if not orphans:
            print("[OK] No orphan accounts found. Database is clean!")
            return

        # Assign all orphan accounts to SUPERADMIN
        for acc in orphans:
            acc.user_id = superadmin.id
            print(f"  - Assigned: {acc.email} -> SUPERADMIN ({superadmin.email})")

        db.commit()
        print(f"\n[SUCCESS] Fixed {len(orphans)} orphan account(s) -> assigned to SUPERADMIN {superadmin.email}")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    fix_orphan_accounts()
