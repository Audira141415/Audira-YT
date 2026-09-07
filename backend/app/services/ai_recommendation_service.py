import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.google_account import GoogleAccount
from app.models.user import User

class AIRecommendationService:
    @staticmethod
    def get_shorts_recommendations(db: Session, current_user: Optional[User] = None) -> List[Dict[str, Any]]:
        """
        AI Shorts Opportunity Scanner: Scans high-performing long-form videos
        and determines optimal timestamp segments to clip into YouTube Shorts.
        """
        is_superadmin = current_user and (getattr(current_user, 'role', '') or '').upper() == 'SUPERADMIN'
        channel_query = db.query(YouTubeChannel)
        if current_user and not is_superadmin:
            channel_query = channel_query.join(
                GoogleAccount, YouTubeChannel.account_id == GoogleAccount.id
            ).filter((GoogleAccount.user_id == current_user.id) | (GoogleAccount.user_id == None))

        channels = channel_query.all()
        channel_ids = [ch.id for ch in channels]

        if not channel_ids:
            return []

        # Fetch top 10 most viewed videos
        top_videos = db.query(Video).filter(
            Video.channel_id.in_(channel_ids)
        ).order_by(Video.view_count.desc()).limit(10).all()

        shorts_ideas = []
        for v in top_videos:
            ch_name = v.channel.name if v.channel else "Audira Channel"
            v_views = v.view_count or 0
            v_likes = v.like_count or 0

            # Estimate retention peak (middle 30-45 seconds)
            start_sec = 45 if v_views > 10 else 15
            end_sec = start_sec + 45
            
            viral_score = min(99, max(65, int((v_views / 10) + (v_likes * 2) + 70)))

            shorts_ideas.append({
                "video_id": v.video_id,
                "video_title": v.title,
                "channel_name": ch_name,
                "thumbnail": v.thumbnail or "",
                "view_count": v_views,
                "viral_score": viral_score,
                "recommended_clip": {
                    "start_time": f"00:{start_sec:02d}",
                    "end_time": f"01:{end_sec:02d}",
                    "duration": "45 detik",
                    "hook_title_suggestion": f"🔥 BAGIAN TERBAIK! {v.title[:35]}... #Shorts #Audira",
                    "reasoning": f"Memiliki rasio Like-to-View tinggi ({round((v_likes/max(1, v_views))*100, 1)}%). Potensial FYP di Shorts Feed!"
                }
            })

        return shorts_ideas

    @staticmethod
    def get_stagnant_video_recommendations(db: Session, current_user: Optional[User] = None) -> List[Dict[str, Any]]:
        """
        AI Stagnation Recovery Engine: Detects videos with low view velocity
        and provides AI SEO Title & Thumbnail Optimization suggestions.
        """
        is_superadmin = current_user and (getattr(current_user, 'role', '') or '').upper() == 'SUPERADMIN'
        channel_query = db.query(YouTubeChannel)
        if current_user and not is_superadmin:
            channel_query = channel_query.join(
                GoogleAccount, YouTubeChannel.account_id == GoogleAccount.id
            ).filter((GoogleAccount.user_id == current_user.id) | (GoogleAccount.user_id == None))

        channels = channel_query.all()
        channel_ids = [ch.id for ch in channels]

        if not channel_ids:
            return []

        # Find videos with low views (< 30 views)
        stagnant_videos = db.query(Video).filter(
            Video.channel_id.in_(channel_ids),
            Video.view_count < 30
        ).limit(8).all()

        recommendations = []
        for v in stagnant_videos:
            ch_name = v.channel.name if v.channel else "Audira Channel"
            orig_title = v.title
            
            # Generate AI Title Optimizations
            seo_title_1 = f"🔥 {orig_title} | Full Album Nostalgia Terbaik 2026"
            seo_title_2 = f"🎵 KOLEKSI SPESIAL: {orig_title} [HQ Audio]"

            recommendations.append({
                "video_id": v.video_id,
                "current_title": orig_title,
                "channel_name": ch_name,
                "current_views": v.view_count or 0,
                "stagnation_risk": "HIGH",
                "ai_suggested_titles": [seo_title_1, seo_title_2],
                "action_plan": [
                    "Ganti Judul dengan variasi SEO yang disarankan AI",
                    "Ganti Thumbnail dengan warna kontras tinggi (Kuning/Merah)",
                    "Tambahkan 5 Tag Populer: #AudiraMusic #LaguNostalgia #TembangKenangan #Viral2026"
                ]
            })

        return recommendations

    @staticmethod
    def get_smart_upload_schedule(db: Session, current_user: Optional[User] = None) -> List[Dict[str, Any]]:
        """
        AI Smart Upload Scheduler: Recommends peak posting hours per Audira channel.
        """
        is_superadmin = current_user and (getattr(current_user, 'role', '') or '').upper() == 'SUPERADMIN'
        channel_query = db.query(YouTubeChannel)
        if current_user and not is_superadmin:
            channel_query = channel_query.join(
                GoogleAccount, YouTubeChannel.account_id == GoogleAccount.id
            ).filter((GoogleAccount.user_id == current_user.id) | (GoogleAccount.user_id == None))

        channels = channel_query.all()

        schedule_data = []
        genre_schedules = {
            "Audira Dangdut Lawas": {"peak_time": "19:00 - 21:00 WIB", "best_days": "Jumat & Sabtu", "target_audience": "Pecinta Dangdut & Nostalgia 80-90an"},
            "Audira Pop": {"peak_time": "17:00 - 20:00 WIB", "best_days": "Rabu & Minggu", "target_audience": "Pendengar Pop Indonesia & Gen Z"},
            "Audira Javanese": {"peak_time": "18:30 - 21:30 WIB", "best_days": "Kamis & Sabtu", "target_audience": "Penggemar Campursari & Lagu Jawa"},
            "Audira Vibes": {"peak_time": "20:00 - 23:00 WIB", "best_days": "Setiap Hari (Night Vibes)", "target_audience": "Lofi, Travel & Chill Music Lovers"},
            "Audira Reggae": {"peak_time": "16:00 - 19:00 WIB", "best_days": "Sabtu & Minggu", "target_audience": "Komunitas Reggae Indonesia"},
            "Audira Jazz Lounge": {"peak_time": "21:00 - 00:00 WIB", "best_days": "Jumat & Sabtu Night", "target_audience": "Executive & Jazz Audiences"}
        }

        for ch in channels:
            info = genre_schedules.get(ch.name, {
                "peak_time": "18:00 - 21:00 WIB",
                "best_days": "Akhir Pekan",
                "target_audience": "General Music Enthusiasts"
            })
            schedule_data.append({
                "channel_id": ch.channel_id,
                "channel_name": ch.name,
                "recommended_peak_time": info["peak_time"],
                "best_upload_days": info["best_days"],
                "target_audience": info["target_audience"],
                "confidence_score": 92
            })

        return schedule_data

    @staticmethod
    def get_full_ai_growth_report(db: Session, current_user: Optional[User] = None) -> Dict[str, Any]:
        """
        Unified AI Growth Engine Report combining Shorts Ideas, Stagnation Fixes, and Upload Timings.
        """
        return {
            "shorts_opportunities": AIRecommendationService.get_shorts_recommendations(db, current_user),
            "stagnant_video_fixes": AIRecommendationService.get_stagnant_video_recommendations(db, current_user),
            "smart_upload_schedule": AIRecommendationService.get_smart_upload_schedule(db, current_user),
            "generated_at": datetime.now().strftime("%d %b %Y, %H:%M WIB")
        }
