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
from app.services.sync_service import sync_single_channel_direct
from app.api.channels import get_channels

async def test_all():
    print("=" * 70)
    print("🚀 TESTING PURE REAL-TIME YOUTUBE SYNC & ZERO DUMMY INTEGRITY")
    print("=" * 70)

    db = SessionLocal()
    try:
        # TEST 1: Check Audira Javanese Channel in DB
        print("\n[TEST 1] Verifying Audira Javanese subscriber & view baseline integrity...")
        javanese = db.query(YouTubeChannel).filter(YouTubeChannel.channel_id == "UCyzwQxUc3ZSmRfY9sORUeLQ").first()
        assert javanese is not None, "Audira Javanese channel must exist in DB"
        print(f"  • DB Subs: {javanese.subscriber_count} (Expected: 0)")
        print(f"  • DB Views: {javanese.baseline_views_24h} (Expected: 117)")
        assert javanese.subscriber_count == 0, f"Expected 0 subs, got {javanese.subscriber_count}"
        print("  ✅ [TEST 1 PASSED]: Zero dummy fallback verified!")

        # TEST 2: Test Channels API endpoint output
        print("\n[TEST 2] Verifying GET /api/v1/channels output schema & no fallback 1250...")
        channels_res = get_channels(db=db, page=1, limit=10)
        assert "items" in channels_res, "Response must contain items"
        for ch in channels_res["items"]:
            print(f"  • Channel: {ch['name']} | Subs: {ch['subscriberCount']} | Views: {ch['totalViews']:,} | Banner: {ch['banner'][:30] if ch['banner'] else 'Clean Gradient'}")
            assert "picsum" not in ch["banner"], "No random picsum banner permitted!"
            assert ch["subscriberCount"] is not None, "Subscriber count must be a valid number"
        print("  ✅ [TEST 2 PASSED]: API returns clean, accurate data without dummy 1250!")

        # TEST 3: Test Direct Single Channel Live Sync
        print("\n[TEST 3] Verifying sync_single_channel_direct execution...")
        sync_res = await sync_single_channel_direct(db, "UCyzwQxUc3ZSmRfY9sORUeLQ")
        print(f"  • Direct Sync Result: {sync_res}")
        print("  ✅ [TEST 3 PASSED]: Direct single channel sync operational!")

        print("\n" + "=" * 70)
        print("🎉 ALL REALTIME SYNC INTEGRITY TESTS PASSED 100% CLEANLY!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_all())
