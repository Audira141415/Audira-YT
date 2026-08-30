import uuid
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=False)
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

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=True)
    trigger_keyword = Column(String(100), nullable=False)
    reply_template = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="auto_reply_rules")
