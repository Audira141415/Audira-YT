import json
import re

with open("yt_dump.html", "r", encoding="utf-8") as f:
    html = f.read()

# Find ytInitialData
# ytInitialData = {...};
match = re.search(r'ytInitialData\s*=\s*({.+?});(?:</script>|\n)', html)
if match:
    data = json.loads(match.group(1))
    print("Keys in ytInitialData:", list(data.keys()))
    
    # Let's inspect header / metadata
    header = data.get("header", {})
    metadata = data.get("metadata", {})
    
    print("\n--- HEADER KEYS ---")
    print(list(header.keys()))
    
    page_header = header.get("pageHeaderRenderer", {})
    c4_header = header.get("c4TabbedHeaderRenderer", {})
    
    if page_header:
        content = page_header.get("content", {}).get("pageHeaderViewModel", {})
        title = content.get("title", {}).get("dynamicTextViewModel", {}).get("text", {}).get("content")
        avatar = content.get("image", {}).get("decoratedAvatarViewModel", {}).get("avatar", {}).get("avatarViewModel", {}).get("image", {}).get("sources", [{}])[-1].get("url")
        banner = content.get("banner", {}).get("imageBannerViewModel", {}).get("image", {}).get("sources", [{}])[-1].get("url")
        
        # Subtitle & metadata badges (subscribers, videos)
        metadata_rows = content.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
        snippets = []
        for row in metadata_rows:
            for part in row.get("metadataParts", []):
                text = part.get("text", {}).get("content")
                if text:
                    snippets.append(text)

        print(f"TITLE: {title}")
        print(f"AVATAR: {avatar}")
        print(f"BANNER: {banner}")
        print(f"METADATA SNIPPETS: {snippets}")

    elif c4_header:
        print("C4 Title:", c4_header.get("title"))
        print("C4 Subs:", c4_header.get("subscriberCountText", {}).get("simpleText"))
    
    # Check Videos tab
    tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
    print(f"\n--- FOUND {len(tabs)} TABS ---")
    for t in tabs:
        tab_renderer = t.get("tabRenderer", {})
        print("Tab Title:", tab_renderer.get("title"))

else:
    print("ytInitialData not matched")
