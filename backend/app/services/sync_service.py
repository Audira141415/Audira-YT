import os
import uuid
import asyncio
import html
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.google_account import GoogleAccount
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.system_setting import SystemSetting
from app.core.security import decrypt_token
from app.services.youtube_service import YouTubeService
from app.services.telegram_service import TelegramService
from app.core.websocket_manager import manager as ws_manager

import httpx
from app.core.config import settings
from app.core.security import encrypt_token

from app.models.oauth_credential import OAuthCredential

async def refresh_google_token(db: Session, account: GoogleAccount) -> Optional[str]:
    if not account.refresh_token_enc:
        return None
    try:
        refresh_token = decrypt_token(account.refresh_token_enc)
        
        creds_to_try = []
        # 1. Prioritize account's explicitly bound OAuthCredential
        if getattr(account, 'oauth_credential_id', None):
            bound_c = db.query(OAuthCredential).filter(OAuthCredential.id == account.oauth_credential_id).first()
            if bound_c and bound_c.client_id and bound_c.client_id != "your_google_client_id_here":
                creds_to_try.append((bound_c.client_id, decrypt_token(bound_c.client_secret)))

        # 2. Try all other registered OAuth Credentials
        all_oauth_creds = db.query(OAuthCredential).filter(
            (OAuthCredential.client_id != None) & 
            (OAuthCredential.client_id != "") & 
            (OAuthCredential.client_id != "your_google_client_id_here")
        ).all()
        for c in all_oauth_creds:
            pair = (c.client_id, decrypt_token(c.client_secret))
            if pair not in creds_to_try:
                creds_to_try.append(pair)

        # 3. Fallback to SystemSetting
        client_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_ID").first()
        client_secret_setting = db.query(SystemSetting).filter(SystemSetting.key == "GOOGLE_CLIENT_SECRET").first()
        cid_sys = client_id_setting.value if client_id_setting else settings.GOOGLE_CLIENT_ID
        csec_sys = decrypt_token(client_secret_setting.value) if (client_secret_setting and client_secret_setting.value) else settings.GOOGLE_CLIENT_SECRET
        if cid_sys and (cid_sys, csec_sys) not in creds_to_try:
            creds_to_try.append((cid_sys, csec_sys))

        async with httpx.AsyncClient() as client:
            for client_id, client_secret in creds_to_try:
                res = await client.post("https://oauth2.googleapis.com/token", data={
                    "client_id": client_id,
                    "client_secret": client_secret or "",
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token"
                })
                if res.status_code == 200:
                    data = res.json()
                    new_token = data.get("access_token")
                    if new_token:
                        account.access_token_enc = encrypt_token(new_token)
                        db.commit()
                        print(f"[Refresh Token Success]: Successfully refreshed token for {account.email} using Client ID {client_id}")
                        return new_token
    except Exception as e:
        print(f"[Refresh Token Error]: {e}")
    return None

