from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Production-grade SQLAlchemy Engine with connection pooling for multi-worker FastAPI & Celery
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Automatically reconnect if database connection drops
    pool_size=20,            # Core connection pool size
    max_overflow=10,         # Maximum temporary overflow connections
    pool_recycle=1800,       # Recycle connections every 30 minutes to prevent stale sockets
    pool_timeout=30          # Seconds to wait before raising QueuePool timeout
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
