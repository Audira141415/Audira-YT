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
        google_client_secret=settings_dict.get("GOOGLE_CLIENT_SECRET", ""),
        youtube_api_key=settings_dict.get("YOUTUBE_API_KEY", "")
    )

@router.post("", response_model=SettingResponse)
def update_settings(payload: SettingUpdate, db: Session = Depends(get_db)):
    def set_val(key, val):
        if val is not None:
            setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
            if not setting:
                setting = SystemSetting(key=key, value=val.strip())
                db.add(setting)
            else:
                setting.value = val.strip()

    if payload.google_client_id and payload.google_client_id.strip():
        set_val("GOOGLE_CLIENT_ID", payload.google_client_id)
    if payload.google_client_secret and payload.google_client_secret.strip():
        set_val("GOOGLE_CLIENT_SECRET", payload.google_client_secret)
    if payload.youtube_api_key is not None:
        set_val("YOUTUBE_API_KEY", payload.youtube_api_key)

    db.commit()

    # Also save into OAuthCredential table if client_id provided
    if payload.google_client_id and payload.google_client_id.strip():
        existing = db.query(OAuthCredential).filter(OAuthCredential.client_id == payload.google_client_id.strip()).first()
        if not existing:
            is_first = db.query(OAuthCredential).count() == 0
            cred = OAuthCredential(
                name=f"App Credential #{db.query(OAuthCredential).count() + 1}",
                client_id=payload.google_client_id.strip(),
                client_secret=(payload.google_client_secret or "").strip(),
                is_default=is_first
            )
            db.add(cred)
        elif payload.google_client_secret:
            existing.client_secret = payload.google_client_secret.strip()
        db.commit()

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

class YouTubeKeyTestPayload(BaseModel):
    api_key: str

@router.post("/youtube-key/test")
async def test_youtube_api_key(payload: YouTubeKeyTestPayload):
    key = payload.api_key.strip()
    if not key or key == "your_youtube_api_key_here":
        raise HTTPException(status_code=400, detail="API Key YouTube tidak boleh kosong.")
    
    import httpx
    url = "https://www.googleapis.com/youtube/v3/channels"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params={"part": "snippet,statistics", "id": "UCyzwQxUc3ZSmRfY9sORUeLQ", "key": key}, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("items", [])
                ch_name = items[0]["snippet"]["title"] if items else "Google YouTube API Valid"
                return {"status": "success", "message": f"Koneksi Google YouTube API 100% Sukses! Berhasil membaca channel: {ch_name}"}
            else:
                err_json = resp.json() if "application/json" in resp.headers.get("content-type", "") else {}
                err_msg = err_json.get("error", {}).get("message", resp.text)
                raise HTTPException(status_code=400, detail=f"Google API Error ({resp.status_code}): {err_msg}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Gagal menghubungi Google: {str(e)}")


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

@router.post("/backup/telegram")
async def trigger_telegram_backup(db: Session = Depends(get_db)):
    """
    Trigger manual on-demand database backup and send directly to Telegram Admin chat.
    """
    from app.services.backup_service import BackupService
    res = await BackupService.create_and_send_telegram_backup(db)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Backup failed"))
    return res


class DiscordPayload(BaseModel):
    webhook_url: str

class WhatsAppPayload(BaseModel):
    webhook_url: str

@router.post("/discord")
async def save_discord_settings(payload: DiscordPayload, db: Session = Depends(get_db)):
    url_setting = db.query(SystemSetting).filter(SystemSetting.key == "DISCORD_WEBHOOK_URL").first()
    if not url_setting:
        url_setting = SystemSetting(key="DISCORD_WEBHOOK_URL", value=payload.webhook_url)
        db.add(url_setting)
    else:
        url_setting.value = payload.webhook_url
    db.commit()
    return {"status": "success", "message": "Discord Webhook URL saved successfully"}

@router.post("/discord/test")
async def test_discord_webhook(payload: DiscordPayload):
    from app.services.notification_dispatcher import NotificationDispatcher
    res = await NotificationDispatcher.send_discord_webhook(
        payload.webhook_url,
        "🎮 AUDIRA YT MONITOR - DISCORD INTEGRATION TEST",
        "Integrasi **Discord Webhook** Anda telah BERHASIL 100%! Alert surge dan laporan realtime akan otomatis terkirim ke channel ini.",
        color=65280
    )
    return {"status": "success" if res else "error", "delivered": res}

