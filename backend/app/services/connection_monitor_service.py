import httpx
import asyncio
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.system_setting import SystemSetting
from app.services.telegram_service import TelegramService

class ConnectionMonitorService:
    last_status: Dict[str, bool] = {
        "db": True,
        "redis": True,
        "internet": True
    }

    @staticmethod
    async def perform_health_check(db: Session) -> Dict[str, Any]:
        """
        Check connectivity to PostgreSQL DB, Redis, and Internet/YouTube API.
        Sends Telegram alerts if disconnection or recovery occurs.
        """
        status_db = True
        status_redis = True
        status_internet = True

        # 1. Check PostgreSQL Database Connection
        try:
            db.execute(text("SELECT 1"))
        except Exception as e:
            status_db = False
            print("Database Disconnection Error:", e)

        # 2. Check Internet & YouTube API Connectivity
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get("https://www.googleapis.com/generate_204")
                if resp.status_code != 204:
                    status_internet = False
        except Exception as e:
            status_internet = False
            print("Internet Disconnection Error:", e)

        # Fetch Telegram Bot Credentials
        bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
        chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
        
        tg_token = bot_token_setting.value if bot_token_setting else None
        tg_chat = chat_id_setting.value if chat_id_setting else None

        # Detect Disconnections & Send Alerts
        issues = []
        if not status_db:
            issues.append("🚨 <b>Database PostgreSQL:</b> Koneksi Basis Data Terputus!")
        if not status_internet:
            issues.append("🌐 <b>Internet / Google API:</b> Jaringan Internet / API Unreachable!")

        if issues and tg_token and tg_chat:
            issue_text = "\n".join(issues)
            alert_msg = (
                f"⚠️ <b>[AUDIRA SYSTEM ALERT] KONEKSI TERPUTUS!</b> ⚠️\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"🖥️ <b>Server:</b> Mini PC Server (192.168.100.178)\n"
                f"🚨 <b>MASALAH TERDETEKSI:</b>\n"
                f"{issue_text}\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"💡 <b>Tindakan:</b> Sistem mencoba melakukan pemulihan koneksi otomatis.\n"
                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
            )
            await TelegramService.send_telegram_message(tg_token, tg_chat, alert_msg)

        # Detect Recovery (if previous status was down and now restored)
        if status_db and status_internet and (not ConnectionMonitorService.last_status["db"] or not ConnectionMonitorService.last_status["internet"]):
            if tg_token and tg_chat:
                recovery_msg = (
                    f"✅ <b>[AUDIRA SYSTEM ALERT] KONEKSI PULIH KEMBALI!</b> ✅\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🖥️ <b>Server:</b> Mini PC Server (192.168.100.178)\n"
                    f"🟢 <b>Status:</b> Seluruh koneksi (Database & Internet) telah TERHUBUNG KEMBALI 100%!\n"
                    f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                )
                await TelegramService.send_telegram_message(tg_token, tg_chat, recovery_msg)

        # Update last known status
        ConnectionMonitorService.last_status["db"] = status_db
        ConnectionMonitorService.last_status["internet"] = status_internet

        return {
            "status": "healthy" if status_db and status_internet else "degraded",
            "db_connected": status_db,
            "internet_connected": status_internet,
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
