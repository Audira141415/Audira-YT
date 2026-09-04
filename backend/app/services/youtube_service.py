import httpx
import os
from typing import List, Dict, Any, Optional

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

class YouTubeService:
    @staticmethod
    def _build_auth_params_and_headers(access_token: Optional[str] = None, api_key: Optional[str] = None):
        headers = {}
        params = {}
        if access_token and access_token.strip() and not access_token.startswith("encrypted_demo"):
            headers["Authorization"] = f"Bearer {access_token}"
        elif api_key and api_key.strip():
            params["key"] = api_key.strip()
        else:
            try:
                from app.db.session import SessionLocal
                from app.models.system_setting import SystemSetting
                db = SessionLocal()
                s = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
                if s and s.value and s.value.strip() and s.value != "your_youtube_api_key_here":
                    params["key"] = s.value.strip()
                db.close()
            except Exception:
                pass
            if "key" not in params:
                env_key = os.getenv("YOUTUBE_API_KEY")
                if env_key and env_key != "your_youtube_api_key_here":
                    params["key"] = env_key.strip()
        return headers, params

    @staticmethod
    async def get_channels_for_account(access_token: str) -> List[Dict[str, Any]]:
        """
        Fetch all YouTube channels owned or managed by the authenticated account (Primary + Brand Accounts).
        """
        url = f"{YOUTUBE_API_BASE}/channels"
        headers = {"Authorization": f"Bearer {access_token}"}
        channels_dict = {}

        async with httpx.AsyncClient() as client:
            # 1. Primary channel (mine=true)
            resp1 = await client.get(url, params={"part": "snippet,statistics,contentDetails,brandingSettings", "mine": "true"}, headers=headers)
            if resp1.status_code == 200:
                for item in resp1.json().get("items", []):
                    channels_dict[item["id"]] = item
            else:
                print(f"[YouTubeService] mine=true response: {resp1.text}")

            # 2. Brand / Managed channels (managedByMe=true)
            resp2 = await client.get(url, params={"part": "snippet,statistics,contentDetails,brandingSettings", "managedByMe": "true"}, headers=headers)
            if resp2.status_code == 200:
                for item in resp2.json().get("items", []):
                    channels_dict[item["id"]] = item
            else:
                print(f"[YouTubeService] managedByMe=true response: {resp2.text}")

        return list(channels_dict.values())

    @staticmethod
    async def get_videos_for_channel(access_token: Optional[str] = None, uploads_playlist_id: str = "", max_results: int = 15, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetch recent videos from a channel's uploads playlist using OAuth token or API Key.
        """
        headers, base_params = YouTubeService._build_auth_params_and_headers(access_token, api_key)
        async with httpx.AsyncClient() as client:
            # 1. Get playlist items (video IDs)
            playlist_url = f"{YOUTUBE_API_BASE}/playlistItems"
            playlist_params = {
                "part": "snippet",
                "playlistId": uploads_playlist_id,
                "maxResults": max_results,
                **base_params
            }
            resp = await client.get(playlist_url, params=playlist_params, headers=headers)
            if resp.status_code != 200:
                print(f"[YouTubeService] Failed to fetch playlist items: {resp.text}")
                return []
            
            playlist_data = resp.json()
            items = playlist_data.get("items", [])
            video_ids = [item["snippet"]["resourceId"]["videoId"] for item in items if item.get("snippet", {}).get("resourceId", {}).get("videoId")]

            if not video_ids:
                return []

            # 2. Get video details (snippet, statistics, contentDetails)
            videos_url = f"{YOUTUBE_API_BASE}/videos"
            videos_params = {
                "part": "snippet,statistics,contentDetails",
                "id": ",".join(video_ids),
                **base_params
            }
            resp_v = await client.get(videos_url, params=videos_params, headers=headers)
            if resp_v.status_code != 200:
                print(f"[YouTubeService] Failed to fetch video details: {resp_v.text}")
                return []
            
            v_data = resp_v.json()
            return v_data.get("items", [])

    @staticmethod
    async def get_channel_by_handle_or_id(access_token: Optional[str] = None, input_str: str = "", api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Fetch a channel by handle (@name), Channel ID (UC...), or custom username.
        """
        url = f"{YOUTUBE_API_BASE}/channels"
        headers, base_params = YouTubeService._build_auth_params_and_headers(access_token, api_key)
        
        clean_input = input_str.strip()
        if "youtube.com/" in clean_input:
            clean_input = clean_input.split("youtube.com/")[-1].strip("/")
            if clean_input.startswith("channel/"):
                clean_input = clean_input.replace("channel/", "")
            elif clean_input.startswith("c/"):
                clean_input = clean_input.replace("c/", "")

        async with httpx.AsyncClient() as client:
            # Try by forHandle if starts with @
            if clean_input.startswith("@"):
                resp = await client.get(url, params={"part": "snippet,statistics,contentDetails,brandingSettings", "forHandle": clean_input, **base_params}, headers=headers)
                if resp.status_code == 200 and resp.json().get("items"):
                    return resp.json()["items"][0]
            
            # Try by ID
            resp = await client.get(url, params={"part": "snippet,statistics,contentDetails,brandingSettings", "id": clean_input, **base_params}, headers=headers)
            if resp.status_code == 200 and resp.json().get("items"):
                return resp.json()["items"][0]

            # Try by forHandle with @ prefix
            resp = await client.get(url, params={"part": "snippet,statistics,contentDetails,brandingSettings", "forHandle": f"@{clean_input.lstrip('@')}", **base_params}, headers=headers)
            if resp.status_code == 200 and resp.json().get("items"):
                return resp.json()["items"][0]

            # Try by forUsername
            resp = await client.get(url, params={"part": "snippet,statistics,contentDetails,brandingSettings", "forUsername": clean_input, **base_params}, headers=headers)
            if resp.status_code == 200 and resp.json().get("items"):
                return resp.json()["items"][0]

        return None

    @staticmethod
    async def fetch_channel_public_direct(channel_id_or_handle: str) -> Optional[Dict[str, Any]]:
        """
        Directly scrape YouTube's public web page for real-time channel metadata, official banner,
        high-res avatar, subscriber count, and uploaded videos with ZERO API KEY and ZERO OAuth needed.
        """
        import re
        import json
        clean_input = channel_id_or_handle.strip()
        url = f"https://www.youtube.com/{clean_input}" if clean_input.startswith("@") else f"https://www.youtube.com/channel/{clean_input}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate"
        }
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=12.0) as client:
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    return None
                
                html = resp.text
                title_m = re.search(r'<meta property="og:title" content="([^"]+)">', html)
                title = title_m.group(1) if title_m else "YouTube Channel"
                
                avatar_m = re.search(r'<meta property="og:image" content="([^"]+)">', html)
                avatar = avatar_m.group(1) if avatar_m else ""

                cid_m = re.search(r'<meta itemprop="channelId" content="([^"]+)">', html) or re.search(r'"externalId":"(UC[^"]+)"', html)
                real_cid = cid_m.group(1) if cid_m else clean_input

                banner = ""
                subscriber_count = 0
                videos = []

                match = re.search(r'ytInitialData\s*=\s*({.+?});(?:</script>|\n)', html)
                if match:
                    try:
                        data = json.loads(match.group(1))
                        header = data.get("header", {})
                        page_header = header.get("pageHeaderRenderer", {})
                        c4_header = header.get("c4TabbedHeaderRenderer", {})

                        if page_header:
                            content = page_header.get("content", {}).get("pageHeaderViewModel", {})
                            b_sources = content.get("banner", {}).get("imageBannerViewModel", {}).get("image", {}).get("sources", [])
                            if b_sources:
                                banner = b_sources[-1].get("url", "")
                            
                            a_sources = content.get("image", {}).get("decoratedAvatarViewModel", {}).get("avatar", {}).get("avatarViewModel", {}).get("image", {}).get("sources", [])
                            if a_sources:
                                avatar = a_sources[-1].get("url", avatar)

                            t_val = content.get("title", {}).get("dynamicTextViewModel", {}).get("text", {}).get("content")
                            if t_val:
                                title = t_val

                            meta_rows = content.get("metadata", {}).get("contentMetadataViewModel", {}).get("metadataRows", [])
                            for row in meta_rows:
                                for part in row.get("metadataParts", []):
                                    txt = part.get("text", {}).get("content", "")
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

                        # Videos
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
                                                videos.append({
                                                    "id": v_id,
                                                    "snippet": {"title": v_title},
                                                    "statistics": {"viewCount": v_views, "likeCount": 0, "commentCount": 0},
                                                    "contentDetails": {"duration": "PT0M"}
                                                })
                    except Exception as e:
                        print(f"[fetch_channel_public_direct] Parse error: {e}")

                computed_views = sum(v.get("statistics", {}).get("viewCount", 0) for v in videos) if videos else 0

                return {
                    "channel_id": real_cid,
                    "name": title,
                    "avatar": avatar,
                    "banner": banner,
                    "country": "ID",
                    "subscriber_count": subscriber_count,
                    "total_views": computed_views,
                    "videos": videos
                }
            except Exception as net_err:
                print(f"[fetch_channel_public_direct] Network error: {net_err}")
                return None

    @staticmethod
    async def sync_channel_by_id_public(channel_id: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Directly sync all public channel metadata, official banner, avatar, subscriber count, total views,
        and real uploaded videos directly from YouTube Data API v3 or direct web extractor.
        """
        ch_item = await YouTubeService.get_channel_by_handle_or_id(input_str=channel_id, api_key=api_key)
        if not ch_item:
            # Fallback to zero-key public web extractor
            return await YouTubeService.fetch_channel_public_direct(channel_id)

        snippet = ch_item.get("snippet", {})
        statistics = ch_item.get("statistics", {})
        branding = ch_item.get("brandingSettings", {})
        content_details = ch_item.get("contentDetails", {})

        name = snippet.get("title", "YouTube Channel")
        avatar = (
            snippet.get("thumbnails", {}).get("high", {}).get("url") or 
            snippet.get("thumbnails", {}).get("medium", {}).get("url") or 
            snippet.get("thumbnails", {}).get("default", {}).get("url") or ""
        )
        banner = branding.get("image", {}).get("bannerExternalUrl", "")
        country = snippet.get("country", "ID")

        hidden_subs = statistics.get("hiddenSubscriberCount", False)
        sub_count_raw = statistics.get("subscriberCount", "0")
        try:
            subscriber_count = 0 if hidden_subs else int(sub_count_raw)
        except Exception:
            subscriber_count = 0

        view_count_raw = statistics.get("viewCount", "0")
        try:
            view_count = int(view_count_raw)
        except Exception:
            view_count = 0

        uploads_playlist = content_details.get("relatedPlaylists", {}).get("uploads")
        videos = []
        if uploads_playlist:
            videos = await YouTubeService.get_videos_for_channel(
                uploads_playlist_id=uploads_playlist, 
                max_results=20, 
                api_key=api_key
            )

        return {
            "channel_id": channel_id,
            "name": name,
            "avatar": avatar,
            "banner": banner,
            "country": country,
            "subscriber_count": subscriber_count,
            "total_views": view_count,
            "videos": videos
        }

    @staticmethod
    async def get_comments_for_video(
        video_id: str,
        access_token: Optional[str] = None,
        api_key: Optional[str] = None,
        max_results: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetch top-level comments for a given YouTube video ID.
        Tries OAuth token first; if it fails (401/403/disabled), falls back to API key.
        """
        url = f"{YOUTUBE_API_BASE}/commentThreads"

        async def _fetch(headers: dict, params: dict) -> Optional[list]:
            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    resp = await client.get(url, params=params, headers=headers)
                    if resp.status_code == 200:
                        return resp.json().get("items", [])
                    # 403 commentsDisabled is normal — not an error
                    if resp.status_code == 403:
                        err_reason = resp.json().get("error", {}).get("errors", [{}])[0].get("reason", "")
                        if err_reason == "commentsDisabled":
                            return []  # Comments turned off for this video
                    print(f"[YouTubeService] comments {video_id}: {resp.status_code} {resp.text[:150]}")
                    return None  # None = try fallback
                except Exception as e:
                    print(f"[YouTubeService] get_comments_for_video request error: {e}")
                    return None

        def _parse(items: list) -> List[Dict[str, Any]]:
            results = []
            for item in items:
                top = item.get("snippet", {}).get("topLevelComment", {}).get("snippet", {})
                results.append({
                    "youtube_comment_id": item.get("id", ""),
                    "author_name": top.get("authorDisplayName", "Unknown"),
                    "author_profile_image": top.get("authorProfileImageUrl", ""),
                    "text_display": top.get("textDisplay", ""),
                    "published_at": top.get("publishedAt", ""),
                    "like_count": top.get("likeCount", 0),
                    "video_id": video_id,
                })
            return results

        # Attempt 1: OAuth token (if available)
        if access_token and access_token.strip() and not access_token.startswith("encrypted_demo"):
            items = await _fetch(
                {"Authorization": f"Bearer {access_token}"},
                {"part": "snippet", "videoId": video_id, "maxResults": max_results, "order": "time"}
            )
            if items is not None:
                return _parse(items)

        # Attempt 2: API Key (fallback or primary if no token)
        if api_key and api_key.strip():
            items = await _fetch(
                {},
                {"part": "snippet", "videoId": video_id, "maxResults": max_results,
                 "order": "time", "key": api_key.strip()}
            )
            if items is not None:
                return _parse(items)

        # Attempt 3: API key from DB
        try:
            from app.db.session import SessionLocal
            from app.models.system_setting import SystemSetting
            db = SessionLocal()
            s = db.query(SystemSetting).filter(SystemSetting.key == "YOUTUBE_API_KEY").first()
            db_key = s.value.strip() if s and s.value and s.value not in ("", "your_youtube_api_key_here") else None
            db.close()
            if db_key and db_key != api_key:
                items = await _fetch(
                    {},
                    {"part": "snippet", "videoId": video_id, "maxResults": max_results,
                     "order": "time", "key": db_key}
                )
                if items is not None:
                    return _parse(items)
        except Exception:
            pass

        return []

    @staticmethod
    async def post_comment_reply(
        youtube_comment_id: str,
        reply_text: str,
        access_token: str,
    ) -> Dict[str, Any]:
        """
        Post a reply to a YouTube top-level comment via YouTube Data API v3.
        Requires a valid OAuth access token with youtube.force-ssl scope.

        Returns:
            {"success": True, "youtube_reply_id": "...", "text": "..."}
            {"success": False, "error": "...", "status_code": 403}
        """
        url = f"{YOUTUBE_API_BASE}/comments"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "snippet": {
                "parentId": youtube_comment_id,
                "textOriginal": reply_text,
            }
        }
        params = {"part": "snippet"}

        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.post(url, json=payload, params=params, headers=headers)
                if resp.status_code in (200, 201):
                    data = resp.json()
                    snippet = data.get("snippet", {})
                    return {
                        "success": True,
                        "youtube_reply_id": data.get("id", ""),
                        "text": snippet.get("textDisplay", reply_text),
                        "published_at": snippet.get("publishedAt", ""),
                    }
                else:
                    err = resp.json().get("error", {})
                    msg = err.get("message", resp.text[:200])
                    reason = err.get("errors", [{}])[0].get("reason", "unknown")
                    print(f"[YouTubeService] post_comment_reply failed: {resp.status_code} {reason} — {msg}")
                    return {
                        "success": False,
                        "error": msg,
                        "reason": reason,
                        "status_code": resp.status_code,
                    }
            except Exception as e:
                print(f"[YouTubeService] post_comment_reply exception: {e}")
                return {"success": False, "error": str(e), "status_code": 0}
