from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import math

from app.db.session import get_db
from app.models.youtube_channel import YouTubeChannel
from app.models.google_account import GoogleAccount

router = APIRouter()

@router.get("")
def get_channels(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    account_email: Optional[str] = None
):
    query = db.query(YouTubeChannel).join(GoogleAccount)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                YouTubeChannel.name.ilike(search_filter),
                YouTubeChannel.channel_id.ilike(search_filter),
                GoogleAccount.email.ilike(search_filter)
            )
        )

    if account_email and account_email != "ALL":
        query = query.filter(GoogleAccount.email == account_email)

    total_items = query.count()
    total_pages = math.ceil(total_items / limit) if limit > 0 else 0

    channels = query.offset((page - 1) * limit).limit(limit).all()
    
    result = []
    for ch in channels:
        video_count = len(ch.videos) if ch.videos else 0
        total_views = sum(v.view_count or 0 for v in ch.videos) if ch.videos else 0
        
        banner_url = ch.banner or f"https://picsum.photos/seed/{ch.channel_id}/600/180"

        result.append({
            "id": str(ch.id),
            "channel_id": ch.channel_id,
            "name": ch.name,
            "avatar": ch.avatar,
            "banner": banner_url,
            "country": ch.country or "ID",
            "videoCount": video_count,
            "totalViews": total_views,
            "accountId": str(ch.account_id),
            "accountEmail": ch.google_account.email if ch.google_account else "Unknown",
            "accountName": ch.google_account.user.name if ch.google_account and ch.google_account.user else "Unknown",
            "accountColor": "bg-purple-500",
            "status": "ACTIVE",
            "updatedAt": ch.updated_at.strftime("%b %d, %Y %H:%M") if ch.updated_at else "Just now"
        })

    return {
        "items": result,
        "total": total_items,
        "page": page,
        "pages": total_pages,
        "limit": limit
    }
