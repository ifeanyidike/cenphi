# src/services/platform_optimizer/media_processor.py

import os
import logging
import subprocess
import json
from typing import Dict, List, Any, Optional, Tuple
import cv2
import numpy as np

logger = logging.getLogger(__name__)


class MediaProcessor:
    """Enhanced media processor with intelligent content-aware cropping"""
    
    def __init__(self):
        # and self.device.type != 'cpu'
        self._storage_manager = None
        self._ffmpeg_optimizer = None
        self.encoding_presets = {
            "fast": {
                "preset": "ultrafast",
                "crf": "28",
                "profile": "baseline"
            },
            "balanced": {
                "preset": "fast",
                "crf": "23",
                "profile": "main"
            },
            "high_quality": {
                "preset": "fast",
                "crf": "20",
                "profile": "high"
            },
            # CloudRun-optimized presets - balanced speed and quality
            "very_fast_hq": {
                "preset": "veryfast",
                "crf": "21",  # Slightly higher CRF for better compression speed
                "profile": "main",
                "tune": "fastdecode"  # Better for CloudRun CPU constraints
            },
            "ultra_fast_hq": {
                "preset": "ultrafast",
                "crf": "23",  # Balanced quality/speed trade-off
                "profile": "baseline",  # Faster encoding profile
                "tune": "fastdecode"
            },
            "fast_hq": {
                "preset": "faster",  # Changed from "fast" for better CloudRun performance
                "crf": "20",  # Slightly increased for speed
                "profile": "main",  # Changed from "high" for compatibility
                "tune": "film"
            }
        }
        
        # Bitrate targets for different resolutions and quality levels
        self.bitrate_targets = {
            "480p": {"fast": "800k", "balanced": "1200k", "high_quality": "2000k"},
            "720p": {"fast": "1500k", "balanced": "2500k", "high_quality": "4000k"},
            "1080p": {"fast": "3000k", "balanced": "5000k", "high_quality": "8000k"},
            "1440p": {"fast": "6000k", "balanced": "10000k", "high_quality": "16000k"},
            "4k": {"fast": "12000k", "balanced": "20000k", "high_quality": "35000k"}
        }
        
        logger.info("MediaProcessor initialized with smart cropping")

    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer
    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager

    def process_video(
        self,
        input_path: str,
        output_path: str,
        target_spec: Dict[str, Any],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process video with comprehensive optimization including smart cropping
        
        Args:
            input_path: Path to input video
            output_path: Path for output video
            target_spec: Target specifications (width, height, fps, etc.)
            options: Processing options including smart crop settings
            
        Returns:
            Dict containing processing results
        """
        try:
            if not os.path.exists(input_path):
                raise FileNotFoundError(f"Input video not found: {input_path}")
            
            options = options or {}
            
            # Analyze source video
            source_analysis = self.analyze_video(input_path)
            if not source_analysis["success"]:
                raise Exception(f"Video analysis failed: {source_analysis['error']}")
            
            # Build processing strategy
            strategy = self._build_processing_strategy(source_analysis, target_spec, options)
            
            # Build and execute FFmpeg command
            cmd = self._build_video_command(input_path, output_path, strategy, target_spec, options)
            
            logger.debug(f"Executing FFmpeg command: {' '.join(cmd)}")
            
            env = os.environ.copy()
            env['FFREPORT'] = 'file=/dev/null'

            # result = subprocess.run(
            #     cmd,
            #     capture_output=True,
            #     text=True,
            #     timeout=options.get("timeout", 600),
            #     check=False,
            #     env=env,
            #     bufsize=65536  # 64KB buffer
            # )
            result = self.ffmpeg_optimizer.optimize_and_execute(
                cmd,
                capture_output=True,
                text=True,
                timeout=options.get("timeout", 600),
                check=False,
                env=env,
                bufsize=65536  # 64KB buffer
            )
            
            if result.returncode != 0:
                logger.error(f"FFmpeg processing failed: {result.stderr}")
                raise Exception(f"Video processing failed: {result.stderr}")
            
            # Verify output file
            if not os.path.exists(output_path):
                raise Exception("Output file was not created")
            
            if os.path.getsize(output_path) < 1024:
                raise Exception("Output file is too small, likely corrupted")
            
            # Analyze output for validation
            output_analysis = self.analyze_video(output_path)
            
            return {
                "success": True,
                "input_analysis": source_analysis,
                "output_analysis": output_analysis,
                "processing_strategy": strategy,
            }
            
        except Exception as e:
            logger.error(f"Video processing failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "input_analysis": source_analysis if 'source_analysis' in locals() else {},
                "processing_strategy": strategy if 'strategy' in locals() else {}
            }

    def analyze_video(self, video_path: str) -> Dict[str, Any]:
        """Comprehensive video analysis"""
        try:
            if not os.path.exists(video_path):
                return {"success": False, "error": f"Video file not found: {video_path}"}
            
            # Get basic video information using ffprobe
            cmd = [
                "ffprobe", "-v", "quiet", "-print_format", "json",
                "-show_format", "-show_streams", video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            probe_data = json.loads(result.stdout)
            
            # Parse video streams
            video_streams = []
            audio_streams = []

            streams = probe_data.get("streams", [])

            has_video = any(stream.get("codec_type") == "video" for stream in streams)
            has_audio = any(stream.get("codec_type") == "audio" for stream in streams)
            
            for stream in streams:
                if stream.get("codec_type") == "video":
                    video_streams.append({
                        "width": int(stream.get("width", 0)),
                        "height": int(stream.get("height", 0)),
                        "fps": self._parse_framerate(stream.get("r_frame_rate", "30/1")),
                        "codec": stream.get("codec_name", "unknown"),
                        "pixel_format": stream.get("pix_fmt", "unknown"),
                        "bitrate": int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else 0,
                        "duration": float(stream.get("duration", 0)) if stream.get("duration") else 0,
                        "interlaced": stream.get("field_order", "progressive") != "progressive",
                        "color_space": stream.get("color_space", "unknown"),
                        "has_video": has_video,
                        "has_audio": has_audio,
                    })
                elif stream.get("codec_type") == "audio":
                    audio_streams.append({
                        "codec": stream.get("codec_name", "unknown"),
                        "sample_rate": int(stream.get("sample_rate", 0)),
                        "channels": int(stream.get("channels", 0)),
                        "bitrate": int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else 0,
                        "duration": float(stream.get("duration", 0)) if stream.get("duration") else 0
                    })
            
            format_info = probe_data.get("format", {})
            
            # Quality assessment
            quality_assessment = self._assess_video_quality(video_streams[0] if video_streams else {})
            
            return {
                "success": True,
                "file_path": video_path,
                "file_size": int(format_info.get("size", 0)),
                "duration": float(format_info.get("duration", 0)),
                "format_name": format_info.get("format_name", "unknown"),
                "video_streams": video_streams,
                "audio_streams": audio_streams,
                "has_video": len(video_streams) > 0,
                "has_audio": len(audio_streams) > 0,
                "quality_assessment": quality_assessment
            }
            
        except Exception as e:
            logger.error(f"Video analysis failed: {e}")
            return {"success": False, "error": str(e)}

    def _build_processing_strategy(
        self, 
        source_analysis: Dict[str, Any], 
        target_spec: Dict[str, Any], 
        options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Build comprehensive processing strategy with smart cropping support"""
        
        strategy = {"needs_scaling": False}
        
        # Get primary video stream
        video_streams = source_analysis.get("video_streams", [])
        if not video_streams:
            return strategy
        
        primary_video = video_streams[0]
        
        # Resolution and aspect ratio strategy
        source_width = primary_video.get("width", 0)
        source_height = primary_video.get("height", 0)
        target_width = target_spec.get("width", 1920)
        target_height = target_spec.get("height", 1080)
        
        # Calculate aspect ratios
        source_aspect = source_width / source_height if source_height > 0 else 16/9
        target_aspect = target_width / target_height
        aspect_mode = target_spec.get("aspect_mode", "crop")
        
        # Determine if scaling/cropping is needed
        if (source_width != target_width or 
            source_height != target_height or 
            abs(source_aspect - target_aspect) > 0.01):
            strategy["needs_scaling"] = True
            
            # Set scale method based on scaling requirements
            if source_width > target_width * 2 or source_height > target_height * 2:
                strategy["scale_method"] = "lanczos"  # High-quality downscaling
            elif source_width < target_width // 2 or source_height < target_height // 2:
                strategy["scale_method"] = "lanczos"  # High-quality upscaling
            else:
                strategy["scale_method"] = "bicubic"  # Moderate scaling
        
        # Smart cropping strategy
        strategy["use_smart_crop"] = options.get("use_smart_crop", True)
        strategy["analysis_frames"] = options.get("analysis_frames", 5)
        
        # Frame rate strategy - improved handling for low-res videos
        source_fps = primary_video.get("fps", 30)
        target_fps = target_spec.get("fps", 30)

        # More conservative fps conversion to prevent video freezing issues
        # Especially important for low-resolution videos which are more sensitive
        is_low_resolution = primary_video.get("width", 1920) <= 720 or primary_video.get("height", 1080) <= 480

        if is_low_resolution:
            # For low-res videos, only convert fps if there's a significant difference
            # and prefer to keep original fps if reasonable
            if abs(source_fps - target_fps) > 5 and source_fps > 0:
                if target_fps <= 30 and source_fps <= 30:
                    strategy["needs_fps_conversion"] = True
                    strategy["safe_fps_conversion"] = True
                else:
                    # Skip fps conversion for problematic combinations
                    strategy["preserve_original_fps"] = True
            else:
                strategy["preserve_original_fps"] = True
        else:
            # Standard fps conversion for higher resolution videos
            if abs(source_fps - target_fps) > 1:
                strategy["needs_fps_conversion"] = True
        
        # Quality enhancement strategy
        if primary_video.get("interlaced"):
            strategy["needs_deinterlacing"] = True
        
        if source_analysis.get("quality_assessment", {}).get("noise_level", "low") in ["medium", "high"]:
            strategy["needs_denoise"] = True
        
        if source_analysis.get("quality_assessment", {}).get("stability", "stable") == "shaky":
            strategy["needs_stabilization"] = True
        
        # Color correction strategy
        color_space = primary_video.get("color_space", "unknown")
        if color_space != target_spec.get("color_space", "bt709"):
            strategy["needs_color_correction"] = True
        
        # CPU-optimized encoding strategy for Cloud Run
        if options.get("use_cpu_optimization", False):
            # Use quality-preserving CPU presets
            quality_preset = options.get("quality_preset", "very_fast_hq")
            if quality_preset in self.encoding_presets:
                strategy["encoding_preset"] = quality_preset
                logger.info(f"🚀 Using CPU-optimized preset: {quality_preset}")
            else:
                strategy["encoding_preset"] = "very_fast_hq"  # Default fallback
        else:
            # Traditional encoding strategy
            strategy["encoding_preset"] = options.get("quality", "balanced")

        strategy["use_hw_accel"] = options.get("use_hw_accel", False)
        strategy["threads"] = options.get("threads", min(4, os.cpu_count() or 2))
        
        return strategy

    def _build_video_command(
        self, 
        input_path: str, 
        output_path: str, 
        strategy: Dict[str, Any], 
        target_spec: Dict[str, Any], 
        options: Dict[str, Any]
    ) -> List[str]:
        """Build sophisticated FFmpeg command for video processing with smart cropping"""
        
        try:
            # Start with ffmpeg command
            cmd = ["ffmpeg", "-y"]
            
            # Hardware acceleration BEFORE input (if available)
            if strategy.get("use_hw_accel") and self._check_hw_acceleration():
                cmd.extend(["-hwaccel", "auto"])
            
            # Add input file AFTER hardware acceleration
            cmd.extend(["-i", input_path])
            
            # Build complex filter chain
            filters = []
            
            # Video filters based on strategy
            if strategy.get("needs_scaling"):
                target_width = target_spec.get("width", 1920)
                target_height = target_spec.get("height", 1080)
                aspect_mode = target_spec.get("aspect_mode", "crop")
                scale_method = strategy.get("scale_method", "lanczos")
                
                # Handle aspect ratio correctly with SMART CROPPING
                if aspect_mode == "fit":
                    # Fit mode: scale to fit within dimensions, add padding
                    filters.append(
                        f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease:flags={scale_method}"
                    )
                    filters.append(
                        f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:black"
                    )
                elif aspect_mode == "crop":
                    # 🧠 SMART CROP MODE: Detect content and crop intelligently
                    use_smart_crop = strategy.get("use_smart_crop", True)
                    
                    if use_smart_crop:
                        logger.info("🎯 Using intelligent content-aware cropping")
                        
                        target_aspect = target_width / target_height
                        
                        # Detect content center
                        content_center = self.detect_content_center(
                            input_path, 
                            target_aspect, 
                            strategy.get("analysis_frames", 5)
                        )
                        
                        # Get video dimensions from analysis
                        video_info = self._get_video_info(input_path)
                        if video_info:
                            source_width = video_info["width"]
                            source_height = video_info["height"]
                            
                            # Calculate smart crop position
                            crop_info = self.calculate_smart_crop_position(
                                source_width, source_height, 
                                target_width, target_height,
                                content_center
                            )
                            
                            # Apply smart crop then scale
                            crop_filter = (
                                f"crop={crop_info['crop_width']}:{crop_info['crop_height']}:"
                                f"{crop_info['crop_x']}:{crop_info['crop_y']}"
                            )
                            scale_filter = f"scale={target_width}:{target_height}:flags={scale_method}"
                            
                            filters.extend([crop_filter, scale_filter])
                            
                            logger.info(
                                f"📍 Smart crop applied: {crop_info['crop_width']}x{crop_info['crop_height']} "
                                f"at ({crop_info['crop_x']},{crop_info['crop_y']}) "
                                f"targeting content at {content_center}"
                            )
                        else:
                            logger.warning("⚠️ Could not get video info, falling back to center crop")
                            # Fallback to center crop
                            filters.append(
                                f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase:flags={scale_method}"
                            )
                            filters.append(f"crop={target_width}:{target_height}")
                    else:
                        logger.info("📐 Using standard center crop")
                        # Standard center crop (original logic)
                        filters.append(
                            f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase:flags={scale_method}"
                        )
                        filters.append(f"crop={target_width}:{target_height}")
                else:  # stretch (deprecated, fallback to smart crop)
                    logger.warning("Stretch mode deprecated, using smart crop instead")
                    # Use smart crop as fallback for deprecated stretch mode
                    filters.append(
                        f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase:flags={scale_method}"
                    )
                    filters.append(f"crop={target_width}:{target_height}")
            
            if strategy.get("needs_deinterlacing"):
                filters.append("yadif=0:-1:0")
            
            if strategy.get("needs_denoise"):
                filters.append("hqdn3d=4:3:6:4.5")
            
            if strategy.get("needs_stabilization"):
                filters.append("deshake")
            
            # Skip color correction if colors are already enhanced to preserve quality
            if strategy.get("needs_color_correction") and not options.get("preserve_colors", False):
                filters.append("colorbalance=rs=0.1:gs=0.1:bs=-0.1")
            elif options.get("preserve_colors", False):
                logger.info("Skipping color correction to preserve enhanced colors")
            
            # Apply video filters
            if filters:
                cmd.extend(["-vf", ",".join(filters)])
            
            # Audio handling
            if target_spec.get("include_audio", True):
                cmd.extend(["-c:a", "aac", "-b:a", "128k"])
            else:
                cmd.extend(["-an"])
            
            # Video encoding settings with CPU optimization
            preset_config = self.encoding_presets[strategy.get("encoding_preset", "balanced")]
            cmd.extend([
                "-c:v", "libx264",
                "-preset", preset_config["preset"],
                "-crf", preset_config["crf"],
                "-profile:v", preset_config["profile"],
                "-pix_fmt", "yuv420p"
            ])

            # Add tune parameter for quality-preserving presets
            if "tune" in preset_config:
                cmd.extend(["-tune", preset_config["tune"]])

            # CloudRun-optimized CPU settings
            cpu_count = os.cpu_count() or 2
            # CloudRun typically has 1-4 vCPUs, optimize accordingly
            if cpu_count <= 2:
                threads = 2  # Use all available cores for small instances
                cmd.extend(["-threads", "2", "-thread_type", "frame"])  # Frame-level threading
            else:
                threads = min(4, cpu_count)  # Cap at 4 for larger instances
                cmd.extend(["-threads", str(threads), "-thread_type", "slice"])  # Slice-level threading for multi-core

            # Add CloudRun-specific optimizations
            cmd.extend(["-max_muxing_queue_size", "1024"])  # Prevent buffer overrun
            
            # Frame rate - improved handling to prevent freezing
            if strategy.get("needs_fps_conversion") and not strategy.get("preserve_original_fps"):
                if strategy.get("safe_fps_conversion"):
                    # Use more conservative fps conversion for low-res videos
                    cmd.extend(["-r", str(min(target_spec.get("fps", 30), 30))])
                    cmd.extend(["-vsync", "1"])  # Ensure frame sync consistency
                else:
                    cmd.extend(["-r", str(target_spec.get("fps", 30))])
            elif strategy.get("preserve_original_fps"):
                # Preserve original fps for low-res videos to prevent issues
                logger.info("Preserving original frame rate for low-resolution video")
            
            # Bitrate control
            if "max_bitrate" in target_spec:
                bitrate = target_spec["max_bitrate"]
                if isinstance(bitrate, str) and bitrate.endswith('k'):
                    bitrate = bitrate[:-1]
                cmd.extend(["-maxrate", f"{bitrate}k", "-bufsize", f"{int(bitrate) * 2}k"])
            
            # Output optimizations
            cmd.extend(["-movflags", "+faststart"])
            cmd.append(output_path)
            
            return cmd
            
        except Exception as e:
            logger.error(f"Failed to build video command: {e}")
            # Return basic fallback command
            return [
                "ffmpeg", "-y", "-i", input_path,
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                output_path
            ]

    def detect_content_center(self, video_path: str, target_aspect: float, ENABLE_SMART_CROP = False, sample_frames: int = 5) -> Tuple[int, int]:
        """Two-stage content detection"""
        cap = None
        try:
            # Validate inputs
            if target_aspect <= 0:
                logger.warning("Invalid target aspect ratio")
                return (960, 540)
            
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception("Cannot open video")
            
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # Validation
            if width <= 0 or height <= 0 or total_frames <= 0:
                logger.warning(f"Invalid video properties: {width}x{height}, {total_frames} frames")
                return (width // 2 if width > 0 else 960, height // 2 if height > 0 else 540)
            
            center_x, center_y = width // 2, height // 2
            
            # STAGE 1: Quick composition analysis
            crop_analysis = self._analyze_crop_necessity(cap, width, height, total_frames, target_aspect)
            
            if not crop_analysis["needs_smart_crop"]:
                logger.info(f"📐 Using center crop - {crop_analysis['reason']}")
                return (center_x, center_y)
            
            # STAGE 2: Smart detection
            smart_center = self._detect_smart_center(cap, width, height, total_frames, sample_frames)
            
            if smart_center:
                logger.info(f"🎯 Smart crop: ({smart_center[0]}, {smart_center[1]}) - {crop_analysis['reason']}")
                return smart_center
            else:
                logger.info("⚠️ Smart detection failed, using center")
                return (center_x, center_y)
            
        except Exception as e:
            logger.warning(f"Content detection failed: {e}")
            # Robust fallback
            try:
                if cap and cap.isOpened():
                    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                    return (max(w // 2, 1), max(h // 2, 1))
            except:
                pass
            return (960, 540)
        finally:
            if cap:
                cap.release()

    def _analyze_crop_necessity(self, cap, width, height, total_frames, target_aspect) -> Dict[str, Any]:
        """Determine if smart cropping would improve the video"""
        try:
            # Validate inputs
            if width <= 0 or height <= 0 or target_aspect <= 0:
                logger.warning(f"Invalid dimensions or aspect: {width}x{height}, target_aspect={target_aspect}")
                return {
                    "needs_smart_crop": False,
                    "reason": "invalid input parameters",
                    "confidence": 0.95
                }
            
            source_aspect = width / height
            aspect_diff = abs(source_aspect - target_aspect) / target_aspect
            
            # More permissive aspect difference threshold
            if aspect_diff < 0.2:
                return {
                    "needs_smart_crop": False,
                    "reason": f"aspect difference small ({aspect_diff:.3f})",
                    "confidence": 0.9
                }
            
            # If significant aspect difference, assume smart crop will help
            if aspect_diff > 0.3:
                return {
                    "needs_smart_crop": True,
                    "reason": f"significant aspect difference ({aspect_diff:.3f})",
                    "confidence": 0.8
                }
            
            # For borderline cases, default to trying smart crop
            return {
                "needs_smart_crop": True,
                "reason": f"moderate aspect difference ({aspect_diff:.3f}) - attempting smart crop",
                "confidence": 0.6
            }
            
        except Exception as e:
            logger.error(f"Crop necessity analysis failed: {e}")
            return {
                "needs_smart_crop": False,
                "reason": f"analysis failed: {e}",
                "confidence": 0.3
            }
        
    def _get_face_cascade(self):
        """Safely get face cascade with fallback"""
        try:
            # Try multiple possible paths
            cascade_paths = [
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
                '/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml',
                '/opt/conda/share/opencv4/haarcascades/haarcascade_frontalface_default.xml'
            ]
            
            for path in cascade_paths:
                if os.path.exists(path):
                    cascade = cv2.CascadeClassifier(path)
                    if not cascade.empty():
                        return cascade
            
            logger.warning("Face cascade not found in standard locations")
            return None
            
        except Exception as e:
            logger.warning(f"Face cascade initialization failed: {e}")
            return None

    def _detect_smart_center(self, cap, width, height, total_frames, sample_frames):
        """Smart center detection with face padding for better composition"""
        try:
            
            # Fallback to traditional face detection
            logger.info("Using traditional face detection")

            face_cascade = self._get_face_cascade()
            if not face_cascade:
                logger.warning("Face cascade not available")
                return None
            
            if width < 100 or height < 100:
                logger.warning(f"Video too small for face detection: {width}x{height}")
                return None
            
            sample_frames = min(sample_frames, total_frames, 7)
            frame_indices = np.linspace(0, total_frames - 1, sample_frames, dtype=int)
            
            weighted_centers = []
            
            for frame_idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_idx))
                ret, frame = cap.read()
                
                if not ret or frame is None:
                    continue
                
                if frame.shape[0] != height or frame.shape[1] != width or frame.size == 0:
                    continue
                    
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                
                min_size_w = max(20, width // 15)
                min_size_h = max(20, height // 15)
                max_size_w = min(width // 2, width - 10)
                max_size_h = min(height // 2, height - 10)
                
                faces = face_cascade.detectMultiScale(
                    gray, 
                    scaleFactor=1.1,
                    minNeighbors=4,
                    minSize=(min_size_w, min_size_h),
                    maxSize=(max_size_w, max_size_h)
                )
                
                for (x, y, w, h) in faces:
                    if w <= 0 or h <= 0 or x < 0 or y < 0 or x + w > width or y + h > height:
                        continue
                    
                    face_area = w * h
                    face_ratio = face_area / (width * height)
                    
                    if face_ratio > 0.01:
                        # IMPROVED: Calculate "head center" instead of just face center
                        # This accounts for hair and gives better headroom
                        face_center_x = x + w // 2
                        
                        # Position focus point in UPPER part of detected face
                        # This ensures we capture forehead/hair area above the detected face
                        head_center_y = y + int(h * 0.3)  # 30% down from top of detected face
                        
                        # Ensure coordinates are valid
                        face_center_x = max(1, min(face_center_x, width - 1))
                        head_center_y = max(1, min(head_center_y, height - 1))
                        
                        weight = min(face_ratio * 50, 3.0)
                        weighted_centers.append((face_center_x, head_center_y, weight))
                        
                        logger.debug(f"Head-aware center: face_box=({x},{y},{w},{h}), head_center=({face_center_x},{head_center_y})")
            
            if not weighted_centers:
                logger.info("📐 Traditional detection: No faces detected, using center crop")
                return None
            
            total_weight = sum(w for _, _, w in weighted_centers)
            if total_weight < 0.3:
                logger.info("📐 Traditional detection: Face confidence too low, using center crop")
                return None
            
            # Calculate weighted average
            avg_x = sum(x * w for x, y, w in weighted_centers) / total_weight
            avg_y = sum(y * w for x, y, w in weighted_centers) / total_weight
            
            # Conservative bounds
            # margin_x = max(10, width // 10)
            # margin_y = max(10, height // 10)

            margin_x = max(20, width // 8)   # INCREASED margin
            margin_y = max(20, height // 8)  # INCREASED margin
            
            final_x = max(margin_x, min(int(avg_x), width - margin_x))
            final_y = max(margin_y, min(int(avg_y), height - margin_y))
            
            # if final_x <= 0 or final_y <= 0 or final_x >= width or final_y >= height:
            #     return None

            if final_x <= margin_x or final_y <= margin_y or final_x >= (width - margin_x) or final_y >= (height - margin_y):
                logger.warning("📐 Traditional detection: Calculated crop position too close to edges, using center")
                return None
            
            logger.info(f"✅ Traditional detection successful - Head-aware smart center: ({final_x}, {final_y}) from {len(weighted_centers)} faces")
            return (final_x, final_y)
            
        except Exception as e:
            logger.error(f"Smart center detection failed: {e}")
            return None
        
    

    def calculate_smart_crop_position(
        self,
        source_width: int, 
        source_height: int, 
        target_width: int, 
        target_height: int,
        content_center: Tuple[int, int]
    ) -> Dict[str, Any]:
        """
        Calculate crop position with proper headroom and padding around faces
        """
        content_x, content_y = content_center
        source_aspect = source_width / source_height
        target_aspect = target_width / target_height
        
        if source_aspect > target_aspect:
            # Source is wider - need to crop width
            crop_height = source_height
            crop_width = int(source_height * target_aspect)
            
            # ADD HEADROOM: Assume face center should be in upper 1/3 of final crop
            # This gives space above the head and shows upper body below
            desired_face_y_in_crop = crop_height * 0.3  # Face at 30% from top
            
            # Calculate where crop should start vertically (usually 0 for width crops)
            crop_y = 0
            
            # Calculate horizontal crop position with face positioning
            crop_x = max(0, min(content_x - crop_width // 2, source_width - crop_width))
            
        else:
            # Source is taller - need to crop height  
            crop_width = source_width
            crop_height = int(source_width / target_aspect)
            
            # ADD HEADROOM: Position face in upper portion of crop
            desired_face_y_in_crop = crop_height * 0.3  # Face at 30% from top
            
            # Calculate where to start crop to achieve this face positioning
            crop_start_y = content_y - desired_face_y_in_crop
            
            # Ensure crop stays within bounds
            crop_y = max(0, min(int(crop_start_y), source_height - crop_height))
            crop_x = 0
        
        return {
            "crop_x": crop_x,
            "crop_y": crop_y, 
            "crop_width": crop_width,
            "crop_height": crop_height,
            "content_center": content_center
        }

    def _get_video_info(self, video_path: str) -> Optional[Dict[str, Any]]:
        """Get basic video information"""
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return None
            
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            cap.release()
            
            return {
                "width": width,
                "height": height,
                "fps": fps,
                "frame_count": frame_count,
                "duration": frame_count / fps if fps > 0 else 0
            }
        except Exception as e:
            logger.warning(f"Failed to get video info: {e}")
            return None

    def _parse_framerate(self, framerate_str: str) -> float:
        """Parse framerate string like '30/1' to float"""
        try:
            if '/' in framerate_str:
                num, den = framerate_str.split('/')
                return float(num) / float(den)
            return float(framerate_str)
        except (ValueError, ZeroDivisionError):
            return 30.0  # Default fallback

    def _assess_video_quality(self, video_stream: Dict[str, Any]) -> Dict[str, Any]:
        """Assess video quality characteristics"""
        
        width = video_stream.get("width", 0)
        height = video_stream.get("height", 0)
        bitrate = video_stream.get("bitrate", 0)
        
        # Resolution assessment
        total_pixels = width * height
        if total_pixels >= 3840 * 2160:
            resolution_class = "4k"
        elif total_pixels >= 2560 * 1440:
            resolution_class = "1440p"
        elif total_pixels >= 1920 * 1080:
            resolution_class = "1080p"
        elif total_pixels >= 1280 * 720:
            resolution_class = "720p"
        else:
            resolution_class = "480p"
        
        # Bitrate assessment
        expected_bitrate_range = self.bitrate_targets.get(resolution_class, {"balanced": "2500k"})
        expected_bitrate = int(expected_bitrate_range["balanced"].replace('k', '')) * 1000
        
        if bitrate > 0:
            bitrate_ratio = bitrate / expected_bitrate
            if bitrate_ratio < 0.5:
                bitrate_quality = "low"
            elif bitrate_ratio > 1.5:
                bitrate_quality = "high"
            else:
                bitrate_quality = "good"
        else:
            bitrate_quality = "unknown"
        
        # Noise level estimation (simplified)
        noise_level = "low"  # Would need actual frame analysis for accurate assessment
        
        # Stability assessment (simplified)
        stability = "stable"  # Would need motion analysis for accurate assessment
        
        return {
            "resolution_class": resolution_class,
            "bitrate_quality": bitrate_quality,
            "noise_level": noise_level,
            "stability": stability,
            "total_pixels": total_pixels
        }
    def _check_hw_acceleration(self) -> str:
        """Detect and return best available hardware acceleration"""
        # Try NVENC (NVIDIA) first - fastest
        try:
            result = subprocess.run(
                ["ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=1:size=64x64:rate=1", 
                "-c:v", "h264_nvenc", "-f", "null", "-"], 
                capture_output=True, timeout=5
            )
            if result.returncode == 0:
                return "nvenc"
        except:
            pass
        
        # Try VAAPI (Intel/AMD) 
        try:
            result = subprocess.run(
                ["ffmpeg", "-f", "lavfi", "-i", "testsrc=duration=1:size=64x64:rate=1",
                "-vaapi_device", "/dev/dri/renderD128", "-c:v", "h264_vaapi", "-f", "null", "-"],
                capture_output=True, timeout=5
            )
            if result.returncode == 0:
                return "vaapi"
        except:
            pass
        
        return "none"

    def _build_hw_accelerated_command(self, input_path: str, output_path: str, hw_type: str) -> List[str]:
        """Build hardware-accelerated FFmpeg command"""
        cmd = ["ffmpeg", "-y"]
        
        if hw_type == "nvenc":
            cmd.extend([
                "-hwaccel", "cuda",
                "-hwaccel_output_format", "cuda",
                "-i", input_path,
                "-c:v", "h264_nvenc",
                "-preset", "p4",  # Fast preset for NVENC
                "-rc", "vbr",
                "-cq", "20",
                "-b:v", "5M",
                "-maxrate", "8M",
                "-bufsize", "10M"
            ])
        elif hw_type == "vaapi":
            cmd.extend([
                "-vaapi_device", "/dev/dri/renderD128",
                "-hwaccel", "vaapi",
                "-hwaccel_output_format", "vaapi",
                "-i", input_path,
                "-c:v", "h264_vaapi",
                "-rc_mode", "CQP",
                "-qp", "20"
            ])
        else:
            # Fallback to software with optimized settings
            cmd.extend([
                "-i", input_path,
                "-c:v", "libx264",
                "-preset", "faster",
                "-crf", "20"
            ])
        
        cmd.append(output_path)
        return cmd