import uuid
from sqlalchemy import Column, String, DateTime, Float, BigInteger, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base_class import Base

class RoyaltyContract(Base):
    __tablename__ = "royalty_contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    channel_id = Column(UUID(as_uuid=True), ForeignKey("youtube_channels.id", ondelete="CASCADE"), nullable=False)
    video_id = Column(String(100), nullable=True) # Specific video or all channel tracks
    
    track_title = Column(String(255), nullable=False)
    artist_name = Column(String(255), nullable=False)
    artist_email = Column(String(255), nullable=True)
    
    label_share_pct = Column(Float, default=50.0) # e.g. 50.0%
    artist_share_pct = Column(Float, default=30.0) # e.g. 30.0%
    producer_share_pct = Column(Float, default=20.0) # e.g. 20.0%
    
    status = Column(String(20), default="ACTIVE") # ACTIVE, PAUSED, ARCHIVED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    channel = relationship("YouTubeChannel", backref="royalty_contracts")
    payouts = relationship("RoyaltyPayout", back_populates="contract", cascade="all, delete-orphan")

class RoyaltyPayout(Base):
    __tablename__ = "royalty_payouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("royalty_contracts.id", ondelete="CASCADE"), nullable=False)
    
    period = Column(String(20), nullable=False) # e.g. "2026-08", "2026-09"
    total_views = Column(BigInteger, default=0)
    gross_revenue_idr = Column(BigInteger, default=0)
    
    label_payout_idr = Column(BigInteger, default=0)
    artist_payout_idr = Column(BigInteger, default=0)
    producer_payout_idr = Column(BigInteger, default=0)
    
    payment_status = Column(String(20), default="PENDING") # PENDING, PAID, PROCESSING
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    contract = relationship("RoyaltyContract", back_populates="payouts")
