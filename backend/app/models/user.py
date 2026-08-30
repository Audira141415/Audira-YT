import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    role = Column(String, default="OWNER", nullable=False) # Roles: OWNER, EDITOR, VIEWER
    status = Column(String, default="ACTIVE", nullable=False) # Status: ACTIVE, INVITED, SUSPENDED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    google_accounts = relationship("GoogleAccount", back_populates="user", cascade="all, delete-orphan")
