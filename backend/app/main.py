import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, accounts, settings as app_settings, videos, analytics, channels
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
            
            db = SessionLocal()
            try:
                accounts = db.query(GoogleAccount).all()
                synced_count = 0
                for acc in accounts:
                    if acc.access_token_enc:
                        await sync_account_data(db, str(acc.id))
                        synced_count += 1
                print(f"[{datetime.now().strftime('%H:%M:%S')}] 🔄 [AUTO-SYNC 5M SUCCESS]: Synced {synced_count} accounts & channels to PostgreSQL.")
            finally:
                db.close()
        except Exception as e:
            print(f"[AUTO-SYNC SCHEDULER ERROR]: {e}")

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

# CORS configuration - Allow all origins for LAN/Mini PC deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(accounts.router, prefix=f"{settings.API_V1_STR}/accounts", tags=["accounts"])
app.include_router(app_settings.router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"])
app.include_router(videos.router, prefix=f"{settings.API_V1_STR}/videos", tags=["videos"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(channels.router, prefix=f"{settings.API_V1_STR}/channels", tags=["channels"])

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
