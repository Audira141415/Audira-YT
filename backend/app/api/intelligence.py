from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.channel_milestone import ChannelMilestone
from app.models.system_setting import SystemSetting
from app.services.stagnation_service import StagnationService
from app.services.sentiment_service import SentimentService
from app.services.quiet_hours_service import QuietHoursService
from app.services.telegram_bot_listener import is_alerts_muted

router = APIRouter()

class QuietHoursUpdate(BaseModel):
    enabled: bool
    start_hour: int # 0-23
    end_hour: int # 0-23

class CommentScanRequest(BaseModel):
    video_id: Optional[str] = None
    comments: Optional[List[str]] = None

@router.get("/overview")
def get_intelligence_overview(db: Session = Depends(get_db)):
    """
    Returns an aggregated overview of intelligence systems:
    Milestones, Quiet Hours status, Stagnant videos, and Spam Shield status.
    """
    # 1. Milestones
    milestones = db.query(ChannelMilestone).order_by(ChannelMilestone.achieved_at.desc()).limit(10).all()
    ms_data = []
    for m in milestones:
        ch = db.query(YouTubeChannel).filter(YouTubeChannel.id == m.channel_id).first()
        ms_data.append({
            "id": str(m.id),
            "channel_name": ch.name if ch else "Unknown",
            "milestone_type": m.milestone_type,
            "milestone_value": m.milestone_value,
            "achieved_at": m.achieved_at.strftime("%b %d, %Y %H:%M WIB") if m.achieved_at else "-"
        })

    # 2. Quiet Hours
    in_quiet = QuietHoursService.is_in_quiet_hours(db)
    is_muted = is_alerts_muted()

    setting_start = db.query(SystemSetting).filter(SystemSetting.key == "QUIET_HOURS_START").first()
    setting_end = db.query(SystemSetting).filter(SystemSetting.key == "QUIET_HOURS_END").first()
    setting_enabled = db.query(SystemSetting).filter(SystemSetting.key == "QUIET_HOURS_ENABLED").first()

    return {
        "status": "active",
        "quiet_hours": {
            "is_active_now": in_quiet,
            "is_globally_muted": is_muted,
            "enabled": (setting_enabled.value.lower() == "true") if setting_enabled and setting_enabled.value else True,
            "start_hour": int(setting_start.value) if setting_start and setting_start.value else 23,
            "end_hour": int(setting_end.value) if setting_end and setting_end.value else 6
        },
        "recent_milestones": ms_data,
        "shield_status": "ONLINE (24/7 ACTIVE)"
    }

@router.post("/quiet-hours")
def update_quiet_hours(payload: QuietHoursUpdate, db: Session = Depends(get_db)):
    def set_val(k, v):
        s = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if not s:
            db.add(SystemSetting(key=k, value=str(v)))
        else:
            s.value = str(v)

    set_val("QUIET_HOURS_ENABLED", str(payload.enabled).lower())
    set_val("QUIET_HOURS_START", str(payload.start_hour))
    set_val("QUIET_HOURS_END", str(payload.end_hour))
    db.commit()

    return {"status": "success", "message": "Konfigurasi Quiet Hours berhasil diperbarui!"}

@router.post("/stagnation/evaluate")
async def evaluate_stagnation(db: Session = Depends(get_db)):
    """
    Evaluates video stagnation and sends AI rescue alerts to Telegram if needed.
    """
    res = await StagnationService.evaluate_video_stagnation(db)
    return res

@router.post("/sentiment/scan")
async def scan_comments(payload: CommentScanRequest, db: Session = Depends(get_db)):
    """
    Runs comment spam & negative sentiment analysis on provided comments or active videos.
    """
    sample_comments = payload.comments or [
        "Lagu ini sangat enak didengar, suaranya jernih banget!",
        "Mantap pol aransemen musiknya!",
        "Mau cuan mudah? Gabung group t.me/profit_crypto_official sekarang bonus 100%",
        "Klik wa.me/628123456789 untuk bocoran slot gacor malam ini",
        "Kecewa banget durasinya kependekan",
        "Lagu favorit tiap pagi, sukses terus Audira!"
    ]

    target_vid = db.query(Video).first()
    ch_name = target_vid.channel.name if target_vid and target_vid.channel else "Audira Pop"
    vid_title = target_vid.title if target_vid else "Audira Hits 2026"
    vid_id = target_vid.video_id if target_vid else "vid_sample_01"

    res = await SentimentService.evaluate_video_comments_and_alert(
        db, ch_name, vid_title, vid_id, sample_comments
    )
    return res
