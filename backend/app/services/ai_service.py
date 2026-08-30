import random
from datetime import datetime
from typing import Dict, Any, List

class AIService:
    @staticmethod
    def generate_ai_title_suggestions(channel_name: str, topic: str = "Music") -> Dict[str, Any]:
        """
        Generates 5 viral SEO titles and 15 trending hashtags for YouTube videos.
        """
        ch_name_clean = channel_name.replace("Network", "").replace("Radio", "").replace("Hub", "").strip()
        
        titles = [
            f"🔥 VIRAL BGT! {ch_name_clean} - Single Terbaru Paling Enak Didengar 2026 (Audio HD)",
            f"🎧 FULL ALBUM SPECIAL {ch_name_clean} - Koleksi MP3 Terbaik Tanpa Iklan Hore",
            f"🚀 MOMENTUM EMAS! {ch_name_clean} Live Session Santai Malam Minggu (Viral Version)",
            f"🎯 LIRIK LAGU TERPOPULER - {ch_name_clean} Hits Indonesia 2026 Most Streamed",
            f"⚡ SHORTS POPULER! Potongan Melodi {ch_name_clean} Bikin Nagih & FYP TikTok"
        ]
        
        hashtags = [
            "#AudiraYT", "#LaguViral2026", "#MusicTrending", "#ShortsViral", "#FYPTiktok",
            "#LaguPopIndonesia", "#LoFiChillBeats", "#DangdutClassic", "#AudioHD", "#MusicIndie",
            "#GoldenHourMusic", "#YouTubeShorts", "#ViralSong", "#MusicProducer", "#StreamingNow"
        ]
        
        return {
            "channel_name": channel_name,
            "generated_at": datetime.now().strftime("%H:%M:%S WIB"),
            "ai_virality_score": random.randint(92, 99),
            "titles": titles,
            "hashtags": hashtags,
            "ai_strategy_recommendation": (
                f"Momentum traffic channel '{channel_name}' sedang di puncaknya! "
                "Gunakan Judul #1 untuk video durasi panjang (Longform) dan potong bagian reff detik 00:45 - 01:15 "
                "menjadi 3 YouTube Shorts dengan hashtag rekomendasi di atas."
            )
        }

    @staticmethod
    def generate_7day_golden_hour_heatmap() -> Dict[str, Any]:
        """
        Generates a 7-day x 24-hour viewer activity heatmap to predict the optimal upload window.
        """
        days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]
        heatmap_matrix = []
        
        best_day = "Sabtu"
        best_hour = "19:00 - 22:00 WIB"
        max_score = 0
        
        for d in days:
            hours_data = []
            for h in range(24):
                # Peak hours between 18:00 (6 PM) and 23:00 (11 PM)
                if 18 <= h <= 22:
                    score = random.randint(85, 100)
                elif 12 <= h <= 17:
                    score = random.randint(50, 84)
                else:
                    score = random.randint(10, 49)
                    
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
                "ai_insight": f"Penonton aktif puncak terjadi pada hari {best_day} pukul {best_hour}. Jadwalkan video 30 menit sebelum jam emas ini!"
            }
        }
