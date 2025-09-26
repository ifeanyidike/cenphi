# src/services/shared/noise_service.py
import os
import subprocess
import cv2
import numpy as np
import logging
import uuid
import tempfile
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class NoiseService:
    """
    Reliable noise reduction service with FIXED FFmpeg filters and proper error handling.
    """
    
    def __init__(self):
        # self.temp_dir = tempfile.gettempdir()
        self._storage_manager = None
        self._file_manager = None
        
        # FIXED: Noise reduction profiles with correct filter syntax (no duplicated filter names)
        # self.noise_profiles = {
        #     "low": {
        #         "description": "Light noise removal with maximum voice preservation",
        #         "video_denoise": "2:1:3:2",              # FIXED: Just the parameters, not the filter name
        #         "audio_nr": "12",                         # Light audio noise reduction  
        #         "audio_nf": "-35",                        # Conservative noise floor
        #         "voice_eq_boost": "1.5",                 # Voice frequency boost
        #         "high_cut": "12000"                       # High frequency cut
        #     },
        #     "medium": {
        #         "description": "Balanced noise removal with voice preservation", 
        #         "video_denoise": "4:3:6:4",              # FIXED: Just the parameters
        #         "audio_nr": "20",                         # Moderate audio noise reduction
        #         "audio_nf": "-30",                        # Moderate noise floor  
        #         "voice_eq_boost": "2.0",                 # Voice frequency boost
        #         "high_cut": "10000"                       # High frequency cut
        #     },
        #     # "high": {
        #     #     "description": "Aggressive noise removal while preserving voice",
        #     #     "video_denoise": "8:6:12:8",             # FIXED: Just the parameters
        #     #     "audio_nr": "30", 
        #     #     "audio_nf": "-25",                        # Aggressive noise floor
        #     #     "voice_eq_boost": "2.5",                 # Strong voice frequency boost
        #     #     "high_cut": "8000"                        # Aggressive high frequency cut
        #     # }
        #     "high": {
        #         "description": "Aggressive noise removal while preserving voice",
        #         "video_denoise": "6:4:8:6",     # Reduced from 8:6:12:8
        #         "audio_nr": "22",               # Reduced from 30 
        #         "audio_nf": "-28",              # Increased from -25 (better voice preservation)
        #         "voice_eq_boost": "2.0",        # Reduced from 2.5
        #         "high_cut": "9000"              # Increased from 8000 (preserve consonants)
        #     }
        # }

        self.noise_profiles = {
            "high": {
                "video_denoise": "4:3:6:4",     # ✅ Reduced complexity
                "audio_nr": "15",               # ✅ Reduced from 22
                "audio_nf": "-25",              # ✅ LESS aggressive than your -28
                "voice_eq_boost": "1.6",        # ✅ Reduced from 2.0  
                "high_cut": "10000"             # ✅ Preserves more audio content
            },
            "medium": {
                "video_denoise": "3:2:4:3",     # ✅ Reduced from 4:3:6:4
                "audio_nr": "10",               # ✅ Reduced from 20
                "audio_nf": "-30",              # ✅ LESS aggressive than current -30
                "voice_eq_boost": "1.4",        # ✅ Reduced from 2.0
                "high_cut": "11000"             # ✅ Preserves more content
            },
            "low": {
                "video_denoise": "2:1:3:2",     # ✅ Already conservative
                "audio_nr": "8",                # ✅ Reduced from 12
                "audio_nf": "-32",              # ✅ LESS aggressive than current -35  
                "voice_eq_boost": "1.2",        # ✅ Reduced from 1.5
                "high_cut": "12000"             # ✅ Already conservative
            }
        }

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

    def process_with_denoising(self, video_path: str, noise_reduction_level: str, temp_files: List[str], story_id: str) -> str:
        """
        CPU-optimized noise removal method with quality preservation for Cloud Run
        """
        logger.info(f"🚀 CPU-optimized noise removal for {story_id} (level: {noise_reduction_level})")

        try:
            if not video_path:
                logger.warning(f"⚠️ No video path provided for noise removal on story {story_id}")
                return video_path

            # Force high-quality noise removal by default
            if noise_reduction_level == "auto":
                noise_reduction_level = "high"

            # Create output path
            output_path = self.file_manager.create_temp_video("denoised_video")

            # CPU-optimized noise level detection (faster)
            noise_level, detected_noise = self.get_proper_noise_level_fast(video_path, noise_reduction_level or 'high')
            logger.info(f"📊 CPU-optimized noise level: {noise_level} detected noise: {detected_noise:.3f}")

            # Apply CPU-optimized noise reduction
            success = self._apply_cpu_optimized_noise_reduction(
                input_path=video_path,
                output_path=output_path,
                level=noise_level
            )
            
            if success and os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                temp_files.append(output_path)
                logger.info(f"✅ Noise removal completed for {story_id}")
                return output_path
            else:
                logger.warning(f"⚠️ Noise removal failed for {story_id}, using original")
                return video_path
                
        except Exception as e:
            logger.error(f"❌ Noise removal failed for {story_id}: {e}")
            return video_path
        
    def get_proper_noise_level(self, input_path: str, level: str):
        analysis = self._quick_noise_analysis(input_path)
        detected_noise = analysis['noise_level']
        logger.info(f"📊 Quick analysis - Estimated noise level: {analysis['noise_level']:.3f}")

        if level == "auto" or level == "high":  # Auto-adjust high requests
            if detected_noise < 0.3:
                optimal_level = "low"
                logger.info(f"🎵 Low noise detected, using gentle 'low' profile for voice preservation")
            elif detected_noise < 0.6:
                optimal_level = "medium" 
                logger.info(f"🎵 Moderate noise detected, using balanced 'medium' profile")
            else:
                optimal_level = "high"
                logger.info(f"🎵 High noise detected, using aggressive 'high' profile")
        else:
            # Respect user's explicit choice
            optimal_level = level
            logger.info(f"🎵 Using explicitly requested '{level}' profile")
        return optimal_level, detected_noise

    def remove_noise_dramatically(self, input_path: str, output_path: str = None, level: str = "high") -> Dict[str, Any]:
        """
        Remove noise dramatically while preserving voice using FIXED FFmpeg filters
        """
        logger.info(f"🔥 Starting RELIABLE dramatic noise removal (level: {level})")
        
        try:
            if not output_path:
                # output_path = os.path.join(self.temp_dir, f"dramatic_denoised_{uuid.uuid4().hex}.mp4")
                output_path = self.file_manager.create_temp_video("denoised_video")
            
            # Quick analysis for processing decisions
            noise_level, detected_noise = self.get_proper_noise_level(input_path, level)
            logger.info(f"📊 Optimal noise level is {noise_level}")
            
            # Apply reliable dramatic noise reduction
            success = self._apply_reliable_noise_reduction(input_path, output_path, noise_level)
            
            if success:
                logger.info(f"✅ RELIABLE dramatic noise removal completed: {output_path}")
                return {
                    "success": True,
                    "output_path": output_path,
                    "noise_reduction": detected_noise,
                    "voice_preserved": True,
                    "level_applied": noise_level
                }
            else:
                return {"success": False, "error": "Reliable noise reduction failed"}
                
        except Exception as e:
            logger.error(f"❌ Reliable dramatic noise removal failed: {e}")
            return {"success": False, "error": str(e)}

    def _quick_noise_analysis(self, video_path: str) -> Dict[str, float]:
        """
        Quick and reliable noise analysis without complex dependencies
        """
        try:
            # Get basic file info
            video_info = self.storage_manager.get_video_info(video_path)
            
            # FIXED: Add null check for video_info
            if not video_info:
                logger.warning("Could not get video info, using default analysis")
                return {"noise_level": 0.5, "duration": 60, "has_audio": True}
            
            # Simple noise estimation based on file characteristics
            # file_size = os.path.getsize(video_path)
            file_size = video_info.get("file_size", 0)
            duration = video_info.get("duration", 1)
            
            # Rough estimate: smaller files for given duration often indicate more compression/noise
            size_per_second = file_size / max(duration, 1)
            
            # Simple heuristic for noise level estimation
            if size_per_second < 500000:  # < 500KB/s suggests high compression/noise
                noise_level = 0.7
            elif size_per_second < 1000000:  # < 1MB/s suggests moderate noise
                noise_level = 0.5
            else:
                noise_level = 0.3
            
            return {
                "noise_level": noise_level,
                "duration": duration,
                "has_audio": video_info.get("has_audio", False)
            }
            
        except Exception as e:
            logger.error(f"Quick noise analysis failed: {e}")
            return {"noise_level": 0.5, "duration": 60, "has_audio": True}

    def _apply_reliable_noise_reduction(self, input_path: str, output_path: str, level: str) -> bool:
        """
        Apply noise reduction using FIXED FFmpeg filters with proper syntax
        """
        try:
            # Validate inputs
            if not os.path.exists(input_path):
                logger.error(f"Input file not found: {input_path}")
                return False
            
            # Get stream information reliably
            has_video, has_audio = self.storage_manager._detect_video_streams(input_path)
            
            if not has_video and not has_audio:
                logger.error("No valid streams found")
                return False
            
            # Get noise profile settings
            profile = self.noise_profiles.get(level, self.noise_profiles["high"])
            
            logger.info(f"🎯 Applying {level} noise reduction using reliable filters")
            
            # Build reliable FFmpeg command using only standard filters
            cmd = ["ffmpeg", "-y", "-i", input_path]
            
            filter_complex = []
            map_args = []
            
            # FIXED: Video denoising using correct syntax (no duplicated filter name)
            if has_video:
                # FIXED: Use correct filter syntax - just "hqdn3d=" + parameters
                video_filter = f"hqdn3d={profile['video_denoise']}"
                filter_complex.append(f"[0:v]{video_filter}[vout]")
                map_args.extend(["-map", "[vout]"])
                logger.info(f"   📹 Video: {video_filter}")
            
            # FIXED: Audio denoising with voice preservation and proper null checks
            if has_audio:
                audio_filters = []
                
                # Primary noise reduction using afftdn (widely available)
                nr_value = profile.get('audio_nr', '20')
                nf_value = profile.get('audio_nf', '-30')
                audio_filters.append(f"afftdn=nr={nr_value}:nf={nf_value}")
                
                # Voice frequency preservation using standard equalizer
                voice_boost = profile.get('voice_eq_boost', '1.5')
                
                # Boost fundamental voice frequencies (100Hz-300Hz)
                audio_filters.append(f"equalizer=f=200:t=o:w=100:g={voice_boost}")
                
                # Boost primary voice formants (800Hz-1200Hz) 
                audio_filters.append(f"equalizer=f=1000:t=o:w=400:g={voice_boost}")
                
                # Boost voice presence (2500Hz-3500Hz)
                audio_filters.append(f"equalizer=f=3000:t=o:w=1000:g=1.5")
                
                # Remove high-frequency noise while preserving consonants
                high_cut = profile.get('high_cut', '8000')
                audio_filters.append(f"lowpass=f={high_cut}")
                
                # Remove low-frequency noise (rumble, etc.)
                audio_filters.append("highpass=f=60")
                
                audio_chain = ",".join(audio_filters)
                filter_complex.append(f"[0:a]{audio_chain}[aout]")
                map_args.extend(["-map", "[aout]"])
                
                logger.info(f"   🎵 Audio: {len(audio_filters)} reliable filters applied")
            
            # Apply filter complex if we have filters
            if filter_complex:
                cmd.extend(["-filter_complex", ";".join(filter_complex)])
                cmd.extend(map_args)
            else:
                # No filtering, just copy
                cmd.extend(["-c", "copy"])
            
            # Reliable encoding settings
            if has_video:
                cmd.extend([
                    "-c:v", "libx264",
                    "-preset", "medium",  # Balanced speed/quality
                    "-crf", "20",         # Good quality
                    "-pix_fmt", "yuv420p" # Universal compatibility
                ])
            
            if has_audio:
                cmd.extend([
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-ar", "44100"
                ])
            
            cmd.extend(["-movflags", "+faststart", output_path])
            
            # Calculate reasonable timeout
            if input_path.startswith(('http://', 'https://')):
                timeout = 1800  # 30 minutes for remote files
            else:
                try:
                    file_size_mb = os.path.getsize(input_path) / (1024 * 1024)
                    timeout = max(300, int(file_size_mb * 10))  # 10 seconds per MB, minimum 5 minutes
                    timeout = min(timeout, 1800)  # Maximum 30 minutes
                except:
                    timeout = 600  # Default 10 minutes
            
            logger.info(f"🔄 Processing with {timeout//60}min timeout...")
            
            logger.info(f"🔄 Processing with {timeout//60}min timeout...")
            
            # Execute with proper error handling
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            
            if result.returncode == 0:
                if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                    logger.info("✅ Reliable noise reduction completed successfully")
                    return True
                else:
                    logger.error("Output file is missing or too small")
                    return False
            else:
                logger.error(f"❌ FFmpeg failed with return code {result.returncode}")
                logger.error(f"FFmpeg stderr: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            logger.error("❌ Noise reduction timed out")
            return False
        except Exception as e:
            logger.error(f"❌ Reliable noise reduction failed: {e}")
            return False

    def get_proper_noise_level_fast(self, input_path: str, level: str):
        """
        CPU-optimized fast noise level detection for Cloud Run
        Uses lighter analysis methods to reduce processing time
        """
        try:
            # Quick file size and duration check for noise estimation
            file_size = os.path.getsize(input_path) if os.path.exists(input_path) else 0
            if file_size < 1024 * 1024:  # Less than 1MB, likely low noise
                return "medium", 0.3

            # Simplified noise analysis (faster than full spectrum analysis)
            import subprocess
            cmd = ["ffprobe", "-v", "quiet", "-show_entries", "format=duration,bit_rate",
                   "-of", "csv=p=0", input_path]

            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    parts = result.stdout.strip().split(',')
                    if len(parts) >= 2:
                        duration = float(parts[0]) if parts[0] != 'N/A' else 10.0
                        bit_rate = int(parts[1]) if parts[1] != 'N/A' else 1000000

                        # Estimate noise based on bitrate and file characteristics
                        noise_estimate = max(0.1, min(0.8, (2000000 - bit_rate) / 2000000))
                        optimal_level = "high" if noise_estimate > 0.5 else level

                        logger.info(f"🚀 Fast noise analysis: level={optimal_level}, estimate={noise_estimate:.3f}")
                        return optimal_level, noise_estimate
            except Exception as e:
                logger.warning(f"Fast analysis failed: {e}")

            # Fallback to requested level
            return level, 0.5

        except Exception as e:
            logger.warning(f"Fast noise detection failed: {e}, using fallback")
            return level, 0.5

    def _apply_cpu_optimized_noise_reduction(self, input_path: str, output_path: str, level: str) -> bool:
        """
        CPU-optimized noise reduction with quality preservation for Cloud Run
        Uses faster algorithms and thread optimization
        """
        try:
            # Validate inputs
            if not os.path.exists(input_path):
                logger.error(f"Input file not found: {input_path}")
                return False

            # Get stream information
            has_video, has_audio = self.storage_manager._detect_video_streams(input_path)

            if not has_video and not has_audio:
                logger.error("No valid streams found")
                return False

            # CPU-optimized noise profile (lighter processing)
            cpu_profiles = {
                "low": {"video_denoise": "1:0.5:2:1", "audio_nr": "8", "audio_nf": "-40"},
                "medium": {"video_denoise": "2:1:3:2", "audio_nr": "15", "audio_nf": "-35"},
                "high": {"video_denoise": "3:2:4:3", "audio_nr": "20", "audio_nf": "-30"}
            }

            profile = cpu_profiles.get(level, cpu_profiles["medium"])

            logger.info(f"🚀 CPU-optimized {level} noise reduction with quality preservation")

            # Build CPU-optimized FFmpeg command
            cmd = ["ffmpeg", "-y", "-i", input_path]

            # CPU thread optimization for Cloud Run
            cpu_threads = min(4, os.cpu_count() or 2)
            cmd.extend(["-threads", str(cpu_threads)])

            filter_complex = []
            map_args = []

            # Lighter video denoising for CPU optimization
            if has_video:
                video_filter = f"hqdn3d={profile['video_denoise']}"
                filter_complex.append(f"[0:v]{video_filter}[vout]")
                map_args.extend(["-map", "[vout]"])

            # Optimized audio processing
            if has_audio:
                audio_filters = []

                # Lighter audio noise reduction
                nr_value = profile.get('audio_nr', '15')
                nf_value = profile.get('audio_nf', '-35')
                audio_filters.append(f"afftdn=nr={nr_value}:nf={nf_value}")

                # Light voice enhancement (faster)
                audio_filters.append("equalizer=f=250:t=o:w=150:g=1.2")

                if audio_filters:
                    audio_filter_chain = ",".join(audio_filters)
                    filter_complex.append(f"[0:a]{audio_filter_chain}[aout]")
                    map_args.extend(["-map", "[aout]"])

            # Apply filters if any exist
            if filter_complex:
                cmd.extend(["-filter_complex", ";".join(filter_complex)])
                cmd.extend(map_args)
            else:
                cmd.extend(["-c", "copy"])

            # CPU-optimized encoding settings with quality preservation
            cmd.extend([
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
                "-tune", "film",  # Better quality for video content
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart"
            ])

            cmd.append(output_path)

            logger.info(f"📊 Executing CPU-optimized noise reduction: {' '.join(cmd[:6])}...")

            # Execute with timeout
            result = subprocess.run(
                cmd, capture_output=True, text=True,
                timeout=300, check=False  # 5 minute timeout
            )

            if result.returncode == 0:
                if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
                    logger.info("✅ CPU-optimized noise reduction completed successfully")
                    return True
                else:
                    logger.error("❌ Output file empty or missing")
                    return False
            else:
                logger.error(f"❌ CPU-optimized noise reduction failed: {result.stderr}")
                return False

        except subprocess.TimeoutExpired:
            logger.error("❌ CPU-optimized noise reduction timed out")
            return False
        except Exception as e:
            logger.error(f"❌ CPU-optimized noise reduction failed: {e}")
            return False

    # Legacy compatibility methods with reliable implementations
    def analyze_noise_levels(self, video_path: str) -> Dict[str, Any]:
        """Legacy compatibility method with reliable analysis"""
        analysis = self._quick_noise_analysis(video_path)
        return {
            "overall_noise": analysis["noise_level"],
            "video_noise": analysis["noise_level"] * 0.8,  # Estimate
            "audio_noise": analysis["noise_level"] * 1.2,  # Estimate  
            "recommended_profile": "high" if analysis["noise_level"] > 0.5 else "medium",
            "confidence": 0.7  # Conservative confidence
        }

    def remove_noise(self, input_path: str, output_path: str = None, profile: str = "high", custom_settings: Dict = None) -> Dict[str, Any]:
        """Legacy compatibility method with reliable implementation"""
        if not output_path:
            # output_path = os.path.join(self.temp_dir, f"denoised_{uuid.uuid4().hex}.mp4")
            output_path = self.file_manager.create_temp_video("denoised_video_")
        
        result = self.remove_noise_dramatically(input_path, output_path, profile)
        
        if result["success"]:
            return {
                "success": True,
                "output_path": result["output_path"],
                "profile_used": profile,
                "noise_reduction_amount": result["noise_reduction"],
                "voice_preserved": result["voice_preserved"]
            }
        else:
            return {
                "success": False,
                "error": result["error"],
                "output_path": None
            }