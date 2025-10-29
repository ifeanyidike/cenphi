# src/utils/progress_publisher.py

import json
import logging
import redis
import os
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ProgressPublisher:
    """
    Publishes real-time progress updates to Redis for Go SSE manager to broadcast.
    """

    def __init__(self):
        # Check if TLS is enabled (required for Upstash)
        tls_enabled = os.getenv("REDIS_TLS_ENABLED", "false").lower() == "true"

        redis_config = {
            "host": os.getenv("REDIS_HOST", "localhost"),
            "port": int(os.getenv("REDIS_PORT", 6379)),
            "db": int(os.getenv("REDIS_DB", 0)),
            "password": os.getenv("REDIS_PASSWORD"),
            "decode_responses": True
        }

        # Enable TLS if configured
        if tls_enabled:
            redis_config["ssl"] = True
            redis_config["ssl_cert_reqs"] = None  # Don't verify certificate
            logger.info("Redis TLS enabled")

        self.redis_client = redis.Redis(**redis_config)
        logger.info("ProgressPublisher initialized")

    def publish_step_progress(
        self,
        job_id: str,
        step_id: str,
        step_name: str,
        progress: int,
        message: str = "",
        preview_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Publish step progress update to Redis.

        Args:
            job_id: Processing job/session ID
            step_id: Step identifier (e.g., "crop_resize")
            step_name: Human-readable step name
            progress: Progress percentage (0-100)
            message: Status message
            preview_url: Optional preview URL
            metadata: Optional additional metadata
        """
        try:
            payload = {
                "event_type": "step_progress",
                "job_id": job_id,
                "step_id": step_id,
                "step_name": step_name,
                "progress": progress,
                "message": message,
                "timestamp": datetime.utcnow().isoformat()
            }

            if preview_url:
                payload["preview_url"] = preview_url

            if metadata:
                payload["metadata"] = metadata

            # Publish to Redis channel
            channel = f"studio:progress:{job_id}"
            self.redis_client.publish(channel, json.dumps(payload))

            logger.info(
                f"Published progress: job={job_id}, step={step_id}, "
                f"progress={progress}%, message={message}"
            )

        except Exception as e:
            logger.error(f"Failed to publish progress: {e}", exc_info=True)

    def publish_preview_ready(
        self,
        job_id: str,
        step_id: str,
        step_name: str,
        preview_url: str,
        preview_type: str = "video",
        width: Optional[int] = None,
        height: Optional[int] = None,
        duration: Optional[float] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Publish preview ready event to Redis.
        """
        try:
            payload = {
                "event_type": "preview_ready",
                "job_id": job_id,
                "step_id": step_id,
                "step_name": step_name,
                "preview_url": preview_url,
                "preview_type": preview_type,
                "timestamp": datetime.utcnow().isoformat()
            }

            if width:
                payload["width"] = width
            if height:
                payload["height"] = height
            if duration:
                payload["duration"] = duration
            if metadata:
                payload["metadata"] = metadata

            channel = f"studio:progress:{job_id}"
            self.redis_client.publish(channel, json.dumps(payload))

            logger.info(
                f"Published preview ready: job={job_id}, step={step_id}, url={preview_url}"
            )

        except Exception as e:
            logger.error(f"Failed to publish preview: {e}", exc_info=True)

    def publish_step_complete(
        self,
        job_id: str,
        step_id: str,
        step_name: str,
        output_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Publish step completion event to Redis.
        """
        try:
            payload = {
                "event_type": "step_complete",
                "job_id": job_id,
                "step_id": step_id,
                "step_name": step_name,
                "timestamp": datetime.utcnow().isoformat()
            }

            if output_url:
                payload["output_url"] = output_url
            if metadata:
                payload["metadata"] = metadata

            channel = f"studio:progress:{job_id}"
            self.redis_client.publish(channel, json.dumps(payload))

            logger.info(f"Published step complete: job={job_id}, step={step_id}")

        except Exception as e:
            logger.error(f"Failed to publish step complete: {e}", exc_info=True)

    def publish_error(
        self,
        job_id: str,
        step_id: str,
        error_message: str,
        error_code: str = "processing_error"
    ):
        """
        Publish error event to Redis.
        """
        try:
            payload = {
                "event_type": "error",
                "job_id": job_id,
                "step_id": step_id,
                "error_code": error_code,
                "error_message": error_message,
                "timestamp": datetime.utcnow().isoformat()
            }

            channel = f"studio:progress:{job_id}"
            self.redis_client.publish(channel, json.dumps(payload))

            logger.error(f"Published error: job={job_id}, step={step_id}, error={error_message}")

        except Exception as e:
            logger.error(f"Failed to publish error: {e}", exc_info=True)


# Singleton instance
_progress_publisher = None


def get_progress_publisher() -> ProgressPublisher:
    """Get singleton ProgressPublisher instance."""
    global _progress_publisher
    if _progress_publisher is None:
        _progress_publisher = ProgressPublisher()
    return _progress_publisher
