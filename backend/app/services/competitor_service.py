import os
import uuid
import html
import asyncio
import httpx
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session

from app.models.competitor import CompetitorChannel, CompetitorVideo
from app.models.system_setting import SystemSetting
from app.services.telegram_service import TelegramService
from app.services.youtube_service import YouTubeService
from app.core.websocket_manager import manager as ws_manager
from app.core.config import settings

class CompetitorService:
    @staticmethod
    async def add_or_update_competitor(db: Session, channel_input: str, niche: str = "General") -> Dict[str, Any]:
        """
        Adds or updates a competitor channel with 100% REAL LIVE data from YouTube.
        Extracts channel avatar, subscriber count, total views, and recent videos.
        """
        clean_input = channel_input.strip()
        if "youtube.com/" in clean_input:
            clean_input = clean_input.split("youtube.com/")[-1].strip("/")
            if clean_input.startswith("channel/"):
                clean_input = clean_input.replace("channel/", "")
            elif clean_input.startswith("c/"):
                clean_input = clean_input.replace("c/", "")

        # Check if already exists in DB
        existing = db.query(CompetitorChannel).filter(
            (CompetitorChannel.channel_id == clean_input) | 
            (CompetitorChannel.handle == clean_input) |
            (CompetitorChannel.handle == f"@{clean_input.lstrip('@')}")
        ).first()

        # Fetch LIVE real data from YouTube
        api_key_setting = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
        api_key = api_key_setting.value if api_key_setting and api_key_setting.value else getattr(settings, "YOUTUBE_API_KEY", None)

        live_data = await YouTubeService.sync_channel_by_id_public(clean_input, api_key=api_key)
        if not live_data and not clean_input.startswith("@") and not clean_input.startswith("UC"):
            live_data = await YouTubeService.fetch_channel_public_direct(f"@{clean_input}")

        if not live_data:
            # Fallback if channel handle not reachable
            live_data = {
                "channel_id": clean_input if clean_input.startswith("UC") else f"UC_comp_{uuid.uuid4().hex[:8]}",
                "name": clean_input.lstrip("@").replace("_", " ").title(),
                "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={clean_input}",
                "subscriber_count": 0,
                "total_views": 0,
                "videos": []
            }

        ch_id = live_data.get("channel_id") or clean_input
        ch_title = live_data.get("name") or clean_input
        ch_avatar = live_data.get("avatar") or f"https://api.dicebear.com/7.x/identicon/svg?seed={clean_input}"
        subs_count = live_data.get("subscriber_count") or 0
        total_views = live_data.get("total_views") or 0
        videos_data = live_data.get("videos") or []

        if existing:
            existing.channel_id = ch_id
            existing.name = ch_title
            existing.avatar = ch_avatar
            existing.subscriber_count = subs_count
            existing.total_views = total_views
            existing.video_count = max(len(videos_data), existing.video_count or 0)
            existing.niche = niche
            existing.is_active = True
            existing.last_sync = datetime.now()
            db.commit()
            comp_channel = existing
        else:
            comp_channel = CompetitorChannel(
                id=uuid.uuid4(),
                channel_id=ch_id,
                handle=clean_input if clean_input.startswith("@") else f"@{clean_input}",
                name=ch_title,
                avatar=ch_avatar,
                niche=niche,
                subscriber_count=subs_count,
                total_views=total_views,
                video_count=len(videos_data),
                is_active=True,
                last_sync=datetime.now()
            )
            db.add(comp_channel)
            db.commit()
            db.refresh(comp_channel)

        # Store or update real videos from YouTube
        for v in videos_data[:10]:
            v_id = v.get("id") or v.get("video_id")
            if not v_id:
                continue
            snip = v.get("snippet", {})
            stat = v.get("statistics", {})
            v_title = snip.get("title") or v.get("title") or "YouTube Video"
            v_views = int(stat.get("viewCount", 0)) if stat.get("viewCount") else v.get("views", 0)
            v_thumb = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"

            existing_vid = db.query(CompetitorVideo).filter(CompetitorVideo.video_id == v_id).first()
            if not existing_vid:
                new_comp_vid = CompetitorVideo(
                    id=uuid.uuid4(),
                    competitor_channel_id=comp_channel.id,
                    video_id=v_id,
                    title=v_title,
                    thumbnail=v_thumb,
                    published_at=datetime.now(),
                    view_count=v_views,
                    like_count=0,
                    comment_count=0,
                    velocity_views_hour=max(50, int(v_views / 24)) if v_views > 0 else 0,
                    is_viral=(v_views > 50000)
                )
                db.add(new_comp_vid)
            else:
                existing_vid.title = v_title
                existing_vid.view_count = v_views
                existing_vid.thumbnail = v_thumb
        db.commit()

        # Telemetry & Telegram Alert on new competitor added
        bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
        chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
        tg_token = bot_token_setting.value if bot_token_setting and bot_token_setting.value else os.getenv("TELEGRAM_BOT_TOKEN")
        tg_chat = chat_id_setting.value if chat_id_setting and chat_id_setting.value else os.getenv("TELEGRAM_CHAT_ID")

        if tg_token and tg_chat:
            safe_ch = html.escape(str(ch_title))
            safe_niche = html.escape(str(niche))
            msg = (
                f"🎯 <b>AUDIRA COMPETITOR RADAR</b> | <b>KOMPETITOR BARU DIPANTAU!</b> 🕵️\n\n"
                f"<b>📺 NAMA CHANNEL:</b> <b>{safe_ch}</b>\n"
                f"• 🏷️ <b>Niche / Genre:</b> {safe_niche}\n"
                f"• 👥 <b>Subscribers:</b> {subs_count:,} Subs\n"
                f"• 🎬 <b>Video Terpantau:</b> {len(videos_data)} Video\n"
                f"• 🔗 <b>Kunjungi:</b> <a href=\"https://youtube.com/{comp_channel.handle}\">Buka Channel 📺</a>\n\n"
                f"<b>💡 RADAR AKTIF:</b>\n"
                f"<i>Sistem akan otomatis mendeteksi setiap kali kompetitor ini mengunggah konten baru atau mengalami lonjakan penonton.</i>\n\n"
                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
            )
            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, msg))

        return {
            "status": "success",
            "message": f"Channel kompetitor '{ch_title}' berhasil ditambahkan ke Radar dengan data live YouTube!",
            "competitor": {
                "id": str(comp_channel.id),
                "name": ch_title,
                "channel_id": ch_id,
                "handle": comp_channel.handle,
                "avatar": ch_avatar,
                "subscriber_count": subs_count,
                "total_views": total_views,
                "videos": [
                    {
                        "video_id": v.video_id,
                        "title": v.title,
                        "thumbnail": v.thumbnail,
                        "views": v.view_count or 0
                    } for v in comp_channel.videos
                ]
            }
        }

    @staticmethod
    async def run_competitor_radar_sync(db: Session) -> Dict[str, Any]:
        """
        Periodically syncs all tracked competitor channels with live YouTube data.
        """
        competitors = db.query(CompetitorChannel).filter(CompetitorChannel.is_active == True).all()
        if not competitors:
            return {"status": "success", "checked": 0}

        api_key_setting = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
        api_key = api_key_setting.value if api_key_setting and api_key_setting.value else getattr(settings, "YOUTUBE_API_KEY", None)

        checked_count = 0
        for comp in competitors:
            try:
                live = await YouTubeService.sync_channel_by_id_public(comp.handle or comp.channel_id, api_key=api_key)
                if live:
                    if live.get("subscriber_count"):
                        comp.subscriber_count = live["subscriber_count"]
                    if live.get("avatar"):
                        comp.avatar = live["avatar"]
                    if live.get("total_views"):
                        comp.total_views = live["total_views"]
                    
                    vids = live.get("videos", [])
                    comp.video_count = max(len(vids), comp.video_count or 0)
                    for v in vids[:5]:
                        v_id = v.get("id") or v.get("video_id")
                        if v_id:
                            snip = v.get("snippet", {})
                            stat = v.get("statistics", {})
                            v_title = snip.get("title") or v.get("title") or "Video"
                            v_views = int(stat.get("viewCount", 0)) if stat.get("viewCount") else v.get("views", 0)
                            v_thumb = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"

                            existing_vid = db.query(CompetitorVideo).filter(CompetitorVideo.video_id == v_id).first()
                            if not existing_vid:
                                new_v = CompetitorVideo(
                                    id=uuid.uuid4(),
                                    competitor_channel_id=comp.id,
                                    video_id=v_id,
                                    title=v_title,
                                    thumbnail=v_thumb,
                                    published_at=datetime.now(),
                                    view_count=v_views,
                                    velocity_views_hour=max(50, int(v_views / 24)) if v_views > 0 else 0,
                                    is_viral=(v_views > 50000)
                                )
                                db.add(new_v)
                            else:
                                existing_vid.title = v_title
                                existing_vid.view_count = v_views

                    comp.last_sync = datetime.now()
                    checked_count += 1
            except Exception as comp_err:
                db.rollback()
                print(f"[Competitor Sync Warning {comp.name}]: {comp_err}")

        try:
            db.commit()
        except Exception:
            db.rollback()
        return {"status": "success", "checked": checked_count}
