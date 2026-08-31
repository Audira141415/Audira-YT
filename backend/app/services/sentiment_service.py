import re
import html
import asyncio
import os
from datetime import datetime
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting
from app.services.telegram_service import TelegramService

SPAM_PATTERNS = [
    r't\.me\/', r'telegram\.me\/', r'wa\.me\/', r'whatsapp\.com', 
    r'bit\.ly\/', r'slot', r'gacor', r'maxwin', r'deposit', 
    r'crypto bonus', r'investasi profit', r'hubungi wa', r'dm saya'
]

NEGATIVE_KEYWORDS = [
    'kecewa', 'jelek', 'sampah', 'buruk', 'unsub', 'unfollow', 'palsu', 
    'hoax', 'clickbait', 'bohong', 'rusak', 'benci', 'parah', 'penipu', 'cacat'
]

POSITIVE_KEYWORDS = [
    'keren', 'mantap', 'bagus', 'suka', 'terbaik', 'enak', 'candu', 
    'juara', 'sukses', 'top', 'mantul', 'adem', 'love', 'jos', 'hebat', 'asik'
]

class SentimentService:
    @staticmethod
    def analyze_comment(text: str) -> Dict[str, Any]:
        lower_text = text.lower()
        
        # Check spam
        is_spam = False
        spam_reason = None
        for pattern in SPAM_PATTERNS:
            if re.search(pattern, lower_text):
                is_spam = True
                spam_reason = f"Keyword / Link pattern matched: '{pattern}'"
                break
                
        # Calculate sentiment score
        pos_count = sum(1 for kw in POSITIVE_KEYWORDS if kw in lower_text)
        neg_count = sum(1 for kw in NEGATIVE_KEYWORDS if kw in lower_text)

        if is_spam:
            sentiment = "SPAM"
        elif neg_count > pos_count:
            sentiment = "NEGATIVE"
        elif pos_count > neg_count:
            sentiment = "POSITIVE"
        else:
            sentiment = "NEUTRAL"

        return {
            "sentiment": sentiment,
            "is_spam": is_spam,
            "spam_reason": spam_reason,
            "pos_score": pos_count,
            "neg_score": neg_count
        }

    @staticmethod
    async def evaluate_video_comments_and_alert(
        db: Session, 
        channel_name: str, 
        video_title: str, 
        video_id: str, 
        comments: List[str]
    ) -> Dict[str, Any]:
        """
        Evaluates a batch of recent comments for a video and triggers instant Telegram alerts if spam or negative spikes are detected.
        """
        if not comments:
            return {"status": "skipped", "total": 0}

        spam_count = 0
        neg_count = 0
        pos_count = 0

        for c in comments:
            analysis = SentimentService.analyze_comment(c)
            if analysis["is_spam"]:
                spam_count += 1
            elif analysis["sentiment"] == "NEGATIVE":
                neg_count += 1
            elif analysis["sentiment"] == "POSITIVE":
                pos_count += 1

        total = len(comments)
        spam_pct = round((spam_count / total) * 100, 1)
        neg_pct = round((neg_count / total) * 100, 1)

        bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
        chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
        tg_token = bot_token_setting.value if bot_token_setting and bot_token_setting.value else os.getenv("TELEGRAM_BOT_TOKEN")
        tg_chat = chat_id_setting.value if chat_id_setting and chat_id_setting.value else os.getenv("TELEGRAM_CHAT_ID")

        # 🚨 Alert 1: Spam Attack Alert (e.g. > 3 spam comments or > 30% spam)
        if (spam_count >= 3 or spam_pct >= 30) and tg_token and tg_chat:
            safe_ch = html.escape(str(channel_name))
            safe_title = html.escape(str(video_title))
            spam_alert = (
                f"🚨 <b>AUDIRA AI SHIELD</b> | <b>SERANGAN SPAM BOT TERDETEKSI!</b> 🤖⚠️\n\n"
                f"<b>📺 CHANNEL & VIDEO:</b>\n"
                f"• <b>Channel:</b> {safe_ch}\n"
                f"• <b>Judul:</b> {safe_title}\n"
                f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={video_id}\">Buka Kolom Komentar 💬</a>\n\n"
                f"<b>📊 DETEKSI ANOMALI KOMENTAR:</b>\n"
                f"• 🚫 <b>Komentar Spam:</b> {spam_count} dari {total} komentar ({spam_pct}%)\n"
                f"• 🔍 <b>Pola Spam:</b> Link Telegram Liar / Bot Promosi Crypto & Judi\n\n"
                f"<b>💡 REKOMENDASI TINDAKAN:</b>\n"
                f"<i>Disarankan segera buka YouTube Studio dan aktifkan filter 'Tahan komentar berpotensi spam untuk ditinjau'.</i>\n\n"
                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
            )
            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, spam_alert))

        # ⚠️ Alert 2: Negative Sentiment Spike (> 40% negative)
        elif neg_count >= 4 and neg_pct >= 40 and tg_token and tg_chat:
            safe_ch = html.escape(str(channel_name))
            safe_title = html.escape(str(video_title))
            neg_alert = (
                f"⚠️ <b>AUDIRA AI SHIELD</b> | <b>LONJAKAN SENTIMEN NEGATIF!</b> 📉\n\n"
                f"<b>📺 CHANNEL & VIDEO:</b>\n"
                f"• <b>Channel:</b> {safe_ch}\n"
                f"• <b>Judul:</b> {safe_title}\n"
                f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={video_id}\">Buka Komentar 💬</a>\n\n"
                f"<b>📊 SENTIMEN AUDIENS:</b>\n"
                f"• 👎 <b>Sentimen Negatif:</b> {neg_count} Komentar ({neg_pct}%)\n"
                f"• 👍 <b>Sentimen Positif:</b> {pos_count} Komentar\n\n"
                f"<b>💡 SARAN AI:</b>\n"
                f"<i>Periksa feedback audiens di kolom komentar. Respons komentar teratas dengan ramah untuk meredakan komplain.</i>\n\n"
                f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
            )
            asyncio.create_task(TelegramService.send_telegram_message(tg_token, tg_chat, neg_alert))

        return {
            "status": "success",
            "total_comments": total,
            "spam_count": spam_count,
            "neg_count": neg_count,
            "pos_count": pos_count
        }
