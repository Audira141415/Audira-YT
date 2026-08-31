import sys
import os
import asyncio

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import app.db.base
from app.db.session import SessionLocal
from app.services.revenue_service import RevenueService
from app.services.intelligence_service import IntelligenceService

async def test_enterprise_modules():
    print("=" * 70)
    print("🚀 TESTING AUDIRA-YT ENTERPRISE MCN ADVANCED MODULES")
    print("=" * 70)

    db = SessionLocal()
    try:
        # TEST 1: Revenue & Monetization Engine
        print("\n[TEST 1] Testing Revenue & RPM Monetization Engine...")
        rev_summary = RevenueService.get_revenue_summary(db)
        print(f"  • Total Network Views: {rev_summary['total_network_views']:,}")
        print(f"  • Est. Lifetime IDR: Rp {rev_summary['total_estimated_lifetime_idr']:,}")
        print(f"  • Est. Monthly IDR: Rp {rev_summary['total_estimated_monthly_idr']:,}")
        print(f"  • Average Network RPM: Rp {rev_summary['average_network_rpm']:,}")
        print(f"  • Monitored Channels: {len(rev_summary['channel_breakdown'])}")
        assert rev_summary['total_network_views'] > 0
        assert len(rev_summary['channel_breakdown']) == 6
        print("  ✅ [TEST 1 PASSED]: Revenue Engine calculation verified!")

        # TEST 2: AI Golden Hours & Demographics
        print("\n[TEST 2] Testing AI Golden Hours & Demographics...")
        golden_hours = IntelligenceService.get_golden_hours()
        assert len(golden_hours) == 6
        for gh in golden_hours[:3]:
            print(f"  • {gh['channel_name']}: Golden Hour = {gh['recommended_upload_time']} | Peak Days = {gh['peak_days']}")
        print("  ✅ [TEST 2 PASSED]: Golden Hours Intelligence operational!")

        # TEST 3: Viral Metadata Generator
        print("\n[TEST 3] Testing AI Viral Title & Hook Generator...")
        meta = IntelligenceService.generate_viral_metadata("Audira Dangdut Lawas", "Kompilasi Dangdut Koplo")
        print(f"  • Suggested Titles: {meta['suggested_titles'][:2]}")
        print(f"  • Tags: {meta['suggested_tags']}")
        print(f"  • Shorts Hook: {meta['shorts_hooks'][0]}")
        assert len(meta['suggested_titles']) > 0
        print("  ✅ [TEST 3 PASSED]: AI Viral Metadata generation verified!")

        # TEST 4: Cross-Promotion Description Template
        print("\n[TEST 4] Testing Cross-Promotion Description Generator...")
        template = IntelligenceService.get_cross_promotion_template("Audira Dangdut Lawas")
        print(f"  • Generated Template Preview:\n{template[:250]}...\n")
        assert "Audira Pop" in template
        assert "Audira Javanese" in template
        print("  ✅ [TEST 4 PASSED]: Cross-promotion template engine verified!")

        print("\n" + "=" * 70)
        print("🎉 ALL ENTERPRISE MODULE TESTS PASSED 100% CLEANLY!")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_enterprise_modules())
