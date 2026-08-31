import httpx
import re
import json
import asyncio

async def fetch_channel_public(channel_id):
    url = f"https://www.youtube.com/channel/{channel_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
        print(f"[{channel_id}] HTTP Status: {resp.status_code}")
        if resp.status_code != 200:
            return None
        
        html = resp.text
        # Extract ytInitialData
        match = re.search(r'var ytInitialData = ({.+?});</script>', html)
        if not match:
            match = re.search(r'ytInitialData\s*=\s*({.+?});', html)
        
        if match:
            try:
                raw_json = match.group(1)
                data = json.loads(raw_json)
                metadata = data.get("metadata", {}).get("channelMetadataRenderer", {})
                header = data.get("header", {}).get("c4TabbedHeaderRenderer", {}) or data.get("header", {}).get("pageHeaderRenderer", {})
                
                title = metadata.get("title")
                avatar = metadata.get("avatar", {}).get("thumbnails", [{}])[-1].get("url")
                
                # Check banner
                banner = ""
                if "banner" in header:
                    banner = header.get("banner", {}).get("image", {}).get("thumbnails", [{}])[-1].get("url", "")
                elif "content" in header: # pageHeaderRenderer
                    banner = header.get("content", {}).get("pageHeaderViewModel", {}).get("banner", {}).get("imageBannerViewModel", {}).get("image", {}).get("sources", [{}])[-1].get("url", "")

                print(f"  • Title: {title}")
                print(f"  • Avatar: {avatar}")
                print(f"  • Banner: {banner}")
                
                return {"title": title, "avatar": avatar, "banner": banner}
            except Exception as e:
                print(f"JSON Parse Error: {e}")
        else:
            print("No match found")

async def main():
    channels = [
        "UCyzwQxUc3ZSmRfY9sORUeLQ", # Audira Javanese
        "UCDujW5YBLnV1D-UU2jIR4GQ", # Audira Dangdut Lawas
        "UCwOvaIMKBUwifWHTA4UZcKQLg" # Audira Vibes
    ]
    for cid in channels:
        print("="*50)
        await fetch_channel_public(cid)

if __name__ == "__main__":
    asyncio.run(main())
