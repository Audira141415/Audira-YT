from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import json

from app.db.session import get_db
from app.models.user import User
from app.api.deps import get_current_user_optional
from app.services.backup_vault_service import BackupVaultService

router = APIRouter()

@router.get("/overview")
def get_backup_vault_overview(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Get vault overview, backup statistics, and history list.
    """
    return BackupVaultService.get_vault_overview(db, current_user)

@router.post("/trigger")
def trigger_backup_vault(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Triggers 1-click full network video metadata backup to PostgreSQL Vault.
    """
    return BackupVaultService.create_full_network_backup(db, current_user, backup_type="MANUAL_SNAP")

@router.post("/restore/{backup_id}")
def restore_metadata(
    backup_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Restores video title, description, and thumbnail from a vault entry.
    """
    return BackupVaultService.restore_video_metadata(db, backup_id, current_user)

@router.get("/export")
def export_vault_archive(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Exports full backup vault archive as JSON file download.
    """
    data = BackupVaultService.export_backup_json(db, current_user)
    json_str = json.dumps(data, indent=2)
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": "attachment; filename=Audira_Metadata_Vault_Backup.json"}
    )
