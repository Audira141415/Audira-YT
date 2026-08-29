import json
import redis
from app.core.config import settings

# Initialize Redis client
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_cache(key: str):
    try:
        data = redis_client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        print(f"Redis get error for {key}: {e}")
    return None

def set_cache(key: str, value: dict, expire_seconds: int = 43200): # Default 12 hours
    try:
        redis_client.setex(key, expire_seconds, json.dumps(value))
    except Exception as e:
        print(f"Redis set error for {key}: {e}")
