from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from src.infrastructure.cache.redis import RedisCache
from src.core.config import settings
import time


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware using Redis"""
    
    def __init__(self, app):
        super().__init__(app)
        self.cache = RedisCache()
        self.requests_limit = settings.RATE_LIMIT_REQUESTS
        self.period = settings.RATE_LIMIT_PERIOD
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path == "/api/v1/health":
            return await call_next(request)
        
        # Get client IP
        client_ip = request.client.host
        key = f"rate_limit:{client_ip}"
        
        # Get current request count
        current_count = await self.cache.get(key)
        
        if current_count is None:
            # First request
            await self.cache.set(key, 1, ttl=self.period)
        elif int(current_count) >= self.requests_limit:
            # Rate limit exceeded
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "RATE_LIMIT_EXCEEDED",
                    "message": f"Rate limit exceeded. Please try again later."
                }
            )
        else:
            # Increment counter
            await self.cache.increment(key)
        
        response = await call_next(request)
        return response