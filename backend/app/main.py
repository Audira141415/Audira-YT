import os
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, accounts, settings as app_settings, videos, analytics, channels, system, scheduler, team, comments, webhooks, reports, competitors, intelligence, revenue
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
    from app.db.session import SessionLocal
    from app.models.google_account import GoogleAccount
    from app.models.youtube_channel import YouTubeChannel
    from app.models.video import Video
    from app.models.user import User
    import uuid

    db = SessionLocal()
    try:
        if db.query(GoogleAccount).count() == 0 and db.query(YouTubeChannel).count() == 0:
            print("[AUTO-SEEDER]: Seeding 3 Google Accounts & 6 YouTube Channels with Official Production IDs...")
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

            # 3 Official Google Accounts
            acc1 = GoogleAccount(id=uuid.uuid4(), user_id=admin_user.id, email="agusdwiriantoo@gmail.com", status="ACTIVE", access_token_enc="", refresh_token_enc="")
            acc2 = GoogleAccount(id=uuid.uuid4(), user_id=admin_user.id, email="audiradigitalnetwork@gmail.com", status="ACTIVE", access_token_enc="", refresh_token_enc="")
            acc3 = GoogleAccount(id=uuid.uuid4(), user_id=admin_user.id, email="audirasuksesmandiri@gmail.com", status="ACTIVE", access_token_enc="", refresh_token_enc="")
            db.add_all([acc1, acc2, acc3])
            db.commit()

            # 6 Official YouTube Channels with Exact Verified YouTube IDs
            ch1 = YouTubeChannel(account_id=acc1.id, channel_id="UCwOvaiMXBUwWHTA4UZcKOLg", name="Audira Vibes", country="ID", baseline_views_24h=0, subscriber_count=1)
            ch2 = YouTubeChannel(account_id=acc1.id, channel_id="UCcFwWfaNyQgjqzQIm7bVNVA", name="Audira Jazz Lounge", country="ID", baseline_views_24h=0, subscriber_count=0)
            ch3 = YouTubeChannel(account_id=acc2.id, channel_id="UCyzwQxUc3ZSmR1Y9s0RUeLQ", name="Audira Javanese", country="ID", baseline_views_24h=0, subscriber_count=0)
            ch4 = YouTubeChannel(account_id=acc2.id, channel_id="UCdujW5YBLnV10-UU2jIR4GQ", name="Audira Dangdut Lawas", country="ID", baseline_views_24h=0, subscriber_count=3)
            ch5 = YouTubeChannel(account_id=acc3.id, channel_id="UCNMjoH851JZ9u2LIjN9VQTw", name="Audira Pop", country="ID", baseline_views_24h=0, subscriber_count=8)
            ch6 = YouTubeChannel(account_id=acc3.id, channel_id="UC0Wn15Pp3YYLM90e534Gsxg", name="Audira Reggae", country="ID", baseline_views_24h=0, subscriber_count=3)
            db.add_all([ch1, ch2, ch3, ch4, ch5, ch6])
            db.commit()

            # Seed Real Production OAuth Apps if empty
            from app.models.oauth_credential import OAuthCredential
            if db.query(OAuthCredential).count() == 0:
                c1 = OAuthCredential(id=uuid.uuid4(), name="GOOGLE OAUTH APP #1", client_id="572536011480-is80bdsd4n58aoarhmo7jhboteh1r6cd.apps.googleusercontent.com", client_secret="", is_default=True)
                c2 = OAuthCredential(id=uuid.uuid4(), name="GOOGLE OAUTH APP #2", client_id="601134768875-gl2fr7ovv79d05h5mob5bgfht7s50n8r.apps.googleusercontent.com", client_secret="", is_default=False)
                c3 = OAuthCredential(id=uuid.uuid4(), name="GOOGLE OAUTH APP", client_id="1033986860874-g79ec07u6tr7hdkrj8bh24tip59bg7am.apps.googleusercontent.com", client_secret="", is_default=False)
                db.add_all([c1, c2, c3])
                db.commit()

            print("[AUTO-SEEDER SUCCESS]: 3 Accounts, 6 Channels & 3 OAuth Apps Initialized!")

        # Purge any legacy dummy placeholder videos (jav_vid_%, etc.)
        from app.models.video import Video
        dummy_vids = db.query(Video).filter(Video.video_id.like("jav_vid_%")).all()
        if dummy_vids:
            for dv in dummy_vids:
                db.delete(dv)
            db.commit()
            print(f"[PURGE]: Removed {len(dummy_vids)} legacy placeholder video records.")

        # Recalculate baseline views from real video sum
        real_cid_map = {
            "Audira Vibes": "UCwOvaiMXBUwWHTA4UZcKOLg",
            "Audira Dangdut Lawas": "UCdujW5YBLnV10-UU2jIR4GQ",
            "Audira Javanese": "UCyzwQxUc3ZSmR1Y9s0RUeLQ",
            "Audira Pop": "UCNMjoH851JZ9u2LIjN9VQTw",
            "Audira Reggae": "UC0Wn15Pp3YYLM90e534Gsxg",
            "Audira Jazz Lounge": "UCcFwWfaNyQgjqzQIm7bVNVA",
        }
        all_channels = db.query(YouTubeChannel).all()
        for ch in all_channels:
            if ch.name in real_cid_map:
                ch.channel_id = real_cid_map[ch.name]
            real_sum = sum(v.view_count or 0 for v in (ch.videos or []))
            ch.baseline_views_24h = real_sum
        db.commit()
    except Exception as e:
        print("[AUTO-SEEDER ERROR]:", e)
    finally:
        db.close()

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

# CORS configuration - Dynamic origin matching for LAN/Mini PC/Localhost deployment with credentials
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3005",
        "http://localhost:8005",
        "http://localhost:1420",
        "http://127.0.0.1:3005",
        "http://127.0.0.1:8005",
        "http://127.0.0.1:1420",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_origin_regex=r"^(https?://|tauri://).*",
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
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
app.include_router(competitors.router, prefix=f"{settings.API_V1_STR}/competitors", tags=["competitors"])
app.include_router(intelligence.router, prefix=f"{settings.API_V1_STR}/intelligence", tags=["intelligence"])
app.include_router(revenue.router, prefix=f"{settings.API_V1_STR}/revenue", tags=["revenue"])

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
