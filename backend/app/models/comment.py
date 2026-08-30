from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.db.base import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    channel_id = Column(String(36), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(String(100), nullable=False)
    youtube_comment_id = Column(String(100), unique=True, nullable=False)
    author_name = Column(String(255), nullable=False)
    author_profile_image = Column(String(500), nullable=True)
    text_display = Column(Text, nullable=False)
    published_at = Column(DateTime, default=datetime.utcnow)
    sentiment = Column(String(20), default="NEUTRAL") # POSITIVE, NEUTRAL, SPAM
    is_replied = Column(Boolean, default=False)
    reply_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="comments")

class AutoReplyRule(Base):
    __tablename__ = "auto_reply_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    channel_id = Column(String(36), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=True)
    trigger_keyword = Column(String(100), nullable=False)
    reply_template = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="auto_reply_rules")
