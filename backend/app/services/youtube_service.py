import httpx
from typing import List, Dict, Any, Optional

YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

class YouTubeService:
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
            resp1 = await client.get(url, params={"part": "snippet,statistics,contentDetails", "mine": "true"}, headers=headers)
            if resp1.status_code == 200:
                for item in resp1.json().get("items", []):
                    channels_dict[item["id"]] = item
            else:
                print(f"[YouTubeService] mine=true response: {resp1.text}")

            # 2. Brand / Managed channels (managedByMe=true)
            resp2 = await client.get(url, params={"part": "snippet,statistics,contentDetails", "managedByMe": "true"}, headers=headers)
            if resp2.status_code == 200:
                for item in resp2.json().get("items", []):
                    channels_dict[item["id"]] = item
            else:
                print(f"[YouTubeService] managedByMe=true response: {resp2.text}")

        return list(channels_dict.values())

    @staticmethod
    async def get_videos_for_channel(access_token: str, uploads_playlist_id: str, max_results: int = 15) -> List[Dict[str, Any]]:
        """
        Fetch recent videos from a channel's uploads playlist.
        """
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # 1. Get playlist items (video IDs)
            playlist_url = f"{YOUTUBE_API_BASE}/playlistItems"
            playlist_params = {
                "part": "snippet",
                "playlistId": uploads_playlist_id,
                "maxResults": max_results
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
                "id": ",".join(video_ids)
            }
            resp_v = await client.get(videos_url, params=videos_params, headers=headers)
            if resp_v.status_code != 200:
                print(f"[YouTubeService] Failed to fetch video details: {resp_v.text}")
                return []
            
            v_data = resp_v.json()
            return v_data.get("items", [])

    @staticmethod
    async def get_channel_by_handle_or_id(access_token: str, input_str: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a channel by handle (@name), Channel ID (UC...), or custom username.
        """
        url = f"{YOUTUBE_API_BASE}/channels"
        headers = {"Authorization": f"Bearer {access_token}"}
        
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
                resp = await client.get(url, params={"part": "snippet,statistics,contentDetails", "forHandle": clean_input}, headers=headers)
                if resp.status_code == 200 and resp.json().get("items"):
                    return resp.json()["items"][0]
            
            # Try by ID
            resp = await client.get(url, params={"part": "snippet,statistics,contentDetails", "id": clean_input}, headers=headers)
            if resp.status_code == 200 and resp.json().get("items"):
                return resp.json()["items"][0]

            # Try by forHandle with @ prefix
            resp = await client.get(url, params={"part": "snippet,statistics,contentDetails", "forHandle": f"@{clean_input.lstrip('@')}"}, headers=headers)
            if resp.status_code == 200 and resp.json().get("items"):
                return resp.json()["items"][0]

            # Try by forUsername
            resp = await client.get(url, params={"part": "snippet,statistics,contentDetails", "forUsername": clean_input}, headers=headers)
            if resp.status_code == 200 and resp.json().get("items"):
                return resp.json()["items"][0]

        return None
