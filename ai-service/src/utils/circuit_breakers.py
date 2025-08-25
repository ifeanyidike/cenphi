import logging
from datetime import datetime
import threading

# Configuration
from src.config.settings import settings
from src.utils.logging_config import setup_logging

setup_logging(settings.log_level, settings.log_format)
logger = logging.getLogger(__name__)
class CircuitBreaker:
    """Circuit breaker pattern to prevent infinite loops"""
    
    def __init__(self, failure_threshold: int = 3, timeout_duration: int = 300):
        self.failure_threshold = failure_threshold
        self.timeout_duration = timeout_duration  # 5 minutes
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
        self.lock = threading.Lock()
    
    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection"""
        with self.lock:
            if self.state == "OPEN":
                if self._should_attempt_reset():
                    self.state = "HALF_OPEN"
                    logger.info(f"🔄 Circuit breaker HALF_OPEN, attempting reset")
                else:
                    time_remaining = self.timeout_duration - (datetime.now() - self.last_failure_time).seconds
                    raise Exception(f"Circuit breaker OPEN. Service disabled for {time_remaining} more seconds.")
            
            try:
                result = func(*args, **kwargs)
                self._on_success()
                return result
            except Exception as e:
                self._on_failure()
                raise e
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if self.last_failure_time is None:
            return True
        return (datetime.now() - self.last_failure_time).seconds > self.timeout_duration
    
    def _on_success(self):
        """Reset circuit breaker on successful call"""
        if self.failure_count > 0:  # Only log if we were previously failing
            logger.info("✅ Circuit breaker reset - service restored")
        self.failure_count = 0
        self.state = "CLOSED"
    
    def _on_failure(self):
        """Handle failure and potentially open circuit"""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.error(f"🔴 Circuit breaker OPEN - service disabled for {self.timeout_duration} seconds")