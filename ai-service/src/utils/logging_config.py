import logging
import logging.config
import sys
from typing import Dict, Any

def setup_logging(log_level: str = "INFO", log_format: str = None) -> None:
    """Setup logging configuration"""
    
    if log_format is None:
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    logging_config: Dict[str, Any] = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "standard": {
                "format": log_format,
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "level": log_level,
                "formatter": "standard",
                "stream": sys.stdout
            },
            "error_console": {
                "class": "logging.StreamHandler",
                "level": "ERROR",
                "formatter": "detailed",
                "stream": sys.stderr
            }
        },
        "loggers": {
            "": {  # Root logger
                "handlers": ["console", "error_console"],
                "level": log_level,
                "propagate": False
            },
            
        }
    }
    
    logging.config.dictConfig(logging_config)