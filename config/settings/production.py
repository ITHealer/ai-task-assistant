"""Production settings"""
from config.settings.base import *

DEBUG = False

# Database
DB_CONFIG = DATABASE_CONFIG.get("production", DATABASE_CONFIG["default"])
DATABASE_URL = (
    f"postgresql://{DB_CONFIG['username']}:{DB_CONFIG['password']}"
    f"@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
)

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY must be set in production")

OPENAI_CONFIG = MODEL_CONFIG.get("openai", {})

# Logging
LOG_LEVEL = "INFO"

# Security
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in production")

# CORS - Restrict in production
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",")