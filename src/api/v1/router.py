from fastapi import APIRouter
from src.api.v1.endpoints import health, tasks

api_router = APIRouter()

api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(tasks.router, prefix="/AI Tasks", tags=["tasks"])