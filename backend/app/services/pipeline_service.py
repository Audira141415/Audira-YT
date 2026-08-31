import asyncio
import random
import time
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.google_account import GoogleAccount
from app.models.oauth_credential import OAuthCredential
from app.models.system_setting import SystemSetting
from app.services.telegram_service import TelegramService
from app.core.websocket_manager import manager as ws_manager

class AccountPipeline:
    """
    Isolated execution pipeline for a single Google Account.
    Ensures per-account fault isolation, dedicated quota tracking, and organic jitter.
    """
    def __init__(self, account_id: str, email: str, sync_interval: int = 60, is_enabled: bool = True):
        self.account_id = str(account_id)
        self.email = email
        self.sync_interval = sync_interval or 60
        self.is_enabled = is_enabled
        self.is_paused = not is_enabled
        
        self.status = "HEALTHY" if is_enabled else "PAUSED" # HEALTHY, SYNCING, THROTTLED, ERROR, PAUSED
        self.last_sync_at: Optional[datetime] = None
        self.last_duration_ms: int = 0
        self.last_error: Optional[str] = None
        self.consecutive_errors: int = 0
        self.quota_used: int = 0
        self.quota_limit: int = 10000
        
        # Organic jitter offset (0-15s based on account_id hash to avoid burst traffic)
        self.jitter_offset = (abs(hash(self.account_id)) % 13) + 2
        self.task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

    def start(self):
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self._run_loop(), name=f"pipe-{self.account_id[:8]}")
            print(f"[ACCOUNT PIPELINE]: Started isolated pipe for {self.email} (Interval: {self.sync_interval}s, Jitter: +{self.jitter_offset}s)")

    def stop(self):
        if self.task and not self.task.done():
            self.task.cancel()
            self.task = None
            print(f"[ACCOUNT PIPELINE]: Stopped pipe for {self.email}")

    async def trigger_now(self) -> dict:
        """
        Manually trigger an immediate isolated sync execution.
        """
        async with self._lock:
            return await self._execute_sync(is_manual=True)

    async def _execute_sync(self, is_manual: bool = False) -> dict:
        from app.services.sync_service import sync_account_data

        t0 = time.time()
        prev_status = self.status
        self.status = "SYNCING"
        
        # Broadcast state to frontend
        await self._broadcast_telemetry()

        db = SessionLocal()
        try:
            acc = db.query(GoogleAccount).filter(GoogleAccount.id == uuid.UUID(self.account_id)).first()
            if not acc:
                self.status = "ERROR"
                self.last_error = "Account not found in database"
                return {"status": "error", "message": self.last_error}

            # Run sync
            result = await sync_account_data(db, self.account_id)
            duration_ms = int((time.time() - t0) * 1000)

            self.last_sync_at = datetime.now()
            self.last_duration_ms = duration_ms
            self.last_error = None
            self.consecutive_errors = 0
            self.status = "HEALTHY" if self.is_enabled else "PAUSED"

            # Update DB record
            acc.pipeline_status = self.status
            acc.last_sync_duration_ms = duration_ms
            acc.last_error_message = None
            acc.quota_used_today = (acc.quota_used_today or 0) + (result.get("synced_videos", 1) * 2)
            db.commit()

            print(f"[PIPELINE SUCCESS {self.email}]: Synced in {duration_ms}ms (Channels: {result.get('synced_channels', 0)}, Videos: {result.get('synced_videos', 0)})")
            
            await self._broadcast_telemetry()
            return {
                "status": "success",
                "duration_ms": duration_ms,
                "data": result,
                "is_manual": is_manual
            }

        except Exception as e:
            duration_ms = int((time.time() - t0) * 1000)
            err_str = str(e).strip() or repr(e) or type(e).__name__
            self.last_duration_ms = duration_ms
            self.last_error = err_str
            self.consecutive_errors += 1

            if "403" in err_str or "quota" in err_str.lower():
                self.status = "THROTTLED"
            else:
                self.status = "ERROR"

            print(f"[PIPELINE ERROR {self.email}]: {err_str}")

            try:
                acc = db.query(GoogleAccount).filter(GoogleAccount.id == uuid.UUID(self.account_id)).first()
                if acc:
                    acc.pipeline_status = self.status
                    acc.last_error_message = err_str
                    acc.last_sync_duration_ms = duration_ms
                    db.commit()
            except Exception:
                pass

            # Dispatch Telegram Warning on persistent failure (3 consecutive errors)
            if self.consecutive_errors in [3, 10, 25]:
                await self._notify_pipe_failure(err_str)

            await self._broadcast_telemetry()
            return {"status": "error", "message": err_str, "duration_ms": duration_ms}
        finally:
            db.close()

    async def _run_loop(self):
        """
        Isolated infinite loop for this specific account pipeline.
        """
        # Initial stagger jitter on boot
        boot_delay = random.uniform(1.0, 8.0) + self.jitter_offset
        await asyncio.sleep(boot_delay)

        while True:
            try:
                if not self.is_paused and self.is_enabled:
                    async with self._lock:
                        await self._execute_sync(is_manual=False)

                # Compute next sleep interval with organic jitter
                base_interval = max(15, self.sync_interval)
                jitter = random.randint(-3, 3) + self.jitter_offset
                sleep_sec = max(10, base_interval + jitter)

                # If in error backoff state, wait longer
                if self.consecutive_errors > 0:
                    sleep_sec = min(300, sleep_sec + (self.consecutive_errors * 20))

                await asyncio.sleep(sleep_sec)

            except asyncio.CancelledError:
                print(f"[PIPELINE]: Pipe loop cancelled for {self.email}")
                break
            except Exception as loop_err:
                print(f"[PIPELINE UNHANDLED LOOP ERROR {self.email}]: {loop_err}")
                await asyncio.sleep(30)

    async def _broadcast_telemetry(self):
        try:
            await ws_manager.broadcast({
                "type": "PIPELINE_TELEMETRY",
                "account_id": self.account_id,
                "email": self.email,
                "status": self.status,
                "last_sync": self.last_sync_at.strftime("%H:%M:%S WIB") if self.last_sync_at else "Never",
                "duration_ms": self.last_duration_ms,
                "last_error": self.last_error,
                "sync_interval": self.sync_interval
            })
        except Exception:
            pass

    async def _notify_pipe_failure(self, err_msg: str):
        db = SessionLocal()
        try:
            bot_token = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
            chat_id = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
            if bot_token and bot_token.value and chat_id and chat_id.value:
                msg = (
                    f"⚠️ <b>AUDIRA PIPELINE ALERT</b> | <b>GANGGUAN PIPA AKUN!</b> ⚠️\n\n"
                    f"<b>📧 AKUN GOOGLE:</b> <code>{self.email}</code>\n"
                    f"• 🚨 <b>Status:</b> <b>{self.status}</b>\n"
                    f"• ⏱️ <b>Durasi Terakhir:</b> {self.last_duration_ms} ms\n"
                    f"• ❌ <b>Error:</b> <code>{err_msg[:200]}</code>\n\n"
                    f"<b>💡 ISOLASI AKTIF:</b>\n"
                    f"<i>Pipa akun lain tetap berjalan normal. Sistem akan mencoba kembali secara otomatis dengan backoff retry.</i>\n\n"
                    f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M:%S')} WIB</i>"
                )
                await TelegramService.send_telegram_message(bot_token.value, chat_id.value, msg)
        except Exception as e:
            print(f"[PIPELINE TELEGRAM ALERT ERROR]: {e}")
        finally:
            db.close()

