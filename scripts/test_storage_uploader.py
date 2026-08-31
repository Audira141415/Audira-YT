import os
import sys
import uuid
import asyncio
from datetime import datetime, timedelta

# Set UTF-8 encoding for Windows terminals
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.google_account import GoogleAccount
from app.models.youtube_channel import YouTubeChannel
from app.models.scheduled_post import ScheduledPost
from app.models.video import Video
from app.services.uploader_service import AutoPublisherService

async def test_storage_and_uploader():
    print("================================================================")
    print("[TEST]: TESTING STORAGE PIPELINE & AUTO-PUBLISHER ENGINE")
    print("================================================================")

    db = SessionLocal()
    try:
        # Get or create channel for test
        ch = db.query(YouTubeChannel).first()
        if not ch:
            print("[WARN] No channel found. Creating test channel...")
            acc = GoogleAccount(id=uuid.uuid4(), email="uploader_test@audira.com", access_token_enc="", refresh_token_enc="")
            db.add(acc)
            db.commit()
            ch = YouTubeChannel(id=uuid.uuid4(), account_id=acc.id, channel_id="UC_TEST_UPLOAD_123", name="Audira Test Channel", country="ID")
            db.add(ch)
            db.commit()

        account_id = str(ch.account_id)
        print(f"[INFO] Using Channel: {ch.name} (Account ID: {account_id})")

        # 🧪 TEST 1: Ensure Account Storage Directories
        print("\n[TEST 1]: Creating and verifying isolated storage directories...")
        dirs = AutoPublisherService.ensure_account_storage(account_id)
        print(f"   + Root Directory: {dirs['root']}")
        print(f"   + Uploads Dir: {dirs['uploads']} (Exists: {os.path.exists(dirs['uploads'])})")
        print(f"   + Shorts Dir: {dirs['shorts']} (Exists: {os.path.exists(dirs['shorts'])})")
        print(f"   + Thumbnails Dir: {dirs['thumbnails']} (Exists: {os.path.exists(dirs['thumbnails'])})")

        # Create dummy video draft in shorts dir
        test_video_path = os.path.join(dirs["shorts"], "test_short_draft.mp4")
        with open(test_video_path, "wb") as f:
            f.write(b"AUDIRA_DUMMY_MP4_BINARY_DATA_TEST")

        files = AutoPublisherService.get_account_storage_files(account_id)
        print(f"   + Found {len(files)} files in account storage pipe:")
        for file_item in files:
            print(f"     - [{file_item['category']}] {file_item['filename']} ({file_item['size_mb']} MB)")

        # 🧪 TEST 2: Calculate Golden Hours Slot (19:00 - 22:00 WIB)
        print("\n[TEST 2]: Calculating Next Golden Hours Upload Slot...")
        golden = AutoPublisherService.get_next_golden_slot(str(ch.id), db)
        print(f"   + Golden Slot WIB: {golden['wib_datetime']}")
        print(f"   + Hour Slot: {golden['hour_slot']}")
        print(f"   + Target Window: {golden['window']}")
        assert golden["is_golden_hour"] == True

        # 🧪 TEST 3: Create ScheduledPost & Execute Instant Publication
        print("\n[TEST 3]: Creating ScheduledPost & Executing Auto-Publishing...")
        post = ScheduledPost(
            channel_id=ch.id,
            title="Audira Viral Beats 2026 #Shorts",
            description="Testing automated publication during golden hours.",
            tags="audira, beats, music",
            privacy_status="public",
            is_short=True,
            scheduled_at=datetime.utcnow() - timedelta(minutes=1), # Due post
            status="PENDING",
            file_path=test_video_path
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        print(f"   + Created ScheduledPost: ID={post.id}, Status={post.status}")

        print("\n   Triggering publish_scheduled_post()...")
        pub_res = await AutoPublisherService.publish_scheduled_post(str(post.id), db)
        print(f"   + Publish Status: {pub_res.get('status')}")
        print(f"   + YouTube Video ID: {pub_res.get('youtube_video_id')}")
        print(f"   + Latency: {pub_res.get('duration_ms')} ms")

        # Verify DB update
        db.refresh(post)
        print(f"   + Post Status in DB: {post.status}")
        assert post.status == "PUBLISHED"
        assert post.youtube_video_id is not None

        # Verify Video record created
        created_vid = db.query(Video).filter(Video.video_id == post.youtube_video_id).first()
        print(f"   + Video record created in DB: {created_vid.title if created_vid else 'None'}")
        assert created_vid is not None

        # 🧪 TEST 4: Background Loop Lifecycle
        print("\n[TEST 4]: Testing AutoPublisher Background Loop...")
        await AutoPublisherService.start_auto_publisher_loop()
        await asyncio.sleep(1)
        await AutoPublisherService.stop_auto_publisher_loop()
        print("   + Background loop started and stopped cleanly.")

        # Cleanup dummy file & test post
        if os.path.exists(test_video_path):
            os.remove(test_video_path)
        db.delete(created_vid)
        db.delete(post)
        db.commit()

        print("\n================================================================")
        print("[SUCCESS]: STORAGE PIPELINE & AUTO-PUBLISHER TESTS PASSED 100%!")
        print("================================================================")

    except Exception as e:
        print(f"[ERROR]: TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_storage_and_uploader())
