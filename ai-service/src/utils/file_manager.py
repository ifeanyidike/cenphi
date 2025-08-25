# src/services/enhancement/utils/file_manager.py
import os
import shutil
import tempfile
import hashlib
import logging
import threading
import time
import stat
from typing import Optional, List, Dict, Any
from contextlib import contextmanager
from functools import lru_cache
import weakref
import gc
import uuid

logger = logging.getLogger(__name__)


class FileManager:
    """
    File manager with optimized I/O operations,
    memory-efficient handling, thread safety, and robust error recovery.
    """
    
    def __init__(self, temp_base_dir: Optional[str] = None):
        self.temp_base_dir = temp_base_dir or tempfile.gettempdir()
        self._temp_files = set()  # Track temporary files
        self._lock = threading.RLock()  # Reentrant lock for nested operations
        self._cleanup_registered = False
        
        # Performance optimization settings
        self._buffer_size = 64 * 1024  # 64KB buffer for file operations
        self._hash_chunk_size = 8192  # 8KB chunks for hashing
        self._max_temp_files = 100  # Maximum temp files to track
        
        # Register cleanup with weak reference to avoid circular references
        if not self._cleanup_registered:
            self._register_cleanup()
            self._cleanup_registered = True
    
    def _register_cleanup(self):
        """Register cleanup handlers with weak references"""
        import atexit
        import signal
        
        # Create weak reference to self to avoid memory leaks
        weak_self = weakref.ref(self)
        
        def cleanup_handler():
            self_ref = weak_self()
            if self_ref is not None:
                self_ref.cleanup_all_temp_files()
        
        atexit.register(cleanup_handler)
        
        # Handle common signals for graceful cleanup
        for sig in [signal.SIGTERM, signal.SIGINT]:
            try:
                signal.signal(sig, lambda s, f: cleanup_handler())
            except (ValueError, OSError):
                # Signal handling may not be available in all contexts
                pass
    
    @contextmanager
    def temp_file_context(self, suffix: str = "", prefix: str = "enh_", 
                         auto_cleanup: bool = True):
        """
        Context manager for temporary files with automatic cleanup.
        
        Args:
            suffix: File extension
            prefix: Filename prefix
            auto_cleanup: Whether to cleanup on exit
            
        Yields:
            Path to temporary file
        """
        temp_file = None
        try:
            temp_file = self.create_temp_file(suffix=suffix, prefix=prefix)
            yield temp_file
        finally:
            if temp_file and auto_cleanup:
                self.remove_file(temp_file)
    
    def create_temp_file(self, suffix: str = ".tmp", prefix: str = "tmp_", prefer_file_name: str | None = None) -> str:
        """
        Create temporary file with optimized naming and tracking.
        Works in threaded AND non-threaded contexts.
        
        Args:
            suffix: File extension
            prefix: Filename prefix
            
        Returns:
            Path to temporary file
        """
        try:
            with self._lock:
                # Clean up old temp files if we're tracking too many
                if len(self._temp_files) >= self._max_temp_files:
                    self._cleanup_stale_temp_files()
                
                # Generate unique filename with high-resolution timestamp
                timestamp = f"{int(time.time() * 1000000)}"  # Microsecond precision
                
                # SAFE thread ID handling for all contexts
                try:
                    thread_id = threading.get_ident()
                    thread_str = str(thread_id)[-6:]  # Last 6 digits for readability
                except (AttributeError, ImportError):
                    # Fallback for contexts where threading isn't available
                    thread_str = "main"
                except Exception:
                    # Any other threading issue
                    thread_str = "single"
                
                filename = f"{prefix}{timestamp}_{thread_str}{suffix}"
                if prefer_file_name:
                    filename = f"{prefer_file_name}{suffix}"
                
                # FIXED: Use system temp directly (no subdirectories)
                temp_path = os.path.join(tempfile.gettempdir(), filename)
                
                # Create file atomically
                try:
                    # Use exclusive creation to avoid race conditions
                    fd = os.open(temp_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                    os.close(fd)
                except FileExistsError:
                    # Fallback to system temp if naming collision
                    fd, temp_path = tempfile.mkstemp(suffix=suffix, prefix=prefix)
                    os.close(fd)
                
                # Track for cleanup
                self._temp_files.add(temp_path)
                
                logger.debug(f"Created temp file: {os.path.basename(temp_path)}")
                return temp_path
                
        except Exception as e:
            logger.error(f"Failed to create temp file: {e}")
            # Ultimate fallback
            fd, temp_path = tempfile.mkstemp(suffix=suffix, prefix=prefix)
            os.close(fd)
            with self._lock:
                self._temp_files.add(temp_path)
            return temp_path
        
    def create_temp_video(self, prefix: str = "video_") -> str:
        return self.create_temp_file(prefix=prefix, suffix=".mp4")

    def create_temp_audio(self, prefix: str = "audio_") -> str:
        return self.create_temp_file(prefix=prefix, suffix=".wav")
    
    def create_temp_vtt(self, prefix: str = "subtitle_") -> str:
        return self.create_temp_file(prefix=prefix, suffix=".vtt")
    
    def create_temp_srt(self, prefix: str = "subtitle_") -> str:
        return self.create_temp_file(prefix=prefix, suffix=".srt")
    
    
    def copy_file_optimized(self, src: str, dst: str, 
                           verify: bool = False, 
                           preserve_metadata: bool = True) -> bool:
        """
        High-performance file copy with optional verification.
        
        Args:
            src: Source file path
            dst: Destination file path
            verify: Whether to verify copy integrity
            preserve_metadata: Whether to preserve file metadata
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self._validate_file_exists(src):
                logger.error(f"Source file does not exist: {src}")
                return False
            
            # Ensure destination directory exists
            dst_dir = os.path.dirname(dst)
            if dst_dir and not self._ensure_directory_atomic(dst_dir):
                return False
            
            # Get source file info for optimization
            src_stat = os.stat(src)
            src_size = src_stat.st_size
            
            # Choose optimal copy method based on file size and platform
            if src_size > 100 * 1024 * 1024:  # >100MB
                success = self._copy_large_file(src, dst, src_size)
            else:
                success = self._copy_standard_file(src, dst, preserve_metadata)
            
            if not success:
                return False
            
            # Verify copy if requested
            if verify and not self._verify_copy_optimized(src, dst, src_size):
                logger.error(f"Copy verification failed: {src} -> {dst}")
                self.remove_file(dst)
                return False
            
            logger.debug(f"File copied successfully: {os.path.basename(src)} -> {os.path.basename(dst)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to copy file {src} -> {dst}: {e}")
            return False
    
    def _copy_large_file(self, src: str, dst: str, file_size: int) -> bool:
        """Optimized copying for large files using buffered I/O"""
        try:
            # Use larger buffer for large files
            buffer_size = min(1024 * 1024, file_size // 100)  # 1MB or 1% of file size
            buffer_size = max(buffer_size, self._buffer_size)  # At least default buffer size
            
            with open(src, 'rb') as src_file, open(dst, 'wb') as dst_file:
                # Copy in chunks with progress tracking
                copied = 0
                while True:
                    chunk = src_file.read(buffer_size)
                    if not chunk:
                        break
                    
                    dst_file.write(chunk)
                    copied += len(chunk)
                    
                    # Optional: Add progress logging for very large files
                    if file_size > 500 * 1024 * 1024:  # >500MB
                        progress = (copied / file_size) * 100
                        if copied % (50 * 1024 * 1024) == 0:  # Log every 50MB
                            logger.debug(f"Copy progress: {progress:.1f}%")
                
                # Ensure data is written to disk
                dst_file.flush()
                os.fsync(dst_file.fileno())
            
            return True
            
        except Exception as e:
            logger.error(f"Large file copy failed: {e}")
            return False
        
    def create_temp_dir(self, prefix: str = "temp_", suffix: str = "") -> str:
        """Create a temporary directory that will be tracked for cleanup"""
        try:
            # Create unique directory name
            unique_id = str(uuid.uuid4())[:8]
            dir_name = f"{prefix}{unique_id}{suffix}"
            temp_dir = os.path.join(tempfile.gettempdir(), dir_name)
            
            # Create the directory
            os.makedirs(temp_dir, exist_ok=True)
            
            # Track for cleanup
            with self._lock:
                self._temp_files.add(temp_dir)
            
            return temp_dir
            
        except Exception as e:
            logger.error(f"Failed to create temp directory: {e}")
            # Fallback to standard tempfile
            temp_dir = tempfile.mkdtemp(prefix=prefix, suffix=suffix)
            with self._lock:
                self._temp_files.add(temp_dir)
            return temp_dir

    def remove_dir(self, dir_path: str) -> bool:
        """Remove directory and all contents"""
        try:
            if os.path.exists(dir_path) and os.path.isdir(dir_path):
                import shutil
                shutil.rmtree(dir_path, ignore_errors=True)
                
                # Remove from tracking
                with self._lock:
                    if dir_path in self._temp_files:
                        self._temp_files.remove(dir_path)
                
                return True
            return False
            
        except Exception as e:
            logger.warning(f"Failed to remove directory {dir_path}: {e}")
            return False
    
    def _copy_standard_file(self, src: str, dst: str, preserve_metadata: bool) -> bool:
        """Standard file copy using optimized system calls"""
        try:
            if preserve_metadata:
                # Use shutil.copy2 for metadata preservation
                shutil.copy2(src, dst)
            else:
                # Use shutil.copyfile for faster copying without metadata
                shutil.copyfile(src, dst)
            
            return True
            
        except Exception as e:
            logger.error(f"Standard file copy failed: {e}")
            return False
    
    def move_file(self, src: str, dst: str, atomic: bool = True) -> bool:
        """
        Safe file move with atomic operation support.
        
        Args:
            src: Source file path
            dst: Destination file path
            atomic: Whether to perform atomic move
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self._validate_file_exists(src):
                logger.error(f"Source file does not exist: {src}")
                return False
            
            # Ensure destination directory exists
            dst_dir = os.path.dirname(dst)
            if dst_dir and not self._ensure_directory_atomic(dst_dir):
                return False
            
            if atomic and self._can_atomic_move(src, dst):
                # Atomic move using rename (same filesystem)
                os.rename(src, dst)
            else:
                # Cross-filesystem move using copy + delete
                if not self.copy_file_optimized(src, dst, verify=True):
                    return False
                
                # Remove source only after successful copy
                if not self.remove_file(src):
                    logger.warning(f"Failed to remove source after copy: {src}")
            
            logger.debug(f"File moved successfully: {os.path.basename(src)} -> {os.path.basename(dst)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to move file {src} -> {dst}: {e}")
            return False
    
    def _can_atomic_move(self, src: str, dst: str) -> bool:
        """Check if atomic move is possible (same filesystem)"""
        try:
            src_stat = os.stat(src)
            dst_dir_stat = os.stat(os.path.dirname(dst))
            return src_stat.st_dev == dst_dir_stat.st_dev
        except Exception:
            return False
    
    def remove_file(self, file_path: str, secure: bool = False) -> bool:
        """
        Safe file removal with optional secure deletion.
        
        Args:
            file_path: Path to file to remove
            secure: Whether to perform secure deletion
            
        Returns:
            True if successful or file doesn't exist, False on error
        """
        try:
            if not os.path.exists(file_path):
                return True
            
            # Remove read-only protection if present
            try:
                os.chmod(file_path, stat.S_IWRITE | stat.S_IREAD)
            except Exception:
                pass  # Ignore permission errors
            
            if secure:
                self._secure_delete_file(file_path)
            else:
                os.unlink(file_path)
            
            # Remove from tracking
            with self._lock:
                self._temp_files.discard(file_path)
            
            logger.debug(f"File removed: {os.path.basename(file_path)}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove file {file_path}: {e}")
            return False
    
    def _secure_delete_file(self, file_path: str):
        """Secure file deletion by overwriting with random data"""
        try:
            file_size = os.path.getsize(file_path)
            
            with open(file_path, 'r+b') as f:
                # Overwrite with random data (simplified secure deletion)
                import random
                for _ in range(3):  # 3 passes
                    f.seek(0)
                    f.write(bytes(random.getrandbits(8) for _ in range(file_size)))
                    f.flush()
                    os.fsync(f.fileno())
            
            os.unlink(file_path)
            
        except Exception as e:
            logger.warning(f"Secure deletion failed, using standard deletion: {e}")
            os.unlink(file_path)
    
    @lru_cache(maxsize=256)
    def get_file_size(self, file_path: str) -> int:
        """
        Get file size with caching for repeated calls.
        
        Args:
            file_path: Path to file
            
        Returns:
            File size in bytes, 0 if error
        """
        try:
            return os.path.getsize(file_path)
        except Exception:
            return 0
    
    def get_file_hash(self, file_path: str, algorithm: str = "sha256", 
                     chunk_size: Optional[int] = None) -> Optional[str]:
        """
        Calculate file hash efficiently with memory optimization.
        
        Args:
            file_path: Path to file
            algorithm: Hash algorithm ('md5', 'sha1', 'sha256', 'sha512')
            chunk_size: Size of chunks to read (None for auto)
            
        Returns:
            Hex digest of hash, None on error
        """
        try:
            hash_func = hashlib.new(algorithm)
            chunk_size = chunk_size or self._hash_chunk_size
            
            file_size = self.get_file_size(file_path)
            
            # Optimize chunk size for file size
            if file_size > 100 * 1024 * 1024:  # >100MB
                chunk_size = 64 * 1024  # 64KB chunks
            elif file_size > 10 * 1024 * 1024:  # >10MB
                chunk_size = 32 * 1024  # 32KB chunks
            
            with open(file_path, 'rb') as f:
                while True:
                    chunk = f.read(chunk_size)
                    if not chunk:
                        break
                    hash_func.update(chunk)
            
            return hash_func.hexdigest()
            
        except Exception as e:
            logger.error(f"Failed to calculate hash for {file_path}: {e}")
            return None
    
    def ensure_free_space(self, required_bytes: int, path: str = None) -> bool:
        """
        Check available disk space with caching.
        
        Args:
            required_bytes: Required space in bytes
            path: Path to check (defaults to temp directory)
            
        Returns:
            True if sufficient space available
        """
        try:
            available = self._get_available_space_cached(path)
            
            # Add 10% buffer for safety
            required_with_buffer = int(required_bytes * 1.1)
            
            return available >= required_with_buffer
            
        except Exception as e:
            logger.error(f"Failed to check free space: {e}")
            return True  # Assume sufficient space on error
    
    @lru_cache(maxsize=16)
    def _get_available_space_cached(self, path: str) -> int:
        """Cached disk space check (expires based on cache size)"""
        try:
            if os.name == 'nt':  # Windows
                import ctypes
                free_bytes = ctypes.c_ulonglong(0)
                ctypes.windll.kernel32.GetDiskFreeSpaceExW(
                    ctypes.c_wchar_p(path),
                    ctypes.pointer(free_bytes),
                    None, None
                )
                return free_bytes.value
            else:  # Unix-like
                statvfs = os.statvfs(path)
                return statvfs.f_frsize * statvfs.f_bavail
                
        except Exception:
            return 0
    
    def cleanup_temp_file(self, file_path: str) -> bool:
        """Clean up specific temporary file"""
        if file_path in self._temp_files:
            if os.path.isdir(file_path):
                return self.remove_dir(file_path)
            return self.remove_file(file_path)
        return True
    
    def cleanup_all_temp_files(self) -> int:
        """Clean up all tracked temporary files"""
        cleaned_count = 0
        
        with self._lock:
            temp_files_copy = self._temp_files.copy()
            self._temp_files.clear()
        
        for temp_file in temp_files_copy:
            # if self.remove_file(temp_file):
            #     cleaned_count += 1
            if self.cleanup_temp_file(temp_file):
                cleaned_count += 1
    
        
        if cleaned_count > 0:
            logger.info(f"Cleaned up {cleaned_count} temporary files")
        
        # Force garbage collection
        gc.collect()
        
        return cleaned_count
    
    def _cleanup_stale_temp_files(self):
        """Clean up stale temporary files that no longer exist"""
        with self._lock:
            existing_files = {f for f in self._temp_files if os.path.exists(f)}
            removed_count = len(self._temp_files) - len(existing_files)
            self._temp_files = existing_files
            
            if removed_count > 0:
                logger.debug(f"Removed {removed_count} stale temp file references")
    
    
    def _validate_file_exists(self, file_path: str) -> bool:
        """Fast file existence validation"""
        try:
            return file_path and os.path.isfile(file_path) and os.access(file_path, os.R_OK)
        except Exception:
            return False
    
    def _ensure_directory_atomic(self, directory: str) -> bool:
        """
        Atomically ensure directory exists.
        
        Args:
            directory: Directory path to create
            
        Returns:
            True if directory exists/created, False on error
        """
        try:
            os.makedirs(directory, exist_ok=True)
            return True
        except Exception as e:
            logger.error(f"Failed to create directory {directory}: {e}")
            return False
    
    def _verify_copy_optimized(self, src: str, dst: str, expected_size: int) -> bool:
        """
        Optimized copy verification.
        
        Args:
            src: Source file path
            dst: Destination file path
            expected_size: Expected file size
            
        Returns:
            True if verification passed
        """
        try:
            # Quick size check first
            dst_size = self.get_file_size(dst)
            if dst_size != expected_size:
                logger.error(f"Size mismatch: expected {expected_size}, got {dst_size}")
                return False
            
            # For large files, size check is usually sufficient
            if expected_size > 100 * 1024 * 1024:  # >100MB
                return True
            
            # For smaller files, compare hashes
            src_hash = self.get_file_hash(src, algorithm="md5")  # MD5 is faster for verification
            dst_hash = self.get_file_hash(dst, algorithm="md5")
            
            if src_hash != dst_hash:
                logger.error("Hash mismatch during copy verification")
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Copy verification failed: {e}")
            return False
        
    def extract_extension_from_url(self, url: str) -> str:
        """Extract file extension from URL safely"""
        try:
            if '.' in url.split('/')[-1]:
                ext = '.' + url.split('.')[-1].split('?')[0].lower()
                if len(ext) <= 6 and ext.replace('.', '').isalnum():
                    return ext
            return '.tmp'
        except Exception:
            return '.tmp'

    def extract_extension_from_content_type(self, content_type: str) -> str:
        """Extract file extension from HTTP content-type header"""
        try:
            content_type = content_type.lower()
            type_map = {
                'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
                'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/x-msvideo': '.avi',
                'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/mp4': '.m4a'
            }
            
            for mime_type, ext in type_map.items():
                if mime_type in content_type:
                    return ext
            
            if 'image' in content_type: return '.jpg'
            elif 'video' in content_type: return '.mp4' 
            elif 'audio' in content_type: return '.mp3'
            return '.tmp'
        except Exception:
            return '.tmp'

    def create_download_temp_file(self, url: str, content_type: str = None, 
                             prefer_user_dir: str = None, prefer_file_name: str = None) -> str:
        """Create temporary file optimized for downloads"""
        try:
            # Determine file extension
            file_ext = self.extract_extension_from_url(url)
            if file_ext == '.tmp' and content_type:
                file_ext = self.extract_extension_from_content_type(content_type)
            
            # Try user-specified directory first
            if prefer_user_dir and os.path.exists(prefer_user_dir):
                timestamp = f"{int(time.time() * 1000000)}"
                thread_id = threading.get_ident()
                
                filename = f"download_{timestamp}_{thread_id}{file_ext}"
                if prefer_file_name:
                    filename = f"{prefer_file_name}{file_ext}"
                temp_path = os.path.join(prefer_user_dir, filename)
                
                try:
                    # Create file atomically
                    fd = os.open(temp_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                    os.close(fd)
                    
                    # Track for cleanup
                    with self._lock:
                        self._temp_files.add(temp_path)
                    
                    return temp_path
                except FileExistsError:
                    # Fall through to standard method
                    pass
            
            # Use standard temp file creation
            return self.create_temp_file(suffix=file_ext, prefix="download_", prefer_file_name=prefer_file_name or None)
            
        except Exception as e:
            logger.warning(f"Failed to create download temp file: {e}")
            return self.create_temp_file(suffix=".tmp", prefix="download_")

    def validate_download_space(self, expected_size: int, target_dir: str = None) -> bool:
        """Validate sufficient space for download"""
        try:
            if expected_size <= 0:
                return True
            return self.ensure_free_space(expected_size, target_dir)
        except Exception:
            return True
    
    def get_temp_file_count(self) -> int:
        """Get number of tracked temporary files"""
        with self._lock:
            return len(self._temp_files)
    
    def get_temp_files_info(self) -> List[Dict[str, Any]]:
        """Get information about tracked temporary files"""
        info_list = []
        
        with self._lock:
            temp_files_copy = self._temp_files.copy()
        
        for temp_file in temp_files_copy:
            info = {
                'path': temp_file,
                'basename': os.path.basename(temp_file),
                'exists': os.path.exists(temp_file),
                'size': self.get_file_size(temp_file) if os.path.exists(temp_file) else 0
            }
            
            try:
                if os.path.exists(temp_file):
                    stat_info = os.stat(temp_file)
                    info.update({
                        'created_time': stat_info.st_ctime,
                        'modified_time': stat_info.st_mtime,
                        'age_seconds': time.time() - stat_info.st_ctime
                    })
            except Exception:
                pass
            
            info_list.append(info)
        
        return info_list
    
    def __del__(self):
        """Destructor with safe cleanup"""
        try:
            self.cleanup_all_temp_files()
        except Exception:
            # Ignore errors during destruction
            pass