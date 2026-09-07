import uuid
from sqlalchemy import Column, DateTime, ForeignKey, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class VideoSnapshot(Base):
    __tablename__ = "video_snapshots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    video_id = Column(UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    view_count = Column(BigInteger, default=0)
    like_count = Column(BigInteger, default=0)
    comment_count = Column(BigInteger, default=0)
    delta_views = Column(BigInteger, default=0)

    video = relationship("Video", back_populates="snapshots")