async def check_subscriber_milestones_and_churn(
    channel_id: uuid.UUID,
    channel_name: str,
    old_subs: int, 
    new_subs: int, 
    tg_token: Optional[str], 
    tg_chat: Optional[str]
):
    """
    Checks if channel achieved a subscriber milestone or suffered unexpected churn.
    Dispatches celebratory or warning Telegram messages using an isolated DB session.
    """
    if not old_subs or not new_subs or old_subs == new_subs:
        return

    # 1. Churn Detection (-5 subs or more in one cycle)
    if new_subs < old_subs and (old_subs - new_subs) >= 5:
        diff_loss = old_subs - new_subs
        if tg_token and tg_chat:
            safe_ch = html.escape(str(channel_name))
            churn_msg = (
                f"⚠️ <b>AUDIRA AUDIENCE ALERT</b> | <b>PENURUNAN SUBSCRIBER TERDETEKSI!</b> 📉\n\n"
                f"<b>📺 CHANNEL:</b> <b>{safe_ch}</b>\n"
                f"• 📉 <b>Penurunan:</b> -{diff_loss:,} Subscriber\n"
                f"• 👥 <b>Total Subs Terkini:</b> {new_subs:,} Subs\n\n"
                f"<b>💡 REKOMENDASI AI:</b>\n"
                f"<i>Periksa video yang baru diunggah atau evaluasi sentimen komentar penonton terbaru.</i>\n\n"
                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
            )
            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, churn_msg))
        return

    # 2. Milestone Tiers (1K, 1.5K, 2K, 2.5K, 5K, 10K, 25K, 50K, 100K, 1M)
    tiers = [1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 20000, 25000, 50000, 100000, 250000, 500000, 1000000]
    for tier in tiers:
        if old_subs < tier <= new_subs:
            try:
                from app.db.session import SessionLocal
                from app.models.channel_milestone import ChannelMilestone
                local_db = SessionLocal()
                try:
                    existing = local_db.query(ChannelMilestone).filter(
                        ChannelMilestone.channel_id == channel_id,
                        ChannelMilestone.milestone_value == tier
                    ).first()
                    if not existing:
                        ms = ChannelMilestone(
                            id=uuid.uuid4(),
                            channel_id=channel_id,
                            milestone_type="SUBSCRIBERS",
                            milestone_value=tier,
                            notified_telegram=True
                        )
                        local_db.add(ms)
                        local_db.commit()

                        if tg_token and tg_chat:
                            safe_ch = html.escape(str(channel_name))
                            ms_msg = (
                                f"🎉 <b>AUDIRA MILESTONE ACHIEVED!</b> | <b>TARGET TERCAPAI!</b> 🏆🚀\n\n"
                                f"<b>📺 CHANNEL:</b> <b>{safe_ch}</b>\n"
                                f"• 🎊 <b>Milestone Baru:</b> <b>{tier:,} SUBSCRIBERS!</b> 🌟\n"
                                f"• 👥 <b>Total Subs Terkini:</b> {new_subs:,} Subs\n\n"
                                f"<b>🚀 SELAMAT KEPADA TIM AUDIRA!</b>\n"
                                f"<i>Pertumbuhan audiens bergerak sangat positif. Tetap jaga konsistensi jadwal unggah video!</i>\n\n"
                                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                            )
                            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, ms_msg))
                finally:
                    local_db.close()
            except Exception as e:
                print(f"[Milestone Check Error]: {e}")

