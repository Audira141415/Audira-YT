from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import math
from datetime import datetime
from sqlalchemy import or_
from pydantic import BaseModel

from app.db.session import get_db
from app.models.google_account import GoogleAccount
from app.models.user import User
from app.models.youtube_channel import YouTubeChannel
from app.schemas.account import AccountResponse

from app.services.sync_service import sync_account_data, add_channel_by_input
from typing import List, Optional
from pydantic import BaseModel

class AddChannelRequest(BaseModel):
    channel_input: str
    account_id: Optional[str] = None
    new_account_email: Optional[str] = None

class PipelineToggleRequest(BaseModel):
    enable: Optional[bool] = None

class PipelineConfigRequest(BaseModel):
    sync_interval: Optional[int] = None
    oauth_credential_id: Optional[str] = None

router = APIRouter()

@router.get("/pipelines")
def get_pipelines_telemetry(db: Session = Depends(get_db)):
    from app.services.pipeline_service import pipeline_manager
    telemetry = pipeline_manager.get_telemetry(db)
    return {
        "status": "success",
        "total_pipelines": len(telemetry),
        "pipelines": telemetry
    }

@router.post("/{account_id}/pipeline/trigger")
async def trigger_account_pipeline(account_id: str):
    from app.services.pipeline_service import pipeline_manager
    res = await pipeline_manager.trigger_pipeline(account_id)
    return res

@router.post("/{account_id}/pipeline/toggle")
async def toggle_account_pipeline(account_id: str, payload: PipelineToggleRequest = PipelineToggleRequest()):
    from app.services.pipeline_service import pipeline_manager
    res = await pipeline_manager.toggle_pipeline(account_id, enable=payload.enable)
    return res

@router.patch("/{account_id}/pipeline/config")
async def configure_account_pipeline(account_id: str, payload: PipelineConfigRequest):
    from app.services.pipeline_service import pipeline_manager
    res = await pipeline_manager.update_pipeline_config(
        account_id, 
        sync_interval=payload.sync_interval, 
        oauth_credential_id=payload.oauth_credential_id
    )
    return res

@router.post("/add-channel-by-handle")
async def add_channel_handle(payload: AddChannelRequest, db: Session = Depends(get_db)):
    res = await add_channel_by_input(db, payload.channel_input, account_id=payload.account_id, new_account_email=payload.new_account_email)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/{account_id}/sync")
async def sync_account(account_id: str, db: Session = Depends(get_db)):
    res = await sync_account_data(db, account_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/sync-all")
async def sync_all_accounts(db: Session = Depends(get_db)):
    accounts = db.query(GoogleAccount).all()
    results = []
    for acc in accounts:
        res = await sync_account_data(db, str(acc.id))
        results.append({"account_id": str(acc.id), "result": res})
    return {
        "status": "success",
        "message": f"Berhasil menyinkronkan {len(results)} akun Google dan seluruh channel YouTube.",
        "results": results
    }
@router.post("/reseed")
def reseed_accounts_endpoint(db: Session = Depends(get_db)):
    from app.main import seed_initial_accounts
    seed_initial_accounts()
    acc_count = db.query(GoogleAccount).count()
    return {"status": "success", "message": f"Account seeding triggered successfully. Total accounts: {acc_count}", "total_accounts": acc_count}

class BulkDeleteRequest(BaseModel):
    account_ids: List[str]

@router.delete("/bulk")
def delete_bulk_accounts(payload: BulkDeleteRequest, db: Session = Depends(get_db)):
    uuid_ids = []
    for aid in payload.account_ids:
        try:
            uuid_ids.append(uuid.UUID(aid) if isinstance(aid, str) else aid)
        except Exception:
            uuid_ids.append(aid)
    accounts = db.query(GoogleAccount).filter(GoogleAccount.id.in_(uuid_ids)).all()
    if not accounts:
        raise HTTPException(status_code=404, detail="No accounts found")
    count = len(accounts)
    for acc in accounts:
        db.delete(acc)
    db.commit()
    return {"status": "success", "message": f"{count} accounts deleted successfully"}

@router.delete("/{account_id}")
def delete_account(account_id: str, db: Session = Depends(get_db)):
    try:
        acc_uuid = uuid.UUID(account_id) if isinstance(account_id, str) else account_id
    except Exception:
        acc_uuid = account_id
    account = db.query(GoogleAccount).filter(GoogleAccount.id == acc_uuid).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"status": "success", "message": "Account deleted successfully"}

from sqlalchemy.orm import selectinload

