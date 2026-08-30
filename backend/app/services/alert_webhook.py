import os
import logging
import httpx
from datetime import datetime

logger = logging.getLogger("audira.alert")

async def send_system_alert(title: str, message: str, level: str = "WARNING"):
    """
    Sends structured system alert notifications via Discord/Telegram Webhook
    or fallback logging if Webhook URL is not configured.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_msg = f"[{level}] [{timestamp}] {title}\n{message}"
    
    logger.warning(f"SYSTEM ALERT triggered: {formatted_msg}")

    webhook_url = os.getenv("ALERT_WEBHOOK_URL")
    if not webhook_url:
        return False

    payload = {
        "content": f"🚨 **AUDIRA-YT MONITOR ALERT** 🚨\n**Level**: `{level}`\n**Title**: `{title}`\n**Time**: `{timestamp}`\n```\n{message}\n```"
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(webhook_url, json=payload)
            return resp.status_code < 400
    except Exception as e:
        logger.error(f"Failed to dispatch alert webhook: {e}")
        return False
