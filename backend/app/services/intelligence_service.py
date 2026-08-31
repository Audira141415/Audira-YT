import os
from typing import Dict, Any, List, Optional
from datetime import datetime

# Channel Genre Profiles and Ideal Golden Hours for Indonesian Music Network
CHANNEL_AUDIENCE_PROFILES = {
    "Audira Dangdut Lawas": {
        "genre": "Dangdut Lawas & Koplo Klasik",
        "audience_demographic": "Usia 25-55 tahun, pekerja/sopir/keluarga, aktif malam hari",
        "golden_hours": ["18:30 - 21:00 WIB", "12:00 - 13:30 WIB"],
        "peak_days": ["Jumat", "Sabtu", "Minggu"],
        "viral_keywords": ["Dangdut Lawas", "Koplo Full Album", "Kenangan Indah", "Gitar Akustik Dangdut", "Karaoke"]
    },
    "Audira Pop": {
        "genre": "Indonesian Pop & Slow Rock",
        "audience_demographic": "Usia 18-35 tahun, pekerja kantoran, mahasiswa, mobile active",
        "golden_hours": ["17:00 - 19:30 WIB", "20:00 - 22:00 WIB"],
        "peak_days": ["Kamis", "Jumat", "Sabtu"],
        "viral_keywords": ["Pop Indonesia", "Lagu Galau 2026", "Acoustic Pop", "Hits Viral TikTok", "Chill Pop"]
    },
    "Audira Javanese": {
        "genre": "Musik & Tembang Campursari / Dangdut Jawa",
        "audience_demographic": "Jawa Timur, Jawa Tengah, DIY, pekerja/komunitas seni",
        "golden_hours": ["19:00 - 21:30 WIB", "05:30 - 07:00 WIB"],
        "peak_days": ["Sabtu", "Minggu", "Senin"],
        "viral_keywords": ["Lagu Jawa Viral", "Denny Caknan Style", "Guyon Waton", "Campursari", "Koplo Jawa 2026"]
    },
    "Audira Vibes": {
        "genre": "Chill, Lofi, Sunset & Tropical Vibes",
        "audience_demographic": "Gen-Z & Milenial, kafe, belajar, santai sore",
        "golden_hours": ["16:00 - 18:30 WIB", "21:00 - 23:30 WIB"],
        "peak_days": ["Jumat", "Sabtu", "Minggu"],
        "viral_keywords": ["Sunset Vibes", "Lofi Beats", "Cafe Music", "Work & Study Music", "Santai Sore"]
    },
    "Audira Reggae": {
        "genre": "Reggae & Ska Indonesia",
        "audience_demographic": "Komunitas reggae, pantai, touring, anak muda",
        "golden_hours": ["16:30 - 19:00 WIB", "20:00 - 22:00 WIB"],
        "peak_days": ["Sabtu", "Minggu"],
        "viral_keywords": ["Reggae Indonesia", "Santai di Pantai", "Ska Koplo", "Rastafara Vibes", "Reggae Cover"]
    },
    "Audira Jazz Lounge": {
        "genre": "Smooth Jazz, Bossa Nova & Midnight Lounge",
        "audience_demographic": "Eksekutif, hotel/resto, midnight listener, high-end",
        "golden_hours": ["21:30 - 01:00 WIB", "06:00 - 08:00 WIB"],
        "peak_days": ["Jumat", "Sabtu", "Minggu"],
        "viral_keywords": ["Midnight Jazz", "Coffee Shop Jazz", "Smooth Saxophone", "Bossa Nova Chill", "Relaxing Piano"]
    }
}

class IntelligenceService:
    @staticmethod
    def get_golden_hours() -> List[Dict[str, Any]]:
        """
        Calculates optimal publishing windows, audience demographics, and high-impact days per channel.
        """
        results = []
        for name, profile in CHANNEL_AUDIENCE_PROFILES.items():
            results.append({
                "channel_name": name,
                "genre": profile["genre"],
                "audience_demographic": profile["audience_demographic"],
                "golden_hours": profile["golden_hours"],
                "peak_days": profile["peak_days"],
                "recommended_upload_time": profile["golden_hours"][0],
                "viral_keywords": profile["viral_keywords"],
                "efficiency_score": 96
            })
        return results

    @staticmethod
    def generate_viral_metadata(channel_name: str, topic_or_song: str) -> Dict[str, Any]:
        """
        Generates high-CTR video title variations, SEO tags, and YouTube Shorts hooks.
        """
        profile = CHANNEL_AUDIENCE_PROFILES.get(channel_name, list(CHANNEL_AUDIENCE_PROFILES.values())[0])
        genre = profile["genre"]
        song_clean = topic_or_song.strip() if topic_or_song else "Koleksi Lagu Terbaik"

        titles = [
            f"{song_clean.upper()} 🔥 {genre.upper()} TERBAIK 2026 [FULL ALBUM HQ]",
            f"KOMPILASI {song_clean.upper()} 🎵 TEMAN SANTAI & KERJA PALING ENAK DIDENGAR",
            f"{song_clean.upper()} - SPESIAL {profile['viral_keywords'][0].upper()} (AUDIO JERNIH)",
            f"NONSTOP {song_clean.upper()} ❤️ BIKIN NAGIH & ENAK BANGET DIDENGARKAN"
        ]

        tags = [
            profile['viral_keywords'][0],
            profile['viral_keywords'][1],
            "Audira Network",
            channel_name,
            "Lagu Terbaru 2026",
            "Music Audio HD",
            "Official Release"
        ]

        shorts_hooks = [
            f"Part lagu ini yang paling bikin candu! Dengerin sampai reff 🎧🔥",
            f"Siapa yang masih dengerin lagu ini di tahun 2026? Absen di kolom komentar! 👇",
            f"Vibes-nya dapet banget, cocok buat temen santai sore ini ☕✨"
        ]

        return {
            "channel_name": channel_name,
            "input_topic": song_clean,
            "suggested_titles": titles,
            "suggested_tags": tags,
            "shorts_hooks": shorts_hooks,
            "recommended_golden_hour": profile["golden_hours"][0]
        }

    @staticmethod
    def get_cross_promotion_template(active_channel_name: str) -> str:
        """
        Generates YouTube video description template with cross-promotion links to all 5 other Audira channels.
        """
        channels_links = {
            "Audira Vibes": "https://youtube.com/@AudiraVibes",
            "Audira Dangdut Lawas": "https://youtube.com/@AudiraDangdutLawas",
            "Audira Javanese": "https://youtube.com/@AudiraJavanese",
            "Audira Pop": "https://youtube.com/@AudiraPop",
            "Audira Reggae": "https://youtube.com/@AudiraReggae",
            "Audira Jazz Lounge": "https://youtube.com/@AudiraJazzLounge"
        }

        other_channels_text = []
        for name, link in channels_links.items():
            if name != active_channel_name:
                other_channels_text.append(f"🎧 {name}: {link}")

        template = (
            f"Terima kasih telah mendengarkan musik di official channel {active_channel_name}!\n"
            f"Jangan lupa LIKE, COMMENT, SUBSCRIBE & SHARE agar tidak ketinggalan rilisan lagu terbaru setiap harinya.\n\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"🌐 JELAJAHI JUGA OFFICIAL NETWORK AUDIRA:\n"
            f"{chr(10).join(other_channels_text)}\n"
            f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"📩 Kontak Bisnis & Lisensi: audiradigitalnetwork@gmail.com\n"
            f"© 2026 Audira Digital Network. All Rights Reserved."
        )
        return template
