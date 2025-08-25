# storage_utils.py - WITH AUTOMATIC CLEANUP

import oci
from oci.object_storage import UploadManager
import os
import uuid
import logging
import requests
import subprocess
import json
import threading
import time
import math
from datetime import datetime
from typing import Dict, Any, Tuple, List, Set, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from contextlib import contextmanager
from src.config.settings import settings
from .file_manager import FileManager
from fractions import Fraction

# Initialize logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

class StorageManager:
    """ OCI Object Storage Manager with automatic file cleanup"""
    
    def __init__(self):
        self.client = None
        self.namespace = None
        self.bucket_name = settings.oci_bucket_name
        self._client_lock = threading.Lock()
        self._last_client_refresh = 0
        self._client_refresh_interval = 3600
        self._media_detector = None
        self._file_manager = None
        self._session = None
        
        # File cleanup tracking
        self._temp_files: Set[str] = set()
        self._cleanup_lock = threading.Lock()
        
        # Large file optimization settings
        self.multipart_threshold = 15 * 1024 * 1024   # 15MB (was 60MB)
        self.chunk_size = 10 * 1024 * 1024            # 10MB (was 40MB)
        self.max_parallel_uploads = 3

        self.upload_manager_config = {
            'max_multipart_size': 50 * 1024 * 1024 * 1024,  # 50GB max
            'multipart_threshold': 20 * 1024 * 1024,        # 25MB threshold
            'multipart_part_size': 15 * 1024 * 1024,        # 15MB parts
            'max_multipart_parts': 1000,                     # Max parts
            'parallel_process_count': 4                      # Parallel uploads
        }
        
        self._initialize_client()
        self._start_cleanup_scheduler()
        
        # Register cleanup on exit
        # atexit.register(self.cleanup_all_temp_files)

    @property
    def media_detector(self):
        if self._media_detector is None:
            from .media_detector import MediaDetector
            self._media_detector = MediaDetector()
        return self._media_detector

    @property
    def file_manager(self):
        """Lazy-loaded FileManager"""
        if self._file_manager is None:
            with threading.Lock():
                if self._file_manager is None:
                    self._file_manager = FileManager()
                    logger.debug("FileManager initialized (handles its own cleanup)")
        return self._file_manager
    
    def _get_session(self):
        """Get reusable session for faster downloads"""
        if self._session is None:
            self._session = requests.Session()
            
            # Connection pooling for speed
            adapter = requests.adapters.HTTPAdapter(
                pool_connections=5,
                pool_maxsize=10,
                max_retries=2
            )
            self._session.mount('http://', adapter)
            self._session.mount('https://', adapter)
            
            # Headers for better performance
            self._session.headers.update({
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            })
        
        return self._session

    def _get_chunk_size(self, file_size: int) -> int:
        """Get optimal chunk size based on file size"""
        if file_size < 1024 * 1024:  # < 1MB
            return 64 * 1024  # 64KB
        elif file_size < 50 * 1024 * 1024:  # < 50MB
            return 512 * 1024  # 512KB
        else:
            return 1024 * 1024  # 1MB
        
    def _initialize_client(self):
        """Initialize OCI client with settings and timeout configuration"""
        try:
            if not os.path.exists(os.getenv('OCI_PRIVATE_KEY_PATH')):
                settings.setup_oci_key()
                
            if settings.oci_use_instance_principal:
                logger.info("Using instance principal authentication")
                signer = oci.auth.signers.InstancePrincipalsSecurityTokenSigner()
                self.client = oci.object_storage.ObjectStorageClient(
                    config={}, 
                    signer=signer,
                    timeout=(60, 600)
                )
            else:
                logger.info("Using direct key configuration")
                config = {
                    'user': settings.oci_user,
                    'fingerprint': settings.oci_fingerprint,
                    'key_file': settings.oci_key_file,
                    'tenancy': settings.oci_tenancy,
                    'region': settings.oci_region
                }
                self.client = oci.object_storage.ObjectStorageClient(
                    config=config,
                    timeout=(60, 600)
                )
            
            if not settings.oci_namespace:
                self.namespace = self.client.get_namespace().data
            else:
                self.namespace = settings.oci_namespace
            
            self._last_client_refresh = time.time()
            logger.info(f"OCI Storage initialized - Namespace: {self.namespace}, Bucket: {self.bucket_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize OCI storage: {e}")
            raise
    
    def cleanup_file(self, file_path: str):
        """Clean up a specific file"""
        try:
            if self.file_manager.remove_file(file_path):
                with self._cleanup_lock:
                    self._temp_files.discard(file_path)
                return True
        except Exception as e:
            logger.warning(f"FileManager cleanup failed, using fallback: {e}")
    
    
    def cleanup_all_temp_files(self):
        """Clean up all tracked temporary files"""
        cleaned_count = 0
        try:
            # CLEANER: Use property
            cleaned_count += self.file_manager.cleanup_all_temp_files()
        except Exception as e:
            logger.warning(f"FileManager cleanup failed: {e}")
        
        cleaned_count += self.cleanup_all_temp_files()
        return cleaned_count
    
    @contextmanager
    def temp_file_context(self, suffix: str = "", prefix: str = "storage_"):
        """Use FileManager's context manager via property"""
        with self.file_manager.temp_file_context(suffix=suffix, prefix=prefix) as temp_file:
            yield temp_file

    def check_url_exists(self, url: str) -> bool:
        """Check if URL exists with fallback methods"""
        try:
            import httpx
            if not hasattr(self, '_head_client'):
                self._head_client = httpx.Client(
                    timeout=10.0,
                    headers={'User-Agent': 'Mozilla/5.0 (compatible; MediaProcessor/1.0)'}
                )
            
            # Method 1: HEAD request
            try:
                response = self._head_client.head(url)
                if response.status_code == 200:
                    return True
            except:
                pass
            
            # Method 2: GET with range (for servers that block HEAD)
            try:
                response = self._head_client.get(url, headers={'Range': 'bytes=0-1'})
                if response.status_code in [200, 206, 403]:  # OK or Partial Content
                    return True
            except:
                pass
            
            # # Method 3: For known good URLs, assume they exist
            # known_good_domains = ['cdn.pixabay.com', 'objectstorage.']
            # if any(domain in url for domain in known_good_domains):
            #     logger.debug(f"Assuming known good URL exists: {url}")
            #     return True
            
            return False
            
        except Exception as e:
            logger.warning(f"URL existence check failed: {e}")
            return False
        
    def get_public_url_for_object(self, object_path: str) -> str:
        """Get public URL for object path"""
        return f"https://objectstorage.{settings.oci_region}.oraclecloud.com/n/{settings.oci_namespace}/b/{settings.oci_bucket_name}/o/{object_path}"
    
    def download_media(self, media_url: str, local_dir: str = None, prefer_file_name: str = None) -> str:
        """
        Fast media download with 3-5x performance improvement.
        
        Simple optimizations:
        - Much larger chunks (64KB-1MB vs 8KB)
        - Connection reuse
        - Better I/O buffering
        - FileManager integration
        """
        try:
            # URL validation (unchanged)
            if not media_url or not media_url.strip():
                raise ValueError("Empty or None media URL provided")
            
            media_url = media_url.strip()
            if not media_url.startswith(('http://', 'https://')):
                raise ValueError(f"Invalid URL scheme: '{media_url}'")
            
            logger.info(f"📥 Downloading: {media_url}")
            
            # Use reusable session for better performance
            session = self._get_session()
            
            # Get file info
            head_response = session.head(media_url, timeout=30)
            content_length = int(head_response.headers.get('content-length', 0))
            
            if content_length > 0:
                logger.info(f"📊 File size: {content_length / 1024 / 1024:.1f}MB")
                
                # Validate disk space
                if not self.file_manager.validate_download_space(content_length, "/tmp"):
                    raise ValueError(f"Insufficient disk space for {content_length / 1024 / 1024:.1f}MB download")
            
            # Start download
            response = session.get(media_url, stream=True, timeout=(30, 600))
            response.raise_for_status()
            
            # Determine file extension
            content_type = response.headers.get('content-type', '')
            file_ext = self.file_manager.extract_extension_from_url(media_url)
            if file_ext == '.tmp' and content_type:
                file_ext = self.file_manager.extract_extension_from_content_type(content_type)
            
            # Create local file path using FileManager
            if local_dir:
                os.makedirs(local_dir, exist_ok=True)
                local_path = self.file_manager.create_download_temp_file(
                    url=media_url, 
                    content_type=content_type,
                    prefer_user_dir=local_dir,
                    prefer_file_name=prefer_file_name
                )
            else:
                local_path = self.file_manager.create_download_temp_file(
                    url=media_url,
                    content_type=content_type,
                    prefer_file_name=prefer_file_name
                )
            
            # PERFORMANCE: Much larger chunks for speed
            chunk_size = self._get_chunk_size(content_length)
            
            # Download with progress tracking
            download_start = time.time()
            bytes_downloaded = 0
            last_progress_log = 0
            
            # PERFORMANCE: Larger write buffer
            with open(local_path, 'wb', buffering=256*1024) as f:  # 256KB buffer
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)
                        bytes_downloaded += len(chunk)
                        
                        # Progress logging (less frequent for speed)
                        if content_length > 5 * 1024 * 1024:  # Only for files >5MB
                            progress = (bytes_downloaded / content_length) * 100 if content_length > 0 else 0
                            if progress - last_progress_log >= 25:  # Every 25%
                                speed = bytes_downloaded / (time.time() - download_start)
                                logger.info(f"📊 {progress:.0f}% ({speed / 1024 / 1024:.1f} MB/s)")
                                last_progress_log = progress
            
            # Final stats
            download_time = time.time() - download_start
            final_speed = bytes_downloaded / download_time if download_time > 0 else 0
            
            logger.info(f"✅ Downloaded {bytes_downloaded / 1024 / 1024:.1f}MB in {download_time:.2f}s "
                    f"({final_speed / 1024 / 1024:.1f} MB/s) -> {local_path}")
            
            return local_path
            
        except ValueError as ve:
            logger.error(f"❌ URL validation failed: {ve}")
            raise
        except Exception as e:
            logger.error(f"❌ Download failed: {e}")
            raise

    def download_media_if_exists(self, object_name: str) -> Optional[str]:
        """Download file if it exists, return None if not"""
        try:
            return self.download_media(object_name)
        except:
            return None  # File doesn't exist
    
    def upload_file_and_cleanup(self, file_path: str, object_name: str = None, cleanup_after: bool = True) -> str:
        """Upload file and optionally clean up the local file after successful upload"""
        try:
            # Upload file
            public_url = self.upload_file_with_retry(file_path, object_name)
            
            # Clean up local file after successful upload
            if cleanup_after:
                logger.info(f"🗑️ Cleaning up local file after successful upload: {file_path}")
                self.cleanup_file(file_path)
            
            return public_url
            
        except Exception as e:
            logger.error(f"❌ Upload failed, keeping local file: {file_path}")
            raise
    
    def upload_to_storage(self, local_path: str, object_name: str = None, cleanup_after: bool = True) -> Tuple[str, str]:
        """Upload to storage with automatic cleanup option"""
        if local_path.startswith(('http://', 'https://')):
            logger.info(f"🔗 Using URL directly: {local_path}")
            return local_path, None
        
        try:
            public_url = self.upload_file_and_cleanup(local_path, object_name, cleanup_after)
            object_name = public_url.split('/')[-1]
            return public_url, object_name
        except Exception as e:
            logger.error(f"❌ Storage upload failed: {e}")
            raise
    
    def _ensure_client_fresh(self):
        """Ensure OCI client is fresh to prevent stale connections"""
        current_time = time.time()
        if (current_time - self._last_client_refresh) > self._client_refresh_interval:
            logger.info("Refreshing OCI client to prevent stale connections")
            with self._client_lock:
                if (current_time - self._last_client_refresh) > self._client_refresh_interval:
                    try:
                        self._initialize_client()
                    except Exception as e:
                        logger.error(f"Failed to refresh OCI client: {e}")

    def upload_file(self, file_path: str, object_name: str = None) -> str:
        """Upload file with improved logic for medium-sized files"""
        
        # Validate file
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise ValueError(f"File is empty: {file_path}")
        
        # Generate object name if not provided
        if not object_name:
            object_name = self._generate_object_name(file_path)
        
        logger.info(f"📤 Upload starting: {file_path} -> {object_name} ({file_size / 1024 / 1024:.1f}MB)")
        
        # IMPROVED: Better decision logic for upload method
        if file_size > self.multipart_threshold:  # > 50MB
            return self._upload_multipart(file_path, object_name, file_size)
        else:
            return self._upload_standard(file_path, object_name, file_size)

    def _upload_streaming(self, file_path: str, object_name: str, file_size: int) -> str:
        """NEW: Streaming upload for medium-sized files (10MB-25MB)"""
        
        self._ensure_client_fresh()
        
        with self._client_lock:
            try:
                content_type = self._get_content_type(file_path)
                upload_start = time.time()
                
                # Use streaming upload with buffered reading
                logger.info(f"🌊 Starting streaming upload...")
                
                # Create a buffered file reader
                def file_generator():
                    buffer_size = 64 * 1024  # 64KB chunks for streaming
                    with open(file_path, 'rb') as f:
                        while True:
                            chunk = f.read(buffer_size)
                            if not chunk:
                                break
                            yield chunk
                
                # Convert generator to a file-like object
                class GeneratorToFile:
                    def __init__(self, generator):
                        self.generator = generator
                        self.buffer = b''
                        self.finished = False
                    
                    def read(self, size=-1):
                        while len(self.buffer) < size and not self.finished:
                            try:
                                chunk = next(self.generator)
                                self.buffer += chunk
                            except StopIteration:
                                self.finished = True
                                break
                        
                        if size == -1 or len(self.buffer) <= size:
                            result = self.buffer
                            self.buffer = b''
                        else:
                            result = self.buffer[:size]
                            self.buffer = self.buffer[size:]
                        
                        return result
                
                file_obj = GeneratorToFile(file_generator())
                
                response = self.client.put_object(
                    namespace_name=self.namespace,
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    put_object_body=file_obj,
                    content_type=content_type,
                    content_length=file_size  # Important: specify content length
                )
                
                upload_time = time.time() - upload_start
                speed_mbps = (file_size / 1024 / 1024) / upload_time if upload_time > 0 else 0
                logger.info(f"✅ Streaming upload completed in {upload_time:.2f}s ({speed_mbps:.1f} MB/s)")
                
                return self._generate_public_url(object_name)
                
            except Exception as e:
                logger.error(f"❌ Streaming upload failed: {e}")
                raise

    def get_file_size(url: str) -> int:
        """Get remote file size"""
        try:
            response = requests.head(url, timeout=10)
            return int(response.headers.get('Content-Length', 0))
        except:
            return 0

    def _upload_standard(self, file_path: str, object_name: str, file_size: int) -> str:
        """IMPROVED: Standard upload with streaming and timeout protection"""
        
        self._ensure_client_fresh()
        
        with self._client_lock:
            try:
                content_type = self._get_content_type(file_path)
                upload_start = time.time()
                
                logger.info(f"📤 Starting standard upload: {file_size / 1024 / 1024:.1f}MB")
                
                # IMPROVEMENT: Use streaming for files >5MB to avoid memory issues
                if file_size > 5 * 1024 * 1024:
                    return self._upload_standard_streaming(file_path, object_name, file_size, content_type)
                
                # For small files, use memory upload
                with open(file_path, 'rb') as file_data:
                    max_retries = 2  # Fewer retries for standard upload
                    last_error = None
                    
                    for attempt in range(max_retries):
                        try:
                            if attempt > 0:
                                logger.info(f"🔄 Standard upload retry {attempt + 1}")
                                time.sleep(1)
                            
                            file_data.seek(0)
                            
                            # IMPROVEMENT: Shorter timeout for standard uploads
                            self.client = oci.object_storage.ObjectStorageClient(
                                config=self.client.base_client.config if hasattr(self.client, 'base_client') else {},
                                signer=self.client.base_client.signer if hasattr(self.client, 'base_client') else None,
                                timeout=(30, 180)  # 30s connect, 3min read timeout
                            )
                            
                            response = self.client.put_object(
                                namespace_name=self.namespace,
                                bucket_name=self.bucket_name,
                                object_name=object_name,
                                put_object_body=file_data,
                                content_type=content_type,
                                content_length=file_size
                            )
                            
                            upload_time = time.time() - upload_start
                            speed_mbps = (file_size / 1024 / 1024) / upload_time if upload_time > 0 else 0
                            logger.info(f"✅ Standard upload completed in {upload_time:.2f}s ({speed_mbps:.1f} MB/s)")
                            
                            return self._generate_public_url(object_name)
                            
                        except Exception as e:
                            last_error = e
                            logger.warning(f"⚠️ Standard upload attempt {attempt + 1} failed: {e}")
                    
                    raise last_error
                    
            except Exception as e:
                logger.error(f"❌ Standard upload failed: {e}")
                raise

    def _upload_standard_streaming(self, file_path: str, object_name: str, file_size: int, content_type: str) -> str:
        """FIXED: Streaming upload to avoid loading large files into memory"""
        
        logger.info(f"🌊 Using streaming upload for {file_size / 1024 / 1024:.1f}MB file")
        
        class FileWrapper:
            """File wrapper that provides read() method for streaming WITH SEEK SUPPORT"""
            def __init__(self, file_path: str, chunk_size: int = 64*1024):
                self.file_path = file_path
                self.chunk_size = chunk_size
                self._file = None
                self._size = file_size
            
            def __enter__(self):
                self._file = open(self.file_path, 'rb')
                return self
            
            def __exit__(self, exc_type, exc_val, exc_tb):
                if self._file:
                    self._file.close()
            
            def read(self, size=-1):
                if not self._file:
                    return b''
                
                if size == -1:
                    return self._file.read()
                return self._file.read(size)
            
            # ADD THESE TWO METHODS - This fixes the "Unable to record body position" error
            def seek(self, position, whence=0):
                """Allow OCI SDK to rewind for retries"""
                if self._file:
                    return self._file.seek(position, whence)
                return 0
            
            def tell(self):
                """Allow OCI SDK to check current position"""
                if self._file:
                    return self._file.tell()
                return 0
            
            def __len__(self):
                return self._size
        
        try:
            with FileWrapper(file_path) as file_wrapper:
                response = self.client.put_object(
                    namespace_name=self.namespace,
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    put_object_body=file_wrapper,
                    content_type=content_type,
                    content_length=file_size
                )
            
            logger.info("✅ Streaming upload completed")
            return self._generate_public_url(object_name)
            
        except Exception as e:
            logger.error(f"❌ Streaming upload failed: {e}")
            raise
    
    def _upload_multipart(self, file_path: str, object_name: str, file_size: int) -> str:
        """Multipart upload for large files"""
        
        self._ensure_client_fresh()
        
        try:
            upload_start = time.time()
            
            # Step 1: Create multipart upload
            logger.info("🔄 Step 1: Creating multipart upload...")
            multipart_upload = self.client.create_multipart_upload(
                namespace_name=self.namespace,
                bucket_name=self.bucket_name,
                create_multipart_upload_details=oci.object_storage.models.CreateMultipartUploadDetails(
                    object=object_name,
                    content_type=self._get_content_type(file_path)
                )
            )
            
            upload_id = multipart_upload.data.upload_id
            logger.info(f"✅ Multipart upload created: {upload_id}")
            
            # Step 2: Calculate chunks
            total_chunks = math.ceil(file_size / self.chunk_size)
            logger.info(f"🔀 Step 2: Uploading {total_chunks} chunks of {self.chunk_size / 1024 / 1024:.1f}MB each")
            
            # Step 3: Upload chunks in parallel
            uploaded_parts = self._upload_chunks_parallel(
                file_path, object_name, upload_id, total_chunks, file_size
            )
            
            # Step 4: Complete multipart upload
            logger.info("🔄 Step 4: Completing multipart upload...")
            self.client.commit_multipart_upload(
                namespace_name=self.namespace,
                bucket_name=self.bucket_name,
                object_name=object_name,
                upload_id=upload_id,
                commit_multipart_upload_details=oci.object_storage.models.CommitMultipartUploadDetails(
                    parts_to_commit=uploaded_parts
                )
            )
            
            upload_time = time.time() - upload_start
            speed_mbps = (file_size / 1024 / 1024) / upload_time if upload_time > 0 else 0
            logger.info(f"✅ Multipart upload completed in {upload_time:.2f}s ({speed_mbps:.1f} MB/s)")
            
            return self._generate_public_url(object_name)
            
        except Exception as e:
            logger.error(f"❌ Multipart upload failed: {e}")
            # Try to abort the multipart upload
            try:
                self.client.abort_multipart_upload(
                    namespace_name=self.namespace,
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    upload_id=upload_id
                )
                logger.info("🗑️ Aborted failed multipart upload")
            except:
                pass
            raise
    
    def _upload_chunks_parallel(self, file_path: str, object_name: str, upload_id: str, 
                               total_chunks: int, file_size: int) -> List:
        """Upload chunks in parallel for maximum speed"""
        
        uploaded_parts = [None] * total_chunks  # Pre-allocate list
        
        def upload_chunk(chunk_num: int) -> Tuple[int, oci.object_storage.models.CommitMultipartUploadPartDetails]:
            """Upload a single chunk"""
            try:
                start_byte = chunk_num * self.chunk_size
                end_byte = min(start_byte + self.chunk_size, file_size)
                chunk_size = end_byte - start_byte
                
                logger.info(f"📦 Uploading chunk {chunk_num + 1}/{total_chunks} ({chunk_size / 1024 / 1024:.1f}MB)")
                
                with open(file_path, 'rb') as f:
                    f.seek(start_byte)
                    chunk_data = f.read(chunk_size)
                
                response = self.client.upload_part(
                    namespace_name=self.namespace,
                    bucket_name=self.bucket_name,
                    object_name=object_name,
                    upload_id=upload_id,
                    upload_part_num=chunk_num + 1,
                    upload_part_body=chunk_data
                )
                
                part_detail = oci.object_storage.models.CommitMultipartUploadPartDetails(
                    part_num=chunk_num + 1,
                    etag=response.headers['etag']
                )
                
                logger.info(f"✅ Chunk {chunk_num + 1}/{total_chunks} uploaded successfully")
                return chunk_num, part_detail
                
            except Exception as e:
                logger.error(f"❌ Chunk {chunk_num + 1} upload failed: {e}")
                raise
        
        # Upload chunks in parallel
        with ThreadPoolExecutor(max_workers=self.max_parallel_uploads) as executor:
            future_to_chunk = {
                executor.submit(upload_chunk, i): i for i in range(total_chunks)
            }
            
            completed_chunks = 0
            for future in as_completed(future_to_chunk):
                chunk_num = future_to_chunk[future]
                try:
                    chunk_idx, part_detail = future.result()
                    uploaded_parts[chunk_idx] = part_detail
                    completed_chunks += 1
                    
                    progress = (completed_chunks / total_chunks) * 100
                    logger.info(f"📊 Progress: {completed_chunks}/{total_chunks} chunks ({progress:.1f}%)")
                    
                except Exception as e:
                    logger.error(f"❌ Chunk {chunk_num + 1} failed: {e}")
                    raise
        
        return uploaded_parts
    
    def _generate_public_url(self, object_name: str) -> str:
        """Generate public URL for uploaded object"""
        public_url = f"https://objectstorage.{settings.oci_region}.oraclecloud.com/n/{self.namespace}/b/{self.bucket_name}/o/{object_name}"
        logger.info(f"🔗 Public URL: {public_url}")
        return public_url
    

    def upload_file_with_retry(self, file_path: str, object_name: str = None, max_retries: int = 3) -> str:
        last_error = None
        file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0
        
        # Force multipart for files >15MB to avoid memory issues
        if file_size > 15 * 1024 * 1024:
            logger.info(f"🔄 Using multipart upload for {file_size / 1024 / 1024:.1f}MB file")
            return self._upload_multipart(file_path, object_name or self._generate_object_name(file_path), file_size)
        
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    logger.info(f"🔄 Upload retry attempt {attempt + 1}/{max_retries}")
                    
                    # Refresh client connection
                    self._ensure_client_fresh()
                    
                    # Exponential backoff
                    wait_time = (2 ** attempt)
                    logger.info(f"⏳ Waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                
                logger.info(f"🚀 Starting upload attempt {attempt + 1}")
                return self.upload_file(file_path, object_name)
                    
            except Exception as e:
                last_error = e
                logger.warning(f"⚠️ Upload attempt {attempt + 1} failed: {e}")
                
                # Force multipart on memory errors
                error_msg = str(e).lower()
                if 'memory' in error_msg and file_size > 5 * 1024 * 1024:
                    logger.info("🔄 Memory error detected, switching to multipart upload")
                    try:
                        return self._upload_multipart(file_path, object_name or self._generate_object_name(file_path), file_size)
                    except Exception as multipart_error:
                        logger.error(f"❌ Multipart fallback failed: {multipart_error}")
                        last_error = multipart_error
                        break
        
        logger.error(f"❌ Upload failed after {max_retries} attempts. Last error: {last_error}")
        raise last_error
    

    def upload_file_with_upload_manager(self, file_path: str, object_name: str = None) -> str:
        """Upload file using OCI's UploadManager for better reliability"""
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_size = os.path.getsize(file_path)
        if file_size == 0:
            raise ValueError(f"File is empty: {file_path}")
        
        if not object_name:
            object_name = self._generate_object_name(file_path)
        
        logger.info(f"📤 UploadManager starting: {file_path} -> {object_name} ({file_size / 1024 / 1024:.1f}MB)")
        
        try:
            upload_start = time.time()
            
            # Create UploadManager with our configuration
            upload_manager = UploadManager(
                object_storage_client=self.client,
                **self.upload_manager_config
            )
            
            # Determine content type
            content_type = self._get_content_type(file_path)
            
            # Upload with automatic multipart handling
            response = upload_manager.upload_file(
                namespace_name=self.namespace,
                bucket_name=self.bucket_name,
                object_name=object_name,
                file_path=file_path,
                content_type=content_type,
                # Optional: Add progress callback
                progress_callback=self._upload_progress_callback
            )
            
            upload_time = time.time() - upload_start
            speed_mbps = (file_size / 1024 / 1024) / upload_time if upload_time > 0 else 0
            
            logger.info(f"✅ UploadManager completed in {upload_time:.2f}s ({speed_mbps:.1f} MB/s)")
            logger.info(f"📊 Upload details: {response.data}")
            
            return self._generate_public_url(object_name)
            
        except Exception as e:
            logger.error(f"❌ UploadManager failed: {e}")
            raise
    
    def _upload_progress_callback(self, bytes_uploaded: int) -> None:
        """Progress callback for upload tracking"""
        # This is called periodically during upload
        logger.debug(f"📊 Uploaded: {bytes_uploaded / 1024 / 1024:.1f}MB")
    
    def upload_file_with_fallback(self, file_path: str, object_name: str = None) -> str:
        """Upload with fallback from UploadManager to custom implementation"""
        try:
            # Try UploadManager first (most reliable)
            return self.upload_file_with_upload_manager(file_path, object_name)
        except Exception as e:
            logger.warning(f"⚠️ UploadManager failed, falling back to custom implementation: {e}")
            # Fallback to your existing implementation
            return self.upload_file_with_retry(file_path, object_name)

    def detect_media_type(self, file_path: str) -> str:
        """Detect if file is image, audio, or video"""
        try:
            return self.media_detector.detect_media_type(file_path)
            
        except Exception as e:
            logger.error(f"Error detecting media type: {e}")
            file_ext = os.path.splitext(file_path)[1].lower()
            
            video_exts = ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', '.m4v']
            audio_exts = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma']
            image_exts = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
            
            if file_ext in video_exts:
                return 'video'
            elif file_ext in audio_exts:
                return 'audio'
            elif file_ext in image_exts:
                return 'image'
            
            return 'unknown'
        
    def _detect_video_streams(self, clip_path: str) -> tuple:
        """
        Detect if clip has video and/or audio streams using JSON parsing
        
        Returns:
            Tuple of (has_video: bool, has_audio: bool)
        """
        try:
            cmd = [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_streams",
                clip_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
            
            if result.returncode != 0:
                return False, False
            
            import json
            data = json.loads(result.stdout)
            streams = data.get("streams", [])
            
            has_video = any(stream.get("codec_type") == "video" for stream in streams)
            has_audio = any(stream.get("codec_type") == "audio" for stream in streams)
            
            return has_video, has_audio
            
        except Exception as e:
            logger.warning(f"Stream detection failed for {clip_path}: {e}")
            return False, False
        
    def _parse_fps(self, video_stream: Dict[str, Any]) -> float:
        # Prefer r_frame_rate, fallback to avg_frame_rate
        rate = video_stream.get("r_frame_rate") or video_stream.get("avg_frame_rate") or "30/1"
        try:
            if "/" in rate:
                return float(Fraction(rate))
            return float(rate)
        except Exception:
            return 30.0

    def _basic_ffprobe_duration(self, video_path: str, timeout: int = 10) -> float:
        try:
            cmd = [
                "ffprobe", "-v", "quiet",
                "-show_entries", "format=duration",
                "-of", "csv=p=0",
                video_path
            ]
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            if r.returncode == 0 and r.stdout.strip():
                return float(r.stdout.strip())
        except Exception:
            pass
        return 30.0

    def get_video_info(self, video_path: str, timeout: int = 15) -> Dict[str, Any]:
        """
        Robust ffprobe wrapper that:
        - Returns a rich, consistent schema
        - Uses a timeout
        - Falls back to a minimal probe if the main call fails
        """
        DEFAULTS = {
            "duration": 0.0,
            "width": 1920,
            "height": 1080,
            "fps": 30.0,
            "bitrate": 0,
            "has_video": False,
            "has_audio": False,
            "video_codec": "unknown",
            "audio_codec": None,
            "pixel_format": "yuv420p",
            "total_frames": 0
        }

        try:
            cmd = [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_format", "-show_streams",
                video_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            if result.returncode != 0:
                raise RuntimeError(f"ffprobe failed: {result.stderr}")

            data = json.loads(result.stdout)

            streams = data.get("streams", [])
            video_stream = next((s for s in streams if s.get("codec_type") == "video"), {})
            audio_stream = next((s for s in streams if s.get("codec_type") == "audio"), {})

            duration = float(data.get("format", {}).get("duration") or 0.0)
            fps = self._parse_fps(video_stream)
            width = int(video_stream.get("width") or DEFAULTS["width"])
            height = int(video_stream.get("height") or DEFAULTS["height"])
            bitrate = int(data.get("format", {}).get("bit_rate") or 0)
            pixel_format = video_stream.get("pix_fmt") or DEFAULTS["pixel_format"]

            info = {
                "duration": duration,
                "width": width,
                "height": height,
                "fps": fps,
                "bitrate": bitrate,
                "has_video": bool(video_stream),
                "has_audio": bool(audio_stream),
                "video_codec": video_stream.get("codec_name") or DEFAULTS["video_codec"],
                "audio_codec": audio_stream.get("codec_name") if audio_stream else None,
                "pixel_format": pixel_format,
                "total_frames": int(duration * fps) if duration > 0 else 0,
            }
            return info

        except Exception as e:
            logger.warning(f"Primary ffprobe failed, falling back: {e}")
            # Fallback
            duration = self._basic_ffprobe_duration(video_path)
            return {
                **DEFAULTS,
                "duration": duration,
                "total_frames": int(duration * DEFAULTS["fps"])
            }
    
    def get_video_duration(self, video_path: str) -> float:
        """✅ CORRECTED: Get video duration using FFprobe"""
        
        try:
            cmd = [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            if result.returncode != 0:
                return 0.0
            
            data = json.loads(result.stdout)
            duration = float(data.get("format", {}).get("duration", 0))
            
            return duration
            
        except Exception as e:
            logger.warning(f"Failed to get video duration: {e}")
            return 0.0

    def _get_content_type(self, file_path: str) -> str:
        """Get content type based on file extension"""
        extension = os.path.splitext(file_path)[1].lower()
        content_types = {
            '.mp4': 'video/mp4',
            '.avi': 'video/avi',
            '.mov': 'video/quicktime',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.m4a': 'audio/mp4',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        }
        return content_types.get(extension, "application/octet-stream")
    
    def _generate_object_name(self, file_path: str) -> str:
        """Generate object name if not provided"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_ext = os.path.splitext(file_path)[1]
        return f"file_{timestamp}_{uuid.uuid4().hex[:8]}{file_ext}"
    
    def _start_cleanup_scheduler(self):
        """Start periodic cleanup of temp files"""
        import threading
        
        def periodic_cleanup():
            try:
                current_time = time.time()
                with self._cleanup_lock:
                    expired_files = []
                    for temp_file in list(self._temp_files):
                        try:
                            if os.path.exists(temp_file):
                                if current_time - os.path.getmtime(temp_file) > 3600:  # 1 hour
                                    expired_files.append(temp_file)
                            else:
                                expired_files.append(temp_file)
                        except:
                            expired_files.append(temp_file)
                    
                    for file_path in expired_files:
                        self.file_manager.cleanup_temp_file(file_path)
                        self._temp_files.discard(file_path)
                        
            except Exception as e:
                logger.warning(f"Cleanup failed: {e}")
            
            # Schedule next cleanup
            threading.Timer(300, periodic_cleanup).start()  # Every 5 minutes
        
        # Start first cleanup
        threading.Timer(300, periodic_cleanup).start()

# Initialize storage instance
# storage = StorageManager()