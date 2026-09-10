import os
import time
from fastapi import Request, HTTPException, status
from typing import Callable, Dict, List

class RateLimiter:
    def __init__(self):
        self._requests: Dict[str, List[float]] = {}

    def check_rate_limit(self, request: Request, key_prefix: str = "default", max_requests: int = 10, window_seconds: int = 60):
        client_ip = request.client.host if (request and request.client) else "127.0.0.1"
        key = f"{key_prefix}:{client_ip}"
        now = time.time()
        
        timestamps = self._requests.get(key, [])
        valid_timestamps = [t for t in timestamps if now - t < window_seconds]
        
        if len(valid_timestamps) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Terlalu banyak percobaan. Harap tunggu beberapa saat sebelum mencoba kembali."
            )
        
        valid_timestamps.append(now)
        self._requests[key] = valid_timestamps

rate_limiter = RateLimiter()

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["120 per minute"],
        storage_uri=os.getenv("REDIS_URL", "memory://")
    )
except ImportError:
    class DummyLimiter:
        def limit(self, limit_string: str) -> Callable:
            def decorator(func: Callable) -> Callable:
                return func
            return decorator

    limiter = DummyLimiter()
