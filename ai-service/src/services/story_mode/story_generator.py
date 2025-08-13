# ================================================================
# FILE: src/services/story_mode/complete_story_mode_generator.py
# ================================================================

import os
import uuid
import subprocess
import logging
import json
import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
from src.config.settings import settings
import threading

import intelligence_pb2

logger = logging.getLogger(__name__)

@dataclass
class ProcessedSegment:
    """Represents a processed video segment ready for story assembly"""
    video_path: str
    start_time: float
    end_time: float
    duration: float
    text_content: str
    theme: str
    include_logo: bool
    include_subtitle: bool
    include_watermark: bool
    metadata: Dict[str, Any]

class StoryModeGenerator:
    """
    ✅ Story video generator

    """
    
    def __init__(self):
        self._transition_engine = None
        self._narration_generator = None
        self._visual_overlay = None
        self._storage_manager = None
        self._music_mixer = None
        self._noise_service = None
        self._file_manager = None
        self._audio_normalizer = None
        self._ffmpeg_optimizer = None
        self.max_workers = min(4, os.cpu_count() or 1) + 2
        
        # ✅ SIMPLE: Basic standardized encoding (no exotic options)
        self.standard_encoding = {
            "video_codec": "libx264",
            "audio_codec": "aac",
            "preset": "fast",
            "crf": "20", # "crf": "20" - very high quality - lets use 23 (still high quality) to speed up
            "audio_bitrate": "192k", # changed from 192k to 128k from verh high quality to high quality to speed things up.
            "audio_sample_rate": "44100", # changed from 48000 to 44100 for speed
            "pixel_format": "yuv420p",
            "frame_rate": "30"
        }
        
        logger.info("✅ Story Mode Generator initialized")

    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer

    @property
    def transition_engine(self):
        if self._transition_engine is None:
            from .transition_engine import TransitionEngine
            self._transition_engine = TransitionEngine()
        return self._transition_engine
    
    @property
    def narration_generator(self):
        if self._narration_generator is None:
            from ..narration.narrator import NarrationGenerator
            self._narration_generator = NarrationGenerator()
        return self._narration_generator
    

    @property
    def visual_overlay(self):
        if self._visual_overlay is None:
            from ..shared.visual_overlay import VisualOverlay
            self._visual_overlay = VisualOverlay()
        return self._visual_overlay
    

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
    def music_mixer(self):
        if self._music_mixer is None:
            from src.utils.music_mixer import MusicMixer
            self._music_mixer = MusicMixer()
        return self._music_mixer
    
    @property
    def noise_service(self):
        if self._noise_service is None:
            from ..shared.noise_service import NoiseService
            self._noise_service = NoiseService()
        return self._noise_service
    
    @property
    def audio_normalizer(self):
        if self._audio_normalizer is None:
            from ..shared.audio_normalizer import AudioNormalizer
            self._audio_normalizer = AudioNormalizer()
        return self._audio_normalizer
    
    def batch_generate_stories(
        self,
        testimonial_segments: List[List[intelligence_pb2.TestimonialSegment]],
        brand_context: intelligence_pb2.BrandContext,
        output_format: str = "mp4",
        background_music: Optional[str] = "corporate",
        music_volume: str = "low",
        prompt: Optional[str] = None,
        add_background_music: Optional[bool] = True,
        intro_image_url: Optional[str] = None,
        outro_image_url: Optional[str] = None,
        company_name: Optional[str] = "Our Company"
    ) -> List[Dict[str, Any]]:
        """✅ Batch generate professional story videos using thread pool concurrency"""
        results = []
        start_time = time.time()
        logger.info(f"🚀 Starting batch story generation for {len(testimonial_segments)} segments"
                     f" with {self.max_workers} workers"
                     f" at {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time))}"
                     f" ({start_time:.2f} seconds since epoch)"
                     f" with company name: {company_name}")  
        try:
            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                futures = []
                for idx, segments in enumerate(testimonial_segments):
                    story_id = uuid.uuid4().hex
                    future = executor.submit(
                        self.generate_story_video,
                        segments,
                        brand_context,
                        output_format,
                        background_music,
                        music_volume,
                        prompt,
                        add_background_music,
                        intro_image_url,
                        outro_image_url,
                        company_name    
                    )
                    futures.append((idx, future, story_id))
                for idx, future, story_id in futures:
                    try:
                        result = future.result()
                        if result.get("success"):
                            results.append({
                                "story_id": story_id,
                                "story_video_url": result.get("story_video_url"),
                                "status": "success"
                            })
                        else:
                            results.append({
                                "story_id": story_id,
                                "error": result.get("error", "Unknown error"),
                                "status": "failed"
                            })
                    except Exception as e:
                        logger.error(f"❌ Error generating story {idx} ({story_id}): {str(e)}")
                        results.append({
                            "story_id": story_id,
                            "error": str(e),
                            "status": "failed"
                        })
        except Exception as e:
            logger.error(f"❌ Batch story generation failed: {str(e)}")
            return [{"error": str(e), "status": "failed"}]
        finally:
            elapsed_time = time.time() - start_time
            logger.info(f"✅ Batch story generation completed in {elapsed_time:.2f}s"   
                        f" at {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(time.time()))}"
                        f" ({time.time():.2f} seconds since epoch)")
            logger.info(f"📊 Generated {len(results)} stories with {sum(1 for r in results if r.get('status') == 'success')} successes"
                        f" and {sum(1 for r in results if r.get('status') == 'failed')} failures")
            self.file_manager.cleanup_all_temp_files()
    def generate_story_video(
        self,
        testimonial_segments: List[intelligence_pb2.TestimonialSegment],
        brand_context: intelligence_pb2.BrandContext,
        output_format: str = "mp4",
        background_music: Optional[str] = "corporate",
        music_volume: str = "low",
        prompt: Optional[str] = None,
        add_background_music: Optional[bool] = True,
        intro_image_url: Optional[str] = None,
        outro_image_url: Optional[str] = None,
        company_name: Optional[str] = "Our Company"
    ) -> Dict[str, Any]:
        """✅ Generate professional story video with working fixes"""
        
        story_id = str(uuid.uuid4())
        cache_key = self.generate_story_cache_key(testimonial_segments, brand_context, output_format, background_music,
                    music_volume, prompt, add_background_music, intro_image_url, outro_image_url, company_name
                )
        temp_files_local = []
        
        try:
            logger.info(f"🚀 Starting story generation: {story_id}")
            start_time = time.time()

           
            cache_url = self.storage_manager.get_public_url_for_object(f"stories/{cache_key}.{output_format}")
            if self.storage_manager.check_url_exists(cache_url):
                logger.info(f"✅ Using cached platform optimizer URL: stories/{cache_key[:12]}.{output_format}")
                return {
                    "success": True,
                    "story_video_url": cache_url,
                }
            
            # ✅ Step 1: Validate inputs
            if not testimonial_segments or len(testimonial_segments) == 0:
                return {"success": False, "error": "No testimonial segments provided"}
            
            # ✅ CHANGE: Run these 3 tasks in parallel
            with ThreadPoolExecutor(max_workers=3) as executor:
                music_future = executor.submit(
                    self._get_music_path, background_music, add_background_music, temp_files_local
                )
                segments_future = executor.submit(
                    self._process_segments, testimonial_segments, brand_context, temp_files_local
                )
                script_future = executor.submit(
                    self._generate_prompt_driven_script, testimonial_segments, brand_context, company_name, prompt
                )
                
                # Wait for all to complete
                music_path = music_future.result()
                processed_segments = segments_future.result()
                story_script = script_future.result()
            if not processed_segments:
                self._cleanup_temp_files(temp_files_local)
                return {"success": False, "error": "No valid video segments processed"}
            
            brand_colors = []
            try:
                if hasattr(brand_context, 'color_slice') and brand_context.color_slice:
                    brand_colors = list(brand_context.color_slice)
            except Exception as e:
                logger.debug(f"Could not extract brand colors: {e}")
                brand_colors = []

            # ✅ Create intro and outro in parallel
            with ThreadPoolExecutor(max_workers=2) as executor:
                intro_future = executor.submit(
                    self._get_cached_intro_or_create, brand_colors, company_name, story_script, temp_files_local, intro_image_url
                )
                outro_future = executor.submit(
                    self._get_cached_outro_or_create, brand_colors, company_name, story_script, temp_files_local, outro_image_url
                )
                
                intro_video_path = intro_future.result()
                outro_video_path = outro_future.result()

            # intro_video_path = ""
            # outro_video_path = ""
            
            # ✅ Steps 7-12: Rest remains sequential (dependencies)
            main_story_path = self._combine_segments_with_transitions(
                processed_segments, story_id, temp_files_local
            )
            
            assembled_story_path = self._assemble_complete_story(
                intro_video_path, main_story_path, outro_video_path, story_id, temp_files_local
            )
            
            branded_story_path = self._apply_story_level_branding(
                assembled_story_path, brand_context, story_id, temp_files_local
            )

            media_info = self.storage_manager.get_video_info(branded_story_path)
            # final_story_path = branded_story_path
            final_story_path = self.music_mixer.mix_music_with_cleanups(branded_story_path,
                    music_path, media_info, story_id, temp_files_local, music_volume)
            
            final_story_path = self.noise_service.process_with_denoising(final_story_path, 
                        "medium", temp_files_local, story_id)
            
            # final_story_path = self._add_background_music_professional(
            #     branded_story_path, music_path, music_volume, story_id, temp_files_local
            # )
            
            encoded_story_path = self._apply_studio_encoding(
                final_story_path, output_format, story_id, temp_files_local
            )
            
            object_name = f"stories/{cache_key}.{output_format}"
            story_video_url = self.storage_manager.upload_file_with_retry(encoded_story_path, object_name)
            
            temp_files_local.append(encoded_story_path)
            self._cleanup_temp_files(temp_files_local)
            
            processing_time = time.time() - start_time
            
            if not story_video_url:
                return {"success": False, "error": "Failed to upload story video"}
            
            logger.info(f"✅ Story generation completed in {processing_time:.2f}s: {story_id}")
            return {
                "success": True,
                "story_video_url": story_video_url,
            }
            
        except Exception as e:
            self._cleanup_temp_files(temp_files_local)
            logger.error(f"❌ Story generation failed: {str(e)}")
            return {"success": False, "error": f"Story generation failed: {str(e)}"}
        finally:
            # Ensure all temp files are cleaned up
            self._cleanup_temp_files(temp_files_local)
            self.file_manager.cleanup_all_temp_files()

    
    def generate_story_cache_key(self,
        testimonial_segments: List[intelligence_pb2.TestimonialSegment],
        brand_context: intelligence_pb2.BrandContext,
        output_format: str = "mp4",
        background_music: Optional[str] = "corporate",
        music_volume: str = "low",
        prompt: Optional[str] = None,
        add_background_music: Optional[bool] = True,
        intro_image_url: Optional[str] = None,
        outro_image_url: Optional[str] = None,
        company_name: Optional[str] = "Our Company"
    ):
        """Generate deterministic cache key including brand colors"""
        import hashlib
        import json

        STORY_ALGORITHM_VERSION = "v1.0"

        logo_url = getattr(brand_context, 'logo_url', "")
        brand_colors = []
        if hasattr(brand_context, 'color_slice') and brand_context.color_slice:
                brand_colors = list(brand_context.color_slice)
        colors = "|".join(brand_colors)
        prompt = prompt[:100] if prompt else ""


        # ----- deterministic hash for testimonial_segments -----
        if testimonial_segments:
            cache_segments = [
                self._extract_segment_cache_data(seg) for seg in testimonial_segments
            ]
            segs_json = json.dumps(cache_segments, sort_keys=True, separators=(",", ":"))
            segs_hash = hashlib.sha256(segs_json.encode()).hexdigest()[:16]
        else:
            segs_hash = "empty"
        
        cache_data = (
            f"{STORY_ALGORITHM_VERSION}|{prompt}|{intro_image_url or ''}|{segs_hash}|{logo_url}|{colors}|{outro_image_url or ''}" 
            f"|{background_music or ''}|{music_volume or ''}|{company_name}|{str(add_background_music)}|{output_format}"
        )
        
        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()
        return cache_hash
    
    def _extract_segment_cache_data(self, segment: intelligence_pb2.TestimonialSegment):
        """Extract only cache-relevant data from segment"""
        from urllib.parse import urlparse
        
        # Normalize media URL
        media_id = ""
        if segment.media_url:
            parsed_url = urlparse(segment.media_url)
            media_id = f"{parsed_url.netloc}{parsed_url.path}"
        
        # Extract only fields that affect output
        return {
            "media_id": media_id,
            "highlights": [
                {
                    "start_time": h.start_time,
                    "end_time": h.end_time,
                    "text": h.text,
                    "theme": h.theme,
                    "include_logo": h.include_logo,
                    "include_subtitle": h.include_subtitle,
                    "include_watermark": h.include_watermark
                    # Don't include fields that don't affect output
                }
                for h in segment.highlights
            ]
        }

    def _process_segments(
        self,
        segments: List[intelligence_pb2.TestimonialSegment],
        brand_context: intelligence_pb2.BrandContext,
        temp_files: List[str]
    ) -> List[ProcessedSegment]:
        """✅ Process segments with working voice sync"""
        
        logger.info(f"🔄 Processing {len(segments)} segments in parallel")
        start_time = time.time()
        
        def process_single_segment(segment_data):
            segment_idx, segment = segment_data
            segment_results = []
            segment_temp_files = []
            
            try:
                # Download media for this segment
                local_media_path = self.storage_manager.download_media(segment.media_url)
                segment_temp_files.append(local_media_path)
                
                # Process highlights for this segment
                for highlight_idx, highlight in enumerate(segment.highlights):
                    clip_id = f"{segment_idx}_{highlight_idx}"
                    logger.info(f"EXTRACTING SEGMENT {highlight_idx}")
                    # ✅ Extract with working sync method
                    clip_path = self._extract_highlight_clip(
                        local_media_path, highlight.start_time/1000 , highlight.end_time/1000, 
                        clip_id, segment_temp_files
                    )
                    logger.info(f"Got clip path {clip_path}")
                    if clip_path:
                        # NORMALIZE AUDIO LEVELS
                        normalize_result = self.audio_normalizer.normalize_audio(
                            media_path=clip_path,
                            target_platform="youtube_standard",  # Consistent -23 LUFS
                            preserve_dynamics=True
                        )
                        
                        if normalize_result.success:
                            clip_path = normalize_result.normalized_path
                            temp_files.append(clip_path)
                            logger.info(f"✅ Audio normalized: {normalize_result.original_loudness:.1f} → {normalize_result.target_loudness:.1f} LUFS")
                            
                        # Apply branding with consistent encoding
                        branded_clip_path = self._apply_highlight_level_branding(
                            clip_path, highlight, brand_context, clip_id, segment_temp_files
                        )
                        
                        segment_results.append(ProcessedSegment(
                            video_path=branded_clip_path,
                            start_time=highlight.start_time / 1000,
                            end_time=highlight.end_time / 1000,
                            duration=(highlight.end_time - highlight.start_time) / 1000,
                            text_content=highlight.text,
                            theme=highlight.theme,
                            include_logo=highlight.include_logo,
                            include_subtitle=highlight.include_subtitle,
                            include_watermark=highlight.include_watermark,
                            metadata={
                                "source_url": segment.media_url,
                                "segment_index": segment_idx,
                                "highlight_index": highlight_idx,
                                "original_start_time": highlight.start_time / 1000,
                                "original_end_time": highlight.end_time / 1000
                            }
                        ))
                
                return segment_results, segment_temp_files
                
            except Exception as e:
                logger.warning(f"Segment {segment_idx} processing failed: {e}")
                return [], segment_temp_files
        
        # Process all segments in parallel
        processed_segments = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            segment_data = [(idx, segment) for idx, segment in enumerate(segments)]
            
            # Submit all segment processing tasks
            futures = [
                executor.submit(process_single_segment, data) 
                for data in segment_data
            ]
            
            # Collect results as they complete
            for future in as_completed(futures):
                try:
                    segment_results, segment_temp_files = future.result()
                    processed_segments.extend(segment_results)
                    temp_files.extend(segment_temp_files)
                except Exception as e:
                    logger.warning(f"Segment processing failed: {e}")

        if processed_segments:
            logger.info("🔄 Sorting segments chronologically...")
            processed_segments.sort(key=lambda seg: (seg.start_time, seg.end_time))

            logger.info("📋 Final segment order:")
            for i, seg in enumerate(processed_segments[:5]):  # Log first 5
                logger.info(f"  {i+1}: {seg.start_time:.1f}s-{seg.end_time:.1f}s "
                       f"(segment_{seg.metadata['segment_index']}_{seg.metadata['highlight_index']}) "
                       f"- {seg.text_content[:50]}...")
        
        processing_time = time.time() - start_time
        logger.info(f"✅ Processed {len(processed_segments)} highlights in CHRONOLOGICAL TIME order in {processing_time:.2f}s")
        
        return processed_segments

    def _extract_highlight_clip(
        self, 
        media_path: str, 
        start_time: float, 
        end_time: float, 
        clip_id: str,
        temp_files: List[str]
    ) -> Optional[str]:
        """✅ Extract clips with debug information"""
        
        try:
            # ✅ Debug the exact values being passed
            logger.info(f"🔍 DEBUG {clip_id}: start_time={start_time}, end_time={end_time}, type(start_time)={type(start_time)}")
            
            # Check if timing values are actually numbers
            if not isinstance(start_time, (int, float)) or not isinstance(end_time, (int, float)):
                logger.error(f"❌ {clip_id}: Invalid timing types - start_time={type(start_time)}, end_time={type(end_time)}")
                return None
            
            # ✅ More robust timing validation
            if start_time < 0:
                start_time = 0.0
            if end_time <= start_time:
                logger.warning(f"Invalid timing for clip {clip_id}: {start_time}-{end_time}s")
                return None
            
            duration = end_time - start_time
            if duration < 0.5:  # ✅ Minimum 0.5s instead of 1.0s
                logger.warning(f"Duration too short for clip {clip_id}: {duration}s")
                return None
            
            # ✅ Check if source video file exists and get its duration
            if not os.path.exists(media_path):
                logger.error(f"❌ {clip_id}: Source media file does not exist: {media_path}")
                return None
            
            # Get source video duration for validation
            # source_duration = self.storage_manager.get_video_duration(media_path)
            video_info = self.storage_manager.get_video_info(media_path)
            source_duration = video_info.get("duration", 0)

            if source_duration <= 0:
                logger.error(f"❌ {clip_id}: Could not get source video duration")
                return None
            
            if start_time >= source_duration:
                logger.error(f"❌ {clip_id}: start_time {start_time}s >= source duration {source_duration}s")
                return None
            
            if end_time > source_duration:
                logger.warning(f"⚠️ {clip_id}: end_time {end_time}s > source duration {source_duration}s, adjusting")
                end_time = source_duration
                duration = end_time - start_time
            
            logger.info(f"✅ {clip_id}: Valid timing - {start_time}s to {end_time}s ({duration}s) from {source_duration}s video")
            
            # output_path = os.path.join(tempfile.gettempdir(), f"working_sync_{clip_id}_{uuid.uuid4().hex}.mp4")
            output_path = self.file_manager.create_temp_video("storyclip_")
            
            # ✅ Completely revised FFmpeg command
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_time),  # Seek before input for speed
                "-i", media_path,
                "-t", str(duration),     # Duration after input
                
                # ✅ Replace ALL deprecated options
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", "fast",  # ✅ Use faster preset for clips
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                "-af", "volume=1.3",
                
                # ✅ Replace deprecated -vsync and -async
                "-fps_mode", "cfr",         # ✅ Modern replacement for -vsync cfr
                "-af", "aresample=async=1", # ✅ Modern replacement for -async
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # ✅ Log the exact command being run
            logger.info(f"🚀 {clip_id}: Running FFmpeg command: {' '.join(cmd[:10])}...")
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=180, video_info=video_info)
            
            # ✅ Detailed result logging
            logger.info(f"📊 {clip_id}: FFmpeg return code: {result.returncode}")
            if result.stdout:
                logger.debug(f"📝 {clip_id}: FFmpeg stdout: {result.stdout[:500]}")
            if result.stderr:
                logger.debug(f"⚠️ {clip_id}: FFmpeg stderr: {result.stderr[:500]}")
            
            if result.returncode == 0 and os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                logger.info(f"✅ {clip_id}: Output file created - size: {file_size} bytes")
                
                if file_size > 1000:
                    temp_files.append(output_path)
                    logger.info(f"🎉 {clip_id}: Clip extraction SUCCESSFUL")
                    return output_path
                else:
                    logger.error(f"❌ {clip_id}: Output file too small: {file_size} bytes")
                    return None
            else:
                logger.error(f"❌ {clip_id}: FFmpeg failed - return code: {result.returncode}")
                logger.error(f"❌ {clip_id}: FFmpeg stderr: {result.stderr}")
                return None
            
        except Exception as e:
            logger.error(f"💥 {clip_id}: Exception during extraction: {str(e)}")
            import traceback
            logger.error(f"💥 {clip_id}: Traceback: {traceback.format_exc()}")
            return None
        
    def _get_cached_intro_or_create(self, brand_colors: List[str], company_name: str, 
                                    story_script: str, temp_files: List[str], intro_image_url: str):
        """Check storage for cached intro, create if not exists"""

        intro_text = story_script["intro_text"]
        # 1. Generate deterministic cache key
        cache_key = self._generate_intro_cache_key(company_name, intro_image_url, intro_text, brand_colors)
        cache_path = f"cache/intros/{cache_key}.mp4"
        
        # 2. Try to download cached version
        cache_url = self.storage_manager.get_public_url_for_object(cache_path)
        # if self.storage_manager.check_url_exists(cache_url):
        #     logger.info(f"✅ Using cached intro URL: {cache_key}")
        #     return cache_url 
        try:
            path = self.storage_manager.download_media_if_exists(cache_url)
            if path and os.path.exists(path):
                logger.info(f"✅ Using cached intro URL: {cache_key}")
                temp_files.append(path)
                return path
        except:
            pass # Cache miss, create new
        
        # 3. Create new intro
        logger.info(f"🔄 Creating new intro: {cache_key}")
        intro_path = self._create_professional_intro(
            brand_colors, company_name, story_script, temp_files, intro_image_url
        )
        
        # 4. Upload to cache location
        if intro_path:
            # self.storage_manager.upload_file_with_retry(intro_path, cache_path)
            # logger.info(f"💾 Cached intro: {cache_key}")
            threading.Thread(
                target=lambda: self.storage_manager.upload_file_with_retry(intro_path, cache_path),
                daemon=True
            ).start()
            logger.info(f"💾 Started background cache upload: {cache_key}")
        
        return intro_path
    

    def _get_cached_outro_or_create(self, brand_colors: List[str], company_name: str, 
                                    story_script: str, temp_files: List[str], outro_image_url: str):
        """Check storage for cached outro, create if not exists"""
        
        outro_text = story_script["outro_text"]
        # 1. Generate deterministic cache key for outro
        cache_key = self._generate_outro_cache_key(company_name, outro_image_url, outro_text, brand_colors)
        cache_path = f"cache/outros/{cache_key}.mp4"
        
        # 2. Try to download cached version
        # try:
        #     path = f"https://objectstorage.{settings.oci_region}.oraclecloud.com/n/{settings.oci_namespace}/b/{settings.oci_bucket_name}/o/{cache_path}"
        #     cached_file = self.storage_manager.download_media_if_exists(path)
        #     if cached_file and os.path.exists(cached_file):
        #         logger.info(f"✅ Using cached outro: {cache_key}")
        #         temp_files.append(cached_file)
        #         return cached_file
        # except:
        #     pass  # Cache miss, create new
        cache_url = self.storage_manager.get_public_url_for_object(cache_path)
        # if self.storage_manager.check_url_exists(cache_url):
        #     logger.info(f"✅ Using cached intro URL: {cache_key}")
        #     return cache_url 
        try:
            path = self.storage_manager.download_media_if_exists(cache_url)
            if path and os.path.exists(path):
                logger.info(f"✅ Using cached intro URL: {cache_key}")
                temp_files.append(path)
                return path
        except:
            pass # Cache miss, create new
        
        # 3. Create new outro
        logger.info(f"🔄 Creating new outro: {cache_key}")
        outro_path = self._create_professional_outro(brand_colors, company_name, story_script, temp_files, outro_image_url)
        
        # 4. Upload to cache location
        if outro_path:
            # self.storage_manager.upload_file(outro_path, cache_path)
            # logger.info(f"💾 Cached outro: {cache_key}")
            threading.Thread(
                target=lambda: self.storage_manager.upload_file_with_retry(outro_path, cache_path),
                daemon=True
            ).start()
            logger.info(f"💾 Started background cache upload: {cache_key}")
        

    def _generate_intro_cache_key(self, company_name, intro_image_url, intro_text, brand_colors):
        """Generate deterministic cache key including brand colors"""
        import hashlib
        
        # Include brand colors in cache key
        colors_str = "|".join(sorted(brand_colors)) if brand_colors else "default"
        cache_data = f"{company_name}|{intro_image_url or 'none'}|{intro_text[:100]}|{colors_str}"
        
        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()[:12]
        safe_company = "".join(c for c in company_name if c.isalnum())[:20]
        return f"{safe_company}_{cache_hash}"

    def _generate_outro_cache_key(self, company_name, outro_image_url, outro_text, brand_colors):
        """Generate deterministic cache key for outro including brand colors"""
        import hashlib
        
        # Include brand colors in cache key
        colors_str = "|".join(sorted(brand_colors)) if brand_colors else "default"
        cache_data = f"{company_name}|{outro_image_url or 'none'}|{outro_text[:100]}|{colors_str}"
        
        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()[:12]
        safe_company = "".join(c for c in company_name if c.isalnum())[:20]
        return f"{safe_company}_outro_{cache_hash}"

    def _apply_highlight_level_branding(
        self,
        clip_path: str,
        highlight: intelligence_pb2.HighlightMoment,
        brand_context: intelligence_pb2.BrandContext,
        clip_id: str,
        temp_files: List[str]
    ) -> str:
        """✅ Apply branding with corrected FFmpeg options"""
        
        try:
            # If no branding needed, return original
            if not (highlight.include_logo or highlight.include_subtitle or highlight.include_watermark):
                return clip_path
            
            # output_path = os.path.join(tempfile.gettempdir(), f"branded_{clip_id}_{uuid.uuid4().hex}.mp4")
            output_path = self.file_manager.create_temp_video(f"branded_{clip_id}_")
            
            # Build filter for branding
            filters = []
            
            if highlight.include_subtitle and highlight.text:
                # Add subtitle
                text_escaped = highlight.text.replace("'", "\\'").replace(":", "\\:")
                filters.append(
                    f"drawtext=text='{text_escaped}':fontsize=24:"
                    f"fontcolor=white:x=(w-text_w)/2:y=h-60:box=1:boxcolor=black@0.5:boxborderw=5"
                )
            
            # Combine filters
            if filters:
                filter_complex = ",".join(filters)
            else:
                filter_complex = "null"  # No-op filter
            
            cmd = [
                "ffmpeg", "-y",
                "-i", clip_path,
                "-vf", filter_complex,
                
                # ✅ Use corrected FFmpeg options
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", self.standard_encoding["preset"],
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                
                # ✅ Replace deprecated options
                "-async", "1",
                "-fps_mode", "cfr",  # ✅ Replace -vsync cfr
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0 and os.path.exists(output_path):
                temp_files.append(output_path)
                return output_path
            else:
                logger.warning(f"Branding failed for {clip_id}, using original")
                return clip_path
                
        except Exception as e:
            logger.warning(f"Branding failed for {clip_id}: {e}")
            return clip_path

    def _combine_segments_with_transitions(
        self,
        segments: List[ProcessedSegment],
        story_id: str,
        temp_files: List[str]
    ) -> Optional[str]:
        """✅ Combine segments with proper ordering"""
        
        try:
            # ✅ ENSURE: Segments are in proper order (if not already sorted)
            if not segments:
                return None
            
            # ✅ OPTIONAL: Re-sort if needed (in case they got mixed up somewhere)
            segments.sort(key=lambda seg: (
                seg.metadata.get("segment_index", 0),
                seg.metadata.get("highlight_index", 0)
            ))
            
            video_paths = [seg.video_path for seg in segments]
            
            logger.info(f"🔄 Combining {len(video_paths)} segments in CORRECT order")
            
            # ✅ DEBUG: Log the order being used
            for i, seg in enumerate(segments[:3]):  # Log first 3
                logger.info(f"  Order {i}: {seg.metadata.get('segment_index')}_{seg.metadata.get('highlight_index')} "
                        f"({seg.start_time:.1f}s) - {seg.text_content[:30]}...")
            
            if len(video_paths) == 1:
                return video_paths[0]
            
            # Rest of your existing combination logic...
            normalized_paths = self._normalize_video_streams(video_paths, story_id, temp_files)
            
            # output_path = os.path.join(tempfile.gettempdir(), f"main_story_{story_id}.mp4")
            output_path = self.file_manager.create_temp_video("main_story_")
            
            # Try transition engine with normalized videos
            moment_data = [{"theme": seg.theme} for seg in segments]
            
            result = self.transition_engine.combine_clips_with_transitions(
                clip_paths=normalized_paths,
                moments=moment_data,
                output_path=output_path,
                auto_select_transitions=True,
                transition_duration=1.0,
                enable_audio_sync=True,
                temp_files=temp_files,
            )
            
            if result.get("success") and os.path.exists(output_path):
                temp_files.append(output_path)
                logger.info("✅ Segments combined in CORRECT chronological order")
                return output_path
            
            # Fallback to working concatenation
            return self._fallback_concatenation(normalized_paths, story_id, temp_files)
            
        except Exception as e:
            logger.error(f"Segment combination failed: {e}")
            return self._fallback_concatenation(video_paths, story_id, temp_files)

    def _normalize_video_streams(
        self,
        video_paths: List[str],
        story_id: str,
        temp_files: List[str]
    ) -> List[str]:
        """✅ Normalize videos with working parameters only"""
        
        normalized_paths = []
        
        try:
            for i, video_path in enumerate(video_paths):
                # normalized_path = os.path.join(
                #     tempfile.gettempdir(),
                #     f"normalized_{story_id}_{i}_{uuid.uuid4().hex}.mp4"
                # )
                normalized_path = self.file_manager.create_temp_video(f"normalized_{story_id}_")
                
                # ✅ Use only working FFmpeg options
                cmd = [
                    "ffmpeg", "-y",
                    "-i", video_path,
                    
                    # ✅ Standard encoding parameters
                    "-c:v", self.standard_encoding["video_codec"],
                    "-preset", self.standard_encoding["preset"],
                    "-crf", self.standard_encoding["crf"],
                    "-pix_fmt", self.standard_encoding["pixel_format"],
                    "-r", self.standard_encoding["frame_rate"],
                    
                    # ✅ Standard audio parameters
                    "-c:a", self.standard_encoding["audio_codec"],
                    "-b:a", self.standard_encoding["audio_bitrate"],
                    "-ar", self.standard_encoding["audio_sample_rate"],
                    "-ac", "2",
                    
                    # ✅ Only basic, working sync options
                    "-async", "1",
                    "-fps_mode", "cfr",
                    "-avoid_negative_ts", "make_zero",
                    "-movflags", "+faststart",
                    
                    normalized_path
                ]
                
                # result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
                result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=180)
                
                if result.returncode == 0 and os.path.exists(normalized_path):
                    normalized_paths.append(normalized_path)
                    temp_files.append(normalized_path)
                    logger.debug(f"✅ Video {i} normalized successfully")
                else:
                    logger.warning(f"Video normalization failed for {i}: {result.stderr}")
                    normalized_paths.append(video_path)  # Use original
            
            return normalized_paths
            
        except Exception as e:
            logger.error(f"Video normalization failed: {e}")
            return video_paths  # Fallback to originals

    def _fallback_concatenation(
        self,
        video_paths: List[str],
        story_id: str,
        temp_files: List[str]
    ) -> Optional[str]:
        """✅ Working concatenation with proven parameters"""
        
        try:
            # output_path = os.path.join(tempfile.gettempdir(), f"concatenated_{story_id}.mp4")
            # concat_file = os.path.join(tempfile.gettempdir(), f"concat_{story_id}.txt")

            output_path = self.file_manager.create_temp_video("concatenated_")
            concat_file = self.file_manager.create_temp_file(suffix=".txt", prefix="concat_")
            
            # ✅ Create concat file with absolute paths
            with open(concat_file, 'w') as f:
                for video_path in video_paths:
                    abs_path = os.path.abspath(video_path)
                    f.write(f"file '{abs_path}'\n")
            
            # ✅ Use only proven, working FFmpeg options
            cmd = [
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                
                # ✅ Force re-encoding for compatibility
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", self.standard_encoding["preset"],
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                # ✅ Standard audio processing
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                
                # ✅ SIMPLE: Only basic sync options that work
                "-async", "1",
                "-fps_mode", "cfr",
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=600)
            
            temp_files.extend([output_path, concat_file])
            
            if result.returncode == 0 and os.path.exists(output_path):
                logger.info("✅ Working concatenation successful")
                return output_path
            else:
                logger.error(f"Concatenation failed: {result.stderr}")
                return video_paths[0] if video_paths else None
            
        except Exception as e:
            logger.error(f"Working concatenation failed: {e}")
            return video_paths[0] if video_paths else None

    def _create_professional_intro(
        self,
        brand_colors: List[str],
        company_name: str,
        story_script: Dict[str, str],
        temp_files: List[str],
        intro_image_url: Optional[str] = None
    ) -> Optional[str]:
        """✅ Create professional intro with enhanced visuals"""
        logger.info("creating professional intro")
        try:
            intro_text = story_script["intro_text"]
            logger.info(f"intro text {intro_text}")
            # Generate narration for intro
            narration_result = self.narration_generator.generate(
                text=intro_text,
                voice_id="nova",
                language="en",
                gender="female",
                style="professional",
                background_music=None,
                music_volume="low",
                preferred_provider="openai",
                upload_to_cloud=False
            )
            
            if not narration_result.get("audio_path"):
                logger.warning("Intro narration generation failed")
                return None
            
            audio_path = narration_result["audio_path"]
            temp_files.extend(narration_result.get("temp_files", []))
            temp_files.append(audio_path)
            
            # Get audio duration
            audio_duration = self._get_audio_duration(audio_path)
            if audio_duration <= 0:
                logger.warning("Could not determine audio duration")
                return None
            
            # intro_video_path = os.path.join(tempfile.gettempdir(), f"intro_{uuid.uuid4().hex}.mp4")
            intro_video_path = self.file_manager.create_temp_video("intro_")
            
            # Determine visual approach
            if intro_image_url:
                return self._create_image_based_intro(
                    intro_video_path, audio_path, audio_duration, 
                    intro_image_url, company_name, intro_text, temp_files
                )
            else:
                return self._create_enhanced_text_intro(
                    intro_video_path, audio_path, audio_duration,
                    company_name, intro_text, brand_colors, temp_files
                )
                
        except Exception as e:
            logger.warning(f"Professional intro creation failed: {e}")
            return None

    def _create_professional_outro(
        self,
        brand_colors: List[str],
        company_name: str,
        story_script: Dict[str, str],
        temp_files: List[str],
        outro_image_url: Optional[str] = None
    ) -> Optional[str]:
        """✅ Create professional outro with enhanced visuals"""
        
        try:
            outro_text = story_script["outro_text"]
            
            # Generate narration for outro
            narration_result = self.narration_generator.generate(
                text=outro_text,
                voice_id="nova",
                language="en",
                gender="female", 
                style="professional",
                background_music=None,
                music_volume="low",
                preferred_provider="openai",
                upload_to_cloud=False
            )
            
            if not narration_result.get("audio_path"):
                logger.warning("Outro narration generation failed")
                return None
            
            audio_path = narration_result["audio_path"]
            temp_files.extend(narration_result.get("temp_files", []))
            temp_files.append(audio_path)
            
            # Get audio duration
            audio_duration = self._get_audio_duration(audio_path)
            if audio_duration <= 0:
                logger.warning("Could not determine outro audio duration")
                return None
            
            # outro_video_path = os.path.join(tempfile.gettempdir(), f"outro_{uuid.uuid4().hex}.mp4")
            outro_video_path = self.file_manager.create_temp_video("outro_")
            
            # Determine visual approach
            if outro_image_url:
                return self._create_image_based_outro(
                    outro_video_path, audio_path, audio_duration,
                    outro_image_url, company_name, outro_text, temp_files
                )
            else:
                return self._create_enhanced_text_outro(
                    outro_video_path, audio_path, audio_duration,
                    company_name, outro_text, brand_colors, temp_files
                )
                
        except Exception as e:
            logger.warning(f"Professional outro creation failed: {e}")
            return None

    def _create_image_based_intro(
        self,
        output_path: str,
        audio_path: str,
        duration: float,
        image_url: str,
        company_name: str,
        intro_text: str,
        temp_files: List[str]
    ) -> Optional[str]:
        """Create intro with background image"""
        
        try:
            # Download image
            # image_path = self.storage_manager.download_media(image_url)
            # temp_files.append(image_path)
            
            # ✅ Safe text escaping and simplified approach
            safe_company_name = company_name.replace("'", "\\'").replace(":", "\\:")
            
            # ✅ Simple, reliable video filter 
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", image_url,
                "-i", audio_path,
                "-vf", (
                    f"scale=1920:1080:force_original_aspect_ratio=increase,"
                    f"crop=1920:1080,"
                    f"boxblur=3:1,"  # ✅ Simplified blur syntax
                    f"drawbox=x=0:y=0:w=iw:h=ih:color=black@0.4:t=fill,"  # Dark overlay
                    f"drawtext=text='{safe_company_name}':"
                    f"fontsize=50:fontcolor=white:"  # ✅ No font specification
                    f"x=(w-text_w)/2:y=h*0.3:"
                    f"shadowcolor=black@0.8:shadowx=3:shadowy=3,"
                    f"drawtext=text='Welcome':"
                    f"fontsize=80:fontcolor=white:"
                    f"x=(w-text_w)/2:y=h*0.5:"
                    f"shadowcolor=black@0.8:shadowx=4:shadowy=4"
                ),
                
                # Standard encoding
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", self.standard_encoding["preset"],
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                
                "-shortest",
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0 and os.path.exists(output_path):
                temp_files.append(output_path)
                logger.info(f"✅ Image-based intro created (duration: {duration:.2f}s)")
                return output_path
            else:
                logger.error(f"Image intro creation failed: {result.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"Image-based intro failed: {e}")
            return None

    def _create_enhanced_text_intro(
        self,
        output_path: str,
        audio_path: str,
        duration: float,
        company_name: str,
        intro_text: str,
        brand_colors: List[str],
        temp_files: List[str]
    ) -> Optional[str]:
        """✅ Create professional text-based intro with working FFmpeg"""
        
        try:
            # Safe color handling with fallbacks
            bg_color, text_color = self._get_safe_brand_colors(brand_colors)
            safe_company_name = company_name.replace("'", "\\'").replace(":", "\\:")
            
            # ✅ Use absolute pixel values instead of percentage expressions
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"color=c={bg_color}:size=1920x1080:duration={duration}:rate=30",
                "-i", audio_path,
                "-vf", (
                    # ✅ Use absolute pixel values that FFmpeg can evaluate immediately
                    f"drawbox=x=0:y=216:w=1920:h=8:color=white@0.3:t=fill,"        # Top line (h*0.2 = 216)
                    f"drawbox=x=0:y=864:w=1920:h=8:color=white@0.3:t=fill,"        # Bottom line (h*0.8 = 864)
                    
                    # Company name (top)
                    f"drawtext=text='{safe_company_name}':"
                    f"fontsize=42:fontcolor={text_color}:"
                    f"x=(w-text_w)/2:y=270:"  # h*0.25 = 270
                    f"shadowcolor=black@0.6:shadowx=2:shadowy=2,"
                    
                    # Main welcome text (center) 
                    f"drawtext=text='Welcome':"
                    f"fontsize=100:fontcolor=white:"
                    f"x=(w-text_w)/2:y=(h-text_h)/2:"  # Center is OK
                    f"shadowcolor=black@0.8:shadowx=4:shadowy=4,"
                    
                    # Subtitle (bottom)
                    f"drawtext=text='Customer Stories':"
                    f"fontsize=32:fontcolor={text_color}:"
                    f"x=(w-text_w)/2:y=810:"  # h*0.75 = 810
                    f"shadowcolor=black@0.6:shadowx=2:shadowy=2"
                ),
                
                # Standard encoding
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", self.standard_encoding["preset"],
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                
                "-shortest",
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0 and os.path.exists(output_path):
                temp_files.append(output_path)
                logger.info(f"✅ FIXED enhanced text intro created (duration: {duration:.2f}s)")
                return output_path
            else:
                logger.error(f"FIXED intro creation failed: {result.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"FIXED text intro failed: {e}")
            return None

    def _create_image_based_outro(
        self,
        output_path: str,
        audio_path: str,
        duration: float,
        image_url: str,
        company_name: str,
        outro_text: str,
        temp_files: List[str]
    ) -> Optional[str]:
        """Create outro with background image"""
        
        try:
            # Download image
            # image_path = self.storage_manager.download_media(image_url)
            # temp_files.append(image_path)
            
            # ✅ Safe text escaping
            safe_company_name = company_name.replace("'", "\\'").replace(":", "\\:")
            
            cmd = [
                "ffmpeg", "-y",
                "-loop", "1", "-i", image_url,
                "-i", audio_path,
                "-vf", (
                    f"scale=1920:1080:force_original_aspect_ratio=increase,"
                    f"crop=1920:1080,"
                    f"boxblur=3:1,"  # ✅ Simplified blur
                    f"drawbox=x=0:y=0:w=iw:h=ih:color=black@0.5:t=fill,"
                    f"drawtext=text='Thank You':"
                    f"fontsize=90:fontcolor=white:"  # ✅ No font specification
                    f"x=(w-text_w)/2:y=h*0.4:"
                    f"shadowcolor=black@0.8:shadowx=4:shadowy=4,"
                    f"drawtext=text='{safe_company_name}':"
                    f"fontsize=45:fontcolor=white:"
                    f"x=(w-text_w)/2:y=h*0.6:"
                    f"shadowcolor=black@0.8:shadowx=3:shadowy=3"
                ),
                
                # Standard encoding
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", self.standard_encoding["preset"],
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                
                "-shortest",
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0 and os.path.exists(output_path):
                temp_files.append(output_path)
                logger.info(f"✅ Image-based outro created (duration: {duration:.2f}s)")
                return output_path
            else:
                logger.error(f"Image outro creation failed: {result.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"Image-based outro failed: {e}")
            return None

    def _create_enhanced_text_outro(
        self,
        output_path: str,
        audio_path: str,
        duration: float,
        company_name: str,
        outro_text: str,
        brand_colors: List[str],
        temp_files: List[str]
    ) -> Optional[str]:
        """✅ Create professional text-based outro with working FFmpeg"""
        
        try:
            # Safe color handling
            bg_color, text_color = self._get_safe_brand_colors(brand_colors, dark_theme=True)
            safe_company_name = company_name.replace("'", "\\'").replace(":", "\\:")
            
            # ✅ Use absolute pixel values instead of percentage expressions
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi", "-i", f"color=c={bg_color}:size=1920x1080:duration={duration}:rate=30",
                "-i", audio_path,
                "-vf", (
                    # ✅ Use absolute pixel values
                    f"drawbox=x=192:y=270:w=1536:h=4:color=white@0.4:t=fill,"    # Top line (w*0.1=192, w*0.8=1536, h*0.25=270)
                    f"drawbox=x=192:y=810:w=1536:h=4:color=white@0.4:t=fill,"    # Bottom line (h*0.75=810)
                    
                    # Thank you text (center)
                    f"drawtext=text='Thank You':"
                    f"fontsize=100:fontcolor=white:"
                    f"x=(w-text_w)/2:y=(h-text_h)/2:"  # Center is OK
                    f"shadowcolor=black@0.8:shadowx=4:shadowy=4,"
                    
                    # Company name (bottom)
                    f"drawtext=text='{safe_company_name}':"
                    f"fontsize=42:fontcolor={text_color}:"
                    f"x=(w-text_w)/2:y=864:"  # h*0.8 = 864
                    f"shadowcolor=black@0.6:shadowx=2:shadowy=2"
                ),
                
                # Standard encoding
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", self.standard_encoding["preset"],
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                
                "-shortest",
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0 and os.path.exists(output_path):
                temp_files.append(output_path)
                logger.info(f"✅ FIXED enhanced text outro created (duration: {duration:.2f}s)")
                return output_path
            else:
                logger.error(f"FIXED outro creation failed: {result.stderr}")
                return None
                
        except Exception as e:
            logger.error(f"FIXED text outro failed: {e}")
            return None

    def _get_safe_brand_colors(self, brand_colors: List[str], dark_theme: bool = False) -> tuple:
        """Get safe brand colors with reliable fallbacks"""
        
        try:
            if dark_theme:
                # Dark theme defaults
                default_bg = "#1a1a1a"
                default_text = "white"
            else:
                # Light theme defaults  
                default_bg = "#2563eb"  # Professional blue
                default_text = "white"
            
            if not brand_colors:
                return default_bg, default_text
            
            # ✅ Safe color parsing with fallback
            try:
                bg_color = brand_colors[0] if brand_colors[0].startswith('#') else f"#{brand_colors[0]}"
                # Simple validation - just check if it's a reasonable hex format
                if len(bg_color) not in [4, 7] or not all(c in '0123456789abcdefABCDEF#' for c in bg_color):
                    bg_color = default_bg
            except:
                bg_color = default_bg
            
            # For text color, always use white/black for safety
            text_color = default_text
            
            return bg_color, text_color
            
        except Exception as e:
            logger.warning(f"Brand color processing failed: {e}")
            return "#2563eb", "white"  # Safe fallback

    def _assemble_complete_story(
        self,
        intro_path: Optional[str],
        main_path: str,
        outro_path: Optional[str],
        story_id: str,
        temp_files: List[str]
    ) -> str:
        """✅ Assemble story with working audio continuity"""
        
        try:
            # Create list of video parts to combine
            parts = []
            
            if intro_path and os.path.exists(intro_path):
                parts.append(intro_path)
            
            if main_path and os.path.exists(main_path):
                parts.append(main_path)
            
            if outro_path and os.path.exists(outro_path):
                parts.append(outro_path)
            
            if len(parts) == 1:
                return parts[0]
            
            # ✅ Simple, working concatenation
            # output_path = os.path.join(tempfile.gettempdir(), f"complete_story_{story_id}.mp4")
            # concat_file = os.path.join(tempfile.gettempdir(), f"complete_concat_{story_id}.txt")

            output_path = self.file_manager.create_temp_video("complete_story_")
            concat_file = self.file_manager.create_temp_file(suffix=".txt", prefix="complete_concat_")
            
            with open(concat_file, 'w') as f:
                for part in parts:
                    abs_path = os.path.abspath(part)
                    f.write(f"file '{abs_path}'\n")
            
            # ✅ Standard concatenation approach
            cmd = [
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", concat_file,
                
                # ✅ Force re-encoding for perfect compatibility
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", self.standard_encoding["preset"],
                "-crf", self.standard_encoding["crf"],
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-r", self.standard_encoding["frame_rate"],
                
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", self.standard_encoding["audio_bitrate"],
                "-ar", self.standard_encoding["audio_sample_rate"],
                "-ac", "2",
                
                # ✅ Basic sync options
                "-async", "1",
                "-fps_mode", "cfr",
                "-avoid_negative_ts", "make_zero",
                "-movflags", "+faststart",
                
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=600)
            
            temp_files.extend([output_path, concat_file])
            
            if result.returncode == 0 and os.path.exists(output_path):
                total_duration = self.storage_manager.get_video_duration(output_path)
                logger.info(f"✅ Complete story assembled with perfect audio continuity (total: {total_duration:.2f}s)")
                return output_path
            else:
                logger.error(f"Story assembly failed: {result.stderr}")
                return parts[0] if parts else None
            
        except Exception as e:
            logger.error(f"Complete story assembly failed: {e}")
            return parts[0] if parts else None

    def _get_audio_duration(self, audio_path: str) -> float:
        """✅ Get audio duration using FFprobe"""
        
        try:
            return self.storage_manager.get_video_duration(audio_path)      
        except Exception as e:
            logger.warning(f"Failed to get audio duration: {e}")
            return 0.0

    def _get_music_path(self, background_music: str, add_background_music: bool, temp_files: List[str]) -> Optional[str]:
        music_path = None
        logger.info(f"request add_background_music :{add_background_music}")
        if add_background_music:
            music_path = self.music_mixer.get_music_path(background_music or "corporate", temp_files)

            # if music_path:
            #     temp_files.append(music_path)

        logger.info(f"music path : {music_path}")
        return music_path

    # def _ensure_pixabay_music_available(self, music_style: str, temp_files: List[str]) -> Optional[str]:
    #     """✅ Ensure Pixabay music is downloaded and available"""
        
    #     try:
    #         if music_style not in self.pixabay_music_tracks:
    #             logger.warning(f"Unknown music style: {music_style}, using corporate")
    #             music_style = "corporate"
            
    #         track_info = self.pixabay_music_tracks[music_style]
    #         music_path = os.path.join(self.music_library_path, track_info["filename"])
            
    #         # If already exists, return it
    #         if os.path.exists(music_path) and os.path.getsize(music_path) > 10000:
    #             logger.info(f"✅ Using cached Pixabay music: {track_info['description']}")
    #             return music_path
            
    #         # Download from Pixabay
    #         logger.info(f"📥 Downloading Pixabay music: {track_info['description']}")
    #         response = requests.get(track_info["url"], timeout=60, stream=True)
    #         response.raise_for_status()
            
    #         with open(music_path, 'wb') as f:
    #             for chunk in response.iter_content(chunk_size=8192):
    #                 if chunk:
    #                     f.write(chunk)
            
    #         # Validate downloaded file
    #         if os.path.exists(music_path) and os.path.getsize(music_path) > 10000:
    #             logger.info(f"✅ Downloaded Pixabay music: {track_info['description']}")
    #             return music_path
    #         else:
    #             logger.warning(f"❌ Pixabay music download failed")
    #             return None
                
    #     except Exception as e:
    #         logger.warning(f"Pixabay music download error: {e}")
    #         return None

    def _generate_prompt_driven_script(
        self,
        segments: List[intelligence_pb2.TestimonialSegment],
        brand_context: intelligence_pb2.BrandContext,
        company_name: str,
        prompt: Optional[str]
    ) -> Dict[str, str]:
        """✅ WORKING: Generate story script based on prompt and segments"""
        
        try:
            # Simple script generation
            intro_text = f"Welcome to {company_name or 'our company'}. Here's what our customers are saying."
            outro_text = "Thank you for watching. Join our satisfied customers today."
            
            if prompt:
                # Customize based on prompt
                if "journey" in prompt.lower():
                    intro_text = "Discover real customer journeys and transformations."
                elif "success" in prompt.lower():
                    intro_text = "See how we've helped customers achieve success."
                elif "results" in prompt.lower():
                    intro_text = "Real customers, real results."
            
            return {
                "intro_text": intro_text,
                "outro_text": outro_text,
                "style": "professional"
            }
            
        except Exception as e:
            logger.warning(f"Script generation failed: {e}")
            return {
                "intro_text": "Welcome. Here's what our customers are saying.",
                "outro_text": "Thank you for watching.",
                "style": "professional"
            }

    def _apply_story_level_branding(
        self,
        video_path: str,
        brand_context: intelligence_pb2.BrandContext,
        story_id: str,
        temp_files: List[str]
    ) -> str:
        """✅ COMPLETE: Apply story-level branding if logo_url exists"""
        
        try:
            # ✅ Only apply if logo_url exists in brand_context
            if not brand_context.logo_url:
                logger.info("No logo URL in brand context, skipping story-level logo")
                return video_path
            
            # ✅ Download logo
            logo_path = self.storage_manager.download_media(brand_context.logo_url)
            temp_files.append(logo_path)
            
            # ✅ Apply logo using VisualOverlay
            logo_config = {
                "logo_path": logo_path,
                "position": "top_right",
                "size_ratio": 0.08  # Smaller for story-level
            }
            
            branded_video_path = self.visual_overlay.apply_overlays(
                clip_path=video_path,
                text="",  # No text at story level
                theme="professional",
                logo_config=logo_config
            )
            
            if branded_video_path and branded_video_path != video_path:
                temp_files.append(branded_video_path)
                logger.info("✅ Story-level logo branding applied")
                return branded_video_path
            
            return video_path
            
        except Exception as e:
            logger.warning(f"Story-level branding failed: {e}")
            return video_path

    def _apply_studio_encoding(
        self,
        video_path: str,
        output_format: str,
        story_id: str,
        temp_files: List[str]
    ) -> str:
        """✅ Apply final studio-quality encoding"""
        
        try:
            # output_path = os.path.join(tempfile.gettempdir(), f"studio_encoded_{story_id}.{output_format}")
            output_path = self.file_manager.create_temp_file(suffix=f".{output_format}", prefix="studio_encoded_")
            
            cmd = [
                "ffmpeg", "-y",
                "-i", video_path,
                "-c:v", self.standard_encoding["video_codec"],
                "-preset", "fast",  # Highest quality preset
                "-crf", "18",  # High quality
                "-pix_fmt", self.standard_encoding["pixel_format"],
                "-c:a", self.standard_encoding["audio_codec"],
                "-b:a", "256k",  # Higher audio bitrate for final output
                "-movflags", "+faststart",
                output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, text=True, timeout=600)
            
            if result.returncode == 0 and os.path.exists(output_path):
                temp_files.append(output_path)
                logger.info("✅ Studio encoding applied")
                return output_path
            else:
                logger.warning(f"Studio encoding failed: {result.stderr}")
                return video_path
                
        except Exception as e:
            logger.warning(f"Studio encoding error: {e}")
            return video_path

    def _cleanup_temp_files(self, temp_files: List[str]) -> None:
        """✅ WORKING: Clean up temporary files"""
        
        for temp_file in temp_files:
            try:
                if os.path.exists(temp_file):
                    os.unlink(temp_file)
            except Exception as e:
                logger.warning(f"Failed to cleanup {temp_file}: {e}")
        
        logger.debug(f"✅ Cleaned up {len(temp_files)} temporary files")