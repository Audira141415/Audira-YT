from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.intelligence_service import IntelligenceService

router = APIRouter()

class MetadataGeneratePayload(BaseModel):
    channel_name: str
    topic_or_song: str

@router.get("/golden-hours")
def get_golden_hours():
    """
    Get calculated golden hours, audience demographics, and high-impact days per channel.
    """
    return IntelligenceService.get_golden_hours()

@router.post("/generate-metadata")
def generate_metadata(payload: MetadataGeneratePayload):
    """
    Generate viral titles, tags, and Shorts hooks for a music release.
    """
    return IntelligenceService.generate_viral_metadata(payload.channel_name, payload.topic_or_song)

@router.get("/cross-promotion-template")
def get_cross_promotion_template(channel_name: str = Query("Audira Dangdut Lawas")):
    """
    Get copy-paste ready description preset with cross-promotion links to 5 other channels.
    """
    template_text = IntelligenceService.get_cross_promotion_template(channel_name)
    return {"channel_name": channel_name, "template": template_text}
