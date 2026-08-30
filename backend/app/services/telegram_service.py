import httpx
import re
from typing import Dict, Any, Optional

class TelegramService:
    @staticmethod
    async def send_telegram_message(
        bot_token: str, 
        chat_id: str, 
        message: str
    ) -> Dict[str, Any]:
        """
        Send a real-time notification to Telegram via Bot API with robust error handling and fallback.
        """
        if not bot_token or not chat_id:
            print("[TELEGRAM ERROR]: Bot Token or Chat ID missing.")
            return {"status": "error", "message": "Bot Token dan Chat ID Telegram wajib diisi!"}

        token_clean = bot_token.strip()
        chat_clean = chat_id.strip()

        url = f"https://api.telegram.org/bot{token_clean}/sendMessage"
        payload = {
            "chat_id": chat_clean,
            "text": message,
            "parse_mode": "HTML",
            "disable_web_page_preview": False
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    print(f"[TELEGRAM SUCCESS]: Message successfully delivered to Chat ID {chat_clean}")
                    return {"status": "success", "message": "Pemberitahuan Telegram berhasil dikirim!"}
                else:
                    try:
                        err_data = resp.json()
                        err_desc = err_data.get('description', resp.text)
                    except Exception:
                        err_desc = resp.text

                    print(f"[TELEGRAM API ERROR {resp.status_code}]: {err_desc}")

                    # Fallback retry without HTML formatting if Telegram HTML entities parser failed
                    if "parse" in err_desc.lower() or "entity" in err_desc.lower() or "tag" in err_desc.lower():
                        clean_text = re.sub(r'<[^>]*>', '', message)
                        plain_payload = {
                            "chat_id": chat_clean,
                            "text": clean_text
                        }
                        retry_resp = await client.post(url, json=plain_payload)
                        if retry_resp.status_code == 200:
                            print(f"[TELEGRAM FALLBACK SUCCESS]: Plain text message delivered to Chat ID {chat_clean}")
                            return {"status": "success", "message": "Pemberitahuan Telegram (Plain Text) berhasil dikirim!"}

                    return {"status": "error", "message": f"Telegram API Error ({resp.status_code}): {err_desc}"}
        except Exception as e:
            print(f"[TELEGRAM CONNECTION EXCEPTION]: {e}")
            return {"status": "error", "message": f"Koneksi Telegram Gagal: {str(e)}"}

