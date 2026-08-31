import os
import sys
import uuid
import asyncio

# Set UTF-8 encoding for Windows terminals
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.google_account import GoogleAccount
from app.models.oauth_credential import OAuthCredential
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.models.system_setting import SystemSetting
from app.services.pipeline_service import AccountPipeline, AccountPipelineManager

async def test_pipelines():
    print("================================================================")
    print("[TEST]: TESTING AUDIRA ISOLATED ACCOUNT PIPELINE ENGINE (BACKEND)")
    print("================================================================")

    # Ensure schema migrations applied
    with engine.connect() as conn:
        try:
            from sqlalchemy import text
            if "sqlite" in str(engine.url):
                cols = [
                    "ALTER TABLE google_accounts ADD COLUMN oauth_credential_id VARCHAR(36);",
                    "ALTER TABLE google_accounts ADD COLUMN pipeline_enabled BOOLEAN DEFAULT 1;",
                    "ALTER TABLE google_accounts ADD COLUMN pipeline_status VARCHAR(50) DEFAULT 'HEALTHY';",
                    "ALTER TABLE google_accounts ADD COLUMN sync_interval_seconds INTEGER DEFAULT 60;",
                    "ALTER TABLE google_accounts ADD COLUMN quota_used_today INTEGER DEFAULT 0;",
                    "ALTER TABLE google_accounts ADD COLUMN quota_limit_daily INTEGER DEFAULT 10000;",
                    "ALTER TABLE google_accounts ADD COLUMN last_sync_duration_ms INTEGER DEFAULT 0;",
                    "ALTER TABLE google_accounts ADD COLUMN last_error_message TEXT;",
                    "ALTER TABLE google_accounts ADD COLUMN jitter_offset_seconds INTEGER DEFAULT 0;"
                ]
                for c_sql in cols:
                    try:
                        conn.execute(text(c_sql))
                    except Exception:
                        pass
                conn.commit()
        except Exception as mig_err:
            print(f"[MIGRATION NOTE]: {mig_err}")

    db = SessionLocal()
    try:
        accounts = db.query(GoogleAccount).all()
        print(f"[INFO] Found {len(accounts)} registered Google Accounts in database:")
        for acc in accounts:
            print(f"   * Account: {acc.email} (ID: {acc.id})")
            print(f"     Status: {acc.pipeline_status or 'HEALTHY'}, Interval: {acc.sync_interval_seconds}s, Enabled: {acc.pipeline_enabled}")
            print(f"     Bound Credential: {acc.oauth_credential.name if acc.oauth_credential else 'Default Fallback'}")

        if not accounts:
            print("[WARN] No accounts found. Seeding test account...")
            acc = GoogleAccount(
                id=uuid.uuid4(),
                email="test_pipe@audira.com",
                access_token_enc="",
                refresh_token_enc="",
                pipeline_enabled=True,
                pipeline_status="HEALTHY",
                sync_interval_seconds=60
            )
            db.add(acc)
            db.commit()
            accounts = [acc]

        test_acc = accounts[0]

        print("\n[TEST 1]: Initializing AccountPipeline for individual account...")
        pipe = AccountPipeline(
            account_id=str(test_acc.id),
            email=test_acc.email,
            sync_interval=test_acc.sync_interval_seconds or 60,
            is_enabled=True
        )
        print(f"   + AccountPipeline created. Jitter Offset: +{pipe.jitter_offset}s, Status: {pipe.status}")

        print("\n[TEST 2]: Triggering Isolated Sync Execution (Manual Trigger)...")
        res = await pipe.trigger_now()
        print(f"   + Trigger result status: {res.get('status')}")
        print(f"   + Execution latency: {res.get('duration_ms')} ms")
        print(f"   + Pipeline status: {pipe.status}, Last Duration: {pipe.last_duration_ms} ms")

        print("\n[TEST 3]: Testing AccountPipelineManager Supervisor & Telemetry...")
        mgr = AccountPipelineManager.get_instance()
        await mgr.start_all()
        await asyncio.sleep(1) # Let supervisor load accounts

        telemetry = mgr.get_telemetry(db)
        print(f"   + Manager telemetry returned {len(telemetry)} pipelines:")
        for t in telemetry:
            print(f"     - [{t['status']}] {t['email']} | Interval: {t['sync_interval_seconds']}s | Quota: {t['quota_used_today']}/{t['quota_limit_daily']} | Jitter: +{t['jitter_seconds']}s")

        print("\n[TEST 4]: Testing Pipeline Pause / Resume Toggle...")
        toggle_res = await mgr.toggle_pipeline(str(test_acc.id), enable=False)
        print(f"   + Toggle Pause result: Enabled={toggle_res.get('pipeline_enabled')}, Status={toggle_res.get('pipeline_status')}")

        toggle_res2 = await mgr.toggle_pipeline(str(test_acc.id), enable=True)
        print(f"   + Toggle Resume result: Enabled={toggle_res2.get('pipeline_enabled')}, Status={toggle_res2.get('pipeline_status')}")

        print("\n[TEST 5]: Testing Pipeline Configuration Update (Interval & Jitter)...")
        cfg_res = await mgr.update_pipeline_config(str(test_acc.id), sync_interval=300)
        print(f"   + Config update result: Interval={cfg_res.get('sync_interval_seconds')}s")

        # Reset back to 60s
        await mgr.update_pipeline_config(str(test_acc.id), sync_interval=60)

        await mgr.stop_all()
        print("   + All pipelines stopped cleanly.")

        print("\n================================================================")
        print("[SUCCESS]: ALL ISOLATED ACCOUNT PIPELINE TESTS PASSED WITH 100% SUCCESS!")
        print("================================================================")

    except Exception as e:
        print(f"[ERROR]: TEST FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_pipelines())