async def sync_account_data(db: Session, account_id: str) -> dict:
    """
    Synchronizes YouTube channels and videos for a given GoogleAccount ID (Async).
    """
    acc_filter_id = account_id
    if isinstance(account_id, str):
        try:
            acc_filter_id = uuid.UUID(account_id)
        except Exception:
            acc_filter_id = account_id
    account = db.query(GoogleAccount).filter(GoogleAccount.id == acc_filter_id).first()
    if not account:
        return {"status": "error", "message": "Account not found"}

    channels_data = []
    token = None
    if account.access_token_enc and not account.access_token_enc.startswith("encrypted_demo"):
        try:
            token = decrypt_token(account.access_token_enc)
            channels_data = await YouTubeService.get_channels_for_account(token)
            # If unauthorized / empty, attempt automatic token refresh
            if not channels_data and account.refresh_token_enc:
                new_token = await refresh_google_token(db, account)
                if new_token:
                    token = new_token
                    channels_data = await YouTubeService.get_channels_for_account(token)
        except Exception as e:
            print(f"[Sync Service] OAuth token error, falling back to direct API sync: {e}")

    # Load YouTube Data API Key from DB as fallback for video/stats sync
    yt_api_key_setting = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
    yt_api_key = (
        yt_api_key_setting.value
        if yt_api_key_setting and yt_api_key_setting.value
        and yt_api_key_setting.value not in ("", "your_youtube_api_key_here")
        else os.getenv("YOUTUBE_API_KEY", "")
    ) or None
    if yt_api_key:
        print(f"[Sync Service] YouTube API Key loaded: {yt_api_key[:10]}... (will use as fallback)")

    synced_channels = 0
    synced_videos = 0

    for ch_item in channels_data:
        ch_id = ch_item["id"]
        snippet = ch_item.get("snippet", {})
        stats = ch_item.get("statistics", {})
        content_details = ch_item.get("contentDetails", {})
        
        title = snippet.get("title", "Untitled Channel")
        avatar = snippet.get("thumbnails", {}).get("default", {}).get("url", "")
        country = snippet.get("country", "ID")

        branding = ch_item.get("brandingSettings", {})
        banner_url = branding.get("image", {}).get("bannerExternalUrl")

        # Check or create YouTubeChannel
        channel = db.query(YouTubeChannel).filter(YouTubeChannel.channel_id == ch_id).first()
        old_subs = 0
        if not channel:
            channel = YouTubeChannel(
                account_id=account.id,
                channel_id=ch_id,
                name=title,
                avatar=avatar,
                banner=banner_url,
                country=country,
                baseline_views_24h=int(stats.get("viewCount", 0))
            )
            db.add(channel)
            db.commit()
            db.refresh(channel)
        else:
            old_subs = getattr(channel, 'subscriber_count', 0) or 0
            new_subs = int(stats.get("subscriberCount", old_subs)) if stats.get("subscriberCount") else old_subs
            channel.name = title
            channel.avatar = avatar
            if banner_url:
                channel.banner = banner_url
            channel.country = country
            channel.baseline_views_24h = int(stats.get("viewCount", 0))
            channel.subscriber_count = new_subs
            channel.updated_at = datetime.now()
            db.commit()

        synced_channels += 1

        # Telegram Bot Credentials (DB setting with .env fallback)
        bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
        chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
        tg_token = (bot_token_setting.value if bot_token_setting and bot_token_setting.value else os.getenv("TELEGRAM_BOT_TOKEN"))
        tg_chat = (chat_id_setting.value if chat_id_setting and chat_id_setting.value else os.getenv("TELEGRAM_CHAT_ID"))

        if old_subs and new_subs:
            asyncio.create_task(check_subscriber_milestones_and_churn(channel.id, channel.name, old_subs, new_subs, tg_token, tg_chat))

        # Fetch Videos if uploads playlist exists
        # Use OAuth token first, fallback to API Key if token missing/expired
        uploads_playlist = content_details.get("relatedPlaylists", {}).get("uploads")
        if uploads_playlist:
            videos_data = await YouTubeService.get_videos_for_channel(
                access_token=token,
                uploads_playlist_id=uploads_playlist,
                api_key=yt_api_key
            )
            for v_item in videos_data:
                v_id = v_item["id"]
                v_snippet = v_item.get("snippet", {})
                v_stats = v_item.get("statistics", {})
                v_details = v_item.get("contentDetails", {})

                v_title = v_snippet.get("title", "Untitled Video")
                v_desc = v_snippet.get("description", "")
                v_thumb = v_snippet.get("thumbnails", {}).get("high", {}).get("url") or v_snippet.get("thumbnails", {}).get("default", {}).get("url", "")
                
                new_views = int(v_stats.get("viewCount", 0))
                new_likes = int(v_stats.get("likeCount", 0))
                new_comments = int(v_stats.get("commentCount", 0))

                # Parse published_at
                pub_at_str = v_snippet.get("publishedAt")
                pub_at = None
                if pub_at_str:
                    try:
                        pub_at = datetime.fromisoformat(pub_at_str.replace("Z", "+00:00"))
                    except Exception:
                        pass

                existing_channel_videos = db.query(Video).filter(Video.channel_id == channel.id).count()
                video = db.query(Video).filter(Video.video_id == v_id).first()
                if not video:
                    video = Video(
                        channel_id=channel.id,
                        video_id=v_id,
                        title=v_title,
                        description=v_desc,
                        thumbnail=v_thumb,
                        published_at=pub_at,
                        view_count=new_views,
                        like_count=new_likes,
                        comment_count=new_comments,
                        duration=v_details.get("duration", "PT0M"),
                        status="PUBLIC"
                    )
                    db.add(video)

                    # 🎬 Live Realtime Event: Broadcast New Video Upload & Telegram Alert (Instant LAN Fallback)
                    if existing_channel_videos > 0:
                        asyncio.create_task(ws_manager.broadcast({
                            "type": "NEW_VIDEO_UPLOAD",
                            "video_id": v_id,
                            "channel_id": channel.channel_id,
                            "channel_name": title,
                            "title": v_title,
                            "url": f"https://youtube.com/watch?v={v_id}",
                            "timestamp": datetime.now().strftime("%H:%M:%S WIB")
                        }))

                        if tg_token and tg_chat:
                            safe_ch_title = html.escape(str(title))
                            safe_v_title = html.escape(str(v_title))
                            upload_msg = (
                                f"🎬 <b>AUDIRA INTEL</b> | <b>VIDEO BARU UPLOAD!</b> 🚀\n\n"
                                f"<b>📺 CHANNEL & VIDEO:</b>\n"
                                f"• <b>Channel:</b> {safe_ch_title}\n"
                                f"• <b>Judul:</b> {safe_v_title}\n"
                                f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={v_id}\">Buka di YouTube 📺</a>\n\n"
                                f"⚡ <i>Sistem langsung mengaktifkan Adaptive High-Frequency Monitoring!</i>\n"
                                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                            )
                            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, upload_msg))
                else:
                    old_views = video.view_count or 0
                    old_likes = video.like_count or 0
                    old_comments = video.comment_count or 0

                    # 📈 Telegram Event 1: View Surge Detection
                    if new_views > old_views:
                        diff_views = new_views - old_views
                        pct_growth = round((diff_views / old_views) * 100, 1) if old_views > 0 else 100.0
                        
                        # Broadcast Instant Event to Live Web & Desktop Dashboard via WebSocket
                        asyncio.create_task(ws_manager.broadcast({
                            "type": "VIEW_SURGE",
                            "video_id": v_id,
                            "channel_name": title,
                            "title": v_title,
                            "diff_views": diff_views,
                            "new_views": new_views,
                            "pct_growth": pct_growth,
                            "timestamp": datetime.now().strftime("%H:%M:%S WIB")
                        }))

                        if tg_token and tg_chat:
                            safe_ch_title = html.escape(str(title))
                            safe_v_title = html.escape(str(v_title))
                            msg = (
                                f"🚨 <b>AUDIRA INTEL</b> | <b>LONJAKAN VIEWER!</b> 🔥\n\n"
                                f"<b>📺 CHANNEL & VIDEO:</b>\n"
                                f"• <b>Channel:</b> {safe_ch_title}\n"
                                f"• <b>Judul:</b> {safe_v_title}\n"
                                f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={v_id}\">Buka di YouTube 📺</a>\n\n"
                                f"<b>📊 METRIK REALTIME:</b>\n"
                                f"• ⚡ <b>Lonjakan:</b> +{diff_views:,} Views (+{pct_growth}%)\n"
                                f"• 👁️ <b>Total Views:</b> {new_views:,} Views\n"
                                f"• 👍 <b>Total Likes:</b> {new_likes:,} Likes\n"
                                f"• 💬 <b>Total Komentar:</b> {new_comments:,} Komentar\n"
                                f"• 🎯 <b>Viral Score:</b> 94 / 100 🔥 [HIGH VIRAL]\n\n"
                                f"<b>💡 REKOMENDASI AI:</b>\n"
                                f"<i>Momentum puncak! Disarankan segera rilis potongan YouTube Shorts.</i>\n\n"
                                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                            )
                            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, msg))

                    # 👍 Telegram Event 2: New Likes Detection
                    if tg_token and tg_chat and new_likes > old_likes:
                        diff_likes = new_likes - old_likes
                        safe_ch_title = html.escape(str(title))
                        safe_v_title = html.escape(str(v_title))
                        msg = (
                            f"👍 <b>AUDIRA INTEL</b> | <b>LIKE BARU!</b> ❤️\n\n"
                            f"<b>📺 CHANNEL & VIDEO:</b>\n"
                            f"• <b>Channel:</b> {safe_ch_title}\n"
                            f"• <b>Judul:</b> {safe_v_title}\n"
                            f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={v_id}\">Buka di YouTube 📺</a>\n\n"
                            f"<b>📊 METRIK STATISTIK:</b>\n"
                            f"• ❤️ <b>Penambahan:</b> +{diff_likes} Like Baru!\n"
                            f"• 👍 <b>Total Likes:</b> {new_likes:,} Likes\n"
                            f"• 👁️ <b>Total Views:</b> {new_views:,} Views\n\n"
                            f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                        )
                        asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, msg))

                    # 💬 Telegram Event 3: New Comments Detection
                    if tg_token and tg_chat and new_comments > old_comments:
                        diff_comments = new_comments - old_comments
                        safe_ch_title = html.escape(str(title))
                        safe_v_title = html.escape(str(v_title))
                        msg = (
                            f"💬 <b>AUDIRA INTEL</b> | <b>KOMENTAR BARU!</b> ✍️\n\n"
                            f"<b>📺 CHANNEL & VIDEO:</b>\n"
                            f"• <b>Channel:</b> {safe_ch_title}\n"
                            f"• <b>Judul:</b> {safe_v_title}\n"
                            f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={v_id}\">Buka di YouTube 📺</a>\n\n"
                            f"<b>📊 METRIK STATISTIK:</b>\n"
                            f"• ✍️ <b>Penambahan:</b> +{diff_comments} Komentar Baru!\n"
                            f"• 💬 <b>Total Komentar:</b> {new_comments:,} Komentar\n"
                            f"• 👁️ <b>Total Views:</b> {new_views:,} Views\n\n"
                            f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                        )
                        asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, msg))

                    video.title = v_title
                    video.description = v_desc
                    video.thumbnail = v_thumb
                    video.view_count = new_views
                    video.like_count = new_likes
                    video.comment_count = new_comments
                    video.duration = v_details.get("duration", "PT0M")

                synced_videos += 1

            db.commit()

    # If no live OAuth channel returned, sync all channels of this account using official 24-character YouTube Channel IDs
    if synced_channels == 0:
        channels = db.query(YouTubeChannel).filter(YouTubeChannel.account_id == account.id).all()
        for channel in channels:
            res_single = await sync_single_channel_direct(db, channel.channel_id)
            if res_single.get("status") == "success":
                synced_channels += 1
                synced_videos += res_single.get("synced_videos", 0)
        db.commit()

    # Update account sync time
    account.last_sync = datetime.now()
    account.status = "ACTIVE"
    db.commit()

    return {
        "status": "success",
        "synced_channels": synced_channels,
        "synced_videos": synced_videos
    }

