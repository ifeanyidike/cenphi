# src/services/platform_optimizer/optimizer.py

import os
import uuid
import logging
import tempfile

from datetime import datetime
from typing import Dict, Any, Optional, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from .platform_specs import PlatformSpecs, PlatformSpec
from .media_processor import MediaProcessor
from src.utils.music_mixer import MusicMixer
from ..shared.noise_service import NoiseService
from ..shared.visual_overlay import VisualOverlay
from ..shared.audio_normalizer import AudioNormalizer

# Import new components
from ..shared.caption_generator import CaptionGenerator
from ..enhancement import MediaEnhancer
from .platform_optimizers import (
    InstagramOptimizer, 
    TikTokOptimizer, 
    LinkedInOptimizer, 
    YouTubeOptimizer
)

import intelligence_pb2

logger = logging.getLogger(__name__)


class PlatformOptimizer:
    """Production-grade platform optimizer supporting all media types with enhanced features"""
    
    def __init__(self):
        self.platform_specs = PlatformSpecs()
        self.media_processor = MediaProcessor()
        self._storage_manager = None
        self.music_mixer = MusicMixer()
        self.visual_overlay = VisualOverlay()
        
        # Enhanced components
        self.caption_generator = CaptionGenerator()
        self.enhancer = MediaEnhancer()
        self.noise_service = NoiseService()
        
        # Platform-specific optimizers
        self.instagram_optimizer = InstagramOptimizer()
        self.tiktok_optimizer = TikTokOptimizer()
        self.linkedin_optimizer = LinkedInOptimizer()
        self.youtube_optimizer = YouTubeOptimizer()

        # High-value engagement optimizer
        self._engagement_optimizer = None
        
        # Specialized processors for each media type
        self.video_processor = VideoOptimizer(self.media_processor) 
        self.audio_normalizer = AudioNormalizer()
        
        logger.info("Enhanced PlatformOptimizer initialized with advanced features")

    @property
    def engagement_optimizer(self):
        """Lazy load engagement optimizer"""
        if self._engagement_optimizer is None:
            from .engagement_optimizer import EngagementOptimizer
            self._engagement_optimizer = EngagementOptimizer()
        return self._engagement_optimizer

    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    def batch_optimize(
        self,
        options: List[Dict[str, Any]], # where options key: is a list of testimonial_id: str, media_url: str, and transcript_segments: List[intelligence_pb2.TranscriptSegment]
        target_platform: str,
        brand_context:intelligence_pb2.BrandContext = None,
        optimization_options: Dict[str, Any] = None,
        background_music: Optional[str] = None,
        music_volume: Optional[str] = None,
        transcript: Optional[str] = None,
        enable_captions: bool = True,
        enable_media_enhancement: bool = True,
        watermark_text: str = "",
        logo_position: str = "top-right",
        watermark_position: str = "bottom-right",
        add_background_music: bool = True,
        enable_audio_normalization: bool = False,
        upload_to_cloud: bool = True,
        remove_noise: bool = True
        ): 
        """
        Batch optimize multiple media files for a specific platform with enhanced features using thread pool concurrency
        
        Args:
            options: A list that contains:
                - testimonial_id: Unique identifier for the testimonial
                - media_url: Path to source media OR URL
                - transcript_segments: Optional list of transcript segments for caption generation
            target_platform: Target platform name
            brand_context: Optional brand context
            optimization_options: Optional optimization settings
            background_music: Optional background music
            music_volume: Optional music volume
            transcript: Optional transcript for caption generation
            enable_captions: Whether to generate captions
            enable_media_enhancement: Whether to enhance the media and normalize audio
            
        Returns:
            List of OptimizeResponse objects for each media file
        """
        start_time = datetime.now()
        results = []
        temp_files = []
        
        try:
            logger.info(f"Starting batch optimization for platform: {target_platform} with {len(options)} media files")
            
            # Validate inputs
            if not options or not isinstance(options, dict):
                raise ValueError("Invalid options provided for batch optimization")
            
            # CloudRun-optimized worker count
            cpu_count = os.cpu_count() or 2
            if cpu_count <= 2:
                optimal_workers = 1  # Single worker for small CloudRun instances
            elif cpu_count <= 4:
                optimal_workers = 2  # Conservative for standard CloudRun
            else:
                optimal_workers = min(4, max(2, cpu_count - 1))  # Cap for larger instances

            # Prepare thread pool for concurrent processing
            with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
                future_to_option = {
                    executor.submit(
                        self.optimize,
                        media_url=option.get("media_url"),
                        target_platform=target_platform,
                        brand_context=brand_context,
                        optimization_options=optimization_options,
                        background_music=background_music,
                        music_volume=music_volume,
                        transcript=transcript,
                        transcript_segments=option.get("transcript_segments", []),
                        enable_captions=enable_captions,
                        enable_media_enhancement=enable_media_enhancement,
                        watermark_text=watermark_text,      
                        logo_position=logo_position,
                        watermark_position=watermark_position,
                        add_background_music=add_background_music,
                        enable_audio_normalization=enable_audio_normalization,
                        upload_to_cloud=upload_to_cloud,
                        remove_noise=remove_noise,
                        testimonial_id=option.get("testimonial_id", None)
                    ): option for option in options
                }
                
                # Collect results as they complete
                for future in as_completed(future_to_option):
                    option = future_to_option[future]
                    testimonial_id = option.get("testimonial_id", "unknown")
                    try:
                        result = future.result()
                        result["testimonial_id"] = testimonial_id
                        results.append(result)
                        logger.info(f"✅ Batch optimization completed for story {testimonial_id}: {result.optimized_url}")
                    except Exception as e:
                        logger.error(f"❌ Batch optimization failed for story {testimonial_id}: {e}")
                        results.append(intelligence_pb2.OptimizeResponse(
                            success=False,
                            media_type="unknown",
                            platform=target_platform,
                            optimized_url="",
                            error=str(e),
                            testimonial_id=testimonial_id
                        ))
        
        except Exception as e:
            logger.error(f"Batch optimization failed: {e}")
            raise
        
        finally:    
            # Cleanup temporary files
            for t in temp_files:
                self._safe_cleanup(t)
        
        optimization_duration = datetime.now() - start_time
        logger.info(f"✅ Batch optimization completed in {optimization_duration.total_seconds():.2f} seconds")
        
        return results    

    
    def optimize(
        self,
        media_url: str,
        target_platform: str,
        brand_context:intelligence_pb2.BrandContext = None,
        optimization_options: Dict[str, Any] = None,
        background_music: Optional[str] = None,
        music_volume: Optional[str] = None,
        transcript: Optional[str] = None,
        transcript_segments: Optional[List[intelligence_pb2.TranscriptSegment]] = [],
        enable_captions: bool = True,
        enable_media_enhancement: bool = True,
        watermark_text: str = "",
        logo_position: str = "top-right",
        watermark_position: str = "bottom-right",
        add_background_music: bool = True,
        enable_audio_normalization: bool = False,
        upload_to_cloud: bool = True,
        remove_noise: bool = True,
        testimonial_id: Optional[str] = None
    ) -> intelligence_pb2.OptimizeResponse:
        """
        Enhanced optimize method with caption generation, audio normalization, and platform-specific optimization
        
        Args:
            media_url: Path to source media OR URL 
            target_platform: Target platform name
            brand_context: Optional brand context
            optimization_options: Optional optimization settings
            background_music: Optional background music
            music_volume: Optional music volume
            media_path: Optional direct media path
            transcript: Optional transcript for caption generation
            enable_captions: Whether to generate captions
            enable_media_enhancement: Whether to enhance the media and normalize audio
            
        Returns:
            OptimizeResponse with comprehensive details
        """
        temp_files = []
        start_time = datetime.now()
        in_process = False
        final_url = ""

        try:
            logger.info(f"Starting enhanced platform optimization: platform: {target_platform} => url: {media_url}")
            
            if not media_url:
                raise ValueError("No media_url provided")
            
            media_url = media_url.strip()
            if not media_url:
                raise ValueError("Empty media_url provided")
            
            cache_path = self.generate_optimization_cache_key(
                media_url, target_platform, brand_context, optimization_options,
                background_music, music_volume, transcript, transcript_segments,
                enable_captions, enable_media_enhancement, watermark_text,
                logo_position, watermark_position, add_background_music,
                enable_audio_normalization, remove_noise
            )
            
            cache_url = self.storage_manager.get_public_url_for_object(f"temp/optimized/{target_platform}/{cache_path}.mp4")
            if self.storage_manager.check_url_exists(cache_url):
                logger.info(f"✅ Using cached platform optimizer URL: temp/optimized/{target_platform}/{cache_path}.mp4")
                return intelligence_pb2.OptimizeResponse(
                    success=True,
                    media_type="video",
                    platform=target_platform,
                    optimized_url=cache_url,
                    applied_optimizations=[],
                    testimonial_id=testimonial_id,
                    error=""
                )

            if media_url and os.path.exists(media_url):
                # media_url is already a local path
                media_path = media_url
                in_process = True
            elif media_url and (media_url.startswith('http://') or media_url.startswith('https://')):
                media_path = self.storage_manager.download_media(media_url)
                if media_path:
                    temp_files.append(media_path)
            else:
                raise ValueError(f"Invalid media_url format: {media_url}")

            # Validate inputs
            if not media_path or not os.path.exists(media_path):
                raise FileNotFoundError(f"Media file not found: {media_path}")
            
            platform_spec = self.platform_specs.get_platform_spec(target_platform)
            if not platform_spec:
                raise ValueError(f"Unsupported platform: {target_platform}")
            
            # Comprehensive media analysis
            logger.info(f"🔍 Analyzing media: {media_path}")
            media_analysis = self.media_processor.analyze_video(media_path)
            if not media_analysis.get("success", False):
                error_msg = media_analysis.get("error", "Unknown analysis error")
                raise Exception(f"Media analysis failed: {error_msg}")
            
            # Determine media type
            media_type = self._determine_media_type(media_analysis)

            normalized_media_path = media_path
            if enable_audio_normalization:
                try:
                    logger.info("🎵 Applying enhanced professional audio normalization...")
                    normalization_result = self.audio_normalizer.normalize_audio(
                        media_path, target_platform)

                    if normalization_result and normalization_result.success:
                        if hasattr(normalization_result, 'normalized_path') and normalization_result.normalized_path:
                            normalized_media_path = normalization_result.normalized_path
                            temp_files.append(normalized_media_path)
                            
                            target_loudness = getattr(normalization_result, 'target_loudness', 'optimized')
                            logger.info(f"✅ Enhanced professional audio normalized: {target_loudness} LUFS")
                    else:
                        logger.info("ℹ️  Audio normalization skipped - current levels acceptable")
                except Exception as e:
                    logger.warning(f"Audio normalization failed: {e} (continuing with enhanced audio)")
            
            
            # STEP 1: Audio normalization (if enabled and has audio)
            enhanced_media_path = normalized_media_path
            if enable_media_enhancement and normalized_media_path:
                logger.info("🔊 Applying media enhancement...")
                enhancement_result = self.enhancer.enhance(
                    media_url=normalized_media_path,
                    target_platform=target_platform,
                    upload_to_cloud=False,
                    remove_noise = False,
                    clean_up=False
                    # media_path, target_platform
                )
                if enhancement_result.get("success") and enhancement_result.get("enhanced_url"):
                    enhanced_media_path = enhancement_result.get("enhanced_url")
                    temp_files.append(enhanced_media_path)
                    logger.info(f"✅ Media enhancement successful")
                else:
                    logger.warning("Media enhancement failed")
                    logger.warning(enhancement_result.get("error"))

            if not enhanced_media_path:
                raise Exception("Enhanced media path is empty")
            
            # STEP 2: CPU-optimized platform processing with quality preservation
            if media_type == "video":
                # Use CPU-optimized settings for Cloud Run
                if not optimization_options:
                    optimization_options = {}

                # Add CPU optimization settings
                optimization_options.update({
                    "use_cpu_optimization": True,
                    "quality_preset": "very_fast_hq",  # Quality-preserving fast preset
                    "use_hw_accel": False,  # Disabled for Cloud Run CPU-only
                    "threads": min(4, os.cpu_count() or 2),  # Optimize for CloudRun CPU
                    "cloudrun_optimized": True,  # Enable CloudRun-specific optimizations
                    "preserve_colors": enable_media_enhancement  # Preserve enhanced colors
                })

                basic_result = self.video_processor.optimize(
                    enhanced_media_path, platform_spec, media_analysis, brand_context, optimization_options
                )
                temp_files.append(basic_result.optimized_url)
            else:
                raise ValueError(f"Unsupported media type: {media_type}")

            optimized_media_path = basic_result.optimized_url
            if not optimized_media_path:
                raise Exception("Optimized media path is empty after basic optimization")
            
            # STEP 3: Platform-specific enhancements
            platform_specific_result = self._apply_platform_specific_optimization(
                optimized_media_path, target_platform, platform_spec, media_analysis
            )

            if platform_specific_result.success and platform_specific_result.optimized_path:
                intermediate_media_path = platform_specific_result.optimized_path
                temp_files.append(intermediate_media_path)
            else:
                intermediate_media_path = optimized_media_path
                logger.warning(f"Platform-specific optimization failed: {platform_specific_result.error}")

            # STEP 3.5: High-value engagement optimization 🚀
            logger.info("🚀 Applying high-value engagement optimization")
            engagement_result = self.engagement_optimizer.optimize_for_maximum_engagement(
                media_path=intermediate_media_path,
                target_platform=target_platform,
                content_analysis=media_analysis,
                brand_context=brand_context,
                temp_files=temp_files
            )

            if engagement_result.get("success") and engagement_result.get("optimized_path"):
                final_media_path = engagement_result["optimized_path"]
                temp_files.append(final_media_path)
                logger.info(f"✅ Engagement optimization: +{engagement_result.get('improvement_metrics', {}).get('engagement_boost_percentage', 0):.0f}% boost expected")
            else:
                final_media_path = intermediate_media_path
                logger.warning(f"Engagement optimization failed: {engagement_result.get('error', 'Unknown')}")

            if not final_media_path:
                raise Exception("Final media path is empty")
            
            # STEP 4: Caption generation (if enabled and transcript provided)
            caption_paths = {}
            if enable_captions and (transcript or transcript_segments) and final_media_path:
                logger.info("📝 Generating captions...")
                caption_result = self.caption_generator.generate_captions(
                    media_path=final_media_path,
                    target_platform=target_platform,
                    transcript=transcript,
                    transcript_segments=transcript_segments
                )
                if caption_result.success:
                    # Burn captions into video
                    captioned_video = self.caption_generator.burn_captions_to_video(
                        final_media_path, caption_result.srt_path, target_platform, media_analysis
                    )

                    if captioned_video:
                        final_media_path = captioned_video  # Use captioned video
                        temp_files.append(captioned_video)
                        logger.info(f"✅ Captions burned into video: {caption_result.word_count} words")
                    caption_paths = {
                        "srt": caption_result.srt_path,
                        "vtt": caption_result.vtt_path
                    }
                    temp_files.extend([caption_result.srt_path, caption_result.vtt_path])
                    logger.info(f"✅ Captions generated: {caption_result.word_count} words")
                else:
                    logger.warning(f"Caption generation failed: {caption_result.error}")
            elif enable_captions and (not transcript or not transcript_segments):
                logger.warning("Caption generation requested but no transcript or transcript segments provided")
            
            # STEP 5: Background music mixing (if requested)
            if add_background_music and not in_process and final_media_path:
                try:
                    final_media_path = self.music_mixer.get_and_mix_music_with_cleanups(
                        media_path=final_media_path,
                        media_info=media_analysis,
                        temp_files=temp_files,
                        story_id="video_optm",
                        music_volume=music_volume,
                        background_music=background_music
                    )
                    logger.info("🎵 Background music mixed successfully")
                except Exception as e:
                    logger.warning(f"Music mixing failed, using optimized content only: {e}")

            
            if remove_noise and final_media_path:
                final_media_path = self.noise_service.process_with_denoising(final_media_path, "high", temp_files, "optim")

            # STEP 6: add watermark/logo if requested
            logo_url = getattr(brand_context, 'logo_url', "")
            color = "#FFFFFF" 
            if getattr(brand_context, 'color_slice'):
                color = brand_context.color_slice[0]

            if (logo_url or watermark_text) and final_media_path:
                final_media_path = self.visual_overlay.apply_branding(final_media_path, logo_url, temp_files, logo_position, 
                                                   watermark_text, watermark_position, color)
            
            if not final_media_path:
                raise Exception("Final media path is empty before upload")

            # STEP 7: Upload to storage if available
            final_url = final_media_path
            uploaded_caption_urls = {}
            
            if self.storage_manager and final_media_path and upload_to_cloud:
                try:
                    # Prepare all upload tasks
                    upload_tasks = []
                    
                    # Main video upload
                    # object_name = f"temp/optimized/{target_platform}/{uuid.uuid4().hex}_{os.path.basename(final_media_path)}"
                    object_name = f"temp/optimized/{target_platform}/{cache_path}.mp4"
                    upload_tasks.append(("main_video", final_media_path, object_name))
                    
                    # Caption uploads
                    for caption_type, caption_path in caption_paths.items():
                        if caption_path and os.path.exists(caption_path):
                            caption_object_name = f"temp/captions/{target_platform}/{cache_path}_{os.path.basename(caption_path)}"
                            upload_tasks.append((caption_type, caption_path, caption_object_name))
                    
                    # Upload all files in parallel
                    uploaded_urls = {}
                    # CloudRun-optimized upload workers
                    cpu_count = os.cpu_count() or 2
                    if cpu_count <= 2:
                        optimal_workers = 2  # Parallel uploads even on small instances
                    else:
                        optimal_workers = min(6, max(3, cpu_count))  # More workers for uploads

                    with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
                        # Submit all uploads
                        future_to_type = {
                            executor.submit(self.storage_manager.upload_file_with_retry, task[1], task[2]): task[0] 
                            for task in upload_tasks
                        }
                        
                        # Collect results
                        for future in as_completed(future_to_type):
                            upload_type = future_to_type[future]
                            try:
                                url = future.result()
                                uploaded_urls[upload_type] = url
                                logger.info(f"✅ {upload_type} uploaded successfully")
                            except Exception as e:
                                logger.warning(f"❌ {upload_type} upload failed: {e}")
                    
                    # Set final URLs
                    final_url = uploaded_urls.get("main_video", final_media_path)
                    for caption_type in caption_paths.keys():
                        if caption_type in uploaded_urls:
                            uploaded_caption_urls[caption_type] = uploaded_urls[caption_type]
                    
                    logger.info("☁️ All files uploaded in parallel")
                    
                except Exception as e:
                    logger.warning(f"Parallel upload failed: {e}")
            
            # Compile comprehensive results
            applied_optimizations = list(basic_result.applied_optimizations)
            
            if enable_media_enhancement and enhancement_result.get("success"):
                applied_optimizations.append("audio_normalized")
                applied_optimizations.append("enhancement")
            
            if platform_specific_result.success:
                applied_optimizations.extend(platform_specific_result.engagement_enhancements)

            # Add engagement optimization details
            if engagement_result.get("success"):
                applied_optimizations.extend(engagement_result.get("applied_optimizations", []))
                applied_optimizations.append("high_value_engagement_optimized")

            if caption_paths:
                applied_optimizations.append("captions_generated")
            
            optimization_duration = datetime.now() - start_time
            logger.info(f"✅ Enhanced platform optimization completed in {optimization_duration.total_seconds():.2f} seconds")

            # Create enhanced response
            response = intelligence_pb2.OptimizeResponse(
                success=True,
                media_type=media_type,
                platform=target_platform,
                optimized_url=final_url,
                applied_optimizations=applied_optimizations,
                testimonial_id=testimonial_id,
                # Additional metadata could be added here
                error=""
            )
            
            # Add caption URLs to response if available (you may need to extend the proto definition)
            # response.caption_urls.update(uploaded_caption_urls)
            
            return response
            
        except Exception as e:
            logger.error(f"Enhanced platform optimization failed: {e}")
            
            return intelligence_pb2.OptimizeResponse(
                success=False,
                media_type="unknown",
                platform=target_platform,
                optimized_url="",
                error=str(e),
                testimonial_id=testimonial_id
            )
        
        finally:
            # Cleanup temporary files
            for t in temp_files:
                if not upload_to_cloud and final_url == t:
                    continue
                else:
                    self._safe_cleanup(t)

    
    def generate_optimization_cache_key(self,
        media_url: str,
        target_platform: str,
        brand_context:intelligence_pb2.BrandContext = None,
        options: Dict[str, Any] = None,
        background_music: Optional[str] = None,
        music_volume: Optional[str] = None,
        transcript: Optional[str] = "",
        transcript_segments: Optional[List[intelligence_pb2.TranscriptSegment]] = [],
        enable_captions: bool = True,
        enable_media_enhancement: bool = True,
        watermark_text: str = "",
        logo_position: str = "top-right",
        watermark_position: str = "bottom-right",
        add_background_music: bool = True,
        enable_audio_normalization: bool = False,
        remove_noise: bool = True
    ):
        """Generate deterministic cache key including brand colors"""
        import hashlib
        import json
        from urllib.parse import urlparse

        OPTIMIZER_ALGORITHM_VERSION = "v1.0"
        parsed_url = urlparse(media_url)
        media_id = f"{parsed_url.netloc}{parsed_url.path}"

        logo_url = getattr(brand_context, 'logo_url', "")
        color = "#FFFFFF" 
        if getattr(brand_context, 'color_slice'):
            color = brand_context.color_slice[0]
        noise = "1" if remove_noise else "0"

       
        
        quality= options.get("quality", "balanced") if options else "balanced"
        enhance_quality=  str(options.get("enhance_quality", True)) if options else "True"
        use_hw_accel= str(options.get("use_hw_accel", False)) if options else "False"
        use_smart_crop= str(options.get("use_smart_crop", True)) if options else "True" 
        analysis_frames= str(options.get("analysis_frames", 5)) if options else "5"

        # ----- deterministic hash for transcript_segments -----
        if transcript_segments:
            try:
                combined = b"".join(
                    seg.SerializeToString(deterministic=True) for seg in transcript_segments
                )
                logger.info("SerializeToString exists, using it")
                segs_hash = hashlib.md5(combined).hexdigest()[:20]
            except TypeError:
                from google.protobuf.json_format import MessageToDict
                # deterministic arg not supported; fallback to stable JSON
                segs_as_dicts = [
                    MessageToDict(seg, preserving_proto_field_name=True, including_default_value_fields=False)
                    for seg in transcript_segments
                ]
                logger.info("No SerializeToString using MessageToDict")
                segs_json = json.dumps(segs_as_dicts, sort_keys=True, separators=(",", ":"))
                segs_hash = hashlib.md5(segs_json.encode()).hexdigest()[:20]
        else:
            segs_hash = ""
        
        cache_data = (
            f"{OPTIMIZER_ALGORITHM_VERSION}|{media_id}|{quality}|{enhance_quality}|{use_hw_accel}|{use_smart_crop}|{analysis_frames}"
            f"|{watermark_text or ''}|{watermark_position or ''}|{segs_hash}|{logo_url}|{color}|{str(enable_media_enhancement)}" 
            f"|{background_music or ''}|{music_volume or ''}|{transcript[:100]}|{str(enable_captions)}"
            f"|{target_platform or ''}|{noise}|{logo_position}|{str(add_background_music)}|{str(enable_audio_normalization)}"
        )
        
        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()
        return f"{cache_hash}"

    def optimize_with_cpu_batch(
        self,
        media_url: str,
        target_platforms: List[str],
        brand_context: intelligence_pb2.BrandContext = None,
        optimization_options: Dict[str, Any] = None,
    ) -> Dict[str, intelligence_pb2.OptimizeResponse]:
        """
        CPU-optimized batch platform optimization with quality preservation
        Processes one input for multiple platforms in a single FFmpeg pass
        """
        temp_files = []
        results = {}

        try:
            logger.info(f"🚀 CPU-optimized batch platform optimization: {len(target_platforms)} platforms")

            # Download/prepare media
            if media_url.startswith('http'):
                media_path = self.storage_manager.download_media(media_url)
                if media_path:
                    temp_files.append(media_path)
            else:
                media_path = media_url

            if not os.path.exists(media_path):
                raise FileNotFoundError(f"Media file not found: {media_path}")

            # Get platform specs
            platform_specs = {}
            for platform in target_platforms:
                spec = self.platform_specs.get_platform_spec(platform)
                if spec:
                    platform_specs[platform] = spec

            if not platform_specs:
                raise ValueError("No valid platform specifications found")

            # Create output paths
            output_paths = {}
            for platform in platform_specs:
                output_path = f"{tempfile.gettempdir()}/batch_optimized_{platform}_{uuid.uuid4().hex}.mp4"
                output_paths[platform] = output_path
                temp_files.append(output_path)

            # Use FFmpeg optimizer for single-pass multi-output
            if self._ffmpeg_optimizer is None:
                from src.utils.ffmpeg_optimizer import FFmpegOptimizer
                self._ffmpeg_optimizer = FFmpegOptimizer()

            # Create batch platform optimization command
            platform_configs = {}
            for platform, spec in platform_specs.items():
                platform_configs[platform] = {
                    "width": spec.preferred_resolution[0],
                    "height": spec.preferred_resolution[1],
                    "bitrate": f"{spec.bitrate_range[1]}k",
                    "fps": spec.frame_rate,
                    "output_path": output_paths[platform]
                }

            # Use quality-preserving preset for batch optimization
            quality_preset = self._ffmpeg_optimizer.get_quality_preserving_preset("very_fast_hq")

            # Create single-pass multi-output command
            batch_cmd = self._ffmpeg_optimizer.create_single_pass_multi_output_command(
                input_path=media_path,
                platform_configs=platform_configs,
                quality_preset=quality_preset
            )

            logger.info(f"📊 Executing batch platform optimization with {quality_preset['preset']} preset")
            result = self._ffmpeg_optimizer.optimize_and_execute(batch_cmd, timeout=600)

            if result.returncode == 0:
                # Build success responses for each platform
                for platform, output_path in output_paths.items():
                    if os.path.exists(output_path):
                        # Upload optimized file
                        cache_key = self.generate_optimization_cache_key(
                            media_url, platform, brand_context, optimization_options
                        )
                        object_name = f"temp/optimized/{platform}/{cache_key}.mp4"
                        optimized_url = self.storage_manager.upload_file_with_retry(output_path, object_name)

                        results[platform] = intelligence_pb2.OptimizeResponse(
                            success=True,
                            media_type="video",
                            platform=platform,
                            optimized_url=optimized_url,
                            applied_optimizations=["cpu_batch_optimized", "quality_preserved", "platform_specific"],
                            error=""
                        )
                    else:
                        results[platform] = intelligence_pb2.OptimizeResponse(
                            success=False,
                            media_type="video",
                            platform=platform,
                            optimized_url="",
                            error=f"Output file not created for {platform}"
                        )
            else:
                # Fallback to sequential processing if batch fails
                logger.warning("⚠️ Batch processing failed, falling back to sequential processing")
                for platform in target_platforms:
                    results[platform] = self.optimize(
                        media_url, platform, brand_context, optimization_options
                    )

            return results

        except Exception as e:
            logger.error(f"❌ Batch platform optimization failed: {str(e)}")
            # Return error responses for all platforms
            for platform in target_platforms:
                results[platform] = intelligence_pb2.OptimizeResponse(
                    success=False,
                    media_type="video",
                    platform=platform,
                    optimized_url="",
                    error=f"Batch optimization failed: {str(e)}"
                )
            return results

        finally:
            # Cleanup temporary files
            for temp_file in temp_files:
                self._safe_cleanup(temp_file)

    def _apply_platform_specific_optimization(
        self,
        media_path: str,
        target_platform: str,
        platform_spec: PlatformSpec,
        media_analysis: Dict[str, Any]
    ) -> Any:  # Returns PlatformOptimizationResult
        """Apply platform-specific optimizations"""
        
        try:
            platform_lower = target_platform.lower()
            
            # Instagram platforms
            if platform_lower.startswith("instagram"):
                if "story" in platform_lower:
                    return self.instagram_optimizer.optimize_for_instagram(
                        media_path, "story", platform_spec, media_analysis
                    )
                elif "reel" in platform_lower:
                    return self.instagram_optimizer.optimize_for_instagram(
                        media_path, "reel", platform_spec, media_analysis
                    )
                elif "feed" in platform_lower:
                    return self.instagram_optimizer.optimize_for_instagram(
                        media_path, "feed", platform_spec, media_analysis
                    )
                else:
                    # Default to reel for generic "instagram"
                    return self.instagram_optimizer.optimize_for_instagram(
                        media_path, "reel", platform_spec, media_analysis
                    )
            
            # TikTok
            elif platform_lower == "tiktok":
                return self.tiktok_optimizer.optimize_for_tiktok(
                    media_path, platform_spec, media_analysis
                )
            
            # YouTube platforms
            elif platform_lower.startswith("youtube"):
                if "shorts" in platform_lower:
                    return self.youtube_optimizer.optimize_for_youtube(
                        media_path, "shorts", platform_spec, media_analysis
                    )
                else:
                    return self.youtube_optimizer.optimize_for_youtube(
                        media_path, "standard", platform_spec, media_analysis
                    )
            
            # LinkedIn
            elif platform_lower == "linkedin":
                return self.linkedin_optimizer.optimize_for_linkedin(
                    media_path, platform_spec, media_analysis
                )
            
            # Other platforms - return success with no additional optimization
            else:
                # Create a basic success result for platforms without specific optimizers
                from .platform_optimizers import PlatformOptimizationResult
                return PlatformOptimizationResult(
                    success=True,
                    optimized_path=media_path,
                    platform_features={"format": platform_lower, "basic_optimization": True},
                    engagement_enhancements=["basic_platform_compliance"],
                    compliance_score=0.85
                )
                
        except Exception as e:
            logger.error(f"Platform-specific optimization failed for {target_platform}: {e}")
            # Return failure result
            from .platform_optimizers import PlatformOptimizationResult
            return PlatformOptimizationResult(
                success=False,
                error=str(e)
            )
   
    def _determine_media_type(self, media_analysis: Dict[str, Any]) -> str:
        """Determine primary media type from analysis"""
        
        video_streams = media_analysis.get("video_streams", [])
        audio_streams = media_analysis.get("audio_streams", [])
        
        if video_streams:
            return "video"
        elif audio_streams:
            return "audio"
        else:
            # Check file extension as fallback
            file_info = media_analysis.get("file_info", {})
            mime_type = file_info.get("mime_type", "")
            
            if mime_type and mime_type.startswith("image"):
                return "image"
            else:
                return "unknown"

    
    def _get_platform_optimization_features(self, platform: str) -> List[str]:
        """Get list of platform-specific optimization features"""
        
        platform_lower = platform.lower()
        
        if platform_lower.startswith("instagram"):
            if "story" in platform_lower:
                return ["engagement_zoom", "mobile_optimization", "story_duration_optimization", "interactive_elements"]
            elif "reel" in platform_lower:
                return ["high_energy_colors", "algorithm_optimization", "mobile_stabilization", "trending_audio"]
            else:
                return ["feed_quality_enhancement", "brand_consistency", "caption_optimization"]
        
        elif platform_lower == "tiktok":
            return ["algorithm_colors", "mobile_sharpening", "viral_optimization", "trending_integration"]
        
        elif platform_lower.startswith("youtube"):
            if "shorts" in platform_lower:
                return ["quality_enhancement", "discovery_optimization", "loop_friendly", "mobile_first"]
            else:
                return ["premium_quality", "seo_optimization", "thumbnail_optimization", "monetization_friendly"]
        
        elif platform_lower == "linkedin":
            return ["professional_grading", "desktop_optimization", "business_audio", "thought_leadership"]
        
        else:
            return ["basic_optimization", "platform_compliance", "quality_enhancement"]
        

    def _safe_cleanup(self, file_or_dir_path: str):
        """Enhanced cleanup that handles both files and directories"""
        try:
            if not file_or_dir_path or not os.path.exists(file_or_dir_path):
                return
                
            if os.path.isfile(file_or_dir_path):
                os.unlink(file_or_dir_path)
                logger.debug(f"Cleaned up file: {os.path.basename(file_or_dir_path)}")
            elif os.path.isdir(file_or_dir_path):
                import shutil
                shutil.rmtree(file_or_dir_path, ignore_errors=True)
                logger.debug(f"Cleaned up directory: {os.path.basename(file_or_dir_path)}")
                
        except Exception as e:
            logger.warning(f"Cleanup failed for {file_or_dir_path}: {e}")