@router.post("/whatsapp")
async def save_whatsapp_settings(payload: WhatsAppPayload, db: Session = Depends(get_db)):
    url_setting = db.query(SystemSetting).filter(SystemSetting.key == "WHATSAPP_WEBHOOK_URL").first()
    if not url_setting:
        url_setting = SystemSetting(key="WHATSAPP_WEBHOOK_URL", value=payload.webhook_url)
        db.add(url_setting)
    else:
        url_setting.value = payload.webhook_url
    db.commit()
    return {"status": "success", "message": "WhatsApp Webhook URL saved successfully"}

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

@router.post("/telegram/test-channels")
async def test_channels_telegram_integration(db: Session = Depends(get_db)):
    """
    Tests and verifies real-time Telegram alerts for ALL registered YouTube channels individually.
    Sends a test alert message for each channel to the configured Telegram Chat ID.
    """
    import app.db.base
    from app.models.youtube_channel import YouTubeChannel
    from app.models.google_account import GoogleAccount
    from app.models.video import Video
    from app.services.telegram_service import TelegramService
    from datetime import datetime

    bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
    chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()

    tg_token = bot_token_setting.value if bot_token_setting else None
    tg_chat = chat_id_setting.value if chat_id_setting else None

    if not tg_token or not tg_chat:
        raise HTTPException(status_code=400, detail="Konfigurasi Telegram Bot Token & Chat ID belum diisi.")

    channels = db.query(YouTubeChannel).all()
    if not channels:
        raise HTTPException(status_code=404, detail="Tidak ada channel YouTube yang terdaftar di database.")

    results = []
    
    # Header notification message to Telegram
    header_msg = (
        f"🧪 <b>AUDIRA YT | VERIFIKASI INTEGRASI 6 CHANNEL REALTIME</b> 🚀\n\n"
        f"<b>📊 PENGUJIAN LOGIKA NOTIFIKASI BOT:</b>\n"
        f"• Total Channel Terdaftar: <b>{len(channels)} Channels</b>\n"
        f"• Chat ID Target: <code>{tg_chat}</code>\n"
        f"• Status Engine: <b>REALTIME POLLING 24/7 ACTIVE</b>\n\n"
        f"<i>Mengirim pesan simulasi lonjakan views untuk setiap channel di bawah ini:</i>"
    )
    await TelegramService.send_telegram_message(tg_token, tg_chat, header_msg)

    for index, ch in enumerate(channels, 1):
        acc = db.query(GoogleAccount).filter(GoogleAccount.id == ch.account_id).first()
        acc_email = acc.email if acc else "Unknown Email"
        video_count = db.query(Video).filter(Video.channel_id == ch.id).count()

        ch_msg = (
            f"✅ <b>[TEST CHANNEL {index}/{len(channels)}]</b> | <b>{ch.name.upper()}</b> 🎵\n\n"
            f"<b>📺 DETIL CHANNEL & AKUN:</b>\n"
            f"• <b>Nama Channel:</b> {ch.name}\n"
            f"• <b>Akun Google:</b> {acc_email}\n"
            f"• <b>Channel ID:</b> <code>{ch.channel_id}</code>\n"
            f"• <b>Total Videos:</b> {video_count} Videos\n"
            f"• <b>Baseline Views 24H:</b> {(ch.baseline_views_24h or 0):,} Views\n\n"
            f"<b>📊 STATUS LOGIKA REALTIME BOT:</b>\n"
            f"• 🟢 <b>OAuth Token Status:</b> VALID & AUTO-REFRESH\n"
            f"• ⚡ <b>View Surge Detector:</b> READY (+10% Surge Trigger)\n"
            f"• 👍 <b>Like & Comment Detector:</b> ACTIVE\n\n"
            f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M:%S')} WIB</i>"
        )
        res = await TelegramService.send_telegram_message(tg_token, tg_chat, ch_msg)
        results.append({
            "channel_name": ch.name,
            "account_email": acc_email,
            "channel_id": ch.channel_id,
            "video_count": video_count,
            "views": ch.baseline_views_24h or 0,
            "telegram_status": res.get("status", "error"),
            "message": res.get("message", "")
        })

    return {
        "status": "success",
        "total_channels": len(channels),
        "test_results": results
    }


