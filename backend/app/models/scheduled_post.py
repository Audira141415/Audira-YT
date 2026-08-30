from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base

class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    channel_id = Column(String(36), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String(500), nullable=True)
    privacy_status = Column(String(20), default="public") # public, unlisted, private
    is_short = Column(Boolean, default=False)
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String(20), default="PENDING") # PENDING, UPLOADING, PUBLISHED, FAILED
    file_path = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    youtube_video_id = Column(String(100), nullable=True)
    error_log = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="scheduled_posts")
