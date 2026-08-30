import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, accounts, settings as app_settings, videos, analytics, channels, system, scheduler, team, comments
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Create database tables
Base.metadata.create_all(bind=engine)

# 🔄 AUTOMATED 5-MINUTE BACKSTAGE AUTO-SYNC SCHEDULER
async def auto_sync_scheduler_5m():
    print("[AUTO-SYNC ENGINE]: 5-Minute Scheduler Loop Started 🚀")
    while True:
        try:
            await asyncio.sleep(300)  # Sleep 5 minutes (300s)
            from app.db.session import SessionLocal
            from app.services.sync_service import sync_account_data
            from app.models.google_account import GoogleAccount
            from app.models.youtube_channel import YoutubeChannel
            from app.models.system_setting import SystemSetting
            from app.services.telegram_service import TelegramService
            from app.services.alert_webhook import send_system_alert
            
            db = SessionLocal()
            try:
                accounts = db.query(GoogleAccount).all()
                synced_count = 0
                for acc in accounts:
                    if acc.access_token_enc:
                        await sync_account_data(db, str(acc.id))
                        synced_count += 1
                
                total_views = sum([c.view_count for c in db.query(YoutubeChannel).all()])
                total_subs = sum([c.subscriber_count for c in db.query(YoutubeChannel).all()])

                sync_time = datetime.now().strftime("%H:%M:%S WIB")
                print(f"[{sync_time}] 🔄 [AUTO-SYNC 5M SUCCESS]: Synced {synced_count} accounts & channels to PostgreSQL.")
                
                # Check if Telegram Bot is configured for real-time notifications
                token_s = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
                chat_s = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
                
                if token_s and chat_s and token_s.value and chat_s.value:
                    tg_msg = (
                        f"🔄 <b>AUDIRA YT | AUTO-SYNC 5M SUCCESS</b> 🚀\n\n"
                        f"<b>📊 Status Ringkasan Sync ({sync_time}):</b>\n"
                        f"• 🌐 <b>Akun Terproses:</b> {synced_count} Google Accounts\n"
                        f"• 👁️ <b>Total Views Channel:</b> {total_views:,}\n"
                        f"• 👥 <b>Total Subscribers:</b> {total_subs:,}\n"
                        f"• 🖥️ <b>Server Host:</b> Mini PC (192.168.100.178)\n\n"
                        f"<i>Sistem Berjalan 24/7 Tanpa Hambatan.</i>"
                    )
                    await TelegramService.send_telegram_message(token_s.value, chat_s.value, tg_msg)
                
            finally:
                db.close()
        except Exception as e:
            err_msg = f"[AUTO-SYNC SCHEDULER ERROR]: {e}"
            print(err_msg)
            try:
                from app.services.alert_webhook import send_system_alert
                await send_system_alert("Auto-Sync 5M Failed", str(e), level="ERROR")
            except Exception:
                pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start 5m auto-sync background loop
    sync_task = asyncio.create_task(auto_sync_scheduler_5m())
    yield
    # Shutdown: Cancel task cleanly
    sync_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for YouTube Intelligence Monitor with 5M Auto-Sync Scheduler",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration - Allow all origins & regex for LAN/Mini PC/Localhost deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(accounts.router, prefix=f"{settings.API_V1_STR}/accounts", tags=["accounts"])
app.include_router(app_settings.router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"])
app.include_router(videos.router, prefix=f"{settings.API_V1_STR}/videos", tags=["videos"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(channels.router, prefix=f"{settings.API_V1_STR}/channels", tags=["channels"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
app.include_router(scheduler.router, prefix=f"{settings.API_V1_STR}/scheduler", tags=["scheduler"])
app.include_router(team.router, prefix=f"{settings.API_V1_STR}/team", tags=["team"])
app.include_router(comments.router, prefix=f"{settings.API_V1_STR}/comments", tags=["comments"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to YouTube Intelligence Monitor API",
        "autoSync": "ACTIVE (EVERY 5 MINUTES 300S)"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "autoSyncScheduler": "5M_RUNNING"
    }
