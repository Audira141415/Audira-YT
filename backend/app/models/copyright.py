import uuid
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class CopyrightClaim(Base):
    __tablename__ = "copyright_claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    video_id = Column(String(100), index=True, nullable=False)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    monetization_status = Column(String(30), default="MONETIZED") # MONETIZED (Green), LIMITED (Yellow), DEMONETIZED (Red), NOT_ELIGIBLE
    copyright_status = Column(String(30), default="CLEAN") # CLEAN, CLAIMED_CONTENT_ID, STRIKE_WARNING, BLOCKED
    
    claimant_name = Column(String(255), nullable=True) # e.g. "Warner Music", "Sony Music", "Audira Records"
    claimed_track = Column(String(255), nullable=True) # e.g. "Lagu Dangdut Lawas - Cover"
    impact_type = Column(String(50), default="MONETIZATION_SHARED") # MONETIZATION_SHARED, TRACK_ONLY, BLOCKED_WORLDWIDE
    details = Column(Text, nullable=True)
    
    detected_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="copyright_claims")
