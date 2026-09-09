from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.user import User

TIER_LIMITS = {
    "FREE": {
        "max_channels": 1,
        "sync_interval_seconds": 60,
        "telegram_alerts": False,
        "ai_insights": False,
        "name": "Paket Gratis"
    },
    "PRO": {
        "max_channels": 10,
        "sync_interval_seconds": 30,
        "telegram_alerts": True,
        "ai_insights": True,
        "name": "Paket Professional"
    },
    "ENTERPRISE": {
        "max_channels": 9999,
        "sync_interval_seconds": 15,
        "telegram_alerts": True,
        "ai_insights": True,
        "name": "Paket Enterprise"
    }
}

class SubscriptionService:
    @staticmethod
    def get_user_tier(user: User) -> str:
        if not user:
            return "FREE"
        role = (getattr(user, "role", "") or "").upper()
        if role in ("SUPERADMIN", "ENTERPRISE"):
            return "ENTERPRISE"
        return getattr(user, "tier", None) or "PRO" if role == "ADMIN" else "FREE"

    @staticmethod
    def get_tier_features(tier_name: str) -> Dict[str, Any]:
        return TIER_LIMITS.get(tier_name.upper(), TIER_LIMITS["FREE"])

    @staticmethod
    def upgrade_user_tier(db: Session, user_id: str, new_tier: str) -> bool:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        user.tier = new_tier.upper()
        db.commit()
        print(f"[SubscriptionService]: Upgraded user {user.email} to tier '{user.tier}'")
        return True
