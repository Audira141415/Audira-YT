import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.session import SessionLocal
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video

def clean_database():
    print("================================================================")
    print("   AUDIRA YT MONITOR - DATABASE PURGE & REAL SYNC UTILITY")
    print("================================================================")

    db = SessionLocal()
    try:
        # 1. Purge dummy videos
        dummy_videos = db.query(Video).filter(
            (Video.video_id.like("jav_vid_%")) | 
            (Video.video_id.like("vid_comp_%")) |
            ((Video.view_count > 20000) & (Video.video_id.notlike("tWUNAnuO6dg%")))
        ).all()
        print(f"[*] Found {len(dummy_videos)} legacy dummy video records.")
        for dv in dummy_videos:
            db.delete(dv)
        db.commit()

        # 2. Recalculate baseline views
        channels = db.query(YouTubeChannel).all()
        print(f"\n[*] Recalculating exact views for {len(channels)} YouTube channels:")
        for ch in channels:
            real_sum = sum(v.view_count or 0 for v in (ch.videos or []))
            ch.baseline_views_24h = real_sum
            print(f"    - {ch.name} (CID: {ch.channel_id}) -> Subs: {ch.subscriber_count}, Real Views: {real_sum}, Videos: {len(ch.videos or [])}")
        db.commit()

        print("\n================================================================")
        print("   DATABASE BERHASIL DIBERSIHKAN DARI DATA DUMMY 100%! 🚀")
        print("================================================================")

    except Exception as e:
        print(f"[ERROR]: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clean_database()
