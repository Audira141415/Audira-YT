import httpx
import re
import json
import asyncio

async def test_full_public_extractor(cid, name):
    url = f"https://www.youtube.com/channel/{cid}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate"
    }
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        resp = await client.get(url, headers=headers)
        html = resp.text
        
        # 1. Parse meta tags
        title_m = re.search(r'<meta property="og:title" content="([^"]+)">', html)
        title = title_m.group(1) if title_m else name
        
        avatar_m = re.search(r'<meta property="og:image" content="([^"]+)">', html)
        avatar = avatar_m.group(1) if avatar_m else ""
        
        # 2. Parse ytInitialData
        match = re.search(r'ytInitialData\s*=\s*({.+?});(?:</script>|\n)', html)
        banner = ""
        subscriber_count = 0
        total_views = 0
        videos = []
        
        if match:
            try:
                data = json.loads(match.group(1))
                header = data.get("header", {})
                page_header = header.get("pageHeaderRenderer", {})
                c4_header = header.get("c4TabbedHeaderRenderer", {})
                
                if page_header:
                    content = page_header.get("content", {}).get("pageHeaderViewModel", {})
                    # Banner
                    b_sources = content.get("banner", {}).get("imageBannerViewModel", {}).get("image", {}).get("sources", [])
                    if b_sources:
                        banner = b_sources[-1].get("url", "")
                    
                    # Avatar
                    a_sources = content.get("image", {}).get("decoratedAvatarViewModel", {}).get("avatar", {}).get("avatarViewModel", {}).get("image", {}).get("sources", [])
                    if a_sources:
                        avatar = a_sources[-1].get("url", avatar)
                    
                    # Title
                    t_val = content.get("title", {}).get("dynamicTextViewModel", {}).get("text", {}).get("content")
                    if t_val:
                        title = t_val

                    # Subscribers from metadata rows
                    meta_rows = content.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
                    for row in meta_rows:
                        for part in row.get("metadataParts", []):
                            txt = part.get("text", {}).get("content", "")
                            # e.g. "No subscribers" or "1.25K subscribers" or "10 subscribers"
                            if "subscriber" in txt.lower():
                                if "no subscriber" in txt.lower():
                                    subscriber_count = 0
                                else:
                                    m_sub = re.search(r'([\d\.,]+)([kKmM]?)', txt)
                                    if m_sub:
                                        num = float(m_sub.group(1).replace(',', ''))
                                        mult = m_sub.group(2).lower()
                                        if mult == 'k': num *= 1000
                                        elif mult == 'm': num *= 1000000
                                        subscriber_count = int(num)
                
                elif c4_header:
                    if "banner" in c4_header:
                        banner = c4_header.get("banner", {}).get("image", {}).get("thumbnails", [{}])[-1].get("url", "")
                    if "avatar" in c4_header:
                        avatar = c4_header.get("avatar", {}).get("thumbnails", [{}])[-1].get("url", avatar)
                    sub_text = c4_header.get("subscriberCountText", {}).get("simpleText", "")
                    if "no subscriber" in sub_text.lower():
                        subscriber_count = 0
                    elif sub_text:
                        m_sub = re.search(r'([\d\.,]+)([kKmM]?)', sub_text)
                        if m_sub:
                            num = float(m_sub.group(1).replace(',', ''))
                            mult = m_sub.group(2).lower()
                            if mult == 'k': num *= 1000
                            elif mult == 'm': num *= 1000000
                            subscriber_count = int(num)

                # Parse videos from tabs
                tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
                for t in tabs:
                    tab_r = t.get("tabRenderer", {})
                    section_list = tab_r.get("content", {}).get("sectionListRenderer", {}).get("contents", [])
                    for s in section_list:
                        item_section = s.get("itemSectionRenderer", {}).get("contents", [])
                        for is_item in item_section:
                            grid_renderer = is_item.get("gridRenderer", {}) or is_item.get("shelfRenderer", {}).get("content", {}).get("gridRenderer", {})
                            items_v = grid_renderer.get("items", [])
                            for iv in items_v:
                                v_r = iv.get("gridVideoRenderer", {}) or iv.get("videoRenderer", {})
                                if v_r:
                                    v_id = v_r.get("videoId")
                                    v_title = v_r.get("title", {}).get("runs", [{}])[0].get("text", "") or v_r.get("title", {}).get("simpleText", "")
                                    v_views_text = v_r.get("viewCountText", {}).get("simpleText", "") or v_r.get("viewCountText", {}).get("runs", [{}])[0].get("text", "")
                                    v_views = 0
                                    m_v = re.search(r'([\d\.,]+)', v_views_text)
                                    if m_v:
                                        try:
                                            v_views = int(m_v.group(1).replace('.', '').replace(',', ''))
                                        except Exception:
                                            pass
                                    if v_id:
                                        videos.append({"id": v_id, "title": v_title, "view_count": v_views})

            except Exception as e:
                print(f"[{name}] Parse error: {e}")

        print(f"[{name}] Title: {title} | Subs: {subscriber_count} | Videos: {len(videos)} | Banner: {banner[:40] if banner else 'None'}")
        return {
            "name": title,
            "avatar": avatar,
            "banner": banner,
            "subscriber_count": subscriber_count,
            "videos": videos
        }

async def main():
    exact_cids = {
        "Audira Vibes": "UCwOvaiMXBUwWHTA4UZcKOLg",
        "Audira Dangdut Lawas": "UCdujW5YBLnV10-UU2jIR4GQ",
        "Audira Javanese": "UCyzwQxUc3ZSmR1Y9s0RUeLQ",
        "Audira Pop": "UCNMjoH851JZ9u2LIjN9VQTw",
        "Audira Reggae": "UC0Wn15Pp3YYLM90e534Gsxg",
        "Audira Jazz Lounge": "UCcFwWfaNyQgjqzQIm7bVNVA",
    }
    for name, cid in exact_cids.items():
        await test_full_public_extractor(cid, name)

if __name__ == "__main__":
    asyncio.run(main())
