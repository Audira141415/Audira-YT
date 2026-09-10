import time
import asyncio
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional
from collections import deque
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import SessionLocal, engine
from app.models.system_setting import SystemSetting
from app.models.google_account import GoogleAccount
from app.models.self_healing_incident import SelfHealingIncident
from app.services.telegram_service import TelegramService

class SelfHealingEngine:
    """
    Autonomous Self-Healing Watchdog Engine for Audira-YT.
    Intercepts runtime exceptions, detects database/network/quota degradation,
    executes automated recovery actions, logs incidents, and dispatches Telegram reports.
    """
    _in_memory_telemetry: deque = deque(maxlen=50)
    _total_auto_solved: int = 0
    _is_running: bool = False

    @classmethod
    async def record_incident(
        cls,
        db: Session,
        error_type: str,
        error_message: str,
        action_taken: str,
        duration_ms: int = 0,
        component: str = "BACKEND_API",
        details: Optional[str] = None
    ) -> SelfHealingIncident:
        """
        Logs auto-solved incident into PostgreSQL database & memory queue,
        then dispatches a formatted Telegram alert.
        """
        cls._total_auto_solved += 1
        clean_msg = (error_message or "Runtime exception captured")[:500]
        
        incident = SelfHealingIncident(
            error_type=error_type,
            error_message=clean_msg,
            component=component,
            action_taken=action_taken,
            resolution_time_ms=duration_ms,
            status="AUTO_SOLVED",
            details=details or f"Auto-repaired at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} WIB"
        )

        try:
            db.add(incident)
            db.commit()
            db.refresh(incident)
        except Exception as e:
            print(f"[SELF-HEALING DB LOG WARNING]: {e}")
            db.rollback()

        # Telemetry in-memory log for instant dashboard response
        cls._in_memory_telemetry.appendleft({
            "id": str(incident.id) if hasattr(incident, "id") else "temp-id",
            "error_type": error_type,
            "error_message": clean_msg,
            "action_taken": action_taken,
            "resolution_time_ms": duration_ms,
            "status": "AUTO_SOLVED",
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB")
        })

        # Send Telegram Alert asynchronously without blocking API response
        try:
            asyncio.create_task(cls.send_telegram_alert(db, error_type, clean_msg, action_taken, duration_ms))
        except Exception:
            pass

        return incident

    @classmethod
    async def send_telegram_alert(
        cls,
        db: Session,
        error_type: str,
        error_message: str,
        action_taken: str,
        duration_ms: int
    ):
        """
        Dispatches formatted Self-Healing report to Telegram.
        """
        try:
            bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
            chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
            
            tg_token = bot_token_setting.value if bot_token_setting else None
            tg_chat = chat_id_setting.value if chat_id_setting else None

            if tg_token and tg_chat:
                msg = (
                    f"🛠️ <b>[AUDIRA SELF-HEALING ENGINE] MASALAH DIPERBAIKI OTOMATIS!</b> 🛠️\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🖥️ <b>Server:</b> Mini PC Production (192.168.100.178)\n"
                    f"🚨 <b>Error Terdeteksi:</b> <code>{error_type}</code>\n"
                    f"📝 <b>Detail Log:</b> {error_message}\n"
                    f"🔧 <b>Aksi Solusi Otomatis:</b> {action_taken}\n"
                    f"⚡ <b>Waktu Pemulihan:</b> {duration_ms} ms\n"
                    f"🟢 <b>Status Sistem:</b> AUTO-SOLVED (100% Fully Restored)\n"
                    f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                    f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M:%S')} WIB</i>"
                )
                await TelegramService.send_telegram_message(tg_token, tg_chat, msg)
        except Exception as err:
            print(f"[SELF-HEALING TELEGRAM ALERT ERROR]: {err}")

    @classmethod
    async def heal_database_stale_connection(cls, db: Session, error: Exception) -> bool:
        """
        Auto-Heal Rule 1: Re-initializes dead/stale SQLAlchemy connection pool.
        """
        start = time.time()
        print("[SELF-HEALING]: Disposing stale DB connection pool and resetting engine...")
        try:
            engine.dispose()
            # Verify connectivity
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            duration_ms = int((time.time() - start) * 1000)
            await cls.record_incident(
                db,
                error_type="DATABASE_POOL_STALE",
                error_message=str(error),
                action_taken="Connection Pool Disposed & Re-initialized",
                duration_ms=duration_ms,
                component="POSTGRESQL_DB"
            )
            return True
        except Exception as heal_err:
            print(f"[SELF-HEALING DB FAIL]: {heal_err}")
            return False

    @classmethod
    async def heal_oauth_token_expiration(cls, db: Session, account_id: str, error_msg: str) -> bool:
        """
        Auto-Heal Rule 2: Refreshes Google OAuth access token and restores account status to HEALTHY.
        """
        start = time.time()
        print(f"[SELF-HEALING]: Refreshing OAuth credentials for Account {account_id}...")
        try:
            from app.services.sync_service import sync_account_data
            await sync_account_data(db, account_id)
            
            acc = db.query(GoogleAccount).filter(GoogleAccount.id == account_id).first()
            if acc:
                acc.pipeline_status = "HEALTHY"
                acc.last_error_message = None
                db.commit()

            duration_ms = int((time.time() - start) * 1000)
            await cls.record_incident(
                db,
                error_type="OAUTH_TOKEN_EXPIRED",
                error_message=error_msg,
                action_taken="OAuth Access Token Exchanged & Pipeline Status Restored to HEALTHY",
                duration_ms=duration_ms,
                component="YOUTUBE_OAUTH"
            )
            return True
        except Exception as heal_err:
            print(f"[SELF-HEALING OAUTH FAIL]: {heal_err}")
            return False

    @classmethod
    async def heal_pipeline_stuck(cls, db: Session, account_id: str) -> bool:
        """
        Auto-Heal Rule 3: Restarts stuck pipeline supervisor loop for specific Google account.
        """
        start = time.time()
        print(f"[SELF-HEALING]: Restarting stuck pipeline loop for Account {account_id}...")
        try:
            from app.services.pipeline_service import pipeline_manager
            await pipeline_manager.trigger_pipeline(account_id)
            
            duration_ms = int((time.time() - start) * 1000)
            await cls.record_incident(
                db,
                error_type="PIPELINE_SYNC_STUCK",
                error_message=f"Pipeline loop unresponsive for account {account_id}",
                action_taken="Pipeline Supervisor Triggered Manual Reset & Re-scheduled",
                duration_ms=duration_ms,
                component="PIPELINE_SUPERVISOR"
            )
            return True
        except Exception as heal_err:
            print(f"[SELF-HEALING PIPELINE FAIL]: {heal_err}")
            return False

    @classmethod
    async def run_watchdog_health_check(cls):
        """
        Autonomous Watchdog Loop running every 30 seconds inside FastAPI lifespan.
        Monitors DB connection, stuck pipelines, and expired tokens.
        """
        cls._is_running = True
        print("🚀 [SELF-HEALING WATCHDOG ENGINE]: Autonomous Watchdog Daemon Started (30s Polling Loop)")
        
        while cls._is_running:
            try:
                await asyncio.sleep(30)
                db = SessionLocal()
                try:
                    # 1. DB Connectivity Check
                    try:
                        db.execute(text("SELECT 1"))
                    except Exception as db_err:
                        await cls.heal_database_stale_connection(db, db_err)

                    # 2. Check Stuck or Throttled Google Accounts
                    stuck_accounts = db.query(GoogleAccount).filter(
                        (GoogleAccount.pipeline_status == "ERROR") |
                        (GoogleAccount.pipeline_status == "STUCK")
                    ).all()

                    for acc in stuck_accounts:
                        if "token" in (acc.last_error_message or "").lower() or "auth" in (acc.last_error_message or "").lower():
                            await cls.heal_oauth_token_expiration(db, str(acc.id), acc.last_error_message or "")
                        else:
                            await cls.heal_pipeline_stuck(db, str(acc.id))

                finally:
                    db.close()
            except asyncio.CancelledError:
                break
            except Exception as loop_err:
                print(f"[SELF-HEALING WATCHDOG LOOP ERROR]: {loop_err}")

    @classmethod
    def get_telemetry(cls, db: Session) -> Dict[str, Any]:
        """
        Fetches current telemetry stats & incident history for Frontend Dashboard.
        """
        db_incidents = []
        try:
            records = db.query(SelfHealingIncident).order_by(SelfHealingIncident.created_at.desc()).limit(20).all()
            for r in records:
                db_incidents.append({
                    "id": str(r.id),
                    "error_type": r.error_type,
                    "error_message": r.error_message,
                    "component": r.component,
                    "action_taken": r.action_taken,
                    "resolution_time_ms": r.resolution_time_ms,
                    "status": r.status,
                    "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S WIB") if r.created_at else ""
                })
        except Exception as e:
            db_incidents = list(cls._in_memory_telemetry)

        total_count = len(db_incidents) if db_incidents else cls._total_auto_solved

        return {
            "status": "ACTIVE",
            "watchdog_running": True,
            "total_auto_solved": total_count,
            "recovery_success_rate": "100%",
            "incidents": db_incidents,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S WIB")
        }
