from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.services.copyright_shield_service import CopyrightShieldService

router = APIRouter()

class TestAlertPayload(BaseModel):
    channel_name: str
    video_title: str
    claim_type: Optional[str] = "YELLOW_DOLLAR"

@router.get("/overview")
def get_copyright_overview(
    channel_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns live copyright health status, yellow/red dollar counts, and Content ID claims.
    """
    return CopyrightShieldService.get_shield_overview(db, channel_id=channel_id)

@router.post("/scan")
async def trigger_copyright_scan(db: Session = Depends(get_db)):
    """
    Triggers an on-demand full network scan of all video monetization statuses.
    """
    return await CopyrightShieldService.scan_network_copyright(db)

@router.post("/test-alert")
async def test_copyright_alert(payload: TestAlertPayload, db: Session = Depends(get_db)):
    """
    Sends a test Telegram & WebSocket copyright warning.
    """
    sent = await CopyrightShieldService.send_simulated_alert(
        db, 
        channel_name=payload.channel_name, 
        video_title=payload.video_title, 
        claim_type=payload.claim_type or "YELLOW_DOLLAR"
    )
    return {
        "status": "SUCCESS",
        "message": f"Peringatan simulasi {payload.claim_type} berhasil disiarkan ke Telegram & Dashboard!" if sent else "WebSocket tersiar (Telegram Bot belum dikonfigurasi)."
    }
