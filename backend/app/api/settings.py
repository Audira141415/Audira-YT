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

        # Always sync to system_setting for backward compatibility
        def set_sys_val(k, v):
            s = db.query(SystemSetting).filter(SystemSetting.key == k).first()
            if not s:
                db.add(SystemSetting(key=k, value=v))
            else:
                s.value = v
        set_sys_val("GOOGLE_CLIENT_ID", cid)
        set_sys_val("GOOGLE_CLIENT_SECRET", csec)
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

# --- Telegram Bot Integration Endpoints ---

class TelegramSettingPayload(BaseModel):
    bot_token: str
    chat_id: str

@router.get("/telegram")
def get_telegram_settings(db: Session = Depends(get_db)):
    bot_token = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
    chat_id = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
    return {
        "bot_token": bot_token.value if bot_token else "",
        "chat_id": chat_id.value if chat_id else ""
    }

@router.post("/telegram")
def save_telegram_settings(payload: TelegramSettingPayload, db: Session = Depends(get_db)):
    def set_val(key, val):
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if not setting:
            setting = SystemSetting(key=key, value=val.strip())
            db.add(setting)
        else:
            setting.value = val.strip()

    set_val("TELEGRAM_BOT_TOKEN", payload.bot_token)
    set_val("TELEGRAM_CHAT_ID", payload.chat_id)
    db.commit()

    return {"status": "success", "message": "Konfigurasi Telegram Bot berhasil disimpan!"}

@router.post("/telegram/test")
async def test_telegram_message(payload: TelegramSettingPayload):
    from app.services.telegram_service import TelegramService
    test_text = (
        "<b>🚀 AUDIRA YT MONITOR - TEST NOTIFIKASI TELEGRAM</b>\n\n"
        "Halo Agus Dwi Rianto! Integrasi <b>Telegram Bot Notifier</b> Anda telah BERHASIL terhubung 100%.\n\n"
        "<b>Fitur Notifikasi Aktif:</b>\n"
        "• ⚡ Notifikasi Lonjakan Views Video (Surge Alert)\n"
        "• ⚠️ Peringatan Token OAuth Kadaluarsa\n"
        "• 📊 Ringkasan Laporan Harian YouTube Analytics\n\n"
        "<i>Audira Digital Network System Engine</i>"
    )
    result = await TelegramService.send_telegram_message(payload.bot_token, payload.chat_id, test_text)
    return result

@router.get("/health-check")
async def check_system_health(db: Session = Depends(get_db)):
    from app.services.connection_monitor_service import ConnectionMonitorService
    res = await ConnectionMonitorService.perform_health_check(db)
    return res

@router.post("/test-disconnection-alert")
async def test_disconnection_alert(db: Session = Depends(get_db)):
    from app.services.telegram_service import TelegramService
    bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
    chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
    
    tg_token = bot_token_setting.value if bot_token_setting else None
    tg_chat = chat_id_setting.value if chat_id_setting else None

    if not tg_token or not tg_chat:
        raise HTTPException(status_code=400, detail="Telegram credentials missing")

    from datetime import datetime
    alert_msg = (
        f"⚠️ <b>AUDIRA INTEL</b> | <b>PERINGATAN KONEKSI TERPUTUS!</b> ⚠️\n\n"
        f"<b>🚨 MASALAH SISTEM DETEKSI:</b>\n"
        f"• 🔌 <b>Database PostgreSQL:</b> Terputus / Tidak Merespon (0ms)\n"
        f"• 🌐 <b>Jaringan Server:</b> YouTube API Timeout / Unreachable\n\n"
        f"<b>🖥️ RINCIAN PERANGKAT:</b>\n"
        f"• <b>Server:</b> Mini PC Server (192.168.100.178)\n"
        f"• <b>Status Engine:</b> Auto-Recovery Active 🔄\n\n"
        f"<b>💡 TINDAKAN REKOMENDASI:</b>\n"
        f"<i>Periksa daya Mini PC atau koneksi kabel LAN router rumah Anda.</i>\n\n"
        f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
    )
    res = await TelegramService.send_telegram_message(tg_token, tg_chat, alert_msg)
    return res


