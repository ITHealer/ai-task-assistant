from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Filter the Host header of the request, allowing only hostnames defined (e.g. example.com, localhost)
from fastapi.middleware.trustedhost import TrustedHostMiddleware 
from contextlib import asynccontextmanager

from src.core.config import settings
from src.core.logging import get_logger
from src.api.v1.router import api_router
from src.api.middleware.error_handler import ErrorHandlerMiddleware
from src.infrastructure.database.postgres_client import init_db

logger = get_logger(__name__)

# Lifecycle hooks (startup/shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application lifecycle"""
    # Startup
    logger.info("Starting up Task Assistant API...")

    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
    yield # Where the application starts running.

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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
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