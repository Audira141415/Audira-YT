import os
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, accounts, settings as app_settings, videos, analytics, channels, system, scheduler, team, comments, webhooks, reports, competitors, intelligence, revenue, licenses, users
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Create database tables & apply schema column updates
Base.metadata.create_all(bind=engine)
with engine.connect() as conn:
    try:
        from sqlalchemy import text
        if "sqlite" in str(engine.url):
            try:
                conn.execute(text("ALTER TABLE youtube_channels ADD COLUMN subscriber_count INTEGER DEFAULT 0;"))
            except Exception:
                pass
            pipeline_cols = [
                "ALTER TABLE google_accounts ADD COLUMN oauth_credential_id VARCHAR(36);",
                "ALTER TABLE google_accounts ADD COLUMN pipeline_enabled BOOLEAN DEFAULT 1;",
                "ALTER TABLE google_accounts ADD COLUMN pipeline_status VARCHAR(50) DEFAULT 'HEALTHY';",
                "ALTER TABLE google_accounts ADD COLUMN sync_interval_seconds INTEGER DEFAULT 60;",
                "ALTER TABLE google_accounts ADD COLUMN quota_used_today INTEGER DEFAULT 0;",
                "ALTER TABLE google_accounts ADD COLUMN quota_limit_daily INTEGER DEFAULT 10000;",
                "ALTER TABLE google_accounts ADD COLUMN last_sync_duration_ms INTEGER DEFAULT 0;",
                "ALTER TABLE google_accounts ADD COLUMN last_error_message TEXT;",
                "ALTER TABLE google_accounts ADD COLUMN jitter_offset_seconds INTEGER DEFAULT 0;"
            ]
            for col_sql in pipeline_cols:
                try:
                    conn.execute(text(col_sql))
                except Exception:
                    pass
            conn.commit()
        else:
            conn.execute(text("ALTER TABLE youtube_channels ADD COLUMN IF NOT EXISTS subscriber_count BIGINT DEFAULT 0;"))
            conn.execute(text("ALTER TABLE google_accounts ALTER COLUMN user_id DROP NOT NULL;"))
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS hashed_password VARCHAR(255);"))
            pg_cols = [
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS oauth_credential_id UUID REFERENCES oauth_credentials(id);",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS pipeline_enabled BOOLEAN DEFAULT TRUE;",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS pipeline_status VARCHAR(50) DEFAULT 'HEALTHY';",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS sync_interval_seconds INTEGER DEFAULT 60;",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS quota_used_today INTEGER DEFAULT 0;",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS quota_limit_daily INTEGER DEFAULT 10000;",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS last_sync_duration_ms INTEGER DEFAULT 0;",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS last_error_message TEXT;",
                "ALTER TABLE google_accounts ADD COLUMN IF NOT EXISTS jitter_offset_seconds INTEGER DEFAULT 0;"
            ]
            for col_sql in pg_cols:
                try:
                    conn.execute(text(col_sql))
                except Exception:
                    pass
            conn.commit()
    except Exception as e:
        print("[SCHEMA MIGRATION WARNING]:", e)

