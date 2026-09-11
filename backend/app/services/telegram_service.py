import asyncio
import time
import httpx
import re
from typing import Dict, Any, Optional

class TelegramService:
    _send_lock: Optional[asyncio.Lock] = None
    _last_send_time: float = 0.0

    @classmethod
    def _get_lock(cls) -> asyncio.Lock:
        if cls._send_lock is None:
            cls._send_lock = asyncio.Lock()
        return cls._send_lock

    @classmethod
    async def send_telegram_message(
        cls,
        bot_token: str, 
        chat_id: str, 
        message: str
    ) -> Dict[str, Any]:
        """
        Send a real-time notification to Telegram via Bot API with rate-limiting lock and 429 retry backoff.
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

        safe_log = message[:120].encode("ascii", "replace").decode("ascii")
        print(f"[TELEGRAM SENDING TO {chat_clean}]: {safe_log}...")

        lock = cls._get_lock()
        async with lock:
            # Enforce 1.1s minimum delay between consecutive calls to comply with Telegram API rate limits (1 msg/sec per chat)
            now = time.time()
            elapsed = now - cls._last_send_time
            if elapsed < 1.1:
                await asyncio.sleep(1.1 - elapsed)

            max_retries = 3
            for attempt in range(max_retries):
                try:
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(url, json=payload)
                        cls._last_send_time = time.time()

                        if resp.status_code == 200:
                            print(f"[TELEGRAM SUCCESS]: Message successfully delivered to Chat ID {chat_clean}")
                            return {"status": "success", "message": "Pemberitahuan Telegram berhasil dikirim!"}

                        err_data = {}
                        try:
                            err_data = resp.json()
                            err_desc = err_data.get('description', resp.text)
                        except Exception:
                            err_desc = resp.text

                        # Handle 429 Too Many Requests (Rate Limit)
                        if resp.status_code == 429:
                            parameters = err_data.get("parameters", {})
                            retry_after = parameters.get("retry_after", 3)
                            print(f"[TELEGRAM 429 RATE LIMIT]: Waiting {retry_after} seconds before retry (Attempt {attempt+1}/{max_retries})...")
                            await asyncio.sleep(retry_after + 0.5)
                            continue

                        print(f"[TELEGRAM API ERROR {resp.status_code}]: {err_desc}")

                        # Fallback retry without HTML formatting if Telegram HTML entities parser failed
                        if "parse" in err_desc.lower() or "entity" in err_desc.lower() or "tag" in err_desc.lower():
                            clean_text = re.sub(r'<[^>]*>', '', message)
                            plain_payload = {
                                "chat_id": chat_clean,
                                "text": clean_text
                            }
                            retry_resp = await client.post(url, json=plain_payload)
                            cls._last_send_time = time.time()
                            if retry_resp.status_code == 200:
                                print(f"[TELEGRAM FALLBACK SUCCESS]: Plain text message delivered to Chat ID {chat_clean}")
                                return {"status": "success", "message": "Pemberitahuan Telegram (Plain Text) berhasil dikirim!"}

                        return {"status": "error", "message": f"Telegram API Error ({resp.status_code}): {err_desc}"}
                except Exception as e:
                    print(f"[TELEGRAM CONNECTION EXCEPTION]: {e}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2.0)
                        continue
                    return {"status": "error", "message": f"Koneksi Telegram Gagal: {str(e)}"}

        return {"status": "error", "message": "Gagal mengirim pesan Telegram setelah beberapa percobaan."}


