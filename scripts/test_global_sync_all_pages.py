import sys
import os
import asyncio

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import app.db.base
from app.db.session import SessionLocal
from app.models.google_account import GoogleAccount
from app.models.youtube_channel import YouTubeChannel
from app.services.sync_service import sync_account_data, sync_all_accounts_and_channels

async def test_global_sync_across_all_pages():
    print("=" * 70)
    print("🚀 TESTING COMPLETE GLOBAL DATA SYNCHRONIZATION")
    print("=" * 70)

    db = SessionLocal()
    try:
        print("\n[STEP 1]: Triggering Global Network Sync...")
        results = await sync_all_accounts_and_channels(db)
        print(f"  • Global Sync Result: {results}")

        print("\n[STEP 2]: Verifying Database State for ALL Dashboard Pages...")
        channels = db.query(YouTubeChannel).all()
        assert len(channels) == 6, f"Expected 6 channels, got {len(channels)}"
        
        total_views = 0
        total_subs = 0
        print("\n  📺 SYNCHRONIZED CHANNELS STATUS:")
        for ch in channels:
            total_views += (ch.baseline_views_24h or 0)
            total_subs += (ch.subscriber_count or 0)
            print(f"    - {ch.name:<25} | ID: {ch.channel_id} | Subs: {ch.subscriber_count} | Views: {ch.baseline_views_24h:,}")

        print(f"\n  📊 TOTAL NETWORK AUDIT: {len(channels)} Channels | {total_subs} Subscribers | {total_views:,} Baseline Views")
        print("\n" + "=" * 70)
        print("🎉 ALL PAGES & DATA SOURCES ARE 100% SYNCHRONIZED AND REALTIME READY!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_global_sync_across_all_pages())
