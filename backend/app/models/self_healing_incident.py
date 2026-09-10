import uuid
from sqlalchemy import Column, String, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class SelfHealingIncident(Base):
    __tablename__ = "self_healing_incidents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    error_type = Column(String(100), nullable=False, index=True)
    error_message = Column(Text, nullable=True)
    component = Column(String(100), default="BACKEND_API", nullable=False)
    action_taken = Column(String(150), nullable=False)
    resolution_time_ms = Column(Integer, default=0, nullable=False)
    status = Column(String(50), default="AUTO_SOLVED", nullable=False) # AUTO_SOLVED, RECOVERING, ESCALATED
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
