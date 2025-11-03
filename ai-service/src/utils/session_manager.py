# src/utils/session_manager.py

import os
import threading
import time
import shutil
import logging
from typing import Optional, Dict
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Container-based session manager for caching intermediate processing files.

    Keeps processed files in container storage to avoid repeated downloads when
    processing steps sequentially. Sessions expire after TTL (default 30 minutes).
    """

    def __init__(self, ttl_minutes: int = 30, base_path: str = "/tmp/sessions"):
        self.sessions: Dict[str, Dict] = {}  # job_id → {files: {}, last_access: datetime}
        self.ttl = timedelta(minutes=ttl_minutes)
        self.base_path = base_path
        self.lock = threading.Lock()

        # Create base directory
        os.makedirs(self.base_path, exist_ok=True)

        # Start cleanup thread
        self._start_cleanup_thread()

        logger.info(f"SessionManager initialized (TTL: {ttl_minutes} min, path: {base_path})")

    def get_file(self, job_id: str, step_name: str) -> Optional[str]:
        """
        Get a specific file from a session by step name.

        Args:
            job_id: Unique job identifier
            step_name: Name of the processing step (e.g., "crop", "clip_123")

        Returns:
            File path if session exists, not expired, and file exists, None otherwise
        """
        with self.lock:
            if job_id not in self.sessions:
                logger.debug(f"Session not found: {job_id}")
                return None

            session = self.sessions[job_id]

            # Check if expired
            if datetime.now() - session["last_access"] > self.ttl:
                logger.info(f"Session expired: {job_id}")
                self._cleanup_session_unsafe(job_id)
                return None

            # Update last access
            session["last_access"] = datetime.now()

            # Get specific file
            files = session.get("files", {})

            if step_name not in files:
                logger.debug(f"Step not found in session: {job_id}/{step_name}")
                return None

            file_path = files[step_name]["path"]

            if os.path.exists(file_path):
                logger.info(f"✅ Session cache HIT: {job_id}/{step_name} → {file_path}")
                return file_path
            else:
                logger.warning(f"Session file missing: {file_path}")
                return None

    def get_latest_file(self, job_id: str) -> Optional[str]:
        """
        Get the most recent output file for a job.

        Returns:
            File path if session exists and not expired, None otherwise
        """
        with self.lock:
            if job_id not in self.sessions:
                logger.debug(f"Session not found: {job_id}")
                return None

            session = self.sessions[job_id]

            # Check if expired
            if datetime.now() - session["last_access"] > self.ttl:
                logger.info(f"Session expired: {job_id}")
                self._cleanup_session_unsafe(job_id)
                return None

            # Update last access
            session["last_access"] = datetime.now()

            # Get latest file (last step processed)
            files = session.get("files", {})
            if not files:
                return None

            # Return the most recently added file
            latest_step = max(files.keys(), key=lambda k: files[k]["timestamp"])
            file_path = files[latest_step]["path"]

            if os.path.exists(file_path):
                logger.info(f"✅ Session cache HIT: {job_id} → {latest_step} → {file_path}")
                return file_path
            else:
                logger.warning(f"Session file missing: {file_path}")
                return None

    def get_step_dir(self, job_id: str, step_name: str) -> str:
        """
        Get or create a directory for a specific processing step.

        Args:
            job_id: Unique job identifier
            step_name: Name of the processing step (e.g., "text_overlay", "broll_overlay")

        Returns:
            Path to the step directory
        """
        session_dir = os.path.join(self.base_path, job_id)
        step_dir = os.path.join(session_dir, step_name)
        os.makedirs(step_dir, exist_ok=True)
        return step_dir

    def store_file(self, job_id: str, step_name: str, file_path: str):
        """
        Store a file path in the session for later retrieval.

        Args:
            job_id: Unique job identifier
            step_name: Name of the processing step (e.g., "crop", "captions")
            file_path: Absolute path to the file in container
        """
        with self.lock:
            if job_id not in self.sessions:
                # Create new session
                session_dir = os.path.join(self.base_path, job_id)
                os.makedirs(session_dir, exist_ok=True)

                self.sessions[job_id] = {
                    "files": {},
                    "metadata": {},  # Add metadata storage
                    "last_access": datetime.now(),
                    "created_at": datetime.now(),
                    "session_dir": session_dir
                }
                logger.info(f"Created new session: {job_id}")

            session = self.sessions[job_id]
            session["files"][step_name] = {
                "path": file_path,
                "timestamp": datetime.now()
            }
            session["last_access"] = datetime.now()

            logger.info(f"Stored in session: {job_id}/{step_name} → {file_path}")

    def store_metadata(self, job_id: str, key: str, value):
        """
        Store arbitrary metadata in the session.

        Args:
            job_id: Unique job identifier
            key: Metadata key (e.g., "collected_clips", "ordered_clips")
            value: Metadata value (can be any JSON-serializable object)
        """
        with self.lock:
            if job_id not in self.sessions:
                # Create new session
                session_dir = os.path.join(self.base_path, job_id)
                os.makedirs(session_dir, exist_ok=True)

                self.sessions[job_id] = {
                    "files": {},
                    "metadata": {},
                    "last_access": datetime.now(),
                    "created_at": datetime.now(),
                    "session_dir": session_dir
                }
                logger.info(f"Created new session: {job_id}")

            session = self.sessions[job_id]
            if "metadata" not in session:
                session["metadata"] = {}

            session["metadata"][key] = value
            session["last_access"] = datetime.now()

            logger.info(f"Stored metadata in session: {job_id}/{key}")

    def get_metadata(self, job_id: str, key: str, default=None):
        """
        Retrieve metadata from the session.

        Args:
            job_id: Unique job identifier
            key: Metadata key
            default: Default value if key not found

        Returns:
            Metadata value or default
        """
        with self.lock:
            if job_id not in self.sessions:
                return default

            session = self.sessions[job_id]

            # Check if expired
            if datetime.now() - session["last_access"] > self.ttl:
                logger.info(f"Session expired: {job_id}")
                self._cleanup_session_unsafe(job_id)
                return default

            # Update last access
            session["last_access"] = datetime.now()

            metadata = session.get("metadata", {})
            return metadata.get(key, default)

    def cleanup_session(self, job_id: str):
        """
        Explicitly cleanup a session (called when job completes or fails).

        Args:
            job_id: Job identifier to cleanup
        """
        with self.lock:
            self._cleanup_session_unsafe(job_id)

    def _cleanup_session_unsafe(self, job_id: str):
        """
        Internal cleanup method (assumes lock is already held).
        """
        if job_id not in self.sessions:
            return

        session = self.sessions[job_id]
        session_dir = session.get("session_dir")

        # Delete all tracked files
        for step_name, file_info in session.get("files", {}).items():
            file_path = file_info["path"]
            try:
                if os.path.exists(file_path):
                    os.unlink(file_path)
                    logger.debug(f"Deleted session file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete {file_path}: {e}")

        # Delete session directory
        if session_dir and os.path.exists(session_dir):
            try:
                shutil.rmtree(session_dir, ignore_errors=True)
                logger.debug(f"Deleted session directory: {session_dir}")
            except Exception as e:
                logger.warning(f"Failed to delete session dir {session_dir}: {e}")

        # Remove from sessions dict
        del self.sessions[job_id]
        logger.info(f"✅ Session cleaned up: {job_id}")

    def _start_cleanup_thread(self):
        """Start background thread to cleanup expired sessions."""
        def cleanup_worker():
            while True:
                time.sleep(300)  # Check every 5 minutes
                try:
                    self._cleanup_expired_sessions()
                except Exception as e:
                    logger.error(f"Cleanup thread error: {e}")

        cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
        cleanup_thread.start()
        logger.info("Started session cleanup background thread")

    def _cleanup_expired_sessions(self):
        """Cleanup all expired sessions."""
        with self.lock:
            now = datetime.now()
            expired_jobs = []

            for job_id, session in self.sessions.items():
                if now - session["last_access"] > self.ttl:
                    expired_jobs.append(job_id)

            for job_id in expired_jobs:
                logger.info(f"Cleaning up expired session: {job_id}")
                self._cleanup_session_unsafe(job_id)

            if expired_jobs:
                logger.info(f"Cleaned up {len(expired_jobs)} expired sessions")

    def get_session_stats(self) -> Dict:
        """Get session statistics for monitoring."""
        with self.lock:
            return {
                "active_sessions": len(self.sessions),
                "base_path": self.base_path,
                "ttl_minutes": self.ttl.total_seconds() / 60,
                "sessions": {
                    job_id: {
                        "files_count": len(session["files"]),
                        "last_access": session["last_access"].isoformat(),
                        "age_seconds": (datetime.now() - session["created_at"]).total_seconds()
                    }
                    for job_id, session in self.sessions.items()
                }
            }


# Global singleton instance
_session_manager = None

def get_session_manager() -> SessionManager:
    """Get or create the global session manager instance."""
    global _session_manager
    if _session_manager is None:
        ttl = int(os.getenv("SESSION_TTL_MINUTES", "30"))
        _session_manager = SessionManager(ttl_minutes=ttl)
    return _session_manager
