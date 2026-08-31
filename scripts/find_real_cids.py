import httpx
import re
import json
import asyncio

async def get_real_channel_ids_from_handles():
    handles = [
        "@AudiraVibes",
        "@AudiraDangdutLawas",
        "@AudiraJavanese",
        "@AudiraPop",
        "@AudiraReggae",
        "@AudiraJazzLounge"
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        for h in handles:
            url = f"https://www.youtube.com/{h}"
            resp = await client.get(url, headers=headers)
            html = resp.text
            
            # 1. Look for channelId in meta tags or JSON
            # <meta itemprop="channelId" content="UC...">
            # "externalId":"UC..."
            # "browseId":"UC..."
            cid_match = (
                re.search(r'<meta itemprop="channelId" content="([^"]+)">', html) or
                re.search(r'"externalId":"(UC[^"]+)"', html) or
                re.search(r'"channelId":"(UC[^"]+)"', html) or
                re.search(r'"browseId":"(UC[^"]+)"', html)
            )
            
            cid = cid_match.group(1) if cid_match else "NOT_FOUND"
            
            # Find channel title
            title_match = (
                re.search(r'<meta property="og:title" content="([^"]+)">', html) or
                re.search(r'<title>([^<]+)</title>', html)
            )
            title = title_match.group(1) if title_match else "UNKNOWN"
            
            # Find avatar
            avatar_match = re.search(r'<meta property="og:image" content="([^"]+)">', html)
            avatar = avatar_match.group(1) if avatar_match else ""
            
            print(f"Handle: {h.ljust(20)} | Real Channel ID: {cid.ljust(26)} | Title: {title}")

if __name__ == "__main__":
    asyncio.run(get_real_channel_ids_from_handles())