@router.get("")
def get_accounts(
    db: Session = Depends(get_db),
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    status: Optional[str] = None
):
    if db.query(GoogleAccount).count() == 0:
        from app.main import seed_initial_accounts
        seed_initial_accounts()

    # Resolve default credential ONCE (used for accounts without explicit oauth_credential_id)
    from app.models.oauth_credential import OAuthCredential
    default_cred = db.query(OAuthCredential).filter(OAuthCredential.is_default == True).first()

    query = db.query(GoogleAccount).options(
        selectinload(GoogleAccount.youtube_channels).selectinload(YouTubeChannel.videos),
        selectinload(GoogleAccount.oauth_credential)
    )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(GoogleAccount.email.ilike(search_term))
    
    if status and status != "ALL":
        if status == "ERROR":
            query = query.filter(or_(GoogleAccount.status == "ERROR", GoogleAccount.errors > 0))
        else:
            query = query.filter(GoogleAccount.status == status)

    total_items = query.count()
    total_pages = math.ceil(total_items / limit) if limit > 0 else 0
    accounts = query.offset((page - 1) * limit).limit(limit).all()
    
    result = []
    for acc in accounts:
        last_sync_str = "Never"
        sync_time_str = "-"
        if acc.last_sync:
            last_sync_str = acc.last_sync.strftime("%H:%M WIB")
            sync_time_str = acc.last_sync.strftime("%b %d, %Y %H:%M")

        ch_list = []
        if acc.youtube_channels:
            for ch in acc.youtube_channels:
                ch_list.append({
                    "id": str(ch.id),
                    "channel_id": ch.channel_id,
                    "name": ch.name,
                    "avatar": ch.avatar,
                    "country": ch.country,
                    "video_count": len(ch.videos) if ch.videos else 0
                })

        # Resolve which OAuth credential this account is using
        # Priority: explicit oauth_credential_id > default credential (fallback)
        resolved_cred = None
        resolved_cred_id = None
        resolved_cred_name = None

        if getattr(acc, 'oauth_credential', None) and acc.oauth_credential:
            resolved_cred = acc.oauth_credential
        elif getattr(acc, 'oauth_credential_id', None):
            resolved_cred = db.query(OAuthCredential).filter(
                OAuthCredential.id == acc.oauth_credential_id
            ).first()
        
        if not resolved_cred and default_cred:
            resolved_cred = default_cred  # Fallback to default

        if resolved_cred:
            resolved_cred_id = str(resolved_cred.id)
            resolved_cred_name = resolved_cred.name

        has_valid_token = bool(acc.access_token_enc)
        has_refresh = bool(acc.refresh_token_enc)
        is_oauth_connected = bool(resolved_cred and (has_valid_token or (acc.status or "") == "ACTIVE"))

        token_status = "INVALID"
        if has_valid_token and has_refresh:
            token_status = "VALID (AUTO-REFRESH)"
        elif has_valid_token:
            token_status = "VALID"

        result.append({
            "id": str(acc.id),
            "email": acc.email,
            "name": acc.email.split("@")[0],
            "isPrimary": resolved_cred.is_default if resolved_cred else False,
            "status": acc.status or "ACTIVE",
            "channels": len(acc.youtube_channels) if acc.youtube_channels else 0,
            "channel_items": ch_list,
            "lastSync": last_sync_str,
            "syncTime": sync_time_str,
            "quotaUsed": getattr(acc, 'quota_used_today', 0) or 0,
            "quotaPct": round(((getattr(acc, 'quota_used_today', 0) or 0) / (getattr(acc, 'quota_limit_daily', 10000) or 10000)) * 100, 1),
            "token": token_status,
            "tokenExp": "Unknown",
            "apiStatus": "OK",
            "errors": getattr(acc, 'errors', 0) or 0,
            "color": "bg-purple-500",
            # ✅ OAuth Integration Status (resolved from default credential if not explicitly set)
            "isOAuthConnected": is_oauth_connected,
            "oauthCredentialId": resolved_cred_id,
            "oauthCredentialName": resolved_cred_name,
            "oauthCredentialIsDefault": resolved_cred.is_default if resolved_cred else False,
            # 🚀 Account Pipeline Engine Telemetry
            "pipelineStatus": getattr(acc, 'pipeline_status', 'HEALTHY') or 'HEALTHY',
            "pipelineEnabled": getattr(acc, 'pipeline_enabled', True) if getattr(acc, 'pipeline_enabled', True) is not None else True,
            "syncIntervalSeconds": getattr(acc, 'sync_interval_seconds', 60) or 60,
            "lastSyncDurationMs": getattr(acc, 'last_sync_duration_ms', 0) or 0,
            "quotaUsedToday": getattr(acc, 'quota_used_today', 0) or 0,
            "quotaLimitDaily": getattr(acc, 'quota_limit_daily', 10000) or 10000,
            "lastErrorMessage": getattr(acc, 'last_error_message', None),
            "jitterOffsetSeconds": getattr(acc, 'jitter_offset_seconds', 0) or 0,
        })
        
    return {
        "items": result,
        "total": total_items,
        "page": page,
        "pages": total_pages,
        "limit": limit
    }
