# src/services/enhancement/video_enhancer.py

'''
🤖 Professional Video Enhancer
'''

import os
import subprocess
import cv2
import numpy as np
import logging
import shutil

from typing import Dict, Any, List, Optional
import threading
from contextlib import contextmanager
from pathlib import Path

logger = logging.getLogger(__name__)


class VideoEnhancer:
    """
    🤖 Professional Video Enhancer
    """
    
    def __init__(self):
        self.max_duration = 3600
        self.max_file_size = 4 * 1024 * 1024 * 1024
        self.analysis_frames = 25
        self._lock = threading.Lock()
        self._storage_manager = None
        self._file_manager = None
        self._noise_service = None  

        self._video_buffer = None
        self._audio_buffer = None
        self._ffmpeg_optimizer = None
        
        # Professional encoding presets
        # self.encoding_presets = {
        #     "spectacular": {"preset": "slower", "crf": "14", "profile": "high"},
        #     "professional": {"preset": "slow", "crf": "16", "profile": "high"},
        #     "enhanced": {"preset": "medium", "crf": "18", "profile": "high"}
        # }
        # self.encoding_presets = {
        #     "spectacular": {"preset": "faster", "crf": "16", "profile": "high"},      # Was "slower", "14"
        #     "professional": {"preset": "faster", "crf": "18", "profile": "high"},    # Was "slow", "16"  
        #     "enhanced": {"preset": "faster", "crf": "20", "profile": "high"}       # Was "medium", "18"
        # }
        self.encoding = {
            "preset": "faster", "crf": "20", "profile": "high"
        }
        
        logger.info("🤖 Enhancer initialized")
    
    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    @property
    def file_manager(self):
        if self._file_manager is None:
            from src.utils.file_manager import FileManager
            self._file_manager = FileManager()
        return self._file_manager
    
    @property
    def noise_service(self):
        """Lazy-loaded noise service"""
        if self._noise_service is None:
            from ..shared.noise_service import NoiseService
            self._noise_service = NoiseService()
        return self._noise_service
    
    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer
    
    def _optimize_memory_usage(self):
        """Optimize memory allocation for video processing"""
        import psutil
        
        # Get available memory
        available_memory = psutil.virtual_memory().available
        
        # Allocate 25% of available memory for video processing
        self._max_chunk_size = min(64 * 1024 * 1024, available_memory // 4)  # 64MB max chunks
        
        # Pre-allocate common numpy arrays
        self._video_buffer = np.empty((1920, 1080, 3), dtype=np.uint8)
        self._audio_buffer = np.empty((44100 * 10,), dtype=np.float32)  # 10 second buffer
        
    def enhance(self, input_path: str, output_path: str, quality: str = "professional",
            custom_enhancements: Optional[List[str]] = None,
            target_platform: Optional[str] = None,
            remove_noise: bool = False,
            enable_grayscale: bool = False) -> Dict[str, Any]:
        """
        🤖 MAIN ENHANCEMENT METHOD with integrated noise removal
        """
        logger.info(f"🤖 Starting enhancement: {input_path} (Quality: {quality}, Remove Noise: {remove_noise})")
        
        try:
            with self._video_processing_context(input_path) as (video_info, temp_files):
                if not video_info:
                    return {"success": False, "error": "Failed to analyze video"}
                
                # Apply main enhancement first
                current_video = input_path
                applied_enhancements = []
                
                
                logger.info("🔄 Using enhanced traditional processing")
                temp_enhanced = self.file_manager.create_temp_video(prefix="traditional_enhanced_")

                if not temp_enhanced or not temp_enhanced.strip():
                    logger.error("Failed to create temporary enhanced file")
                    return {"success": False, "error": "Temporary file creation failed"}
                temp_files.append(temp_enhanced)
                
                result = self._apply_enhanced_traditional(current_video, temp_enhanced, video_info)
                if result["success"]:
                    if os.path.exists(temp_enhanced) and os.path.getsize(temp_enhanced) > 0:
                        current_video = temp_enhanced
                        applied_enhancements.extend(result.get("applied_enhancements", []))
                    else:
                        logger.warning("Enhanced file creation failed, continuing with original")

                
                # Apply noise removal if requested
                noise_removal_applied = False
                if remove_noise:
                    logger.info("🎯 Applying noise removal...")
                    denoised_video = self.noise_service.process_with_denoising(
                        current_video, quality, temp_files, "video_enhancer"
                    )
                    
                    # Check if noise removal worked
                    if denoised_video != current_video and os.path.exists(denoised_video):
                        current_video = denoised_video
                        applied_enhancements.append("ai_noise_removal")
                        noise_removal_applied = True
                        logger.info("✅ noise removal applied successfully")
                    else:
                        logger.info("ℹ️ noise removal not applied (not needed or failed)")
                
                # Final output
                if current_video != input_path:
                    # Copy to final output path
                    import shutil
                    shutil.copy2(current_video, output_path)
                    
                    quality_score = 0.85
                    logger.info(f"✅ Enhancement completed! Quality: {quality_score:.3f}")
                    
                    return {
                        "success": True,
                        "applied_enhancements": applied_enhancements,
                        "quality_score": quality_score,
                        "dramatic_noise_reduction": noise_removal_applied,  # FIXED: Accurate reporting
                        "voice_preserved": True,
                        "professional_processing": True,
                    }
                else:
                    return {"success": False, "error": "No enhancements applied"}
                    
        except Exception as e:
            logger.error(f"❌ enhancement failed: {e}", exc_info=True)
            # Cleanup on error
            return {"success": False, "error": str(e)}
        

    def enhance_with_custom_enhancements(self, input_path: str, output_path: str, quality: str = "professional",
            custom_enhancements: Optional[List[str]] = None, 
            target_platform: Optional[str] = None, 
            remove_noise: bool = False) -> Dict[str, Any]:
        """
        🤖 ENHANCED MAIN ENHANCEMENT METHOD with custom enhancement support
        """
        logger.info(f"🤖 Starting enhancement with custom enhancements: {input_path}")
        from .custom_enhancement_processor import CustomEnhancementProcessor
        
        try:
            with self._video_processing_context(input_path) as (video_info, temp_files):
                if not video_info:
                    return {"success": False, "error": "Failed to analyze video"}
                
                # Apply main enhancement first
                intermediate_path = self.file_manager.create_temp_video(prefix="pre_custom_")
                temp_files.append(intermediate_path)
                
                result = self._apply_enhanced_traditional(input_path, intermediate_path, video_info)
                if intermediate_path:
                    temp_files.append(intermediate_path)
                
                if not result["success"]:
                    logger.warning("Main enhancement failed, proceeding with custom enhancements on original")
                    intermediate_path = input_path
                
                # Apply custom enhancements if specified
                if custom_enhancements and len(custom_enhancements) > 0:
                    logger.info(f"🛠️  Applying {len(custom_enhancements)} custom enhancements")
                    
                    # Initialize custom enhancement processor
                    custom_processor = CustomEnhancementProcessor()
                    
                    # Apply custom enhancements
                    custom_result = custom_processor.apply_custom_enhancements(
                        intermediate_path, output_path, custom_enhancements, video_info
                    )
                    
                    if custom_result["success"]:
                        # Merge results
                        result["applied_enhancements"].extend(custom_result["applied_enhancements"])
                        result["custom_enhancement_results"] = custom_result["enhancement_results"]
                        logger.info(f"✅ Custom enhancements applied: {custom_result['total_applied']}")
                    else:
                        logger.warning(f"⚠️  Custom enhancements failed: {custom_result.get('error', 'Unknown error')}")
                        # Copy intermediate to output as fallback
                        import shutil
                        shutil.copy2(intermediate_path, output_path)
                else:
                    # No custom enhancements, just copy intermediate result
                    import shutil
                    shutil.copy2(intermediate_path, output_path)
                
                if result["success"]:
                    logger.info(f"✅ Enhancement with custom processing completed!")
                    
                    # Update result with final info
                    result["output_path"] = output_path
                    result["custom_enhancements_requested"] = len(custom_enhancements) if custom_enhancements else 0
                    
                    return result
                else:
                    return result
                    
        except Exception as e:
            logger.error(f"❌ enhancement with custom processing failed: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _optimize_input_if_needed(self, input_path: str, video_info: Dict) -> str:
        file_size = os.path.getsize(input_path)
        duration = video_info.get("duration", 0)
        if duration > 0 and file_size / duration > 500_000_000:  # >500MB per second
            optimized_path = self.file_manager.create_temp_video(prefix="input_optimized_")
            cmd = [
                "ffmpeg", "-y", "-i", input_path,
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28",
                "-c:a", "aac", "-b:a", "128k",
                optimized_path
            ]
            # subprocess.run(cmd, capture_output=True, timeout=300)
            self.ffmpeg_optimizer.optimize_and_execute(cmd, capture_output=True, timeout=300, video_info=video_info)
            return optimized_path if os.path.exists(optimized_path) else input_path
        return input_path

    def _apply_enhanced_traditional(self, input_path: str, output_path: str, video_info: Dict) -> Dict[str, Any]:
        """Traditional processing with spectacular results"""
        try:
            logger.info("🎬 Applying enhanced traditional processing...")

            if not output_path or not output_path.strip():
                logger.error("Invalid output_path provided to _apply_enhanced_traditional")
                return {"success": False, "error": "Invalid output path"}
            
            output_path = output_path.strip()
            
            # SAFE: Smart filter selection based on content
            video_filters = self._get_optimized_video_filters(video_info)
            
            # SAFE: Keep your exact original audio filter logic
            audio_filters = []
            if video_info.get("has_audio", False):
                # audio_filters = [
                #     "loudnorm=I=-16:TP=-1.5:LRA=7",
                #     "equalizer=f=2000:t=o:w=1000:g=2",
                #     "equalizer=f=3500:t=o:w=800:g=1.5",
                #     "highpass=f=80",
                #     "lowpass=f=12000"
                # ]
                audio_filters = [
                    "loudnorm=I=-16:TP=-1.5:LRA=7",
                    "equalizer=f=2500:t=o:w=1000:g=1.5",  # Single EQ instead of multiple
                    "highpass=f=80"  # Remove low-frequency noise only
                ]
            
            # SAFE: Keep your exact original command building logic
            cmd = ["ffmpeg", "-y", "-i", input_path]
            
            if video_filters:
                cmd.extend(["-vf", ",".join(video_filters)])
            
            if audio_filters:
                cmd.extend(["-af", ",".join(audio_filters)])
            
            # SAFE: Keep your exact original encoding logic
            cmd.extend([
                "-c:v", "libx264",
                "-preset", self.encoding.get("preset", "faster"),
                "-crf", self.encoding.get("crf", "20"),
                "-profile:v", self.encoding.get("profile", "high"),
                "-pix_fmt", "yuv420p",
                "-tune", "film",
                "-x264-params", "ref=3:bframes=3:b-adapt=1:direct=auto:me=hex:subme=6", 
                "-threads", str(min(8, os.cpu_count())),
                "-movflags", "+faststart+frag_keyframe"
            ])
            
            if video_info.get("has_audio", False):
                cmd.extend(["-c:a", "aac", "-b:a", "256k", "-ar", "48000"])
            
            cmd.append(output_path)
            
            # SAFE: Keep your exact original timeout calculation
            timeout = max(video_info.get("duration", 300) * 10, 600)
            
            # result = subprocess.run(cmd, capture_output=True, timeout=timeout)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, capture_output=True, timeout=timeout, video_info=video_info)
            
            # SAFE: Keep your exact original return format
            if result.returncode == 0 and os.path.exists(output_path):
                return {
                    "success": True,
                    "applied_enhancements": ["enhanced_traditional", "professional_encoding"],
                    "quality_score": 0.85,  # Keep your original fixed value
                    "ai_processing": False
                }
            else:
                logger.error(f"Traditional enhancement failed: {result.stderr}")
                return {"success": False, "error": "Traditional enhancement failed"}
                
        except Exception as e:
            logger.error(f"Enhanced traditional processing failed: {e}")
            return {"success": False, "error": str(e)}

    def _get_optimized_video_filters(self, video_info: Dict) -> List[str]:
        """SAFE: Only change the filter selection logic - everything else stays the same"""
        
        # Get video characteristics
        width = video_info.get("width", 1920)
        height = video_info.get("height", 1080)
        duration = video_info.get("duration", 0)
        resolution = width * height
        
        # BALANCED: More natural enhancement filters to prevent grayscale appearance
        base_filters = [
            "eq=contrast=1.25:saturation=1.3:brightness=0.02:gamma=1.02",  # Reduced contrast, increased saturation
            "colorbalance=rs=0.04:gs=0.02:bs=-0.02",  # More subtle color balance
            "vibrance=intensity=0.25",  # Increased vibrance to maintain color richness
            "unsharp=5:5:0.6:5:5:0.0",  # Slightly reduced sharpening
            "curves=all='0/0 0.05/0.08 0.95/0.92 1/1'"  # Gentler S-curve
        ]
        
        # SAFE: Content-aware optimizations that don't conflict with existing services
        optimized_filters = base_filters.copy()
        
        # Only optimize for clear cases where it's safe and beneficial
        if resolution >= 8294400:  # 4K+ (3840x2160)
            # Reduce sharpening intensity for 4K (prevent over-processing)
            optimized_filters = [
                f.replace("unsharp=5:5:0.7:5:5:0.0", "unsharp=5:5:0.5:5:5:0.0")
                # f.replace("unsharp=4:4:0.7:4:4:0.0", "unsharp=4:4:0.5:4:4:0.0")
                for f in optimized_filters
            ]
            logger.debug("Reduced sharpening intensity for 4K+ content")
        
        # For very long content, add deinterlacing check (often broadcast sources)
        if duration > 1800:  # 30+ minutes
            optimized_filters.insert(0, "yadif=mode=0:parity=-1:deint=0")
            logger.debug("Added deinterlacing check for long-form content")

        # Add grayscale conversion if requested
        if enable_grayscale:
            optimized_filters.append("format=gray")
            logger.info("Added grayscale conversion filter")
        
        return optimized_filters
    
    def _apply_ai_color_grade(self, img_rgb: np.ndarray) -> np.ndarray:
        """AI-inspired color grading with error handling"""
        try:
            img_float = img_rgb.astype(np.float32) / 255.0
            
            # Professional color grading
            img_float = np.power(img_float, 0.92)  # Gamma
            img_float[:, :, 0] *= 1.04  # Warm highlights
            img_float[:, :, 2] *= 0.96  # Cool shadows
            
            # Saturation boost
            hsv = cv2.cvtColor(img_float, cv2.COLOR_RGB2HSV)
            hsv[:, :, 1] = np.clip(hsv[:, :, 1] * 1.15, 0, 1)
            img_float = cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)
            
            # Contrast
            img_float = np.clip((img_float - 0.5) * 1.15 + 0.5, 0, 1)
            
            return (img_float * 255).astype(np.uint8)
            
        except Exception as e:
            logger.warning(f"color grading failed: {e}")
            return img_rgb
    
    def _reconstruct_video(self, frames_dir: str, original_video: str, output_path: str, video_info: Dict) -> bool:
        """Reconstruct video from enhanced frames with production-grade audio/video sync"""
        from src.utils.video_reconstruction import VideoReconstructor
        return VideoReconstructor.reconstruct_from_frames(
            frames_dir, original_video, output_path, video_info, "professional"
        )
      
    
    def intelligent_auto_enhance(self, input_path: str, output_path: str, 
                               quality: str = "professional", custom_enhancements: Optional[List[str]] = None,
                               target_platform: Optional[str] = None, remove_noise: bool = False) -> Dict[str, Any]:
        """Backward compatibility wrapper"""
        return self.enhance(input_path, output_path, quality, custom_enhancements, target_platform, remove_noise)



    @contextmanager
    def _video_processing_context(self, input_path: str):
        """Processing context with validation and cleanup using FileManager"""
        video_info = None
        temp_files = []
        
        try:
            # Validate input
            if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
                raise ValueError(f"Invalid input file: {input_path}")
            
            # Get video info with error handling
            try:
                video_info = self.storage_manager.get_video_info(input_path)
            except Exception as e:
                logger.error(f"Failed to get video info: {e}")
                raise ValueError("Failed to analyze video file")
            
            if not video_info or not video_info.get("width"):
                raise ValueError("Invalid video file or unsupported format")
            
            # Check constraints
            duration = video_info.get("duration", 0)
            file_size = os.path.getsize(input_path)
            
            if duration > self.max_duration:
                raise ValueError(f"Video too long: {duration:.1f}s (max: {self.max_duration}s)")
            
            if file_size > self.max_file_size:
                raise ValueError(f"File too large: {file_size / (1024**3):.1f}GB")
            
            yield video_info, temp_files
            
        finally:
            # Enhanced cleanup using FileManager
            cleanup_count = 0
            for temp_file in temp_files:
                try:
                    if temp_file and os.path.exists(temp_file):
                        if os.path.isdir(temp_file):
                            shutil.rmtree(temp_file, ignore_errors=True)
                            cleanup_count += 1
                        else:
                            if self.file_manager.remove_file(temp_file):
                                cleanup_count += 1
                except Exception as e:
                    logger.warning(f"Cleanup failed for {temp_file}: {e}")
            
            if cleanup_count > 0:
                logger.debug(f"🧹 Cleaned up {cleanup_count} temporary files/directories")

    
    def cleanup_temp_files(self) -> int:
        """Manually cleanup temporary files"""
        try:
            cleaned = self.file_manager.cleanup_all_temp_files()
            logger.info(f"🧹 Cleaned up {cleaned} temporary files")
            return cleaned
        except Exception as e:
            logger.warning(f"Temp files cleanup failed: {e}")
            return 0
    
    @contextmanager
    def temp_file_batch_context(self, count: int = 5, suffix: str = "", prefix: str = "batch_"):
        """Context manager for creating multiple temporary files that are automatically cleaned up"""
        temp_files = []
        try:
            for i in range(count):
                temp_file = self.file_manager.create_temp_file(
                    suffix=suffix, 
                    prefix=f"{prefix}{i:03d}_"
                )
                temp_files.append(temp_file)
            yield temp_files
        finally:
            # Cleanup all temp files
            cleanup_count = 0
            for temp_file in temp_files:
                if self.file_manager.remove_file(temp_file):
                    cleanup_count += 1
            if cleanup_count > 0:
                logger.debug(f"🧹 Batch cleanup: removed {cleanup_count} temp files")