class VideoOptimizer:
    """Specialized video optimization for platforms"""
    
    def __init__(self, media_processor: MediaProcessor):
        self.media_processor = media_processor
    
    def optimize(
        self,
        video_path: str,
        platform_spec: PlatformSpec,
        media_analysis: Dict[str, Any],
        brand_context: intelligence_pb2.BrandContext,
        options: Optional[Dict[str, Any]]
    ) -> intelligence_pb2.OptimizeResponse:
        """Optimize video for platform with smart cropping"""
        
        try:
            output_path = f"{tempfile.gettempdir()}/video_optimized_{uuid.uuid4().hex}.mp4"
            
            # Build target specification
            target_spec = {
                "width": platform_spec.preferred_resolution[0],
                "height": platform_spec.preferred_resolution[1],
                "fps": platform_spec.frame_rate,
                "quality": options.get("quality", "balanced") if options else "balanced",
                "max_bitrate": f"{platform_spec.bitrate_range[1]}k",
                "include_audio": True,
                "audio_quality": "balanced",
                "aspect_mode": "crop"  # Enable cropping mode
            }
            
            # Add platform-specific optimizations
            if platform_spec.optimization_priority == "size":
                target_spec["quality"] = "fast"
                target_spec["max_bitrate"] = f"{platform_spec.bitrate_range[0]}k"
            elif platform_spec.optimization_priority == "quality":
                target_spec["quality"] = "high_quality"
            
            # Process video with smart cropping enabled by default
            processing_options = {
                "enhance_quality": str(options.get("enhance_quality", True)) if options else True,
                "use_hw_accel": options.get("use_hw_accel", False) if options else False,
                "use_smart_crop": options.get("use_smart_crop", True) if options else True,  # 🎯 NEW: Enable smart crop
                "analysis_frames": options.get("analysis_frames", 5) if options else 5  # 🎯 NEW: Number of frames to analyze
            }
            
            logger.info(f"🎬 Optimizing for {platform_spec.name} with smart crop: {processing_options['use_smart_crop']}")
            
            result = self.media_processor.process_video(
                video_path, output_path, target_spec, processing_options
            )
            
            if not result["success"]:
                raise Exception(f"Video processing failed: {result['error']}")
            
            # Calculate metrics
            original_size = os.path.getsize(video_path)
            optimized_size = os.path.getsize(output_path)
            size_reduction = (original_size - optimized_size) / original_size
            logger.info(f"original size {original_size}. optimized size {optimized_size}: size reduction {size_reduction}")

            # Get applied optimizations
            applied_optimizations = self._get_video_optimizations(result, target_spec)
            
            # Add smart crop info if used
            if processing_options["use_smart_crop"] and "crop_info" in result:
                applied_optimizations.append("smart_cropped")

            return intelligence_pb2.OptimizeResponse(
                success=True,
                media_type="video",
                platform=platform_spec.name,
                applied_optimizations=applied_optimizations,
                optimized_url=output_path,
            )
            
        except Exception as e:
            return intelligence_pb2.OptimizeResponse(
                success=False,
                media_type="video",
                platform=platform_spec.name,
                optimized_url="",
                error=str(e)
            )
    
    def _get_video_optimizations(self, result: Dict[str, Any], target_spec: Dict[str, Any]) -> List[str]:
        """Get list of applied video optimizations"""
        optimizations = ["resolution_optimized", "codec_optimized", "bitrate_optimized"]
        
        strategy = result.get("processing_strategy", {})
        if strategy.get("needs_scaling"):
            optimizations.append("scaled")
        if strategy.get("needs_denoise"):
            optimizations.append("denoised")
        if strategy.get("needs_stabilization"):
            optimizations.append("stabilized")
        
        return optimizations
    