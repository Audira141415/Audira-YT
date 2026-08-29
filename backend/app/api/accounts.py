from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

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

router = APIRouter()

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
    return results
@router.delete("/{account_id}")
def delete_account(account_id: str, db: Session = Depends(get_db)):
    account = db.query(GoogleAccount).filter(GoogleAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"status": "success", "message": "Account deleted successfully"}

@router.get("", response_model=List[AccountResponse])
def get_accounts(db: Session = Depends(get_db)):
    accounts = db.query(GoogleAccount).all()
    
    result = []
    # Mocking some fields that would usually be calculated or fetched from YouTube API
    for acc in accounts:
        user = acc.user
        
        # Calculate some mock UI fields for now
        last_sync_str = "Never"
        sync_time_str = "-"
        if acc.last_sync:
            diff = datetime.now(acc.last_sync.tzinfo) - acc.last_sync
            mins = int(diff.total_seconds() / 60)
            if mins < 60:
                last_sync_str = f"{mins}m ago"
            else:
                last_sync_str = f"{int(mins/60)}h ago"
            sync_time_str = acc.last_sync.strftime("%b %d, %Y %H:%M")

        ch_list = []
        if acc.youtube_channels:
            for ch in acc.youtube_channels:
                ch_list.append({
                    "id": str(ch.id),
                    "channel_id": ch.channel_id,
                    "name": ch.name,
                    "avatar": ch.avatar,
                    "country": ch.country
                })

        result.append(AccountResponse(
            id=acc.id,
            email=acc.email,
            name=user.name if user and user.name else acc.email.split("@")[0],
            isPrimary=False, # We'll just set false for now
            status=acc.status,
            channels=len(acc.youtube_channels) if acc.youtube_channels else 0,
            channel_items=ch_list,
            lastSync=last_sync_str,
            syncTime=sync_time_str,
            quotaUsed=0,
            quotaPct=0,
            token="VALID" if acc.access_token_enc else "INVALID",
            tokenExp="Unknown",
            apiStatus="OK",
            errors=0,
            color="bg-purple-500" # default
        ))
        
    return result
