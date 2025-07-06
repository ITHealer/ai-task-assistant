from fastapi import Request, HTTPException
from fastapi.security.utils import get_authorization_scheme_param
from starlette.middleware.base import BaseHTTPMiddleware
from src.core.security import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    """Authentication middleware"""
    
    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/api/v1/health",
            "/docs",
            "/redoc",
            "/openapi.json"
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # Get authorization header
        authorization = request.headers.get("Authorization")
        scheme, token = get_authorization_scheme_param(authorization)
        
        # For now, allow requests without auth
        # In production, you would verify the token here
        if scheme and scheme.lower() == "bearer" and token:
            try:
                verify_token(token)
            except Exception:
                # For now, just log and continue
                pass
        
        response = await call_next(request)
        return response