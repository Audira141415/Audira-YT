from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.db.session import get_db, SessionLocal
from app.models.comment import Comment, AutoReplyRule
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.google_account import GoogleAccount
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.services.youtube_service import YouTubeService
from app.core.security import decrypt_token
from app.api.deps import get_current_active_user

router = APIRouter()

SPAM_KEYWORDS = [
    "bit.ly", "t.me", "t.co", "goo.gl", "tinyurl", "ow.ly",
    "whatsapp.com/invite", "telegram.me", "join now", "free money",
    "earn $", "crypto profit", "bitcoin", "investment profit",
    "link download gratis", "free followers", "sub4sub",
    "click here", "subscribe back", "follow back",
]

def classify_sentiment(text: str) -> str:
    text_lower = text.lower()
    for kw in SPAM_KEYWORDS:
        if kw in text_lower:
            return "SPAM"
    positive_kw = ["mantap", "keren", "bagus", "luar biasa", "top", "suka", "love", "enak", "merdu",
                   "indah", "syahdu", "great", "amazing", "good", "nice", "thanks", "terimakasih",
                   "terima kasih", "awesome", "lanjutkan", "terus", "semangat", "support"]
    for kw in positive_kw:
        if kw in text_lower:
            return "POSITIVE"
    return "NEUTRAL"

# Shared sync status (in-memory, reset on restart)
_sync_status = {"running": False, "last_result": None}

async def _do_sync_comments():
    """Background coroutine that fetches real YouTube comments."""
    import asyncio
    global _sync_status
    _sync_status["running"] = True

    db = SessionLocal()
    try:
        yt_key_setting = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
        yt_api_key = (
            yt_key_setting.value
            if yt_key_setting and yt_key_setting.value
            and yt_key_setting.value not in ("", "your_youtube_api_key_here")
            else None
        )

        videos = db.query(Video).order_by(Video.published_at.desc()).limit(30).all()
        if not videos:
            _sync_status["last_result"] = {"total_new": 0, "total_in_db": 0, "message": "Tidak ada video."}
            return

        # Pre-load token map
        token_map: dict = {}
        channels = db.query(YouTubeChannel).all()
        accounts = db.query(GoogleAccount).all()
        acc_map = {str(a.id): a for a in accounts}
        for ch in channels:
            acc = acc_map.get(str(ch.account_id))
            if acc and acc.access_token_enc:
                try:
                    token_map[str(ch.id)] = decrypt_token(acc.access_token_enc)
                except Exception:
                    pass

        existing_ids = set(row[0] for row in db.query(Comment.youtube_comment_id).all())
        total_new = 0
        all_new_comments = []

        async def fetch_one(video):
            token = token_map.get(str(video.channel_id))
            try:
                return video, await asyncio.wait_for(
                    YouTubeService.get_comments_for_video(
                        video_id=video.video_id, access_token=token,
                        api_key=yt_api_key, max_results=20
                    ), timeout=12.0
                )
            except Exception:
                return video, []

        BATCH = 10
        for i in range(0, len(videos), BATCH):
            batch = videos[i:i + BATCH]
            results = await asyncio.gather(*[fetch_one(v) for v in batch])
            for video, comments_data in results:
                for cmt in comments_data:
                    cmt_id = cmt.get("youtube_comment_id", "")
                    if not cmt_id or cmt_id in existing_ids:
                        continue
                    text = cmt.get("text_display", "")
                    sentiment = classify_sentiment(text)
                    pub_str = cmt.get("published_at", "")
                    pub_at = None
                    if pub_str:
                        try:
                            pub_at = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
                        except Exception:
                            pub_at = datetime.utcnow()
                    all_new_comments.append(Comment(
                        channel_id=video.channel_id,
                        video_id=video.video_id,
                        youtube_comment_id=cmt_id,
                        author_name=cmt.get("author_name", "Unknown"),
                        author_profile_image=cmt.get("author_profile_image", ""),
                        text_display=text,
                        published_at=pub_at or datetime.utcnow(),
                        sentiment=sentiment,
                        is_replied=False,
                    ))
                    existing_ids.add(cmt_id)
                    total_new += 1

        if all_new_comments:
            try:
                db.add_all(all_new_comments)
                db.commit()
            except Exception as e:
                db.rollback()

        # Run Auto-Reply Bot on newly synced comments
        auto_replied_count = 0
        try:
            bot_res = await execute_auto_reply_bot(db)
            auto_replied_count = bot_res.get("replied_count", 0)
        except Exception as e:
            print(f"[AutoReplyBot in Sync Error]: {e}")

        total_in_db = db.query(Comment).count()
        _sync_status["last_result"] = {
            "total_new": total_new,
            "total_in_db": total_in_db,
            "auto_replied_count": auto_replied_count,
            "videos_checked": len(videos),
            "message": f"Sync selesai. {total_new} komentar baru ({auto_replied_count} dibalas bot otomatis) dari {len(videos)} video."
        }
    finally:
        db.close()
        _sync_status["running"] = False


