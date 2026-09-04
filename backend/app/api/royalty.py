from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel

from app.db.session import get_db
from app.services.royalty_service import RoyaltyService

router = APIRouter()

class CreateContractPayload(BaseModel):
    channel_id: str
    track_title: str
    artist_name: str
    artist_email: Optional[str] = None
    label_share_pct: Optional[float] = 50.0
    artist_share_pct: Optional[float] = 30.0
    producer_share_pct: Optional[float] = 20.0
    video_id: Optional[str] = None
    notes: Optional[str] = None

@router.get("/contracts")
def list_royalty_contracts(
    channel_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all active artist profit-sharing contracts.
    """
    return RoyaltyService.get_contracts(db, channel_id=channel_id)

@router.post("/contracts")
def create_royalty_contract(
    payload: CreateContractPayload,
    db: Session = Depends(get_db)
):
    """
    Create a new split sheet contract between Music Label, Artist, and Producer.
    """
    res = RoyaltyService.create_contract(
        db,
        channel_id=payload.channel_id,
        track_title=payload.track_title,
        artist_name=payload.artist_name,
        artist_email=payload.artist_email,
        label_share_pct=payload.label_share_pct or 50.0,
        artist_share_pct=payload.artist_share_pct or 30.0,
        producer_share_pct=payload.producer_share_pct or 20.0,
        video_id=payload.video_id,
        notes=payload.notes
    )
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res

@router.get("/statements")
def get_monthly_statements(
    period: Optional[str] = "2026-08",
    db: Session = Depends(get_db)
):
    """
    Calculate full monthly royalty payout statements.
    """
    return RoyaltyService.calculate_monthly_statements(db, period=period or "2026-08")
