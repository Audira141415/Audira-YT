import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class MetadataBackupVault(Base):
    __tablename__ = "metadata_backup_vault"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(String(100), index=True, nullable=False) # YouTube Video ID
    
    version = Column(String(50), nullable=False, default="v1.0")
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    tags_json = Column(Text, nullable=True) # JSON string of tags
    category_id = Column(String(50), nullable=True)
    thumbnail_url = Column(String(1000), nullable=True)
    published_at = Column(DateTime, nullable=True)
    
    view_count = Column(BigInteger, default=0)
    like_count = Column(BigInteger, default=0)
    comment_count = Column(BigInteger, default=0)
    
    backup_hash = Column(String(64), nullable=True) # SHA-256 integrity hash
    backup_type = Column(String(30), default="AUTO_SCHEDULED") # AUTO_SCHEDULED, MANUAL_SNAP, RESTORE_POINT
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="metadata_backups")
