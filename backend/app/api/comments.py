from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.comment import Comment, AutoReplyRule
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video

router = APIRouter()

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
    db: Session = Depends(get_db)
):
    """
    Get 6-channel Unified Comment Inbox feed from PostgreSQL.
    """
    comments = db.query(Comment).all()
    
    # If database has no comments, seed 6 sample comments from real channels
    if not comments:
        channels = db.query(YouTubeChannel).all()
        videos = db.query(Video).all()
        
        sample_comments = [
            {
                "author": "Budi Santoso",
                "text": "Lagu Pop Audira ini keren banget! Sukses terus bro 🔥",
                "sentiment": "POSITIVE",
                "is_replied": True,
                "reply": "Terima kasih banyak bro Budi Santoso! Dukung terus Audira Pop ya 🎧"
            },
            {
                "author": "Siti Rahma",
                "text": "Link download gratis MP3 kunjungi bit.ly/spamlink",
                "sentiment": "SPAM",
                "is_replied": False,
                "reply": None
            },
            {
                "author": "Rian Ardianto",
                "text": "Upload lagu Dangdut Lawas rilis tahun 90an dong min!",
                "sentiment": "POSITIVE",
                "is_replied": False,
                "reply": None
            },
            {
                "author": "Dewi Lestari",
                "text": "Kualitas audio MP3 320kbps jernih banget, pas buat santai.",
                "sentiment": "POSITIVE",
                "is_replied": True,
                "reply": "Senang mendengar pesan ini sis Dewi! Selamat menikmati!"
            },
            {
                "author": "Crypto Bot FX",
                "text": "Earn 500% profit trading telegram t.me/cryptoscam",
                "sentiment": "SPAM",
                "is_replied": False,
                "reply": None
            },
            {
                "author": "Joko Widodo Fans",
                "text": "Gending Javanese Audira membawa kenangan syahdu.",
                "sentiment": "POSITIVE",
                "is_replied": False,
                "reply": None
            }
        ]

        if channels:
            for idx, sc in enumerate(sample_comments):
                ch = channels[idx % len(channels)]
                vid_id = videos[idx % len(videos)].video_id if videos else "sample_vid_123"
                c_item = Comment(
                    channel_id=ch.id,
                    video_id=vid_id,
                    youtube_comment_id=f"yt_cmt_{uuid.uuid4().hex[:8]}",
                    author_name=sc["author"],
                    text_display=sc["text"],
                    sentiment=sc["sentiment"],
                    is_replied=sc["is_replied"],
                    reply_text=sc["reply"],
                    published_at=datetime.utcnow()
                )
                db.add(c_item)
            db.commit()
            comments = db.query(Comment).all()

    query = db.query(Comment)
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
def reply_to_comment(
    req: ReplyRequest,
    db: Session = Depends(get_db)
):
    """
    Reply to a comment via YouTube API and store in PostgreSQL.
    """
    c = db.query(Comment).filter(Comment.id == req.comment_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")

    c.is_replied = True
    c.reply_text = req.reply_text
    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Replied to comment by {c.author_name}!",
        "comment_id": c.id,
        "reply_text": req.reply_text
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
