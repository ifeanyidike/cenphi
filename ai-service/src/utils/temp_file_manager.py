# src/utils/temp_file_manager.py

"""
Comprehensive temp file cleanup manager for AI service.

Handles:
1. Session-based temp file tracking (per job_id)
2. Automatic cleanup after 30 minutes of inactivity
3. Manual cleanup on session completion/cancellation
4. Background cleanup thread for stale sessions
"""

import os
import time
import threading
import logging
from typing import Dict, Set, Optional
from datetime import datetime, timedelta
import shutil

logger = logging.getLogger(__name__)


class TempFileManager:
    """
    Thread-safe temp file manager with automatic cleanup.

    Tracks temp files per session and cleans up after inactivity or completion.
    """

    def __init__(self, base_temp_dir: str = "/tmp/testimonials", inactivity_timeout_minutes: int = 30):
        self.base_temp_dir = base_temp_dir
        self.inactivity_timeout = timedelta(minutes=inactivity_timeout_minutes)

        # Session tracking: {job_id: {"files": set(), "last_activity": datetime, "completed": bool}}
        self.sessions: Dict[str, Dict] = {}
        self._lock = threading.RLock()

        # Background cleanup thread
        self._cleanup_thread = None
        self._stop_cleanup = threading.Event()

        # Ensure base temp dir exists
        os.makedirs(self.base_temp_dir, exist_ok=True)

        logger.info(f"✅ TempFileManager initialized: base_dir={self.base_temp_dir}, timeout={inactivity_timeout_minutes}min")

    def start_background_cleanup(self, check_interval_minutes: int = 5):
        """Start background cleanup thread"""
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            logger.warning("Background cleanup already running")
            return

        self._stop_cleanup.clear()
        self._cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            args=(check_interval_minutes,),
            daemon=True,
            name="TempFileCleanup"
        )
        self._cleanup_thread.start()
        logger.info(f"🧹 Background cleanup started (check interval: {check_interval_minutes}min)")

    def stop_background_cleanup(self):
        """Stop background cleanup thread"""
        if self._cleanup_thread:
            self._stop_cleanup.set()
            self._cleanup_thread.join(timeout=5)
            logger.info("🛑 Background cleanup stopped")

    def register_file(self, job_id: str, file_path: str):
        """Register a temp file for a session"""
        if not file_path or not os.path.exists(file_path):
            return

        with self._lock:
            if job_id not in self.sessions:
                self.sessions[job_id] = {
                    "files": set(),
                    "last_activity": datetime.now(),
                    "completed": False,
                    "session_dir": os.path.join(self.base_temp_dir, job_id)
                }

            self.sessions[job_id]["files"].add(file_path)
            self.sessions[job_id]["last_activity"] = datetime.now()

            logger.debug(f"📝 Registered temp file for session {job_id}: {os.path.basename(file_path)}")

    def register_directory(self, job_id: str, dir_path: str):
        """Register an entire directory for a session"""
        if not dir_path or not os.path.isdir(dir_path):
            return

        with self._lock:
            if job_id not in self.sessions:
                self.sessions[job_id] = {
                    "files": set(),
                    "last_activity": datetime.now(),
                    "completed": False,
                    "session_dir": dir_path
                }
            else:
                self.sessions[job_id]["session_dir"] = dir_path

            self.sessions[job_id]["last_activity"] = datetime.now()

            logger.debug(f"📁 Registered temp directory for session {job_id}: {dir_path}")

    def touch_session(self, job_id: str):
        """Update last activity time for a session"""
        with self._lock:
            if job_id in self.sessions:
                self.sessions[job_id]["last_activity"] = datetime.now()
                logger.debug(f"👆 Touched session {job_id}")

    def mark_completed(self, job_id: str):
        """Mark session as completed (ready for cleanup)"""
        with self._lock:
            if job_id in self.sessions:
                self.sessions[job_id]["completed"] = True
                self.sessions[job_id]["last_activity"] = datetime.now()
                logger.info(f"✅ Session {job_id} marked as completed")

    def cleanup_session(self, job_id: str, force: bool = False):
        """
        Clean up all temp files for a session.

        Args:
            job_id: Session identifier
            force: If True, cleanup even if not completed/stale
        """
        with self._lock:
            if job_id not in self.sessions:
                logger.debug(f"Session {job_id} not found for cleanup")
                return

            session = self.sessions[job_id]

            # Check if should cleanup
            if not force:
                inactive_duration = datetime.now() - session["last_activity"]
                if not session["completed"] and inactive_duration < self.inactivity_timeout:
                    logger.debug(f"Session {job_id} still active, skipping cleanup")
                    return

            # Cleanup individual files
            files_deleted = 0
            for file_path in session["files"]:
                if self._safe_delete_file(file_path):
                    files_deleted += 1

            # Cleanup session directory
            session_dir = session.get("session_dir")
            if session_dir and os.path.exists(session_dir):
                if self._safe_delete_directory(session_dir):
                    logger.info(f"🗑️ Deleted session directory: {session_dir}")

            # Remove from tracking
            del self.sessions[job_id]

            logger.info(f"✅ Cleaned up session {job_id}: {files_deleted} files deleted")

    def cleanup_all_completed(self):
        """Cleanup all completed sessions"""
        with self._lock:
            completed_sessions = [
                job_id for job_id, session in self.sessions.items()
                if session["completed"]
            ]

        for job_id in completed_sessions:
            self.cleanup_session(job_id)

        logger.info(f"✅ Cleaned up {len(completed_sessions)} completed sessions")

    def cleanup_stale_sessions(self):
        """Cleanup sessions inactive for > timeout duration"""
        now = datetime.now()
        stale_sessions = []

        with self._lock:
            for job_id, session in self.sessions.items():
                inactive_duration = now - session["last_activity"]
                if inactive_duration > self.inactivity_timeout:
                    stale_sessions.append((job_id, inactive_duration))

        for job_id, inactive_duration in stale_sessions:
            logger.warning(f"⏰ Stale session detected: {job_id} (inactive for {inactive_duration})")
            self.cleanup_session(job_id)

        if stale_sessions:
            logger.info(f"🧹 Cleaned up {len(stale_sessions)} stale sessions")

        return len(stale_sessions)

    def get_session_info(self, job_id: str) -> Optional[Dict]:
        """Get information about a session"""
        with self._lock:
            session = self.sessions.get(job_id)
            if not session:
                return None

            inactive_duration = datetime.now() - session["last_activity"]
            return {
                "job_id": job_id,
                "file_count": len(session["files"]),
                "last_activity": session["last_activity"],
                "inactive_for": str(inactive_duration),
                "completed": session["completed"],
                "session_dir": session.get("session_dir")
            }

    def get_all_sessions_info(self) -> list:
        """Get information about all tracked sessions"""
        with self._lock:
            return [self.get_session_info(job_id) for job_id in self.sessions.keys()]

    def _cleanup_loop(self, check_interval_minutes: int):
        """Background cleanup loop"""
        check_interval_seconds = check_interval_minutes * 60

        while not self._stop_cleanup.wait(timeout=check_interval_seconds):
            try:
                logger.debug("🔍 Running background cleanup check...")
                self.cleanup_stale_sessions()
                self.cleanup_all_completed()
            except Exception as e:
                logger.error(f"❌ Background cleanup error: {e}")

    def _safe_delete_file(self, file_path: str) -> bool:
        """Safely delete a file"""
        try:
            if os.path.exists(file_path) and os.path.isfile(file_path):
                os.unlink(file_path)
                logger.debug(f"🗑️ Deleted file: {os.path.basename(file_path)}")
                return True
        except Exception as e:
            logger.warning(f"Failed to delete file {file_path}: {e}")
        return False

    def _safe_delete_directory(self, dir_path: str) -> bool:
        """Safely delete a directory and all contents"""
        try:
            if os.path.exists(dir_path) and os.path.isdir(dir_path):
                shutil.rmtree(dir_path, ignore_errors=True)
                return True
        except Exception as e:
            logger.warning(f"Failed to delete directory {dir_path}: {e}")
        return False


# Global instance
_temp_file_manager = None
_manager_lock = threading.Lock()


def get_temp_file_manager() -> TempFileManager:
    """Get or create the global TempFileManager instance"""
    global _temp_file_manager

    if _temp_file_manager is None:
        with _manager_lock:
            if _temp_file_manager is None:
                _temp_file_manager = TempFileManager()
                _temp_file_manager.start_background_cleanup(check_interval_minutes=5)

    return _temp_file_manager
