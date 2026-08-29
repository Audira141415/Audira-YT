import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class YouTubeChannel(Base):
    __tablename__ = "youtube_channels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    account_id = Column(UUID(as_uuid=True), ForeignKey("google_accounts.id"), nullable=False)
    channel_id = Column(String, unique=True, index=True, nullable=False) # YouTube ID
    
    name = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    banner = Column(String, nullable=True)
    country = Column(String, nullable=True)
    
    baseline_views_24h = Column(BigInteger, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    google_account = relationship("GoogleAccount", back_populates="youtube_channels")
    videos = relationship("Video", back_populates="channel", cascade="all, delete-orphan")
