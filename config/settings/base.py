import os
from pathlib import Path
from typing import List, Dict, Any
import yaml

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"

# Create directories
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)


def load_yaml_config(filename: str) -> Dict[str, Any]:
    """Load YAML configuration file"""
    config_path = CONFIG_DIR / filename
    if config_path.exists():
        with open(config_path, 'r') as f:
            content = f.read()
            # Replace environment variables
            for key, value in os.environ.items():
                content = content.replace(f'${{{key}}}', value)
                content = content.replace(f'${{{key}:', f'${{{value}:')
            return yaml.safe_load(content)
    return {}


# Load configurations
try:
    DATABASE_CONFIG = load_yaml_config("database_config.yaml")
except Exception as e:
    print(f"Warning: Could not load database_config.yaml: {e}")
    DATABASE_CONFIG = {}

try:
    MODEL_CONFIG = load_yaml_config("model_config.yaml")
except Exception as e:
    print(f"Warning: Could not load model_config.yaml: {e}")
    MODEL_CONFIG = {}

# try:
#     PROMPT_TEMPLATES = load_yaml_config("prompt_templates.yaml")
# except Exception as e:
#     print(f"Warning: Could not load prompt_templates.yaml: {e}")
#     PROMPT_TEMPLATES = {}

try:
    LOGGING_CONFIG = load_yaml_config("logging_config.yaml")
except Exception as e:
    print(f"Warning: Could not load logging_config.yaml: {e}")
    LOGGING_CONFIG = {}

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# API Configuration
API_V1_STR = "/api/v1"
PROJECT_NAME = "Task Assistant API"
VERSION = "1.0.0"

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# CORS
CORS_ORIGINS = [
    "chrome-extension://*",
    "http://localhost:3000",
    "http://localhost:3001",
]

# Rate Limiting
RATE_LIMIT_ENABLED = True
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_PERIOD = 60  # seconds