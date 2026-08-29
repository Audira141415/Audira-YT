import httpx
from typing import Dict, Any, Optional

class TelegramService:
    @staticmethod
    async def send_telegram_message(
        bot_token: str, 
        chat_id: str, 
        message: str
    ) -> Dict[str, Any]:
        """
        Send a real-time Markdown-formatted notification to Telegram via Bot API.
        """
        if not bot_token or not chat_id:
            return {"status": "error", "message": "Bot Token dan Chat ID Telegram wajib diisi!"}

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": False
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    return {"status": "success", "message": "Pemberitahuan Telegram berhasil dikirim!"}
                else:
                    err_data = resp.json()
                    return {"status": "error", "message": f"Telegram API Error: {err_data.get('description', resp.text)}"}
        except Exception as e:
            return {"status": "error", "message": f"Koneksi Telegram Gagal: {str(e)}"}
