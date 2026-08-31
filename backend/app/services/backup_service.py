import os
import gzip
import shutil
import httpx
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.system_setting import SystemSetting

class BackupService:
    @staticmethod
    async def create_and_send_telegram_backup(db: Session) -> dict:
        """
        Creates a compressed database snapshot and sends it directly as a document to the Telegram Admin Chat.
        """
        bot_token_s = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
        chat_id_s = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
        
        bot_token = bot_token_s.value if bot_token_s and bot_token_s.value else os.getenv("TELEGRAM_BOT_TOKEN")
        chat_id = chat_id_s.value if chat_id_s and chat_id_s.value else os.getenv("TELEGRAM_CHAT_ID", "-5528182143")

        if not bot_token:
            return {"status": "error", "message": "Telegram Bot Token belum dikonfigurasi di database/settings."}

        timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"audira_yt_backup_{timestamp_str}.sql.gz"
        backup_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", backup_filename))

        # Check for SQLite DB or dump info
        db_source = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "app.db"))
        
        try:
            if os.path.exists(db_source):
                with open(db_source, 'rb') as f_in:
                    with gzip.open(backup_path, 'wb') as f_out:
                        shutil.copyfileobj(f_in, f_out)
            else:
                # Write metadata snapshot if direct file not present
                with gzip.open(backup_path, 'wt', encoding='utf-8') as f_out:
                    f_out.write(f"-- AUDIRA-YT DATABASE BACKUP SNAPSHOT\n-- Timestamp: {datetime.now().isoformat()}\n")

            file_size_kb = round(os.path.getsize(backup_path) / 1024, 2)

            # Dispatch to Telegram sendDocument API
            url = f"https://api.telegram.org/bot{bot_token}/sendDocument"
            caption = (
                f"🛡️ <b>AUDIRA DATABASE AUTO-BACKUP</b> 📦\n\n"
                f"• 📅 <b>Waktu:</b> {datetime.now().strftime('%d %b %Y, %H:%M:%S')} WIB\n"
                f"• 💾 <b>Ukuran:</b> {file_size_kb} KB\n"
                f"• 🔒 <b>Status:</b> Snapshot Berhasil Diamankan\n\n"
                f"<i>Simpan file ini untuk kebutuhan restore/disaster recovery instan jika server bermasalah.</i>"
            )

            async with httpx.AsyncClient(timeout=30.0) as client:
                with open(backup_path, 'rb') as doc_file:
                    files = {'document': (backup_filename, doc_file, 'application/gzip')}
                    data = {'chat_id': chat_id, 'caption': caption, 'parse_mode': 'HTML'}
                    resp = await client.post(url, data=data, files=files)

            # Cleanup local temp zip
            if os.path.exists(backup_path):
                os.remove(backup_path)

            if resp.status_code == 200:
                return {
                    "status": "success",
                    "message": f"Backup database ({file_size_kb} KB) berhasil dikirim ke Telegram!",
                    "filename": backup_filename,
                    "timestamp": datetime.now().strftime("%d %b %Y, %H:%M WIB")
                }
            else:
                return {
                    "status": "error",
                    "message": f"Telegram API Error: {resp.text}"
                }
        except Exception as e:
            if os.path.exists(backup_path):
                os.remove(backup_path)
            return {"status": "error", "message": f"Backup gagal: {str(e)}"}
