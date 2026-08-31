import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class CompetitorChannel(Base):
    __tablename__ = "competitor_channels"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    channel_id = Column(String, unique=True, index=True, nullable=False) # e.g. UCxxxx
    handle = Column(String, nullable=True) # e.g. @kompetitor
    name = Column(String, nullable=False)
    avatar = Column(String, nullable=True)
    niche = Column(String, default="General") # e.g. Dangdut, Pop, Jazz, Tech
    subscriber_count = Column(BigInteger, default=0)
    total_views = Column(BigInteger, default=0)
    video_count = Column(Integer, default=0)
    
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    videos = relationship("CompetitorVideo", back_populates="competitor_channel", cascade="all, delete-orphan")

class CompetitorVideo(Base):
    __tablename__ = "competitor_videos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    competitor_channel_id = Column(UUID(as_uuid=True), ForeignKey("competitor_channels.id"), nullable=False)
    video_id = Column(String, unique=True, index=True, nullable=False) # e.g. dQw4w9WgXcQ
    title = Column(String, nullable=False)
    thumbnail = Column(String, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    view_count = Column(BigInteger, default=0)
    like_count = Column(BigInteger, default=0)
    comment_count = Column(BigInteger, default=0)
    velocity_views_hour = Column(BigInteger, default=0)
    is_viral = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    competitor_channel = relationship("CompetitorChannel", back_populates="videos")
