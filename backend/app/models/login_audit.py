import uuid
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base_class import Base

class LoginAuditLog(Base):
    __tablename__ = "login_audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    email = Column(String, nullable=False, index=True)
    role = Column(String, nullable=True, default="USER")
    ip_address = Column(String, nullable=False, index=True)
    city = Column(String, nullable=True, default="Unknown", index=True)
    region = Column(String, nullable=True, default="Unknown")
    country = Column(String, nullable=True, default="Unknown")
    isp = Column(String, nullable=True, default="Unknown")
    user_agent = Column(Text, nullable=True)
    browser = Column(String, nullable=True, default="Unknown")
    os = Column(String, nullable=True, default="Unknown")
    device_type = Column(String, nullable=True, default="Desktop")
    status = Column(String, nullable=False, default="SUCCESS", index=True) # SUCCESS / FAILED
    failure_reason = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
