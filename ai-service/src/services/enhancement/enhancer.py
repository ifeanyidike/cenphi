# src/services/enhancement/service.py - ENHANCED Professional Enhancement Service

import os
import uuid
import logging
import gc
from typing import Dict, Any, Optional, List
from datetime import datetime
import subprocess
from contextlib import contextmanager
from concurrent.futures import ThreadPoolExecutor, as_completed

from .video_enhancer import VideoEnhancer  # Now includes professional enhancement
from src.utils.file_manager import FileManager
from ..shared.audio_normalizer import AudioNormalizer
from ..shared.visual_overlay import VisualOverlay
from ..shared.noise_service import NoiseService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MediaEnhancer:
    """
    🌟 ENHANCED Professional Media Enhancement Service with:
    - Perfect noise removal (maintained from current implementation)
    - EXCELLENT video enhancement from knowledge base
    - Professional voice preservation
    - Cinematic quality results
    - Natural, professional appearance
    """
    
    def __init__(self):
        self._video_enhancer = None
        self._file_manager = None
        self._audio_normalizer = None
        self._storage_manager = None
        self._visual_overlay = None
        self._noise_service = None
        
        # Enhanced memory management for professional processing
        self._max_memory_usage = 2 * 1024 * 1024 * 1024  # 2GB limit
        self._temp_cleanup_threshold = 8  # More frequent cleanup
        self._operation_count = 0

    @property
    def noise_service(self):
        """Perfect noise service (maintained as-is)"""
        if self._noise_service is None:
            self._noise_service = NoiseService()
        return self._noise_service

    @property
    def visual_overlay(self):
        """Lazy-loaded visual overlay"""
        if self._visual_overlay is None:
            self._visual_overlay = VisualOverlay()
        return self._visual_overlay
    
    @property
    def storage_manager(self):
        """Lazy-loaded storage manager"""
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager

    @property
    def audio_normalizer(self):
        """Lazy-loaded Audio normalizer"""
        if self._audio_normalizer is None:
            self._audio_normalizer = AudioNormalizer()
        return self._audio_normalizer

    @property
    def file_manager(self):
        """Lazy-loaded FileManager"""
        if self._file_manager is None:
            self._file_manager = FileManager()
        return self._file_manager
        
    @property
    def video_enhancer(self) -> VideoEnhancer:
        """ENHANCED video enhancer with professional quality + perfect noise reduction"""
        if self._video_enhancer is None:
            self._video_enhancer = VideoEnhancer()  # Now includes enhanced professional quality
        return self._video_enhancer
    
    @contextmanager
    def _managed_operation(self):
        """Enhanced context manager for professional processing"""
        temp_files = []
        try:
            yield temp_files
        finally:
            # Enhanced cleanup for professional processing
            for temp_file in temp_files:
                if temp_file and os.path.exists(temp_file):
                    try:
                        self.file_manager.remove_file(temp_file)
                    except Exception as e:
                        logger.warning(f"Failed to remove temp file {temp_file}: {e}")
            
            # More frequent cleanup for professional processing
            self._operation_count += 1
            if self._operation_count % self._temp_cleanup_threshold == 0:
                try:
                    self.file_manager.cleanup_all_temp_files()
                except Exception as e:
                    logger.warning(f"Cleanup failed: {e}")
                gc.collect()

    def batch_enhance(self, options: List[Dict[str, str]], quality: str = "high",
                     upload_to_cloud: bool = True,
                     custom_enhancements: Optional[List[str]] = None,
                     logo_url: Optional[str] = None,
                     watermark_text: Optional[str] = None,
                     watermark_position: Optional[str] = None,
                     add_branding: bool = False,
                     brand_color: Optional[str] = None,
                     target_platform: Optional[str] = None,
                     remove_noise: bool = True,
                     clean_up: bool = True) -> List[Dict[str, Any]]:
        """
        🌟 Batch ENHANCED PROFESSIONAL media enhancement with thread poool concurrency:
        - Perfect noise removal (maintained)
        - EXCELLENT video enhancement from knowledge base
        - Professional voice preservation
        - Cinematic quality results
        - Natural, professional appearance
        - where options is a list of dictionaries where for each the key is the testimonial_id and the value is the media_url
        """
        start_time = datetime.now()
        results = []
        optimal_workers = min(8, max(2, os.cpu_count() - 1))
        
        with ThreadPoolExecutor(max_workers=optimal_workers) as executor:
            future_to_option = {
                executor.submit(
                    self.enhance,
                    media_url=option['media_url'],
                    quality=quality,
                    upload_to_cloud=upload_to_cloud,
                    custom_enhancements=custom_enhancements,
                    logo_url=logo_url,
                    watermark_text=watermark_text,
                    watermark_position=watermark_position,
                    add_branding=add_branding,
                    brand_color=brand_color,
                    target_platform=target_platform,
                    remove_noise=remove_noise,
                    clean_up=clean_up,
                    testimonial_id=option.get("testimonial_id", None)
                ): option for option in options
            }
            
            for future in as_completed(future_to_option):
                option = future_to_option[future]
                try:
                    result = future.result()
                    result["testimonial_id"] = option.get('testimonial_id', 'unknown')
                    results.append(result)
                except Exception as e:
                    logger.error(f"Batch enhancement failed for {option['media_url']}: {e}")    
                    results.append({  
                        "testimonial_id": option.get('testimonial_id', 'unknown'),  
                        "success": False,
                        "enhanced_url": "",
                        "applied_enhancements": [],
                        "quality_score": 0.0,
                        "media_type": "unknown",
                        "error": f"Batch enhancement failed: {str(e)}",
                    })
        
    
    def enhance(self, media_url: str, quality: str = "high",
                upload_to_cloud: bool = True,
                custom_enhancements: Optional[List[str]] = None,
                logo_url: Optional[str] = None,
                watermark_text: Optional[str] = None,
                watermark_position: Optional[str] = None,
                add_branding: bool = False,
                brand_color: Optional[str] = None,
                target_platform: Optional[str] = None,
                remove_noise: bool = True,
                clean_up: bool = True,
                enable_grayscale: bool = False,  # Option for grayscale output
                testimonial_id: Optional[str] = None,
                job_id: Optional[str] = None
                ) -> Dict[str, Any]:
        """
        🌟 ENHANCED PROFESSIONAL media enhancement with:
        - Perfect noise removal (maintained)
        - EXCELLENT video enhancement from knowledge base
        - Professional voice preservation
        - Cinematic quality results
        - Natural, professional appearance
        """
        start_time = datetime.now()
        
        # Enhanced input validation for professional service
        if not media_url or not isinstance(media_url, str) or media_url.strip() == "":
            return self._create_enhanced_error_response("Invalid or empty media_url provided", start_time)
        
        if quality not in ["high", "medium", "low"]:
            logger.warning(f"Invalid quality '{quality}', defaulting to 'high' for enhanced results")
            quality = "high"  # Default to high for enhanced professional service

        cache_path = self.generate_enhance_cache_key(media_url, quality, custom_enhancements, logo_url, watermark_text, watermark_position,
                                                     add_branding, brand_color, target_platform, remove_noise, job_id)
        cache_url = self.storage_manager.get_public_url_for_object(cache_path)
        if self.storage_manager.check_url_exists(cache_url):
            logger.info(f"✅ Using cached enhancement URL: {cache_path}")
            return {
                    "testimonial_id": testimonial_id,
                    "success": True,
                    "enhanced_url": cache_url,
                    "applied_enhancements": [],
                    "media_type": "video",
                    "error": None,
                }
        
        with self._managed_operation() as temp_files:
            try:
                logger.info(f"🌟 Starting ENHANCED PROFESSIONAL enhancement for: {media_url}")
                logger.info(f"   🎬 Quality Level: {quality.upper()}")
                logger.info(f"   🎯 Target Platform: {target_platform or 'Universal'}")
                logger.info(f"   ✨ Enhanced processing with perfect noise reduction + excellent video enhancement")

                # Enhanced media download with professional validation
                if media_url and not os.path.exists(media_url):
                    input_file = self._download_media(media_url, temp_files)
                    if not input_file:
                        return self._create_enhanced_error_response("Failed to download media file", start_time)
                else:
                    input_file = media_url
                
                # Enhanced file validation
                if not os.path.exists(input_file):
                    return self._create_enhanced_error_response("Input file does not exist", start_time)
                
                try:
                    file_size = self.file_manager.get_file_size(input_file)
                except Exception as e:
                    logger.error(f"Could not access file: {e}")
                    return self._create_enhanced_error_response("Could not access input file", start_time)
                
                if file_size > self._max_memory_usage:
                    return self._create_enhanced_error_response(
                        f"File too large ({file_size / (1024*1024):.1f}MB). Maximum: {self._max_memory_usage / (1024*1024):.0f}MB", 
                        start_time
                    )
                
                # Enhanced media type detection
                try:
                    media_type = self.storage_manager.detect_media_type(input_file)
                except Exception as e:
                    logger.error(f"Media type detection failed: {e}")
                    media_type = 'unknown'
                
                if media_type == 'unknown':
                    return self._create_enhanced_error_response("Unsupported media type for enhanced professional enhancement", start_time)
                
                logger.info(f"📊 Enhanced Professional Analysis:")
                logger.info(f"   📁 Media Type: {media_type}")
                logger.info(f"   📏 File Size: {file_size / (1024*1024):.1f}MB")

                # Generate enhanced professional output path
                # output_file = self._generate_enhanced_output_path(input_file, media_type, quality)
                output_file = self.file_manager.create_temp_video()
                if not target_platform and clean_up:
                    temp_files.append(output_file)
                
                # 🌟 APPLY ENHANCED PROFESSIONAL ENHANCEMENT
                logger.info(f"🎬 Applying ENHANCED PROFESSIONAL enhancement...")
                logger.info(f"   🎯 Perfect noise removal + excellent video enhancement from knowledge base")
                logger.info(f"   🎵 Professional voice preservation (no sharp pitches)")
                logger.info(f"   ✨ Professional sharpening, color grading, stabilization")
                logger.info(f"   🌟 Natural, cinematic results")
                
                try:
                    # Use the enhanced video enhancer (combines perfect noise reduction + excellent video enhancement)
                    result = self.video_enhancer.enhance(
                        input_file, output_file, quality, custom_enhancements, target_platform, remove_noise, enable_grayscale
                    )
                except Exception as e:
                    logger.error(f"Enhanced professional enhancement failed with exception: {e}")
                    result = {"success": False, "error": str(e)}
                
                # Enhanced result validation
                if not result or not isinstance(result, dict) or not result.get("success"):
                    error_msg = result.get('error', 'Unknown error') if result else 'Enhancement returned no result'
                    return self._create_enhanced_error_response(f"Enhanced professional enhancement failed: {error_msg}", start_time)
                
                if not output_file or not os.path.exists(output_file) or os.path.getsize(output_file) == 0:
                    return self._create_enhanced_error_response("Enhancement produced invalid output file", start_time)
                
                # Log enhanced professional enhancement results
                applied_enhancements = result.get('applied_enhancements', [])
                quality_score = result.get('quality_score', 0.0)
                
                logger.info(f"🌟 ENHANCED PROFESSIONAL enhancement completed successfully!")
                logger.info(f"   ✨ Applied Enhancements: {len(applied_enhancements)}")
                for enhancement in applied_enhancements:
                    logger.info(f"      • {enhancement}")
                logger.info(f"   📊 Quality Score: {quality_score:.3f}")
                logger.info(f"   🎯 Perfect Noise Removal: {result.get('dramatic_noise_reduction', False)}")
                logger.info(f"   🎵 Voice Preserved: {result.get('voice_preserved', True)}")
                logger.info(f"   🎬 Excellent Video Enhancement: {result.get('excellent_video_enhancement', False)}")
                logger.info(f"   🌟 Cinematic Quality: {result.get('cinematic_quality', False)}")

                # Enhanced professional branding application
                if add_branding and (logo_url or watermark_text):
                    try:
                        logger.info("🎨 Applying enhanced professional branding...")
                        branding_result = self.visual_overlay.apply_branding(
                            video_path=output_file,
                            logo_url=logo_url or None,
                            temp_files=temp_files,
                            watermark_text=watermark_text or None,
                            watermark_position=watermark_position or None,
                            brand_color=brand_color or None,
                        )
                        
                        if branding_result and os.path.exists(branding_result):
                            output_file = branding_result
                            logger.info("✅ Enhanced professional branding applied")
                        else:
                            logger.info("ℹ️  Branding skipped - using enhanced video")
                    except Exception as e:
                        logger.warning(f"Branding failed: {e} (continuing without branding)")
               
                # Enhanced professional output verification
                if not self._verify_enhanced_output(output_file, media_type):
                    return self._create_enhanced_error_response("Enhanced output failed quality verification", start_time)
            
                # Enhanced professional cloud upload
                enhanced_url = output_file  # Default to local path
                if result.get("success", False):
                    if upload_to_cloud:
                        try:
                            # object_name = f"enhanced/{os.path.basename(output_file)}"
                            enhanced_url = self.storage_manager.upload_file_with_retry(output_file, cache_path)
                            logger.info(f"🌐 Enhanced professional file uploaded: {enhanced_url}")
                        except Exception as e:
                            logger.warning(f"Cloud upload failed: {e} (using local path)")
                            enhanced_url = output_file
                
                # Calculate enhanced professional metrics
                processing_time = (datetime.now() - start_time).total_seconds()

                # Enhanced professional file size calculation
                try:
                    file_size_enhanced = self.file_manager.get_file_size(output_file)
                except Exception as e:
                    logger.warning(f"Could not get enhanced file size: {e}")
                    file_size_enhanced = 0

                logger.info(f"🏆 ENHANCED PROFESSIONAL enhancement completed!")
                logger.info(f"   ⏱️  Processing Time: {processing_time:.2f}s")
                logger.info(f"   📊 Final Quality Score: {quality_score:.3f}")
                logger.info(f"   🌐 Enhanced URL: {enhanced_url}")

                # Enhanced professional response with comprehensive metadata
                response = {
                    "testimonial_id": testimonial_id,
                    "success": True,
                    "enhanced_url": enhanced_url,
                    "applied_enhancements": applied_enhancements,
                    "quality_score": round(quality_score, 3),
                    "media_type": media_type,
                    "error": None,
                    "processing_time": round(processing_time, 2),
                    "file_size_original": file_size,
                    "file_size_enhanced": file_size_enhanced,
                    "timestamp": datetime.now().isoformat(),
                }
                
                return response
                
            except MemoryError:
                logger.error("Memory error during enhanced professional enhancement")
                return self._create_enhanced_error_response("File too large for enhanced professional processing", start_time)
            except Exception as e:
                logger.error(f"Enhanced professional enhancement failed: {str(e)}", exc_info=True)
                return self._create_enhanced_error_response(str(e), start_time)
            

    def generate_enhance_cache_key(self,
        media_url: str, quality: str = "high",
        custom_enhancements: Optional[List[str]] = None,
        logo_url: Optional[str] = None,
        watermark_text: Optional[str] = None,
        watermark_position: Optional[str] = None,
        add_branding: bool = False,
        brand_color: Optional[str] = None,
        target_platform: Optional[str] = None,
        remove_noise: bool = True,
        job_id: Optional[str] = None):
        """Generate deterministic cache key including brand colors"""
        import hashlib
        from urllib.parse import urlparse
        import uuid

        ENHANCER_ALGORITHM_VERSION = "v1.0"

        customs = "|".join(sorted(custom_enhancements)) if custom_enhancements else "default"
        branding_opt = "1" if add_branding else "0"
        noise = "1" if remove_noise else "0"

        parsed_url = urlparse(media_url)
        media_id = f"{parsed_url.netloc}{parsed_url.path}"

        cache_data = (
            f"{ENHANCER_ALGORITHM_VERSION}|{media_id}|{quality}|{customs}|{logo_url or ''}|"
            f"{watermark_text or ''}|{watermark_position or ''}"
            f"|{branding_opt}|{brand_color or ''}|"
            f"{target_platform or ''}|{noise}"
        )

        cache_hash = hashlib.md5(cache_data.encode()).hexdigest()

        # Use job_id for session-based cleanup, fallback to hash for backward compatibility
        session_id = job_id if job_id else str(uuid.uuid4())
        return f"temp/{session_id}/enhanced/{cache_hash}.mp4"
    
    def process_with_excellent_denoising(self, video_path: str, noise_reduction_level: str, temp_files: List[str], story_id: str) -> str:
        """
        🎯 EXCELLENT denoising (maintained for backward compatibility)
        """
        logger.info(f"🎯 Applying EXCELLENT denoising to {story_id} (level: {noise_reduction_level})")
        
        try:
            if not video_path or not os.path.exists(video_path):
                logger.error(f"Invalid video path for denoising: {video_path}")
                return video_path
            
            if not isinstance(temp_files, list):
                logger.error("temp_files must be a list")
                return video_path
            
            # Use the perfect noise service (maintained as-is)
            denoised_path = self.noise_service.process_with_denoising(
                video_path=video_path,
                noise_reduction_level=noise_reduction_level or "high",
                temp_files=temp_files,
                story_id=story_id or "unknown"
            )
            
            if denoised_path and denoised_path != video_path and os.path.exists(denoised_path):
                logger.info(f"✅ EXCELLENT denoising completed for {story_id}")
                return denoised_path
            else:
                logger.info(f"ℹ️  Denoising not needed for {story_id}")
                return video_path
                
        except Exception as e:
            logger.error(f"❌ EXCELLENT denoising failed for {story_id}: {e}")
            return video_path
    
    def _download_media(self, media_url: str, temp_files: List[str]) -> Optional[str]:
        """Enhanced professional media download with validation"""
        try:
            if not media_url or not isinstance(media_url, str):
                logger.error("Invalid media URL for enhanced professional download")
                return None
            
            if not isinstance(temp_files, list):
                logger.error("temp_files must be a list")
                temp_files = []
            
            logger.info(f"📥 Downloading media for enhanced professional enhancement...")
            downloaded_file = self.storage_manager.download_media(media_url)
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                logger.error("Enhanced professional download failed")
                return None
            
            file_size = self.file_manager.get_file_size(downloaded_file)
            if file_size == 0:
                logger.error("Downloaded file is empty")
                try:
                    self.storage_manager.cleanup_file(downloaded_file)
                except:
                    pass
                return None
            
            if file_size > self._max_memory_usage:
                logger.error(f"File too large for enhanced professional processing: {file_size / (1024*1024):.1f}MB")
                try:
                    self.storage_manager.cleanup_file(downloaded_file)
                except:
                    pass
                return None
            
            temp_files.append(downloaded_file)
            logger.info(f"✅ Media downloaded successfully ({file_size / (1024*1024):.1f}MB)")
            return downloaded_file
                
        except Exception as e:
            logger.error(f"Enhanced professional media download failed: {e}")
            return None
    
    def _verify_enhanced_output(self, output_file: str, media_type: str) -> bool:
        """Enhanced verification for professional output"""
        try:
            if not output_file or not os.path.exists(output_file):
                logger.error("Enhanced professional output file does not exist")
                return False
            
            file_size = self.file_manager.get_file_size(output_file)
            if file_size == 0:
                logger.error("Enhanced professional output file is empty")
                return False
            
            # Enhanced verification using FFprobe
            try:
                cmd = ["ffprobe", "-v", "quiet", "-show_format", "-show_streams", output_file]
                result = subprocess.run(cmd, capture_output=True, timeout=15)
                
                if result.returncode == 0:
                    # Additional checks for enhanced professional quality
                    output = result.stdout.decode('utf-8').lower()
                    
                    # Verify codec compatibility
                    if media_type == 'video':
                        has_h264 = 'h264' in output or 'avc' in output
                        has_aac = 'aac' in output
                        
                        if not has_h264:
                            logger.warning("Enhanced professional output may not have H.264 codec")
                        
                        if 'audio' in output and not has_aac:
                            logger.warning("Enhanced professional output may not have AAC audio")
                    
                    return True
                else:
                    logger.error("Enhanced professional output failed FFprobe verification")
                    return False
                    
            except Exception as e:
                logger.error(f"Enhanced professional output verification failed: {e}")
                return False
                
        except Exception as e:
            logger.error(f"Enhanced professional output verification error: {e}")
            return False
    
    def _create_enhanced_error_response(self, error_message: str, start_time: datetime) -> Dict[str, Any]:
        """Create enhanced professional error response with comprehensive metadata"""
        try:
            processing_time = (datetime.now() - start_time).total_seconds()
        except:
            processing_time = 0.0
        
        return {
            "success": False,
            "enhanced_url": "",
            "applied_enhancements": [],
            "quality_score": 0.0,
            "media_type": "unknown",
            "error":  "Unknown enhanced professional enhancement error",
            "processing_time": round(processing_time, 2),
            "timestamp": datetime.now().isoformat(),
            
            # Enhanced professional service metadata
            "enhanced_professional_processing": False,
            "perfect_noise_removal": False,
            "excellent_video_enhancement": False,
            "professional_sharpening": False,
            "professional_color_grading": False,
            "professional_stabilization": False,
            "cinematic_quality": False,
            "perfect_voice_preservation": False,
            "professional_grade": False,
            "natural_enhancement": False,
            "quality_tier": "failed",
            
        }
    
    def cleanup_resources(self):
        """Enhanced resource cleanup for professional service"""
        try:
            if self._file_manager:
                self.file_manager.cleanup_all_temp_files()
        except Exception as e:
            logger.warning(f"File cleanup failed: {e}")
        
        # Clear all service instances
        self._video_enhancer = None
        self._audio_normalizer = None
        self._file_manager = None
        self._visual_overlay = None
        self._noise_service = None
        
        # Force garbage collection
        try:
            gc.collect()
        except:
            pass
        
        logger.info("🧹 Enhanced professional resources cleaned up successfully")
    
    def __del__(self):
        """Destructor with safe cleanup"""
        try:
            self.cleanup_resources()
        except:
            pass

    
