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

def seed_initial_accounts():
    from app.db.session import SessionLocal
    from app.models.google_account import GoogleAccount
    from app.models.youtube_channel import YouTubeChannel
    from app.models.video import Video
    import uuid

    db = SessionLocal()
    try:
        if db.query(GoogleAccount).count() == 0:
            print("[AUTO-SEEDER]: Seeding 3 Google Accounts & 6 YouTube Channels into DB...")
            acc1 = GoogleAccount(id=uuid.uuid4(), email="agusdwiriantoo@gmail.com", status="ACTIVE", access_token_enc="encrypted_demo_token_1", refresh_token_enc="encrypted_demo_refresh_1")
            acc2 = GoogleAccount(id=uuid.uuid4(), email="audiradigitalnetwork@gmail.com", status="ACTIVE", access_token_enc="encrypted_demo_token_2", refresh_token_enc="encrypted_demo_refresh_2")
            acc3 = GoogleAccount(id=uuid.uuid4(), email="audirasuksesmandiri@gmail.com", status="ACTIVE", access_token_enc="encrypted_demo_token_3", refresh_token_enc="encrypted_demo_refresh_3")
            db.add_all([acc1, acc2, acc3])
            db.commit()

            ch1 = YouTubeChannel(google_account_id=acc1.id, channel_id="UC_vibes_1", name="Audira Vibes", view_count=404, subscriber_count=120)
            ch2 = YouTubeChannel(google_account_id=acc1.id, channel_id="UC_jazz_2", name="Audira Jazz Lounge", view_count=0, subscriber_count=45)
            ch3 = YouTubeChannel(google_account_id=acc2.id, channel_id="UC_jav_3", name="Audira Javanese", view_count=35, subscriber_count=88)
            ch4 = YouTubeChannel(google_account_id=acc2.id, channel_id="UC_dgd_4", name="Audira Dangdut Lawas", view_count=301, subscriber_count=210)
            ch5 = YouTubeChannel(google_account_id=acc3.id, channel_id="UC_pop_5", name="Audira Pop", view_count=5879, subscriber_count=1450)
            ch6 = YouTubeChannel(google_account_id=acc3.id, channel_id="UC_reg_6", name="Audira Reggae", view_count=18, subscriber_count=67)
            db.add_all([ch1, ch2, ch3, ch4, ch5, ch6])
            db.commit()

            v1 = Video(channel_id=ch5.id, video_id="vid_pop_01", title="Audira Pop Hits 2026", view_count=4423, like_count=320, comment_count=45, published_at=datetime.utcnow())
            v2 = Video(channel_id=ch1.id, video_id="vid_vib_01", title="Audira Chill Vibes Lounge", view_count=404, like_count=35, comment_count=12, published_at=datetime.utcnow())
            v3 = Video(channel_id=ch4.id, video_id="vid_dgd_01", title="Audira Dangdut Nostalgia 90an", view_count=301, like_count=28, comment_count=8, published_at=datetime.utcnow())
            v4 = Video(channel_id=ch3.id, video_id="vid_jav_01", title="Gending Javanese Audira", view_count=35, like_count=5, comment_count=2, published_at=datetime.utcnow())
            v5 = Video(channel_id=ch6.id, video_id="vid_reg_01", title="Audira Reggae Roots Vibes", view_count=18, like_count=3, comment_count=1, published_at=datetime.utcnow())
            db.add_all([v1, v2, v3, v4, v5])
            db.commit()
            print("[AUTO-SEEDER SUCCESS]: 3 Accounts & 6 Channels Seeded!")
    except Exception as e:
        print("[AUTO-SEEDER ERROR]:", e)
    finally:
        db.close()

seed_initial_accounts()

# 🔄 AUTOMATED 5-MINUTE BACKSTAGE AUTO-SYNC SCHEDULER
async def auto_sync_scheduler_5m():
    print("[AUTO-SYNC ENGINE]: 5-Minute Scheduler Loop Started")
    while True:
        try:
            await asyncio.sleep(300)  # Sleep 5 minutes (300s)
            from app.db.session import SessionLocal
            from app.services.sync_service import sync_account_data
            from app.models.google_account import GoogleAccount
            from app.models.youtube_channel import YouTubeChannel
            from app.models.system_setting import SystemSetting
            from app.services.telegram_service import TelegramService
            
            db = SessionLocal()
            try:
                acc_ids = [str(a.id) for a in db.query(GoogleAccount).all() if a.access_token_enc]
            finally:
                db.close()

            synced_count = 0
            for acc_id in acc_ids:
                temp_db = SessionLocal()
                try:
                    await sync_account_data(temp_db, acc_id)
                    synced_count += 1
                except Exception as e:
                    print(f"[AUTO-SYNC ACC ERROR {acc_id}]:", e)
                finally:
                    temp_db.close()

            db_stats = SessionLocal()
            try:
                total_views = sum([(c.view_count or 0) for c in db_stats.query(YouTubeChannel).all()])
                total_subs = sum([(c.subscriber_count or 0) for c in db_stats.query(YouTubeChannel).all()])

                sync_time = datetime.now().strftime("%H:%M:%S WIB")
                print(f"[{sync_time}] [AUTO-SYNC 5M SUCCESS]: Synced {synced_count} accounts & channels to PostgreSQL.")
                
                # Check if Telegram Bot is configured for real-time notifications
                token_s = db_stats.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
                chat_s = db_stats.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
                
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
                db_stats.close()
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

# CORS configuration - Dynamic origin matching for LAN/Mini PC/Localhost deployment with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
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
