import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import httpx

from app.models.system_setting import SystemSetting
from app.models.youtube_channel import YouTubeChannel
from app.services.intelligence_service import CHANNEL_AUDIENCE_PROFILES, get_channel_profile

class AIService:
    @staticmethod
    async def generate_ai_title_suggestions(
        channel_name: str, 
        topic: str = "Music",
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Generates 5 viral SEO titles and 15 trending hashtags tailored to the specific channel genre and keywords.
        Uses Gemini LLM when GEMINI_API_KEY is available, with dynamic contextual fallback.
        """
        profile = get_channel_profile(channel_name, db=db)
        genre = profile.get("genre", "Musik Indonesia Hits")
        keywords = profile.get("viral_keywords", ["Lagu Pop Indonesia", "Musik Trending 2026", "Lofi Chill", "Dangdut Classic"])

        # Fetch recent video titles from DB for grounding if available
        recent_titles = []
        if db:
            ch = db.query(YouTubeChannel).filter(
                (YouTubeChannel.name == channel_name) | (YouTubeChannel.channel_id == channel_name)
            ).first()
            if ch and ch.videos:
                recent_titles = [v.title for v in ch.videos[:5] if v.title]

        # Check for Gemini API key
        api_key = None
        if db:
            setting = db.query(SystemSetting).filter(SystemSetting.key == "GEMINI_API_KEY").first()
            if setting and setting.value and setting.value != "your_gemini_api_key_here":
                api_key = setting.value.strip()
        if not api_key:
            env_key = os.getenv("GEMINI_API_KEY")
            if env_key and env_key != "your_gemini_api_key_here":
                api_key = env_key.strip()

        # Dynamic Gemini Generation
        if api_key:
            try:
                sample_context = f"Sampel judul terkini: {', '.join(recent_titles[:4])}" if recent_titles else "Fokus pada musik Indonesia berkualitas tinggi"
                prompt = (
                    f"Anda adalah AI YouTube SEO Strategist untuk channel musik '{channel_name}'.\n"
                    f"Genre: {genre}.\n"
                    f"{sample_context}.\n"
                    f"Topik/Lagu yang akan diunggah: '{topic}'.\n\n"
                    f"Instruksi:\n"
                    f"1. Berikan 5 variasi judul video YouTube yang sangat menarik (High Click-Through Rate) dan ramah algoritma 2026.\n"
                    f"2. Berikan 15 hashtag relevan diawali tanda #.\n"
                    f"3. Berikan saran strategi rilis dalam 2 kalimat ringkas.\n\n"
                    f"Format respons HANYA JSON murni tanpa markdown:\n"
                    f'{{\n'
                    f'  "titles": ["judul 1", "judul 2", "judul 3", "judul 4", "judul 5"],\n'
                    f'  "hashtags": ["#tag1", "#tag2", ...],\n'
                    f'  "ai_virality_score": 97,\n'
                    f'  "ai_strategy_recommendation": "teks strategi"\n'
                    f'}}'
                )

                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "responseMimeType": "application/json",
                            "temperature": 0.7,
                            "maxOutputTokens": 800
                        }
                    })

                    if resp.status_code == 200:
                        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                        parsed = json.loads(raw)
                        if "titles" in parsed and len(parsed["titles"]) >= 3:
                            return {
                                "source": "GEMINI_1.5_FLASH_LIVE",
                                "channel_name": channel_name,
                                "genre": genre,
                                "generated_at": datetime.now().strftime("%H:%M:%S WIB"),
                                "ai_virality_score": parsed.get("ai_virality_score", 97),
                                "titles": parsed["titles"],
                                "hashtags": parsed.get("hashtags", []),
                                "ai_strategy_recommendation": parsed.get("ai_strategy_recommendation", "")
                            }
            except Exception as e:
                print(f"[AIService Gemini Error]: {e}")

        # Contextual Algorithmic Fallback
        kw1 = keywords[0] if len(keywords) > 0 else "Lagu Viral"
        kw2 = keywords[1] if len(keywords) > 1 else "Hits Terpopuler"
        kw3 = keywords[2] if len(keywords) > 2 else "Audio HD"
        ch_name_clean = channel_name.replace("Network", "").replace("Radio", "").replace("Hub", "").strip()
        topic_clean = topic if topic and topic != "Music" else kw1

        titles = [
            f"🔥 VIRAL 2026! {ch_name_clean} - {topic_clean} Paling Enak Didengar Saat Santai ({kw3})",
            f"🎧 FULL ALBUM TERBAIK {ch_name_clean} - Koleksi {kw2} Pilihan Tanpa Iklan 2026",
            f"🚀 MOMENTUM EMAS! {ch_name_clean} Live Session {topic_clean} (Official Audio)",
            f"🎯 LIRIK & MELODI TERPOPULER - {ch_name_clean} {topic_clean} Viral TikTok Trending",
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
            "source": "AUDIRA_HEURISTIC_AI_ENGINE",
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

        if channel_name:
            profile = get_channel_profile(channel_name)
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
