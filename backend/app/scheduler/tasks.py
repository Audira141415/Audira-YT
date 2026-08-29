from app.scheduler.worker import celery_app
from app.db.session import SessionLocal
from app.services.sync_service import sync_account_data

@celery_app.task(name="tasks.sync_youtube_account")
def task_sync_youtube_account(account_id: str):
    db = SessionLocal()
    try:
        res = sync_account_data(db, account_id)
        return res
    finally:
        db.close()
