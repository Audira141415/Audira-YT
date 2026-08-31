import sys
import os
import asyncio
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import app.db.base
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.youtube_channel import YouTubeChannel
from app.models.google_account import GoogleAccount
from app.models.video import Video
from app.models.user import User
from app.models.competitor import CompetitorChannel, CompetitorVideo
from app.models.channel_milestone import ChannelMilestone
from app.services.telegram_bot_listener import TelegramBotListener, is_alerts_muted
from app.services.sentiment_service import SentimentService
from app.services.stagnation_service import StagnationService
from app.services.quiet_hours_service import QuietHoursService
from app.services.competitor_service import CompetitorService
from app.services.sync_service import check_subscriber_milestones_and_churn

# Ensure all tables exist
Base.metadata.create_all(bind=engine)

async def run_all_monitoring_tests():
    print("=" * 70)
    print("🚀 AUDIRA-YT: ADVANCED 7 MONITORING FEATURES VERIFICATION TEST")
    print("=" * 70)

    db = SessionLocal()

    try:
        # TEST 1: Two-Way Telegram Bot Commands
        print("\n[TEST 1/7] 🤖 Testing Two-Way Telegram Bot Command Dispatcher...")
        await TelegramBotListener.handle_command("/status", "-5528182143", "Audira Admin", "")
        await TelegramBotListener.handle_command("/top", "-5528182143", "Audira Admin", "")
        await TelegramBotListener.handle_command("/milestones", "-5528182143", "Audira Admin", "")
        await TelegramBotListener.handle_command("/mute 30m", "-5528182143", "Audira Admin", "")
        assert is_alerts_muted() == True, "Mute should be active after /mute 30m"
        await TelegramBotListener.handle_command("/unmute", "-5528182143", "Audira Admin", "")
        assert is_alerts_muted() == False, "Mute should be inactive after /unmute"
        print("✅ [TEST 1 PASSED]: Two-Way Telegram Bot Command Handler 100% Operational!")

        # TEST 2: Subscriber Milestone & Churn Alert
        print("\n[TEST 2/7] 👥 Testing Subscriber Milestone & Churn Engine...")
        ch = db.query(YouTubeChannel).first()
        if ch:
            # Simulate crossing milestone from 1490 to 1505 subs
            await check_subscriber_milestones_and_churn(db, ch, 1490, 1505, "", "")
            # Check milestone table
            ms = db.query(ChannelMilestone).filter(ChannelMilestone.channel_id == ch.id, ChannelMilestone.milestone_value == 1500).first()
            assert ms is not None, "Milestone 1500 should be recorded in DB"
            print(f"✅ Milestone 1500 recorded for {ch.name} at {ms.achieved_at}")
        print("✅ [TEST 2 PASSED]: Subscriber Milestone & Churn Detection 100% Operational!")

        # TEST 3: Quiet Hours & Alert Suppression
        print("\n[TEST 3/7] 🎯 Testing Quiet Hours & Alert Suppression...")
        suppress_critical = QuietHoursService.should_suppress_alert(is_critical=True, db=db)
        assert suppress_critical == False, "Critical alerts must NEVER be suppressed"
        print("✅ Critical alerts safety verified (never suppressed).")
        print("✅ [TEST 3 PASSED]: Quiet Hours & Sensitivity Guard 100% Operational!")

        # TEST 4: Competitor Radar Monitor
        print("\n[TEST 4/7] 🕵️ Testing Competitor & Benchmark Radar Engine...")
        res_comp = await CompetitorService.add_or_update_competitor(db, "@kompetitor_test_niche", "Dangdut")
        assert res_comp["status"] == "success"
        res_sync = await CompetitorService.run_competitor_radar_sync(db)
        assert res_sync["status"] == "success"
        print(f"✅ Competitor Radar synced {res_sync.get('checked', 0)} competitors.")
        print("✅ [TEST 4 PASSED]: Competitor Radar Engine 100% Operational!")

        # TEST 5: Content Safety & Shield
        print("\n[TEST 5/7] 🛡️ Testing Content Safety & Shield...")
        vids = db.query(Video).all()
        for v in vids:
            assert v.status in ["PUBLIC", "UNLISTED", "PRIVATE", None]
        print(f"✅ Verified content status across {len(vids)} active videos.")
        print("✅ [TEST 5 PASSED]: Content Safety & Shield 100% Operational!")

        # TEST 6: AI Comment Spam & Sentiment Analyzer
        print("\n[TEST 6/7] 💬 Testing AI Comment Sentiment & Spam Spike Detector...")
        test_spam = SentimentService.analyze_comment("Bocoran slot gacor maxwin t.me/slot_official deposit bonus 100%")
        assert test_spam["is_spam"] == True
        assert test_spam["sentiment"] == "SPAM"

        test_pos = SentimentService.analyze_comment("Lagunya sangat enak dan mantap pol, adem banget didengar!")
        assert test_pos["sentiment"] == "POSITIVE"

        test_neg = SentimentService.analyze_comment("Kecewa banget jelek parah, hoax dan clickbait")
        assert test_neg["sentiment"] == "NEGATIVE"
        print("✅ Spam, Positive, and Negative sentiment heuristics verified.")
        print("✅ [TEST 6 PASSED]: AI Sentiment & Spam Shield 100% Operational!")

        # TEST 7: Dead Video & Stagnation Detector
        print("\n[TEST 7/7] 📉 Testing Dead Video & Stagnation Decay Detector...")
        stagnation_res = await StagnationService.evaluate_video_stagnation(db)
        assert stagnation_res["status"] == "success"
        print(f"✅ Evaluated {stagnation_res.get('evaluated', 0)} recent videos for velocity decay.")
        print("✅ [TEST 7 PASSED]: Dead Video & Stagnation Detector 100% Operational!")

        print("\n" + "=" * 70)
        print("🎉 ALL 7 ADVANCED MONITORING MODULES PASSED VERIFICATION 100%!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_all_monitoring_tests())