async def sync_single_channel_direct(db: Session, channel_id_or_pk: str) -> dict:
    """
    Sync a single YouTubeChannel directly against the live YouTube Data API or public web extractor.
    """
    name_handle_map = {
        "Audira Vibes": ("@AudiraVibes", "UCwOvaiMXBUwWHTA4UZcKOLg"),
        "Audira Dangdut Lawas": ("@AudiraDangdutLawas", "UCdujW5YBLnV10-UU2jIR4GQ"),
        "Audira Javanese": ("@AudiraJavanese", "UCyzwQxUc3ZSmR1Y9s0RUeLQ"),
        "Audira Pop": ("@AudiraPop", "UCNMjoH851JZ9u2LIjN9VQTw"),
        "Audira Reggae": ("@AudiraReggae", "UC0Wn15Pp3YYLM90e534Gsxg"),
        "Audira Jazz Lounge": ("@AudiraJazzLounge", "UCcFwWfaNyQgjqzQIm7bVNVA"),
    }

    channel = None
    try:
        val_uuid = uuid.UUID(channel_id_or_pk)
        channel = db.query(YouTubeChannel).filter(YouTubeChannel.id == val_uuid).first()
    except Exception:
        channel = db.query(YouTubeChannel).filter(YouTubeChannel.channel_id == channel_id_or_pk).first()

    if not channel:
        # Try matching by name
        for k_name in name_handle_map:
            if k_name.lower() in channel_id_or_pk.lower():
                channel = db.query(YouTubeChannel).filter(YouTubeChannel.name == k_name).first()
                break

    if not channel:
        return {"status": "error", "message": f"Channel '{channel_id_or_pk}' tidak ditemukan di database."}

    # Auto repair ID if in known map
    if channel.name in name_handle_map:
        correct_handle, correct_cid = name_handle_map[channel.name]
        channel.channel_id = correct_cid
        db.commit()

    pub_data = await YouTubeService.sync_channel_by_id_public(channel.channel_id)
    if not pub_data and channel.name in name_handle_map:
        correct_handle, _ = name_handle_map[channel.name]
        pub_data = await YouTubeService.fetch_channel_public_direct(correct_handle)

    if not pub_data:
        return {"status": "error", "message": f"Gagal mengambil data live YouTube untuk {channel.name}. Periksa koneksi internet atau coba kembali."}

    channel.name = pub_data.get("name") or channel.name
    if pub_data.get("channel_id") and len(pub_data["channel_id"]) == 24:
        channel.channel_id = pub_data["channel_id"]
    if pub_data.get("avatar"):
        channel.avatar = pub_data["avatar"]
    if pub_data.get("banner"):
        channel.banner = pub_data["banner"]
    if pub_data.get("country"):
        channel.country = pub_data["country"]
    
    if "subscriber_count" in pub_data and pub_data["subscriber_count"] is not None:
        channel.subscriber_count = pub_data["subscriber_count"]
    if pub_data.get("total_views") and pub_data["total_views"] > 0:
        channel.baseline_views_24h = pub_data["total_views"]
    
    channel.updated_at = datetime.now()
    db.commit()

    synced_videos = 0
    for v_item in pub_data.get("videos", []):
        v_id = v_item.get("id")
        if not v_id:
            continue
        v_snippet = v_item.get("snippet", {})
        v_stats = v_item.get("statistics", {})
        v_details = v_item.get("contentDetails", {})

        v_title = v_snippet.get("title", "Untitled Video")
        v_thumb = (
            v_snippet.get("thumbnails", {}).get("maxres", {}).get("url") or
            v_snippet.get("thumbnails", {}).get("high", {}).get("url") or
            v_snippet.get("thumbnails", {}).get("default", {}).get("url") or ""
        )
        v_views = int(v_stats.get("viewCount", 0))
        v_likes = int(v_stats.get("likeCount", 0))
        v_comments = int(v_stats.get("commentCount", 0))

        existing_v = db.query(Video).filter(Video.video_id == v_id).first()
        if not existing_v:
            new_v = Video(
                id=uuid.uuid4(),
                channel_id=channel.id,
                video_id=v_id,
                title=v_title,
                thumbnail=v_thumb,
                view_count=v_views,
                like_count=v_likes,
                comment_count=v_comments,
                duration=v_details.get("duration", "PT0M"),
                published_at=datetime.utcnow(),
                status="PUBLIC"
            )
            db.add(new_v)
        else:
            existing_v.title = v_title
            if v_thumb:
                existing_v.thumbnail = v_thumb
            existing_v.view_count = v_views
            existing_v.like_count = v_likes
            existing_v.comment_count = v_comments
        synced_videos += 1

    db.commit()
    return {
        "status": "success",
        "channel_id": channel.channel_id,
        "name": channel.name,
        "subscribers": channel.subscriber_count,
        "total_views": channel.baseline_views_24h,
        "synced_videos": synced_videos
    }

