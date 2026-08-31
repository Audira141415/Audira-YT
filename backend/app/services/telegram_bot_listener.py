import asyncio
import html
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import httpx

import app.db.base
from app.db.session import SessionLocal
from app.models.system_setting import SystemSetting
from app.models.youtube_channel import YouTubeChannel
from app.models.google_account import GoogleAccount
from app.models.video import Video
from app.models.user import User
from app.services.telegram_service import TelegramService

# Global state for mute functionality
mute_until: Optional[datetime] = None

def is_alerts_muted() -> bool:
    global mute_until
    if mute_until and datetime.now() < mute_until:
        return True
    return False

class TelegramBotListener:
    @staticmethod
    async def get_bot_credentials() -> tuple[Optional[str], Optional[str]]:
        db = SessionLocal()
        try:
            bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
            chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
            tg_token = bot_token_setting.value if bot_token_setting and bot_token_setting.value else os.getenv("TELEGRAM_BOT_TOKEN")
            tg_chat = chat_id_setting.value if chat_id_setting and chat_id_setting.value else os.getenv("TELEGRAM_CHAT_ID")
            return tg_token, tg_chat
        finally:
            db.close()

    @staticmethod
    async def handle_command(command_text: str, chat_id: str, sender_name: str, tg_token: str) -> None:
        global mute_until
        cmd = command_text.strip().lower().split()[0]
        args = command_text.strip().split()[1:]

        time_now = datetime.now().strftime("%H:%M:%S WIB")

        # 1. /start or /help
        if cmd in ["/start", "/help", "/bantuan"]:
            help_msg = (
                f"🤖 <b>AUDIRA YT COMMAND CENTER</b> | <b>BANTUAN PERINTAH</b>\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"Halo <b>{html.escape(sender_name)}</b>! Berikut perintah bot yang tersedia:\n\n"
                f"📊 <code>/status</code> atau <code>/ringkasan</code>\n"
                f"<i>Melihat ringkasan realtime metrik 6 channel YouTube.</i>\n\n"
                f"🔥 <code>/top</code>\n"
                f"<i>Melihat 3 video dengan view & lonjakan tertinggi.</i>\n\n"
                f"🔄 <code>/sync</code>\n"
                f"<i>Menjalankan sinkronisasi data YouTube detik ini juga.</i>\n\n"
                f"🎯 <code>/milestones</code>\n"
                f"<i>Melihat progress target subscriber setiap channel.</i>\n\n"
                f"🕵️ <code>/competitors</code>\n"
                f"<i>Melihat radar radar intelijen channel kompetitor.</i>\n\n"
                f"🔇 <code>/mute [1h/30m]</code> & <code>/unmute</code>\n"
                f"<i>Mengatur mode hening notifikasi lonjakan view.</i>\n"
                f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                f"🕒 <i>{time_now}</i>"
            )
            await TelegramService.send_telegram_message(tg_token, chat_id, help_msg)

        # 2. /status or /ringkasan
        elif cmd in ["/status", "/ringkasan", "/summary"]:
            db = SessionLocal()
            try:
                channels = db.query(YouTubeChannel).all()
                total_views = sum((c.baseline_views_24h or 0) for c in channels)
                total_subs = sum((c.subscriber_count or 0) for c in channels)
                total_vids = db.query(Video).count()
                
                ch_lines = []
                for idx, c in enumerate(channels, 1):
                    c_views = c.baseline_views_24h or 0
                    c_subs = c.subscriber_count or 0
                    ch_lines.append(f"{idx}. <b>{html.escape(c.name)}</b>: {c_subs:,} Subs • {c_views:,} Views")
                
                ch_summary_str = "\n".join(ch_lines) if ch_lines else "Belum ada channel terdaftar."
                status_msg = (
                    f"📊 <b>AUDIRA YT MONITOR</b> | <b>STATUS REALTIME</b> 🚀\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"👥 <b>Total Subscriber:</b> {total_subs:,} Subs\n"
                    f"👁️ <b>Total Views 24H:</b> {total_views:,} Views\n"
                    f"📹 <b>Total Video Aktif:</b> {total_vids} Videos\n"
                    f"🖥️ <b>Server Engine:</b> 24/7 Mini PC (Online 🟢)\n\n"
                    f"<b>📺 DETAIL PER-CHANNEL:</b>\n"
                    f"{ch_summary_str}\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M:%S')} WIB</i>"
                )
                await TelegramService.send_telegram_message(tg_token, chat_id, status_msg)
            finally:
                db.close()

        # 3. /top
        elif cmd in ["/top", "/trending", "/viral"]:
            db = SessionLocal()
            try:
                top_vids = db.query(Video).order_by(Video.view_count.desc()).limit(3).all()
                vid_lines = []
                for idx, v in enumerate(top_vids, 1):
                    ch_name = v.channel.name if v.channel else "Audira Channel"
                    views = v.view_count or 0
                    likes = v.like_count or 0
                    comments = v.comment_count or 0
                    vid_lines.append(
                        f"<b>#{idx} {html.escape(v.title)}</b>\n"
                        f"• Channel: <i>{html.escape(ch_name)}</i>\n"
                        f"• 👁️ {views:,} Views | 👍 {likes:,} Likes | 💬 {comments:,} Komen\n"
                        f"• 🔗 <a href=\"https://youtube.com/watch?v={v.video_id}\">Tonton di YouTube</a>"
                    )
                vids_str = "\n\n".join(vid_lines) if vid_lines else "Tidak ada data video."
                top_msg = (
                    f"🔥 <b>AUDIRA TOP PERFORMING VIDEOS</b> 🔥\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"{vids_str}\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🕒 <i>{time_now}</i>"
                )
                await TelegramService.send_telegram_message(tg_token, chat_id, top_msg)
            finally:
                db.close()

        # 4. /sync
        elif cmd in ["/sync", "/refresh", "/tarik"]:
            await TelegramService.send_telegram_message(
                tg_token, chat_id, 
                "⏳ <i>Memulai sinkronisasi cepat 6 channel & video dari YouTube API...</i>"
            )
            from app.services.sync_service import sync_account_data
            db = SessionLocal()
            synced_count = 0
            try:
                accs = db.query(GoogleAccount).all()
                for a in accs:
                    temp_db = SessionLocal()
                    try:
                        await sync_account_data(temp_db, str(a.id))
                        synced_count += 1
                    except Exception as e:
                        print(f"[Manual Sync Error {a.id}]:", e)
                    finally:
                        temp_db.close()
                
                await TelegramService.send_telegram_message(
                    tg_token, chat_id,
                    f"✅ <b>SINKRONISASI BERHASIL!</b>\n\n"
                    f"Sebanyak <b>{synced_count} Akun Google & 6 YouTube Channel</b> telah diperbarui secara realtime detik ini juga! 🚀"
                )
            finally:
                db.close()

        # 5. /milestones
        elif cmd in ["/milestones", "/milestone", "/target"]:
            db = SessionLocal()
            try:
                channels = db.query(YouTubeChannel).all()
                lines = []
                for c in channels:
                    current_subs = c.subscriber_count or 0
                    # Determine next milestone tier
                    tiers = [100, 500, 1000, 1500, 2000, 2500, 5000, 10000, 25000, 50000, 100000, 500000, 1000000]
                    next_tier = next((t for t in tiers if t > current_subs), current_subs + 100)
                    progress_pct = min(100.0, round((current_subs / next_tier) * 100, 1)) if next_tier > 0 else 0.0
                    remaining = next_tier - current_subs
                    lines.append(
                        f"🎯 <b>{html.escape(c.name)}</b>\n"
                        f"• Status: <b>{current_subs:,}</b> / {next_tier:,} Subs ({progress_pct}%)\n"
                        f"• Kurang: <b>+{remaining:,} Subs</b> menuju Target Milestone!"
                    )
                ms_msg = (
                    f"🏆 <b>AUDIRA SUBSCRIBER MILESTONES RADAR</b> 🏆\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"{'\n\n'.join(lines)}\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🕒 <i>{time_now}</i>"
                )
                await TelegramService.send_telegram_message(tg_token, chat_id, ms_msg)
            finally:
                db.close()

        # 6. /mute and /unmute
        elif cmd in ["/mute", "/silent", "/hening"]:
            duration_minutes = 60 # default 1 hour
            if args:
                arg = args[0].lower()
                if "m" in arg:
                    try:
                        duration_minutes = int(arg.replace("m", ""))
                    except Exception:
                        pass
                elif "h" in arg:
                    try:
                        duration_minutes = int(arg.replace("h", "")) * 60
                    except Exception:
                        pass
            
            mute_until = datetime.now() + timedelta(minutes=duration_minutes)
            mute_str = mute_until.strftime("%H:%M WIB")
            await TelegramService.send_telegram_message(
                tg_token, chat_id,
                f"🔇 <b>MODE HENING DIAKTIFKAN!</b>\n\n"
                f"Notifikasi lonjakan views minor dinonaktifkan sementara hingga <b>{mute_str}</b> ({duration_minutes} menit).\n"
                f"<i>Alert kritis (server disconnect / copyright claim) tetap akan dikirimkan demi keamanan.</i>\n\n"
                f"Ketik <code>/unmute</code> untuk mengaktifkan kembali sewaktu-waktu."
            )

        elif cmd in ["/unmute", "/un-mute", "/aktif"]:
            mute_until = None
            await TelegramService.send_telegram_message(
                tg_token, chat_id,
                f"🔔 <b>MODE NOTIFIKASI AKTIF KEMBALI!</b>\n\n"
                f"Seluruh alert lonjakan views dan update realtime 6 channel telah berjalan normal 100%."
            )

        # 7. /competitors
        elif cmd in ["/competitors", "/kompetitor", "/pesaing"]:
            from app.models.competitor import CompetitorChannel, CompetitorVideo
            db = SessionLocal()
            try:
                comps = db.query(CompetitorChannel).all()
                if not comps:
                    comp_msg = (
                        f"🕵️ <b>AUDIRA COMPETITOR RADAR</b>\n\n"
                        f"Belum ada channel kompetitor yang didaftarkan.\n"
                        f"Anda dapat menambahkan channel kompetitor melalui Dashboard web di menu <b>Competitor Radar</b>."
                    )
                else:
                    lines = []
                    for c in comps:
                        recent_vid = db.query(CompetitorVideo).filter(CompetitorVideo.competitor_channel_id == c.id).order_by(CompetitorVideo.published_at.desc()).first()
                        vid_title = f"• Rilis Terakhir: \"{html.escape(recent_vid.title[:30])}...\" (+{recent_vid.view_count:,} views)" if recent_vid else "• Belum ada video terdeteksi"
                        lines.append(
                            f"🕵️ <b>{html.escape(c.name)}</b> ({c.niche})\n"
                            f"• {c.subscriber_count:,} Subs • {c.total_views:,} Total Views\n"
                            f"{vid_title}"
                        )
                    comp_msg = (
                        f"🕵️ <b>AUDIRA COMPETITOR RADAR (LIVE INTEL)</b>\n"
                        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        f"{'\n\n'.join(lines)}\n"
                        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        f"🕒 <i>{time_now}</i>"
                    )
                await TelegramService.send_telegram_message(tg_token, chat_id, comp_msg)
            finally:
                db.close()

        else:
            await TelegramService.send_telegram_message(
                tg_token, chat_id,
                f"❓ Perintah <code>{html.escape(cmd)}</code> tidak dikenali.\nKetik <code>/help</code> untuk melihat daftar perintah."
            )

    @classmethod
    async def start_long_polling_loop(cls):
        """
        Background listener loop using Telegram getUpdates long-polling.
        Zero port forwarding / reverse proxy needed on Mini PC LAN!
        """
        print("[TELEGRAM BOT LISTENER]: Starting Two-Way Interactive Command Polling Loop 🚀")
        offset = 0
        while True:
            try:
                tg_token, tg_chat = await cls.get_bot_credentials()
                if not tg_token:
                    await asyncio.sleep(15)
                    continue

                url = f"https://api.telegram.org/bot{tg_token.strip()}/getUpdates"
                params = {
                    "offset": offset,
                    "timeout": 10,
                    "allowed_updates": ["message"]
                }

                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.get(url, params=params)
                    if resp.status_code == 200:
                        data = resp.json()
                        for update in data.get("result", []):
                            offset = update["update_id"] + 1
                            msg = update.get("message", {})
                            text = msg.get("text", "")
                            chat = msg.get("chat", {})
                            chat_id = str(chat.get("id", ""))
                            sender = msg.get("from", {})
                            sender_name = sender.get("first_name", "Audira Admin")

                            # Security check: Check against configured chat ID or target group
                            clean_tg_chat = str(tg_chat).strip() if tg_chat else ""
                            # If chat_id matches or group matches
                            if text.startswith("/"):
                                if clean_tg_chat and (chat_id == clean_tg_chat or str(chat.get("id", "")) in clean_tg_chat or clean_tg_chat in str(chat_id)):
                                    asyncio.create_task(cls.handle_command(text, chat_id, sender_name, tg_token))
                                elif not clean_tg_chat:
                                    asyncio.create_task(cls.handle_command(text, chat_id, sender_name, tg_token))
                                else:
                                    print(f"[TELEGRAM SECURITY]: Ignored command from unauthorized chat ID: {chat_id}")
            except asyncio.CancelledError:
                print("[TELEGRAM BOT LISTENER]: Loop cancelled gracefully.")
                break
            except Exception as e:
                # Sleep briefly on network error before retry
                await asyncio.sleep(5)

            await asyncio.sleep(1)
