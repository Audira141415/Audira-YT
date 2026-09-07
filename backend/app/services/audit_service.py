import asyncio
import httpx
import re
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import Request
from sqlalchemy.orm import Session

from app.models.login_audit import LoginAuditLog
from app.models.user import User
from app.models.system_setting import SystemSetting
from app.services.telegram_service import TelegramService

_GEO_CACHE: Dict[str, Dict[str, str]] = {}

def get_client_ip(request: Request) -> str:
    """
    Extract real client IP address considering proxy headers.
    """
    x_forwarded_for = request.headers.get("x-forwarded-for")
    if x_forwarded_for:
        # First IP in the list is the original client IP
        ips = [ip.strip() for ip in x_forwarded_for.split(",")]
        if ips:
            return ips[0]
            
    x_real_ip = request.headers.get("x-real-ip")
    if x_real_ip:
        return x_real_ip.strip()

    if request.client and request.client.host:
        return request.client.host.strip()

    return "127.0.0.1"

def parse_user_agent(user_agent_str: str) -> Dict[str, str]:
    """
    Parse User-Agent string to extract Browser, OS, and Device Type.
    """
    if not user_agent_str:
        return {"browser": "Unknown Browser", "os": "Unknown OS", "device": "Desktop"}

    ua = user_agent_str

    # Device Type
    device = "Desktop"
    if re.search(r"Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini", ua, re.IGNORECASE):
        if re.search(r"iPad|Tablet", ua, re.IGNORECASE):
            device = "Tablet"
        else:
            device = "Mobile"

    # OS Detection
    os_name = "Unknown OS"
    if "Windows NT 10.0" in ua:
        os_name = "Windows 10/11"
    elif "Windows NT 6.3" in ua:
        os_name = "Windows 8.1"
    elif "Windows NT 6.1" in ua:
        os_name = "Windows 7"
    elif "Windows" in ua:
        os_name = "Windows"
    elif "Android" in ua:
        match = re.search(r"Android\s+([0-9\.]+)", ua)
        os_name = f"Android {match.group(1)}" if match else "Android"
    elif "iPhone" in ua or "iPad" in ua:
        match = re.search(r"OS\s+([0-9_]+)", ua)
        os_name = f"iOS {match.group(1).replace('_', '.')}" if match else "iOS"
    elif "Mac OS X" in ua:
        match = re.search(r"Mac OS X\s+([0-9_\.]+)", ua)
        os_name = f"macOS {match.group(1).replace('_', '.')}" if match else "macOS"
    elif "Linux" in ua:
        os_name = "Linux"

    # Browser Detection
    browser = "Unknown Browser"
    if "Edg/" in ua or "Edge/" in ua:
        match = re.search(r"Edg[e]?\/([0-9\.]+)", ua)
        browser = f"Edge {match.group(1).split('.')[0]}" if match else "Edge"
    elif "Chrome/" in ua and "Chromium/" not in ua and "Edg/" not in ua:
        match = re.search(r"Chrome\/([0-9\.]+)", ua)
        browser = f"Chrome {match.group(1).split('.')[0]}" if match else "Chrome"
    elif "Firefox/" in ua:
        match = re.search(r"Firefox\/([0-9\.]+)", ua)
        browser = f"Firefox {match.group(1).split('.')[0]}" if match else "Firefox"
    elif "Safari/" in ua and "Chrome/" not in ua:
        match = re.search(r"Version\/([0-9\.]+)", ua)
        browser = f"Safari {match.group(1).split('.')[0]}" if match else "Safari"
    elif "OPR/" in ua or "Opera/" in ua:
        browser = "Opera"

    return {"browser": browser, "os": os_name, "device": device}

