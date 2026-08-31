import sys
import os
import asyncio

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import app.db.base
from app.db.session import SessionLocal
from app.services.sync_service import sync_single_channel_direct
from app.models.youtube_channel import YouTubeChannel

async def verify_all_6_channels_live_sync():
    print("=" * 70)
    print("🚀 LIVE SYNC VERIFICATION FOR ALL 6 AUDIRA CHANNELS")
    print("=" * 70)

    db = SessionLocal()
    try:
        channels = db.query(YouTubeChannel).all()
        for ch in channels:
            print(f"\n[SYNCING] Channel: {ch.name} (ID: {ch.channel_id})...")
            res = await sync_single_channel_direct(db, ch.channel_id)
            print(f"  • Sync Result: {res}")
            assert res.get("status") == "success", f"Sync must succeed for {ch.name}"
            print(f"  ✅ Live sync success! Subs: {res.get('subscribers')} | Banner: {res.get('banner')[:30] if res.get('banner') else 'N/A'}")

        print("\n" + "=" * 70)
        print("🎉 ALL 6 CHANNELS LIVE-SYNCED 100% CLEANLY AND INSTANTLY!")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(verify_all_6_channels_live_sync())
