from fastapi import APIRouter, Depends
from src.core.config import settings
from src.api.v1.deps import get_db
from sqlalchemy.orm import Session
import os

router = APIRouter()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "Task Assistant API",
        "version": settings.VERSION
    }


@router.get("/config")
async def check_config():
    """Check configuration (only in development)"""
    if not settings.DEBUG:
        return {"error": "Not available in production"}
    
    return {
        "environment": os.getenv("ENVIRONMENT", "unknown"),
        "database_configured": bool(settings.DATABASE_URL),
        "redis_configured": bool(settings.REDIS_URL),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "openai_key_preview": f"{settings.OPENAI_API_KEY[:8]}..." if settings.OPENAI_API_KEY else "Not set",
        "openai_model": settings.OPENAI_MODEL,
        "debug_mode": settings.DEBUG
    }


@router.get("/db")
async def check_database(db: Session = Depends(get_db)):
    """Check database connection"""
    try:
        # Execute a simple query
        result = db.execute("SELECT 1")
        return {"status": "connected", "result": result.scalar()}
    except Exception as e:
        return {"status": "error", "message": str(e)}