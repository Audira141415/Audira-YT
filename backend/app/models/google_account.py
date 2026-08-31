import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class GoogleAccount(Base):
    __tablename__ = "google_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    oauth_credential_id = Column(UUID(as_uuid=True), ForeignKey("oauth_credentials.id"), nullable=True)
    email = Column(String, nullable=False)
    
    # Encrypted tokens
    access_token_enc = Column(String, nullable=False)
    refresh_token_enc = Column(String, nullable=True)
    
    status = Column(String, default="ACTIVE")
    last_sync = Column(DateTime(timezone=True), nullable=True)

    # 🚀 Account Pipeline Engine Fields
    pipeline_enabled = Column(Boolean, default=True)
    pipeline_status = Column(String, default="HEALTHY") # HEALTHY, SYNCING, THROTTLED, ERROR, PAUSED
    sync_interval_seconds = Column(Integer, default=60) # Dynamic sync rate per pipe
    quota_used_today = Column(Integer, default=0)
    quota_limit_daily = Column(Integer, default=10000)
    last_sync_duration_ms = Column(Integer, default=0)
    last_error_message = Column(Text, nullable=True)
    jitter_offset_seconds = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="google_accounts")
    oauth_credential = relationship("OAuthCredential")
    youtube_channels = relationship("YouTubeChannel", back_populates="google_account", cascade="all, delete-orphan")
