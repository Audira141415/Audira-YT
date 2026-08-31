import httpx
import re
import json
import asyncio

async def inspect_channel(channel_id):
    url = f"https://www.youtube.com/channel/{channel_id}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
        print(f"Final URL: {resp.url}")
        html = resp.text
        
        # Look for og:title, og:image
        og_title = re.search(r'<meta property="og:title" content="(.*?)">', html)
        og_image = re.search(r'<meta property="og:image" content="(.*?)">', html)
        og_desc = re.search(r'<meta property="og:description" content="(.*?)">', html)
        
        print("og:title:", og_title.group(1) if og_title else "N/A")
        print("og:image:", og_image.group(1) if og_image else "N/A")
        print("og:desc:", og_desc.group(1) if og_desc else "N/A")

        # Let's search for subscriberCountText or viewCountText or subscriber count
        subs_match = re.search(r'"subscriberCountText":\s*\{"simpleText":\s*"([^"]+)"\}', html) or re.search(r'"subscriberCountText":\s*\{"accessibility":\{"accessibilityData":\{"label":"([^"]+)"\}\}\}', html)
        print("Subs Match:", subs_match.group(1) if subs_match else "N/A")

        # Let's search for video count or videos
        vid_match = re.search(r'"videoCountText":\s*\{"runs":\[\{"text":"([^"]+)"\}\]\}', html)
        print("Video Count:", vid_match.group(1) if vid_match else "N/A")

if __name__ == "__main__":
    asyncio.run(inspect_channel("UCDujW5YBLnV1D-UU2jIR4GQ"))
