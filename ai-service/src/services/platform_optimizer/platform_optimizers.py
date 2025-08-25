# src/services/platform_optimizer/platform_optimizers.py

import os
import json
import logging
import tempfile
import subprocess
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from .platform_specs import PlatformSpec

logger = logging.getLogger(__name__)

@dataclass
class PlatformOptimizationResult:
    """Platform-specific optimization result"""
    success: bool
    optimized_path: str = ""
    platform_features: Dict[str, Any] = None
    engagement_enhancements: List[str] = None
    compliance_score: float = 0.0
    platform_specific_metadata: Dict[str, Any] = None
    error: str = ""
    
    def __post_init__(self):
        if self.platform_features is None:
            self.platform_features = {}
        if self.engagement_enhancements is None:
            self.engagement_enhancements = []
        if self.platform_specific_metadata is None:
            self.platform_specific_metadata = {}

class InstagramOptimizer:
    """Instagram-specific optimizations (Stories, Reels, Feed)"""
    
    def __init__(self):
        self.story_optimal_duration = (3, 15)  # 3-15 seconds
        self.reel_optimal_duration = (15, 90)  # 15-90 seconds
        self.feed_optimal_duration = (15, 60)  # 15-60 seconds
        self._storage_manager = None
        self._ffmpeg_optimizer = None
        
        logger.info("InstagramOptimizer initialized")

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
    
    def optimize_for_instagram(
        self,
        media_path: str,
        instagram_format: str,  # 'story', 'reel', 'feed'
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]] = None
    ) -> PlatformOptimizationResult:
        """Optimize content specifically for Instagram format"""
        
        try:
            format_lower = instagram_format.lower()
            
            if format_lower == "story":
                return self._optimize_for_story(media_path, platform_spec, content_analysis)
            elif format_lower == "reel":
                return self._optimize_for_reel(media_path, platform_spec, content_analysis)
            elif format_lower == "feed":
                return self._optimize_for_feed(media_path, platform_spec, content_analysis)
            else:
                # Default to reel optimization
                return self._optimize_for_reel(media_path, platform_spec, content_analysis)
                
        except Exception as e:
            logger.error(f"Instagram optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))
    
    def _optimize_for_story(
        self, 
        media_path: str, 
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]]
    ) -> PlatformOptimizationResult:
        """Optimize for Instagram Stories"""
        
        try:
            output_path = tempfile.mktemp(suffix=".mp4")
            
            # Stories-specific optimizations
            filters = []
            enhancements = []
            
            # 1. Ensure vertical 9:16 aspect ratio with smart positioning
            filters.append("scale=1080:1920:force_original_aspect_ratio=increase")
            filters.append("crop=1080:1920")
            
            # 2. Add subtle zoom for engagement (Stories perform better with slight motion)
            # Fixed: Proper zoompan syntax for engagement
            filters.append("zoompan=z='if(eq(on,1),1.0,min(zoom+0.001,1.2))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=25:s=1080x1920:fps=30")
            enhancements.append("engagement_zoom")
            
            # 3. Optimize for mobile viewing (enhance contrast for small screens)
            filters.append("eq=contrast=1.1:brightness=0.05:saturation=1.1")
            enhancements.append("mobile_optimized_colors")
            
            # 4. Stories-specific timing (max 15 seconds)
            duration_filter = "trim=duration=15"
            filters.append(duration_filter)
            enhancements.append("story_duration_optimization")
            
            # Build and execute command
            cmd = [
                "ffmpeg", "-i", media_path,
                "-vf", ",".join(filters),
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                "-y", output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, capture_output=True, timeout=60, video_info=content_analysis)
            
            if result.returncode != 0:
                raise Exception(f"Story optimization failed: {result.stderr}")
            
            return PlatformOptimizationResult(
                success=True,
                optimized_path=output_path,
                platform_features={
                    "format": "instagram_story",
                    "aspect_ratio": "9:16",
                    "max_duration": 15,
                    "engagement_features": ["subtle_zoom", "mobile_optimized"]
                },
                engagement_enhancements=enhancements,
                compliance_score=0.95,
                platform_specific_metadata={
                    "optimal_posting_times": ["12-1pm", "5-6pm", "7-9pm"],
                    "story_stickers_recommended": True,
                    "interactive_elements": ["polls", "questions", "swipe_up"]
                }
            )
            
        except Exception as e:
            logger.error(f"Story optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))
    
    def _optimize_for_reel(
        self, 
        media_path: str, 
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]]
    ) -> PlatformOptimizationResult:
        """Optimize for Instagram Reels"""
        
        try:
            output_path = tempfile.mktemp(suffix=".mp4")
            
            filters = []
            enhancements = []
            
            # 1. Vertical 9:16 with smart cropping for engagement
            filters.append("scale=1080:1920:force_original_aspect_ratio=increase")
            filters.append("crop=1080:1920")
            
            # 2. Reels-specific engagement optimization (faster cuts, higher energy)
            filters.append("eq=contrast=1.15:saturation=1.2:brightness=0.08")
            enhancements.append("high_energy_colors")
            
            # 3. Optimize duration for Reels algorithm (30-60 seconds is sweet spot)
            duration = min(60, max(15, self.storage_manager.get_video_duration(media_path)))
            if duration != self.storage_manager.get_video_duration(media_path):
                filters.append(f"trim=duration={duration}")
                enhancements.append("algorithm_optimized_duration")
            
            # 4. Add slight stabilization for better mobile viewing
            filters.append("deshake")
            enhancements.append("mobile_stabilization")
            
            # Build command
            cmd = [
                "ffmpeg", "-i", media_path,
                "-vf", ",".join(filters),
                "-c:v", "libx264", "-preset", "fast", "-crf", "21",
                "-maxrate", "3500k", "-bufsize", "7000k",
                "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
                "-movflags", "+faststart",
                "-y", output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                capture_output=True, timeout=120, text=True, video_info=content_analysis)
            
            if result.returncode != 0:
                raise Exception(f"Reel optimization failed: {result.stderr}")
            
            return PlatformOptimizationResult(
                success=True,
                optimized_path=output_path,
                platform_features={
                    "format": "instagram_reel",
                    "aspect_ratio": "9:16",
                    "optimized_duration": duration,
                    "algorithm_features": ["high_energy", "mobile_first"]
                },
                engagement_enhancements=enhancements,
                compliance_score=0.92,
                platform_specific_metadata={
                    "trending_hashtags_recommended": True,
                    "audio_trending_important": True,
                    "hook_critical_seconds": 3,
                    "optimal_length": "30-60 seconds"
                }
            )
            
        except Exception as e:
            logger.error(f"Reel optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))
    
    def _optimize_for_feed(
        self, 
        media_path: str, 
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]]
    ) -> PlatformOptimizationResult:
        """Optimize for Instagram Feed"""
        
        try:
            output_path = tempfile.mktemp(suffix=".mp4")
            
            filters = []
            enhancements = []
            
            # 1. Square 1:1 aspect ratio (performs best in feed)
            filters.append("scale=1080:1080:force_original_aspect_ratio=increase")
            filters.append("crop=1080:1080")
            
            # 2. Feed-specific quality optimization (higher quality expected)
            filters.append("eq=contrast=1.05:saturation=1.05")
            enhancements.append("feed_quality_enhancement")
            
            # 3. Optimize for longer viewing (feed videos can be longer)
            max_duration = min(60, self.storage_manager.get_video_duration(media_path))
            if max_duration < self.storage_manager.get_video_duration(media_path):
                filters.append(f"trim=duration={max_duration}")
                enhancements.append("feed_duration_optimization")
            
            # Build command
            cmd = [
                "ffmpeg", "-i", media_path,
                "-vf", ",".join(filters),
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-maxrate", "3000k", "-bufsize", "6000k",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                "-y", output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                capture_output=True, timeout=120, text=True, video_info=content_analysis)
            
            if result.returncode != 0:
                raise Exception(f"Feed optimization failed: {result.stderr}")
            
            return PlatformOptimizationResult(
                success=True,
                optimized_path=output_path,
                platform_features={
                    "format": "instagram_feed",
                    "aspect_ratio": "1:1",
                    "quality_tier": "high",
                    "feed_optimized": True
                },
                engagement_enhancements=enhancements,
                compliance_score=0.90,
                platform_specific_metadata={
                    "caption_length_optimal": "125-150 characters",
                    "hashtag_count_optimal": "5-10",
                    "posting_consistency_important": True
                }
            )
            
        except Exception as e:
            logger.error(f"Feed optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))


class TikTokOptimizer:
    """TikTok-specific optimizations"""
    
    def __init__(self):
        self.optimal_duration = (15, 60)  # 15-60 seconds
        self.hook_critical_seconds = 3    # First 3 seconds are critical
        self._storage_manager = None
        self._ffmpeg_optimizer = None
        
        logger.info("TikTokOptimizer initialized")

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
    
    def optimize_for_tiktok(
        self,
        media_path: str,
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]] = None
    ) -> PlatformOptimizationResult:
        """Optimize content specifically for TikTok"""
        
        try:
            output_path = tempfile.mktemp(suffix=".mp4")
            
            filters = []
            enhancements = []
            
            # 1. TikTok's preferred vertical 9:16 ratio
            filters.append("scale=1080:1920:force_original_aspect_ratio=increase")
            filters.append("crop=1080:1920")
            
            # 2. TikTok algorithm preferences - higher saturation and contrast
            filters.append("eq=contrast=1.2:saturation=1.3:brightness=0.1")
            enhancements.append("tiktok_algorithm_colors")
            
            # 3. Mobile-first optimization (most TikTok viewing is mobile)
            filters.append("unsharp=5:5:0.8:3:3:0.4")  # Slight sharpening for small screens
            enhancements.append("mobile_sharpening")
            
            # 4. Optimize duration for TikTok algorithm (prefers 15-60 seconds)
            duration = self.storage_manager.get_video_duration(media_path)
            if duration > 60:
                filters.append("trim=duration=60")
                enhancements.append("algorithm_duration_optimization")
            elif duration < 15:
                # For very short content, loop it to reach minimum duration
                # loop_count = max(1, int(15 / duration))
                # if loop_count > 1 and loop_count <= 3:  # Max 3 loops to avoid issues
                #     # Use proper loop filter syntax
                #     filters.append(f"loop=loop={loop_count-1}:size=1000:start=0")
                #     enhancements.append("duration_extension_loop")
                if duration < 15 and duration > 3:  # Only loop reasonable durations
                    loop_needed = min(3, int(15 / duration))
                    if loop_needed > 1:
                        filters.append(f"loop=loop={loop_needed-1}:size=1000:start=0")
                        enhancements.append("duration_extension_loop")
            
            # 5. TikTok prefers higher frame rates for smoother playback
            filters.append("fps=30")
            enhancements.append("smooth_playback_fps")
            
            # Build command optimized for TikTok
            cmd = [
                "ffmpeg", "-i", media_path,
                "-vf", ",".join(filters),
                "-c:v", "libx264", "-preset", "fast", "-crf", "22",
                "-maxrate", "4000k", "-bufsize", "8000k",
                "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
                "-movflags", "+faststart",
                "-y", output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                    capture_output=True, timeout=120, text=True, video_info=content_analysis)
            
            if result.returncode != 0:
                raise Exception(f"TikTok optimization failed: {result.stderr}")
            
            return PlatformOptimizationResult(
                success=True,
                optimized_path=output_path,
                platform_features={
                    "format": "tiktok",
                    "aspect_ratio": "9:16",
                    "algorithm_optimized": True,
                    "mobile_first": True,
                    "viral_potential": "optimized"
                },
                engagement_enhancements=enhancements,
                compliance_score=0.95,
                platform_specific_metadata={
                    "hook_seconds": 3,
                    "trending_sounds_important": True,
                    "hashtag_strategy": "trending + niche mix",
                    "optimal_posting_times": ["6-10am", "7-9pm"],
                    "engagement_features": ["challenges", "duets", "stitches"]
                }
            )
            
        except Exception as e:
            logger.error(f"TikTok optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))


class LinkedInOptimizer:
    """LinkedIn-specific optimizations"""
    
    def __init__(self):
        self.optimal_duration = (30, 600)  # 30 seconds to 10 minutes
        self.professional_standards = True
        self._ffmpeg_optimizer = None
        
        logger.info("LinkedInOptimizer initialized")

    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer
    
    def optimize_for_linkedin(
        self,
        media_path: str,
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]] = None
    ) -> PlatformOptimizationResult:
        """Optimize content specifically for LinkedIn"""
        
        try:
            output_path = tempfile.mktemp(suffix=".mp4")
            
            filters = []
            enhancements = []
            
            # 1. LinkedIn prefers 16:9 landscape for professional content
            filters.append("scale=1920:1080:force_original_aspect_ratio=decrease")
            filters.append("pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black")
            
            # 2. Professional color grading (less saturated, more natural)
            filters.append("eq=contrast=1.02:saturation=0.95:brightness=0.02")
            enhancements.append("professional_color_grading")
            
            # 3. Slight noise reduction for professional appearance
            filters.append("hqdn3d=2:1:2:1")
            enhancements.append("professional_noise_reduction")
            
            # 4. Optimize for desktop viewing (LinkedIn is often viewed on desktop)
            filters.append("unsharp=7:7:0.5:7:7:0.0")  # Subtle sharpening for larger screens
            enhancements.append("desktop_optimization")
            
            # 5. Professional audio standards (clear dialogue is crucial)
            # Fixed: Proper audio filter chain with safe parameters
            audio_filters = [
                "highpass=f=80",           # Remove low-frequency rumble
                "lowpass=f=8000",          # Remove high-frequency noise
                "loudnorm=I=-23:TP=-2:LRA=7"  # Broadcast standard normalization
            ]
            
            # Build professional-grade command
            cmd = [
                "ffmpeg", "-i", media_path,
                "-vf", ",".join(filters),
                "-af", ",".join(audio_filters),
                "-c:v", "libx264", "-preset", "fast", "-crf", "18",  # Higher quality for professional content
                "-maxrate", "8000k", "-bufsize", "16000k",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",  # Higher quality audio
                "-movflags", "+faststart",
                "-y", output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                capture_output=True, timeout=180, text=True, video_info=content_analysis)
            
            if result.returncode != 0:
                raise Exception(f"LinkedIn optimization failed: {result.stderr}")
            
            return PlatformOptimizationResult(
                success=True,
                optimized_path=output_path,
                platform_features={
                    "format": "linkedin",
                    "aspect_ratio": "16:9",
                    "quality_tier": "professional",
                    "audio_quality": "high",
                    "business_optimized": True
                },
                engagement_enhancements=enhancements,
                compliance_score=0.88,
                platform_specific_metadata={
                    "optimal_length": "2-5 minutes for testimonials",
                    "professional_presentation": True,
                    "subtitles_recommended": True,
                    "business_hours_posting": True,
                    "thought_leadership_angle": "recommended"
                }
            )
            
        except Exception as e:
            logger.error(f"LinkedIn optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))


class YouTubeOptimizer:
    """YouTube-specific optimizations"""
    
    def __init__(self):
        self.shorts_duration = (15, 60)    # YouTube Shorts
        self.standard_duration = (60, 600) # Standard videos
        self._storage_manager = None
        self._ffmpeg_optimizer = None
        
        logger.info("YouTubeOptimizer initialized")

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
    
    def optimize_for_youtube(
        self,
        media_path: str,
        youtube_format: str,  # 'shorts' or 'standard'
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]] = None
    ) -> PlatformOptimizationResult:
        """Optimize content specifically for YouTube format"""
        
        try:
            format_lower = youtube_format.lower()
            
            if format_lower == "shorts":
                return self._optimize_for_youtube_shorts(media_path, platform_spec, content_analysis)
            else:
                return self._optimize_for_youtube_standard(media_path, platform_spec, content_analysis)
                
        except Exception as e:
            logger.error(f"YouTube optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))
    
    def _optimize_for_youtube_shorts(
        self,
        media_path: str,
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]]
    ) -> PlatformOptimizationResult:
        """Optimize for YouTube Shorts"""
        
        try:
            output_path = tempfile.mktemp(suffix=".mp4")
            
            filters = []
            enhancements = []
            
            # 1. YouTube Shorts vertical format
            filters.append("scale=1080:1920:force_original_aspect_ratio=increase")
            filters.append("crop=1080:1920")
            
            # 2. YouTube's quality standards (higher than TikTok)
            filters.append("eq=contrast=1.1:saturation=1.1:brightness=0.05")
            enhancements.append("youtube_quality_enhancement")
            
            # 3. Optimize for 60-second limit
            duration = self.storage_manager.get_video_duration(media_path)
            if duration > 60:
                filters.append("trim=duration=60")
                enhancements.append("shorts_duration_compliance")
            
            # 4. Higher quality for YouTube's compression
            cmd = [
                "ffmpeg", "-i", media_path,
                "-vf", ",".join(filters),
                "-c:v", "libx264", "-preset", "fast", "-crf", "20",
                "-maxrate", "6000k", "-bufsize", "12000k",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                "-y", output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                capture_output=True, text=True, timeout=120, video_info=content_analysis)
            
            if result.returncode != 0:
                raise Exception(f"YouTube Shorts optimization failed: {result.stderr}")
            
            return PlatformOptimizationResult(
                success=True,
                optimized_path=output_path,
                platform_features={
                    "format": "youtube_shorts",
                    "aspect_ratio": "9:16",
                    "quality_tier": "high",
                    "algorithm_friendly": True
                },
                engagement_enhancements=enhancements,
                compliance_score=0.93,
                platform_specific_metadata={
                    "thumbnail_auto_generated": True,
                    "loop_friendly": True,
                    "discovery_optimized": True,
                    "mobile_first": True
                }
            )
            
        except Exception as e:
            logger.error(f"YouTube Shorts optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))
    
    def _optimize_for_youtube_standard(
        self,
        media_path: str,
        platform_spec: PlatformSpec,
        content_analysis: Optional[Dict[str, Any]]
    ) -> PlatformOptimizationResult:
        """Optimize for standard YouTube videos"""
        
        try:
            output_path = tempfile.mktemp(suffix=".mp4")
            
            filters = []
            enhancements = []
            
            # 1. Standard YouTube 16:9 landscape
            filters.append("scale=1920:1080:force_original_aspect_ratio=decrease")
            filters.append("pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black")
            
            # 2. High quality for longer-form content
            filters.append("eq=contrast=1.05:saturation=1.05")
            enhancements.append("standard_quality_enhancement")
            
            # 3. Noise reduction for better compression
            filters.append("hqdn3d=1.5:1:2:1")
            enhancements.append("compression_optimization")
            
            # Build high-quality command
            cmd = [
                "ffmpeg", "-i", media_path,
                "-vf", ",".join(filters),
                "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                "-maxrate", "10000k", "-bufsize", "20000k",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                "-movflags", "+faststart",
                "-y", output_path
            ]
            
            # result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            result = self.ffmpeg_optimizer.optimize_and_execute(cmd, 
                capture_output=True, timeout=300, text=True, video_info=content_analysis)
            
            if result.returncode != 0:
                raise Exception(f"YouTube standard optimization failed: {result.stderr}")
            
            return PlatformOptimizationResult(
                success=True,
                optimized_path=output_path,
                platform_features={
                    "format": "youtube_standard",
                    "aspect_ratio": "16:9",
                    "quality_tier": "premium",
                    "long_form_optimized": True
                },
                engagement_enhancements=enhancements,
                compliance_score=0.90,
                platform_specific_metadata={
                    "thumbnail_critical": True,
                    "chapters_recommended": True,
                    "end_screen_compatible": True,
                    "seo_optimized": True,
                    "monetization_friendly": True
                }
            )
            
        except Exception as e:
            logger.error(f"YouTube standard optimization failed: {e}")
            return PlatformOptimizationResult(success=False, error=str(e))
    