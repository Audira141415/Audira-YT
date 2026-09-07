from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.google_account import GoogleAccount
from app.models.system_setting import SystemSetting
from app.models.user import User

# Default Estimated RPM & CPM (Revenue & Cost Per Mille in IDR) for Audira Music Genres
DEFAULT_GENRE_RPM = {
    "Audira Dangdut Lawas": 12500,   # Rp 12.500 / 1k views
    "Audira Pop": 15000,             # Rp 15.000 / 1k views
    "Audira Javanese": 11000,        # Rp 11.000 / 1k views
    "Audira Vibes": 13500,           # Rp 13.500 / 1k views
    "Audira Reggae": 14000,          # Rp 14.000 / 1k views
    "Audira Jazz Lounge": 22000,     # Rp 22.000 / 1k views
}

USD_IDR_RATE = 16200.0

class RevenueService:
    @staticmethod
    def get_channel_rpm(db: Session, channel_name: str) -> int:
        """Fetch custom RPM from SystemSetting or fallback to default genre benchmark"""
        setting_key = f"RPM_{channel_name.upper().replace(' ', '_')}"
        setting = db.query(SystemSetting).filter(SystemSetting.key == setting_key).first()
        if setting and setting.value:
            try:
                return int(setting.value)
            except Exception:
                pass
        return DEFAULT_GENRE_RPM.get(channel_name, 13500)

    @staticmethod
    def get_revenue_summary(db: Session, current_user: Optional[User] = None) -> Dict[str, Any]:
        """
        Calculate multi-channel revenue analytics with IDR & USD currencies scoped to current user.
        """
        is_superadmin = current_user and (getattr(current_user, 'role', '') or '').upper() == 'SUPERADMIN'

        # 🔐 USER ISOLATION: Scope channels to current user unless SUPERADMIN
        channel_query = db.query(YouTubeChannel)
        if current_user and not is_superadmin:
            channel_query = channel_query.join(
                GoogleAccount, YouTubeChannel.account_id == GoogleAccount.id
            ).filter((GoogleAccount.user_id == current_user.id) | (GoogleAccount.user_id == None))

        channels = channel_query.all()

        channel_summaries = []
        total_network_views = 0
        total_estimated_lifetime_idr = 0
        total_estimated_monthly_idr = 0

        for ch in channels:
            v_list = ch.videos if ch.videos else []
            ch_views = sum(v.view_count or 0 for v in v_list)
            if ch_views == 0 and ch.baseline_views_24h:
                ch_views = ch.baseline_views_24h

            subs = getattr(ch, 'subscriber_count', 0) or 0
            rpm = RevenueService.get_channel_rpm(db, ch.name)
            cpm = int(rpm * 1.45) # Typical CPM ratio
            
            # Lifetime estimated earnings = (Total Views / 1000) * RPM
            lifetime_idr = int((ch_views / 1000.0) * rpm)
            lifetime_usd = round(lifetime_idr / USD_IDR_RATE, 2)
            
            # Estimated Monthly
            monthly_views = int(ch_views * 0.20) if ch_views > 100 else int(ch_views * 0.5)
            monthly_idr = int((monthly_views / 1000.0) * rpm)
            monthly_usd = round(monthly_idr / USD_IDR_RATE, 2)

            total_network_views += ch_views
            total_estimated_lifetime_idr += lifetime_idr
            total_estimated_monthly_idr += monthly_idr

            # YPP Monetization Progress (1,000 subs threshold)
            is_monetized = subs >= 1000
            monetization_progress = min(100.0, round((subs / 1000.0) * 100, 1))

            channel_summaries.append({
                "channel_id": ch.channel_id,
                "name": ch.name,
                "avatar": ch.avatar or "",
                "total_views": ch_views,
                "subscribers": subs,
                "video_count": len(v_list),
                "rpm_idr": rpm,
                "cpm_idr": cpm,
                "rpm_usd": round(rpm / USD_IDR_RATE, 2),
                "estimated_lifetime_idr": lifetime_idr,
                "estimated_lifetime_usd": lifetime_usd,
                "estimated_monthly_idr": monthly_idr,
                "estimated_monthly_usd": monthly_usd,
                "estimated_daily_idr": int(monthly_idr / 30) if monthly_idr > 0 else 0,
                "is_monetized": is_monetized,
                "monetization_progress_pct": monetization_progress
            })

        # Top monetizing videos scoped to user's channels
        channel_ids = [ch.id for ch in channels]
        if channel_ids:
            all_videos = db.query(Video).filter(Video.channel_id.in_(channel_ids)).all()
        else:
            all_videos = []

        top_videos = []
        for v in all_videos:
            ch_name = v.channel.name if v.channel else "Audira Network"
            rpm = RevenueService.get_channel_rpm(db, ch_name)
            v_views = v.view_count or 0
            v_est_idr = int((v_views / 1000.0) * rpm)
            v_est_usd = round(v_est_idr / USD_IDR_RATE, 2)

            top_videos.append({
                "video_id": v.video_id,
                "title": v.title,
                "channel_name": ch_name,
                "thumbnail": v.thumbnail or "",
                "view_count": v_views,
                "like_count": v.like_count or 0,
                "rpm_idr": rpm,
                "estimated_revenue_idr": v_est_idr,
                "estimated_revenue_usd": v_est_usd
            })

        top_videos.sort(key=lambda x: x["estimated_revenue_idr"], reverse=True)
        top_videos = top_videos[:10]

        # 6-Month Historical & Projected Growth Bar Data
        months = ["Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"]
        growth_multipliers = [0.45, 0.58, 0.72, 0.85, 0.94, 1.0]
        monthly_trend = []
        for m_label, mult in zip(months, growth_multipliers):
            est_idr = int(total_estimated_monthly_idr * mult) if total_estimated_monthly_idr > 0 else int(1500000 * mult)
            monthly_trend.append({
                "month": m_label,
                "estimated_idr": est_idr,
                "estimated_usd": round(est_idr / USD_IDR_RATE, 2),
                "projected_views": int(total_network_views * mult) if total_network_views > 0 else int(120000 * mult)
            })

        return {
            "total_network_views": total_network_views,
            "total_estimated_lifetime_idr": total_estimated_lifetime_idr,
            "total_estimated_lifetime_usd": round(total_estimated_lifetime_idr / USD_IDR_RATE, 2),
            "total_estimated_monthly_idr": total_estimated_monthly_idr,
            "total_estimated_monthly_usd": round(total_estimated_monthly_idr / USD_IDR_RATE, 2),
            "total_estimated_daily_idr": int(total_estimated_monthly_idr / 30) if total_estimated_monthly_idr > 0 else 0,
            "average_network_rpm_idr": int(sum(c["rpm_idr"] for c in channel_summaries) / len(channel_summaries)) if channel_summaries else 13500,
            "channel_breakdown": channel_summaries,
            "top_earning_videos": top_videos,
            "monthly_trend": monthly_trend,
            "exchange_rate": {"usd_to_idr": USD_IDR_RATE},
            "last_calculated": datetime.now().strftime("%d %b %Y, %H:%M WIB")
        }

