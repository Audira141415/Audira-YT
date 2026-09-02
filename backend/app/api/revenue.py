from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.db.session import get_db
from app.services.revenue_service import RevenueService
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter()

class RPMConfigPayload(BaseModel):
    channel_name: str
    rpm_idr: int

@router.get("/summary")
def get_revenue_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get monetization overview scoped to the current user's channels.
    SUPERADMIN sees full network overview across all users.
    """
    return RevenueService.get_revenue_summary(db, current_user=current_user)

@router.post("/rpm-config")
def update_channel_rpm(
    payload: RPMConfigPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Customize RPM (IDR per 1,000 views) benchmark for a specific channel.
    """
    if payload.rpm_idr <= 0:
        raise HTTPException(status_code=400, detail="RPM harus lebih besar dari 0.")
    
    setting_key = f"RPM_{payload.channel_name.upper().replace(' ', '_')}"
    setting = db.query(SystemSetting).filter(SystemSetting.key == setting_key).first()
    if not setting:
        setting = SystemSetting(key=setting_key, value=str(payload.rpm_idr))
        db.add(setting)
    else:
        setting.value = str(payload.rpm_idr)
    db.commit()

    return {"status": "success", "message": f"RPM untuk {payload.channel_name} berhasil diatur ke Rp {payload.rpm_idr:,}."}
