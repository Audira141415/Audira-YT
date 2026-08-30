from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import uuid

from app.db.session import get_db
from app.models.scheduled_post import ScheduledPost
from app.models.youtube_channel import YouTubeChannel

router = APIRouter()

UPLOAD_DIR = "storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/posts")
def get_scheduled_posts(
    channel_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all scheduled & published YouTube posts.
    """
    query = db.query(ScheduledPost)
    if channel_id and channel_id != "ALL":
        target_ch = db.query(YouTubeChannel).filter(
            (YouTubeChannel.channel_id == channel_id) | (YouTubeChannel.name == channel_id)
        ).first()
        if target_ch:
            query = query.filter(ScheduledPost.channel_id == target_ch.id)

    if status_filter and status_filter != "ALL":
        query = query.filter(ScheduledPost.status == status_filter.upper())

    posts = query.order_by(ScheduledPost.scheduled_at.desc()).all()
    
    result = []
    for p in posts:
        ch_name = p.channel.name if p.channel else "Audira Channel"
        result.append({
            "id": p.id,
            "channel_id": p.channel_id,
            "channelName": ch_name,
            "title": p.title,
            "description": p.description,
            "tags": p.tags,
            "privacyStatus": p.privacy_status,
            "isShort": p.is_short,
            "scheduledAt": p.scheduled_at.strftime("%Y-%m-%d %H:%M:%S") if p.scheduled_at else None,
            "status": p.status,
            "filePath": p.file_path,
            "thumbnailPath": p.thumbnail_path,
            "youtubeVideoId": p.youtube_video_id,
            "errorLog": p.error_log,
            "createdAt": p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else None
        })

    return {
        "status": "SUCCESS",
        "totalPosts": len(result),
        "goldenUploadHours": "19:00 - 22:00 WIB",
        "posts": result
    }

@router.post("/upload-draft")
async def upload_draft_file(
    file: UploadFile = File(...)
):
    """
    Temporary upload handler for video drafts.
    """
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, filename)

    with open(dest_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {
        "status": "SUCCESS",
        "filename": file.filename,
        "savedPath": dest_path,
        "sizeBytes": len(content)
    }

@router.post("/schedule")
def create_scheduled_post(
    channel_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(""),
    tags: Optional[str] = Form(""),
    privacy_status: Optional[str] = Form("public"),
    is_short: Optional[bool] = Form(False),
    scheduled_at: str = Form(...), # Format: "YYYY-MM-DD THH:MM"
    file_path: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Schedule a video for auto-publishing to YouTube.
    """
    target_ch = db.query(YouTubeChannel).filter(
        (YouTubeChannel.id == channel_id) | (YouTubeChannel.channel_id == channel_id) | (YouTubeChannel.name == channel_id)
    ).first()

    if not target_ch:
        target_ch = db.query(YouTubeChannel).first()
        if not target_ch:
            raise HTTPException(status_code=404, detail="No valid YouTube Channel found")

    try:
        dt_sched = datetime.fromisoformat(scheduled_at.replace("Z", ""))
    except Exception:
        dt_sched = datetime.utcnow()

    new_post = ScheduledPost(
        channel_id=target_ch.id,
        title=title,
        description=description,
        tags=tags,
        privacy_status=privacy_status,
        is_short=is_short,
        scheduled_at=dt_sched,
        status="PENDING",
        file_path=file_path or os.path.join(UPLOAD_DIR, "demo_video.mp4")
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {
        "status": "SUCCESS",
        "message": f"Video '{title}' successfully queued for {target_ch.name} at {scheduled_at}!",
        "post_id": new_post.id
    }

@router.delete("/posts/{post_id}")
def delete_scheduled_post(
    post_id: str,
    db: Session = Depends(get_db)
):
    """
    Cancel or delete a scheduled post.
    """
    post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    db.delete(post)
    db.commit()
    return {"status": "SUCCESS", "message": f"Post '{post_id}' deleted."}
