import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class License(Base):
    __tablename__ = "licenses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    license_key = Column(String, unique=True, index=True, nullable=False)
    duration_type = Column(String, nullable=False) # '7_DAYS', '1_MONTH', 'PERMANENT'
    status = Column(String, default="ACTIVE", nullable=False) # 'ACTIVE', 'UNUSED', 'EXPIRED', 'REVOKED'
    
    client_name = Column(String, nullable=True)
    client_email = Column(String, nullable=True)
    max_channels = Column(Integer, default=6)
    features = Column(String, default="ALL_FEATURES") # e.g. 'ALL_FEATURES', 'BASIC_ANALYTICS', 'PRO_RADAR'
    
    is_active = Column(Boolean, default=True)
    activated_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True) # None for PERMANENT
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def remaining_days(self) -> int:
        if self.duration_type == "PERMANENT" or not self.expires_at:
            return 99999
        now = datetime.now(self.expires_at.tzinfo) if self.expires_at.tzinfo else datetime.utcnow()
        diff = self.expires_at - now
        return max(0, diff.days)
