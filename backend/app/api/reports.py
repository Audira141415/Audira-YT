from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.db.session import get_db
from app.services.financial_service import FinancialService
from app.services.ai_service import AIService
from app.api.channels import get_channels

router = APIRouter()

@router.get("/financial-breakdown")
async def get_financial_breakdown(db: Session = Depends(get_db)):
    """
    Returns Net vs Gross Revenue, YouTube Platform Cut (45%), Tax (10%), and Royalty Split.
    """
    channels_res = await get_channels(page=1, limit=50, db=db)
    channels_list = channels_res.get("data", [])
    
    financial_data = FinancialService.calculate_revenue_breakdown(channels_list)
    financial_data["summary"]["generated_at"] = datetime.now().strftime("%d %b %Y, %H:%M WIB")
    return financial_data

@router.get("/export/csv")
async def export_csv_report(db: Session = Depends(get_db)):
    """
    Exports financial & royalty report as CSV string.
    """
    channels_res = await get_channels(page=1, limit=50, db=db)
    channels_list = channels_res.get("data", [])
    
    financial_data = FinancialService.calculate_revenue_breakdown(channels_list)
    financial_data["summary"]["generated_at"] = datetime.now().strftime("%d %b %Y, %H:%M WIB")
    
    csv_content = FinancialService.generate_csv_report(financial_data)
    
    return PlainTextResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=Audira_Financial_Report.csv"}
    )

@router.get("/ai-recommendations")
async def get_ai_recommendations(channel_name: str = Query("Pop & Hits Network")):
    """
    Returns AI Title Suggestions, Hashtags, and 7-Day Upload Heatmap.
    """
    title_data = AIService.generate_ai_title_suggestions(channel_name)
    heatmap_data = AIService.generate_7day_golden_hour_heatmap(channel_name)
    
    return {
        "status": "success",
        "title_suggestions": title_data,
        "golden_hour_heatmap": heatmap_data
    }
