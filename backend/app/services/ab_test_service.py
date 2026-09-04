import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.ab_test import ThumbnailABTest
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video

SEO_TITLE_TEMPLATES = {
    "DANGDUT": [
        "{seed} - Full Bass Horeg Glerr Mantap (Official Music Video)",
        "VIRAL TIKTOK! {seed} (Cover Versi Akustik Santai)",
        "{seed} - Tembang Lawas Paling Syahdu Bikin Adem Hati",
        "Enak Buat Santai! {seed} - Dangdut Koplo Terbaru 2026",
        "{seed} (Lirik & Chord) - Suara Merdu Tiada Tanding"
    ],
    "POP": [
        "{seed} - Official Lyric Video (Bikin Baper)",
        "LAGU TERBARU 2026: {seed} (Acoustic Chill Vibes)",
        "{seed} - Lagu Pop Indonesia Paling Enak Didengar Waktu Kerja",
        "Viral di Medsos! {seed} - Nada Manis Teman Senja",
        "{seed} - Versi Live Session Suara Jernih HD"
    ],
    "JAVANESE": [
        "{seed} - Tembang Campursari Syahdu Gayeng",
        "Laras Hati: {seed} (Langit Mendhung Sedih - Versi Gendhing)",
        "{seed} - Lagu Jawa Paling Populer Bikin Tentrem",
        "VIRAL! {seed} - Sworo Merdu Bikin Trenyuh Ing Manah",
        "{seed} (Full Album Tembang Kenangan Jawa)"
    ],
    "GENERAL": [
        "{seed} - Audio HQ Jernih (Dengarkan Pakai Headphone)",
        "{seed} - Official Track Release 2026",
        "Paling Banyak Dicari! {seed} (Versi Terlengkap)",
        "{seed} - Lagu Santai Buat Teman Nyetir & Ngopi",
        "{seed} - Trending Hits Indonesia"
    ]
}

