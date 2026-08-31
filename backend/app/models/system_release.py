import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base

class SystemRelease(Base):
    __tablename__ = "system_releases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version = Column(String(50), nullable=False) # e.g. "v2.1.0"
    title = Column(String(255), nullable=False) # e.g. "Account Pipeline Engine & Isolated Auto-Publisher"
    git_commit = Column(String(50), nullable=True) # Git commit hash
    deployed_by = Column(String(100), default="Antigravity DevOps")
    environment = Column(String(100), default="Production Mini PC (192.168.100.178)")
    status = Column(String(50), default="ACTIVE") # ACTIVE, STABLE, ROLLED_BACK
    changelog = Column(JSON, nullable=True) # List of change bullets
    db_snapshot_file = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
