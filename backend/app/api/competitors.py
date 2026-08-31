from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid

from app.db.session import get_db
from app.models.competitor import CompetitorChannel, CompetitorVideo
from app.services.competitor_service import CompetitorService

router = APIRouter()

class AddCompetitorRequest(BaseModel):
    channel_input: str
    niche: Optional[str] = "General"

@router.get("")
def get_competitors(db: Session = Depends(get_db)):
    """
    List all tracked competitor channels and their recent videos.
    """
    # Seed default sample competitors if table is empty
    if db.query(CompetitorChannel).count() == 0:
        c1 = CompetitorChannel(
            id=uuid.uuid4(),
            channel_id="UC_comp_dangdut_01",
            handle="@dangdut_pantura_official",
            name="Dangdut Pantura Official",
            avatar="https://api.dicebear.com/7.x/identicon/svg?seed=dangdut_pantura",
            niche="Dangdut",
            subscriber_count=48500,
            total_views=1240000,
            video_count=85,
            is_active=True
        )
        c2 = CompetitorChannel(
            id=uuid.uuid4(),
            channel_id="UC_comp_pop_02",
            handle="@indie_pop_vibes",
            name="Indie Pop Waves ID",
            avatar="https://api.dicebear.com/7.x/identicon/svg?seed=indie_pop",
            niche="Pop",
            subscriber_count=82100,
            total_views=3850000,
            video_count=120,
            is_active=True
        )
        c3 = CompetitorChannel(
            id=uuid.uuid4(),
            channel_id="UC_comp_jazz_03",
            handle="@coffee_jazz_lounge",
            name="Coffee & Jazz Indo",
            avatar="https://api.dicebear.com/7.x/identicon/svg?seed=coffee_jazz",
            niche="Jazz",
            subscriber_count=19200,
            total_views=450000,
            video_count=35,
            is_active=True
        )
        db.add_all([c1, c2, c3])
        db.commit()

        v1 = CompetitorVideo(
            id=uuid.uuid4(),
            competitor_channel_id=c1.id,
            video_id="vid_comp_01",
            title="Koplo Party Viral 2026",
            thumbnail="https://picsum.photos/seed/comp1/400/225",
            view_count=84500,
            velocity_views_hour=240,
            is_viral=True
        )
        v2 = CompetitorVideo(
            id=uuid.uuid4(),
            competitor_channel_id=c2.id,
            video_id="vid_comp_02",
            title="Acoustic Pop Chill Vibes 2026",
            thumbnail="https://picsum.photos/seed/comp2/400/225",
            view_count=142000,
            velocity_views_hour=510,
            is_viral=True
        )
        db.add_all([v1, v2])
        db.commit()

    competitors = db.query(CompetitorChannel).all()
    results = []
    for c in competitors:
        vids = []
        for v in c.videos:
            vids.append({
                "id": str(v.id),
                "video_id": v.video_id,
                "title": v.title,
                "thumbnail": v.thumbnail,
                "views": v.view_count or 0,
                "velocity": v.velocity_views_hour or 0,
                "is_viral": v.is_viral
            })
        results.append({
            "id": str(c.id),
            "channel_id": c.channel_id,
            "handle": c.handle,
            "name": c.name,
            "avatar": c.avatar,
            "niche": c.niche,
            "subscriber_count": c.subscriber_count or 0,
            "total_views": c.total_views or 0,
            "video_count": c.video_count or len(vids),
            "is_active": c.is_active,
            "videos": vids,
            "last_sync": c.last_sync.strftime("%b %d, %H:%M WIB") if c.last_sync else "-"
        })

    return {
        "status": "success",
        "total": len(results),
        "items": results
    }

@router.post("")
async def add_competitor(payload: AddCompetitorRequest, db: Session = Depends(get_db)):
    if not payload.channel_input or not payload.channel_input.strip():
        raise HTTPException(status_code=400, detail="Handle atau ID channel kompetitor wajib diisi.")
    res = await CompetitorService.add_or_update_competitor(db, payload.channel_input, payload.niche or "General")
    return res

@router.delete("/{competitor_id}")
def delete_competitor(competitor_id: str, db: Session = Depends(get_db)):
    try:
        c_uuid = uuid.UUID(competitor_id) if isinstance(competitor_id, str) else competitor_id
    except Exception:
        c_uuid = competitor_id
    comp = db.query(CompetitorChannel).filter(CompetitorChannel.id == c_uuid).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Competitor channel not found")
    db.delete(comp)
    db.commit()
    return {"status": "success", "message": f"Channel kompetitor '{comp.name}' berhasil dihapus dari Radar."}

@router.post("/sync")
async def trigger_competitor_sync(db: Session = Depends(get_db)):
    res = await CompetitorService.run_competitor_radar_sync(db)
    return res
