import logging
import logging.config
import yaml
from pathlib import Path
from src.core.config import settings


def setup_logging():
    """Setup logging configuration"""
    config_path = Path(__file__).parent.parent.parent / "config" / "logging_config.yaml"
    
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            logging.config.dictConfig(config)
    else:
        # Fallback to basic configuration
        logging.basicConfig(
            level=getattr(logging, settings.LOG_LEVEL),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )


def get_logger(name: str) -> logging.Logger:
    """Get logger instance"""
    return logging.getLogger(name)


# Initialize logging
setup_logging()