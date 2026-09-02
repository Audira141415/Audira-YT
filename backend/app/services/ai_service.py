from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.intelligence_service import CHANNEL_AUDIENCE_PROFILES

class AIService:
    @staticmethod
    def generate_ai_title_suggestions(channel_name: str, topic: str = "Music") -> Dict[str, Any]:
        """
        Generates 5 viral SEO titles and 15 trending hashtags tailored to the specific channel genre and keywords.
        """
        profile = CHANNEL_AUDIENCE_PROFILES.get(channel_name, {})
        genre = profile.get("genre", "Musik Indonesia Hits")
        keywords = profile.get("viral_keywords", ["Lagu Pop Indonesia", "Musik Trending 2026", "Lofi Chill", "Dangdut Classic"])
        
        kw1 = keywords[0] if len(keywords) > 0 else "Lagu Viral"
        kw2 = keywords[1] if len(keywords) > 1 else "Hits Terpopuler"
        kw3 = keywords[2] if len(keywords) > 2 else "Audio HD"
        
        ch_name_clean = channel_name.replace("Network", "").replace("Radio", "").replace("Hub", "").strip()

        titles = [
            f"🔥 VIRAL 2026! {ch_name_clean} - {kw1} Paling Enak Didengar Saat Santai ({kw3})",
            f"🎧 FULL ALBUM TERBAIK {ch_name_clean} - Koleksi {kw2} Pilihan Tanpa Iklan 2026",
            f"🚀 MOMENTUM EMAS! {ch_name_clean} Live Session {genre} (Official Audio)",
            f"🎯 LIRIK & MELODI TERPOPULER - {ch_name_clean} {kw1} Viral TikTok Trending",
            f"⚡ SHORTS FYP! Potongan Reff {ch_name_clean} Paling Bikin Candu ({genre})"
        ]

        tag_genre = genre.replace(" ", "").replace("&", "").replace("/", "")
        hashtags = [
            f"#{ch_name_clean.replace(' ', '')}",
            f"#{tag_genre}",
            "#AudiraYT",
            "#LaguViral2026",
            "#MusicTrending",
            "#ShortsViral",
            "#FYPTiktok",
            "#AudioHD",
            "#GoldenHourMusic",
            "#YouTubeShorts",
            "#ViralSong",
            "#MusicProducer",
            "#StreamingNow",
            f"#{kw1.replace(' ', '')}",
            f"#{kw2.replace(' ', '')}"
        ]

        return {
            "channel_name": channel_name,
            "genre": genre,
            "generated_at": datetime.now().strftime("%H:%M:%S WIB"),
            "ai_virality_score": 96,
            "titles": titles,
            "hashtags": hashtags,
            "ai_strategy_recommendation": (
                f"Genre target '{genre}' memiliki audiens puncak di akhir pekan. "
                "Gunakan Judul #1 untuk rilis video panjang dan ekstrak bagian reff 30 detik untuk YouTube Shorts."
            )
        }

    @staticmethod
    def generate_7day_golden_hour_heatmap(channel_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates a deterministic 7-day x 24-hour viewer activity heatmap based on Indonesian audience behavior
        and the specific channel's genre profile.
        """
        days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
        peak_weight_map = {
            "Senin": 68,
            "Selasa": 72,
            "Rabu": 75,
            "Kamis": 82,
            "Jumat": 92,
            "Sabtu": 98,
            "Minggu": 95,
        }

        # Check if channel has customized peak days in its profile
        if channel_name and channel_name in CHANNEL_AUDIENCE_PROFILES:
            profile = CHANNEL_AUDIENCE_PROFILES[channel_name]
            peak_days = profile.get("peak_days", ["Jumat", "Sabtu", "Minggu"])
            for d in peak_days:
                peak_weight_map[d] = max(peak_weight_map.get(d, 80), 96)

        heatmap_matrix = []
        best_day = "Sabtu"
        best_hour = "20:00 WIB"
        max_score = 0

        for d in days:
            day_base = peak_weight_map.get(d, 70)
            hours_data = []
            for h in range(24):
                # Calculate hourly traffic curve (Prime Time: 18:00 - 22:00, Afternoon: 12:00 - 14:00)
                if 19 <= h <= 21:
                    hour_factor = 1.0
                elif 18 <= h <= 22:
                    hour_factor = 0.92
                elif 12 <= h <= 14:
                    hour_factor = 0.78
                elif 15 <= h <= 17 or 23 <= h <= 23:
                    hour_factor = 0.65
                elif 7 <= h <= 11:
                    hour_factor = 0.45
                else:
                    hour_factor = 0.22

                score = int(day_base * hour_factor)
                score = min(100, max(12, score))

                hours_data.append({"hour": f"{h:02d}:00", "score": score})

                if score > max_score:
                    max_score = score
                    best_day = d
                    best_hour = f"{h:02d}:00 WIB"

            heatmap_matrix.append({"day": d, "hours": hours_data})

        return {
            "heatmap": heatmap_matrix,
            "golden_window_summary": {
                "best_day": best_day,
                "best_hour": best_hour,
                "overall_traffic_score": max_score,
                "ai_insight": f"Audiens paling aktif pada hari {best_day} pukul {best_hour}. Jadwalkan video 30-45 menit sebelum jam emas ini."
            }
        }
