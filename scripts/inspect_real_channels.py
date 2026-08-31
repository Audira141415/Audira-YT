import os
import sys
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import app.db.base
from app.db.session import SessionLocal
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.services.sync_service import YouTubeService

async def main():
    db = SessionLocal()
    try:
        channels = db.query(YouTubeChannel).all()
        print(f"Total Channels in DB: {len(channels)}\n")

        for ch in channels:
            print("="*60)
            print(f"Channel: {ch.name} (CID: {ch.channel_id})")
            
            # Fetch live YouTube public data
            live_data = await YouTubeService.fetch_channel_public_direct(ch.channel_id)
            print(f"  + Live Subs from YouTube: {live_data.get('subscriber_count', 0)}")
            print(f"  + Live Avatar: {live_data.get('avatar')[:40] if live_data.get('avatar') else 'None'}")
            print(f"  + Live Banner: {live_data.get('banner')[:40] if live_data.get('banner') else 'None'}")
            
            # Real videos linked in DB
            vids = ch.videos or []
            print(f"  + Videos in DB: {len(vids)} videos")
            sum_views = 0
            for v in vids:
                print(f"      - {v.title[:45]} | ID: {v.video_id} | Views: {v.view_count}")
                sum_views += (v.view_count or 0)
            print(f"  + Calculated Total Views in DB: {sum_views} views")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
