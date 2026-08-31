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
    async def sync_channel_by_id_public(channel_id: str, api_key: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Directly sync all public channel metadata, official banner, avatar, subscriber count, total views,
        and real uploaded videos directly from YouTube Data API v3 without requiring OAuth login.
        """
        ch_item = await YouTubeService.get_channel_by_handle_or_id(input_str=channel_id, api_key=api_key)
        if not ch_item:
            print(f"[YouTubeService] Channel not found for ID: {channel_id}")
            return None

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

