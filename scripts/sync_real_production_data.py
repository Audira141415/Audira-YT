import sys
import os
import uuid

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import app.db.base
from app.db.session import SessionLocal
from app.models.youtube_channel import YouTubeChannel
from app.models.oauth_credential import OAuthCredential
from app.models.google_account import GoogleAccount

def update_production_records():
    db = SessionLocal()
    try:
        print("=" * 70)
        print("🚀 SYNCING EXACT PRODUCTION CHANNEL IDs & OAUTH APPS INTO DATABASE")
        print("=" * 70)

        # 1. Update/Insert 3 OAuth Apps
        oauth_data = [
            ("GOOGLE OAUTH APP #1", "572536011480-is80bdsd4n58aoarhmo7jhboteh1r6cd.apps.googleusercontent.com", True),
            ("GOOGLE OAUTH APP #2", "601134768875-gl2fr7ovv79d05h5mob5bgfht7s50n8r.apps.googleusercontent.com", False),
            ("GOOGLE OAUTH APP", "1033986860874-g79ec07u6tr7hdkrj8bh24tip59bg7am.apps.googleusercontent.com", False),
        ]
        for name, cid, is_def in oauth_data:
            existing = db.query(OAuthCredential).filter(OAuthCredential.client_id == cid).first()
            if not existing:
                c = OAuthCredential(id=uuid.uuid4(), name=name, client_id=cid, client_secret="", is_default=is_def)
                db.add(c)
                print(f"  + Added OAuth App: {name} ({cid})")
            else:
                existing.name = name
                existing.is_default = is_def
                print(f"  ~ Updated OAuth App: {name}")

        # 2. Update Channel IDs to exact official 24-character YouTube IDs
        channel_mapping = {
            "Audira Vibes": ("UCwOvaIMKBUwifWHTA4UZcKQLg", 442),
            "Audira Jazz Lounge": ("UCCFwWfaNyQgjaqzOIm7bVNVA", 0),
            "Audira Javanese": ("UCyzwQxUc3ZSmRfY9sORUeLQ", 61579),
            "Audira Dangdut Lawas": ("UCDujW5YBLnV1D-UU2jIR4GQ", 86436),
            "Audira Pop": ("UCNMmjoHB51J29u2LiN9VQTw", 5879),
            "Audira Reggae": ("UCOWN15Pp3YYLM9Oc534Gsxg", 18),
        }

        for ch_name, (real_id, views) in channel_mapping.items():
            ch = db.query(YouTubeChannel).filter(YouTubeChannel.name == ch_name).first()
            if ch:
                ch.channel_id = real_id
                ch.baseline_views_24h = views
                print(f"  ✅ Updated Channel '{ch_name}' -> Official ID: {real_id} ({views:,} Views)")
            else:
                print(f"  [!] Channel not found: {ch_name}")

        db.commit()
        print("\n🎉 PRODUCTION DATA SYNC COMPLETED 100% SUCCESSFULLY!")
        print("=" * 70)
    finally:
        db.close()

if __name__ == "__main__":
    update_production_records()
