import httpx
import re
import json
import asyncio

async def test_exact_real_cids():
    exact_cids = {
        "Audira Vibes": "UCwOvaiMXBUwWHTA4UZcKOLg",
        "Audira Dangdut Lawas": "UCdujW5YBLnV10-UU2jIR4GQ",
        "Audira Javanese": "UCyzwQxUc3ZSmR1Y9s0RUeLQ",
        "Audira Pop": "UCNMjoH851JZ9u2LIjN9VQTw",
        "Audira Reggae": "UC0Wn15Pp3YYLM90e534Gsxg",
        "Audira Jazz Lounge": "UCcFwWfaNyQgjqzQIm7bVNVA",
    }
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        for name, cid in exact_cids.items():
            url = f"https://www.youtube.com/channel/{cid}"
            resp = await client.get(url, headers=headers)
            print(f"[{name}] ID: {cid} | HTTP Status: {resp.status_code} | Final URL: {resp.url}")

if __name__ == "__main__":
    asyncio.run(test_exact_real_cids())
