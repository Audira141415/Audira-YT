import hashlib
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.metadata_backup import MetadataBackupVault
from app.models.video import Video
from app.models.youtube_channel import YouTubeChannel
from app.models.google_account import GoogleAccount
from app.api.deps import get_user_scoped_channels_and_accounts

class BackupVaultService:
    @staticmethod
    def _compute_hash(video_id: str, title: str, description: Optional[str]) -> str:
        raw_str = f"{video_id}:{title}:{description or ''}"
        return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()

    @staticmethod
    def create_full_network_backup(
        db: Session, 
        current_user: Optional[Any] = None, 
        backup_type: str = "MANUAL_SNAP"
    ) -> Dict[str, Any]:
        """
        Creates a versioned metadata backup for all videos scoped to the user.
        """
        scoped = get_user_scoped_channels_and_accounts(db, current_user)
        channels = scoped["channels"]

        if not channels:
            return {
                "status": "NO_CHANNELS",
                "message": "Tidak ada channel yang terhubung untuk dicadangkan.",
                "backed_up_count": 0
            }

        channel_ids = [ch.id for ch in channels]
        videos = db.query(Video).filter(Video.channel_id.in_(channel_ids)).all()

        version_str = f"v1.0-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        backed_up_count = 0

        for v in videos:
            b_hash = BackupVaultService._compute_hash(v.video_id, v.title, v.description)
            
            # Check if identical hash already exists recently to avoid duplicates
            existing = db.query(MetadataBackupVault).filter(
                MetadataBackupVault.video_id == v.video_id,
                MetadataBackupVault.backup_hash == b_hash
            ).first()

            if not existing:
                vault_entry = MetadataBackupVault(
                    id=uuid.uuid4(),
                    channel_id=v.channel_id,
                    video_id=v.video_id,
                    version=version_str,
                    title=v.title or "Untitled Video",
                    description=v.description or "",
                    tags_json=json.dumps([]),
                    thumbnail_url=v.thumbnail or "",
                    published_at=v.published_at.replace(tzinfo=None) if hasattr(v.published_at, 'replace') and v.published_at else None,
                    view_count=v.view_count or 0,
                    like_count=v.like_count or 0,
                    comment_count=v.comment_count or 0,
                    backup_hash=b_hash,
                    backup_type=backup_type,
                    created_at=datetime.utcnow()
                )
                db.add(vault_entry)
                backed_up_count += 1

        db.commit()

        return {
            "status": "SUCCESS",
            "message": f"Berhasil mencadangkan metadata {backed_up_count} video ke Vault (Versi {version_str}).",
            "version": version_str,
            "backed_up_count": backed_up_count,
            "timestamp": datetime.now().strftime("%d %b %Y, %H:%M:%S WIB")
        }

    @staticmethod
    def get_vault_overview(db: Session, current_user: Optional[Any] = None) -> Dict[str, Any]:
        """
        Returns vault summary and list of metadata backups.
        """
        scoped = get_user_scoped_channels_and_accounts(db, current_user)
        channels = scoped["channels"]

        if not channels:
            return {
                "status": "SUCCESS",
                "total_backups": 0,
                "total_channels": 0,
                "last_backup_time": "-",
                "backups": []
            }

        channel_ids = [ch.id for ch in channels]
        query = db.query(MetadataBackupVault).filter(MetadataBackupVault.channel_id.in_(channel_ids))
        
        total_backups = query.count()
        latest = query.order_by(MetadataBackupVault.created_at.desc()).first()
        last_backup_time = latest.created_at.strftime("%d %b %Y, %H:%M:%S WIB") if latest else "-"

        all_backups = query.order_by(MetadataBackupVault.created_at.desc()).limit(100).all()

        items = []
        for b in all_backups:
            ch_name = b.channel.name if b.channel else "Audira Channel"
            items.append({
                "id": str(b.id),
                "channel_id": str(b.channel_id),
                "channel_name": ch_name,
                "video_id": b.video_id,
                "version": b.version,
                "title": b.title,
                "description": b.description or "",
                "thumbnail_url": b.thumbnail_url or "",
                "view_count": b.view_count or 0,
                "backup_type": b.backup_type,
                "backup_hash": b.backup_hash or "-",
                "created_at": b.created_at.strftime("%d %b %Y, %H:%M WIB") if b.created_at else "-"
            })

        return {
            "status": "SUCCESS",
            "total_backups": total_backups,
            "total_channels": len(channels),
            "last_backup_time": last_backup_time,
            "backups": items
        }

    @staticmethod
    def restore_video_metadata(db: Session, backup_id: str, current_user: Optional[Any] = None) -> Dict[str, Any]:
        """
        Restores video title, description, and thumbnail from a vault backup entry.
        """
        try:
            b_uuid = uuid.UUID(backup_id)
        except Exception:
            return {"status": "ERROR", "message": "ID Cadangan Vault tidak valid."}

        backup_entry = db.query(MetadataBackupVault).filter(MetadataBackupVault.id == b_uuid).first()
        if not backup_entry:
            return {"status": "ERROR", "message": "Entri cadangan metadata tidak ditemukan di Vault."}

        video = db.query(Video).filter(Video.video_id == backup_entry.video_id).first()
        if not video:
            return {"status": "ERROR", "message": f"Video dengan ID '{backup_entry.video_id}' tidak ditemukan di tabel utama."}

        # Restore properties
        video.title = backup_entry.title
        video.description = backup_entry.description
        if backup_entry.thumbnail_url:
            video.thumbnail = backup_entry.thumbnail_url

        db.commit()

        return {
            "status": "SUCCESS",
            "message": f"Metadata video '{video.title}' (ID: {video.video_id}) berhasil dipulihkan dari Vault ({backup_entry.version}).",
            "restored_video_id": video.video_id,
            "restored_title": video.title
        }

    @staticmethod
    def export_backup_json(db: Session, current_user: Optional[Any] = None) -> List[Dict[str, Any]]:
        """
        Exports backup data as serializable JSON list.
        """
        overview = BackupVaultService.get_vault_overview(db, current_user)
        return overview.get("backups", [])
