# ai-service/src/utils/video_reconstruction.py
import subprocess
import os
import logging
from typing import Dict

logger = logging.getLogger(__name__)

class VideoReconstructor:
    """Shared utility for reconstructing videos from enhanced frames"""


    @staticmethod
    def reconstruct_from_frames(frames_dir: str, original_video: str,
                                output_path: str, video_info: Dict,
                                quality_preset: str = "high") -> bool:
        """
        🎯 Perfect timing regardless of frame count (25, 300, or 5000 frames)
        
        KEY INSIGHT: Don't calculate complex framerates - let FFmpeg interpolate!
        """
        from .ffmpeg_optimizer import FFmpegOptimizer
        ffmpeg_optimizer = FFmpegOptimizer()

        try:
            original_fps = video_info.get('fps', 30)
            duration = video_info.get('duration', 0)
            has_audio = video_info.get('has_audio', False)
            
            # Count enhanced frames
            frame_files = sorted([f for f in os.listdir(frames_dir) if f.endswith('.png')])
            frame_count = len(frame_files)
            
            if frame_count == 0:
                logger.error("No frames found")
                return False
            
            logger.info(f"🎬 Bulletproof reconstruction: {frame_count} frames → {duration:.2f}s at {original_fps}fps")
            
            quality_settings = {
                "high": {"preset": "fast", "crf": "16"},
                "professional": {"preset": "fast", "crf": "18"},
                "fast": {"preset": "fast", "crf": "20"}
            }
            settings = quality_settings.get(quality_preset, quality_settings["fast"])
            
            # THE BULLETPROOF APPROACH:
            # 1. Tell FFmpeg frames represent the full duration
            # 2. Let FFmpeg figure out interpolation automatically
            # 3. Force exact output specs
            
            apparent_fps = frame_count / duration  # What fps these frames represent
            
            cmd = [
                "ffmpeg", "-y",
                
                # Input: frames at their apparent rate
                "-framerate", f"{apparent_fps:.6f}",
                "-i", os.path.join(frames_dir, "frame_%06d.png"),
                "-i", original_video,
                
                # Output: Force exact original specs
                "-vf", f"fps={original_fps}:round=up",  # Interpolate to original fps
                "-c:v", "libx264",
                "-preset", settings["preset"],
                "-crf", settings["crf"], 
                "-pix_fmt", "yuv420p",
                "-t", str(duration),  # Force exact duration
                "-map", "0:v:0"
            ]
            
            # Audio: Copy exactly (critical for sync)
            if has_audio:
                cmd.extend(["-map", "1:a:0", "-c:a", "copy"])
            
            # Standard optimizations
            cmd.extend([
                "-avoid_negative_ts", "make_zero",
                "-fflags", "+genpts",
                "-movflags", "+faststart",
                output_path
            ])
            
            # Debug info
            logger.info(f"   Apparent input FPS: {apparent_fps:.3f}")
            logger.info(f"   Output FPS: {original_fps}")
            logger.info(f"   Interpolation factor: {original_fps/apparent_fps:.1f}x")
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
            result = ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=1800, video_info=video_info)
            
            if result.returncode == 0 and os.path.exists(output_path):
                logger.info("✅ Bulletproof reconstruction completed - perfect timing!")
                return True
            else:
                logger.error(f"Reconstruction failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Bulletproof reconstruction failed: {e}")
            return False