async def execute_auto_reply_bot(db: Session, comment_ids: Optional[List[uuid.UUID]] = None) -> Dict[str, Any]:
    """
    Evaluates unreplied comments against active AutoReplyRules,
    posts replies to YouTube API using the channel's OAuth access token,
    and updates the database records.
    """
    rules = db.query(AutoReplyRule).filter(AutoReplyRule.is_active == True).all()
    if not rules:
        return {"status": "SUCCESS", "replied_count": 0, "message": "Tidak ada aturan auto-reply bot yang aktif."}

    query = db.query(Comment).filter(Comment.is_replied == False)
    if comment_ids:
        query = query.filter(Comment.id.in_(comment_ids))

    unreplied = query.order_by(Comment.published_at.desc()).limit(30).all()
    if not unreplied:
        return {"status": "SUCCESS", "replied_count": 0, "message": "Tidak ada komentar belum dibalas."}

    # Pre-load tokens
    token_map = {}
    channels = db.query(YouTubeChannel).all()
    accounts = db.query(GoogleAccount).all()
    acc_map = {str(a.id): a for a in accounts}
    for ch in channels:
        acc = acc_map.get(str(ch.account_id))
        if acc and acc.access_token_enc:
            try:
                token_map[str(ch.id)] = decrypt_token(acc.access_token_enc)
            except Exception:
                pass

    replied_count = 0
    for c in unreplied:
        text_lower = (c.text_display or "").lower()
        matched_rule = None

        # Check channel-specific rules first, then global rules
        for r in rules:
            if r.channel_id and r.channel_id != c.channel_id:
                continue
            keywords = [k.strip().lower() for k in (r.trigger_keyword or "").split(",") if k.strip()]
            if any(kw in text_lower for kw in keywords):
                matched_rule = r
                break

        if matched_rule:
            token = token_map.get(str(c.channel_id))
            reply_text = matched_rule.reply_template.strip()

            # Attempt posting directly to YouTube API
            if token and c.youtube_comment_id and not c.youtube_comment_id.startswith("yt_cmt_"):
                try:
                    await YouTubeService.post_comment_reply(
                        youtube_comment_id=c.youtube_comment_id,
                        reply_text=reply_text,
                        access_token=token
                    )
                except Exception as e:
                    print(f"[AutoReplyBot] YouTube API post failed: {e}")

            c.is_replied = True
            c.reply_text = reply_text
            replied_count += 1

    if replied_count > 0:
        try:
            db.commit()
        except Exception:
            db.rollback()

    return {
        "status": "SUCCESS",
        "replied_count": replied_count,
        "message": f"🤖 Auto-Reply Bot berhasil membalas {replied_count} komentar sesuai aturan kata kunci!"
    }


class ReplyRequest(BaseModel):
    comment_id: str

    reply_text: str

class AutoReplyRuleRequest(BaseModel):
    channel_id: Optional[str] = "ALL"
    trigger_keyword: str
    reply_template: str

