from fastapi import APIRouter, Request, Response, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.websocket_manager import manager
from app.services.telegram_service import TelegramService
from app.models.system_setting import SystemSetting
import os
import xml.etree.ElementTree as ET
from datetime import datetime

router = APIRouter()

# 🌐 WebSocket Endpoint for Live Real-Time Dashboard Updates
@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# 📡 Google WebSub Verification Endpoint (GET)
@router.get("/youtube")
def verify_websub(request: Request):
    query_params = request.query_params
    mode = query_params.get("hub.mode")
    challenge = query_params.get("hub.challenge")
    topic = query_params.get("hub.topic")

    print(f"[WEBSUB VERIFY]: Mode={mode}, Topic={topic}")
    if mode == "subscribe" and challenge:
        return Response(content=challenge, media_type="text/plain", status_code=200)
    return Response(content="Invalid WebSub request", status_code=400)

# 🚀 Google WebSub Push Notification Payload Endpoint (POST)
@router.post("/youtube")
async def receive_websub_notification(request: Request, db: Session = Depends(get_db)):
    body_bytes = await request.body()
    try:
        root = ET.fromstring(body_bytes)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}

        for entry in root.findall('atom:entry', ns):
            video_id = entry.find('yt:videoId', ns).text if entry.find('yt:videoId', ns) is not None else None
            channel_id = entry.find('yt:channelId', ns).text if entry.find('yt:channelId', ns) is not None else None
            title = entry.find('atom:title', ns).text if entry.find('atom:title', ns) is not None else "Video Baru"
            author_name = entry.find('atom:author/atom:name', ns).text if entry.find('atom:author/atom:name', ns) is not None else "YouTube Channel"

            if video_id:
                print(f"[WEBSUB INSTANT PUSH]: New Video Uploaded on '{author_name}' -> {title} ({video_id})")

                # 1. Broadcast Instant Event to Live Web & Desktop Dashboard
                event_data = {
                    "type": "NEW_VIDEO_UPLOAD",
                    "video_id": video_id,
                    "channel_id": channel_id,
                    "channel_name": author_name,
                    "title": title,
                    "url": f"https://youtube.com/watch?v={video_id}",
                    "timestamp": datetime.now().strftime("%H:%M:%S WIB")
                }
                await manager.broadcast(event_data)

                # 2. Trigger Telegram Instant Alert
                bot_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_BOT_TOKEN").first()
                chat_setting = db.query(SystemSetting).filter(SystemSetting.key == "TELEGRAM_CHAT_ID").first()
                tg_token = bot_setting.value if bot_setting and bot_setting.value else os.getenv("TELEGRAM_BOT_TOKEN")
                tg_chat = chat_setting.value if chat_setting and chat_setting.value else os.getenv("TELEGRAM_CHAT_ID")

                if tg_token and tg_chat:
                    msg = (
                        f"🎬 <b>AUDIRA INTEL</b> | <b>VIDEO BARU UPLOAD!</b> 🚀\n\n"
                        f"<b>📺 CHANNEL & VIDEO:</b>\n"
                        f"• <b>Channel:</b> {author_name}\n"
                        f"• <b>Judul:</b> {title}\n"
                        f"• <b>Tonton:</b> <a href=\"https://youtube.com/watch?v={video_id}\">Buka di YouTube 📺</a>\n\n"
                        f"⚡ <i>Sistem langsung mengaktifkan Adaptive 15s High-Frequency Surge Monitoring!</i>\n"
                        f"🕒 <i>{datetime.now().strftime('%d %b %Y, %H:%M')} WIB</i>"
                    )
                    await TelegramService.send_telegram_message(tg_token, tg_chat, msg)

    except Exception as e:
        print(f"[WEBSUB ERROR]: Failed to parse WebSub payload: {e}")

    return Response(content="OK", status_code=200)
