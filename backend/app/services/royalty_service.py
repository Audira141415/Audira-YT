import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.models.royalty import RoyaltyContract, RoyaltyPayout
from app.models.youtube_channel import YouTubeChannel
from app.models.video import Video
from app.services.revenue_service import RevenueService

class RoyaltyService:
    @staticmethod
    def get_contracts(db: Session, channel_id: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(RoyaltyContract)
        if channel_id and channel_id != "ALL":
            try:
                ch_uuid = uuid.UUID(channel_id)
                query = query.filter(RoyaltyContract.channel_id == ch_uuid)
            except Exception:
                pass
        
        contracts = query.order_by(RoyaltyContract.created_at.desc()).all()
        
        # If empty, seed realistic initial contracts for Audira music label channels
        if not contracts:
            channels = db.query(YouTubeChannel).all()
            sample_artists = [
                ("Audira Dangdut Lawas", "Bunga Pantura - Tiara", "Siti Rahmawati", 50.0, 30.0, 20.0),
                ("Audira Javanese", "Langit Mendhung Sedih", "Dimas Prasetyo", 45.0, 35.0, 20.0),
                ("Audira Pop", "Kisah Tanpa Suara (Acoustic)", "Nadia Putri", 50.0, 35.0, 15.0),
                ("Audira Vibes", "Midnight Chill in Jogja", "Audira Collective", 60.0, 25.0, 15.0),
                ("Audira Reggae", "Pantai Tropis Senja", "Ras Denny & Friends", 50.0, 30.0, 20.0),
            ]
            for ch_name, track, artist, l_pct, a_pct, p_pct in sample_artists:
                target_ch = next((c for c in channels if ch_name.lower() in c.name.lower()), channels[0] if channels else None)
                if target_ch:
                    c_new = RoyaltyContract(
                        id=uuid.uuid4(),
                        channel_id=target_ch.id,
                        track_title=track,
                        artist_name=artist,
                        artist_email=f"{artist.lower().replace(' ', '')}@audira-music.com",
                        label_share_pct=l_pct,
                        artist_share_pct=a_pct,
                        producer_share_pct=p_pct,
                        status="ACTIVE"
                    )
                    db.add(c_new)
            db.commit()
            contracts = db.query(RoyaltyContract).all()

        results = []
        for c in contracts:
            ch_name = c.channel.name if c.channel else "Audira Channel"
            results.append({
                "id": str(c.id),
                "channel_id": str(c.channel_id),
                "channel_name": ch_name,
                "video_id": c.video_id,
                "track_title": c.track_title,
                "artist_name": c.artist_name,
                "artist_email": c.artist_email or "-",
                "label_share_pct": c.label_share_pct,
                "artist_share_pct": c.artist_share_pct,
                "producer_share_pct": c.producer_share_pct,
                "status": c.status,
                "notes": c.notes or "",
                "created_at": c.created_at.strftime("%b %d, %Y") if c.created_at else "-"
            })
        return results

    @staticmethod
    def create_contract(
        db: Session,
        channel_id: str,
        track_title: str,
        artist_name: str,
        artist_email: Optional[str] = None,
        label_share_pct: float = 50.0,
        artist_share_pct: float = 30.0,
        producer_share_pct: float = 20.0,
        video_id: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        ch = None
        try:
            ch = db.query(YouTubeChannel).filter(YouTubeChannel.id == uuid.UUID(channel_id)).first()
        except Exception:
            ch = db.query(YouTubeChannel).filter(
                (YouTubeChannel.channel_id == channel_id) | (YouTubeChannel.name.ilike(channel_id))
            ).first()
        
        if not ch:
            ch = db.query(YouTubeChannel).first()

        if not ch:
            return {"status": "ERROR", "message": "Channel tidak ditemukan."}

        # Normalize percentages
        total_pct = label_share_pct + artist_share_pct + producer_share_pct
        if abs(total_pct - 100.0) > 0.01:
            # Re-scale to 100%
            label_share_pct = round((label_share_pct / total_pct) * 100.0, 1)
            artist_share_pct = round((artist_share_pct / total_pct) * 100.0, 1)
            producer_share_pct = round(100.0 - label_share_pct - artist_share_pct, 1)

        new_c = RoyaltyContract(
            id=uuid.uuid4(),
            channel_id=ch.id,
            video_id=video_id,
            track_title=track_title.strip(),
            artist_name=artist_name.strip(),
            artist_email=artist_email.strip() if artist_email else f"{artist_name.lower().replace(' ', '')}@audira-music.com",
            label_share_pct=label_share_pct,
            artist_share_pct=artist_share_pct,
            producer_share_pct=producer_share_pct,
            status="ACTIVE",
            notes=notes
        )
        db.add(new_c)
        db.commit()
        db.refresh(new_c)

        return {
            "status": "SUCCESS",
            "message": f"Kontrak bagi hasil untuk '{track_title}' ({artist_name}) berhasil dibuat!",
            "contract_id": str(new_c.id)
        }

    @staticmethod
    def calculate_monthly_statements(db: Session, period: str = "2026-08") -> Dict[str, Any]:
        contracts = db.query(RoyaltyContract).filter(RoyaltyContract.status == "ACTIVE").all()
        statements = []

        total_gross_idr = 0
        total_label_idr = 0
        total_artist_idr = 0
        total_producer_idr = 0

        for c in contracts:
            ch = c.channel
            rpm = RevenueService.get_channel_rpm(db, ch.name if ch else "")
            
            # Find video views or estimate track views
            track_views = 0
            if c.video_id:
                v = db.query(Video).filter(Video.video_id == c.video_id).first()
                if v:
                    track_views = v.view_count or 0
            if track_views == 0 and ch:
                track_views = int((ch.baseline_views_24h or 15000) * 0.35)

            # Revenue in IDR
            gross_idr = int((track_views / 1000.0) * rpm)
            label_idr = int(gross_idr * (c.label_share_pct / 100.0))
            artist_idr = int(gross_idr * (c.artist_share_pct / 100.0))
            producer_idr = int(gross_idr * (c.producer_share_pct / 100.0))

            total_gross_idr += gross_idr
            total_label_idr += label_idr
            total_artist_idr += artist_idr
            total_producer_idr += producer_idr

            statements.append({
                "contract_id": str(c.id),
                "track_title": c.track_title,
                "artist_name": c.artist_name,
                "channel_name": ch.name if ch else "Audira Channel",
                "period": period,
                "views": track_views,
                "rpm_idr": rpm,
                "gross_revenue_idr": gross_idr,
                "label_share_pct": c.label_share_pct,
                "label_payout_idr": label_idr,
                "artist_share_pct": c.artist_share_pct,
                "artist_payout_idr": artist_idr,
                "producer_share_pct": c.producer_share_pct,
                "producer_payout_idr": producer_idr,
                "payment_status": "PAID"
            })

        return {
            "status": "SUCCESS",
            "period": period,
            "total_contracts": len(contracts),
            "summary": {
                "total_gross_idr": total_gross_idr,
                "total_label_idr": total_label_idr,
                "total_artist_idr": total_artist_idr,
                "total_producer_idr": total_producer_idr,
            },
            "statements": statements
        }