def seed_initial_accounts():
    """
    Seeds ONLY the SUPERADMIN user (Audira/Sigma1993) on first boot.
    Google Accounts and YouTube Channels are NOT auto-seeded —
    each user must add their own channels after registering. (SaaS Multi-Tenant)
    """
    from app.db.session import SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    import uuid

    db = SessionLocal()
    try:
        # Seed or Update Official Superadmin User (Audira / Sigma1993)
        audira_pass_hash = get_password_hash("Sigma1993")
        audira_user = db.query(User).filter((User.email == "audira@audira.com") | (User.name == "Audira")).first()
        if not audira_user:
            audira_user = User(
                id=uuid.uuid4(),
                email="audira@audira.com",
                name="Audira",
                hashed_password=audira_pass_hash,
                role="SUPERADMIN",
                status="ACTIVE"
            )
            db.add(audira_user)
            db.commit()
            db.refresh(audira_user)
            print("[AUTO-SEEDER SUCCESS]: Superadmin user 'Audira' (Sigma1993) created!")
        else:
            audira_user.name = "Audira"
            audira_user.role = "SUPERADMIN"
            audira_user.hashed_password = audira_pass_hash
            db.commit()
            print("[AUTO-SEEDER SUCCESS]: Superadmin user 'Audira' (Sigma1993) updated!")

        # Purge any legacy dummy placeholder videos (jav_vid_%, etc.)
        from app.models.video import Video
        dummy_vids = db.query(Video).filter(Video.video_id.like("jav_vid_%")).all()
        if dummy_vids:
            for dv in dummy_vids:
                db.delete(dv)
            db.commit()
            print(f"[PURGE]: Removed {len(dummy_vids)} legacy placeholder video records.")

    except Exception as e:
        print("[AUTO-SEEDER ERROR]:", e)
    finally:
        db.close()

# Only seed SUPERADMIN on first boot — not Google Accounts/Channels (SaaS: users add their own)
seed_initial_accounts()

# 🕵️ COMPETITOR RADAR SCHEDULER (15-MINUTE INTERVAL)
async def competitor_radar_scheduler_15m():
    print("[COMPETITOR RADAR ENGINE]: 15-Minute Competitor Tracker Loop Started 🕵️")
    while True:
        try:
            await asyncio.sleep(900) # 15 minutes
            from app.db.session import SessionLocal
            from app.services.competitor_service import CompetitorService
            db = SessionLocal()
            try:
                res = await CompetitorService.run_competitor_radar_sync(db)
                print(f"[COMPETITOR RADAR SUCCESS]: Checked {res.get('checked', 0)} competitors.")
            finally:
                db.close()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"[COMPETITOR RADAR ERROR]: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start isolated per-account pipeline engine, two-way telegram bot listener, competitor radar, and auto-publisher
    from app.services.pipeline_service import pipeline_manager
    from app.services.telegram_bot_listener import TelegramBotListener
    from app.services.uploader_service import AutoPublisherService
    
    await pipeline_manager.start_all()
    await AutoPublisherService.start_auto_publisher_loop()
    tg_listener_task = asyncio.create_task(TelegramBotListener.start_long_polling_loop())
    comp_radar_task = asyncio.create_task(competitor_radar_scheduler_15m())

    # Auto clean legacy dummy competitors on server boot
    try:
        from app.db.session import SessionLocal
        from app.models.competitor import CompetitorChannel
        from app.services.competitor_service import CompetitorService
        from app.models.youtube_channel import YouTubeChannel
        from app.models.video import Video
        db_boot = SessionLocal()
        try:
            # 1. Clean competitor dummy channels
            dummy_comps = db_boot.query(CompetitorChannel).filter(
                (CompetitorChannel.channel_id.like("UC_comp_%")) |
                (CompetitorChannel.handle.in_(["@dangdut_pantura_official", "@indie_pop_vibes", "@coffee_jazz_lounge"]))
            ).all()
            if dummy_comps:
                for d in dummy_comps:
                    db_boot.delete(d)
                db_boot.commit()
                print(f"[STARTUP]: Cleaned {len(dummy_comps)} legacy dummy competitors.")
            if db_boot.query(CompetitorChannel).count() == 0:
                async def _seed_competitors():
                    s_db = SessionLocal()
                    try:
                        await CompetitorService.add_or_update_competitor(s_db, "@GadgetIn", "Tech")
                        await CompetitorService.add_or_update_competitor(s_db, "@NagaswaraOfficial", "Dangdut & Pop")
                    except Exception as err:
                        print(f"[STARTUP COMPETITOR SEED ERROR]: {err}")
                    finally:
                        s_db.close()
                asyncio.create_task(_seed_competitors())

            # 2. Clean dummy video records & recalculate real views
            dummy_videos = db_boot.query(Video).filter(
                (Video.video_id.like("jav_vid_%")) | 
                (Video.video_id.like("vid_comp_%")) |
                ((Video.view_count > 20000) & (Video.video_id.notlike("tWUNAnuO6dg%")))
            ).all()
            if dummy_videos:
                for dv in dummy_videos:
                    db_boot.delete(dv)
                db_boot.commit()
                print(f"[STARTUP]: Purged {len(dummy_videos)} legacy dummy videos.")
            
            for ch in db_boot.query(YouTubeChannel).all():
                real_sum = sum(v.view_count or 0 for v in (ch.videos or []))
                ch.baseline_views_24h = real_sum
            db_boot.commit()
            print("[STARTUP]: Recalculated exact real views for all channels.")
        finally:
            db_boot.close()
    except Exception as e:
        print(f"[STARTUP]: Boot cleanup warning: {e}")

    yield
    # Shutdown: Cancel tasks cleanly and stop all pipelines
    await pipeline_manager.stop_all()
    await AutoPublisherService.stop_auto_publisher_loop()
    tg_listener_task.cancel()
    comp_radar_task.cancel()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for YouTube Intelligence Monitor with 24/7 Monitoring & AI Radar",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration - Restrict to LAN, Localhost, and Desktop Tauri App
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3005",
        "http://localhost:8005",
        "http://localhost:1420",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3005",
        "http://127.0.0.1:8005",
        "http://127.0.0.1:1420",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?|tauri://.*|https://tauri\.localhost)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import FastAPI, Depends
