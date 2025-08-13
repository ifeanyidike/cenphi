# src/services/clipping/clip_generator.py

import os
import subprocess
import logging
from typing import Optional, Dict, Any


from ..shared.quality_presets import QualityPresets

logger = logging.getLogger(__name__)

class ClipGenerator:
    """Core clip extraction and generation logic"""
    
    def __init__(self):
        self.quality_presets = QualityPresets()
        self._file_manager = None
        self._storage_manager = None
        self._ffmpeg_optimizer = None
        logger.debug("ClipGenerator initialized")
    
    @property
    def file_manager(self):
        if self._file_manager is None:
            from src.utils.file_manager import FileManager
            self._file_manager = FileManager()
        return self._file_manager
    
    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer
    
    def extract_clip(
        self,
        media_path: str,
        start_time: float,
        end_time: float,
        media_info: Dict[str, Any]
    ) -> Optional[str]:
        """
        Extract clip from media with enhanced validation
        
        Args:
            media_path: Path to source media
            start_time: Start time in seconds
            end_time: End time in seconds  
            output_dir: Output directory
            format_type: Output format (mp4, webm, etc.)
            
        Returns:
            Path to extracted clip or None if failed
        """
        try:
            # Validate inputs
            if not os.path.exists(media_path):
                logger.error(f"Source media not found: {media_path}")
                return None
            # if not self.storage_manager.check_url_exists(media_path):
            #     logger.error(f"Source media not found: {media_path}")
            #     return None
            
            if start_time >= end_time:
                logger.error(f"Invalid time range: {start_time}s-{end_time}s")
                return None
            
            
            if not os.path.exists(media_path):
                logger.error(f"Source media not found: {media_path}")
                return None
            
            # Check file size to ensure it's not empty/corrupted
            if os.path.getsize(media_path) < 1024:
                logger.error(f"Source media file too small: {media_path}")
                return None
            
            # Generate unique output filename
            # clip_id = uuid.uuid4().hex[:16]
            duration = end_time - start_time
            # output_path =  f"clip_{clip_id}_{int(start_time)}_{int(end_time)}.{format_type}"
            output_path = self.file_manager.create_temp_video("clip")
            # output_path = os.path.join(output_dir, output_filename)
            
            # Ensure output directory exists
            # os.makedirs(output_dir, exist_ok=True)
            
            # Build FFmpeg command with stream validation
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_time),
                "-i", media_path,
                "-t", str(duration),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-preset", "fast",
                "-crf", "23",
                "-movflags", "+faststart",
                output_path
            ]
            
            # Execute with timeout
            timeout = max(60, duration * 2)  # At least 60s, or 2x clip duration
            
            logger.debug(f"Extracting clip: {start_time}s-{end_time}s from {media_path}")
            
            # result = subprocess.run(
            #     cmd,
            #     capture_output=True,
            #     text=True,
            #     timeout=timeout,
            #     check=False
            # )

            result = self.ffmpeg_optimizer.optimize_and_execute(
                cmd,
                video_info=media_info,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False
            )
            
            if result.returncode != 0:
                logger.error(f"FFmpeg extraction failed: {result.stderr}")
                return None
            
            # FIXED: Use more lenient validation - only check if file exists and has reasonable size
            if not os.path.exists(output_path):
                logger.error(f"Clip extraction failed - no output file: {output_path}")
                return None
                
            output_size = os.path.getsize(output_path)
            if output_size < 1024:  # Less than 1KB
                logger.error(f"Generated clip too small ({output_size} bytes): {output_path}")
                if os.path.exists(output_path):
                    os.unlink(output_path)
                return None
            
            logger.debug(f"Clip extracted successfully: {output_path}")
            return output_path
            
        except subprocess.TimeoutExpired:
            logger.error(f"Clip extraction timeout: {start_time}s-{end_time}s")
            return None
        except Exception as e:
            logger.error(f"Clip extraction failed: {e}")
            return None
    
    def _build_extraction_command(
        self,
        input_path: str,
        output_path: str,
        start_time: float,
        duration: float,
        preset: Dict[str, Any]
    ) -> list:
        """Build FFmpeg command for clip extraction"""
        
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output
            "-ss", str(start_time),  # Seek to start time
            "-i", input_path,  # Input file
            "-t", str(duration),  # Duration
        ]
        
        # Video encoding
        cmd.extend([
            "-c:v", preset["video_codec"],
            "-preset", preset["preset"],
            "-crf", str(preset["crf"]),
            "-pix_fmt", "yuv420p"
        ])
        
        # Audio encoding
        cmd.extend([
            "-c:a", preset["audio_codec"],
            "-b:a", preset["audio_bitrate"],
            "-ar", "48000"  # Sample rate
        ])
        
        # Optimization
        cmd.extend([
            "-movflags", "+faststart",  # Optimize for streaming
            "-avoid_negative_ts", "make_zero"  # Fix timestamp issues
        ])
        
        cmd.append(output_path)
        
        return cmd
    
    def _parse_fps(self, fps_string: str) -> float:
        """Parse FPS from FFmpeg format"""
        try:
            if '/' in fps_string:
                num, den = fps_string.split('/')
                return float(num) / float(den)
            return float(fps_string)
        except:
            return 30.0
    
    def _safe_cleanup(self, file_path: str):
        """Safely cleanup a file"""
        try:
            if file_path and os.path.exists(file_path):
                os.unlink(file_path)
        except Exception as e:
            logger.warning(f"Cleanup failed for {file_path}: {e}")
       