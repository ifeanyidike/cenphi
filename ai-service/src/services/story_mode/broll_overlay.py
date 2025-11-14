# src/services/story_mode/broll_overlay.py

import os
import logging
import subprocess
import httpx
from typing import List, Dict, Any, Optional
from datetime import datetime

from src.utils.storage import StorageManager
from src.utils.session_manager import get_session_manager
from src.utils.file_manager import FileManager
from src.services.story_mode.broll_placement_ai import get_broll_placement_ai

logger = logging.getLogger(__name__)


class BrollOverlayService:
    """
    Production-grade B-roll overlay service for inserting B-roll footage into testimonial videos.

    Supports multiple overlay modes:
    - fill: B-roll replaces main video completely during specified time range
    - pip: Picture-in-picture mode with B-roll in corner
    - split: Split-screen mode with both videos visible

    Features:
    - Smooth transitions (fade, dissolve, wipe)
    - Audio preservation or ducking
    - Auto-adjustment to avoid covering speaker's face
    - FFmpeg 7.1.1 compatible
    - Cloud Run optimized
    """

    def __init__(self):
        self._storage_manager = None
        self._session_manager = None
        self._file_manager = None
        logger.info("BrollOverlayService initialized")

    @property
    def storage_manager(self) -> StorageManager:
        if self._storage_manager is None:
            self._storage_manager = StorageManager()
        return self._storage_manager

    @property
    def session_manager(self):
        if self._session_manager is None:
            self._session_manager = get_session_manager()
        return self._session_manager

    @property
    def file_manager(self) -> FileManager:
        if self._file_manager is None:
            self._file_manager = FileManager()
        return self._file_manager

    def apply_broll_overlays(
        self,
        video_path: str,
        broll_clips: List[Dict[str, Any]],
        config: Dict[str, Any],
        job_id: str,
        output_dir: Optional[str] = None,
        transcript_segments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Apply B-roll overlays to testimonial video.

        Args:
            video_path: Path to main testimonial video
            broll_clips: List of B-roll clip configurations
            config: B-roll configuration (audio preservation, ducking, placement_strategy, etc.)
            job_id: Job identifier for logging
            output_dir: Output directory (defaults to session temp dir)
            transcript_segments: Transcript segments for AI placement (required if placement_strategy="auto")

        Returns:
            {
                "success": bool,
                "output_path": str,
                "brolls_applied": int,
                "failed_clips": List[str],
                "duration": float,
                "size": float,
                "width": int,
                "height": int,
                "error": str (if failed),
                "ai_placement_info": Dict (if using auto placement)
            }
        """
        logger.info(f"[{job_id}] Applying {len(broll_clips)} B-roll overlays")

        # Check session cache for input video from previous stage (e.g., text_overlay)
        local_video_path = video_path
        if video_path.startswith(("gs://", "https://", "http://")):
            # Try to get cached video from previous stage
            cached_video = self.session_manager.get_latest_file(job_id)
            if cached_video and os.path.exists(cached_video):
                logger.info(f"[{job_id}] ✅ Using cached video from previous stage: {cached_video}")
                local_video_path = cached_video
            else:
                # Need to download video from cloud
                logger.info(f"[{job_id}] No cached video found, downloading from: {video_path}")
                output_dir_temp = output_dir or os.path.join(self.session_manager.base_path, job_id)
                os.makedirs(output_dir_temp, exist_ok=True)

                local_filename = f"input_video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
                local_video_path = os.path.join(output_dir_temp, local_filename)

                success = self.storage_manager.download_media(video_path, local_video_path)
                if not success:
                    error_msg = f"Failed to download input video from: {video_path}"
                    logger.error(f"[{job_id}] ❌ {error_msg}")
                    return {"success": False, "error": error_msg}

                logger.info(f"[{job_id}] Downloaded input video to: {local_video_path}")

        # Validate inputs
        if not os.path.exists(local_video_path):
            error_msg = f"Input video not found: {local_video_path}"
            logger.error(f"[{job_id}] ❌ {error_msg}")
            return {"success": False, "error": error_msg}

        if not broll_clips:
            logger.info(f"[{job_id}] No B-roll clips provided, returning original video")
            video_info = self.storage_manager.get_video_info(local_video_path)
            return {
                "success": True,
                "output_path": local_video_path,
                "brolls_applied": 0,
                "failed_clips": [],
                "duration": video_info.get("duration", 0),
                "size": os.path.getsize(local_video_path) / (1024 * 1024),
                "width": video_info.get("width", 1920),
                "height": video_info.get("height", 1080)
            }

        # Get video duration for AI placement
        video_info = self.storage_manager.get_video_info(local_video_path)
        video_duration = video_info.get("duration", 0)

        # AUTO PLACEMENT: Use AI to intelligently place B-roll
        placement_strategy = config.get("placement_strategy", "even")
        ai_placement_info = None

        if placement_strategy == "auto":
            logger.info(f"[{job_id}] Using AI-powered auto placement")

            if not transcript_segments:
                error_msg = "Auto placement requires transcript segments"
                logger.error(f"[{job_id}] ❌ {error_msg}")
                return {"success": False, "error": error_msg}

            # Use AI to determine optimal B-roll placements
            ai_result = self._auto_place_broll(
                transcript_segments=transcript_segments,
                broll_clips=broll_clips,
                video_duration=video_duration,
                config=config,
                job_id=job_id
            )

            if not ai_result["success"]:
                return ai_result

            # Update broll_clips with AI-determined placements
            broll_clips = ai_result["placements"]
            ai_placement_info = {
                "total_broll_duration": ai_result["total_broll_duration"],
                "coverage_percent": ai_result["coverage_percent"],
                "warnings": ai_result["warnings"]
            }

            logger.info(f"[{job_id}] AI placed {len(broll_clips)} clips ({ai_result['coverage_percent']}% coverage)")

        # Sort clips by start_time for sequential processing
        sorted_clips = sorted(broll_clips, key=lambda x: x.get("start_time", 0))

        # Prepare output directory
        if output_dir is None:
            output_dir = os.path.join(self.session_manager.base_path, job_id)
        os.makedirs(output_dir, exist_ok=True)

        # Download all B-roll clips first
        downloaded_clips = []
        failed_clips = []
        print(f"sorted_clips: {sorted_clips}")

        for clip in sorted_clips:
            clip_id = clip.get("clip_id", "unknown")
            source_url = clip.get("source_url", "")
            print(f"Downloading clip_id: {clip_id}, source_url: {source_url}")

            if not source_url:
                logger.warning(f"[{job_id}] Skipping clip {clip_id} - no source URL")
                failed_clips.append(clip_id)
                continue

            try:
                # Download B-roll clip
                local_path = self._download_broll_clip(source_url, clip_id, job_id, output_dir)
                if local_path:
                    clip["local_path"] = local_path
                    downloaded_clips.append(clip)
                else:
                    failed_clips.append(clip_id)
            except Exception as e:
                logger.error(f"[{job_id}] Failed to download clip {clip_id}: {str(e)}")
                failed_clips.append(clip_id)

        if not downloaded_clips:
            error_msg = "All B-roll clips failed to download"
            logger.error(f"[{job_id}] ❌ {error_msg}")
            return {"success": False, "error": error_msg, "failed_clips": failed_clips}

        # Validate B-roll clip durations and placement
        for clip in downloaded_clips:
            clip_id = clip.get("clip_id", "unknown")
            requested_duration = clip.get("duration", 5.0)
            start_time = clip.get("start_time", 0)
            local_path = clip.get("local_path")

            # Validate placement is within video bounds
            if start_time < 0:
                logger.warning(f"[{job_id}] B-roll clip {clip_id} has negative start_time={start_time}s, adjusting to 0")
                clip["start_time"] = 0
                start_time = 0

            end_time = start_time + requested_duration
            if end_time > video_duration:
                logger.warning(
                    f"[{job_id}] B-roll clip {clip_id} extends beyond video: "
                    f"end_time={end_time}s > video_duration={video_duration}s. "
                    f"Trimming to fit."
                )
                clip["duration"] = video_duration - start_time

            try:
                clip_info = self.storage_manager.get_video_info(local_path)
                actual_duration = clip_info.get("duration", 0)

                if actual_duration < requested_duration:
                    logger.warning(
                        f"[{job_id}] B-roll clip {clip_id} is shorter than requested: "
                        f"actual={actual_duration}s, requested={requested_duration}s. "
                        f"Will loop to fit."
                    )
                    # Don't adjust - let the looping logic handle it

                logger.info(f"[{job_id}] B-roll clip {clip_id} validated: actual_duration={actual_duration}s, requested={requested_duration}s, size={os.path.getsize(local_path) / (1024*1024):.2f} MB")

            except Exception as e:
                logger.warning(f"[{job_id}] Could not validate B-roll clip {clip_id}: {e}")

        # Check for overlapping B-roll clips
        for i, clip1 in enumerate(downloaded_clips):
            for j, clip2 in enumerate(downloaded_clips[i+1:], start=i+1):
                start1 = clip1.get("start_time", 0)
                end1 = start1 + clip1.get("duration", 0)
                start2 = clip2.get("start_time", 0)
                end2 = start2 + clip2.get("duration", 0)

                # Check if clips overlap
                if not (end1 <= start2 or end2 <= start1):
                    overlap_start = max(start1, start2)
                    overlap_end = min(end1, end2)
                    overlap_duration = overlap_end - overlap_start
                    logger.warning(
                        f"[{job_id}] ⚠️ B-roll clips overlap: "
                        f"{clip1.get('clip_id')} ({start1:.1f}s-{end1:.1f}s) and "
                        f"{clip2.get('clip_id')} ({start2:.1f}s-{end2:.1f}s) "
                        f"overlap for {overlap_duration:.1f}s ({overlap_start:.1f}s-{overlap_end:.1f}s)"
                    )

        # Build FFmpeg filter complex for all B-roll overlays
        try:
            filter_complex = self._build_filter_complex(
                video_path=local_video_path,
                broll_clips=downloaded_clips,
                config=config,
                job_id=job_id
            )

            # Generate output filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_filename = f"broll_overlaid_{timestamp}.mp4"
            output_path = os.path.join(output_dir, output_filename)

            # Execute FFmpeg
            success = self._execute_ffmpeg(
                input_path=local_video_path,
                broll_clips=downloaded_clips,
                output_path=output_path,
                filter_complex=filter_complex,
                config=config,
                job_id=job_id
            )

            if not success:
                return {
                    "success": False,
                    "error": "FFmpeg execution failed",
                    "failed_clips": failed_clips
                }

            # Get output video info
            video_info = self.storage_manager.get_video_info(output_path)
            file_size_mb = os.path.getsize(output_path) / (1024 * 1024)

            # Calculate aspect ratio
            width = video_info.get("width", 1920)
            height = video_info.get("height", 1080)
            aspect_ratio = self._calculate_aspect_ratio(width, height)

            logger.info(f"[{job_id}] ✅ B-roll overlay completed: {len(downloaded_clips)} clips applied")

            # Store output in session cache for next stage (15-min TTL)
            self.session_manager.store_file(job_id, "broll_overlay", output_path)
            logger.info(f"[{job_id}] Stored output in session cache for next stage")

            result = {
                "success": True,
                "output_path": output_path,
                "brolls_applied": len(downloaded_clips),
                "failed_clips": failed_clips,
                "duration": video_info.get("duration", 0),
                "size": file_size_mb,
                "width": width,
                "height": height,
                "aspect_ratio": aspect_ratio
            }

            # Add AI placement info if using auto placement
            if ai_placement_info:
                result["ai_placement_info"] = ai_placement_info

            return result

        except Exception as e:
            error_msg = f"Failed to apply B-roll overlays: {str(e)}"
            logger.error(f"[{job_id}] ❌ {error_msg}")
            return {"success": False, "error": error_msg, "failed_clips": failed_clips}

    def _auto_place_broll(
        self,
        transcript_segments: List[Dict[str, Any]],
        broll_clips: List[Dict[str, Any]],
        video_duration: float,
        config: Dict[str, Any],
        job_id: str
    ) -> Dict[str, Any]:
        """
        Use AI to automatically place B-roll clips at optimal moments.

        Args:
            transcript_segments: Video transcript with timestamps
            broll_clips: Available B-roll clips to place
            video_duration: Total video duration in seconds
            config: B-roll configuration
            job_id: Job identifier for logging

        Returns:
            {
                "success": bool,
                "placements": List[Dict] - B-roll clips with AI-determined start_time,
                "total_broll_duration": float,
                "coverage_percent": float,
                "warnings": List[str],
                "error": str (if failed)
            }
        """
        try:
            logger.info(f"[{job_id}] Starting AI-powered B-roll placement analysis")

            # Get AI placement service
            placement_ai = get_broll_placement_ai()

            # Run AI analysis
            ai_result = placement_ai.analyze_and_place_broll(
                transcript_segments=transcript_segments,
                broll_clips=broll_clips,
                video_duration=video_duration,
                config=config
            )

            # Convert AI placements to the format expected by FFmpeg overlay
            placements = []
            for placement in ai_result["placements"]:
                # Preserve all the original clip data and add AI-determined timing
                clip_data = {
                    "clip_id": placement["clip_id"],
                    "source_url": placement.get("clip_url", ""),
                    "name": placement.get("clip_name", "B-roll"),
                    "start_time": placement["start_time"],
                    "duration": placement["duration"],
                    "transition_type": placement.get("transition_type", "fade"),
                    "transition_duration": config.get("transition_duration", 0.5),
                    "position_mode": config.get("position_mode", "fill"),
                    # Store AI metadata for debugging/review
                    "ai_confidence": placement["confidence"],
                    "ai_reason": placement["reason"],
                    "segment_text": placement.get("segment_text", "")
                }
                placements.append(clip_data)

            logger.info(f"[{job_id}] AI placement complete: {len(placements)} clips placed")

            return {
                "success": True,
                "placements": placements,
                "total_broll_duration": ai_result["total_broll_duration"],
                "coverage_percent": ai_result["coverage_percent"],
                "warnings": ai_result["warnings"]
            }

        except Exception as e:
            error_msg = f"AI placement failed: {str(e)}"
            logger.error(f"[{job_id}] ❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "placements": [],
                "total_broll_duration": 0,
                "coverage_percent": 0,
                "warnings": [error_msg]
            }

    def _download_broll_clip(
        self,
        source_url: str,
        clip_id: str,
        job_id: str,
        output_dir: str
    ) -> Optional[str]:
        """Download B-roll clip from cloud storage, HTTP URL, or local path."""
        try:
            # If it's a cloud storage URL, download it
            if source_url.startswith("gs://") or source_url.startswith("https://storage.googleapis.com"):
                local_filename = f"broll_{clip_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
                local_path = os.path.join(output_dir, local_filename)

                success = self.storage_manager.download_media(source_url, local_path)
                if success:
                    logger.info(f"[{job_id}] Downloaded B-roll clip {clip_id} to {local_path}")
                    return local_path
                else:
                    logger.error(f"[{job_id}] Failed to download B-roll clip {clip_id}")
                    return None

            # If it's an HTTP/HTTPS URL (e.g., Pexels), download it
            elif source_url.startswith("http://") or source_url.startswith("https://"):
                # Determine file extension from URL (remove query params first)
                url_without_params = source_url.split('?')[0]
                file_ext = os.path.splitext(url_without_params)[1].lower()

                # Detect if it's an image
                is_image = file_ext in ('.jpg', '.jpeg', '.png', '.gif', '.webp')

                # Default to .mp4 if no extension detected
                if not file_ext:
                    file_ext = ".mp4"

                local_filename = f"broll_{clip_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_ext}"
                local_path = os.path.join(output_dir, local_filename)

                logger.info(f"[{job_id}] Downloading B-roll from HTTP: {source_url}")

                # Download with httpx
                with httpx.Client(timeout=60.0, follow_redirects=True) as client:
                    response = client.get(source_url)
                    response.raise_for_status()

                    # Write to local file
                    with open(local_path, 'wb') as f:
                        f.write(response.content)

                logger.info(f"[{job_id}] Downloaded B-roll clip {clip_id} from HTTP to {local_path}")

                # If it's an image, convert to 5-second video
                if is_image:
                    logger.info(f"[{job_id}] Converting image to video: {local_path}")
                    video_path = self._convert_image_to_video(local_path, job_id, output_dir)
                    if video_path:
                        # Remove original image file
                        try:
                            os.remove(local_path)
                        except:
                            pass
                        return video_path
                    else:
                        logger.error(f"[{job_id}] Failed to convert image to video")
                        return None

                return local_path

            # If it's a local path, verify it exists
            elif os.path.exists(source_url):
                return source_url

            else:
                logger.error(f"[{job_id}] Invalid B-roll source URL: {source_url}")
                return None

        except httpx.HTTPError as e:
            logger.error(f"[{job_id}] HTTP error downloading B-roll clip {clip_id}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"[{job_id}] Error downloading B-roll clip {clip_id}: {str(e)}")
            return None

    def _convert_image_to_video(
        self,
        image_path: str,
        job_id: str,
        output_dir: str,
        duration: float = 5.0
    ) -> Optional[str]:
        """
        Convert a static image to a video with specified duration.

        Args:
            image_path: Path to the image file
            job_id: Job identifier for logging
            output_dir: Directory to save the output video
            duration: Duration of the output video in seconds (default: 5.0)

        Returns:
            Path to the converted video, or None if conversion fails
        """
        try:
            # Generate output filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            video_filename = f"image_to_video_{timestamp}.mp4"
            video_path = os.path.join(output_dir, video_filename)

            logger.info(f"[{job_id}] Converting image to {duration}s video: {image_path}")

            # Build FFmpeg command to convert image to video
            # Use scale filter to ensure proper dimensions and loop the image for the duration
            cmd = [
                "ffmpeg",
                "-loop", "1",  # Loop the image
                "-i", image_path,  # Input image
                "-c:v", "libx264",  # Video codec
                "-t", str(duration),  # Duration
                "-pix_fmt", "yuv420p",  # Pixel format for compatibility
                "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",  # Ensure even dimensions
                "-r", "30",  # Frame rate (30 fps)
                "-preset", "medium",  # Encoding preset
                "-crf", "23",  # Quality
                "-y",  # Overwrite output
                video_path
            ]

            # Execute FFmpeg
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=60,  # 1 minute timeout
                text=True
            )

            if result.returncode != 0:
                logger.error(f"[{job_id}] Image-to-video conversion failed: {result.stderr[-500:]}")
                return None

            # Verify output file exists and has content
            if not os.path.exists(video_path):
                logger.error(f"[{job_id}] Converted video file not found: {video_path}")
                return None

            output_size = os.path.getsize(video_path)
            if output_size == 0:
                logger.error(f"[{job_id}] Converted video file is empty")
                return None

            # Get video info to verify duration
            video_info = self.storage_manager.get_video_info(video_path)
            actual_duration = video_info.get("duration", 0)

            logger.info(
                f"[{job_id}] ✅ Image converted to video: duration={actual_duration}s, "
                f"size={output_size / (1024*1024):.2f}MB"
            )

            return video_path

        except subprocess.TimeoutExpired:
            logger.error(f"[{job_id}] Image-to-video conversion timed out")
            return None
        except Exception as e:
            logger.error(f"[{job_id}] Error converting image to video: {str(e)}")
            return None

    def _build_filter_complex(
        self,
        video_path: str,
        broll_clips: List[Dict[str, Any]],
        config: Dict[str, Any],
        job_id: str
    ) -> str:
        """
        Build FFmpeg filter_complex for B-roll overlays.

        Supports multiple overlay modes with smooth transitions.
        """
        # Get main video info
        video_info = self.storage_manager.get_video_info(video_path)
        main_width = video_info.get("width", 1920)
        main_height = video_info.get("height", 1080)

        filters = []

        # Process each B-roll clip
        for idx, clip in enumerate(broll_clips):
            input_idx = idx + 1  # Main video is input 0
            start_time = clip.get("start_time", 0)
            duration = clip.get("duration", 5.0)

            # CRITICAL: Validate duration and start_time to prevent negative values that cause FFmpeg errors
            if duration <= 0:
                logger.warning(f"[{job_id}] B-roll clip {idx} has invalid duration {duration}, using default 5.0s")
                duration = 5.0

            if start_time < 0:
                logger.warning(f"[{job_id}] B-roll clip {idx} has invalid start_time {start_time}, using 0")
                start_time = 0

            position_mode = clip.get("position_mode", "fill")
            transition_type = clip.get("transition_type", "fade")
            transition_duration = clip.get("transition_duration", 0.5)

            # Validate transition duration
            if transition_duration <= 0:
                transition_duration = 0.5

            # Get actual B-roll clip duration to handle looping if needed
            local_path = clip.get("local_path")
            actual_clip_duration = duration  # Default to requested
            try:
                clip_info = self.storage_manager.get_video_info(local_path)
                actual_clip_duration = clip_info.get("duration", duration)
            except:
                pass  # Use requested duration as fallback

            # Scale and prepare B-roll clip with professional fade transitions
            fade_duration = min(transition_duration, duration / 4)  # Fade max 25% of clip duration

            if position_mode == "fill":
                # Full screen replacement with fade in/out
                # CRITICAL FIX: Use 'increase' to ensure B-roll COVERS the frame (crop if needed)
                # This prevents black bars/padding that show as black/green screens
                # Also trim first 0.1s to skip potential blank/corrupted frames

                # If B-roll clip is shorter than requested duration, loop it
                # Account for the 0.1s trim: actual available = actual_clip_duration - 0.1
                available_duration = actual_clip_duration - 0.1
                needs_loop = available_duration < duration

                if needs_loop and available_duration > 0:
                    # Loop the clip to cover the full duration
                    num_loops = int(duration / available_duration) + 1
                    logger.info(f"[{job_id}] B-roll clip {idx} needs looping: available={available_duration:.1f}s, needed={duration}s, loops={num_loops}")

                    filters.append(
                        f"[{input_idx}:v]trim=start=0.1,"  # Skip first 100ms
                        f"setpts=PTS-STARTPTS,"  # Reset timestamps
                        f"loop=loop={num_loops-1}:size=9999:start=0,"  # Loop the clip
                        f"trim=duration={duration},"  # Trim to exact duration needed
                        f"setpts=PTS-STARTPTS,"  # Reset timestamps after trim
                        f"scale={main_width}:{main_height}:force_original_aspect_ratio=increase,"
                        f"crop={main_width}:{main_height},"  # Crop to exact size
                        f"fade=t=in:st=0:d={fade_duration},"
                        f"fade=t=out:st={duration - fade_duration}:d={fade_duration},"
                        f"setpts=PTS+{start_time}/TB[broll{idx}]"  # Position in timeline
                    )
                else:
                    # Clip is long enough, use as-is
                    filters.append(
                        f"[{input_idx}:v]trim=start=0.1,"  # Skip first 100ms to avoid blank frames
                        f"setpts=PTS-STARTPTS,"  # Reset timestamps after trim
                        f"trim=duration={duration},"  # Trim to exact duration needed
                        f"setpts=PTS-STARTPTS,"  # Reset timestamps after trim
                        f"scale={main_width}:{main_height}:force_original_aspect_ratio=increase,"
                        f"crop={main_width}:{main_height},"  # Crop to exact size (no black padding)
                        f"fade=t=in:st=0:d={fade_duration},"
                        f"fade=t=out:st={duration - fade_duration}:d={fade_duration},"
                        f"setpts=PTS+{start_time}/TB[broll{idx}]"  # Position in timeline
                    )

            elif position_mode == "pip":
                # Picture-in-picture mode with fade transitions
                pip_scale = clip.get("pip_scale", 0.3)
                pip_position = clip.get("pip_position", "bottom_right")

                pip_width = int(main_width * pip_scale)
                pip_height = int(main_height * pip_scale)

                # Calculate position
                if pip_position == "top_left":
                    x, y = 20, 20
                elif pip_position == "top_right":
                    x, y = f"W-w-20", 20
                elif pip_position == "bottom_left":
                    x, y = 20, f"H-h-20"
                else:  # bottom_right
                    x, y = f"W-w-20", f"H-h-20"

                filters.append(
                    f"[{input_idx}:v]scale={pip_width}:{pip_height}:force_original_aspect_ratio=decrease,"
                    f"fade=t=in:st=0:d={fade_duration},"
                    f"fade=t=out:st={duration - fade_duration}:d={fade_duration},"
                    f"setpts=PTS-STARTPTS+{start_time}/TB[broll{idx}]"
                )

            elif position_mode == "split":
                # Split screen mode with fade transitions
                split_orientation = clip.get("split_orientation", "vertical")

                if split_orientation == "horizontal":
                    # Top-bottom split
                    split_height = main_height // 2
                    filters.append(
                        f"[{input_idx}:v]scale={main_width}:{split_height}:force_original_aspect_ratio=decrease,"
                        f"pad={main_width}:{split_height}:(ow-iw)/2:(oh-ih)/2,"
                        f"fade=t=in:st=0:d={fade_duration},"
                        f"fade=t=out:st={duration - fade_duration}:d={fade_duration},"
                        f"setpts=PTS-STARTPTS+{start_time}/TB[broll{idx}]"
                    )
                else:
                    # Side-by-side split
                    split_width = main_width // 2
                    filters.append(
                        f"[{input_idx}:v]scale={split_width}:{main_height}:force_original_aspect_ratio=decrease,"
                        f"pad={split_width}:{main_height}:(ow-iw)/2:(oh-ih)/2,"
                        f"fade=t=in:st=0:d={fade_duration},"
                        f"fade=t=out:st={duration - fade_duration}:d={fade_duration},"
                        f"setpts=PTS-STARTPTS+{start_time}/TB[broll{idx}]"
                    )

        # Overlay all B-roll clips on main video
        current_input = "[0:v]"
        for idx, clip in enumerate(broll_clips):
            start_time = clip.get("start_time", 0)
            duration = clip.get("duration", 5.0)
            position_mode = clip.get("position_mode", "fill")
            transition_type = clip.get("transition_type", "fade")
            transition_duration = clip.get("transition_duration", 0.5)


            if position_mode == "fill":
                # Full replacement - FFmpeg 7.1.1 compatible
                next_label = f"[v{idx}]" if idx < len(broll_clips) - 1 else "[outv]"
                filters.append(
                    f"{current_input}[broll{idx}]overlay="
                    f"enable='between(t,{start_time},{start_time + duration})'"
                    f"{next_label}"
                )
                current_input = next_label

            elif position_mode == "pip":
                # Picture-in-picture overlay - FFmpeg 7.1.1 compatible
                pip_position = clip.get("pip_position", "bottom_right")

                if pip_position == "top_left":
                    x, y = 20, 20
                elif pip_position == "top_right":
                    x, y = "W-w-20", 20
                elif pip_position == "bottom_left":
                    x, y = 20, "H-h-20"
                else:  # bottom_right
                    x, y = "W-w-20", "H-h-20"

                next_label = f"[v{idx}]" if idx < len(broll_clips) - 1 else "[outv]"
                filters.append(
                    f"{current_input}[broll{idx}]overlay="
                    f"x={x}:y={y}:"
                    f"enable='between(t,{start_time},{start_time + duration})'"
                    f"{next_label}"
                )
                current_input = next_label

            elif position_mode == "split":
                # Split screen overlay - FFmpeg 7.1.1 compatible
                split_orientation = clip.get("split_orientation", "vertical")

                if split_orientation == "horizontal":
                    # Top-bottom split - B-roll at bottom
                    y_pos = "H/2"
                    x_pos = 0
                else:
                    # Side-by-side split - B-roll on right
                    x_pos = "W/2"
                    y_pos = 0

                next_label = f"[v{idx}]" if idx < len(broll_clips) - 1 else "[outv]"
                filters.append(
                    f"{current_input}[broll{idx}]overlay="
                    f"x={x_pos}:y={y_pos}:"
                    f"enable='between(t,{start_time},{start_time + duration})'"
                    f"{next_label}"
                )
                current_input = next_label

        filter_complex = ";".join(filters)
        logger.info(f"[{job_id}] Built filter_complex with {len(broll_clips)} B-roll overlays")
        logger.info(f"[{job_id}] Filter complex: {filter_complex[:500]}...")  # Log first 500 chars

        return filter_complex

    def _execute_ffmpeg(
        self,
        input_path: str,
        broll_clips: List[Dict[str, Any]],
        output_path: str,
        filter_complex: str,
        config: Dict[str, Any],
        job_id: str
    ) -> bool:
        """
        Execute FFmpeg with B-roll overlay filter complex.

        FFmpeg 7.1.1 compatible with Cloud Run optimizations.
        """
        try:
            # Get original video duration to prevent output extension
            video_info = self.storage_manager.get_video_info(input_path)
            original_duration = video_info.get("duration", 0)
            logger.info(f"[{job_id}] Original video duration: {original_duration}s - output will be limited to this")

            # Build FFmpeg command
            cmd = ["ffmpeg"]

            # Add main video input
            cmd.extend(["-i", input_path])

            # Add B-roll clip inputs
            for idx, clip in enumerate(broll_clips):
                clip_path = clip["local_path"]
                cmd.extend(["-i", clip_path])

                # Log B-roll clip info for debugging
                try:
                    clip_info = self.storage_manager.get_video_info(clip_path)
                    logger.info(f"[{job_id}] B-roll clip {idx}: duration={clip_info.get('duration')}s, size={clip_info.get('size')}MB")
                except Exception as e:
                    logger.warning(f"[{job_id}] Could not get info for B-roll clip {idx}: {e}")

            # Add filter complex
            cmd.extend(["-filter_complex", filter_complex])

            # Map output video
            cmd.extend(["-map", "[outv]"])

            # Audio handling
            preserve_audio = config.get("preserve_audio", True)
            audio_ducking = config.get("audio_ducking", 0.3)

            if preserve_audio:
                # Keep original audio, optionally duck during B-roll
                if audio_ducking > 0:
                    # TODO: Implement audio ducking filter
                    cmd.extend(["-map", "0:a"])
                else:
                    cmd.extend(["-map", "0:a"])
            else:
                # Use B-roll audio
                cmd.extend(["-map", "1:a?"])  # Use first B-roll's audio if available

            # Video encoding settings (match existing quality standards)
            quality_preset = config.get("quality_preset", "high")

            cmd.extend([
                "-c:v", "libx264",
                "-crf", "17",  # Excellent quality
                "-preset", "medium",  # Balanced speed/quality
                "-threads", "2",  # Cloud Run optimization
                "-x264-params", "ref=5:bframes=3:me=umh:subme=7:trellis=2",
                "-pix_fmt", "yuv420p",
                "-profile:v", "high",
                "-level", "4.1",
            ])

            # Audio encoding
            cmd.extend([
                "-c:a", "aac",
                "-b:a", "192k",
            ])

            # Output settings
            cmd.extend([
                "-movflags", "+faststart",  # Web optimization
                "-t", str(original_duration),  # CRITICAL: Limit output to original video duration
                "-y",  # Overwrite output
                output_path
            ])

            logger.info(f"[{job_id}] Executing FFmpeg for B-roll overlay...")

            # Execute with timeout (15 minutes for complex overlays)
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=900,  # 15 minutes
                text=True
            )

            if result.returncode != 0:
                logger.error(f"[{job_id}] FFmpeg failed: {result.stderr[-500:]}")
                return False

            # CRITICAL: Verify output file was actually created and has content
            if not os.path.exists(output_path):
                logger.error(f"[{job_id}] FFmpeg reported success but output file doesn't exist: {output_path}")
                return False

            output_size = os.path.getsize(output_path)
            if output_size == 0:
                logger.error(f"[{job_id}] FFmpeg created empty output file")
                return False

            # Verify output file is different from input (B-roll was actually applied)
            input_size = os.path.getsize(input_path)
            size_diff_percent = abs(output_size - input_size) / input_size * 100

            logger.info(f"[{job_id}] Output file size: {output_size / (1024*1024):.2f} MB (input: {input_size / (1024*1024):.2f} MB, diff: {size_diff_percent:.1f}%)")

            logger.info(f"[{job_id}] ✅ FFmpeg execution completed successfully")
            return True

        except subprocess.TimeoutExpired:
            logger.error(f"[{job_id}] FFmpeg execution timed out after 15 minutes")
            return False
        except Exception as e:
            logger.error(f"[{job_id}] FFmpeg execution error: {str(e)}")
            return False

    def _calculate_aspect_ratio(self, width: int, height: int) -> str:
        """
        Calculate aspect ratio string from width and height.
        Returns common ratios like "16:9", "9:16", "1:1", "4:3", etc.

        Args:
            width: Video width in pixels
            height: Video height in pixels

        Returns:
            Aspect ratio string (e.g., "16:9", "9:16")
        """
        if width == 0 or height == 0:
            return "16:9"  # Default fallback

        # Calculate GCD to simplify ratio
        from math import gcd
        divisor = gcd(width, height)
        ratio_w = width // divisor
        ratio_h = height // divisor

        # Map to common aspect ratios for cleaner display
        ratio_decimal = width / height

        # Common aspect ratios with tolerance
        common_ratios = [
            (16/9, "16:9"),      # 1.778 - Landscape/YouTube
            (9/16, "9:16"),      # 0.563 - Portrait/TikTok
            (4/3, "4:3"),        # 1.333 - Standard
            (1/1, "1:1"),        # 1.000 - Square/Instagram
            (21/9, "21:9"),      # 2.333 - Ultrawide
            (4/5, "4:5"),        # 0.800 - Instagram portrait
        ]

        for expected_ratio, label in common_ratios:
            if abs(ratio_decimal - expected_ratio) < 0.05:  # 5% tolerance
                return label

        # If not a common ratio, return calculated ratio
        return f"{ratio_w}:{ratio_h}"
