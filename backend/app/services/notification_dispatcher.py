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
