import os
from fastapi import Request
from typing import Callable

try:
    from slowapi import Limiter
    from slowapi.util import get_remote_address

    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["120 per minute"],
        storage_uri=os.getenv("REDIS_URL", "memory://")
    )
except ImportError:
    # Graceful fallback if slowapi library is not installed
    class DummyLimiter:
        def limit(self, limit_string: str) -> Callable:
            def decorator(func: Callable) -> Callable:
                return func
            return decorator

    limiter = DummyLimiter()