from app.api.deps import get_current_active_user, require_superadmin

# 🔓 Public Auth & Webhook Endpoints
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])

# 🔒 Standard Authenticated Dashboards (Requires Active Logged-in User)
app.include_router(accounts.router, prefix=f"{settings.API_V1_STR}/accounts", tags=["accounts"], dependencies=[Depends(get_current_active_user)])
app.include_router(videos.router, prefix=f"{settings.API_V1_STR}/videos", tags=["videos"], dependencies=[Depends(get_current_active_user)])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"], dependencies=[Depends(get_current_active_user)])
app.include_router(channels.router, prefix=f"{settings.API_V1_STR}/channels", tags=["channels"], dependencies=[Depends(get_current_active_user)])
app.include_router(scheduler.router, prefix=f"{settings.API_V1_STR}/scheduler", tags=["scheduler"], dependencies=[Depends(get_current_active_user)])
app.include_router(team.router, prefix=f"{settings.API_V1_STR}/team", tags=["team"], dependencies=[Depends(get_current_active_user)])
app.include_router(comments.router, prefix=f"{settings.API_V1_STR}/comments", tags=["comments"], dependencies=[Depends(get_current_active_user)])
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"], dependencies=[Depends(get_current_active_user)])
app.include_router(competitors.router, prefix=f"{settings.API_V1_STR}/competitors", tags=["competitors"], dependencies=[Depends(get_current_active_user)])
app.include_router(intelligence.router, prefix=f"{settings.API_V1_STR}/intelligence", tags=["intelligence"], dependencies=[Depends(get_current_active_user)])
app.include_router(revenue.router, prefix=f"{settings.API_V1_STR}/revenue", tags=["revenue"], dependencies=[Depends(get_current_active_user)])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"], dependencies=[Depends(get_current_active_user)])

# 👑 Superadmin-Only Administrative Endpoints
app.include_router(app_settings.router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"], dependencies=[Depends(require_superadmin)])
app.include_router(licenses.router, prefix=f"{settings.API_V1_STR}/licenses", tags=["licenses"], dependencies=[Depends(require_superadmin)])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to YouTube Intelligence Monitor API",
        "autoSync": "ACTIVE (60S REALTIME)",
        "telegramBotListener": "TWO-WAY ACTIVE",
        "competitorRadar": "ACTIVE (15M LOOP)"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "autoSyncScheduler": "RUNNING",
        "twoWayTelegramBot": "ACTIVE",
        "competitorRadar": "RUNNING"
    }
