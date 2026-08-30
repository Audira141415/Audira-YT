from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import os

db_url = settings.DATABASE_URL

# Test PostgreSQL connection (Docker hostname 'db' or host 'localhost'), fallback to SQLite if offline
if db_url.startswith("postgresql"):
    connected = False
    # Attempt 1: Try original db_url (e.g. @db:5432 in Docker)
    try:
        temp_engine = create_engine(db_url, pool_pre_ping=True, pool_timeout=2)
        with temp_engine.connect() as conn:
            pass
        engine = temp_engine
        connected = True
    except Exception:
        pass

    # Attempt 2: If @db:5432 failed (running outside Docker), try @localhost:5432
    if not connected and "@db:5432" in db_url:
        try:
            local_url = db_url.replace("@db:5432", "@localhost:5432")
            temp_engine = create_engine(local_url, pool_pre_ping=True, pool_timeout=2)
            with temp_engine.connect() as conn:
                pass
            engine = temp_engine
            connected = True
        except Exception:
            pass

    if not connected:
        print("[DB WARNING]: Local PostgreSQL unreachable, falling back to local SQLite engine app.db")
        db_url = "sqlite:///./app.db"
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
