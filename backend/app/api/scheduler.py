from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import os
import uuid

from app.db.session import get_db
from app.models.scheduled_post import ScheduledPost
from app.models.youtube_channel import YouTubeChannel
from app.models.google_account import GoogleAccount
from app.services.uploader_service import AutoPublisherService
from app.services.sync_service import sync_single_channel_direct

router = APIRouter()

class ForceSyncRequest(BaseModel):
    channel_name: str

class GoldenSlotRequest(BaseModel):
    channel_id: Optional[str] = None

def find_channel_safely(db: Session, channel_input: Optional[str]) -> Optional[YouTubeChannel]:
    """
    Safely find a YouTubeChannel without triggering PostgreSQL UUID casting DataError.
    """
    if not channel_input or channel_input == "ALL":
        return db.query(YouTubeChannel).first()
    
    # 1. Try UUID if string is valid UUID
    try:
        val_uuid = uuid.UUID(str(channel_input))
        ch = db.query(YouTubeChannel).filter(YouTubeChannel.id == val_uuid).first()
        if ch:
            return ch
    except Exception:
        pass

    # 2. Try by exact channel_id or exact name
    ch = db.query(YouTubeChannel).filter(
        (YouTubeChannel.channel_id == str(channel_input)) | 
        (YouTubeChannel.name.ilike(str(channel_input)))
    ).first()
    if ch:
        return ch

    # 3. Substring match by name
    ch = db.query(YouTubeChannel).filter(
        YouTubeChannel.name.ilike(f"%{channel_input}%")
    ).first()
    if ch:
        return ch

    return db.query(YouTubeChannel).first()

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
        target_ch = find_channel_safely(db, channel_id)
        if target_ch:
            query = query.filter(ScheduledPost.channel_id == target_ch.id)

    if status_filter and status_filter != "ALL":
        query = query.filter(ScheduledPost.status == status_filter.upper())

    posts = query.order_by(ScheduledPost.scheduled_at.desc()).all()
    
    result = []
    for p in posts:
        ch_name = p.channel.name if p.channel else "Audira Channel"
        result.append({
            "id": str(p.id),
            "channel_id": str(p.channel_id),
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

@router.post("/auto-golden-slot")
def calculate_auto_golden_slot(
    payload: GoldenSlotRequest = GoldenSlotRequest(),
    db: Session = Depends(get_db)
):
    """
    Returns the next optimal Golden Hours slot (19:00 - 22:00 WIB).
    """
    slot = AutoPublisherService.get_next_golden_slot(channel_id=payload.channel_id, db=db)
    return {
        "status": "SUCCESS",
        "goldenSlot": slot
    }

@router.get("/storage/{channel_id}")
def get_channel_storage_pipeline(
    channel_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns the isolated storage files and directory paths for the account pipe.
    """
    target_ch = find_channel_safely(db, channel_id)
    account_id = str(target_ch.account_id) if target_ch and target_ch.account_id else "global"
    dirs = AutoPublisherService.ensure_account_storage(account_id)
    files = AutoPublisherService.get_account_storage_files(account_id)

    return {
        "status": "SUCCESS",
        "account_id": account_id,
        "channel_name": target_ch.name if target_ch else "Unknown Channel",
        "directories": dirs,
        "files_count": len(files),
        "files": files
    }

@router.post("/upload-draft")
async def upload_draft_file(
    file: UploadFile = File(...),
    channel_id: Optional[str] = Form(None),
    is_short: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
):
    """
    Upload draft video directly into the account's isolated storage pipe:
    storage/accounts/{account_id}/uploads/ or shorts/
    """
    target_ch = find_channel_safely(db, channel_id)
    account_id = str(target_ch.account_id) if target_ch and target_ch.account_id else "global"

    dirs = AutoPublisherService.ensure_account_storage(account_id)
    dest_dir = dirs["shorts"] if is_short else dirs["uploads"]

    clean_name = f"{uuid.uuid4().hex[:10]}_{file.filename}"
    dest_path = os.path.join(dest_dir, clean_name)

    with open(dest_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {
        "status": "SUCCESS",
        "filename": clean_name,
        "account_id": account_id,
        "targetFolder": "shorts" if is_short else "uploads",
        "savedPath": dest_path,
        "sizeBytes": len(content),
        "sizeMb": round(len(content) / (1024 * 1024), 2)
    }

@router.post("/schedule")
def create_scheduled_post(
    channel_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(""),
    tags: Optional[str] = Form(""),
    privacy_status: Optional[str] = Form("public"),
    is_short: Optional[bool] = Form(False),
    scheduled_at: str = Form(...), # Format: "YYYY-MM-DDTHH:MM"
    file_path: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Schedule a video for auto-publishing to YouTube on Golden Hours.
    """
    target_ch = find_channel_safely(db, channel_id)
    if not target_ch:
        raise HTTPException(status_code=404, detail="No valid YouTube Channel found")

    try:
        dt_sched = datetime.fromisoformat(scheduled_at.replace("Z", ""))
    except Exception:
        dt_sched = datetime.utcnow()

    # Ensure storage directories exist for this account
    account_id = str(target_ch.account_id) if target_ch.account_id else "global"
    dirs = AutoPublisherService.ensure_account_storage(account_id)
    default_file = os.path.join(dirs["shorts"] if is_short else dirs["uploads"], "draft_video.mp4")

    new_post = ScheduledPost(
        channel_id=target_ch.id,
        title=title,
        description=description,
        tags=tags,
        privacy_status=privacy_status,
        is_short=is_short,
        scheduled_at=dt_sched,
        status="PENDING",
        file_path=file_path or default_file
    )

    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    return {
        "status": "SUCCESS",
        "message": f"Video '{title}' berhasil dijadwalkan untuk {target_ch.name} pada {scheduled_at} WIB!",
        "post_id": str(new_post.id),
        "channel_name": target_ch.name
    }

@router.post("/posts/{post_id}/publish-now")
async def publish_post_immediately(
    post_id: str,
    db: Session = Depends(get_db)
):
    """
    Instant trigger to publish a scheduled post directly to YouTube.
    """
    res = await AutoPublisherService.publish_scheduled_post(post_id, db)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/sync-now")
async def force_sync_channel_endpoint(
    payload: ForceSyncRequest,
    db: Session = Depends(get_db)
):
    """
    Directly force-sync single channel stats.
    """
    res = await sync_single_channel_direct(db, payload.channel_name)
    return res

@router.delete("/posts/{post_id}")
def delete_scheduled_post(
    post_id: str,
    db: Session = Depends(get_db)
):
    """
    Cancel or delete a scheduled post safely.
    """
    post = None
    try:
        post_uuid = uuid.UUID(str(post_id))
        post = db.query(ScheduledPost).filter(ScheduledPost.id == post_uuid).first()
    except Exception:
        pass

    if not post:
        post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()

    if not post:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

    db.delete(post)
    db.commit()
    return {"status": "SUCCESS", "message": f"Post '{post_id}' deleted."}
