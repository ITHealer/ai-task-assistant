from typing import Optional, Any
import redis.asyncio as redis
import json
from src.core.config import settings
from src.core.logging import get_logger

logger = get_logger(__name__)


class RedisCache:
    """Redis cache client"""
    
    def __init__(self):
        self.redis_client = None
        self.default_ttl = settings.REDIS_TTL
    
    async def connect(self):
        """Connect to Redis"""
        if not self.redis_client:
            self.redis_client = await redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            await self.connect()
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {str(e)}")
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        try:
            await self.connect()
            ttl = ttl or self.default_ttl
            serialized = json.dumps(value)
            await self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis set error: {str(e)}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            await self.connect()
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {str(e)}")
            return False
    
    async def increment(self, key: str) -> int:
        """Increment value"""
        try:
            await self.connect()
            return await self.redis_client.incr(key)
        except Exception as e:
            logger.error(f"Redis increment error: {str(e)}")
            return 0