@router.get("/inbox")
def get_unified_comment_inbox(
    channel_id: Optional[str] = None,
    sentiment_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get unified comment inbox scoped to the current user's channels.
    SUPERADMIN sees all channels across the platform.
    """
    is_superadmin = (getattr(current_user, 'role', '') or '').upper() == 'SUPERADMIN'

    # 🔐 USER ISOLATION: Base query scoped per user unless SUPERADMIN
    query = db.query(Comment)
    if not is_superadmin:
        # Join through YouTubeChannel -> GoogleAccount -> filter by user_id
        query = query.join(
            YouTubeChannel, Comment.channel_id == YouTubeChannel.id
        ).join(
            GoogleAccount, YouTubeChannel.account_id == GoogleAccount.id
        ).filter(GoogleAccount.user_id == current_user.id)

    if channel_id and channel_id != "ALL":
        target_ch = db.query(YouTubeChannel).filter(
            (YouTubeChannel.channel_id == channel_id) | (YouTubeChannel.name == channel_id)
        ).first()
        if target_ch:
            query = query.filter(Comment.channel_id == target_ch.id)

    if sentiment_filter and sentiment_filter != "ALL":
        query = query.filter(Comment.sentiment == sentiment_filter.upper())

    comments_list = query.order_by(Comment.published_at.desc()).all()

    inbox = []
    for c in comments_list:
        ch_name = c.channel.name if c.channel else "Audira Channel"
        inbox.append({
            "id": c.id,
            "channel_id": c.channel_id,
            "channelName": ch_name,
            "videoId": c.video_id,
            "youtubeCommentId": c.youtube_comment_id,
            "authorName": c.author_name,
            "textDisplay": c.text_display,
            "sentiment": c.sentiment,
            "isReplied": c.is_replied,
            "replyText": c.reply_text,
            "publishedAt": c.published_at.strftime("%Y-%m-%d %H:%M WIB") if c.published_at else None
        })

    return {
        "status": "SUCCESS",
        "totalComments": len(inbox),
        "unrepliedCount": sum(1 for c in inbox if not c["isReplied"]),
        "spamCount": sum(1 for c in inbox if c["sentiment"] == "SPAM"),
        "inbox": inbox
    }

@router.post("/reply")
async def reply_to_comment(
    req: ReplyRequest,
    db: Session = Depends(get_db)
):
    """
    Reply to a YouTube comment:
    1. POST reply to YouTube API via channel's OAuth token
    2. Save reply text to local DB regardless of YT result
    3. Returns detailed status (youtube_sent: true/false)
    """
    # Find comment in DB
    try:
        c_uuid = uuid.UUID(str(req.comment_id))
        c = db.query(Comment).filter(Comment.id == c_uuid).first()
    except Exception:
        c = db.query(Comment).filter(Comment.id == req.comment_id).first()

    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")

    if not req.reply_text or not req.reply_text.strip():
        raise HTTPException(status_code=400, detail="Reply text cannot be empty")

    # Get OAuth token from channel's account
    channel = db.query(YouTubeChannel).filter(YouTubeChannel.id == c.channel_id).first()
    token = None
    account = None
    if channel:
        account = db.query(GoogleAccount).filter(GoogleAccount.id == channel.account_id).first()
        if account and account.access_token_enc:
            try:
                token = decrypt_token(account.access_token_enc)
            except Exception as e:
                print(f"[Comments Reply] Token decrypt error: {e}")

    # Attempt to send reply to YouTube
    youtube_sent = False
    youtube_reply_id = None
    yt_error = None

    if token and c.youtube_comment_id and not c.youtube_comment_id.startswith("yt_cmt_"):
        yt_result = await YouTubeService.post_comment_reply(
            youtube_comment_id=c.youtube_comment_id,
            reply_text=req.reply_text.strip(),
            access_token=token,
        )
        if yt_result.get("success"):
            youtube_sent = True
            youtube_reply_id = yt_result.get("youtube_reply_id")
        else:
            yt_error = yt_result.get("error", "Unknown YouTube error")
            reason = yt_result.get("reason", "")
            # Try token refresh if unauthorized
            if yt_result.get("status_code") in (401, 403) and account and account.refresh_token_enc:
                from app.services.sync_service import refresh_google_token as _refresh_token
                new_token = await _refresh_token(db, account)
                if new_token:
                    retry = await YouTubeService.post_comment_reply(
                        youtube_comment_id=c.youtube_comment_id,
                        reply_text=req.reply_text.strip(),
                        access_token=new_token,
                    )
                    if retry.get("success"):
                        youtube_sent = True
                        youtube_reply_id = retry.get("youtube_reply_id")
                        yt_error = None
    else:
        yt_error = "Token OAuth tidak tersedia — balasan disimpan lokal saja."

    # Always save to DB
    c.is_replied = True
    c.reply_text = req.reply_text.strip()
    db.commit()

    return {
        "status": "SUCCESS",
        "youtube_sent": youtube_sent,
        "youtube_reply_id": youtube_reply_id,
        "message": (
            f"✅ Balasan dikirim ke YouTube dan disimpan!"
            if youtube_sent
            else f"💾 Balasan disimpan lokal. YouTube: {yt_error}"
        ),
        "comment_id": str(c.id),
        "author_name": c.author_name,
        "reply_text": req.reply_text,
    }

@router.get("/rules")
def get_auto_reply_rules(
    db: Session = Depends(get_db)
):
    """
    Get all active auto-reply rules.
    """
    rules = db.query(AutoReplyRule).all()
    if not rules:
        r1 = AutoReplyRule(
            trigger_keyword="lagu, mantap, keren",
            reply_template="Terima kasih banyak atas dukungannya! Jangan lupa subscribe channel Audira ini ya 🔥",
            is_active=True
        )
        r2 = AutoReplyRule(
            trigger_keyword="link, spam, bit.ly, t.me",
            reply_template="[MODERATED SPAM] Komentar ini ditandai sebagai indikasi spam otomatis.",
            is_active=True
        )
        db.add_all([r1, r2])
        db.commit()
        rules = db.query(AutoReplyRule).all()

    res = []
    for r in rules:
        ch_name = r.channel.name if r.channel else "SEMUA CHANNEL (GLOBAL)"
        res.append({
            "id": r.id,
            "channelName": ch_name,
            "triggerKeyword": r.trigger_keyword,
            "replyTemplate": r.reply_template,
            "isActive": r.is_active
        })

    return {"status": "SUCCESS", "rules": res}

@router.post("/rules")
def create_auto_reply_rule(
    req: AutoReplyRuleRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new auto-reply rule.
    """
    new_rule = AutoReplyRule(
        trigger_keyword=req.trigger_keyword,
        reply_template=req.reply_template,
        is_active=True
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return {"status": "SUCCESS", "message": f"Rule for keyword '{req.trigger_keyword}' created!"}

@router.post("/auto-reply/trigger")
async def trigger_auto_reply_batch(
    db: Session = Depends(get_db)
):
    """
    Manually triggers the Auto-Reply Bot to process all unreplied comments across channels.
    """
    res = await execute_auto_reply_bot(db)
    return res


@router.post("/sync")
async def sync_comments_from_youtube(
    background_tasks: BackgroundTasks,
):
    """
    Trigger background sync of YouTube comments.
    Returns immediately — use GET /comments/sync/status to check progress.
    """
    global _sync_status
    if _sync_status["running"]:
        return {
            "status": "RUNNING",
            "message": "Sync sedang berjalan. Tunggu sebentar lalu cek /comments/sync/status."
        }
    # Schedule background coroutine using asyncio
    import asyncio
    asyncio.create_task(_do_sync_comments())
    _sync_status["running"] = True
    _sync_status["last_result"] = None
    return {
        "status": "STARTED",
        "message": "Sync komentar YouTube dimulai di background. Cek status dalam 15-30 detik."
    }

@router.get("/sync/status")
def get_sync_status():
    """Check the result of the last comment sync."""
    global _sync_status
    if _sync_status["running"]:
        return {"status": "RUNNING", "message": "Sync sedang berjalan..."}
    result = _sync_status.get("last_result")
    if result is None:
        return {"status": "IDLE", "message": "Belum ada sync yang dijalankan."}
    return {
        "status": "DONE",
        **result
    }


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    db: Session = Depends(get_db)
):
    """Delete a comment from the local database."""
    try:
        c_uuid = uuid.UUID(comment_id)
        c = db.query(Comment).filter(Comment.id == c_uuid).first()
    except Exception:
        c = None
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(c)
    db.commit()
    return {"status": "SUCCESS", "message": "Comment deleted"}
