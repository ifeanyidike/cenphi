# src/services/enhancement/utils/media_detector.py
import os
import mimetypes
import subprocess
import logging
import threading
from typing import List, Dict, Any
from functools import lru_cache

logger = logging.getLogger(__name__)


class MediaDetector:
    """
    Media type detection with optimized performance,
    comprehensive format support, and robust error handling.
    """
    
    def __init__(self):
        # Initialize mimetypes
        mimetypes.init()
        self._lock = threading.Lock()  # Thread safety
        
        # Optimized format definitions (most common first for performance)
        self.image_extensions = frozenset({
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif',
            '.ico', '.heic', '.heif', '.svg', '.raw', '.cr2', '.nef', '.arw', '.dng'
        })
        
        self.audio_extensions = frozenset({
            '.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a', '.wma', '.opus',
            '.amr', '.3gp', '.ac3', '.dts', '.aiff', '.au'
        })
        
        self.video_extensions = frozenset({
            '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v',
            '.3gp', '.ts', '.mts', '.m2ts', '.vob', '.ogv', '.asf', '.f4v'
        })
        
        # MIME type mappings (optimized sets)
        self.image_mimes = frozenset({
            'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
            'image/tiff', 'image/svg+xml', 'image/x-icon', 'image/heic', 'image/heif'
        })
        
        self.audio_mimes = frozenset({
            'audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/ogg',
            'audio/mp4', 'audio/x-ms-wma', 'audio/opus', 'audio/amr'
        })
        
        self.video_mimes = frozenset({
            'video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime',
            'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/3gpp',
            'video/mp2t', 'video/x-matroska', 'video/ogg'
        })
        
        # Optimized signature patterns (magic bytes) - most common formats first
        self.signatures = {
            # Images
            b'\xFF\xD8\xFF': 'image',  # JPEG
            b'\x89PNG\r\n\x1a\n': 'image',  # PNG
            b'GIF8': 'image',  # GIF
            b'BM': 'image',  # BMP
            b'RIFF????WEBP': 'image',  # WebP (pattern matching)
            b'II*\x00': 'image',  # TIFF (little endian)
            b'MM\x00*': 'image',  # TIFF (big endian)
            
            # Audio
            b'ID3': 'audio',  # MP3 with ID3
            b'\xFF\xFB': 'audio',  # MP3
            b'\xFF\xF3': 'audio',  # MP3
            b'\xFF\xF2': 'audio',  # MP3
            b'RIFF????WAVE': 'audio',  # WAV (pattern matching)
            b'fLaC': 'audio',  # FLAC
            b'OggS': 'audio',  # OGG
            
            # Video
            b'\x00\x00\x00\x20ftyp': 'video',  # MP4/MOV
            b'\x00\x00\x00\x18ftyp': 'video',  # MP4/MOV
            b'RIFF????AVI ': 'video',  # AVI (pattern matching)
            b'\x1A\x45\xDF\xA3': 'video',  # Matroska/MKV
            b'FLV': 'video',  # FLV
            b'\x00\x00\x01\xBA': 'video',  # MPEG
            b'\x00\x00\x01\xB3': 'video',  # MPEG
        }
        
        # Cache for repeated detections
        self._detection_cache = {}
        self._cache_max_size = 1000
    
    @lru_cache(maxsize=512)
    def detect_media_type(self, file_path: str) -> str:
        """
        Detect media type using optimized multi-method approach.
        
        Args:
            file_path: Path to the media file
            
        Returns:
            Media type: 'image', 'audio', 'video', or 'unknown'
        """
        try:
            # Quick validation
            if not self._validate_file_path(file_path):
                return 'unknown'
            
            # Check cache first (for repeated calls)
            cache_key = f"{file_path}:{os.path.getmtime(file_path)}"
            with self._lock:
                if cache_key in self._detection_cache:
                    return self._detection_cache[cache_key]
            
            # Multi-method detection with early returns for performance
            result = self._detect_with_early_exit(file_path)
            
            # Cache result
            self._cache_result(cache_key, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Media detection failed for {file_path}: {e}")
            return 'unknown'
    
    def _validate_file_path(self, file_path: str) -> bool:
        """Fast file path validation"""
        try:
            return (
                file_path and 
                isinstance(file_path, str) and 
                os.path.exists(file_path) and 
                os.path.getsize(file_path) > 0
            )
        except (OSError, ValueError):
            return False
    
    def _detect_with_early_exit(self, file_path: str) -> str:
        """Optimized detection with early exit strategy"""
        # Method 1: Extension-based detection (fastest)
        ext_result = self._detect_by_extension(file_path)
        if ext_result != 'unknown':
            # Verify with signature for confidence
            sig_result = self._detect_by_signature(file_path)
            if sig_result == ext_result or sig_result == 'unknown':
                return ext_result
        
        # Method 2: Signature detection (most reliable)
        sig_result = self._detect_by_signature(file_path)
        if sig_result != 'unknown':
            return sig_result
        
        # Method 3: MIME type detection
        mime_result = self._detect_by_mime_type(file_path)
        if mime_result != 'unknown':
            return mime_result
        
        # Method 4: FFprobe detection (last resort, expensive)
        if ext_result in ['audio', 'video'] or any(file_path.lower().endswith(ext) 
                                                  for ext in {'.mp4', '.avi', '.mkv', '.mov', '.mp3', '.wav', '.flac'}):
            ffprobe_result = self._detect_by_ffprobe(file_path)
            if ffprobe_result != 'unknown':
                return ffprobe_result
        
        # Return extension result as fallback
        return ext_result
    
    def _detect_by_extension(self, file_path: str) -> str:
        """Optimized extension-based detection"""
        try:
            _, ext = os.path.splitext(file_path.lower())
            
            if ext in self.image_extensions:
                return 'image'
            elif ext in self.audio_extensions:
                return 'audio'
            elif ext in self.video_extensions:
                return 'video'
            else:
                return 'unknown'
                
        except Exception:
            return 'unknown'
    
    def _detect_by_signature(self, file_path: str) -> str:
        """Optimized signature detection with pattern matching"""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(32)  # Read only what we need
            
            if len(header) < 4:
                return 'unknown'
            
            # Check exact signatures first (fastest)
            for sig_bytes, media_type in self.signatures.items():
                if '?' not in sig_bytes.decode('latin-1', errors='ignore'):
                    if header.startswith(sig_bytes):
                        return media_type
            
            # Check pattern signatures (RIFF containers)
            if header.startswith(b'RIFF') and len(header) >= 12:
                format_type = header[8:12]
                if format_type == b'WAVE':
                    return 'audio'
                elif format_type in [b'AVI ', b'WEBP']:
                    return 'video' if format_type == b'AVI ' else 'image'
            
            # Check ftyp containers (MP4/MOV/M4A)
            if len(header) >= 12 and header[4:8] == b'ftyp':
                brand = header[8:12]
                if brand in [b'isom', b'mp41', b'mp42', b'avc1']:
                    return 'video'
                elif brand in [b'M4A ', b'M4B ', b'mp4a']:
                    return 'audio'
                elif brand in [b'qt  ', b'mov ']:
                    return 'video'
            
            return 'unknown'
            
        except Exception:
            return 'unknown'
    
    def _detect_by_mime_type(self, file_path: str) -> str:
        """MIME type detection with caching"""
        try:
            mime_type, _ = mimetypes.guess_type(file_path)
            
            if not mime_type:
                return 'unknown'
            
            if mime_type in self.image_mimes:
                return 'image'
            elif mime_type in self.audio_mimes:
                return 'audio'
            elif mime_type in self.video_mimes:
                return 'video'
            else:
                return 'unknown'
                
        except Exception:
            return 'unknown'
    
    def _detect_by_ffprobe(self, file_path: str) -> str:
        """Optimized FFprobe detection with timeout and error handling"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'csv',
                '-show_streams', '-select_streams', 'v:0,a:0',
                file_path
            ]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=5,  # Quick timeout
                env={'FFREPORT': 'file=/dev/null'}  # Suppress logs
            )
            
            if result.returncode != 0:
                return 'unknown'
            
            # Quick parsing of CSV output
            lines = result.stdout.strip().split('\n')
            has_video = any('video' in line for line in lines)
            has_audio = any('audio' in line for line in lines)
            
            if has_video:
                return 'video'
            elif has_audio:
                return 'audio'
            else:
                return 'unknown'
                
        except (subprocess.TimeoutExpired, subprocess.SubprocessError, Exception):
            return 'unknown'
    
    def _cache_result(self, cache_key: str, result: str):
        """Thread-safe result caching with size management"""
        with self._lock:
            # Implement simple LRU by clearing cache when full
            if len(self._detection_cache) >= self._cache_max_size:
                # Clear oldest half of cache
                items = list(self._detection_cache.items())
                self._detection_cache = dict(items[len(items)//2:])
            
            self._detection_cache[cache_key] = result
    
    def get_detailed_info(self, file_path: str) -> Dict[str, Any]:
        """
        Get comprehensive media file information with optimized parsing.
        
        Args:
            file_path: Path to the media file
            
        Returns:
            Dictionary with detailed file information
        """
        try:
            # Basic file info
            file_stat = os.stat(file_path)
            info = {
                'file_path': file_path,
                'file_size': file_stat.st_size,
                'media_type': self.detect_media_type(file_path),
                'extension': os.path.splitext(file_path)[1].lower(),
                'mime_type': mimetypes.guess_type(file_path)[0],
                'modified_time': file_stat.st_mtime
            }
            
            # Add format-specific information for A/V files
            if info['media_type'] in ['audio', 'video']:
                ffprobe_info = self._get_ffprobe_info(file_path)
                info.update(ffprobe_info)
            elif info['media_type'] == 'image':
                image_info = self._get_image_info(file_path)
                info.update(image_info)
            
            return info
            
        except Exception as e:
            logger.error(f"Failed to get detailed info for {file_path}: {e}")
            return {
                'file_path': file_path,
                'file_size': 0,
                'media_type': 'unknown',
                'extension': '',
                'mime_type': None,
                'error': str(e)
            }
    
    def _get_ffprobe_info(self, file_path: str) -> Dict[str, Any]:
        """Optimized FFprobe information retrieval"""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', 
                '-select_streams', 'v:0,a:0',  # Only first video and audio streams
                file_path
            ]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=10,
                env={'FFREPORT': 'file=/dev/null'}
            )
            
            if result.returncode != 0:
                return {}
            
            import json
            data = json.loads(result.stdout)
            
            info = {}
            
            # Format information
            format_info = data.get('format', {})
            info.update({
                'duration': float(format_info.get('duration', 0)),
                'bitrate': int(format_info.get('bit_rate', 0)),
                'format_name': format_info.get('format_name', ''),
            })
            
            # Stream information
            streams = data.get('streams', [])
            
            video_stream = next((s for s in streams if s.get('codec_type') == 'video'), None)
            audio_stream = next((s for s in streams if s.get('codec_type') == 'audio'), None)
            
            if video_stream:
                info.update({
                    'width': int(video_stream.get('width', 0)),
                    'height': int(video_stream.get('height', 0)),
                    'fps': self._parse_frame_rate(video_stream.get('r_frame_rate', '0/1')),
                    'video_codec': video_stream.get('codec_name', ''),
                    'pixel_format': video_stream.get('pix_fmt', ''),
                })
            
            if audio_stream:
                info.update({
                    'sample_rate': int(audio_stream.get('sample_rate', 0)),
                    'channels': int(audio_stream.get('channels', 0)),
                    'audio_codec': audio_stream.get('codec_name', ''),
                })
            
            return info
            
        except Exception as e:
            logger.error(f"FFprobe analysis failed: {e}")
            return {}
    
    def _get_image_info(self, file_path: str) -> Dict[str, Any]:
        """Optimized image information retrieval"""
        try:
            from PIL import Image
            
            with Image.open(file_path) as img:
                return {
                    'width': img.width,
                    'height': img.height,
                    'mode': img.mode,
                    'format': img.format,
                    'has_transparency': img.mode in ('RGBA', 'LA') or 'transparency' in img.info
                }
                
        except Exception:
            # Fallback to OpenCV
            try:
                import cv2
                img = cv2.imread(file_path, cv2.IMREAD_UNCHANGED)
                if img is not None:
                    height, width = img.shape[:2]
                    channels = img.shape[2] if len(img.shape) == 3 else 1
                    return {
                        'width': width,
                        'height': height,
                        'channels': channels,
                        'has_transparency': channels == 4
                    }
            except Exception:
                pass
            
            return {}
    
    def _parse_frame_rate(self, fps_string: str) -> float:
        """Optimized frame rate parsing"""
        try:
            if '/' in fps_string:
                num, den = fps_string.split('/', 1)
                num_val, den_val = float(num), float(den)
                return num_val / den_val if den_val > 0 else 0.0
            else:
                return float(fps_string)
        except (ValueError, ZeroDivisionError):
            return 0.0
    
    def is_supported_format(self, file_path: str) -> bool:
        """Quick check if file format is supported for enhancement"""
        media_type = self.detect_media_type(file_path)
        return media_type in ['image', 'audio', 'video']
    
    def get_recommended_output_format(self, file_path: str, quality: str = "high") -> str:
        """Get recommended output format based on input and quality settings"""
        media_type = self.detect_media_type(file_path)
        
        format_map = {
            'image': {
                'high': '.png',
                'medium': '.jpg',
                'low': '.jpg'
            },
            'audio': {
                'high': '.wav',
                'medium': '.mp3',
                'low': '.mp3'
            },
            'video': {
                'high': '.mp4',
                'medium': '.mp4',
                'low': '.mp4'
            }
        }
        
        return format_map.get(media_type, {}).get(quality, 
                            os.path.splitext(file_path)[1] or '.bin')
    
    def batch_detect_types(self, file_paths: List[str]) -> Dict[str, str]:
        """Efficiently detect types for multiple files"""
        results = {}
        
        try:
            # Group by extension for optimization
            extension_groups = {}
            for file_path in file_paths:
                if self._validate_file_path(file_path):
                    ext = os.path.splitext(file_path.lower())[1]
                    if ext not in extension_groups:
                        extension_groups[ext] = []
                    extension_groups[ext].append(file_path)
            
            # Process each group
            for ext, paths in extension_groups.items():
                # Quick extension-based detection for the group
                expected_type = self._detect_by_extension(paths[0] if paths else "dummy" + ext)
                
                for file_path in paths:
                    # Use cached detection or quick verification
                    detected_type = self.detect_media_type(file_path)
                    results[file_path] = detected_type
            
            return results
            
        except Exception as e:
            logger.error(f"Batch detection failed: {e}")
            # Fallback to individual detection
            return {fp: self.detect_media_type(fp) for fp in file_paths 
                   if self._validate_file_path(fp)}
    
    def clear_cache(self):
        """Clear the detection cache"""
        with self._lock:
            self._detection_cache.clear()
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        with self._lock:
            return {
                'cache_size': len(self._detection_cache),
                'cache_max_size': self._cache_max_size
            }