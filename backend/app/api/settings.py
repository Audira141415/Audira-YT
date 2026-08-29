from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid

from app.db.session import get_db
from app.models.system_setting import SystemSetting
from app.models.oauth_credential import OAuthCredential
from app.schemas.setting import SettingUpdate, SettingResponse

router = APIRouter()

class CredentialCreate(BaseModel):
    name: Optional[str] = "Google OAuth App"
    client_id: str
    client_secret: str

@router.get("", response_model=SettingResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSetting).all()
    settings_dict = {s.key: s.value for s in settings}
    
    return SettingResponse(
        google_client_id=settings_dict.get("GOOGLE_CLIENT_ID", ""),
        google_client_secret=settings_dict.get("GOOGLE_CLIENT_SECRET", "")
    )

@router.post("", response_model=SettingResponse)
def update_settings(payload: SettingUpdate, db: Session = Depends(get_db)):
    if not payload.google_client_id or not payload.google_client_id.strip():
        raise HTTPException(status_code=400, detail="Google Client ID wajib diisi dan tidak boleh kosong.")
    if not payload.google_client_secret or not payload.google_client_secret.strip():
        raise HTTPException(status_code=400, detail="Google Client Secret wajib diisi dan tidak boleh kosong.")

    def set_val(key, val):
        if val is not None:
            setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not setting:
                setting = SystemSetting(key=key, value=val.strip())
                db.add(setting)
            else:
                setting.value = val.strip()

    set_val("GOOGLE_CLIENT_ID", payload.google_client_id)
    set_val("GOOGLE_CLIENT_SECRET", payload.google_client_secret)

    # Also save into OAuthCredential table
    existing = db.query(OAuthCredential).filter(OAuthCredential.client_id == payload.google_client_id.strip()).first()
    if not existing:
        is_first = db.query(OAuthCredential).count() == 0
        cred = OAuthCredential(
            name=f"App Credential #{db.query(OAuthCredential).count() + 1}",
            client_id=payload.google_client_id.strip(),
            client_secret=payload.google_client_secret.strip(),
            is_default=is_first
        )
        db.add(cred)
    else:
        existing.client_secret = payload.google_client_secret.strip()

    db.commit()
    return get_settings(db)

# --- Multi OAuth Credentials Endpoints ---

@router.get("/credentials")
def list_credentials(db: Session = Depends(get_db)):
    creds = db.query(OAuthCredential).order_by(OAuthCredential.created_at.desc()).all()
    res = []
    for c in creds:
        res.append({
            "id": str(c.id),
            "name": c.name,
            "client_id": c.client_id,
            "client_secret": "••••••••••••••••••••",
            "is_default": c.is_default,
            "created_at": c.created_at.strftime("%b %d, %Y") if c.created_at else "-"
        })
    return res

@router.post("/credentials")
def add_credential(payload: CredentialCreate, db: Session = Depends(get_db)):
    if not payload.client_id or not payload.client_id.strip():
        raise HTTPException(status_code=400, detail="Client ID wajib diisi.")
    if not payload.client_secret or not payload.client_secret.strip():
        raise HTTPException(status_code=400, detail="Client Secret wajib diisi.")

    cid = payload.client_id.strip()
    csec = payload.client_secret.strip()

    existing = db.query(OAuthCredential).filter(OAuthCredential.client_id == cid).first()
    if existing:
        existing.client_secret = csec
        if payload.name:
            existing.name = payload.name
        db.commit()
    else:
        is_first = db.query(OAuthCredential).count() == 0
        cred_count = db.query(OAuthCredential).count() + 1
        cred = OAuthCredential(
            name=payload.name or f"App Credential #{cred_count}",
            client_id=cid,
            client_secret=csec,
            is_default=is_first
        )
        db.add(cred)
        db.commit()

        # Update system_setting if first
        if is_first:
            db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_ID").update({"value": cid})
            db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_SECRET").update({"value": csec})
            db.commit()

    return list_credentials(db)

@router.delete("/credentials/{cred_id}")
def delete_credential(cred_id: str, db: Session = Depends(get_db)):
    cred = db.query(OAuthCredential).filter(OAuthCredential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    db.delete(cred)
    db.commit()
    return {"status": "success", "message": "Credential deleted successfully"}

@router.put("/credentials/{cred_id}/default")
def set_default_credential(cred_id: str, db: Session = Depends(get_db)):
    db.query(OAuthCredential).update({"is_default": False})
    cred = db.query(OAuthCredential).filter(OAuthCredential.id == cred_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    cred.is_default = True
    
    # Also update system_setting for default compatibility
    db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_ID").update({"value": cred.client_id})
    db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_SECRET").update({"value": cred.client_secret})
    db.commit()
    
    return list_credentials(db)
