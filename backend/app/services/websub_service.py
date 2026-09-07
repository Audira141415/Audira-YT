import asyncio
import os
import httpx
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.youtube_channel import YouTubeChannel
from app.models.system_setting import SystemSetting
from app.core.config import settings

GOOGLE_WEBSUB_HUB = "https://pubsubhubbub.appspot.com/subscribe"

class WebSubService:
    @staticmethod
    def get_callback_url(db: Session) -> str:
        """
        Resolves public callback URL for WebSub verification & notification.
        Fallback order: DB SystemSetting -> env PUBLIC_SERVER_URL -> LAN IP default.
        """
        setting = db.query(SystemSetting).filter(SystemSetting.key == "PUBLIC_SERVER_URL").first()
        base_url = setting.value if setting and setting.value else os.getenv("PUBLIC_SERVER_URL", "")
        if not base_url or base_url in ("http://localhost:8005", "http://127.0.0.1:8005"):
            base_url = "http://192.168.100.178:8005"
        
        base_url = base_url.rstrip("/")
        if not base_url.endswith("/api/v1"):
            base_url = f"{base_url}/api/v1"
        return f"{base_url}/webhooks/youtube"

    @staticmethod
    async def subscribe_channel(channel_id: str, callback_url: str, mode: str = "subscribe") -> dict:
        """
        Sends HTTP POST subscription/unsubscription request to Google PubSubHubbub Hub.
        """
        topic_url = f"https://www.youtube.com/xml/feeds/videos.xml?channel_id={channel_id}"
        payload = {
            "hub.callback": callback_url,
            "hub.mode": mode,
            "hub.topic": topic_url,
            "hub.lease_seconds": "864000", # 10 days lease
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.post(GOOGLE_WEBSUB_HUB, data=payload)
                if resp.status_code in (202, 204, 200):
                    print(f"[WEBSUB SUCCESS]: Requested {mode} for channel {channel_id} -> Callback: {callback_url}")
                    return {"status": "success", "channel_id": channel_id, "mode": mode, "status_code": resp.status_code}
                else:
                    print(f"[WEBSUB ERROR]: {mode} failed for channel {channel_id}: {resp.status_code} {resp.text}")
                    return {"status": "error", "channel_id": channel_id, "message": resp.text, "status_code": resp.status_code}
            except Exception as e:
                print(f"[WEBSUB EXCEPTION]: {mode} exception for channel {channel_id}: {e}")
                return {"status": "error", "channel_id": channel_id, "message": str(e)}

    @staticmethod
    async def subscribe_all_channels(db: Session) -> dict:
        """
        Subscribes all registered YouTube channels in DB to Google WebSub Hub.
        """
        channels = db.query(YouTubeChannel).all()
        callback_url = WebSubService.get_callback_url(db)
        
        results = []
        success_count = 0

        for ch in channels:
            if ch.channel_id and len(ch.channel_id) == 24 and ch.channel_id.startswith("UC"):
                res = await WebSubService.subscribe_channel(ch.channel_id, callback_url)
                results.append(res)
                if res.get("status") == "success":
                    success_count += 1
                await asyncio.sleep(0.5) # Gentle rate limit

        return {
            "status": "success",
            "total_channels": len(channels),
            "subscribed_channels": success_count,
            "callback_url": callback_url,
            "results": results
        }

    @staticmethod
    async def start_auto_resubscribe_loop():
        """
        Periodic background task running every 5 days to ensure WebSub subscriptions never expire.
        """
        print("🌐 [WEBSUB ENGINE]: Auto-Resubscriber Loop Started (5-Day Interval)")
        await asyncio.sleep(15) # Boot stagger
        while True:
            try:
                db = SessionLocal()
                try:
                    res = await WebSubService.subscribe_all_channels(db)
                    print(f"[WEBSUB ENGINE SUCCESS]: Auto-resubscribed {res.get('subscribed_channels', 0)} / {res.get('total_channels', 0)} channels.")
                finally:
                    db.close()
                
                # Sleep 5 days (432,000 seconds)
                await asyncio.sleep(432000)
            except asyncio.CancelledError:
                print("[WEBSUB ENGINE]: Loop cancelled.")
                break
            except Exception as e:
                print(f"[WEBSUB ENGINE ERROR]: {e}")
                await asyncio.sleep(3600)
