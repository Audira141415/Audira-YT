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
            params["key"] = api_key
        else:
            env_key = os.getenv("YOUTUBE_API_KEY")
            if env_key and env_key != "your_youtube_api_key_here":
                params["key"] = env_key
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