class AccountPipelineManager:
    """
    Global Manager for all account pipelines.
    Supervises creation, destruction, pause/resume, and telemetry of isolated pipes.
    """
    _instance: Optional['AccountPipelineManager'] = None

    def __init__(self):
        self.pipelines: Dict[str, AccountPipeline] = {}
        self.supervisor_task: Optional[asyncio.Task] = None
        self._is_running = False

    @classmethod
    def get_instance(cls) -> 'AccountPipelineManager':
        if cls._instance is None:
            cls._instance = AccountPipelineManager()
        return cls._instance

    async def start_all(self):
        """
        Starts the supervisor and initializes pipelines for all registered Google Accounts.
        """
        if self._is_running:
            return
        self._is_running = True
        self.supervisor_task = asyncio.create_task(self._supervisor_loop(), name="pipeline-supervisor")
        print("🚀 [ACCOUNT PIPELINE MANAGER]: Global Pipeline Supervisor started!")

    async def stop_all(self):
        """
        Stops all pipelines cleanly on application shutdown.
        """
        self._is_running = False
        if self.supervisor_task and not self.supervisor_task.done():
            self.supervisor_task.cancel()

        for pipe in list(self.pipelines.values()):
            pipe.stop()
        self.pipelines.clear()
        print("🛑 [ACCOUNT PIPELINE MANAGER]: All account pipelines stopped cleanly.")

    async def _supervisor_loop(self):
        """
        Periodically checks database for new accounts or configuration changes.
        """
        while self._is_running:
            try:
                db = SessionLocal()
                try:
                    accounts = db.query(GoogleAccount).all()
                    current_ids = {str(a.id) for a in accounts}

                    # Remove stale pipelines
                    for aid in list(self.pipelines.keys()):
                        if aid not in current_ids:
                            self.pipelines[aid].stop()
                            del self.pipelines[aid]

                    # Add or update pipelines
                    for acc in accounts:
                        aid = str(acc.id)
                        is_enabled = getattr(acc, 'pipeline_enabled', True)
                        if is_enabled is None:
                            is_enabled = True
                        interval = getattr(acc, 'sync_interval_seconds', 60) or 60

                        if aid not in self.pipelines:
                            pipe = AccountPipeline(
                                account_id=aid,
                                email=acc.email,
                                sync_interval=interval,
                                is_enabled=is_enabled
                            )
                            self.pipelines[aid] = pipe
                            pipe.start()
                        else:
                            # Update parameters if changed
                            pipe = self.pipelines[aid]
                            pipe.sync_interval = interval
                            pipe.is_enabled = is_enabled
                            pipe.is_paused = not is_enabled
                finally:
                    db.close()

                await asyncio.sleep(20) # Check DB every 20s
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[PIPELINE SUPERVISOR ERROR]: {e}")
                await asyncio.sleep(30)

    async def trigger_pipeline(self, account_id: str) -> dict:
        aid = str(account_id)
        if aid in self.pipelines:
            return await self.pipelines[aid].trigger_now()
        
        # If not yet registered in manager, create temporary run
        pipe = AccountPipeline(account_id=aid, email="Unknown", sync_interval=60)
        self.pipelines[aid] = pipe
        pipe.start()
        return await pipe.trigger_now()

    async def toggle_pipeline(self, account_id: str, enable: Optional[bool] = None) -> dict:
        aid = str(account_id)
        db = SessionLocal()
        try:
            acc = db.query(GoogleAccount).filter(GoogleAccount.id == uuid.UUID(aid)).first()
            if not acc:
                return {"status": "error", "message": "Account not found"}

            new_state = (not acc.pipeline_enabled) if enable is None else enable
            acc.pipeline_enabled = new_state
            acc.pipeline_status = "HEALTHY" if new_state else "PAUSED"
            db.commit()

            if aid in self.pipelines:
                pipe = self.pipelines[aid]
                pipe.is_enabled = new_state
                pipe.is_paused = not new_state
                pipe.status = acc.pipeline_status

            return {
                "status": "success",
                "account_id": aid,
                "pipeline_enabled": new_state,
                "pipeline_status": acc.pipeline_status
            }
        finally:
            db.close()

    async def update_pipeline_config(
        self, 
        account_id: str, 
        sync_interval: Optional[int] = None, 
        oauth_credential_id: Optional[str] = None
    ) -> dict:
        aid = str(account_id)
        db = SessionLocal()
        try:
            acc = db.query(GoogleAccount).filter(GoogleAccount.id == uuid.UUID(aid)).first()
            if not acc:
                return {"status": "error", "message": "Account not found"}

            if sync_interval is not None and sync_interval >= 15:
                acc.sync_interval_seconds = sync_interval
                if aid in self.pipelines:
                    self.pipelines[aid].sync_interval = sync_interval

            if oauth_credential_id is not None:
                if oauth_credential_id == "" or oauth_credential_id == "NONE":
                    acc.oauth_credential_id = None
                else:
                    try:
                        acc.oauth_credential_id = uuid.UUID(oauth_credential_id)
                    except Exception:
                        pass

            db.commit()

            return {
                "status": "success",
                "account_id": aid,
                "sync_interval_seconds": acc.sync_interval_seconds,
                "oauth_credential_id": str(acc.oauth_credential_id) if acc.oauth_credential_id else None
            }
        finally:
            db.close()

    def get_telemetry(self, db: Session) -> List[dict]:
        accounts = db.query(GoogleAccount).all()
        telemetry = []

        for acc in accounts:
            aid = str(acc.id)
            pipe = self.pipelines.get(aid)

            status = pipe.status if pipe else (acc.pipeline_status or "HEALTHY")
            duration_ms = pipe.last_duration_ms if pipe else (acc.last_sync_duration_ms or 0)
            last_err = pipe.last_error if pipe else acc.last_error_message
            interval = pipe.sync_interval if pipe else (acc.sync_interval_seconds or 60)
            jitter = pipe.jitter_offset if pipe else (acc.jitter_offset_seconds or 0)
            is_enabled = pipe.is_enabled if pipe else (acc.pipeline_enabled if acc.pipeline_enabled is not None else True)

            # Bound OAuth credential info
            cred_info = None
            if acc.oauth_credential:
                cred_info = {
                    "id": str(acc.oauth_credential.id),
                    "name": acc.oauth_credential.name,
                    "client_id": acc.oauth_credential.client_id[:16] + "..." if acc.oauth_credential.client_id else "N/A"
                }

            telemetry.append({
                "account_id": aid,
                "email": acc.email,
                "status": status,
                "is_enabled": is_enabled,
                "sync_interval_seconds": interval,
                "jitter_seconds": jitter,
                "last_sync": acc.last_sync.strftime("%b %d, %Y %H:%M:%S") if acc.last_sync else "Never",
                "last_sync_duration_ms": duration_ms,
                "quota_used_today": acc.quota_used_today or 0,
                "quota_limit_daily": acc.quota_limit_daily or 10000,
                "last_error": last_err,
                "channels_count": len(acc.youtube_channels) if acc.youtube_channels else 0,
                "oauth_credential": cred_info
            })

        return telemetry

pipeline_manager = AccountPipelineManager.get_instance()
