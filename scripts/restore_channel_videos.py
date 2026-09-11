import sys
import os
import asyncio

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import app.db.base
from app.db.session import SessionLocal
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.services.sync_service import sync_single_channel_direct

async def restore():
    db = SessionLocal()
    try:
        print("=" * 70)
        print("🚀 RESTORING & RE-SYNCING ALL AUDIRA CHANNELS & VIDEOS")
        print("=" * 70)

        channels = db.query(YouTubeChannel).all()
        for ch in channels:
            print(f"\n[*] Syncing Channel: {ch.name} ({ch.channel_id})...")
            res = await sync_single_channel_direct(db, ch.channel_id)
            vcount = db.query(Video).filter(Video.channel_id == ch.id).count()
            print(f"    Status: {res.get('status')} | Videos in DB now: {vcount}")

        print("\n" + "=" * 70)
        print("✅ ALL CHANNELS AND VIDEOS SUCCESSFULLY RESTORED!")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(restore())
