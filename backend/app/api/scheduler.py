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

# --- 🎨 Thumbnail A/B Testing & AI Title Generator Endpoints ---

class CreateABTestPayload(BaseModel):
    channel_id: str
    video_title: str
    thumbnail_a_url: str
    thumbnail_b_url: str
    video_id: Optional[str] = None
    rotator_interval_hours: Optional[int] = 24

class SEOTitleRequest(BaseModel):
    seed_keyword: str
    genre: Optional[str] = "DANGDUT"

class BulkItem(BaseModel):
    title: str
    description: Optional[str] = None
    tags: Optional[str] = None
    is_short: Optional[bool] = False

class BulkSchedulePayload(BaseModel):
    channel_id: str
    stagger_interval_days: Optional[int] = 1 # e.g. 1 = every day, 2 = every 2 days
    target_hour_wib: Optional[int] = 19 # default 19:00 WIB
    items: List[BulkItem]

@router.get("/ab-tests")
def list_ab_tests(
    channel_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all active and past thumbnail A/B tests with live CTR comparison.
    """
    from app.services.ab_test_service import ABTestService
    return ABTestService.get_ab_tests(db, channel_id=channel_id)

@router.post("/ab-tests")
def create_thumbnail_ab_test(
    payload: CreateABTestPayload,
    db: Session = Depends(get_db)
):
    """
    Create a new live thumbnail A/B rotation experiment.
    """
    from app.services.ab_test_service import ABTestService
    res = ABTestService.create_ab_test(
        db,
        channel_id=payload.channel_id,
        video_title=payload.video_title,
        thumbnail_a_url=payload.thumbnail_a_url,
        thumbnail_b_url=payload.thumbnail_b_url,
        video_id=payload.video_id,
        rotator_interval_hours=payload.rotator_interval_hours or 24
    )
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.post("/ab-tests/{test_id}/rotate")
def rotate_ab_test_variant(
    test_id: str,
    db: Session = Depends(get_db)
):
    from app.services.ab_test_service import ABTestService
    res = ABTestService.rotate_test(db, test_id)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.post("/ab-tests/{test_id}/declare-winner")
def declare_ab_test_winner(
    test_id: str,
    winner_variant: str = Query("B", regex="^(A|B)$"),
    db: Session = Depends(get_db)
):
    from app.services.ab_test_service import ABTestService
    res = ABTestService.declare_winner(db, test_id, winner_variant)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.delete("/ab-tests/{test_id}")
def delete_ab_test(
    test_id: str,
    db: Session = Depends(get_db)
):
    from app.services.ab_test_service import ABTestService
    res = ABTestService.delete_test(db, test_id)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@router.post("/generate-seo-titles")
def generate_viral_seo_titles(payload: SEOTitleRequest):
    """
    Generate 5 viral, high-CTR YouTube video title suggestions and trending tags for Indonesian music.
    """
    from app.services.ab_test_service import ABTestService
    return ABTestService.generate_seo_titles(
        seed_keyword=payload.seed_keyword,
        genre=payload.genre or "DANGDUT"
    )

@router.post("/bulk-schedule")
def bulk_schedule_videos(
    payload: BulkSchedulePayload,
    db: Session = Depends(get_db)
):
    """
    Batch schedule multiple videos automatically with golden time slot staggering.
    """
    target_ch = find_channel_safely(db, payload.channel_id)
    if not target_ch:
        raise HTTPException(status_code=404, detail="Target channel YouTube tidak ditemukan.")

    if not payload.items:
        raise HTTPException(status_code=400, detail="Daftar video batch tidak boleh kosong.")

    from datetime import timedelta
    now = datetime.now()
    created_posts = []

    for idx, item in enumerate(payload.items):
        # Calculate staggered schedule date
        days_ahead = (idx + 1) * (payload.stagger_interval_days or 1)
        sched_date = now + timedelta(days=days_ahead)
        sched_dt = sched_date.replace(hour=payload.target_hour_wib or 19, minute=0, second=0, microsecond=0)

        new_p = ScheduledPost(
            id=uuid.uuid4(),
            channel_id=target_ch.id,
            title=item.title.strip(),
            description=item.description or f"Official release on {target_ch.name}. Don't forget to like, comment & subscribe!",
            tags=item.tags or f"{target_ch.name}, Musik Indonesia, Dangdut, Lagu Viral, Audira",
            privacy_status="public",
            is_short=item.is_short or False,
            scheduled_at=sched_dt,
            status="PENDING",
            file_path=f"storage/uploads/batch_{idx+1}.mp4"
        )
        db.add(new_p)
        created_posts.append({
            "title": item.title,
            "scheduled_at": sched_dt.strftime("%Y-%m-%d %H:%M WIB")
        })

    db.commit()

    return {
        "status": "SUCCESS",
        "message": f"Berhasil menjadwalkan {len(created_posts)} video secara otomatis untuk {target_ch.name}!",
        "channel_name": target_ch.name,
        "total_scheduled": len(created_posts),
        "queue": created_posts
    }
