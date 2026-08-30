import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, accounts, settings as app_settings, videos, analytics, channels, system, scheduler, team, comments, webhooks
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Create database tables & apply schema column updates
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    try:
        from sqlalchemy import text
        conn.execute(text("ALTER TABLE youtube_channels ADD COLUMN IF NOT EXISTS subscriber_count BIGINT DEFAULT 1250;"))
        conn.execute(text("ALTER TABLE google_accounts ALTER COLUMN user_id DROP NOT NULL;"))
        conn.commit()
    except Exception as e:
        print("[SCHEMA MIGRATION WARNING]:", e)

def seed_initial_accounts():
    from app.db.session import SessionLocal
    from app.models.google_account import GoogleAccount
    from app.models.youtube_channel import YouTubeChannel
    from app.models.video import Video
    from app.models.user import User
    import uuid

    db = SessionLocal()
    try:
        if db.query(GoogleAccount).count() == 0 or db.query(YouTubeChannel).count() == 0:
            print("[AUTO-SEEDER]: Seeding 3 Google Accounts & 6 YouTube Channels into DB...")
            admin_user = db.query(User).first()
            if not admin_user:
                admin_user = User(
                    id=uuid.uuid4(),
                    email="admin@audirasukses.com",
                    name="Agus Dwi Rianto",
                    role="OWNER",
                    status="ACTIVE"
                )
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)

            acc1 = GoogleAccount(id=uuid.uuid4(), user_id=admin_user.id, email="agusdwiriantoo@gmail.com", status="ACTIVE", access_token_enc="encrypted_demo_token_1", refresh_token_enc="encrypted_demo_refresh_1")
            acc2 = GoogleAccount(id=uuid.uuid4(), user_id=admin_user.id, email="audiradigitalnetwork@gmail.com", status="ACTIVE", access_token_enc="encrypted_demo_token_2", refresh_token_enc="encrypted_demo_refresh_2")
            acc3 = GoogleAccount(id=uuid.uuid4(), user_id=admin_user.id, email="audirasuksesmandiri@gmail.com", status="ACTIVE", access_token_enc="encrypted_demo_token_3", refresh_token_enc="encrypted_demo_refresh_3")
            db.add_all([acc1, acc2, acc3])
            db.commit()

            ch1 = YouTubeChannel(account_id=acc1.id, channel_id="UC_vibes_1", name="Audira Vibes", country="ID", baseline_views_24h=404)
            ch2 = YouTubeChannel(account_id=acc1.id, channel_id="UC_jazz_2", name="Audira Jazz Lounge", country="ID", baseline_views_24h=0)
            ch3 = YouTubeChannel(account_id=acc2.id, channel_id="UC_jav_3", name="Audira Javanese", country="ID", baseline_views_24h=35)
            ch4 = YouTubeChannel(account_id=acc2.id, channel_id="UC_dgd_4", name="Audira Dangdut Lawas", country="ID", baseline_views_24h=301)
            ch5 = YouTubeChannel(account_id=acc3.id, channel_id="UC_pop_5", name="Audira Pop", country="ID", baseline_views_24h=5879)
            ch6 = YouTubeChannel(account_id=acc3.id, channel_id="UC_reg_6", name="Audira Reggae", country="ID", baseline_views_24h=18)
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

# 🔄 AUTOMATED REALTIME BACKSTAGE AUTO-SYNC SCHEDULER (1-MINUTE INTERVAL)
async def auto_sync_scheduler_5m():
    print("[AUTO-SYNC ENGINE]: Realtime 60-Second Scheduler Loop Started")
    sync_interval = int(os.getenv("SYNC_INTERVAL_SECONDS", "60"))
    while True:
        try:
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
                total_views = sum([(c.baseline_views_24h or 0) for c in db_stats.query(YouTubeChannel).all()])

                sync_time = datetime.now().strftime("%H:%M:%S WIB")
                print(f"[{sync_time}] [AUTO-SYNC REALTIME SUCCESS]: Synced {synced_count} accounts & channels.")
            finally:
                db_stats.close()
        except Exception as e:
            err_msg = f"[AUTO-SYNC SCHEDULER ERROR]: {e}"
            print(err_msg)
            try:
                from app.services.alert_webhook import send_system_alert
                await send_system_alert("Auto-Sync Failed", str(e), level="ERROR")
            except Exception:
                pass
        
        await asyncio.sleep(sync_interval)

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
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])

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
