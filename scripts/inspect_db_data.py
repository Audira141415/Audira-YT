import sys
import os
import json

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import app.db.base
from app.db.session import SessionLocal
from app.models.google_account import GoogleAccount
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.oauth_credential import OAuthCredential
from app.models.system_setting import SystemSetting
from app.core.security import decrypt_token

def inspect():
    db = SessionLocal()
    try:
        print("=" * 70)
        print("📊 AUDIT FORENSIK DATA DATABASE AUDIRA-YT")
        print("=" * 70)

        # 1. System Settings
        print("\n1. SYSTEM SETTINGS:")
        settings = db.query(SystemSetting).all()
        for s in settings:
            val_display = s.value
            if "TOKEN" in s.key or "SECRET" in s.key:
                val_display = s.value[:8] + "..." if s.value else "EMPTY"
            print(f"  • {s.key}: {val_display}")

        # 2. OAuth Credentials
        print("\n2. OAUTH CREDENTIALS (GOOGLE CLOUD APPS):")
        creds = db.query(OAuthCredential).all()
        if not creds:
            print("  [KOSONG]: Belum ada entri di tabel oauth_credentials")
        for c in creds:
            print(f"  • ID: {c.id} | Name: {c.name} | Client ID: {c.client_id} | Default: {c.is_default}")

        # 3. Google Accounts
        print("\n3. GOOGLE ACCOUNTS:")
        accounts = db.query(GoogleAccount).all()
        for a in accounts:
            token_sample = "None"
            if a.access_token_enc:
                try:
                    dec = decrypt_token(a.access_token_enc)
                    token_sample = dec[:15] + "..."
                except Exception as e:
                    token_sample = f"Encrypted ({e})"
            print(f"  • Email: {a.email} | Status: {a.status} | Token: {token_sample} | Last Sync: {a.last_sync}")

        # 4. YouTube Channels
        print("\n4. YOUTUBE CHANNELS:")
        channels = db.query(YouTubeChannel).all()
        for ch in channels:
            print(f"  • Name: {ch.name} | Channel ID: {ch.channel_id} | Subs: {ch.subscriber_count} | 24h Views: {ch.baseline_views_24h}")

        # 5. Videos
        print("\n5. VIDEOS:")
        videos = db.query(Video).all()
        for v in videos:
            ch_name = v.channel.name if v.channel else "No Channel"
            print(f"  • Channel: {ch_name} | Video ID: {v.video_id} | Title: {v.title} | Views: {v.view_count} | Likes: {v.like_count} | Comments: {v.comment_count}")

        print("\n" + "=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    inspect()
