import os
import asyncio
import httpx
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting

class NotificationDispatcher:
    @staticmethod
    async def send_discord_webhook(webhook_url: str, title: str, description: str, color: int = 16766720) -> bool:
        """
        Sends an instant alert to a Discord Webhook channel.
        """
        if not webhook_url or not webhook_url.startswith("http"):
            return False
            
        payload = {
            "username": "Audira YT Bot",
            "avatar_url": "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",
            "embeds": [
                {
                    "title": title,
                    "description": description,
                    "color": color,
                    "footer": {
                        "text": f"Audira YT Enterprise Monitor • {datetime.now().strftime('%H:%M:%S WIB')}"
                    }
                }
            ]
        }
        
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(webhook_url, json=payload, timeout=5.0)
                return res.status_code in [200, 204]
        except Exception as e:
            print(f"[Discord Webhook Error]: {e}")
            return False

    @staticmethod
    async def dispatch_surge_alert(db: Session, channel_name: str, video_title: str, video_id: str, diff_views: int, pct_growth: float, new_views: int):
        """
        Dispatches real-time surge alerts across enabled channels (Discord & Telegram).
        """
        # 1. Discord Webhook
        discord_setting = db.query(SystemSetting).filter(SystemSetting.key == "DISCORD_WEBHOOK_URL").first()
        discord_url = discord_setting.value if discord_setting and discord_setting.value else os.getenv("DISCORD_WEBHOOK_URL")
        
        if discord_url:
            title_msg = f"🚨 AUDIRA INTEL | LONJAKAN VIEWER: {channel_name}"
            desc_msg = (
                f"**Channel:** {channel_name}\n"
                f"**Judul Video:** {video_title}\n"
                f"**Tonton:** [Buka di YouTube](https://youtube.com/watch?v={video_id})\n\n"
                f"**Stats:** +{diff_views:,} Views (+{pct_growth}%) | Total: {new_views:,} Views"
            )
            asyncio.create_task(NotificationDispatcher.send_discord_webhook(discord_url, title_msg, desc_msg))

        # 2. Telegram Bot
        bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
        chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
        tg_token = bot_token_setting.value if bot_token_setting and bot_token_setting.value else os.getenv("TELEGRAM_BOT_TOKEN")
        tg_chat = chat_id_setting.value if chat_id_setting and chat_id_setting.value else os.getenv("TELEGRAM_CHAT_ID")

        if tg_token and tg_chat:
            from app.services.telegram_service import TelegramService
            import html
            safe_ch = html.escape(str(channel_name))
            safe_title = html.escape(str(video_title))
            tg_msg = (
                f"🚨 <b>AUDIRA INTEL</b> | <b>LONJAKAN VIEWER!</b> 🔥\n\n"
                f"<b>📺 CHANNEL & VIDEO:</b>\n"
                f"• <b>Channel:</b> {safe_ch}\n"
                f"• <b>Judul:</b> {safe_title}\n"
                f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={video_id}\">Buka di YouTube 📺</a>\n\n"
                f"<b>📊 METRIK REALTIME:</b>\n"
                f"• ⚡ <b>Lonjakan:</b> +{diff_views:,} Views (+{pct_growth}%)\n"
                f"• 👁️ <b>Total Views:</b> {new_views:,} Views\n\n"
                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M:%S')} WIB</i>"
            )
            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, tg_msg))
