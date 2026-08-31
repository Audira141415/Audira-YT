import os
import sys
import asyncio

# Set UTF-8 encoding for Windows terminals
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.base import Base
from app.db.session import SessionLocal
from app.models.user import User
from app.models.google_account import GoogleAccount
from app.models.youtube_channel import YouTubeChannel
from app.models.competitor import CompetitorChannel, CompetitorVideo
from app.services.competitor_service import CompetitorService

async def test_live_real_scraping():
    print("================================================================")
    print("[LIVE DEMO]: TESTING REAL-TIME YOUTUBE COMPETITOR SCRAPER")
    print("================================================================")

    db = SessionLocal()
    try:
        # We test adding a real Indonesian music label / creator YouTube channel
        test_handle = "@NagaswaraOfficial"
        print(f"\n[1] Menghubungi server live YouTube untuk channel: {test_handle} ...")
        
        result = await CompetitorService.add_or_update_competitor(db, test_handle, niche="Dangdut & Pop")
        
        print("\n[2] HASIL PENARIKAN DATA LIVE YOUTUBE:")
        print(f"   * Status: {result.get('status')}")
        print(f"   * Pesan: {result.get('message')}")
        
        if result.get("competitor"):
            c = result["competitor"]
            print("\n================ DATA RIIL DARI YOUTUBE ================")
            print(f"📺 Nama Channel   : {c.get('name')}")
            print(f"🆔 Channel ID     : {c.get('channel_id')}")
            print(f"👥 Subscribers    : {c.get('subscriber_count'):,} Subs")
            print(f"👁️ Total Views    : {c.get('total_views'):,} Views")
            print(f"🖼️ Avatar Live    : {c.get('avatar')}")
            print(f"🎬 Jumlah Video   : {len(c.get('videos', []))} Video Terdeteksi")
            
            print("\n--- 3 Video Terbaru yang Berhasil Ditarik Live ---")
            for idx, v in enumerate(c.get('videos', [])[:3], 1):
                print(f" {idx}. {v.get('title')} (ID: {v.get('video_id')}) - {v.get('views', 0):,} Views")
            print("========================================================\n")

    except Exception as e:
        print(f"[ERROR]: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_live_real_scraping())
