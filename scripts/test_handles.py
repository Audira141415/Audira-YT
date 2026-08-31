import httpx
import asyncio

async def search_handles():
    handles = [
        "@AudiraVibes",
        "@audiravibes",
        "@AudiraDangdutLawas",
        "@audiradangdutlawas",
        "@AudiraJavanese",
        "@audirajavanese",
        "@AudiraPop",
        "@audirapop",
        "@AudiraReggae",
        "@audirareggae",
        "@AudiraJazzLounge",
        "@audirajazzlounge"
    ]
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=10.0) as client:
        for h in handles:
            url = f"https://www.youtube.com/{h}"
            resp = await client.get(url, headers=headers)
            print(f"[{h}] Status: {resp.status_code} | Final URL: {resp.url}")

if __name__ == "__main__":
    asyncio.run(search_handles())
