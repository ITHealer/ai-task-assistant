from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from src.core.config import settings
from src.core.logging import get_logger
from src.api.v1.router import api_router
from src.api.middleware.error_handler import ErrorHandlerMiddleware
from src.api.middleware.rate_limiter import RateLimiterMiddleware
from src.infrastructure.database.postgres_client import init_db

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application lifecycle"""
    # Startup
    logger.info("Starting up Task Assistant API...")
    init_db()
    yield
    # Shutdown
    logger.info("Shutting down Task Assistant API...")


# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middlewares
app.add_middleware(ErrorHandlerMiddleware)

if settings.RATE_LIMIT_ENABLED:
    app.add_middleware(RateLimiterMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure based on your needs
)

# Include routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Task Assistant API",
        "version": settings.VERSION,
        "docs": "/docs"
    }