async def resolve_ip_geolocation(ip_address: str) -> Dict[str, str]:
    """
    Resolve IP address to City, Region, Country, and ISP.
    Supports in-memory caching and fallback for local IPs.
    """
    # 1. Local Network IPs
    if ip_address in ["127.0.0.1", "::1", "localhost"] or ip_address.startswith("192.168.") or ip_address.startswith("10.") or ip_address.startswith("172.16."):
        # Try fetching server's public IP location for LAN clients
        if "server_public" in _GEO_CACHE:
            return _GEO_CACHE["server_public"]
        
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get("http://ip-api.com/json/?fields=status,country,regionName,city,isp,query")
                if res.status_code == 200:
                    data = res.json()
                    if data.get("status") == "success":
                        geo = {
                            "city": data.get("city", "Jakarta"),
                            "region": data.get("regionName", "DKI Jakarta"),
                            "country": data.get("country", "Indonesia"),
                            "isp": data.get("isp", "Local Server LAN"),
                            "public_ip": data.get("query", ip_address)
                        }
                        _GEO_CACHE["server_public"] = geo
                        return geo
        except Exception:
            pass

        return {
            "city": "Jaringan Lokal (LAN)",
            "region": "Local Network",
            "country": "Indonesia",
            "isp": "Local LAN",
            "public_ip": ip_address
        }

    # 2. Check Cache for Public IP
    if ip_address in _GEO_CACHE:
        return _GEO_CACHE[ip_address]

    # 3. Contact Public Geolocation API
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"http://ip-api.com/json/{ip_address}?fields=status,country,regionName,city,isp,query")
            if res.status_code == 200:
                data = res.json()
                if data.get("status") == "success":
                    geo = {
                        "city": data.get("city", "Unknown City"),
                        "region": data.get("regionName", "Unknown Region"),
                        "country": data.get("country", "Unknown Country"),
                        "isp": data.get("isp", "Unknown ISP"),
                        "public_ip": data.get("query", ip_address)
                    }
                    _GEO_CACHE[ip_address] = geo
                    return geo
    except Exception as e:
        print(f"[GEO ERROR]: Failed to resolve IP {ip_address}: {e}")

    return {
        "city": "Unknown City",
        "region": "Unknown Region",
        "country": "Unknown Country",
        "isp": "Unknown ISP",
        "public_ip": ip_address
    }

async def record_login_audit_event(
    db: Session,
    request: Request,
    email: str,
    user: Optional[User] = None,
    status: str = "SUCCESS",
    failure_reason: Optional[str] = None
) -> LoginAuditLog:
    """
    Record a login attempt (SUCCESS or FAILED) to database and trigger Telegram notification alert.
    """
    ip_addr = get_client_ip(request)
    ua_header = request.headers.get("user-agent", "")
    ua_info = parse_user_agent(ua_header)
    geo_info = await resolve_ip_geolocation(ip_addr)

    role = user.role if user else ("SUPERADMIN" if "audira" in email.lower() else "USER")

    audit_entry = LoginAuditLog(
        user_id=user.id if user else None,
        email=email.strip(),
        role=role,
        ip_address=ip_addr,
        city=geo_info.get("city", "Unknown City"),
        region=geo_info.get("region", "Unknown Region"),
        country=geo_info.get("country", "Unknown Country"),
        isp=geo_info.get("isp", "Unknown ISP"),
        user_agent=ua_header,
        browser=ua_info.get("browser", "Unknown Browser"),
        os=ua_info.get("os", "Unknown OS"),
        device_type=ua_info.get("device", "Desktop"),
        status=status,
        failure_reason=failure_reason
    )

    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)

    # Trigger Async Telegram Security Alert
    asyncio.create_task(_send_telegram_login_alert(db, audit_entry))

    return audit_entry

async def _send_telegram_login_alert(db: Session, audit: LoginAuditLog):
    """
    Send formatted Telegram alert to Superadmin upon login event.
    """
    try:
        bot_token_setting = db.query(SystemSetting).filter(SystemSetting.key == "telegram_bot_token").first()
        chat_id_setting = db.query(SystemSetting).filter(SystemSetting.key == "telegram_chat_id").first()

        bot_token = bot_token_setting.value if bot_token_setting and bot_token_setting.value else None
        chat_id = chat_id_setting.value if chat_id_setting and chat_id_setting.value else None

        if not bot_token or not chat_id:
            return

        wib_time = (audit.created_at or datetime.now(timezone.utc)).astimezone(timezone(timedelta(hours=7))).strftime("%Y-%m-%d %H:%M:%S WIB")

        status_emoji = "🚨 LOGIN SUCCESS" if audit.status == "SUCCESS" else "⚠️ LOGIN FAILED"
        
        message = (
            f"<b>{status_emoji} — AUDIRA SECURITY MONITOR</b>\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"<b>👤 Email:</b> <code>{audit.email}</code> ({audit.role})\n"
            f"<b>📍 Lokasi Kota:</b> <b>{audit.city}</b>, {audit.country}\n"
            f"<b>🌐 IP Address:</b> <code>{audit.ip_address}</code> ({audit.isp})\n"
            f"<b>💻 Perangkat:</b> {audit.device_type} • {audit.browser} ({audit.os})\n"
            f"<b>🕒 Waktu Login:</b> {wib_time}\n"
        )
        if audit.status == "FAILED" and audit.failure_reason:
            message += f"<b>❌ Detail Error:</b> {audit.failure_reason}\n"

        message += "━━━━━━━━━━━━━━━━━━━━━\n<i>Audira Intelligence Security System 2.0</i>"

        await TelegramService.send_telegram_message(bot_token, chat_id, message)
    except Exception as e:
        print(f"[AUDIT TELEGRAM ALERT ERROR]: {e}")
