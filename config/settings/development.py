"""Development settings"""
import os
from config.settings.base import *

DEBUG = True

# Database - Use environment variable if available, otherwise build from config
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL and DATABASE_CONFIG:
    # Try to get development config, fallback to default
    db_config = DATABASE_CONFIG.get("development", DATABASE_CONFIG.get("default", {}))
    if db_config:
        DATABASE_URL = (
            f"postgresql://{db_config.get('username', 'taskuser')}:"
            f"{db_config.get('password', 'taskpass')}"
            f"@{db_config.get('host', 'localhost')}:"
            f"{db_config.get('port', '5432')}/"
            f"{db_config.get('database', 'task_assistant')}"
        )
    else:
        # Fallback URL
        DATABASE_URL = "postgresql://taskuser:taskpass@localhost:5432/task_assistant"

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_CONFIG = MODEL_CONFIG.get("openai", {})

# Logging
LOG_LEVEL = "DEBUG"

# CORS - Allow all origins in development
CORS_ORIGINS.extend([
    "http://localhost:*",
    "http://127.0.0.1:*"
])