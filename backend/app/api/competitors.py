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
    List all tracked real competitor channels and their recent videos.
    """
    competitors = db.query(CompetitorChannel).order_by(CompetitorChannel.subscriber_count.desc()).all()
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
