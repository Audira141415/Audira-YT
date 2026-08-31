import sys
import os
import httpx
import asyncio

async def check():
    url = "https://www.googleapis.com/youtube/v3/channels"
    channel_ids = [
        "UCyzwQxUc3ZSmRfY9sORUeLQ", # Audira Javanese
        "UCwOvaIMKBUwifWHTA4UZcKQLg", # Audira Vibes
        "UCDujW5YBLnV1D-UU2jIR4GQ", # Audira Dangdut Lawas
        "UCNMmjoHB51J29u2LiN9VQTw", # Audira Pop
        "UCOWN15Pp3YYLM9Oc534Gsxg", # Audira Reggae
        "UCCFwWfaNyQgjaqzOIm7bVNVA", # Audira Jazz
    ]
    
    api_key = os.getenv("YOUTUBE_API_KEY")
    print(f"Testing with YOUTUBE_API_KEY: {api_key}")

    async with httpx.AsyncClient() as client:
        # 1. Try with id list
        params = {
            "part": "snippet,statistics,brandingSettings,contentDetails",
            "id": ",".join(channel_ids)
        }
        if api_key and api_key != "your_youtube_api_key_here":
            params["key"] = api_key
            
        resp = await client.get(url, params=params)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:500]}")

if __name__ == "__main__":
    asyncio.run(check())
