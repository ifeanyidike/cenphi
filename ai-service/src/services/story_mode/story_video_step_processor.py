# src/services/story_mode/story_video_step_processor.py

import os
import logging
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
import subprocess
import uuid

from src.utils.storage import StorageManager
from src.utils.session_manager import get_session_manager
from src.utils.ffmpeg_optimizer import FFmpegOptimizer
from src.utils.progress_publisher import get_progress_publisher
from .transition_selector import SmartTransitionSelector
from .emotional_arc_analyzer import EmotionalArcAnalyzer
from .ab_test_generator import ABTestGenerator
from src.services.analytics.performance_scorer import PerformanceScorer
from src.services.analytics.competitive_benchmarking import CompetitiveBenchmarker
from src.services.suggestions.interactive_suggestions import InteractiveSuggestionEngine, SuggestionContext
from src.utils.job_cancellation_manager import job_checker

logger = logging.getLogger(__name__)


class StoryVideoStepProcessor:
    """
    Step-by-step story video processing with dual-mode support.

    FFmpeg 7.1.1 compatible commands.

    Handles:
    - Video normalization (resolution, codec)
    - Clip assembly with transitions
    - Intro/outro addition
    """

    def __init__(self):
        self._storage_manager = None
        self._session_manager = None
        self._ffmpeg_optimizer = None
        self._progress_publisher = None
        self._transition_selector = None
        self._emotional_arc_analyzer = None
        self._ab_test_generator = None
        self._performance_scorer = None
        self._competitive_benchmarker = None
        self._suggestion_engine = None
        self._video_normalizer = None
        self._professional_intro_outro_generator = None

        logger.info("StoryVideoStepProcessor initialized (FFmpeg 7.1.1)")

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
    def ffmpeg_optimizer(self) -> FFmpegOptimizer:
        if self._ffmpeg_optimizer is None:
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer

    @property
    def progress_publisher(self):
        if self._progress_publisher is None:
            self._progress_publisher = get_progress_publisher()
        return self._progress_publisher

    @property
    def transition_selector(self) -> SmartTransitionSelector:
        if self._transition_selector is None:
            self._transition_selector = SmartTransitionSelector()
        return self._transition_selector

    @property
    def emotional_arc_analyzer(self) -> EmotionalArcAnalyzer:
        if self._emotional_arc_analyzer is None:
            self._emotional_arc_analyzer = EmotionalArcAnalyzer()
        return self._emotional_arc_analyzer

    @property
    def performance_scorer(self) -> PerformanceScorer:
        if self._performance_scorer is None:
            self._performance_scorer = PerformanceScorer()
        return self._performance_scorer

    @property
    def competitive_benchmarker(self) -> CompetitiveBenchmarker:
        if self._competitive_benchmarker is None:
            self._competitive_benchmarker = CompetitiveBenchmarker()
        return self._competitive_benchmarker

    @property
    def ab_test_generator(self) -> ABTestGenerator:
        if self._ab_test_generator is None:
            self._ab_test_generator = ABTestGenerator()
        return self._ab_test_generator

    @property
    def suggestion_engine(self) -> InteractiveSuggestionEngine:
        if self._suggestion_engine is None:
            self._suggestion_engine = InteractiveSuggestionEngine()
        return self._suggestion_engine

    @property
    def video_normalizer(self):
        if self._video_normalizer is None:
            from .video_resolution_normalizer import VideoResolutionNormalizer
            self._video_normalizer = VideoResolutionNormalizer()
        return self._video_normalizer

    @property
    def intro_outro_generator(self):
        if self._professional_intro_outro_generator is None:
            from .intro_outro_generator import IntroOutroGenerator
            self._professional_intro_outro_generator = IntroOutroGenerator()
        return self._professional_intro_outro_generator

    def _get_input_file(self, job_id: str, media_url: str) -> str:
        """Get input file from session cache or download"""
        cached_file = self.session_manager.get_latest_file(job_id)
        if cached_file:
            logger.info(f"Using cached file for job {job_id}: {cached_file}")
            return cached_file

        logger.info(f"Downloading media for job {job_id} from {media_url}")
        local_path = self.storage_manager.download_media(media_url)
        self.session_manager.store_file(job_id, "download", local_path)

        return local_path

    def _handle_output(
        self,
        job_id: str,
        step_name: str,
        output_path: str,
        upload_intermediate: bool,
        testimonial_id: str
    ) -> Dict[str, Any]:
        """Handle step output: upload to cloud (if interactive) or keep in session"""
        self.session_manager.store_file(job_id, step_name, output_path)

        video_info = self.storage_manager.get_video_info(output_path)
        duration = video_info.get("duration", 0)
        size = os.path.getsize(output_path) / (1024 * 1024)  # MB
        width = video_info.get("width", 1920)
        height = video_info.get("height", 1080)

        # Calculate aspect ratio string
        aspect_ratio = video_info.get("aspect_ratio", "16:9")
        # If aspect_ratio is a string, use it directly; if it's a float, convert it
        if isinstance(aspect_ratio, (int, float)):
            # Common aspect ratios
            if abs(aspect_ratio - 16/9) < 0.01:
                aspect_ratio = "16:9"
            elif abs(aspect_ratio - 9/16) < 0.01:
                aspect_ratio = "9:16"
            elif abs(aspect_ratio - 1) < 0.01:
                aspect_ratio = "1:1"
            elif abs(aspect_ratio - 4/3) < 0.01:
                aspect_ratio = "4:3"
            elif abs(aspect_ratio - 4/5) < 0.01:
                aspect_ratio = "4:5"
            else:
                aspect_ratio = f"{width}:{height}"

        result = {
            "local_path": output_path,
            "duration": duration,
            "size": size,
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio
        }

        if upload_intermediate:
            cloud_path = f"temp/{testimonial_id}/{job_id}/{step_name}/{os.path.basename(output_path)}"
            cloud_url = self.storage_manager.upload_file_with_retry(output_path, cloud_path)
            result["cloud_url"] = cloud_url
            logger.info(f"Uploaded {step_name} to cloud: {cloud_url}")
        else:
            result["cloud_url"] = None
            logger.info(f"Batch mode: keeping {step_name} in container: {output_path}")

        return result

    def _get_video_duration(self, video_path: str) -> float:
        """Get video duration in seconds using ffprobe"""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            return float(result.stdout.strip())
        return 0.0

    def normalize_video_resolution(
        self,
        job_id: str,
        testimonial_id: str,
        clip_urls: List[str],
        target_resolution: str,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Normalize all clips to same resolution and codec (FFmpeg 7.1.1).

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            clip_urls: List of clip cloud URLs
            target_resolution: Target resolution (e.g., "1920x1080", "1080x1920")
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "normalized_urls": [str] or [],
                "local_paths": [str],
                "duration": float,
                "size": float
            }
        """
        logger.info(f"[{job_id}] Normalize Video Resolution: {target_resolution} for {len(clip_urls)} clips")

        normalized_paths = []
        normalized_urls = []

        # Parse target resolution
        width, height = map(int, target_resolution.split('x'))

        for i, clip_url in enumerate(clip_urls):
            # Download clip
            clip_path = self.storage_manager.download_media(clip_url)

            # Prepare output path
            output_filename = f"normalized_clip_{i}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # FFmpeg 7.1.1 compatible normalization with scale2ref and padding
            cmd = [
                "ffmpeg",
                "-i", clip_path,
                "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:-1:-1:color=black",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "48000",
                "-movflags", "+faststart",
                "-y", output_path
            ]

            video_info = self.storage_manager.get_video_info(clip_path)

            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, video_info=video_info, timeout=600)

            if result.returncode != 0:
                raise Exception(f"FFmpeg normalize failed for clip {i}: {result.stderr}")

            normalized_paths.append(output_path)

            # Upload if interactive mode
            if upload_intermediate:
                cloud_path = f"temp/{testimonial_id}/{job_id}/normalized_clips/clip_{i}.mp4"
                cloud_url = self.storage_manager.upload_file_with_retry(output_path, cloud_path)
                normalized_urls.append(cloud_url)

        # Store all normalized clips in session
        for i, path in enumerate(normalized_paths):
            self.session_manager.store_file(job_id, f"normalized_clip_{i}", path)

        # Calculate total duration and size
        total_duration = 0
        total_size = 0
        for path in normalized_paths:
            total_duration += self._get_video_duration(path)
            total_size += os.path.getsize(path) / (1024 * 1024)

        return {
            "normalized_urls": normalized_urls,
            "local_paths": normalized_paths,
            "duration": total_duration,
            "size": total_size
        }

    def assemble_story_video_smart(
        self,
        job_id: str,
        testimonial_id: str,
        clips_metadata: List[Dict[str, Any]],
        target_platform: str = "instagram",
        pacing: str = "balanced",
        upload_intermediate: bool = True
    ) -> Dict[str, Any]:
        """
        Assemble clips with SMART transitions (IMPROVEMENT #5).

        Uses SmartTransitionSelector to choose optimal transitions between clips.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            clips_metadata: List of clip metadata dicts with text_content, highlight_type, duration, storage_path
            target_platform: Target platform (tiktok, instagram, youtube, linkedin)
            pacing: Desired pacing (fast, balanced, slow)
            upload_intermediate: Upload for preview

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float,
                "transitions_used": List[str]
            }
        """
        logger.info(f"[{job_id}] Assemble Story Video with SMART transitions: {len(clips_metadata)} clips for {target_platform}")

        # Get smart transition recommendations
        recommendations = self.transition_selector.recommend_transitions(
            clips=clips_metadata,
            target_platform=target_platform,
            pacing=pacing
        )

        logger.info(f"[{job_id}] Smart transitions recommended:")
        for i, rec in enumerate(recommendations):
            logger.info(f"  {i}: {rec.transition_type} ({rec.duration}s) - {rec.reasoning}")

        # Extract clip paths from metadata
        clip_paths = []
        for clip in clips_metadata:
            # Try to get cached file first
            local_path = self.session_manager.get_file(job_id, f"clip_{clip.get('clip_id')}")
            if not local_path:
                # Download from storage_path
                storage_path = clip.get("storage_path")
                if storage_path:
                    local_path = self.storage_manager.download_media(storage_path)
                    self.session_manager.store_file(job_id, f"clip_{clip.get('clip_id')}", local_path)

            if local_path:
                clip_paths.append(local_path)

        if not clip_paths:
            raise Exception("No valid clip paths found for assembly")

        # Assemble with variable transitions (different transition between each clip pair)
        result = self._assemble_with_variable_transitions(
            job_id=job_id,
            testimonial_id=testimonial_id,
            clip_paths=clip_paths,
            recommendations=recommendations,
            upload_intermediate=upload_intermediate
        )

        # Add transitions info to result
        result["transitions_used"] = [
            f"{rec.transition_type} ({rec.duration}s)"
            for rec in recommendations
        ]

        return result

    def assemble_story_video(
        self,
        job_id: str,
        testimonial_id: str,
        clip_paths: List[str],
        transition_type: str,
        transition_duration: float,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Assemble clips into final story video with transitions (FFmpeg 7.1.1).

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            clip_paths: List of local clip paths (from normalization or session)
            transition_type: Type of transition ("fade", "dissolve", "wipe", "slideright", "slidedown", "none")
            transition_duration: Duration of transition in seconds
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float
            }
        """
        logger.info(f"[{job_id}] Assemble Story Video: {len(clip_paths)} clips with {transition_type} transition")

        # Prepare output path
        output_filename = f"assembled_story_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        if transition_type == "none" or transition_duration <= 0 or len(clip_paths) == 1:
            # Simple concatenation without transitions using concat demuxer
            concat_file = os.path.join(self.session_manager.base_path, job_id, "concat_list.txt")
            with open(concat_file, 'w') as f:
                for clip_path in clip_paths:
                    # Escape single quotes in path
                    escaped_path = clip_path.replace("'", "'\\''")
                    f.write(f"file '{escaped_path}'\n")

            cmd = [
                "ffmpeg",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                "-c", "copy",
                "-movflags", "+faststart",
                "-y", output_path
            ]

            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, timeout=900)

            # Cleanup concat file
            if os.path.exists(concat_file):
                os.unlink(concat_file)

        else:
            # FFmpeg 7.1.1 xfade filter with proper audio handling
            # CRITICAL FIX: Check which clips have video streams vs audio-only
            logger.info(f"[{job_id}] Detecting video/audio streams in clips...")

            clip_has_video = []
            for i, clip_path in enumerate(clip_paths):
                video_info = self.storage_manager.get_video_info(clip_path)
                has_video = video_info.get("width", 0) > 0 and video_info.get("height", 0) > 0
                clip_has_video.append(has_video)
                logger.info(f"[{job_id}] Clip {i}: {'video+audio' if has_video else 'audio-only'}")

            # If ANY clip is audio-only, we CANNOT use xfade transitions
            # Convert audio-only clips to video with black frames, then concatenate
            if not all(clip_has_video):
                logger.warning(f"[{job_id}] Mixed audio/video clips detected - converting audio-only clips to video")
                logger.warning(f"[{job_id}] Clip types: {['V+A' if v else 'A' for v in clip_has_video]}")

                # Convert audio-only clips to video by adding black frames
                converted_clips = []
                for i, (clip_path, has_video) in enumerate(zip(clip_paths, clip_has_video)):
                    if has_video:
                        # Already has video, use as-is
                        converted_clips.append(clip_path)
                        logger.info(f"[{job_id}] Clip {i}: using as-is (has video)")
                    else:
                        # Audio-only - convert to video with black frames
                        logger.info(f"[{job_id}] Clip {i}: converting audio-only to video with black frames")

                        # Get duration and audio properties
                        video_info = self.storage_manager.get_video_info(clip_path)
                        duration = video_info.get("duration", 0)

                        # Get resolution from first video clip (for consistency)
                        ref_width = 1280
                        ref_height = 720
                        for ref_clip, ref_has_video in zip(clip_paths, clip_has_video):
                            if ref_has_video:
                                ref_info = self.storage_manager.get_video_info(ref_clip)
                                ref_width = ref_info.get("width", 1280)
                                ref_height = ref_info.get("height", 720)
                                break

                        converted_path = os.path.join(
                            self.session_manager.base_path,
                            job_id,
                            f"converted_clip_{i}.mp4"
                        )

                        # Convert audio-only to video with black background
                        cmd = [
                            "ffmpeg",
                            "-f", "lavfi",
                            "-i", f"color=c=black:s={ref_width}x{ref_height}:r=24",
                            "-i", clip_path,
                            "-shortest",
                            "-c:v", "libx264",
                            "-preset", "ultrafast",
                            "-crf", "23",
                            "-c:a", "copy",
                            "-movflags", "+faststart",
                            "-y", converted_path
                        ]

                        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
                        if result.returncode != 0:
                            logger.error(f"[{job_id}] Failed to convert audio-only clip {i}: {result.stderr}")
                            # Skip this clip
                            continue

                        converted_clips.append(converted_path)
                        logger.info(f"[{job_id}] Clip {i}: converted successfully")

                # Now concatenate all clips (all have video now)
                if not converted_clips:
                    raise Exception("No valid clips after conversion")

                concat_file = os.path.join(self.session_manager.base_path, job_id, "concat_list.txt")
                with open(concat_file, 'w') as f:
                    for clip_path in converted_clips:
                        escaped_path = clip_path.replace("'", "'\\''")
                        f.write(f"file '{escaped_path}'\n")

                # Re-encode to ensure consistency (no -c copy with mixed sources)
                cmd = [
                    "ffmpeg",
                    "-f", "concat",
                    "-safe", "0",
                    "-i", concat_file,
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "23",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-movflags", "+faststart",
                    "-y", output_path
                ]

                result = self.ffmpeg_optimizer.optimize_and_execute(cmd, timeout=900)

                # Cleanup concat file and converted clips
                if os.path.exists(concat_file):
                    os.unlink(concat_file)
                for clip_path in converted_clips:
                    if clip_path not in clip_paths and os.path.exists(clip_path):
                        os.unlink(clip_path)
            else:
                # All clips have video - proceed with xfade transitions
                video_filters = []
                audio_filters = []

                # Calculate cumulative offsets for xfade
                offsets = []
                cumulative = 0
                for i, clip_path in enumerate(clip_paths[:-1]):
                    duration = self._get_video_duration(clip_path)
                    cumulative += duration - transition_duration
                    offsets.append(cumulative)

                # Build xfade chain for video
                current_label = "[0:v]"
                for i in range(len(clip_paths) - 1):
                    next_label = f"[{i+1}:v]"
                    output_label = f"[vt{i}]" if i < len(clip_paths) - 2 else "[vout]"

                    xfade_filter = (
                        f"{current_label}{next_label}xfade="
                        f"transition={transition_type}:"
                        f"duration={transition_duration}:"
                        f"offset={offsets[i]}"
                        f"{output_label}"
                    )
                    video_filters.append(xfade_filter)
                    current_label = output_label

                # MEMORY-SAFE audio processing for semantic smoothness
                # Heavy processing removed to prevent OOM kills (exit -9)
                # Basic volume normalization only - heavy processing done in individual clips
                for i in range(len(clip_paths)):
                    normalize_filter = (
                        f"[{i}:a]"
                        f"volume=1.0[a{i}_norm]"  # Basic volume - memory-safe
                    )
                    audio_filters.append(normalize_filter)

                # Build SYNCHRONIZED audio crossfades matching video transitions
                # Audio and video must transition together to avoid awkward pauses
                current_audio = "[a0_norm]"
                for i in range(len(clip_paths) - 1):
                    next_audio = f"[a{i+1}_norm]"
                    output_audio = f"[at{i}]" if i < len(clip_paths) - 2 else "[aout_pre]"

                    # MATCH VIDEO TRANSITION DURATION for synchronized feel
                    # Short, snappy transitions (0.3-0.5s) feel more natural than long pauses
                    audio_crossfade_duration = min(
                        max(transition_duration, 0.3),  # Match video, minimum 0.3s for smoothness
                        0.6  # Cap at 0.6s - keeps it snappy, prevents pauses
                    )

                    # Use quarter-sine curve for smooth, natural-feeling transitions
                    # qsin feels more organic than exponential for short durations
                    acrossfade_filter = (
                        f"{current_audio}{next_audio}acrossfade="
                        f"d={audio_crossfade_duration}:"
                        f"curve1=qsin:"  # Quarter-sine fade-out (natural)
                        f"curve2=qsin"  # Quarter-sine fade-in (natural)
                        f"{output_audio}"
                    )
                    audio_filters.append(acrossfade_filter)
                    current_audio = output_audio

                # Final master polish - subtle compression and limiting
                final_polish = (
                    # Master bus compression for glue (very gentle)
                    f"[aout_pre]acompressor=threshold=-18dB:ratio=2:attack=20:release=200:makeup=2,"
                    # Final EQ tweaks
                    f"equalizer=f=100:t=q:w=1:g=0.5,"  # Slight warmth
                    f"equalizer=f=4000:t=q:w=1.5:g=0.8,"  # Voice clarity
                    # Brick wall limiter for absolute safety
                    f"alimiter=limit=0.98:attack=2:release=20[aout]"
                )
                audio_filters.append(final_polish)

                # Combine video and audio filters
                filter_complex = ";".join(video_filters + audio_filters)

                # Build FFmpeg command with all inputs
                inputs = []
                for clip in clip_paths:
                    inputs.extend(["-i", clip])

                cmd = [
                    "ffmpeg"
                ] + inputs + [
                    "-filter_complex", filter_complex,
                    "-map", "[vout]",
                    "-map", "[aout]",
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "23",
                    "-pix_fmt", "yuv420p",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-ar", "48000",
                    "-movflags", "+faststart",
                    "-y", output_path
                ]

                result = self.ffmpeg_optimizer.optimize_and_execute(cmd, timeout=1200)

        if result.returncode != 0:
            raise Exception(f"FFmpeg assembly failed: {result.stderr}")

        # Handle output
        output_result = self._handle_output(
            job_id=job_id,
            step_name="assemble_story",
            output_path=output_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        return output_result

    def add_intro_outro(
        self,
        job_id: str,
        testimonial_id: str,
        media_url: str,
        intro_config: Optional[Dict[str, Any]],
        outro_config: Optional[Dict[str, Any]],
        brand_context: Optional[Dict[str, Any]],
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Add PROFESSIONAL intro and/or outro to video with voiceover (FFmpeg 7.1.1).

        UPGRADED from basic text/image slides to industry-standard intro/outro with:
        - Professional AI voiceover
        - Brand-aligned visual design
        - Optimal duration (2-4 seconds)
        - Smooth transitions

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            media_url: Source media URL (may be unused if session cache hit)
            intro_config: Intro configuration dict or None
            outro_config: Outro configuration dict or None
            brand_context: Brand information (name, tagline, colors, etc.)
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float,
                "intro_voiceover_text": str,
                "outro_voiceover_text": str
            }
        """
        logger.info(f"[{job_id}] Add Professional Intro/Outro with voiceover")

        # Get input file
        input_file = self._get_input_file(job_id, media_url)

        # Get main video info for matching resolution
        video_info = self.storage_manager.get_video_info(input_file)
        width = video_info.get("width", 1920)
        height = video_info.get("height", 1080)

        # Parse brand context
        from .intro_outro_generator import IntroOutroConfig

        brand_name = brand_context.get("name") if brand_context else None
        tagline = brand_context.get("tagline") if brand_context else None
        logo_url = brand_context.get("logo_url") if brand_context else None
        primary_color = brand_context.get("primary_color") if brand_context else None
        secondary_color = brand_context.get("secondary_color") if brand_context else None

        temp_files = []
        intro_file = None
        intro_voiceover_text = ""
        outro_file = None
        outro_voiceover_text = ""

        # Generate professional intro
        if intro_config and intro_config.get("enabled", True):
            config = IntroOutroConfig(
                duration=intro_config.get("duration", 3.0),
                style=intro_config.get("style", "branded"),
                include_voiceover=intro_config.get("include_voiceover", True),
                voice_style=intro_config.get("voice_style", "professional"),
                brand_name=brand_name,
                tagline=tagline,
                logo_url=logo_url,
                primary_color=primary_color,
                secondary_color=secondary_color,
                background_music_url=intro_config.get("background_music"),
                text_overlay=intro_config.get("text_overlay")
            )

            intro_result = self.intro_outro_generator.generate_intro(
                job_id=job_id,
                config=config,
                width=width,
                height=height,
                upload_to_cloud=False
            )

            intro_file = intro_result["local_path"]
            intro_voiceover_text = intro_result["voiceover_text"]
            temp_files.append(intro_file)
            temp_files.extend(intro_result.get("temp_files", []))
            logger.info(f"[{job_id}] Professional intro generated: \"{intro_voiceover_text}\"")

        # Generate professional outro
        if outro_config and outro_config.get("enabled", True):
            config = IntroOutroConfig(
                duration=outro_config.get("duration", 3.0),
                style=outro_config.get("style", "branded"),
                include_voiceover=outro_config.get("include_voiceover", True),
                voice_style=outro_config.get("voice_style", "professional"),
                brand_name=brand_name,
                tagline=tagline,
                logo_url=logo_url,
                primary_color=primary_color,
                secondary_color=secondary_color,
                background_music_url=outro_config.get("background_music"),
                text_overlay=outro_config.get("text_overlay")
            )

            outro_result = self.intro_outro_generator.generate_outro(
                job_id=job_id,
                config=config,
                width=width,
                height=height,
                upload_to_cloud=False
            )

            outro_file = outro_result["local_path"]
            outro_voiceover_text = outro_result["voiceover_text"]
            temp_files.append(outro_file)
            temp_files.extend(outro_result.get("temp_files", []))
            logger.info(f"[{job_id}] Professional outro generated: \"{outro_voiceover_text}\"")

        # CRITICAL FIX: Concatenate intro + main + outro with PERFECT A/V sync
        # Previous issue: Using concat demuxer with re-encoding caused timestamp drift
        # Solution: Use concat filter with proper PTS correction for perfect synchronization
        output_filename = f"with_intro_outro_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Build FFmpeg command using concat FILTER (not demuxer) for perfect A/V sync
        # This ensures timestamps are properly aligned and there's no audio drift
        inputs = []
        video_inputs = []
        audio_inputs = []

        if intro_file:
            inputs.extend(["-i", intro_file])
            video_inputs.append("[0:v]")
            audio_inputs.append("[0:a]")

        inputs.extend(["-i", input_file])
        main_index = 1 if intro_file else 0
        video_inputs.append(f"[{main_index}:v]")
        audio_inputs.append(f"[{main_index}:a]")

        if outro_file:
            outro_index = main_index + 1
            inputs.extend(["-i", outro_file])
            video_inputs.append(f"[{outro_index}:v]")
            audio_inputs.append(f"[{outro_index}:a]")

        # Build concat filter with PROPER PTS (presentation timestamp) handling
        # This is CRITICAL for A/V sync - setpts ensures timestamps are sequential
        num_segments = len(video_inputs)

        # Concatenate video streams with PTS correction
        video_concat = "".join(video_inputs) + f"concat=n={num_segments}:v=1:a=0[vout]"

        # Concatenate audio streams with PTS correction
        audio_concat = "".join(audio_inputs) + f"concat=n={num_segments}:v=0:a=1[aout]"

        # Combine into filter_complex
        filter_complex = f"{video_concat};{audio_concat}"

        cmd = [
            "ffmpeg"
        ] + inputs + [
            "-filter_complex", filter_complex,
            "-map", "[vout]",
            "-map", "[aout]",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "256k",  # Higher bitrate for crystal-clear voiceover
            "-ar", "48000",
            "-ac", "2",  # Ensure stereo
            "-async", "1",  # Audio sync method: resample audio to match video
            "-vsync", "cfr",  # Constant frame rate for perfect sync
            "-movflags", "+faststart",
            "-y", output_path
        ]

        logger.info(f"[{job_id}] Concatenating {num_segments} segments with PTS-corrected sync")
        result = self.ffmpeg_optimizer.optimize_and_execute(cmd, timeout=600)

        if result.returncode != 0:
            raise Exception(f"FFmpeg intro/outro concat failed: {result.stderr}")

        # Cleanup temp files
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.unlink(temp_file)
                except:
                    pass

        # Handle output
        output_result = self._handle_output(
            job_id=job_id,
            step_name="add_intro_outro",
            output_path=output_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        # Add voiceover texts to result
        output_result["intro_voiceover_text"] = intro_voiceover_text
        output_result["outro_voiceover_text"] = outro_voiceover_text

        return output_result

    def collect_clips(
        self,
        job_id: str,
        session_id: str,
        workspace_id: str,
        testimonial_segments: List[Any],  # List of TestimonialSegment protos
        existing_clips: List[Dict[str, Any]],  # List of already-extracted ClipInfo dicts
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Collect clips for story video - extracts new clips from testimonials OR uses existing clips.

        Based on story_generator._process_segments and _process_disparate_segments logic.

        Args:
            job_id: Job identifier
            session_id: Processing session ID
            workspace_id: Workspace ID
            testimonial_segments: Testimonials with highlights to extract (Option 1)
            existing_clips: Already-extracted clips with metadata (Option 2)
            upload_intermediate: True = upload clips to cloud for preview

        Returns:
            {
                "clips": [ClipInfo dicts],
                "total_clips": int,
                "total_duration": float
            }
        """
        logger.info(f"[{job_id}] Collect Clips: {len(testimonial_segments)} testimonials, {len(existing_clips)} existing clips")

        # Emit stage start event
        try:
            self.progress_publisher.publish_step_progress(
                job_id=session_id,
                step_id="extract_clips",
                step_name="Extract Clips",
                progress=0,
                message="Starting clip extraction..."
            )
        except Exception as e:
            logger.warning(f"[{job_id}] Failed to emit start event: {e}")

        all_clips = []
        total_duration = 0.0

        # Option 1: Extract new clips from testimonials (similar to _process_segments)
        if testimonial_segments:
            logger.info(f"[{job_id}] Extracting clips from {len(testimonial_segments)} testimonial segments")

            from concurrent.futures import ThreadPoolExecutor, as_completed

            def process_segment(seg_data):
                seg_idx, segment = seg_data
                segment_clips = []

                try:
                    # Download testimonial media
                    local_media = self.storage_manager.download_media(segment.media_url)
                    if not local_media:
                        logger.warning(f"[{job_id}] Failed to download media for segment {seg_idx}")
                        return []

                    # Extract clips from each highlight in this testimonial
                    for hl_idx, highlight in enumerate(segment.highlights):
                        try:
                            start_time_sec = float(highlight.start_time) / 1000.0
                            end_time_sec = float(highlight.end_time) / 1000.0

                            # Extract clip
                            output_filename = f"clip_{job_id}_{seg_idx}_{hl_idx}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
                            output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
                            os.makedirs(os.path.dirname(output_path), exist_ok=True)

                            # Use ffmpeg to extract clip
                            # CRITICAL FIX: Re-encode instead of copy to avoid keyframe issues
                            # Using -c copy with time-based seeking can result in broken video streams
                            # when landing between keyframes, causing audio-only clips
                            source_info = self.storage_manager.get_video_info(local_media)
                            has_source_video = source_info.get("width", 0) > 0

                            if has_source_video:
                                # Source has video - re-encode to ensure complete video stream
                                # Use -ss after -i for accurate timestamps (slightly slower but precise)
                                # Then use -t (duration) instead of -to for exact length
                                duration_sec = end_time_sec - start_time_sec

                                cmd = [
                                    "ffmpeg",
                                    "-i", local_media,
                                    "-ss", str(start_time_sec),
                                    "-t", str(duration_sec),
                                    "-c:v", "libx264",
                                    "-preset", "fast",
                                    "-crf", "23",
                                    "-c:a", "aac",
                                    "-b:a", "128k",
                                    "-avoid_negative_ts", "make_zero",
                                    "-y", output_path
                                ]

                                logger.info(f"[{job_id}] Extracting clip {seg_idx}_{hl_idx}: {start_time_sec:.3f}s to {end_time_sec:.3f}s (duration: {duration_sec:.3f}s)")
                            else:
                                # Source is audio-only or video is corrupt - skip this clip
                                logger.warning(f"[{job_id}] Skipping clip {seg_idx}_{hl_idx} - source has no video stream")
                                continue

                            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
                            if result.returncode != 0:
                                logger.error(f"[{job_id}] FFmpeg failed for clip {seg_idx}_{hl_idx}: {result.stderr}")
                                continue

                            # IMPORTANT: Do NOT skip audio-only clips here
                            # They will be converted to video with black frames during assembly
                            # This preserves all clips and maintains proper duration
                            clip_info_check = self.storage_manager.get_video_info(output_path)
                            if not (clip_info_check.get("width", 0) > 0 and clip_info_check.get("height", 0) > 0):
                                logger.info(f"[{job_id}] Clip {seg_idx}_{hl_idx} is audio-only - will convert to video during assembly")

                            # Store in session
                            self.session_manager.store_file(job_id, f"clip_{seg_idx}_{hl_idx}", output_path)

                            # Upload if interactive mode
                            cloud_url = None
                            preview_url = None
                            if upload_intermediate:
                                cloud_path = f"temp/{session_id}/{job_id}/clips/clip_{seg_idx}_{hl_idx}.mp4"
                                cloud_url = self.storage_manager.upload_file_with_retry(output_path, cloud_path)
                                preview_url = self.storage_manager.get_presigned_url(cloud_path, expires_in=3600)

                            # Get video metadata
                            video_info = self.storage_manager.get_video_info(output_path)
                            width = video_info.get("width", 0)
                            height = video_info.get("height", 0)

                            clip_info = {
                                "id": f"{job_id}_{seg_idx}_{hl_idx}",
                                "clip_id": f"{seg_idx}_{hl_idx}",
                                "testimonial_id": segment.testimonial_id,
                                "storage_path": cloud_url if upload_intermediate else output_path,
                                "preview_url": preview_url,
                                "start_time": start_time_sec,
                                "end_time": end_time_sec,
                                "duration": end_time_sec - start_time_sec,
                                "highlight_type": highlight.theme,
                                "text_content": highlight.text,
                                "width": width,
                                "height": height,
                                "metadata": {
                                    "testimonial_id": segment.testimonial_id,
                                    "highlight_theme": highlight.theme,
                                    "segment_index": seg_idx,
                                    "highlight_index": hl_idx
                                }
                            }

                            segment_clips.append(clip_info)
                            logger.info(f"[{job_id}] Extracted clip {seg_idx}_{hl_idx}: {clip_info['duration']:.2f}s")

                            # Emit SSE event for this clip
                            try:
                                self.progress_publisher.redis_client.publish(
                                    f"studio:progress:{session_id}",
                                    json.dumps({
                                        "event_type": "clip_extracted",
                                        "job_id": session_id,
                                        "session_id": session_id,
                                        "step_id": "extract_clips",
                                        "clip": clip_info,
                                        "progress": {
                                            "clips_extracted": len(segment_clips),
                                            "total_clips": len(testimonial_segments) * len(segment.highlights) if hasattr(segment, 'highlights') else 0
                                        },
                                        "timestamp": datetime.utcnow().isoformat()
                                    })
                                )
                            except Exception as e:
                                logger.warning(f"[{job_id}] Failed to emit clip_extracted event: {e}")

                        except Exception as e:
                            logger.error(f"[{job_id}] Failed to extract clip {seg_idx}_{hl_idx}: {e}")
                            continue

                    # Cleanup local media
                    if local_media and os.path.exists(local_media):
                        os.unlink(local_media)

                    return segment_clips

                except Exception as e:
                    logger.error(f"[{job_id}] Failed to process segment {seg_idx}: {e}")
                    return []

            # Process segments in parallel
            max_workers = min(4, os.cpu_count() or 1)
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                segment_data = [(idx, seg) for idx, seg in enumerate(testimonial_segments)]
                futures = [executor.submit(process_segment, data) for data in segment_data]

                for future in as_completed(futures):
                    try:
                        clips = future.result()
                        all_clips.extend(clips)
                    except Exception as e:
                        logger.error(f"[{job_id}] Segment processing failed: {e}")

        # Option 2: Use already-extracted clips (just format them)
        # CRITICAL: Preserve the order of clips as passed from frontend (already ordered by user/AI)
        if existing_clips:
            logger.info(f"[{job_id}] Using {len(existing_clips)} existing clips (preserving order)")

            for clip in existing_clips:
                # Clips are already in ClipInfo format from API-server
                # Order is preserved by iterating in sequence
                all_clips.append({
                    "clip_id": clip.get("clip_id", str(uuid.uuid4())),
                    "testimonial_id": clip.get("testimonial_id", ""),
                    "storage_path": clip.get("storage_path", ""),
                    "preview_url": clip.get("preview_url"),
                    "start_time": float(clip.get("start_time", 0.0)),
                    "end_time": float(clip.get("end_time", 0.0)),
                    "duration": float(clip.get("duration", 0.0)),
                    "highlight_type": clip.get("highlight_type", ""),
                    "text_content": clip.get("text_content", "")
                })

        # Calculate total duration
        total_duration = sum(clip["duration"] for clip in all_clips)

        # Store clips metadata in session for next step
        self.session_manager.store_metadata(job_id, "collected_clips", all_clips)

        logger.info(f"[{job_id}] Collected {len(all_clips)} clips, total duration: {total_duration:.2f}s")

        # Emit completion event
        try:
            self.progress_publisher.publish_step_progress(
                job_id=session_id,
                step_id="extract_clips",
                step_name="Extract Clips",
                progress=100,
                message=f"Extracted {len(all_clips)} clips ({total_duration:.1f}s total)",
                metadata={
                    "total_clips": len(all_clips),
                    "total_duration": total_duration,
                    "clips": all_clips
                }
            )
        except Exception as e:
            logger.warning(f"[{job_id}] Failed to emit completion event: {e}")

        return {
            "clips": all_clips,
            "total_clips": len(all_clips),
            "total_duration": total_duration
        }

    def ai_ordering(
        self,
        job_id: str,
        session_id: str,
        clips: List[Dict[str, Any]],
        ordering_strategy: str,
        brand_context: str,
        target_arc: Optional[str] = None  # NEW: For emotional_arc strategy
    ) -> Dict[str, Any]:
        """
        Use AI to intelligently order clips for maximum narrative impact.

        Args:
            job_id: Job identifier
            session_id: Processing session ID
            clips: List of clip metadata from CollectClips step
            ordering_strategy: "narrative", "emotional_arc", "chronological", "impact"
            brand_context: Optional brand/company context
            target_arc: Optional target emotional arc (for emotional_arc strategy)

        Returns:
            {
                "ordered_clips": [...],  # Same clips but reordered
                "ordering_rationale": str,
                "confidence_score": float,
                "arc_quality_score": float (if emotional_arc strategy)
            }
        """
        logger.info(f"[{job_id}] AI Ordering: {len(clips)} clips using '{ordering_strategy}' strategy")

        # Emit start event
        try:
            self.progress_publisher.publish_step_progress(
                job_id=session_id,
                step_id="ai_ordering",
                step_name="AI Clip Ordering",
                progress=0,
                message=f"Analyzing {len(clips)} clips for optimal ordering..."
            )
        except Exception as e:
            logger.warning(f"[{job_id}] Failed to emit start event: {e}")

        if not clips:
            return {
                "ordered_clips": [],
                "ordering_rationale": "No clips to order",
                "confidence_score": 0.0
            }

        # Handle simple strategies without AI
        if ordering_strategy == "chronological":
            ordered_clips = sorted(clips, key=lambda c: (c.get("start_time", 0), c.get("end_time", 0)))
            rationale = "Clips ordered chronologically by start time"
            confidence = 1.0
            arc_quality = None

        elif ordering_strategy == "impact":
            # Order by duration (longer clips first) as proxy for impact
            ordered_clips = sorted(clips, key=lambda c: c.get("duration", 0), reverse=True)
            rationale = "Clips ordered by duration (impact proxy)"
            confidence = 0.7
            arc_quality = None

        elif ordering_strategy == "emotional_arc":
            # IMPROVEMENT #4: Use EmotionalArcAnalyzer for optimal emotional flow
            try:
                logger.info(f"[{job_id}] Using emotional arc analysis")

                arc_analysis = self.emotional_arc_analyzer.analyze_emotional_arc(
                    clips=clips,
                    target_arc=target_arc  # Can be None (auto-detect)
                )

                # Reorder clips based on arc analysis
                ordered_clips = [clips[i] for i in arc_analysis.suggested_reordering]
                rationale = arc_analysis.reasoning
                confidence = arc_analysis.arc_quality_score / 100  # Convert to 0-1
                arc_quality = arc_analysis.arc_quality_score

                logger.info(f"[{job_id}] Emotional arc: {arc_analysis.arc_type}")
                logger.info(f"[{job_id}] Arc quality: {arc_quality:.1f}/100")
                logger.info(f"[{job_id}] Pacing: {arc_analysis.pacing_recommendation}")

            except Exception as e:
                logger.error(f"[{job_id}] Emotional arc analysis failed: {e}, using original order")
                ordered_clips = clips
                rationale = f"Emotional arc analysis error: {str(e)}, kept original order"
                confidence = 0.3
                arc_quality = None

        else:
            # Use AI for narrative and emotional_arc strategies
            try:
                from src.ai_providers.client import ai_client

                # Build prompt for Claude
                clips_summary = []
                for i, clip in enumerate(clips):
                    clips_summary.append({
                        "index": i,
                        "clip_id": clip.get("clip_id"),
                        "duration": clip.get("duration"),
                        "text_content": clip.get("text_content", "")[:200],  # Truncate for token efficiency
                        "highlight_type": clip.get("highlight_type", ""),
                        "testimonial_id": clip.get("testimonial_id", "")
                    })

                strategy_prompts = {
                    "narrative": "Create a compelling narrative arc that builds from introduction to climax to resolution",
                    "emotional_arc": "Create an emotional journey that engages viewers from curiosity through connection to conviction"
                }

                prompt = f"""You are an expert video editor creating a story video from testimonial clips.

Strategy: {ordering_strategy}
Goal: {strategy_prompts.get(ordering_strategy, "Create an engaging video sequence")}

Brand Context: {brand_context if brand_context else "Not provided"}

Clips to order (total: {len(clips)}):
{chr(10).join([f"{i+1}. [{c['highlight_type']}] {c['duration']:.1f}s - {c['text_content'][:100]}" for i, c in enumerate(clips_summary)])}

Instructions:
1. Analyze the clips and suggest an optimal order (0-indexed positions)
2. Explain your reasoning
3. Rate your confidence (0.0-1.0)

Respond in JSON format:
{{
    "order": [array of clip indices in optimal order],
    "rationale": "brief explanation of ordering logic",
    "confidence": 0.0-1.0
}}"""

                response = ai_client.chat_completion(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    max_tokens=1000
                )

                import json
                try:
                    ai_result = json.loads(response.content)
                    order_indices = ai_result.get("order", list(range(len(clips))))
                    rationale = ai_result.get("rationale", f"AI-ordered using {ordering_strategy} strategy")
                    confidence = float(ai_result.get("confidence", 0.8))

                    # Validate indices
                    if len(order_indices) != len(clips) or set(order_indices) != set(range(len(clips))):
                        logger.warning(f"[{job_id}] Invalid AI ordering, using original order")
                        ordered_clips = clips
                        rationale = f"AI ordering invalid, kept original order. {rationale}"
                        confidence = 0.5
                    else:
                        ordered_clips = [clips[i] for i in order_indices]

                except json.JSONDecodeError:
                    logger.error(f"[{job_id}] Failed to parse AI response, using original order")
                    ordered_clips = clips
                    rationale = "AI response parse failed, kept original order"
                    confidence = 0.5

            except Exception as e:
                logger.error(f"[{job_id}] AI ordering failed: {e}, using original order")
                ordered_clips = clips
                rationale = f"AI ordering error: {str(e)}, kept original order"
                confidence = 0.3

        # Store ordered clips in session
        self.session_manager.store_metadata(job_id, "ordered_clips", ordered_clips)

        logger.info(f"[{job_id}] AI Ordering complete: {rationale} (confidence: {confidence:.2f})")

        # Emit completion event
        try:
            metadata = {
                "ordered_clips": ordered_clips,
                "ordering_rationale": rationale,
                "confidence_score": confidence,
                "total_clips": len(ordered_clips)
            }
            if arc_quality is not None:
                metadata["arc_quality_score"] = arc_quality

            self.progress_publisher.publish_step_progress(
                job_id=session_id,
                step_id="ai_ordering",
                step_name="AI Clip Ordering",
                progress=100,
                message=f"Clips ordered using {ordering_strategy} strategy",
                metadata=metadata
            )
        except Exception as e:
            logger.warning(f"[{job_id}] Failed to emit completion event: {e}")

        result = {
            "ordered_clips": ordered_clips,
            "ordering_rationale": rationale,
            "confidence_score": confidence
        }

        if arc_quality is not None:
            result["arc_quality_score"] = arc_quality

        return result

    def generate_context_card(
        self,
        job_id: str,
        text: str,
        duration: float = 1.2,
        width: int = 1920,
        height: int = 1080
    ) -> str:
        """
        Generate a minimal context card video for semantic gap transitions.

        Args:
            job_id: Job identifier for temp file management
            text: Text to display on the card (e.g., "CUSTOMER SUPPORT")
            duration: Duration of the card in seconds (default 1.2s)
            width: Video width (default 1920)
            height: Video height (default 1080)

        Returns:
            Local path to the generated context card video
        """
        import uuid
        from datetime import datetime

        try:
            # Create output path
            card_id = uuid.uuid4().hex[:8]
            output_filename = f"context_card_{card_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            # Clean and format text elegantly
            clean_text = text.strip()
            # Split into 2 lines if too long for better readability
            if len(clean_text) > 32:
                words = clean_text.split()
                mid = len(words) // 2
                line1 = ' '.join(words[:mid]).upper()
                line2 = ' '.join(words[mid:]).upper()
                if len(line1) > 30:
                    line1 = line1[:27] + "..."
                if len(line2) > 30:
                    line2 = line2[:27] + "..."
            else:
                line1 = clean_text.upper()
                line2 = None

            # Escape text for FFmpeg (escape quotes and colons)
            escaped_line1 = line1.replace("'", "'\\''").replace(":", "\\:")
            escaped_line2 = line2.replace("'", "'\\''").replace(":", "\\:") if line2 else None

            # Modern, clean design with centered box
            box_width = int(width * 0.75)  # 75% of video width
            box_height = 240 if line2 else 180
            box_x = (width - box_width) // 2
            box_y = (height - box_height) // 2

            # Text positions (centered in box)
            y1 = f"(h-text_h)/2" if not line2 else f"(h-text_h)/2-30"
            y2 = f"(h-text_h)/2+40"

            # Build modern card design with box and accent
            text_filter_parts = []

            # 1. Subtle vignette for depth
            text_filter_parts.append("vignette=angle=PI/4")

            # 2. Draw accent bar at top (brand color - subtle blue/purple)
            accent_y = box_y - 8
            text_filter_parts.append(
                f"drawbox=x={box_x}:y={accent_y}:w={box_width}:h=4:color=0x6366f1@0.9:t=fill"
            )

            # 3. Draw semi-transparent box background
            text_filter_parts.append(
                f"drawbox=x={box_x}:y={box_y}:w={box_width}:h={box_height}:"
                f"color=0x1a1a1a@0.85:t=fill"
            )

            # 4. Draw box border (subtle)
            text_filter_parts.append(
                f"drawbox=x={box_x}:y={box_y}:w={box_width}:h={box_height}:"
                f"color=0x404040@0.6:t=2"
            )

            # 5. Line 1: Text with strong shadow for readability
            # Shadow (offset and blurred effect via multiple layers)
            text_filter_parts.append(
                f"drawtext=text='{escaped_line1}':"
                f"fontsize=64:"
                f"fontcolor=0x000000@0.7:"
                f"x=(w-text_w)/2+3:y={y1}+3"
            )
            # Main text (clean white)
            text_filter_parts.append(
                f"drawtext=text='{escaped_line1}':"
                f"fontsize=64:"
                f"fontcolor=0xFFFFFF:"
                f"x=(w-text_w)/2:y={y1}"
            )

            # 6. Line 2 if present (slightly smaller, lighter)
            if line2:
                # Shadow
                text_filter_parts.append(
                    f"drawtext=text='{escaped_line2}':"
                    f"fontsize=56:"
                    f"fontcolor=0x000000@0.7:"
                    f"x=(w-text_w)/2+3:y={y2}+3"
                )
                # Main text (light gray for hierarchy)
                text_filter_parts.append(
                    f"drawtext=text='{escaped_line2}':"
                    f"fontsize=56:"
                    f"fontcolor=0xE5E5E5:"
                    f"x=(w-text_w)/2:y={y2}"
                )

            video_filter = ",".join(text_filter_parts)

            # Generate modern context card
            cmd = [
                "ffmpeg", "-y",
                # Deep dark background with subtle gradient
                "-f", "lavfi", "-i", f"color=c=#0a0a0a:s={width}x{height}:d={duration}",
                # Silent audio
                "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                # Apply elegant filter (vignette + text)
                "-vf", video_filter,
                # High quality encoding for text
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "18",
                "-pix_fmt", "yuv420p",
                "-r", "30",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "44100",
                "-t", str(duration),
                "-movflags", "+faststart",
                output_path
            ]

            result = self.ffmpeg_optimizer.optimize_and_execute(
                cmd, capture_output=True, text=True, timeout=30
            )

            if result.returncode == 0 and os.path.exists(output_path):
                logger.info(f"[{job_id}] Generated context card: {text} ({duration}s)")
                return output_path
            else:
                logger.error(f"[{job_id}] Context card generation failed: {result.stderr}")
                return None

        except Exception as e:
            logger.error(f"[{job_id}] Exception generating context card: {e}")
            return None

    def assemble_draft(
        self,
        job_id: str,
        session_id: str,
        testimonial_id: str,
        clips: List[Dict[str, Any]],
        transition_type: str,
        transition_duration: float,
        upload_intermediate: bool,
        semantic_gaps: List[int] = None
    ) -> Dict[str, Any]:
        """
        Assemble clips into draft story video (wrapper around assemble_story_video).

        Args:
            job_id: Job identifier
            session_id: Processing session ID
            testimonial_id: Primary testimonial ID for tracking
            clips: Ordered clips from AIOrdering (or manual order)
            transition_type: Transition type
            transition_duration: Transition duration in seconds
            upload_intermediate: Upload for preview
            semantic_gaps: List of indices where semantic gaps exist (for context cards)

        Returns:
            {
                "assembled_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float,
                "clips_assembled": int
            }
        """
        logger.info(f"[{job_id}] Assemble Draft: {len(clips)} clips")

        # Store semantic_gaps in clips metadata for later use (if provided)
        if semantic_gaps:
            logger.info(f"[{job_id}] Processing with semantic gaps: {semantic_gaps}")
            if clips:
                clips[0]['_semantic_gaps'] = semantic_gaps

        # Extract local paths from clips metadata
        # CRITICAL: Preserve clip order - iterate in sequence, append in order
        clip_paths = []
        for i, clip in enumerate(clips):
            local_path = None

            # CRITICAL: If clip was normalized, use the normalized path directly
            # Normalized clips have '_is_normalized' flag and updated 'storage_path'
            if clip.get('_is_normalized'):
                local_path = clip.get('storage_path')
                logger.info(f"[{job_id}] Clip {i+1}/{len(clips)}: Using normalized clip at {local_path}")
            else:
                # Try to get cached file first
                local_path = self.session_manager.get_file(job_id, f"clip_{clip.get('clip_id')}")
                if not local_path:
                    # Download from storage_path if needed
                    storage_path = clip.get("storage_path")
                    if storage_path:
                        local_path = self.storage_manager.download_media(storage_path)
                        self.session_manager.store_file(job_id, f"clip_{clip.get('clip_id')}", local_path)

            if local_path:
                clip_paths.append(local_path)
                logger.info(f"[{job_id}] Clip {i+1}/{len(clips)}: {clip.get('clip_id')} - {clip.get('duration', 0):.1f}s")

        if not clip_paths:
            raise Exception("No valid clip paths found for assembly")

        # Check for semantic gaps and insert context cards
        semantic_gaps = []

        # Try to extract semantic_gaps from clips metadata (set by AI ordering)
        if clips and isinstance(clips, list) and len(clips) > 0:
            # Check if first clip has semantic_gaps metadata
            if isinstance(clips[0], dict) and 'semantic_gaps' in clips[0]:
                semantic_gaps = clips[0].get('semantic_gaps', [])
            # Alternative: check for _semantic_gaps in metadata
            elif isinstance(clips[0], dict) and '_semantic_gaps' in clips[0]:
                semantic_gaps = clips[0].get('_semantic_gaps', [])

        if semantic_gaps and len(semantic_gaps) > 0:
            logger.info(f"[{job_id}] Detected semantic gaps at indices: {semantic_gaps}")

            # Insert context cards at gap indices (in reverse order to preserve indices)
            for gap_idx in sorted(semantic_gaps, reverse=True):
                # Gap at index i means insert card AFTER clip i (before clip i+1)
                insert_position = gap_idx + 1

                if insert_position < len(clips):
                    # Get the topic/theme of the NEXT clip after the gap
                    next_clip = clips[insert_position]

                    # Try to get meaningful topic text from various fields
                    # Priority: theme > text excerpt > highlight_type
                    topic = None

                    # 1. Check for explicit theme field
                    if next_clip.get('theme'):
                        topic = next_clip.get('theme')

                    # 2. If no theme, try text excerpt (first meaningful words)
                    elif next_clip.get('text_content'):
                        text = next_clip.get('text_content', '').strip()
                        if text:
                            # Extract first 3-5 words as topic
                            words = text.split()[:5]
                            topic = ' '.join(words)
                            if len(topic) > 40:
                                topic = topic[:37] + '...'

                    # 3. Fallback to highlight_type, but skip if it's generic
                    else:
                        hl_type = next_clip.get('highlight_type', '')
                        if hl_type and hl_type.lower() not in ['general', 'highlight', 'clip', 'moment']:
                            topic = hl_type

                    # Skip card if we don't have meaningful topic
                    if not topic or len(topic.strip()) < 3:
                        logger.info(f"[{job_id}] Skipping context card at {gap_idx} - no meaningful topic found")
                        continue

                    # Clean up topic text for display
                    topic = topic.replace('_', ' ').replace('-', ' ')
                    topic_words = topic.split()
                    topic = ' '.join(word.capitalize() for word in topic_words)

                    # Generate context card
                    card_path = self.generate_context_card(
                        job_id=job_id,
                        text=topic,
                        duration=1.2
                    )

                    if card_path:
                        # Insert card into clip_paths at the correct position
                        clip_paths.insert(insert_position, card_path)
                        logger.info(f"[{job_id}] Inserted context card '{topic}' at position {insert_position}")
                    else:
                        logger.warning(f"[{job_id}] Failed to generate context card for gap at {gap_idx}")

        # CRITICAL: Force no transitions when context cards are present
        # xfade overlaps clips which causes A/V sync issues with silent context cards
        has_context_cards = semantic_gaps and len(semantic_gaps) > 0
        final_transition_type = "none" if has_context_cards else transition_type

        if has_context_cards:
            logger.info(f"[{job_id}] Disabling transitions to maintain A/V sync with {len(semantic_gaps)} context cards")

        # Use existing assemble_story_video method
        result = self.assemble_story_video(
            job_id=job_id,
            testimonial_id=testimonial_id,
            clip_paths=clip_paths,
            transition_type=final_transition_type,
            transition_duration=transition_duration,
            upload_intermediate=upload_intermediate
        )

        # Add clips_assembled count
        result["clips_assembled"] = len(clip_paths)

        # Rename cloud_url to assembled_url for consistency with proto
        if "cloud_url" in result:
            result["assembled_url"] = result.pop("cloud_url")

        return result

    def detect_semantic_gaps(
        self,
        job_id: str,
        clips: List[Dict[str, Any]]
    ) -> List[int]:
        """
        Use AI to intelligently detect semantic gaps in already-ordered clips.

        Args:
            job_id: Job identifier for logging
            clips: List of clip dictionaries in their final order

        Returns:
            List of gap indices (positions where context cards should be inserted)
        """
        semantic_gaps = []
        ai_succeeded = False  # Track if AI actually ran successfully

        if len(clips) <= 1:
            logger.info(f"[{job_id}] Only {len(clips)} clip(s), no gaps needed")
            return semantic_gaps

        try:
            from src.ai_providers.client import ai_client
            import json

            # Build clips summary for AI analysis
            clips_summary = []
            for i, clip in enumerate(clips):
                clips_summary.append({
                    "index": i,
                    "theme": clip.get('highlight_type', 'unknown'),
                    "content": clip.get('text_content', '')[:150],  # Truncate for efficiency
                    "speaker": clip.get('testimonial_id', 'unknown')
                })

            # Check if all clips are from the same speaker (single testimonial story)
            unique_speakers = set(c.get('speaker', '') for c in clips_summary)
            is_single_speaker = len(unique_speakers) == 1

            # Create AI prompt for gap detection (adjusted based on speaker count)
            if is_single_speaker:
                guidelines = """IMPORTANT GUIDELINES FOR SINGLE-SPEAKER STORIES:
- Add context cards when there's a noticeable shift that would help viewer comprehension
- A semantic gap exists when ANY of these occur:
  ✓ MAJOR topic/category change (e.g., "personal background" → "product features" → "results")
  ✓ Time period jump (e.g., "before using product" → "6 months later")
  ✓ Emotional tone shift (e.g., "struggle/problem" → "breakthrough" → "success/celebration")
  ✓ Inconsistent or abrupt transition (clips feel disconnected or jump unexpectedly)
  ✓ Theme change (e.g., "credibility" → "problem solved" → "recommendation")

- DO NOT add gaps for:
  ✗ Minor topic variations within the same theme
  ✗ Natural narrative progression (story flows smoothly)
  ✗ Related points that build on each other
  ✗ Clips that naturally connect without jarring transitions

KEY: Ask yourself "Would a viewer be confused by this transition?" If YES → add gap. If NO → skip gap.

For a {len(clips)}-clip single-speaker story, expect 0-{max(1, len(clips)//2)} gaps."""
            else:
                guidelines = """IMPORTANT GUIDELINES FOR MULTI-SPEAKER STORIES:
- Context cards help viewers understand speaker changes and topic shifts
- A semantic gap exists when:
  ✓ Speaker changes (different testimonial_id)
  ✓ Major topic/theme changes (e.g., "product features" → "customer support")
  ✓ Emotional tone shifts (e.g., "problem" → "solution")
  ✓ Inconsistent or abrupt transitions

For a {len(clips)}-clip multi-speaker story, expect 1-{max(1, len(clips)//2)} gaps."""

            prompt = f"""Analyze these {len(clips)} video clips that are ALREADY in optimal order.
Your task: Identify positions where a brief context card (1-2 seconds) would help viewers transition between clips.

Clips (in current order):
{chr(10).join([f"{i}. [{c['theme']}] Speaker: {c['speaker'][:20]} | {c['content'][:100]}..." for i, c in enumerate(clips_summary)])}

{guidelines}

Respond with ONLY a JSON array of gap indices (positions AFTER which to insert a context card):
{{"gaps": [index1, index2, ...]}}

Example: {{"gaps": [0, 2]}} means insert context card after clip 0 and after clip 2.
If no gaps are needed, return: {{"gaps": []}}"""

            response = ai_client.chat_completion(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,  # Balanced temp for detecting genuine tone shifts while avoiding over-detection
                max_tokens=400
            )

            # Parse AI response
            try:
                # Log raw response for debugging
                raw_content = response.content.strip()
                logger.debug(f"[{job_id}] AI raw response: {raw_content[:200]}")

                # Try multiple extraction methods
                json_content = None

                # Method 1: Try to extract JSON if wrapped in markdown code blocks
                if "```" in raw_content:
                    lines = raw_content.split('\n')
                    json_lines = []
                    in_code_block = False
                    for line in lines:
                        if line.startswith("```"):
                            in_code_block = not in_code_block
                            continue
                        if in_code_block:
                            json_lines.append(line)
                    if json_lines:
                        json_content = '\n'.join(json_lines).strip()
                        logger.debug(f"[{job_id}] Extracted JSON from markdown code block")

                # Method 2: Try regex to find JSON pattern {"gaps": [...]}
                if not json_content:
                    import re
                    json_match = re.search(r'\{["\']gaps["\']\s*:\s*\[[^\]]*\]\s*\}', raw_content)
                    if json_match:
                        json_content = json_match.group(0)
                        logger.debug(f"[{job_id}] Extracted JSON using regex pattern match")

                # Method 3: Try direct parsing if no extraction worked
                if not json_content:
                    json_content = raw_content
                    logger.debug(f"[{job_id}] Attempting direct JSON parse of full response")

                result = json.loads(json_content)
                semantic_gaps = result.get('gaps', [])

                # Validate gap indices
                semantic_gaps = [g for g in semantic_gaps if isinstance(g, int) and 0 <= g < len(clips) - 1]

                ai_succeeded = True  # AI ran successfully

                if semantic_gaps:
                    logger.info(f"[{job_id}] AI detected {len(semantic_gaps)} semantic gaps at positions: {semantic_gaps}")
                else:
                    logger.info(f"[{job_id}] AI determined no semantic gaps needed - clips flow smoothly")

            except json.JSONDecodeError as e:
                logger.warning(f"[{job_id}] Failed to parse AI gap response: {e}. Raw response: {response.content[:300]}")
                semantic_gaps = []
                ai_succeeded = False

        except Exception as e:
            logger.warning(f"[{job_id}] AI gap detection failed, using fallback: {e}")
            semantic_gaps = []
            ai_succeeded = False

        # Fallback: ONLY use heuristic if AI actually failed (not if AI said "no gaps")
        if not ai_succeeded and not semantic_gaps and len(clips) > 1:
            logger.info(f"[{job_id}] Using fallback heuristic (speaker changes only)")
            for i in range(len(clips) - 1):
                current_speaker = clips[i].get('testimonial_id', '')
                next_speaker = clips[i + 1].get('testimonial_id', '')

                if current_speaker != next_speaker and current_speaker and next_speaker:
                    semantic_gaps.append(i)
                    logger.info(f"[{job_id}] Gap at position {i}: speaker change")

        if semantic_gaps:
            logger.info(f"[{job_id}] Total semantic gaps detected: {len(semantic_gaps)} at indices {semantic_gaps}")
        else:
            logger.info(f"[{job_id}] No semantic gaps detected between {len(clips)} clips")

        return semantic_gaps

    def collect_and_assemble_clips(
        self,
        job_id: str,
        session_id: str,
        workspace_id: str,
        testimonial_segments: List[Any],  # List of TestimonialSegment protos
        existing_clips: List[Dict[str, Any]],  # List of already-extracted ClipInfo dicts
        transition_type: str,
        transition_duration: float,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Collect clips for story video - extracts new clips from testimonials OR uses existing clips.

        Based on story_generator._process_segments and _process_disparate_segments logic.

        Args:
            job_id: Job identifier
            session_id: Processing session ID
            workspace_id: Workspace ID
            testimonial_segments: Testimonials with highlights to extract (Option 1)
            existing_clips: Already-extracted clips with metadata (Option 2)
            transition_type: Transition type
            transition_duration: Transition duration in seconds
            upload_intermediate: True = upload clips to cloud for preview

        Returns:
            {
                "assembled_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float,
                "clips_assembled": int
            }
        """
        collection_result = self.collect_clips(
            job_id=job_id,
            session_id=session_id,
            workspace_id=workspace_id,
            testimonial_segments=testimonial_segments,
            existing_clips=existing_clips,
            upload_intermediate=False
        )

        clips = collection_result.get("clips", [])
        total_duration = collection_result.get("total_duration", 0.0)
        total_clips = collection_result.get("total_clips", 0)
        logger.info(f"[{job_id}] Collected {total_clips} clips, total duration: {total_duration:.2f}s")

        # CRITICAL: Normalize all clips to same resolution before assembly
        # This prevents the FFmpeg xfade error: "First input link main parameters (size 480x270)
        # do not match the corresponding second input link xfade parameters (size 1280x720)"
        if len(clips) > 0:
            logger.info(f"[{job_id}] Normalizing {len(clips)} clips to consistent resolution...")

            # Format clips as video segments for normalizer
            video_segments = [{"media_url": clip.get("storage_path")} for clip in clips]

            # Intelligently choose target profile based on config or use default
            # This minimizes upscaling and preserves quality
            target_profile = "default"  # Default to 1920x1080 (1080p)

            # Check if user specified a target platform in config
            # This allows platform-specific optimization (e.g., 1080x1920 for TikTok/Instagram Stories)
            config = {}  # Get config from step context if available
            if config and "target_platform" in config:
                platform = config.get("target_platform")
                target_profile = self.video_normalizer.get_recommended_profile_for_platform(platform)
                logger.info(f"[{job_id}] Using platform-specific profile: {platform} → {target_profile}")

            # Use VideoResolutionNormalizer with intelligent profile selection
            # The normalizer will automatically choose between crop/pad based on input diversity
            normalized_segments = self.video_normalizer.normalize_video_resolutions_for_story(
                video_segments=video_segments,
                target_profile=target_profile,
                temp_files=None
            )

            # Update clips with normalized paths
            for i, (clip, normalized_segment) in enumerate(zip(clips, normalized_segments)):
                if normalized_segment.get('_is_normalized'):
                    clips[i]['storage_path'] = normalized_segment['media_url']
                    clips[i]['_is_normalized'] = True
                    logger.info(f"[{job_id}] Clip {i}: normalized to {normalized_segment.get('_normalization_profile', {}).get('width')}x{normalized_segment.get('_normalization_profile', {}).get('height')}")

            logger.info(f"[{job_id}] All clips normalized successfully")

        # Detect semantic gaps using AI
        semantic_gaps = self.detect_semantic_gaps(job_id, clips)

        assembly_result = self.assemble_draft(
            job_id=job_id,
            session_id=session_id,
            testimonial_id="assembled_story",
            clips=clips,
            transition_type=transition_type or "fade",
            transition_duration=transition_duration or 0.2,
            upload_intermediate=upload_intermediate,
            semantic_gaps=semantic_gaps  # Pass detected gaps to assembly
        )

        return assembly_result

    def _assemble_with_variable_transitions(
        self,
        job_id: str,
        testimonial_id: str,
        clip_paths: List[str],
        recommendations: List[Any],  # List[TransitionRecommendation]
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Assemble clips with variable transitions (different transition between each clip pair).

        This is more complex than uniform transitions - we need to encode each clip pair
        individually and then concatenate them.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            clip_paths: List of local clip paths
            recommendations: List of TransitionRecommendation
            upload_intermediate: Upload for preview

        Returns:
            Assembly result dict
        """
        logger.info(f"[{job_id}] Assembling {len(clip_paths)} clips with {len(recommendations)} variable transitions")

        # For now, use the most common transition type as uniform
        # Full variable transition support requires complex FFmpeg filter chains
        # TODO: Implement true variable transitions in future enhancement

        transition_types = [rec.transition_type for rec in recommendations]
        transition_durations = [rec.duration for rec in recommendations]

        # Use most common transition type
        from collections import Counter
        most_common_type = Counter(transition_types).most_common(1)[0][0]
        avg_duration = sum(transition_durations) / len(transition_durations)

        logger.info(f"[{job_id}] Using uniform transition approximation: {most_common_type} ({avg_duration:.2f}s)")
        logger.warning(f"[{job_id}] Full variable transitions not yet implemented - using uniform approximation")

        # Fall back to uniform transition for now
        return self.assemble_story_video(
            job_id=job_id,
            testimonial_id=testimonial_id,
            clip_paths=clip_paths,
            transition_type=most_common_type,
            transition_duration=avg_duration,
            upload_intermediate=upload_intermediate
        )

    def _create_intro_outro_clip(
        self,
        job_id: str,
        clip_type: str,
        content_type: str,
        content: str,
        width: int,
        height: int
    ) -> str:
        """
        Create intro or outro clip from text, image, or video (FFmpeg 7.1.1).

        Returns:
            Local path to created clip
        """
        output_filename = f"{clip_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)

        if content_type == "text":
            # Create text slide with lavfi (3 seconds) - FFmpeg 7.1.1 syntax
            # Escape text for drawtext filter
            escaped_text = content.replace("'", "\\'").replace(":", "\\:")

            cmd = [
                "ffmpeg",
                "-f", "lavfi",
                "-i", f"color=c=black:s={width}x{height}:r=30:d=3",
                "-f", "lavfi",
                "-i", "anullsrc=r=48000:cl=stereo",
                "-vf", f"drawtext=text='{escaped_text}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2:fontfile=/System/Library/Fonts/Helvetica.ttc",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-t", "3",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "48000",
                "-shortest",
                "-y", output_path
            ]

        elif content_type == "image":
            # Download image and create 3-second video with silent audio
            image_path = self.storage_manager.download_media(content)

            cmd = [
                "ffmpeg",
                "-loop", "1",
                "-i", image_path,
                "-f", "lavfi",
                "-i", "anullsrc=r=48000:cl=stereo",
                "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:-1:-1:color=black",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-t", "3",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "48000",
                "-shortest",
                "-y", output_path
            ]

        elif content_type == "video":
            # Download video and normalize to match main video resolution
            video_path = self.storage_manager.download_media(content)

            cmd = [
                "ffmpeg",
                "-i", video_path,
                "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,pad={width}:{height}:-1:-1:color=black",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "128k",
                "-ar", "48000",
                "-movflags", "+faststart",
                "-y", output_path
            ]

        else:
            raise ValueError(f"Unsupported intro/outro content type: {content_type}")

        result = self.ffmpeg_optimizer.optimize_and_execute(cmd, timeout=300)

        if result.returncode != 0:
            raise Exception(f"FFmpeg {clip_type} creation failed: {result.stderr}")

        return output_path

    def calculate_performance_readiness(
        self,
        job_id: str,
        video_path: str,
        target_platform: str = "instagram",
        quality_metrics: Optional[Dict[str, Any]] = None,
        hook_analysis: Optional[Dict[str, Any]] = None,
        arc_analysis: Optional[Dict[str, Any]] = None,
        transition_quality: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate performance readiness score for assembled video.

        This provides an honest assessment of how well the video follows
        platform best practices, NOT a prediction of exact metrics.

        Args:
            job_id: Job identifier
            video_path: Path to assembled video
            target_platform: Target platform
            quality_metrics: Optional quality metrics from VideoQualityScorer
            hook_analysis: Optional hook analysis from HookDetector
            arc_analysis: Optional arc analysis from EmotionalArcAnalyzer
            transition_quality: Optional transition quality info

        Returns:
            {
                "overall_score": float (0-100),
                "confidence_level": str,
                "readiness_tier": str,
                "factors": List[dict],
                "strengths": List[str],
                "improvements": List[str],
                "platform_alignment": Dict[str, float],
                "predicted_performance": str,
                "summary": str
            }
        """
        logger.info(f"[{job_id}] Calculating performance readiness for {target_platform}")

        # Extract video metadata
        video_metadata = self._extract_video_metadata(video_path)

        # Add contextual flags
        video_metadata["has_captions"] = True  # Assume true if caption step was run
        video_metadata["has_branding"] = False  # Can be set if branding step was run
        video_metadata["has_music"] = False  # Can be set if music step was run
        video_metadata["noise_removed"] = False  # Can be set if noise removal was run

        # Calculate readiness score
        readiness_score = self.performance_scorer.score_video_readiness(
            video_metadata=video_metadata,
            target_platform=target_platform,
            quality_metrics=quality_metrics,
            hook_analysis=hook_analysis,
            arc_analysis=arc_analysis,
            transition_quality=transition_quality
        )

        # Log report
        report = self.performance_scorer.get_performance_report(readiness_score)
        logger.info(f"[{job_id}] Performance Readiness Report:\n{report}")

        # Convert to dict for JSON serialization
        return {
            "overall_score": readiness_score.overall_score,
            "confidence_level": readiness_score.confidence_level,
            "readiness_tier": readiness_score.readiness_tier,
            "factors": [
                {
                    "name": f.name,
                    "score": f.score,
                    "weight": f.weight,
                    "status": f.status,
                    "recommendation": f.recommendation
                }
                for f in readiness_score.factors
            ],
            "strengths": readiness_score.strengths,
            "improvements": readiness_score.improvements,
            "platform_alignment": readiness_score.platform_alignment,
            "predicted_performance": readiness_score.predicted_performance,
            "summary": readiness_score.summary
        }

    def _extract_video_metadata(self, video_path: str) -> Dict[str, Any]:
        """Extract metadata from video file"""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height,duration,bit_rate,r_frame_rate",
            "-of", "json",
            video_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if result.returncode != 0:
            logger.warning(f"FFprobe failed: {result.stderr}")
            return {"duration": 0, "width": 0, "height": 0}

        data = json.loads(result.stdout)
        stream = data.get("streams", [{}])[0]

        width = int(stream.get("width", 0))
        height = int(stream.get("height", 0))
        duration = float(stream.get("duration", 0))

        # Calculate aspect ratio
        if width > 0 and height > 0:
            if abs(width / height - 16/9) < 0.1:
                aspect_ratio = "16:9"
            elif abs(width / height - 9/16) < 0.1:
                aspect_ratio = "9:16"
            elif abs(width / height - 1) < 0.1:
                aspect_ratio = "1:1"
            elif abs(width / height - 4/5) < 0.1:
                aspect_ratio = "4:5"
            else:
                aspect_ratio = f"{width}:{height}"
        else:
            aspect_ratio = "unknown"

        return {
            "duration": duration,
            "width": width,
            "height": height,
            "aspect_ratio": aspect_ratio,
            "file_size": os.path.getsize(video_path) / (1024 * 1024)  # MB
        }

    def calculate_competitive_benchmark(
        self,
        job_id: str,
        video_path: str,
        industry: str = "default",
        quality_metrics: Optional[Dict[str, Any]] = None,
        hook_analysis: Optional[Dict[str, Any]] = None,
        arc_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate competitive benchmarking and industry insights.

        This provides context about how the video compares to industry standards
        and identifies content trends to adopt.

        Args:
            job_id: Job identifier
            video_path: Path to video file
            industry: Industry/vertical (saas, ecommerce, b2b_services, etc.)
            quality_metrics: Optional quality metrics
            hook_analysis: Optional hook analysis
            arc_analysis: Optional emotional arc analysis

        Returns:
            {
                "industry": str,
                "overall_competitive_score": float,
                "competitive_position": str,
                "benchmarks": List[dict],
                "content_trends": List[dict],
                "key_advantages": List[str],
                "improvement_opportunities": List[str],
                "industry_insights": List[str],
                "summary": str
            }
        """
        logger.info(f"[{job_id}] Calculating competitive benchmark for industry: {industry}")

        # Extract video metadata
        video_metadata = self._extract_video_metadata(video_path)

        # Add contextual flags
        video_metadata["has_captions"] = True
        video_metadata["has_branding"] = False
        video_metadata["platform_optimized"] = True

        # Calculate competitive benchmark
        benchmark = self.competitive_benchmarker.analyze_competitive_position(
            video_metadata=video_metadata,
            quality_metrics=quality_metrics,
            hook_analysis=hook_analysis,
            arc_analysis=arc_analysis,
            industry=industry
        )

        logger.info(f"[{job_id}] Competitive Position: {benchmark.competitive_position}")
        logger.info(f"[{job_id}] Overall Score: {benchmark.overall_competitive_score}/100")

        # Convert to dict for JSON serialization
        return {
            "industry": benchmark.industry,
            "overall_competitive_score": benchmark.overall_competitive_score,
            "competitive_position": benchmark.competitive_position,
            "benchmarks": [
                {
                    "metric": b.metric,
                    "industry_average": b.industry_average,
                    "top_performers": b.top_performers,
                    "your_score": b.your_score,
                    "percentile_rank": b.percentile_rank,
                    "status": b.status
                }
                for b in benchmark.benchmarks
            ],
            "content_trends": [
                {
                    "trend_name": t.trend_name,
                    "description": t.description,
                    "adoption_rate": t.adoption_rate,
                    "effectiveness_score": t.effectiveness_score,
                    "applies_to_your_content": t.applies_to_your_content,
                    "recommendation": t.recommendation
                }
                for t in benchmark.content_trends
            ],
            "key_advantages": benchmark.key_advantages,
            "improvement_opportunities": benchmark.improvement_opportunities,
            "industry_insights": benchmark.industry_insights,
            "summary": benchmark.summary
        }

    def generate_ab_test_variants(
        self,
        job_id: str,
        test_objective: str,
        current_config: Dict[str, Any],
        target_platform: str = "instagram"
    ) -> Dict[str, Any]:
        """
        Generate A/B test plan with variant configurations.

        This provides strategic test plans to optimize specific aspects
        of testimonial videos (hook, pacing, structure, etc.).

        Args:
            job_id: Job identifier
            test_objective: What to test (hook_effectiveness, pacing_optimization, etc.)
            current_config: Current video configuration (baseline)
            target_platform: Target platform

        Returns:
            {
                "test_id": str,
                "test_name": str,
                "test_objective": str,
                "control_config": dict,
                "variants": List[dict],
                "recommended_variant": str,
                "metrics_to_track": List[str],
                "test_duration_recommendation": str,
                "sample_size_recommendation": int
            }
        """
        logger.info(f"[{job_id}] Generating A/B test plan for: {test_objective}")

        # Generate test plan
        test_plan = self.ab_test_generator.generate_ab_test_plan(
            test_objective=test_objective,
            baseline_config=current_config,
            platform=target_platform,
            num_variants=3
        )

        # Log summary
        summary = self.ab_test_generator.get_variant_summary(test_plan)
        logger.info(f"[{job_id}] A/B Test Plan:\n{summary}")

        # Convert to dict for JSON serialization
        return {
            "test_id": test_plan.test_id,
            "test_name": test_plan.test_name,
            "test_objective": test_plan.test_objective,
            "control_config": test_plan.control_config,
            "variants": [
                {
                    "variant_id": v.variant_id,
                    "variant_name": v.variant_name,
                    "description": v.description,
                    "test_hypothesis": v.test_hypothesis,
                    "modifications": v.modifications,
                    "expected_impact": v.expected_impact
                }
                for v in test_plan.variants
            ],
            "recommended_variant": test_plan.recommended_variant,
            "metrics_to_track": test_plan.metrics_to_track,
            "test_duration_recommendation": test_plan.test_duration_recommendation,
            "sample_size_recommendation": test_plan.sample_size_recommendation
        }

    def generate_all_ab_tests(
        self,
        job_id: str,
        current_config: Dict[str, Any],
        target_platform: str = "instagram"
    ) -> List[Dict[str, Any]]:
        """
        Generate complete A/B testing roadmap with all available test strategies.

        Args:
            job_id: Job identifier
            current_config: Current configuration
            target_platform: Target platform

        Returns:
            List of test plans, prioritized by platform
        """
        logger.info(f"[{job_id}] Generating complete A/B testing roadmap")

        # Generate all test plans
        all_plans = self.ab_test_generator.generate_all_test_plans(
            baseline_config=current_config,
            platform=target_platform
        )

        logger.info(f"[{job_id}] Generated {len(all_plans)} test plans")

        # Convert to dicts
        return [
            {
                "test_id": plan.test_id,
                "test_name": plan.test_name,
                "test_objective": plan.test_objective,
                "control_config": plan.control_config,
                "variants": [
                    {
                        "variant_id": v.variant_id,
                        "variant_name": v.variant_name,
                        "description": v.description,
                        "test_hypothesis": v.test_hypothesis,
                        "modifications": v.modifications,
                        "expected_impact": v.expected_impact
                    }
                    for v in plan.variants
                ],
                "recommended_variant": plan.recommended_variant,
                "metrics_to_track": plan.metrics_to_track,
                "test_duration_recommendation": plan.test_duration_recommendation,
                "sample_size_recommendation": plan.sample_size_recommendation,
                "priority": idx + 1
            }
            for idx, plan in enumerate(all_plans)
        ]

    def get_interactive_suggestions(
        self,
        job_id: str,
        step_name: str,
        testimonial_id: str,
        platform: str,
        video_path: Optional[str] = None,
        previous_steps: Optional[List[str]] = None,
        quality_metrics: Optional[Dict[str, Any]] = None,
        hook_analysis: Optional[Dict[str, Any]] = None,
        arc_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate interactive AI suggestions for current processing step.

        Returns contextual recommendations to help users make better decisions.

        Args:
            job_id: Job identifier
            step_name: Current step (crop_resize, enhance, assemble, etc.)
            testimonial_id: Testimonial ID
            platform: Target platform
            video_path: Optional path to video file
            previous_steps: List of completed step names
            quality_metrics: Optional quality metrics
            hook_analysis: Optional hook analysis
            arc_analysis: Optional arc analysis

        Returns:
            {
                "suggestions": List[dict],
                "summary": dict
            }
        """
        logger.info(f"[{job_id}] Generating suggestions for step: {step_name}")

        # Extract video metadata if video_path provided
        video_metadata = {}
        duration = 0
        if video_path:
            video_metadata = self._extract_video_metadata(video_path)
            duration = video_metadata.get("duration", 0)

        # Create context
        context = SuggestionContext(
            step_name=step_name,
            testimonial_id=testimonial_id,
            platform=platform,
            duration=duration,
            video_metadata=video_metadata,
            previous_steps=previous_steps or [],
            quality_metrics=quality_metrics,
            hook_analysis=hook_analysis,
            arc_analysis=arc_analysis
        )

        # Generate suggestions
        suggestions = self.suggestion_engine.get_suggestions_for_step(context)

        # Get summary
        summary = self.suggestion_engine.get_suggestion_summary(suggestions)

        logger.info(f"[{job_id}] Generated {len(suggestions)} suggestions")

        # Convert to dicts
        return {
            "suggestions": [
                {
                    "suggestion_id": s.suggestion_id,
                    "type": s.type,
                    "priority": s.priority,
                    "title": s.title,
                    "message": s.message,
                    "action_label": s.action_label,
                    "action_type": s.action_type,
                    "action_params": s.action_params,
                    "dismissible": s.dismissible,
                    "context": s.context
                }
                for s in suggestions
            ],
            "summary": summary
        }
