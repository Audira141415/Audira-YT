from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.session import get_db
from app.services.ai_recommendation_service import AIRecommendationService
from app.models.user import User
from app.api.deps import get_current_active_user

router = APIRouter()

@router.get("/recommendations")
def get_ai_growth_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    Get full AI Growth Engine recommendations (Shorts clipping ideas, Stagnation recovery, Smart Upload Schedule).
    """
    return AIRecommendationService.get_full_ai_growth_report(db, current_user=current_user)

@router.get("/shorts-opportunities")
def get_shorts_opportunities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get AI recommendations for cutting long-form videos into YouTube Shorts.
    """
    return AIRecommendationService.get_shorts_recommendations(db, current_user=current_user)
