import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models.video_snapshot import VideoSnapshot

class SnapshotCleanupService:
    @staticmethod
    def get_snapshot_storage_stats(db: Session) -> dict:
        """
        Calculates snapshot log storage metrics from PostgreSQL database.
        """
        total_snapshots = db.query(VideoSnapshot).count()
        oldest = db.query(func.min(VideoSnapshot.timestamp)).scalar()
        latest = db.query(func.max(VideoSnapshot.timestamp)).scalar()

        # Estimated size: ~120 bytes per VideoSnapshot row
        estimated_mb = round((total_snapshots * 120) / (1024 * 1024), 2)

        return {
            "total_snapshots": total_snapshots,
            "estimated_storage_mb": estimated_mb,
            "oldest_snapshot": oldest.strftime("%Y-%m-%d %H:%M:%S WIB") if oldest else "None",
            "latest_snapshot": latest.strftime("%Y-%m-%d %H:%M:%S WIB") if latest else "None",
        }

    @staticmethod
    def cleanup_old_snapshots(db: Session, retention_days: int = 30) -> dict:
        """
        Deletes VideoSnapshot time-series records older than retention_days.
        Preserves video baseline view totals and channel metrics intact.
        """
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        
        deleted_count = db.query(VideoSnapshot).filter(
            VideoSnapshot.timestamp < cutoff_date
        ).delete(synchronize_session=False)
        
        db.commit()

        print(f"[SNAPSHOT CLEANUP]: Pruned {deleted_count} time-series snapshot logs older than {retention_days} days (Cutoff: {cutoff_date.strftime('%Y-%m-%d')}).")

        return {
            "status": "success",
            "retention_days": retention_days,
            "deleted_snapshots": deleted_count,
            "cutoff_date": cutoff_date.strftime("%Y-%m-%d %H:%M:%S UTC")
        }

    @staticmethod
    async def start_daily_cleanup_loop(retention_days: int = 30):
        """
        Periodic daily background task to clean up old snapshot logs.
        """
        print(f"🧹 [SNAPSHOT CLEANUP ENGINE]: Daily Retention Task Started ({retention_days}-Day Policy)")
        await asyncio.sleep(60) # Initial boot delay
        while True:
            try:
                db = SessionLocal()
                try:
                    res = SnapshotCleanupService.cleanup_old_snapshots(db, retention_days=retention_days)
                    print(f"[SNAPSHOT CLEANUP ENGINE SUCCESS]: Pruned {res.get('deleted_snapshots', 0)} old snapshot logs.")
                finally:
                    db.close()

                # Sleep 24 hours (86,400 seconds)
                await asyncio.sleep(86400)
            except asyncio.CancelledError:
                print("[SNAPSHOT CLEANUP ENGINE]: Loop cancelled.")
                break
            except Exception as e:
                print(f"[SNAPSHOT CLEANUP ENGINE ERROR]: {e}")
                await asyncio.sleep(7200)
