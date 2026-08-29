import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class YouTubeAnalyticsService:
    BASE_URL = "https://youtubeanalytics.googleapis.com/v2/reports"

    @classmethod
    async def get_channel_analytics(
        cls, 
        token: str, 
        channel_id: str, 
        start_date: Optional[str] = None, 
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch real channel analytics from YouTube Analytics API v2:
        - estimatedRevenue
        - cpm, rpm
        - estimatedMinutesWatched
        - averageViewDuration
        - views, likes, subscribersGained, subscribersLost
        """
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        params = {
            "ids": f"channel=={channel_id}",
            "startDate": start_date,
            "endDate": end_date,
            "metrics": "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,estimatedRevenue,cpm,rpm",
            "dimensions": "day"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(cls.BASE_URL, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    rows = data.get("rows", [])
                    
                    total_views = sum(r[1] for r in rows) if rows else 0
                    total_minutes = sum(r[2] for r in rows) if rows else 0
                    avg_duration = sum(r[3] for r in rows) / len(rows) if rows else 0
                    subs_gained = sum(r[4] for r in rows) if rows else 0
                    subs_lost = sum(r[5] for r in rows) if rows else 0
                    est_revenue = sum(r[6] for r in rows) if rows else 0.0
                    avg_cpm = sum(r[7] for r in rows) / len(rows) if rows else 0.0
                    avg_rpm = sum(r[8] for r in rows) / len(rows) if rows else 0.0

                    return {
                        "status": "success",
                        "monetized": True if est_revenue > 0 or avg_cpm > 0 else False,
                        "metrics": {
                            "totalViews": total_views,
                            "watchTimeHours": round(total_minutes / 60, 1),
                            "avgViewDurationSeconds": int(avg_duration),
                            "netSubscribers": subs_gained - subs_lost,
                            "subscribersGained": subs_gained,
                            "subscribersLost": subs_lost,
                            "estimatedRevenueUSD": round(est_revenue, 2),
                            "estimatedRevenueIDR": round(est_revenue * 15800),
                            "cpmUSD": round(avg_cpm, 2),
                            "rpmUSD": round(avg_rpm, 2),
                        },
                        "dailyTrend": rows
                    }
                else:
                    return {
                        "status": "error",
                        "code": resp.status_code,
                        "message": resp.text
                    }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Analytics API Error: {str(e)}"
            }

    @classmethod
    async def get_audience_demographics(
        cls, 
        token: str, 
        channel_id: str
    ) -> Dict[str, Any]:
        """
        Fetch country & age/gender demographics from YouTube Analytics API.
        """
        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

        start_date = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
        end_date = datetime.now().strftime("%Y-%m-%d")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Country Report
                resp_country = await client.get(
                    cls.BASE_URL, 
                    headers=headers, 
                    params={
                        "ids": f"channel=={channel_id}",
                        "startDate": start_date,
                        "endDate": end_date,
                        "metrics": "views,estimatedMinutesWatched",
                        "dimensions": "country",
                        "sort": "-views",
                        "maxResults": 5
                    }
                )
                
                countries = []
                if resp_country.status_code == 200:
                    rows = resp_country.json().get("rows", [])
                    countries = [{"country": r[0], "views": r[1], "minutes": r[2]} for r in rows]

                return {
                    "status": "success",
                    "topCountries": countries
                }
        except Exception as e:
            return {"status": "error", "message": str(e)}
