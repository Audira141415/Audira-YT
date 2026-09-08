import time
from typing import Dict, List
from fastapi import Request, HTTPException, status

class RateLimiter:
    """
    Lightweight sliding-window IP rate limiter for auth routes.
    """
    def __init__(self, default_max_requests: int = 5, default_window_seconds: int = 60):
        self.default_max_requests = default_max_requests
        self.default_window_seconds = default_window_seconds
        # Storage: { f"{key_prefix}:{client_ip}": [timestamp1, timestamp2, ...] }
        self._history: Dict[str, List[float]] = {}

    def get_client_ip(self, request: Request) -> str:
        # Check X-Forwarded-For header for reverse proxies (Nginx/Cloudflare)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip.strip()
        return request.client.host if request.client else "127.0.0.1"

    def check_rate_limit(
        self, 
        request: Request, 
        key_prefix: str = "login", 
        max_requests: int = 5, 
        window_seconds: int = 60
    ) -> None:
        client_ip = self.get_client_ip(request)
        tracker_key = f"{key_prefix}:{client_ip}"
        now = time.time()

        # Clean old timestamps
        if tracker_key in self._history:
            self._history[tracker_key] = [
                ts for ts in self._history[tracker_key] 
                if now - ts < window_seconds
            ]
        else:
            self._history[tracker_key] = []

        if len(self._history[tracker_key]) >= max_requests:
            remaining = int(window_seconds - (now - self._history[tracker_key][0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Terlalu banyak percobaan. Batas {max_requests}x per {window_seconds}s tercapai. Silakan tunggu {max(remaining, 1)} detik."
            )

        self._history[tracker_key].append(now)

rate_limiter = RateLimiter()
