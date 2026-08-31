import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class ChannelMilestone(Base):
    __tablename__ = "channel_milestones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("youtube_channels.id"), nullable=False)
    milestone_type = Column(String, default="SUBSCRIBERS") # SUBSCRIBERS, VIEWS
    milestone_value = Column(BigInteger, nullable=False) # e.g. 1500, 5000, 10000
    achieved_at = Column(DateTime(timezone=True), server_default=func.now())
    notified_telegram = Column(Boolean, default=False)