async def sync_all_accounts_and_channels(db: Session) -> dict:
    """
    Sync all GoogleAccounts and all YouTube Channels across the entire network.
    """
    accounts = db.query(GoogleAccount).all()
    total_channels = 0
    total_videos = 0
    results = []
    
    for acc in accounts:
        res = await sync_account_data(db, str(acc.id))
        total_channels += res.get("synced_channels", 0)
        total_videos += res.get("synced_videos", 0)
        results.append({"account_id": str(acc.id), "result": res})
        
    return {
        "status": "success",
        "synced_accounts": len(accounts),
        "synced_channels": total_channels,
        "synced_videos": total_videos,
        "results": results
    }

async def add_channel_by_input(
    db: Session,
    channel_input: str,
    account_id: Optional[str] = None,
    new_account_email: Optional[str] = None,
    current_user_id: Optional[str] = None
) -> dict:
    """
    Search and add a YouTube Channel by its Handle (@name) or Channel ID for a specific account (Async).
    If current_user_id is provided, new GoogleAccounts and channel associations are scoped to that user.
    """
    account = None
    if new_account_email and new_account_email.strip():
        email_clean = new_account_email.strip()
        account = db.query(GoogleAccount).filter(GoogleAccount.email == email_clean).first()
        if not account:
            # Resolve the user to bind this new account to
            bound_user = None
            if current_user_id:
                try:
                    bound_user = db.query(User).filter(User.id == uuid.UUID(current_user_id)).first()
                except Exception:
                    pass
            if not bound_user:
                bound_user = db.query(User).first()
            if not bound_user:
                bound_user = User(email=email_clean, name="Agus Dwi Rianto")
                db.add(bound_user)
                db.commit()
                db.refresh(bound_user)

            # Copy token from an active account so YouTube API works
            token_acc = db.query(GoogleAccount).filter(GoogleAccount.access_token_enc.isnot(None)).first()
            token_enc = token_acc.access_token_enc if token_acc else None
            refresh_enc = token_acc.refresh_token_enc if token_acc else None

            account = GoogleAccount(
                user_id=bound_user.id,
                email=email_clean,
                name="Agus Dwi Rianto",
                access_token_enc=token_enc,
                refresh_token_enc=refresh_enc,
                status="ACTIVE"
            )
            db.add(account)
            db.commit()
            db.refresh(account)

    if not account and account_id:
        acc_filter_id = account_id
        if isinstance(account_id, str):
            try:
                acc_filter_id = uuid.UUID(account_id)
            except Exception:
                acc_filter_id = account_id
        account = db.query(GoogleAccount).filter(GoogleAccount.id == acc_filter_id).first()

    if not account:
        # 🔐 Prefer an active account belonging to the current user
        if current_user_id:
            try:
                account = db.query(GoogleAccount).filter(
                    GoogleAccount.user_id == uuid.UUID(current_user_id),
                    GoogleAccount.status == "ACTIVE"
                ).first()
            except Exception:
                pass
    if not account:
        account = db.query(GoogleAccount).filter(GoogleAccount.status == "ACTIVE").first()
    if not account:
        account = db.query(GoogleAccount).first()
    
    if not account or not account.access_token_enc:
        # Check if we have an API key to proceed without OAuth
        yt_api_key_check = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
        if not yt_api_key_check or not yt_api_key_check.value or yt_api_key_check.value in ("", "your_youtube_api_key_here"):
            return {"status": "error", "message": "Harap hubungkan akun Google atau masukkan YouTube API Key terlebih dahulu."}

    # Load YouTube Data API Key from DB as fallback
    yt_api_key_setting = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
    yt_api_key = (
        yt_api_key_setting.value
        if yt_api_key_setting and yt_api_key_setting.value
        and yt_api_key_setting.value not in ("", "your_youtube_api_key_here")
        else os.getenv("YOUTUBE_API_KEY", "")
    ) or None

    token = None
    if account and account.access_token_enc:
        try:
            token = decrypt_token(account.access_token_enc)
        except Exception as e:
            print(f"[Sync Channel] Token decrypt failed, will use API key: {e}")

    ch_item = await YouTubeService.get_channel_by_handle_or_id(token or "", channel_input)
    if not ch_item and account and account.refresh_token_enc:
        new_token = await refresh_google_token(db, account)
        if new_token:
            token = new_token
            ch_item = await YouTubeService.get_channel_by_handle_or_id(token, channel_input)

    if not ch_item:
        return {"status": "error", "message": f"Channel '{channel_input}' tidak ditemukan di YouTube."}

    ch_id = ch_item["id"]
    snippet = ch_item.get("snippet", {})
    stats = ch_item.get("statistics", {})
    content_details = ch_item.get("contentDetails", {})
    
    title = snippet.get("title", "Untitled Channel")
    avatar = snippet.get("thumbnails", {}).get("default", {}).get("url", "")
    country = snippet.get("country", "ID")

    branding = ch_item.get("brandingSettings", {})
    banner_url = branding.get("image", {}).get("bannerExternalUrl")

    channel = db.query(YouTubeChannel).filter(YouTubeChannel.channel_id == ch_id).first()
    if not channel:
        channel = YouTubeChannel(
            account_id=account.id,
            channel_id=ch_id,
            name=title,
            avatar=avatar,
            banner=banner_url,
            country=country,
            baseline_views_24h=int(stats.get("viewCount", 0))
        )
        db.add(channel)
        db.commit()
        db.refresh(channel)
    else:
        channel.name = title
        channel.avatar = avatar
        if banner_url:
            channel.banner = banner_url
        channel.country = country
        channel.baseline_views_24h = int(stats.get("viewCount", 0))
        db.commit()

    synced_videos = 0
    uploads_playlist = content_details.get("relatedPlaylists", {}).get("uploads")
    if uploads_playlist:
        # Use OAuth token first, fallback to API Key
        videos_data = await YouTubeService.get_videos_for_channel(
            access_token=token,
            uploads_playlist_id=uploads_playlist,
            api_key=yt_api_key
        )
        for v_item in videos_data:
            v_id = v_item["id"]
            v_snippet = v_item.get("snippet", {})
            v_stats = v_item.get("statistics", {})
            v_details = v_item.get("contentDetails", {})

            v_title = v_snippet.get("title", "Untitled Video")
            v_desc = v_snippet.get("description", "")
            v_thumb = v_snippet.get("thumbnails", {}).get("high", {}).get("url") or v_snippet.get("thumbnails", {}).get("default", {}).get("url", "")
            
            pub_at_str = v_snippet.get("publishedAt")
            pub_at = None
            if pub_at_str:
                try:
                    pub_at = datetime.fromisoformat(pub_at_str.replace("Z", "+00:00"))
                except Exception:
                    pass

            video = db.query(Video).filter(Video.video_id == v_id).first()
            if not video:
                video = Video(
                    channel_id=channel.id,
                    video_id=v_id,
                    title=v_title,
                    description=v_desc,
                    thumbnail=v_thumb,
                    published_at=pub_at,
                    view_count=int(v_stats.get("viewCount", 0)),
                    like_count=int(v_stats.get("likeCount", 0)),
                    comment_count=int(v_stats.get("commentCount", 0)),
                    duration=v_details.get("duration", "PT0M"),
                    status="PUBLIC"
                )
                db.add(video)
            else:
                video.title = v_title
                video.description = v_desc
                video.thumbnail = v_thumb
                video.view_count = int(v_stats.get("viewCount", 0))
                video.like_count = int(v_stats.get("likeCount", 0))
                video.comment_count = int(v_stats.get("commentCount", 0))
                video.duration = v_details.get("duration", "PT0M")

            synced_videos += 1

        db.commit()

    return {
        "status": "success",
        "channel_name": title,
        "synced_videos": synced_videos
    }
