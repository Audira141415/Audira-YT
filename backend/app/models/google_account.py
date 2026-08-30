import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class GoogleAccount(Base):
    __tablename__ = "google_accounts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    email = Column(String, nullable=False)
    
    # Encrypted tokens
    access_token_enc = Column(String, nullable=False)
    refresh_token_enc = Column(String, nullable=True)
    
    status = Column(String, default="ACTIVE")
    last_sync = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="google_accounts")
    youtube_channels = relationship("YouTubeChannel", back_populates="google_account", cascade="all, delete-orphan")
