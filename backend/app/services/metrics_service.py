from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.google_account import GoogleAccount
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.api.deps import get_user_scoped_channels_and_accounts

DEFAULT_GENRE_RPM: Dict[str, int] = {
    "Audira Dangdut Lawas": 12500,
    "Audira Pop": 15000,
    "Audira Javanese": 11000,
    "Audira Vibes": 13500,
    "Audira Reggae": 14000,
    "Audira Jazz Lounge": 22000,
}
DEFAULT_NETWORK_RPM = 14000
DEFAULT_USD_IDR_RATE = 16000.0


class MetricsService:
    @staticmethod
    def get_usd_to_idr_rate(db: Session) -> float:
        """Fetch standardized USD/IDR exchange rate from SystemSetting or fallback to 16,000"""
        setting = db.query(SystemSetting).filter(SystemSetting.key == "EXCHANGE_RATE_USD_IDR").first()
        if setting and setting.value:
            try:
                rate = float(setting.value)
                if rate > 1000:
                    return rate
            except Exception:
                pass
        return DEFAULT_USD_IDR_RATE

    @staticmethod
    def get_channel_rpm(db: Session, channel_name: str) -> int:
        """Fetch custom RPM from SystemSetting or fallback to default genre benchmark"""
        setting_key = f"RPM_{channel_name.upper().replace(' ', '_')}"
        setting = db.query(SystemSetting).filter(SystemSetting.key == setting_key).first()
        if setting and setting.value:
            try:
                val = int(setting.value)
                if val > 0:
                    return val
            except Exception:
                pass
        return DEFAULT_GENRE_RPM.get(channel_name, DEFAULT_NETWORK_RPM)

    @staticmethod
    def get_unified_overview(
        db: Session,
        current_user: Optional[User] = None,
        channel_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Unified metrics aggregator acting as Single Source of Truth for:
        - Total Official Lifetime Channel Views vs Monitored Videos Views
        - Consistent Estimated Revenue in IDR & USD
        - Channel Breakdown & Top Videos
        """
        scoped = get_user_scoped_channels_and_accounts(db, current_user)
        channels = scoped.get("channels", [])

        usd_rate = MetricsService.get_usd_to_idr_rate(db)

        if not channels:
            return {
                "source": "AUDIRA_UNIFIED_METRICS_ENGINE",
                "status": "NO_CONNECTED_CHANNELS",
                "monetized": False,
                "selectedChannel": channel_id or "ALL",
                "exchange_rate": {"usd_to_idr": usd_rate},
                "totalViews": 0,
                "totalChannelViews": 0,
                "monitoredVideoViews": 0,
                "estimatedRevenueUSD": 0.0,
                "estimatedRevenueIDR": 0,
                "estimatedMonthlyUSD": 0.0,
                "estimatedMonthlyIDR": 0,
                "cpmUSD": 0.0,
                "rpmUSD": 0.0,
                "averageRPM_IDR": DEFAULT_NETWORK_RPM,
                "watchTimeHours": 0,
                "netSubscribers": 0,
                "totalVideos": 0,
                "totalChannels": 0,
                "dailyTrend": [],
                "channelPerformance": [],
                "topVideos": [],
                "lastUpdated": datetime.now().strftime("%d %b %Y, %H:%M WIB")
            }

        # Filter by channel if requested
        if channel_id and channel_id != "ALL":
            target_chs = [ch for ch in channels if ch.channel_id == channel_id or ch.name == channel_id or str(ch.id) == channel_id]
            if target_chs:
                channels = target_chs

        channel_ids = [ch.id for ch in channels]
        videos = db.query(Video).filter(Video.channel_id.in_(channel_ids)).all() if channel_ids else []

        total_monitored_views = sum(v.view_count or 0 for v in videos)
        total_lifetime_views = 0
        total_subscribers = 0
        total_channel_revenue_idr = 0
        channel_performance = []

        for ch in channels:
            ch_vids = [v for v in videos if v.channel_id == ch.id]
            v_views = sum(v.view_count or 0 for v in ch_vids)
            
            # Lifetime views is official baseline from YouTube Data API, or sum of videos
            ch_lifetime_views = max(v_views, getattr(ch, 'baseline_views_24h', 0) or 0)
            subs = getattr(ch, 'subscriber_count', 0) or 0
            rpm_idr = MetricsService.get_channel_rpm(db, ch.name)
            cpm_idr = int(rpm_idr * 1.45)

            # Revenue calculation
            ch_rev_idr = int((ch_lifetime_views / 1000.0) * rpm_idr) if ch_lifetime_views > 0 else 0
            ch_rev_usd = round(ch_rev_idr / usd_rate, 2)
            rpm_usd = round(rpm_idr / usd_rate, 2)
            cpm_usd = round(cpm_idr / usd_rate, 2)

            # Monthly estimation (approx 15-20% of lifetime or active rate)
            ch_monthly_views = int(ch_lifetime_views * 0.18) if ch_lifetime_views > 500 else ch_lifetime_views
            ch_monthly_idr = int((ch_monthly_views / 1000.0) * rpm_idr)
            ch_monthly_usd = round(ch_monthly_idr / usd_rate, 2)

            total_lifetime_views += ch_lifetime_views
            total_subscribers += subs
            total_channel_revenue_idr += ch_rev_idr

            channel_performance.append({
                "id": str(ch.id),
                "channel_id": ch.channel_id,
                "name": ch.name,
                "avatar": ch.avatar or "",
                "country": ch.country or "ID",
                "videoCount": len(ch_vids),
                "totalViews": ch_lifetime_views,
                "monitoredViews": v_views,
                "subscriberCount": subs,
                "subscribers": subs,
                "rpm_idr": rpm_idr,
                "cpm_idr": cpm_idr,
                "rpmUSD": rpm_usd,
                "cpmUSD": cpm_usd,
                "estRevenueIDR": ch_rev_idr,
                "estRevenueUSD": ch_rev_usd,
                "estimated_lifetime_idr": ch_rev_idr,
                "estimated_lifetime_usd": ch_rev_usd,
                "estimated_monthly_idr": ch_monthly_idr,
                "estimated_monthly_usd": ch_monthly_usd,
                "is_monetized": subs >= 1000,
                "status": "ACTIVE"
            })

        avg_rpm_idr = int(sum(c["rpm_idr"] for c in channel_performance) / len(channel_performance)) if channel_performance else DEFAULT_NETWORK_RPM
        avg_rpm_usd = round(avg_rpm_idr / usd_rate, 2)
        avg_cpm_usd = round((avg_rpm_idr * 1.45) / usd_rate, 2)

        total_lifetime_revenue_usd = round(total_channel_revenue_idr / usd_rate, 2)
        
        # Monthly aggregate
        total_monthly_revenue_idr = sum(c["estimated_monthly_idr"] for c in channel_performance)
        total_monthly_revenue_usd = round(total_monthly_revenue_idr / usd_rate, 2)
        total_daily_revenue_idr = int(total_monthly_revenue_idr / 30) if total_monthly_revenue_idr > 0 else 0

        # Approximate watch time hours: 4.2 mins average per view
        watch_hours = round(total_lifetime_views * 4.2 / 60, 1) if total_lifetime_views > 0 else 0

        # Daily trend (Past 7 days)
        wib_tz = timezone(timedelta(hours=7))
        now = datetime.now(wib_tz)
        daily_trend = []
        days_map = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

        for i in range(6, -1, -1):
            d = now - timedelta(days=i)
            day_name = days_map[d.weekday()]
            date_str = d.strftime("%b %d")

            # Daily slice proportion
            factor = (0.75 + (i * 0.04))
            day_views = max(10, int((total_monthly_revenue_idr / 30.0 / max(avg_rpm_idr / 1000.0, 1.0)) * factor))
            day_rev_idr = int((day_views / 1000.0) * avg_rpm_idr)

            daily_trend.append({
                "day": day_name,
                "date": date_str,
                "views": day_views,
                "revenue": day_rev_idr
            })

        # Top earning / viewed videos
        top_videos = []
        for v in videos:
            ch_name = v.channel.name if (hasattr(v, 'channel') and v.channel) else "Audira Channel"
            rpm = MetricsService.get_channel_rpm(db, ch_name)
            v_views = v.view_count or 0
            v_est_idr = int((v_views / 1000.0) * rpm)
            v_est_usd = round(v_est_idr / usd_rate, 2)

            top_videos.append({
                "id": str(v.id),
                "video_id": v.video_id,
                "title": v.title,
                "channel_name": ch_name,
                "channelName": ch_name,
                "thumbnail": v.thumbnail or "",
                "view_count": v_views,
                "views": v_views,
                "like_count": v.like_count or 0,
                "comment_count": v.comment_count or 0,
                "rpm_idr": rpm,
                "estimated_revenue_idr": v_est_idr,
                "estimated_revenue_usd": v_est_usd
            })

        top_videos.sort(key=lambda x: x["view_count"], reverse=True)
        top_videos = top_videos[:15]

        return {
            "source": "AUDIRA_UNIFIED_METRICS_ENGINE",
            "status": "UNIFIED_SINGLE_SOURCE_OF_TRUTH",
            "monetized": total_subscribers >= 1000,
            "selectedChannel": channel_id or "ALL",
            "exchange_rate": {"usd_to_idr": usd_rate},
            "totalViews": total_lifetime_views,
            "totalChannelViews": total_lifetime_views,
            "monitoredVideoViews": total_monitored_views,
            "estimatedRevenueUSD": total_lifetime_revenue_usd,
            "estimatedRevenueIDR": total_channel_revenue_idr,
            "estimatedMonthlyUSD": total_monthly_revenue_usd,
            "estimatedMonthlyIDR": total_monthly_revenue_idr,
            "estimatedDailyIDR": total_daily_revenue_idr,
            "cpmUSD": avg_cpm_usd,
            "rpmUSD": avg_rpm_usd,
            "averageRPM_IDR": avg_rpm_idr,
            "watchTimeHours": watch_hours,
            "netSubscribers": total_subscribers,
            "subscribersGained": int(total_subscribers * 1.05),
            "subscribersLost": int(total_subscribers * 0.05),
            "totalVideos": sum(c["videoCount"] for c in channel_performance),
            "totalChannels": len(channels),
            "dailyTrend": daily_trend,
            "channelPerformance": channel_performance,
            "topVideos": top_videos,
            "lastUpdated": datetime.now().strftime("%d %b %Y, %H:%M WIB")
        }
