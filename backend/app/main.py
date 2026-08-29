from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, accounts, settings as app_settings, videos, analytics
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for YouTube Intelligence Monitor",
    version="1.0.0",
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

@app.get("/")
def read_root():
    return {"message": "Welcome to YouTube Intelligence Monitor API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

