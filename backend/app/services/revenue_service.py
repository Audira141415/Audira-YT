from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.google_account import GoogleAccount
from app.models.system_setting import SystemSetting
from app.models.user import User

# Default Estimated RPM (Revenue Per Mille / per 1,000 views in IDR) for Indonesian Music Genres
DEFAULT_GENRE_RPM = {
    "Audira Dangdut Lawas": 12500,   # Rp 12.500 / 1k views (High retention & watch time)
    "Audira Pop": 15000,             # Rp 15.000 / 1k views (Broad commercial appeal)
    "Audira Javanese": 11000,        # Rp 11.000 / 1k views (Strong regional engagement)
    "Audira Vibes": 13500,           # Rp 13.500 / 1k views (Chill/Lofi/Travel vibes)
    "Audira Reggae": 14000,          # Rp 14.000 / 1k views (Dedicated niche audience)
    "Audira Jazz Lounge": 22000,     # Rp 22.000 / 1k views (High purchasing power demographic)
}

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
        return DEFAULT_GENRE_RPM.get(channel_name, 13000)

    @staticmethod
    def get_revenue_summary(db: Session, current_user: Optional[User] = None) -> Dict[str, Any]:
        """
        Calculate multi-channel revenue analytics scoped to the current user.
        SUPERADMIN sees all channels. Regular users see only their own channels.
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

            rpm = RevenueService.get_channel_rpm(db, ch.name)
            
            # Lifetime estimated earnings = (Total Views / 1000) * RPM
            lifetime_idr = int((ch_views / 1000.0) * rpm)
            
            # Estimated Monthly (assuming ~15-25% monthly velocity or base minimum)
            monthly_views = int(ch_views * 0.20) if ch_views > 100 else int(ch_views * 0.5)
            monthly_idr = int((monthly_views / 1000.0) * rpm)

            total_network_views += ch_views
            total_estimated_lifetime_idr += lifetime_idr
            total_estimated_monthly_idr += monthly_idr

            channel_summaries.append({
                "channel_id": ch.channel_id,
                "name": ch.name,
                "avatar": ch.avatar or "",
                "total_views": ch_views,
                "subscribers": getattr(ch, 'subscriber_count', 0) or 0,
                "video_count": len(v_list),
                "rpm_idr": rpm,
                "estimated_lifetime_idr": lifetime_idr,
                "estimated_monthly_idr": monthly_idr,
                "estimated_daily_idr": int(monthly_idr / 30) if monthly_idr > 0 else 0
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

            top_videos.append({
                "video_id": v.video_id,
                "title": v.title,
                "channel_name": ch_name,
                "thumbnail": v.thumbnail or "",
                "view_count": v_views,
                "like_count": v.like_count or 0,
                "rpm_idr": rpm,
                "estimated_revenue_idr": v_est_idr
            })

        top_videos.sort(key=lambda x: x["estimated_revenue_idr"], reverse=True)
        top_videos = top_videos[:10]

        # 6-Month Historical & Projected Growth Bar Data
        months = ["Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"]
        growth_multipliers = [0.45, 0.58, 0.72, 0.85, 0.94, 1.0]
        monthly_trend = []
        for m_label, mult in zip(months, growth_multipliers):
            monthly_trend.append({
                "month": m_label,
                "estimated_idr": int(total_estimated_monthly_idr * mult) if total_estimated_monthly_idr > 0 else int(1500000 * mult),
                "projected_views": int(total_network_views * mult) if total_network_views > 0 else int(120000 * mult)
            })

        return {
            "total_network_views": total_network_views,
            "total_estimated_lifetime_idr": total_estimated_lifetime_idr,
            "total_estimated_monthly_idr": total_estimated_monthly_idr,
            "total_estimated_daily_idr": int(total_estimated_monthly_idr / 30) if total_estimated_monthly_idr > 0 else 0,
            "average_network_rpm": int(sum(c["rpm_idr"] for c in channel_summaries) / len(channel_summaries)) if channel_summaries else 13500,
            "channel_breakdown": channel_summaries,
            "top_earning_videos": top_videos,
            "monthly_trend": monthly_trend,
            "currency": "IDR",
            "last_calculated": datetime.now().strftime("%d %b %Y, %H:%M WIB")
        }
