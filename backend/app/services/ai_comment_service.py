import os
import random
import httpx
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting

PERSONA_TEMPLATES = {
    "CASUAL": [
        "Terima kasih banyak sudah mendengarkan dan mampir ke channel kami, kak {name}! Jangan lupa subscribe & share yaa! ❤️🔥",
        "Wah senang banget lagunya bisa menemani hari kak {name}! Stay tuned buat karya-karya terbaru dari Audira Network ya! 🎶✨",
        "Mantap jiwa kak {name}! Terima kasih atas support-nya, sukses selalu buat kita semua! 🙏💫",
        "Thanks so much support-nya kak {name}! Next lagu apa lagi nih yang asik di-cover? Tulis di komentar ya! 🎧🎸"
    ],
    "JAVANESE": [
        "Matur nuwun sanget kagem rawuh lan apresiasinipun nggih kak {name}. Mugi-mugi saget nglipur manah panjenengan sedoyo! 🙏✨",
        "Nggih matur nuwun kak {name}. Mugi tansah pinaringan berkah, kasarasan, lan rejeki ingkang barokah. Salam saking Audira Javanese! ☕🎶",
        "Matur sembah nuwun support-ipun kak {name}. Sampun kesupen dipun-subscribe supados mboten ketinggalan lagu-lagu tembang lawas ingkang syahdu! 🌸💫"
    ],
    "FRIENDLY_HOST": [
        "Halo sahabat Audira ({name})! Senang sekali karyaku bisa sampai di telingamu. Dukung terus musisi lokal Indonesia ya! 🇮🇩❤️",
        "Terima kasih apresiasinya, sahabat musik {name}! Bagikan video ini ke teman-temanmu agar kita bisa terus berkarya! 🌟🎼"
    ],
    "FORMAL": [
        "Terima kasih atas apresiasi dan kunjungan Bapak/Ibu {name} pada kanal resmi Audira Digital Network. Kami berkomitmen untuk terus menyajikan karya musik berkualitas tinggi.",
        "Apresiasi Anda sangat berharga bagi perkembangan musisi dan industri kreatif Indonesia. Terima kasih, {name}."
    ]
}

class AICommentService:
    @staticmethod
    async def generate_smart_reply(
        db: Session,
        comment_text: str,
        author_name: str = "Sahabat Audira",
        video_title: str = "Video Musik",
        persona: str = "CASUAL"
    ) -> str:
        """
        Generate contextual AI reply using Gemini API if key is present, otherwise intelligent persona template.
        """
        gemini_setting = db.query(SystemSetting).filter(SystemSetting.key == "GEMINI_API_KEY").first()
        api_key = gemini_setting.value if gemini_setting and gemini_setting.value and gemini_setting.value != "your_gemini_api_key_here" else os.getenv("GEMINI_API_KEY")

        clean_name = author_name.split()[0] if author_name else "Kak"

        if api_key:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                prompt = (
                    f"Anda adalah admin channel YouTube musik profesional 'Audira Network'.\n"
                    f"Persona gaya bahasa: {persona} (CASUAL = santai & ramah, JAVANESE = bahasa Jawa halus/sopan, FRIENDLY_HOST = hangat bersahabat, FORMAL = baku profesional).\n"
                    f"Nama penonton: {clean_name}\n"
                    f"Judul lagu/video: '{video_title}'\n"
                    f"Komentar penonton: \"{comment_text}\"\n\n"
                    f"Tuliskan balasan komentar yang hangat, ramah, menarik, relevan dengan komentar penonton, maksimal 2 kalimat, dan sertakan 1-2 emoji yang sesuai."
                )
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"maxOutputTokens": 100, "temperature": 0.7}
                    })
                    if resp.status_code == 200:
                        json_data = resp.json()
                        candidates = json_data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()
            except Exception as e:
                print(f"[AI Comment Service Gemini Error]: {e}")

        # Fallback to intelligent persona template
        templates = PERSONA_TEMPLATES.get(persona.upper(), PERSONA_TEMPLATES["CASUAL"])
        chosen = random.choice(templates)
        return chosen.format(name=clean_name)
