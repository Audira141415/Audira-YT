from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import math

from app.db.session import get_db
from app.models.youtube_channel import YouTubeChannel
from app.models.google_account import GoogleAccount
from app.models.user import User
from app.services.sync_service import sync_single_channel_direct
from app.api.deps import get_current_user_optional

router = APIRouter()

from sqlalchemy.orm import selectinload

@router.get("")
def get_channels(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    account_email: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(YouTubeChannel).options(
        selectinload(YouTubeChannel.google_account),
        selectinload(YouTubeChannel.videos)
    ).outerjoin(GoogleAccount)

    # 🔐 USER ISOLATION: Filter channels by user_id via GoogleAccount unless SUPERADMIN
    is_superadmin = current_user and (getattr(current_user, 'role', '') or '').upper() == 'SUPERADMIN'
    if current_user and not is_superadmin:
        query = query.filter((GoogleAccount.user_id == current_user.id) | (GoogleAccount.user_id == None))

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
        try:
            v_list = ch.videos if ch.videos else []
            video_count = len(v_list)
            total_views = sum(v.view_count or 0 for v in v_list)
            
            # Clean official banner URL (No random picsum)
            banner_url = ch.banner or ""

            acc_email = ch.google_account.email if ch.google_account else "audiradigitalnetwork@gmail.com"
            acc_name = acc_email.split('@')[0] if acc_email else "Audira Admin"

            from datetime import datetime
            now_dt = datetime.now()
            if hasattr(ch, 'updated_at') and ch.updated_at:
                try:
                    updated_str = ch.updated_at.strftime("%b %d, %Y %H:%M:%S WIB")
                except Exception:
                    updated_str = now_dt.strftime("%b %d, %Y %H:%M:%S WIB")
            else:
                updated_str = now_dt.strftime("%b %d, %Y %H:%M:%S WIB")

            subs_val = getattr(ch, 'subscriber_count', 0)
            if subs_val is None:
                subs_val = 0

            views_val = total_views
            if views_val == 0 and ch.baseline_views_24h:
                views_val = ch.baseline_views_24h

            result.append({
                "id": str(ch.id),
                "channel_id": ch.channel_id,
                "name": ch.name or "YouTube Channel",
                "avatar": ch.avatar or "",
                "banner": banner_url,
                "country": ch.country or "ID",
                "videoCount": video_count,
                "totalViews": views_val,
                "subscriberCount": subs_val,
                "accountId": str(ch.account_id) if ch.account_id else "",
                "accountEmail": acc_email,
                "accountName": acc_name,
                "accountColor": "bg-purple-500",
                "status": "ACTIVE",
                "updatedAt": updated_str
            })
        except Exception as err:
            print(f"[Channels API Error]: {err}")
            continue

    return {
        "items": result,
        "total": total_items,
        "page": page,
        "pages": total_pages,
        "limit": limit
    }

@router.post("/{channel_id}/sync-live")
async def sync_channel_live(channel_id: str, db: Session = Depends(get_db)):
    """
    On-demand live direct synchronization for a single YouTube channel with Google YouTube Data API v3.
    """
    res = await sync_single_channel_direct(db, channel_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=400, detail=res.get("message", "Sync failed"))
    return res
