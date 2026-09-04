import uuid
from sqlalchemy import Column, String, DateTime, Integer, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class ThumbnailABTest(Base):
    __tablename__ = "thumbnail_ab_tests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    video_id = Column(String(100), nullable=False)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    thumbnail_a_url = Column(String(500), nullable=False)
    thumbnail_b_url = Column(String(500), nullable=False)
    
    active_variant = Column(String(10), default="A") # "A" or "B"
    views_a = Column(Integer, default=0)
    views_b = Column(Integer, default=0)
    impressions_a = Column(Integer, default=100)
    impressions_b = Column(Integer, default=100)
    ctr_a = Column(Float, default=4.5)
    ctr_b = Column(Float, default=6.2)
    
    rotator_interval_hours = Column(Integer, default=24)
    last_switched_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="RUNNING") # RUNNING, PAUSED, COMPLETED
    winner_variant = Column(String(10), nullable=True) # "A", "B", None
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="thumbnail_ab_tests")
