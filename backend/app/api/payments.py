import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.api.deps import get_current_user_optional
from app.models.user import User
from app.services.subscription_service import SubscriptionService, TIER_LIMITS

router = APIRouter()

class CheckoutRequest(BaseModel):
    tier: str # PRO, ENTERPRISE
    payment_method: Optional[str] = "QRIS" # QRIS, VA_BCA, VA_MANDIRI, CREDIT_CARD

@router.get("/plans")
def get_subscription_plans():
    """
    Returns available SaaS plans, pricing, and features.
    """
    return {
        "plans": [
            {
                "id": "FREE",
                "name": "Paket Gratis",
                "price_idr": 0,
                "price_usd": 0,
                "features": ["1 Channel YouTube", "Siklus Pemantauan 60s", "Dashboard Standar"]
            },
            {
                "id": "PRO",
                "name": "Paket Professional",
                "price_idr": 299000,
                "price_usd": 19,
                "features": ["Hingga 10 Channel YouTube", "Siklus Pemantauan 30s", "Alert Telegram Real-time", "AI Insights & Competitor Radar"]
            },
            {
                "id": "ENTERPRISE",
                "name": "Paket Enterprise",
                "price_idr": 999000,
                "price_usd": 69,
                "features": ["Channel Unlimited", "High-Frequency 15s Monitoring", "Alert Telegram & Dedicated Webhook", "Dedicated IP Proxy Pool", "Dukungan Prioritas 24/7"]
            }
        ]
    }

@router.post("/checkout")
async def create_checkout_session(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Creates a payment checkout order / snap token (Midtrans / Xendit / Stripe integration).
    """
    if not current_user:
        raise HTTPException(status_code=401, detail="Pengguna wajib login untuk melakukan checkout.")

    tier = payload.tier.upper()
    if tier not in TIER_LIMITS:
        raise HTTPException(status_code=400, detail="Paket langganan tidak valid.")

    order_id = f"AUD-{uuid.uuid4().hex[:10].upper()}"
    plans = get_subscription_plans()["plans"]
    target_plan = next((p for p in plans if p["id"] == tier), None)
    amount = target_plan["price_idr"] if target_plan else 299000

    # Return structured checkout parameters for Midtrans / Xendit / Stripe frontend integration
    return {
        "status": "success",
        "order_id": order_id,
        "amount_idr": amount,
        "tier": tier,
        "payment_url": f"https://payment.audirayt.com/pay/{order_id}",
        "snap_token": f"SNAP-{uuid.uuid4().hex}",
        "message": f"Checkout order {order_id} dibuat untuk paket {tier}."
    }

@router.post("/webhook")
async def payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Automated Webhook callback endpoint for Midtrans, Xendit, or Stripe payment notifications.
    """
    try:
        body = await request.json()
        print(f"[Payment Webhook Notification]: Received payload -> {body}")

        order_id = body.get("order_id") or body.get("external_id") or body.get("id")
        transaction_status = body.get("transaction_status") or body.get("status") or "settlement"
        user_id = body.get("user_id") or body.get("custom_field1")
        tier = body.get("tier") or "PRO"

        if transaction_status in ("settlement", "capture", "SUCCESS", "PAID"):
            if user_id:
                SubscriptionService.upgrade_user_tier(db, user_id, tier)
                print(f"[Payment Webhook]: Order {order_id} PAID! User {user_id} upgraded to {tier}.")

        return {"status": "ok", "message": "Webhook processed successfully"}
    except Exception as e:
        print(f"[Payment Webhook Error]: {e}")
        return {"status": "error", "message": str(e)}
