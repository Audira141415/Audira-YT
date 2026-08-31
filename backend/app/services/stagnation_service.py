import html
import asyncio
import os
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.system_setting import SystemSetting
from app.services.telegram_service import TelegramService

class StagnationService:
    @staticmethod
    async def evaluate_video_stagnation(db: Session) -> Dict[str, Any]:
        """
        Evaluates videos published within the last 24 hours.
        Alerts if view velocity is severely underperforming channel baseline.
        """
        now = datetime.now()
        one_day_ago = now - timedelta(hours=24)
        three_hours_ago = now - timedelta(hours=3)

        recent_videos = db.query(Video).filter(
            (Video.published_at != None) &
            (Video.published_at >= one_day_ago) &
            (Video.published_at <= three_hours_ago)
        ).all()

        if not recent_videos:
            return {"status": "success", "evaluated": 0, "stagnant_count": 0}

        bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
        chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
        tg_token = bot_token_setting.value if bot_token_setting and bot_token_setting.value else os.getenv("TELEGRAM_BOT_TOKEN")
        tg_chat = chat_id_setting.value if chat_id_setting and chat_id_setting.value else os.getenv("TELEGRAM_CHAT_ID")

        stagnant_videos = []
        for v in recent_videos:
            ch = v.channel
            if not ch:
                continue
            
            # Expected views in 3-6h based on channel baseline (e.g. 5% of 24h baseline)
            expected_views = max(50, int((ch.baseline_views_24h or 500) * 0.08))
            actual_views = v.view_count or 0

            # If actual views < 25% of expected views
            if actual_views < int(expected_views * 0.25):
                stagnant_videos.append({
                    "video_id": v.video_id,
                    "title": v.title,
                    "channel_name": ch.name,
                    "actual_views": actual_views,
                    "expected_views": expected_views
                })

                if tg_token and tg_chat:
                    safe_ch = html.escape(str(ch.name))
                    safe_title = html.escape(str(v.title))
                    stagnant_alert = (
                        f"📉 <b>AUDIRA AI ADVISOR</b> | <b>PERINGATAN TRAFIK STAGNAN!</b> ⚠️\n\n"
                        f"<b>📺 CHANNEL & VIDEO:</b>\n"
                        f"• <b>Channel:</b> {safe_ch}\n"
                        f"• <b>Judul:</b> {safe_title}\n"
                        f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={v.video_id}\">Buka di YouTube 📺</a>\n\n"
                        f"<b>📊 ANALISIS VELOSITAS AWAL:</b>\n"
                        f"• 👁️ <b>Views Saat Ini:</b> {actual_views:,} Views (Sangat Rendah)\n"
                        f"• 🎯 <b>Target Normal:</b> {expected_views:,} Views dalam 3-6 Jam Pertama\n"
                        f"• 📉 <b>Status:</b> Underperforming Traksi Algoritma\n\n"
                        f"<b>💡 REKOMENDASI PENYELAMATAN AI:</b>\n"
                        f"1. 🎨 <b>Revisi Thumbnail:</b> Naikkan saturasi warna & perbesar teks judul di cover thumbnail.\n"
                        f"2. ✍️ <b>Optimasi Judul:</b> Gunakan kata kunci yang lebih memicu emosi / rasa penasaran penonton.\n"
                        f"3. 📱 <b>Boost YouTube Shorts:</b> Rilis 1 potongan klip Shorts 15-detik untuk mengarahkan penonton ke video ini.\n\n"
                        f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                    )
                    asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, stagnant_alert))

        return {
            "status": "success",
            "evaluated": len(recent_videos),
            "stagnant_count": len(stagnant_videos),
            "stagnant_videos": stagnant_videos
        }