class ABTestService:
    @staticmethod
    def get_ab_tests(db: Session, channel_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(ThumbnailABTest)
        if channel_id and channel_id != "ALL":
            try:
                ch_uuid = uuid.UUID(channel_id)
                query = query.filter(ThumbnailABTest.channel_id == ch_uuid)
            except Exception:
                pass
        
        tests = query.order_by(ThumbnailABTest.created_at.desc()).all()
        
        if not tests:
            # Seed sample A/B test for visual presentation
            ch = db.query(YouTubeChannel).first()
            if ch:
                sample_test = ThumbnailABTest(
                    id=uuid.uuid4(),
                    video_id="sample_vid_ab",
                    channel_id=ch.id,
                    title="Tiara - Bunga Pantura (Official Music Video)",
                    thumbnail_a_url="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60",
                    thumbnail_b_url="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60",
                    active_variant="B",
                    views_a=4200,
                    views_b=6850,
                    impressions_a=85000,
                    impressions_b=92000,
                    ctr_a=4.9,
                    ctr_b=7.4,
                    rotator_interval_hours=24,
                    status="RUNNING"
                )
                db.add(sample_test)
                db.commit()
                tests = [sample_test]

        results = []
        for t in tests:
            ch_name = t.channel.name if t.channel else "Audira Channel"
            results.append({
                "id": str(t.id),
                "video_id": t.video_id,
                "title": t.title,
                "channel_name": ch_name,
                "thumbnail_a_url": t.thumbnail_a_url,
                "thumbnail_b_url": t.thumbnail_b_url,
                "active_variant": t.active_variant,
                "views_a": t.views_a,
                "views_b": t.views_b,
                "ctr_a": t.ctr_a,
                "ctr_b": t.ctr_b,
                "rotator_interval_hours": t.rotator_interval_hours,
                "status": t.status,
                "winner_variant": "B" if t.ctr_b > t.ctr_a else "A",
                "created_at": t.created_at.strftime("%b %d, %Y") if t.created_at else "-"
            })
        return results

    @staticmethod
    def create_ab_test(
        db: Session,
        channel_id: str,
        video_title: str,
        thumbnail_a_url: str,
        thumbnail_b_url: str,
        video_id: Optional[str] = None,
        rotator_interval_hours: int = 24
    ) -> Dict[str, Any]:
        ch = None
        try:
            ch = db.query(YouTubeChannel).filter(YouTubeChannel.id == uuid.UUID(channel_id)).first()
        except Exception:
            ch = db.query(YouTubeChannel).first()

        if not ch:
            return {"status": "ERROR", "message": "Channel tidak ditemukan."}

        new_t = ThumbnailABTest(
            id=uuid.uuid4(),
            video_id=video_id or f"vid_{uuid.uuid4().hex[:8]}",
            channel_id=ch.id,
            title=video_title.strip(),
            thumbnail_a_url=thumbnail_a_url.strip(),
            thumbnail_b_url=thumbnail_b_url.strip(),
            active_variant="A",
            views_a=0,
            views_b=0,
            impressions_a=100,
            impressions_b=100,
            ctr_a=5.0,
            ctr_b=5.0,
            rotator_interval_hours=rotator_interval_hours or 24,
            status="RUNNING"
        )
        db.add(new_t)
        db.commit()
        db.refresh(new_t)

        return {
            "status": "SUCCESS",
            "message": f"Eksperimen A/B Thumbnail untuk '{video_title}' berhasil dimulai!",
            "test_id": str(new_t.id)
        }

    @staticmethod
    def generate_seo_titles(seed_keyword: str, genre: str = "DANGDUT") -> Dict[str, Any]:
        """
        Generate high-CTR, SEO-optimized title suggestions for Indonesian YouTube algorithms.
        """
        clean_seed = seed_keyword.strip() if seed_keyword else "Lagu Hits Terbaru"
        cat = genre.upper() if genre.upper() in SEO_TITLE_TEMPLATES else "GENERAL"
        templates = SEO_TITLE_TEMPLATES[cat]

        suggestions = [t.format(seed=clean_seed) for t in templates]

        recommended_tags = [
            f"#{clean_seed.replace(' ', '')}",
            "#MusikIndonesia2026",
            "#LaguViral",
            "#TrendingYouTube",
            f"#{genre.title()}Terbaru",
            "#AudiraMusic",
            "#FullBassGlerr",
            "#LaguSantai"
        ]

        return {
            "status": "SUCCESS",
            "seed_keyword": clean_seed,
            "genre": genre,
            "suggestions": suggestions,
            "recommended_tags": recommended_tags
        }

    @staticmethod
    def rotate_test(db: Session, test_id: str) -> Dict[str, Any]:
        test = None
        try:
            test = db.query(ThumbnailABTest).filter(ThumbnailABTest.id == uuid.UUID(test_id)).first()
        except Exception:
            pass
        if not test:
            return {"status": "ERROR", "message": "Test A/B tidak ditemukan."}

        new_variant = "B" if test.active_variant == "A" else "A"
        test.active_variant = new_variant
        # Simulate slight CTR & impressions boost on rotation
        if new_variant == "B":
            test.views_b += random.randint(150, 450)
            test.ctr_b = round(min(12.5, test.ctr_b + random.uniform(0.2, 0.6)), 1)
        else:
            test.views_a += random.randint(100, 350)
            test.ctr_a = round(min(12.5, test.ctr_a + random.uniform(0.1, 0.4)), 1)

        db.commit()
        return {
            "status": "SUCCESS",
            "message": f"Varian aktif berhasil dirotasi ke Varian {new_variant}!",
            "active_variant": new_variant
        }

    @staticmethod
    def declare_winner(db: Session, test_id: str, winner_variant: str) -> Dict[str, Any]:
        test = None
        try:
            test = db.query(ThumbnailABTest).filter(ThumbnailABTest.id == uuid.UUID(test_id)).first()
        except Exception:
            pass
        if not test:
            return {"status": "ERROR", "message": "Test A/B tidak ditemukan."}

        test.status = "COMPLETED"
        test.active_variant = winner_variant
        db.commit()
        return {
            "status": "SUCCESS",
            "message": f"Varian {winner_variant} resmi ditetapkan sebagai Pemenang Utama!",
            "winner_variant": winner_variant
        }

    @staticmethod
    def delete_test(db: Session, test_id: str) -> Dict[str, Any]:
        test = None
        try:
            test = db.query(ThumbnailABTest).filter(ThumbnailABTest.id == uuid.UUID(test_id)).first()
        except Exception:
            pass
        if not test:
            return {"status": "ERROR", "message": "Test A/B tidak ditemukan."}

        db.delete(test)
        db.commit()
        return {"status": "SUCCESS", "message": "Eksperimen A/B berhasil dihapus."}
