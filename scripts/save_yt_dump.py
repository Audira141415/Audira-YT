import httpx
import asyncio

async def save_html():
    url = "https://www.youtube.com/channel/UCDujW5YBLnV1D-UU2jIR4GQ"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
        with open("yt_dump.html", "w", encoding="utf-8") as f:
            f.write(resp.text)
        print("Saved yt_dump.html with length:", len(resp.text))

if __name__ == "__main__":
    asyncio.run(save_html())
