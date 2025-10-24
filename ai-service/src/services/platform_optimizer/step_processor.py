# src/services/platform_optimizer/step_processor.py

import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime

from src.utils.storage import StorageManager
from src.utils.session_manager import get_session_manager
from src.utils.ffmpeg_optimizer import FFmpegOptimizer
from src.services.shared.noise_service import NoiseService
from src.utils.music_mixer import MusicMixer
from src.services.shared.caption_generator import CaptionGenerator
from src.services.shared.visual_overlay import VisualOverlay
from src.services.shared.audio_normalizer import AudioNormalizer
from src.services.enhancement.enhancer import MediaEnhancer
from src.utils.progress_publisher import get_progress_publisher
from src.utils.parallel_executor import get_parallel_executor, ParallelTask
from src.services.quality import VideoQualityScorer
from src.utils.job_cancellation_manager import job_checker
from .platform_encoding_specs import PlatformEncodingSpecs

logger = logging.getLogger(__name__)


class PlatformOptimizerStepProcessor:
    """
    Step-by-step platform optimization processor with dual-mode support.

    Modes:
    - Interactive (upload_intermediate=True): Upload after each step for preview
    - Batch (upload_intermediate=False): Process with feedback, upload only at end

    Session caching: Reuses container files within TTL to avoid repeated downloads.
    """

    def __init__(self):
        self._storage_manager = None
        self._session_manager = None
        self._ffmpeg_optimizer = None
        self._noise_service = None
        self._music_mixer = None
        self._caption_generator = None
        self._visual_overlay = None
        self._audio_normalizer = None
        self._media_enhancer = None
        self._progress_publisher = None
        self._quality_scorer = None

        logger.info("PlatformOptimizerStepProcessor initialized")

    # Lazy loading properties
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
    def noise_service(self) -> NoiseService:
        if self._noise_service is None:
            self._noise_service = NoiseService()
        return self._noise_service

    @property
    def music_mixer(self) -> MusicMixer:
        if self._music_mixer is None:
            self._music_mixer = MusicMixer()
        return self._music_mixer

    @property
    def caption_generator(self) -> CaptionGenerator:
        if self._caption_generator is None:
            self._caption_generator = CaptionGenerator()
        return self._caption_generator

    @property
    def visual_overlay(self) -> VisualOverlay:
        if self._visual_overlay is None:
            self._visual_overlay = VisualOverlay()
        return self._visual_overlay

    @property
    def audio_normalizer(self) -> AudioNormalizer:
        if self._audio_normalizer is None:
            self._audio_normalizer = AudioNormalizer()
        return self._audio_normalizer

    @property
    def media_enhancer(self) -> MediaEnhancer:
        if self._media_enhancer is None:
            self._media_enhancer = MediaEnhancer()
        return self._media_enhancer

    @property
    def progress_publisher(self):
        if self._progress_publisher is None:
            self._progress_publisher = get_progress_publisher()
        return self._progress_publisher

    @property
    def parallel_executor(self):
        """Get parallel executor for safe parallel operations"""
        return get_parallel_executor()

    @property
    def quality_scorer(self) -> VideoQualityScorer:
        """Get quality scorer for before/after metrics"""
        if self._quality_scorer is None:
            self._quality_scorer = VideoQualityScorer()
        return self._quality_scorer

    def _generate_fast_preview(
        self,
        job_id: str,
        step_id: str,
        step_name: str,
        input_path: str,
        crop_filter: Optional[str] = None,
        testimonial_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate 480p low-resolution preview for fast feedback (<5 seconds).

        Args:
            job_id: Job identifier
            step_id: Step identifier (e.g., "crop_resize")
            step_name: Display name (e.g., "Crop & Resize")
            input_path: Source video path
            crop_filter: Optional crop filter to apply (e.g., "crop=720:1280:100:0")
            testimonial_id: Testimonial ID for storage path

        Returns:
            Cloud URL of preview or None if preview generation failed
        """
        try:
            # Prepare preview output path
            preview_filename = f"preview_{step_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            preview_path = os.path.join(self.session_manager.base_path, job_id, preview_filename)
            os.makedirs(os.path.dirname(preview_path), exist_ok=True)

            # Build FFmpeg command for fast 480p preview
            cmd = ["ffmpeg", "-i", input_path]

            # Apply filters if needed
            filters = []
            if crop_filter:
                filters.append(crop_filter)
            filters.append("scale=-2:480")  # 480p, maintain aspect ratio

            cmd.extend([
                "-vf", ",".join(filters),
                "-c:v", "libx264",
                "-preset", "ultrafast",  # Fastest encoding
                "-crf", "28",            # Lower quality OK for preview
                "-c:a", "aac",
                "-b:a", "96k",
                "-movflags", "+faststart",
                "-y", preview_path
            ])

            logger.info(f"[{job_id}] Generating fast preview for {step_id}...")

            # Execute with 10s timeout
            import subprocess
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode != 0:
                logger.warning(f"[{job_id}] Fast preview generation failed: {result.stderr}")
                return None

            # Upload preview to temp storage
            preview_url = self.storage_manager.upload_to_storage(
                local_path=preview_path,
                object_name=f"temp/{testimonial_id or 'preview'}/{job_id}/{step_id}/{preview_filename}"
            )

            logger.info(f"[{job_id}] Fast preview ready: {preview_url}")

            # Emit preview_ready event
            video_info = self.storage_manager.get_video_info(preview_path)
            self.progress_publisher.publish_preview_ready(
                job_id=job_id,
                step_id=step_id,
                step_name=step_name,
                preview_url=preview_url,
                preview_type="video",
                width=video_info.get("width"),
                height=video_info.get("height"),
                duration=video_info.get("duration"),
                metadata={"quality": "preview", "resolution": "480p"}
            )

            # Clean up local preview file after upload
            if os.path.exists(preview_path):
                os.unlink(preview_path)

            return preview_url

        except Exception as e:
            logger.warning(f"[{job_id}] Fast preview generation error: {e}")
            return None

    def _get_input_file(self, job_id: str, media_url: str) -> str:
        """
        Get input file from session cache or download.

        Returns:
            Local file path
        """
        # Check session cache first
        cached_file = self.session_manager.get_latest_file(job_id)
        if cached_file:
            logger.info(f"Using cached file for job {job_id}: {cached_file}")
            return cached_file

        # Download from cloud storage
        logger.info(f"Downloading media for job {job_id} from {media_url}")
        local_path = self.storage_manager.download_media(media_url)

        # Store in session for future steps
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
        """
        Handle step output: upload to cloud (if interactive) or keep in session (if batch).

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float
            }
        """
        # Store in session cache for next step
        self.session_manager.store_file(job_id, step_name, output_path)

        # Get video metadata
        video_info = self.storage_manager.get_video_info(output_path)
        duration = video_info.get("duration", 0)
        size = os.path.getsize(output_path) / (1024 * 1024)  # MB

        result = {
            "local_path": output_path,
            "duration": duration,
            "size": size
        }

        # Upload to cloud if interactive mode
        if upload_intermediate:
            cloud_path = f"temp/{testimonial_id}/{job_id}/{step_name}/{os.path.basename(output_path)}"
            cloud_url = self.storage_manager.upload_file_with_retry(output_path, cloud_path)
            result["cloud_url"] = cloud_url
            logger.info(f"Uploaded {step_name} to cloud: {cloud_url}")
        else:
            result["cloud_url"] = None
            logger.info(f"Batch mode: keeping {step_name} in container: {output_path}")

        return result

    def crop_resize(
        self,
        job_id: str,
        testimonial_id: str,
        media_url: str,
        aspect_ratio: str,
        target_platform: str,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Crop and resize video to target aspect ratio.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            media_url: Source media URL
            aspect_ratio: Target aspect ratio (e.g., "9:16", "1:1", "16:9")
            target_platform: Platform name (instagram, tiktok, youtube, etc.)
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "aspect_ratio": str,
                "duration": float,
                "size": float
            }
        """
        # Check for cancellation
        if job_checker.check_cancellation(job_id):
            logger.info(f"[{job_id}] Crop/Resize cancelled")
            raise Exception("Job was cancelled")

        logger.info(f"[{job_id}] Crop/Resize: {aspect_ratio} for {target_platform}")

        # PROGRESS: 0% - Starting
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="crop_resize",
            step_name="Crop & Resize",
            progress=0,
            message="Starting crop and resize..."
        )

        # Get input file (from cache or download)
        input_file = self._get_input_file(job_id, media_url)

        # PROGRESS: 25% - Input file ready
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="crop_resize",
            step_name="Crop & Resize",
            progress=25,
            message="Analyzing video..."
        )

        # Prepare output path
        output_filename = f"cropped_{aspect_ratio.replace(':', 'x')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Parse aspect ratio
        w, h = map(int, aspect_ratio.split(':'))
        target_ratio = w / h

        # Get video info
        video_info = self.storage_manager.get_video_info(input_file)

        input_width = video_info.get("width", 1920)
        input_height = video_info.get("height", 1080)
        input_ratio = input_width / input_height

        # Determine crop strategy
        # PROGRESS: 50% - Processing
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="crop_resize",
            step_name="Crop & Resize",
            progress=50,
            message="Applying crop transformation..."
        )

        if abs(input_ratio - target_ratio) < 0.01:
            # Already correct ratio, just copy
            logger.info(f"Video already has correct aspect ratio {aspect_ratio}")

            # IMPROVEMENT #9: Generate fast preview even when no crop needed
            if upload_intermediate:
                self._generate_fast_preview(
                    job_id=job_id,
                    step_id="crop_resize",
                    step_name="Crop & Resize",
                    input_path=input_file,
                    crop_filter=None,  # No crop needed
                    testimonial_id=testimonial_id
                )

            import shutil
            shutil.copy2(input_file, output_path)
        else:
            # Need to crop
            if input_ratio > target_ratio:
                # Video is wider, crop width
                new_width = int(input_height * target_ratio)
                new_height = input_height
                crop_x = (input_width - new_width) // 2
                crop_y = 0
            else:
                # Video is taller, crop height
                new_width = input_width
                new_height = int(input_width / target_ratio)
                crop_x = 0
                crop_y = (input_height - new_height) // 2

            # IMPROVEMENT #8: Generate preview in parallel with full processing
            # This is SAFE because:
            # - Preview and full processing use SAME input (read-only)
            # - Preview and full processing write to DIFFERENT output files
            # - No shared mutable state
            crop_filter = f"crop={new_width}:{new_height}:{crop_x}:{crop_y}"

            if upload_intermediate:
                # PARALLEL EXECUTION: Preview generation + Full processing
                # Run both simultaneously to reduce total wait time

                preview_task = ParallelTask(
                    task_id="preview_gen",
                    task_name="Generate Preview",
                    function=self._generate_fast_preview,
                    kwargs={
                        "job_id": job_id,
                        "step_id": "crop_resize",
                        "step_name": "Crop & Resize",
                        "input_path": input_file,
                        "crop_filter": crop_filter,
                        "testimonial_id": testimonial_id
                    },
                    priority=5  # Lower priority than main processing
                )

                def execute_full_crop():
                    """Execute full-resolution crop with platform-specific encoding"""
                    # Build platform-specific encoding parameters
                    video_params = PlatformEncodingSpecs.build_ffmpeg_video_params(target_platform)
                    audio_params = PlatformEncodingSpecs.build_ffmpeg_audio_params(target_platform)

                    cmd = [
                        "ffmpeg", "-i", input_file,
                        "-vf", crop_filter,
                    ]

                    # Add platform-specific video encoding
                    cmd.extend(video_params)

                    # Add platform-specific audio encoding
                    cmd.extend(audio_params)

                    # Output file
                    cmd.extend(["-y", output_path])

                    logger.info(f"[{job_id}] Using platform-specific encoding for {target_platform}")
                    return self.ffmpeg_optimizer.optimize_and_execute(cmd, video_info=video_info, timeout=600)

                full_task = ParallelTask(
                    task_id="full_crop",
                    task_name="Full Resolution Crop",
                    function=execute_full_crop,
                    priority=10  # Higher priority
                )

                # Execute both in parallel
                logger.info(f"[{job_id}] Running preview + full crop in parallel")
                results = self.parallel_executor.execute_parallel([preview_task, full_task])

                # Check full processing result
                full_result = results.get("full_crop")
                if not full_result or not full_result.success:
                    raise Exception(f"FFmpeg crop failed: {full_result.error if full_result else 'Unknown error'}")

                result = full_result.result

                if result.returncode != 0:
                    raise Exception(f"FFmpeg crop failed: {result.stderr}")

                # Preview task runs in background, will emit SSE when ready

            else:
                # Batch mode: no preview, just full processing (sequential)
                # Build platform-specific encoding parameters
                video_params = PlatformEncodingSpecs.build_ffmpeg_video_params(target_platform)
                audio_params = PlatformEncodingSpecs.build_ffmpeg_audio_params(target_platform)

                cmd = [
                    "ffmpeg", "-i", input_file,
                    "-vf", crop_filter,
                ]

                # Add platform-specific video encoding
                cmd.extend(video_params)

                # Add platform-specific audio encoding
                cmd.extend(audio_params)

                # Output file
                cmd.extend(["-y", output_path])

                logger.info(f"[{job_id}] Batch mode: Using platform-specific encoding for {target_platform}")
                result = self.ffmpeg_optimizer.optimize_and_execute(cmd, video_info=video_info, timeout=600)

                if result.returncode != 0:
                    raise Exception(f"FFmpeg crop failed: {result.stderr}")

        # PROGRESS: 75% - Crop complete
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="crop_resize",
            step_name="Crop & Resize",
            progress=75,
            message="Finalizing output..."
        )

        # Handle output (upload if interactive, cache if batch)
        output_result = self._handle_output(
            job_id=job_id,
            step_name="crop_resize",
            output_path=output_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        # PROGRESS: 90% - Preview ready (if uploaded)
        if output_result.get("cloud_url"):
            self.progress_publisher.publish_step_progress(
                job_id=job_id,
                step_id="crop_resize",
                step_name="Crop & Resize",
                progress=90,
                message="Preview ready"
            )

            # Emit preview_ready event for full quality (upgrade from fast preview)
            self.progress_publisher.publish_preview_ready(
                job_id=job_id,
                step_id="crop_resize",
                step_name="Crop & Resize",
                preview_url=output_result["cloud_url"],
                preview_type="video",
                width=video_info.get("width"),
                height=video_info.get("height"),
                duration=output_result.get("duration"),
                metadata={
                    "aspect_ratio": aspect_ratio,
                    "quality": "full",
                    "is_upgrade": True  # Frontend can auto-replace fast preview
                }
            )

        # PROGRESS: 100% - ALWAYS emit step_complete (so frontend can cross it off)
        self.progress_publisher.publish_step_complete(
            job_id=job_id,
            step_id="crop_resize",
            step_name="Crop & Resize",
            output_url=output_result.get("cloud_url"),
            metadata={"aspect_ratio": aspect_ratio, "duration": output_result.get("duration")}
        )

        output_result["aspect_ratio"] = aspect_ratio
        return output_result

    def burn_captions(
        self,
        job_id: str,
        testimonial_id: str,
        media_url: str,
        transcript_segments: Optional[list],
        style_config: Optional[Dict],
        target_platform: str,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Burn captions into video using transcript segments.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            media_url: Source media URL (may be unused if session cache hit)
            transcript_segments: List of transcript segment dicts with text, start, end
            style_config: Caption styling configuration
            target_platform: Platform name for optimization
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float
            }
        """
        # Check for cancellation
        if job_checker.check_cancellation(job_id):
            logger.info(f"[{job_id}] Burn Captions cancelled")
            raise Exception("Job was cancelled")

        logger.info(f"[{job_id}] Burn Captions for {target_platform}")

        # Get input file (from cache or download)
        input_file = self._get_input_file(job_id, media_url)

        # Prepare output path
        output_filename = f"captioned_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Use caption generator to properly create SRT and burn captions
        platform = target_platform.lower() if target_platform else "instagram"

        # Get media info
        video_info = self.storage_manager.get_video_info(input_file)

        # Step 1: Generate captions (creates proper SRT file)
        logger.info(f"[{job_id}] Generating captions with {len(transcript_segments)} segments")
        caption_result = self.caption_generator.generate_captions(
            media_path=input_file,
            target_platform=platform,
            transcript_segments=transcript_segments,
            style_options=style_config
        )

        if not caption_result.success:
            raise Exception(f"Caption generation failed: {caption_result.error}")

        logger.info(f"[{job_id}] Caption generation successful: {caption_result.word_count} words")

        # Step 2: Burn captions into video
        result_path = self.caption_generator.burn_captions_to_video(
            video_path=input_file,
            srt_path=caption_result.srt_path,
            platform=platform,
            media_info=video_info
        )

        logger.info(f"[{job_id}] Captions burned successfully to: {result_path}")

        # Handle output
        output_result = self._handle_output(
            job_id=job_id,
            step_name="burn_captions",
            output_path=result_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        return output_result

    def apply_branding(
        self,
        job_id: str,
        testimonial_id: str,
        media_url: str,
        logo_url: Optional[str],
        logo_position: str,
        watermark_text: str,
        watermark_position: str,
        brand_color: Optional[str],
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Apply logo and watermark branding to video.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            media_url: Source media URL (may be unused if session cache hit)
            logo_url: Cloud URL to logo image
            logo_position: Position for logo (e.g., "top-right", "bottom-left")
            watermark_text: Text to display as watermark (typically workspace name)
            watermark_position: Position for watermark text
            brand_color: Brand color for watermark
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float
            }
        """
        logger.info(f"[{job_id}] Apply Branding - logo_url: {logo_url}, watermark: {watermark_text}")

        # Get input file (from cache or download)
        input_file = self._get_input_file(job_id, media_url)

        # Prepare temp files list for cleanup
        temp_files = []

        # Use visual overlay to apply branding with correct parameters
        result_path = self.visual_overlay.apply_branding(
            video_path=input_file,
            logo_url=logo_url,  # Pass logo_url, method will download internally
            temp_files=temp_files,
            logo_position=logo_position,
            watermark_text=watermark_text,
            watermark_position=watermark_position,
            brand_color=brand_color
        )

        # Handle output
        output_result = self._handle_output(
            job_id=job_id,
            step_name="apply_branding",
            output_path=result_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        return output_result

    def mix_music(
        self,
        job_id: str,
        testimonial_id: str,
        media_url: str,
        music_track: Optional[str],
        music_volume: str,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Mix background music with video audio.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            media_url: Source media URL (may be unused if session cache hit)
            music_track: Music track identifier or URL
            music_volume: Volume level ("low", "medium", "high")
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float
            }
        """
        logger.info(f"[{job_id}] Mix Music: {music_track} at {music_volume}")

        # Get input file (from cache or download)
        input_file = self._get_input_file(job_id, media_url)

        # Prepare output path
        output_filename = f"music_mixed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Get media info
        video_info = self.storage_manager.get_video_info(input_file)

        # Prepare temp files list for cleanup
        temp_files = []

        # Convert music_volume (handle both string levels and numeric values)
        if music_volume:
            if isinstance(music_volume, str) and music_volume in ["low", "medium", "high"]:
                # Keep as string for music_mixer to convert
                volume_value = music_volume
            else:
                # Convert numeric string to float
                try:
                    volume_value = float(music_volume)
                except (ValueError, TypeError):
                    logger.warning(f"Invalid music_volume '{music_volume}', using default 'medium'")
                    volume_value = "medium"
        else:
            volume_value = "medium"

        # Use music mixer to mix music with correct parameters
        result_path = self.music_mixer.get_and_mix_music_with_cleanups(
            media_path=input_file,
            media_info=video_info,
            temp_files=temp_files,
            story_id=job_id,
            music_volume=volume_value,
            background_music=music_track,
            media_type="video"
        )

        # Handle output
        output_result = self._handle_output(
            job_id=job_id,
            step_name="mix_music",
            output_path=result_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        return output_result

    def normalize_audio(
        self,
        job_id: str,
        testimonial_id: str,
        media_url: str,
        target_platform: str,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Normalize audio levels using LUFS targeting.

        This is a processing step (no preview needed), but still supports dual-mode.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            media_url: Source media URL (may be unused if session cache hit)
            target_platform: Platform name for LUFS targeting
            upload_intermediate: True = upload, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float
            }
        """
        logger.info(f"[{job_id}] Normalize Audio for {target_platform}")

        # PROGRESS: 0% - Starting (NO preview for this step)
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="normalize_audio",
            step_name="Normalize Audio",
            progress=0,
            message="Starting audio normalization..."
        )

        # Get input file (from cache or download)
        input_file = self._get_input_file(job_id, media_url)

        # PROGRESS: 25% - Input ready
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="normalize_audio",
            step_name="Normalize Audio",
            progress=25,
            message="Analyzing audio levels..."
        )

        # Prepare output path
        output_filename = f"audio_normalized_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
        output_path = os.path.join(self.session_manager.base_path, job_id, output_filename)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # PROGRESS: 50% - Processing
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="normalize_audio",
            step_name="Normalize Audio",
            progress=50,
            message="Normalizing audio levels..."
        )

        # Use audio normalizer
        platform = target_platform.lower() if target_platform else "instagram"

        result_path = self.audio_normalizer.normalize_audio(
            video_path=input_file,
            output_path=output_path,
            platform=platform
        )

        # PROGRESS: 75% - Finalization
        self.progress_publisher.publish_step_progress(
            job_id=job_id,
            step_id="normalize_audio",
            step_name="Normalize Audio",
            progress=75,
            message="Finalizing audio normalization..."
        )

        # Handle output
        output_result = self._handle_output(
            job_id=job_id,
            step_name="normalize_audio",
            output_path=result_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        # PROGRESS: 100% - ALWAYS emit step_complete (even without preview!)
        # This ensures frontend crosses off the step
        self.progress_publisher.publish_step_complete(
            job_id=job_id,
            step_id="normalize_audio",
            step_name="Normalize Audio",
            output_url=output_result.get("cloud_url"),
            metadata={"duration": output_result.get("duration"), "platform": target_platform}
        )

        return output_result

    def enhance_video(
        self,
        job_id: str,
        testimonial_id: str,
        media_url: str,
        target_platform: str,
        enhancement_level: str,
        upload_intermediate: bool
    ) -> Dict[str, Any]:
        """
        Enhance video quality with platform-specific and engagement optimization.

        This combines:
        - Platform-specific optimization (color grading, sharpening, etc.)
        - Maximum engagement optimization
        - Final encoding

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier
            media_url: Source media URL (may be unused if session cache hit)
            target_platform: Platform name for optimization
            enhancement_level: Enhancement level ("light", "medium", "heavy")
            upload_intermediate: True = upload for preview, False = keep in container

        Returns:
            {
                "cloud_url": str or None,
                "local_path": str,
                "duration": float,
                "size": float
            }
        """
        logger.info(f"[{job_id}] Enhance Video: {enhancement_level} for {target_platform}")

        # Get input file (from cache or download)
        input_file = self._get_input_file(job_id, media_url)

        # Use media enhancer with platform-specific settings
        # NOTE: We pass add_branding=False and remove_noise=False because:
        # - Branding is a separate step in the new step-by-step workflow
        # - Noise removal is also a separate step
        platform = target_platform.lower() if target_platform else "instagram"

        result = self.media_enhancer.enhance(
            media_url=input_file,  # Can be local file path or URL
            quality=enhancement_level or "high",  # Map enhancement_level to quality
            target_platform=platform,
            add_branding=False,  # Don't add branding here - it's a separate step
            remove_noise=False,  # Don't remove noise here - it's a separate step
            upload_to_cloud=False,  # Keep locally for next step
            clean_up=False,  # Keep file for next step in pipeline
            testimonial_id=testimonial_id
        )

        if not result.get("success"):
            raise Exception(f"Enhancement failed: {result.get('error')}")

        # Extract the enhanced file path from result
        result_path = result.get("enhanced_url") or result.get("local_path")

        if not result_path or not os.path.exists(result_path):
            raise Exception(f"Enhancement result path is invalid or doesn't exist: {result_path}")

        logger.info(f"[{job_id}] Enhancement completed, output at: {result_path}")

        # Check for cancellation
        if job_checker.check_cancellation(job_id):
            logger.info(f"[{job_id}] Enhance Video cancelled")
            raise Exception("Job was cancelled")

        # Check for cancellation
        if job_checker.check_cancellation(job_id):
            logger.info(f"[{job_id}] Normalize Audio cancelled")
            raise Exception("Job was cancelled")

        # Check for cancellation
        if job_checker.check_cancellation(job_id):
            logger.info(f"[{job_id}] Mix Music cancelled")
            raise Exception("Job was cancelled")

        # Check for cancellation
        if job_checker.check_cancellation(job_id):
            logger.info(f"[{job_id}] Apply Branding cancelled")
            raise Exception("Job was cancelled")

        # IMPROVEMENT #6: Quality scoring and comparison
        try:
            logger.info(f"[{job_id}] Scoring video quality before/after enhancement")
            quality_comparison = self.quality_scorer.compare_quality(
                before_path=input_file,
                after_path=result_path
            )

            logger.info(f"[{job_id}] Quality comparison:")
            logger.info(f"  Before: {quality_comparison.before.overall_score:.1f}/100")
            logger.info(f"  After: {quality_comparison.after.overall_score:.1f}/100")
            logger.info(f"  Improvement: {quality_comparison.improvement_percentage:+.1f}%")
            logger.info(f"  Recommendation: {quality_comparison.recommendation}")

            if quality_comparison.improvement_areas:
                logger.info(f"  Improvements: {', '.join(quality_comparison.improvement_areas)}")
            if quality_comparison.degradation_areas:
                logger.warning(f"  Degradations: {', '.join(quality_comparison.degradation_areas)}")

            # Include quality metrics in output
            quality_metrics = {
                "before_score": quality_comparison.before.overall_score,
                "after_score": quality_comparison.after.overall_score,
                "improvement_pct": quality_comparison.improvement_percentage,
                "recommendation": quality_comparison.recommendation,
                "improvement_areas": quality_comparison.improvement_areas,
                "degradation_areas": quality_comparison.degradation_areas
            }

        except Exception as e:
            logger.warning(f"[{job_id}] Quality scoring failed: {e}")
            quality_metrics = None

        # Store the enhanced file in session cache for next step
        self.session_manager.store_file(job_id, "enhance_video", result_path)

        # Handle output
        output_result = self._handle_output(
            job_id=job_id,
            step_name="enhance_video",
            output_path=result_path,
            upload_intermediate=upload_intermediate,
            testimonial_id=testimonial_id
        )

        # Add quality metrics to result
        if quality_metrics:
            output_result["quality_metrics"] = quality_metrics

        return output_result

    def save_progress(
        self,
        job_id: str,
        testimonial_id: str
    ) -> Dict[str, Any]:
        """
        Save current session progress to cloud storage.

        Called when user clicks "Stop & Save Progress" mid-pipeline.

        Args:
            job_id: Job identifier
            testimonial_id: Testimonial identifier

        Returns:
            {
                "saved_url": str,
                "steps_completed": list,
                "duration": float,
                "size": float
            }
        """
        logger.info(f"[{job_id}] Save Progress")

        # Get latest file from session
        latest_file = self.session_manager.get_latest_file(job_id)

        if not latest_file:
            raise Exception(f"No session data found for job {job_id}")

        # Upload to permanent storage
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        cloud_path = f"temp/{testimonial_id}/{job_id}/progress_{timestamp}.mp4"
        saved_url = self.storage_manager.upload_file_with_retry(latest_file, cloud_path)

        # Get metadata
        video_info = self.storage_manager.get_video_info(latest_file)

        # Get session stats
        stats = self.session_manager.get_session_stats()
        session_data = stats.get("sessions", {}).get(job_id, {})
        steps_completed = list(session_data.get("files_count", 0))

        # Cleanup session after save
        self.session_manager.cleanup_session(job_id)

        return {
            "saved_url": saved_url,
            "steps_completed": steps_completed,
            "duration": video_info.get("duration", 0),
            "size": os.path.getsize(latest_file) / (1024 * 1024)
        }

    def cleanup_session(self, job_id: str):
        """
        Cleanup session files (called when job completes or fails).

        Args:
            job_id: Job identifier
        """
        logger.info(f"[{job_id}] Cleanup Session")
        self.session_manager.cleanup_session(job_id)

    def _format_timestamp(self, seconds: float) -> str:
        """
        Format seconds to SRT timestamp format (HH:MM:SS,mmm).

        Args:
            seconds: Time in seconds

        Returns:
            Formatted timestamp string
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds % 1) * 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"
