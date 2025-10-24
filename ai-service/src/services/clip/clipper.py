# src/services/clipping/clipping_service.py
import os
import logging
import threading
import uuid
from typing import List, Dict, Any, Optional, Union
from concurrent.futures import ThreadPoolExecutor, as_completed

import intelligence_pb2

logger = logging.getLogger(__name__)

class SmartClipper:
    """Clipping service for generating highlight clips"""
    
    def __init__(self):
        self._storage_manager = None
        self._clip_generator = None
        self._visual_overlay = None
        self._quality_presets = None
        
        self._music_mixer = None
        self._enhancer = None
        self._noise_service = None
        
        # self.temp_dir = tempfile.gettempdir()
        
        logger.info("ClippingService initialized")

    @property
    def enhancer(self):
        if self._enhancer is None:
            from ..enhancement.enhancer import MediaEnhancer
            self._enhancer = MediaEnhancer()
        return self._enhancer
    
    @property
    def music_mixer(self):
        if self._music_mixer is None:
            from src.utils.music_mixer import MusicMixer
            self._music_mixer = MusicMixer()
        return self._music_mixer
    
    @property
    def visual_overlay(self):
        if self._visual_overlay is None:
            from ..shared.visual_overlay import VisualOverlay
            self._visual_overlay = VisualOverlay()
        return self._visual_overlay
    
    @property
    def clip_generator(self):
        if self._clip_generator is None:
            from .clip_generator import ClipGenerator
            self._clip_generator = ClipGenerator()
        return self._clip_generator
    
    @property
    def quality_presets(self):
        if self._quality_presets is None:
            from ..shared.quality_presets import QualityPresets
            self._quality_presets = QualityPresets()
        return self._quality_presets


    @property
    def noise_service(self):
        if self._noise_service is None:
            from ..shared.noise_service import NoiseService
            self._noise_service = NoiseService()
        return self._noise_service

    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager
    
    def batch_generate_clips(
        self,
        options: List[Dict[str, Any]],
        branding: Optional[intelligence_pb2.BrandingOptions] = None,
        background_music: Optional[str] = None, 
        music_volume: str = "low",
        max_workers: int = 4
    ) -> Dict[str, Any]:    
        """Generate clips in batch with thread-safe file management use thread pool concurrency"""
        """
        [
            {
                "testimonial_id": "unique_id_123",
                "media_url": "https://example.com/video.mp4",
                "highlight_moments": [
                    {
                        "start_time": 1000,
                        "end_time": 5000,
                        "theme": "emotional",
                        "engagement_score": 0.9,
                        "remove_noise": True,
                        "enhance_clip": True,
                        "add_background_music": True
                    },
                    ...
                ]
            },
            ...
        ]
        """
        if not options:
            raise ValueError("No options provided for batch clip generation")
        logger.info(f"Starting batch clip generation for {len(options)} options")
        try:
            results = []
            optimal_workers = min(8, max(2, os.cpu_count() - 1))
            with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
                future_to_option = {
                    executor.submit(
                        self.generate_clips,
                        option['media_url'],
                        option['highlight_moments'],
                        branding=branding,
                        background_music=background_music,
                        music_volume=music_volume,
                        max_workers=max_workers,
                        testimonial_id=option.get('testimonial_id', None)
                    ): option for option in options
                }   
            for future in as_completed(future_to_option):
                option = future_to_option[future]
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    logger.error(f"Clip generation failed for {option['media_url']}: {e}")
                    results.append(result)
            logger.info(f"Batch clip generation completed: {len(results)} results")
            return results
        except Exception as e:
            logger.error(f"Batch clip generation failed: {e}")
            return results

    def generate_clips(
        self,
        media_url: str,
        highlight_moments: List[intelligence_pb2.HighlightMoment],
        branding: Optional[intelligence_pb2.BrandingOptions] = None,
        background_music: Optional[str] = None,
        music_volume: str = "low",
        max_workers: int = 4,
        testimonial_id: Union[str, None] = None,
        session_id: Union[str, None] = None,
    ) -> Dict[str, Any]:
        """Generate clips with thread-safe file management"""
        
        # SHARED RESOURCES: Download once, used by all threads, cleaned up at the end
        shared_resources = {
            'temp_files': [],
            'media_path': None,
            'music_path': None,
            'logo_path': None,
            'media_info': None,
            'session_id': session_id  # Add session_id to shared resources
        }
        
        try:
            logger.info(f"Starting clip generation for {len(highlight_moments)} moments")

            # Download and prepare shared resources BEFORE threading
            shared_resources['media_path'] = self.storage_manager.download_media(media_url)
            if not shared_resources['media_path'] or not os.path.exists(shared_resources['media_path']):
                raise FileNotFoundError(f"Media file not found: {shared_resources['media_path']}")
            shared_resources['temp_files'].append(shared_resources['media_path'])
            
            if not highlight_moments:
                raise ValueError("No highlight moments provided")
            
            # Get media info
            shared_resources['media_info'] = self.storage_manager.get_video_info(shared_resources['media_path'])
            if not shared_resources['media_info']:
                raise ValueError("Unable to analyze media file")

            # Download music if needed (shared across threads)
            if any(moment.add_background_music for moment in highlight_moments):
                shared_resources['music_path'] = self.music_mixer.get_music_path(background_music or "corporate", shared_resources['temp_files'])
                # if shared_resources['music_path']:
                #     shared_resources['temp_files'].append(shared_resources['music_path'])
                    
            # Download logo if needed (shared across threads)
            if branding and branding.logo_url:
                shared_resources['logo_path'] = self.storage_manager.download_media(branding.logo_url)
                if shared_resources['logo_path']:
                    shared_resources['temp_files'].append(shared_resources['logo_path'])
            
            # Generate clips in parallel with isolated file management
            clips = []
            failed_clips = []
            optimal_workers = min(8, max(2, os.cpu_count() - 1))

            with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
                # Submit all clip generation tasks with shared resources
                future_to_moment = {
                    executor.submit(
                        self._generate_single_clip,
                        shared_resources,  # Pass shared resources (read-only)
                        moment,
                        idx,
                        branding,
                        music_volume
                    ): (moment, idx)
                    for idx, moment in enumerate(highlight_moments)
                }
                
                # Collect results as they complete
                for future in as_completed(future_to_moment):
                    moment, idx = future_to_moment[future]
                    try:
                        result = future.result()
                        if result.error:
                            failed_clips.append(result)
                            logger.warning(f"Clip {idx} failed: {result.error}")
                        else:
                            clips.append(result)
                            logger.info(f"Clip {idx} completed successfully")
                    except Exception as e:
                        logger.error(f"Clip {idx} generation failed: {e}")
                        failed_clips.append(intelligence_pb2.Clip(
                            id=str(uuid.uuid4()),
                            url="", 
                            start_time=moment.start_time, 
                            end_time=moment.end_time,
                            title=f"Failed Clip {idx}", 
                            text=moment.text,
                            theme=moment.theme,
                            engagement_score=0.0, duration=0.0, size=0.0, error=str(e)
                        ))

            logger.info(f"Clip generation completed: {len(clips)} successful, {len(failed_clips)} failed")
            
            return intelligence_pb2.ClippingResponse(
                clips=clips
            )
            
        finally:
            # Clean up ONLY shared resources after ALL threads complete
            for temp_file in shared_resources['temp_files']:
                self._safe_cleanup(temp_file)   
            
            
    
    def _generate_single_clip(
        self,
        shared_resources: Dict[str, Any],  # Read-only shared resources
        moment: intelligence_pb2.HighlightMoment,
        clip_index: int,
        branding: Optional[intelligence_pb2.BrandingOptions],
        music_volume: str = "low"
    ) -> intelligence_pb2.Clip:
        """Generate single clip with completely isolated temp file management"""
        
        # THREAD ISOLATION: Each thread manages ONLY its own temporary files
        thread_id = threading.current_thread().ident
        thread_temp_files = []  # Files created and owned by THIS thread only
        final_clip = None
        
        try:
            logger.debug(f"Thread {thread_id}-{clip_index}: Starting clip generation for {moment.theme}")

            # Extract shared resources (read-only access)
            media_path = shared_resources['media_path']
            media_info = shared_resources['media_info'] 
            music_path = shared_resources['music_path']
            logo_path = shared_resources['logo_path']
            
            prepared_branding = self._prepare_branding_assets(logo_path, branding, moment)
            start_time = float(moment.start_time) / 1000
            end_time = float(moment.end_time) / 1000
            title = self._generate_clip_title(moment)

            cache_path = self.generate_clip_cache_key(shared_resources, moment, prepared_branding, music_volume)
            cache_url = self.storage_manager.get_public_url_for_object(cache_path)
            if self.storage_manager.check_url_exists(cache_url):
                logger.info(f"Thread {thread_id}-{clip_index}: Returning result from cache.")
                # CRITICAL: Use highlight ID as clip ID for deterministic matching
                return intelligence_pb2.Clip(
                    id=moment.id,  # Use highlight ID directly as clip ID
                    url=cache_url,
                    start_time=moment.start_time,
                    end_time=moment.end_time,
                    title=title,
                    text=moment.text,
                    theme=moment.theme,
                    engagement_score=float(getattr(moment, 'engagement_score', 0.5)),
                    duration=end_time - start_time,
                    highlight_id=moment.id,  # Keep this for backward compatibility
                    error=""
                )
            
            # Validate timing
            media_duration = float(media_info.get("duration", 0))
            if end_time > media_duration:
                logger.warning(f"Thread {thread_id}-{clip_index}: Adjusting end time from {end_time}s to {media_duration}s")
                end_time = media_duration
            
            if start_time >= end_time:
                raise Exception(f"Invalid time range: {start_time}s-{end_time}s")
            
            # Ensure minimum duration
            duration = end_time - start_time
            if duration < 1.5:
                logger.warning(f"Thread {thread_id}-{clip_index}: Extending short duration from {duration}s to 3s")
                end_time = start_time + 3.0
                if end_time > media_duration:
                    start_time = max(0, media_duration - 3.0)
                    end_time = media_duration

            # Generate base clip (THREAD-SPECIFIC FILE)
            base_clip = self.clip_generator.extract_clip(
                media_path, start_time, end_time, media_info
            )
            
            if not base_clip or not os.path.exists(base_clip):
                raise Exception("Base clip generation failed")
            
            thread_temp_files.append(base_clip)  # This thread owns this file
            current_clip = base_clip
            logger.debug(f"Thread {thread_id}-{clip_index}: Base clip created: {base_clip}")
            
            # Apply noise removal if requested (THREAD-SPECIFIC FILE)
            if moment.remove_noise:
                logger.info(f"Thread {thread_id}-{clip_index}: Applying noise removal")
                noise_result = self.noise_service.remove_noise(
                    input_path=current_clip,
                    output_path=None,
                    profile="high"
                )
                
                if noise_result and noise_result.get("success"):
                    processed_path = noise_result["output_path"]
                    thread_temp_files.append(processed_path)  # This thread owns this file
                    current_clip = processed_path
                    logger.info(f"Thread {thread_id}-{clip_index}: Noise removal completed")
                else:
                    logger.warning(f"Thread {thread_id}-{clip_index}: Noise removal failed, using original")


            if moment.enhance_clip:
                logger.info(f"Thread {thread_id}-{clip_index}: enhancing clip")
                enhancement_result = self.enhancer.enhance(
                    media_url=current_clip,
                    upload_to_cloud=False,
                    remove_noise = False,
                    clean_up=False,
                    # media_path, target_platform
                )
                if enhancement_result.get("success"):
                    enhanced_media_path = enhancement_result.get("enhanced_url")
                    thread_temp_files.append(enhanced_media_path)
                    current_clip = enhanced_media_path
                    logger.info(f"✅ Media enhancement successful")
                else:
                    # logger.warning(f"Media enhancement failed: {enhancement_result.get("error")}")
                    logger.warning("Media enhancement failed")
                    logger.warning(enhancement_result.get("error"))

            # Social media optimization (THREAD-SPECIFIC FILE)
            # social_ready = {}
            # if hasattr(moment, 'preferred_social') and moment.preferred_social:
            #     try:
            #         logger.info(f"Thread {thread_id}-{clip_index}: Optimizing for {moment.preferred_social}")
            #         optimization_result = self.platform_optimizer.optimize(
            #             media_url=current_clip,
            #             target_platform=moment.preferred_social,
            #             upload_to_cloud=False,
            #             remove_noise=False,
            #             add_background_music=False,
            #             enable_captions=False,
                        
            #         )
                    
            #         if optimization_result and hasattr(optimization_result, 'success') and optimization_result.success:
            #             optimized_path = optimization_result.optimized_url
            #             if optimized_path and os.path.exists(optimized_path):
            #                 thread_temp_files.append(optimized_path)  # This thread owns this file
            #                 current_clip = optimized_path
            #                 social_ready[moment.preferred_social] = True
            #                 logger.info(f"Thread {thread_id}-{clip_index}: Social optimization completed")
            #             else:
            #                 logger.warning(f"Thread {thread_id}-{clip_index}: Optimization result path invalid")
            #                 social_ready[moment.preferred_social] = False
            #         else:
            #             error_msg = getattr(optimization_result, 'error', 'Unknown error')
            #             logger.warning(f"Thread {thread_id}-{clip_index}: Social optimization failed: {error_msg}")
            #             social_ready[moment.preferred_social] = False
                        
            #     except Exception as e:
            #         logger.warning(f"Thread {thread_id}-{clip_index}: Social optimization error: {e}")
            #         social_ready[moment.preferred_social] = False
            
            # Apply visual overlays (THREAD-SPECIFIC FILE)
            logger.info(f"Thread {thread_id}-{clip_index}: Applying overlays to: {current_clip}")
            
            # CRITICAL: Validate file exists before overlay
            if not os.path.exists(current_clip):
                logger.error(f"Thread {thread_id}-{clip_index}: Current clip missing before overlay: {current_clip}")
                raise Exception(f"Current clip file not found: {current_clip}")
                
            final_clip = self.apply_overlay(
                current_clip, moment, thread_temp_files, prepared_branding, clip_index
            )

            if not final_clip or not os.path.exists(final_clip):
                logger.error(f"Thread {thread_id}-{clip_index}: Overlay failed, using current clip")
                final_clip = current_clip

            # Apply background music (THREAD-SPECIFIC FILE)
            if moment.add_background_music and music_path:
                logger.info(f"Thread {thread_id}-{clip_index}: Mixing background music")
                music_result = self.mix_music(
                    final_clip,
                    music_path,  # Shared file - read-only access
                    media_info,
                    clip_index,
                    thread_temp_files,  # Only this thread's files
                    music_volume
                )
                if music_result and os.path.exists(music_result):
                    thread_temp_files.append(music_result)  # This thread owns this file
                    final_clip = music_result
                    logger.info(f"Thread {thread_id}-{clip_index}: Music mixing completed")

            # Validate final clip
            if not final_clip or not os.path.exists(final_clip):
                raise Exception(f"Final clip file not found: {final_clip}")
            
            file_size = os.path.getsize(final_clip)
            if file_size < 1024:
                raise Exception("Final clip file too small")
            
            file_size_mb = round(file_size / (1024 * 1024), 2)
            
            # Upload to storage with retry
            final_url = ""
            if self.storage_manager:
                max_upload_retries = 2
                for attempt in range(max_upload_retries):
                    try:
                        # object_name = f"clips/{uuid.uuid4().hex}_{clip_index}_{moment.theme}.mp4"
                        final_url = self.storage_manager.upload_file_with_retry(final_clip, cache_path)
                        if final_url:
                            break
                    except Exception as e:
                        logger.warning(f"Thread {thread_id}-{clip_index}: Upload attempt {attempt + 1} failed: {e}")
                        if attempt == max_upload_retries - 1:
                            raise Exception("Storage upload failed after retries")

            # Generate title and calculate duration
            duration = (moment.end_time - moment.start_time) / 1000
            
            # Create successful result
            # CRITICAL: Use highlight ID as clip ID for deterministic matching
            result = intelligence_pb2.Clip(
                id=moment.id,  # Use highlight ID directly as clip ID
                url=final_url,
                start_time=moment.start_time,
                end_time=moment.end_time,
                title=title,
                text=moment.text,
                theme=moment.theme,
                engagement_score=float(getattr(moment, 'engagement_score', 0.5)),
                duration=duration,
                size = file_size_mb,
                highlight_id=moment.id,  # Keep this for backward compatibility
                error=""
            )
            
            logger.info(f"Thread {thread_id}-{clip_index}: Clip generated successfully")
            return result
            
        except Exception as e:
            logger.error(f"Thread {thread_id}-{clip_index}: Clip generation failed: {e}")
            # CRITICAL: Use highlight ID as clip ID for deterministic matching
            return intelligence_pb2.Clip(
                id=moment.id,  # Use highlight ID directly as clip ID
                url="",
                start_time=moment.start_time,
                end_time=moment.end_time,
                title=f"Failed Clip {clip_index}",
                text=moment.text,
                theme=moment.theme,
                engagement_score=0.0,
                duration=0.0,
                size=0.0,
                highlight_id=moment.id,  # Keep this for backward compatibility
                error=str(e)
            )
            
        finally:
            # THREAD-SAFE CLEANUP: Each thread cleans up ALL its own files
            # This includes final_clip since it's now uploaded to storage
            logger.debug(f"Thread {thread_id}-{clip_index}: Cleaning up {len(thread_temp_files)} temp files")
            for temp_file in thread_temp_files:
                if temp_file:
                    self._safe_cleanup(temp_file)

    def generate_clip_cache_key(self,
        shared_resources: Dict[str, Any],  # Read-only shared resources
        moment: intelligence_pb2.HighlightMoment,
        branding: Dict[str, Any],
        music_volume: str = "low"):
        """Generate deterministic cache key including brand colors"""
        import hashlib
        from urllib.parse import urlparse
        import re

        CLIPPER_ALGORITHM_VERSION = "v1.0"

        media_path = shared_resources['media_path']
        media_info = shared_resources['media_info']
        music_path = shared_resources['music_path']
        logo_path = shared_resources['logo_path']
        session_id = shared_resources.get('session_id')  # Get session_id from shared resources

        duration = str(media_info.get("duration", 0))
        title = self._generate_clip_title(moment)
        start_time = str(moment.start_time)
        end_time = str(moment.end_time)
        theme = moment.theme or ""
        add_music = "1" if moment.add_background_music else "0"

        brand_color = branding.get("brand_color", "")
        watermark_position = branding.get("watermark_config", {}).get("watermark_position", "")
        watermark_text = branding.get("watermark_config", {}).get("text", "")
        include_watermark = "1" if moment.include_watermark else "0"
        include_logo = "1" if moment.include_logo else "0"

        def normalize_url(url):
            if not url:
                return ""
            parsed_url = urlparse(url)
            media_id = f"{parsed_url.netloc}{parsed_url.path}"
            return media_id


        # CRITICAL FIX: Include moment.id to ensure each highlight generates a unique cache key
        # Without this, moments with similar timing can collide and use the wrong cached clip
        moment_id = moment.id or ""

        cache_data = (
            f"{CLIPPER_ALGORITHM_VERSION}|{normalize_url(media_path)}|"
            f"{duration}|{normalize_url(music_path)}|{normalize_url(logo_path)}|"
            f"{title}|{start_time}|{end_time}|{theme}|"
            f"{music_volume}|{add_music}|{brand_color}|"
            f"{watermark_position}|{watermark_text}|"
            f"{include_watermark}|{include_logo}|{moment_id}"
        )

        safe_theme = re.sub(r'[^\w\-_]', '_', theme)[:20]
        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()

        # If session_id is provided, upload to temp storage instead of permanent storage
        if session_id:
            return f"temp/sessions/{session_id}/clips/{cache_hash}_{safe_theme}.mp4"
        else:
            # Fallback to permanent storage for backward compatibility
            return f"clips/{cache_hash}_{safe_theme}.mp4"

    def apply_overlay(self, current_clip: str, moment, thread_temp_files: List[str], prepared_branding: Dict[str, Any], clip_index: int):  
        """Apply overlay with thread-safe file management"""
        thread_id = threading.current_thread().ident
        
        try:
            # CRITICAL: Validate input exists
            if not current_clip or not os.path.exists(current_clip):
                logger.error(f"Thread {thread_id}-{clip_index}: Input clip for overlay not found: {current_clip}")
                return current_clip
                
            logger.info(f"Thread {thread_id}-{clip_index}: Applying overlay to: {current_clip}")
            
            # Generate thread-safe output directory for overlay
            # overlay_output_dir = os.path.join(self.temp_dir, f"overlay_thread_{thread_id}_{clip_index}")
            # os.makedirs(overlay_output_dir, exist_ok=True)
            # overlay_output_path = settings.create_unique_temp_file("overlay", suffix=".mp4")
            
            overlay_clip = self.visual_overlay.apply_overlays(
                clip_path=current_clip,
                text="",
                theme=moment.theme if getattr(moment, 'include_theme', False) else "",
                logo_config=prepared_branding.get("logo_config"),
                watermark_config=prepared_branding.get("watermark_config"),
            )
            
            logger.info(f"Thread {thread_id}-{clip_index}: Overlay result: {overlay_clip}")
            
            if overlay_clip and os.path.exists(overlay_clip):
                thread_temp_files.append(overlay_clip)  # This thread owns this file
                
                logger.info(f"Thread {thread_id}-{clip_index}: Visual overlays applied successfully")
                return overlay_clip
            else:
                logger.warning(f"Thread {thread_id}-{clip_index}: Overlay failed, using base clip")
                return current_clip
                
        except Exception as e:
            logger.warning(f"Thread {thread_id}-{clip_index}: Overlay error: {e}, using base clip")
            return current_clip
    
    def _prepare_branding_assets(self, logo_path: str, branding: intelligence_pb2.BrandingOptions, highlight: intelligence_pb2.HighlightMoment) -> Dict[str, Any]:
        """Prepare branding assets for use"""
        assets = {}
        
        if logo_path and highlight.include_logo:
                    assets["logo_config"] = {"logo_path": logo_path}

        if highlight.include_watermark:
            assets["watermark_config"] = {
                "position": branding.watermark_position or "bottom-right",
                "text": "Cenphi"
            }

        assets["brand_color"] = branding.brand_color  
        return assets
    

    def mix_music(self, video_path: str, music_path: str, media_info: Dict[str, Any], 
                      clip_index: int, thread_temp_files: List[str], music_volume: str) -> str:
        """Mix music with thread-safe file management"""
        thread_id = threading.current_thread().ident
        
        try:
            if not music_path or not os.path.exists(music_path):
                logger.info(f"Thread {thread_id}-{clip_index}: No music path, returning original")
                return video_path

            logger.info(f"Thread {thread_id}-{clip_index}: Mixing music with video")
            
            # Create thread-specific output path
            # music_output = os.path.join(
            #     self.temp_dir, 
            #     f"music_mixed_thread_{thread_id}_{clip_index}_{uuid.uuid4().hex[:8]}.mp4"
            # )
            
            # Use music mixer but don't let it manage temp files
            mixed_result = self.music_mixer.mix_with_music(
                video_path,
                music_path,  # Shared file - read-only
                media_info,
                music_volume,
                f"thread_{thread_id}_{clip_index}"  # Unique story_id per thread
            )
            
            if mixed_result and mixed_result != video_path and os.path.exists(mixed_result):
                # Music mixer created a new file - we need to track it
                thread_temp_files.append(mixed_result)  # This thread owns this file
                logger.info(f"Thread {thread_id}-{clip_index}: Music mixing successful")
                return mixed_result
            else:
                logger.warning(f"Thread {thread_id}-{clip_index}: Music mixing failed, using original")
                return video_path
                
        except Exception as e:
            logger.warning(f"Thread {thread_id}-{clip_index}: Music mixing error: {e}, using original")
            return video_path

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
    
    def _generate_clip_title(self, moment: intelligence_pb2.HighlightMoment) -> str:
        """Generate an engaging title for the clip"""
        theme_titles = {
            "emotional": "💗 Heartfelt Moment",
            "entertaining": "🎉 Fun Highlight",
            "inspiring": "✨ Inspiring Story",
            "educational": "📚 Key Insight",
            "testimonial": "⭐ Customer Story",
            "success": "🚀 Success Story",
            "transformation": "🔄 Amazing Change",
            "roi": "💰 Great Results",
            "recommendation": "👍 Strong Recommendation"
        }
        
        base_title = theme_titles.get(moment.theme.lower(), "🎬 Highlight")
        
        # Add duration info for longer clips
        duration = (moment.end_time - moment.start_time) / 1000
        if duration > 30:
            return f"{base_title} ({int(duration)}s)"
        
        return base_title