# src/services/platform_optimizer/platform_specs.py

from typing import Dict, List, Tuple
from dataclasses import dataclass

@dataclass
class PlatformSpec:
    """Platform-specific optimization parameters"""
    name: str
    max_duration: int  # seconds
    min_duration: int  # seconds
    aspect_ratios: List[Tuple[int, int]]  # (width, height)
    preferred_aspect: Tuple[int, int]
    max_file_size: int  # bytes
    video_codec: str
    audio_codec: str
    resolution_options: List[Tuple[int, int]]
    preferred_resolution: Tuple[int, int]
    bitrate_range: Tuple[int, int]  # min, max kbps
    frame_rate: int
    optimization_priority: str  # 'engagement', 'quality', 'size'
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "max_duration": self.max_duration,
            "min_duration": self.min_duration,
            "aspect_ratios": [f"{ar[0]}:{ar[1]}" for ar in self.aspect_ratios],
            "preferred_aspect": f"{self.preferred_aspect[0]}:{self.preferred_aspect[1]}",
            "max_file_size": self.max_file_size,
            "video_codec": self.video_codec,
            "audio_codec": self.audio_codec,
            "resolution_options": [f"{res[0]}x{res[1]}" for res in self.resolution_options],
            "preferred_resolution": f"{self.preferred_resolution[0]}x{self.preferred_resolution[1]}",
            "bitrate_range": f"{self.bitrate_range[0]}-{self.bitrate_range[1]}kbps",
            "frame_rate": self.frame_rate,
            "optimization_priority": self.optimization_priority
        }

class PlatformSpecs:
    """Comprehensive platform specifications for social media optimization"""
    
    def __init__(self):
        self.platforms = {
            "instagram_story": PlatformSpec(
                name="instagram_story",
                max_duration=15,
                min_duration=1,
                aspect_ratios=[(9, 16)],
                preferred_aspect=(9, 16),
                max_file_size=4 * 1024 * 1024,  # 4MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(720, 1280), (1080, 1920)],
                preferred_resolution=(1080, 1920),
                bitrate_range=(1000, 3000),
                frame_rate=30,
                optimization_priority="engagement"
            ),
            
            "instagram_feed": PlatformSpec(
                name="instagram_feed",
                max_duration=60,
                min_duration=3,
                aspect_ratios=[(1, 1), (16, 9), (4, 5)],
                preferred_aspect=(1, 1),
                max_file_size=4 * 1024 * 1024,  # 4MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(720, 720), (1080, 1080)],
                preferred_resolution=(1080, 1080),
                bitrate_range=(1000, 3500),
                frame_rate=30,
                optimization_priority="quality"
            ),
            
            "instagram_reels": PlatformSpec(
                name="instagram_reels",
                max_duration=90,
                min_duration=3,
                aspect_ratios=[(9, 16)],
                preferred_aspect=(9, 16),
                max_file_size=4 * 1024 * 1024,  # 4MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(720, 1280), (1080, 1920)],
                preferred_resolution=(1080, 1920),
                bitrate_range=(1500, 4000),
                frame_rate=30,
                optimization_priority="engagement"
            ),
            
            "tiktok": PlatformSpec(
                name="tiktok",
                max_duration=60,
                min_duration=3,
                aspect_ratios=[(9, 16)],
                preferred_aspect=(9, 16),
                max_file_size=72 * 1024 * 1024,  # 72MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(720, 1280), (1080, 1920)],
                preferred_resolution=(1080, 1920),
                bitrate_range=(1500, 5000),
                frame_rate=30,
                optimization_priority="engagement"
            ),
            
            "youtube_shorts": PlatformSpec(
                name="youtube_shorts",
                max_duration=60,
                min_duration=1,
                aspect_ratios=[(9, 16)],
                preferred_aspect=(9, 16),
                max_file_size=256 * 1024 * 1024,  # 256MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(720, 1280), (1080, 1920), (1440, 2560)],
                preferred_resolution=(1080, 1920),
                bitrate_range=(2000, 8000),
                frame_rate=30,
                optimization_priority="quality"
            ),
            
            "youtube_standard": PlatformSpec(
                name="youtube_standard",
                max_duration=600,  # 10 minutes
                min_duration=10,
                aspect_ratios=[(16, 9)],
                preferred_aspect=(16, 9),
                max_file_size=2 * 1024 * 1024 * 1024,  # 2GB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(1280, 720), (1920, 1080), (2560, 1440)],
                preferred_resolution=(1920, 1080),
                bitrate_range=(2500, 12000),
                frame_rate=30,
                optimization_priority="quality"
            ),
            
            "linkedin": PlatformSpec(
                name="linkedin",
                max_duration=600,  # 10 minutes
                min_duration=3,
                aspect_ratios=[(16, 9), (1, 1)],
                preferred_aspect=(16, 9),
                max_file_size=5 * 1024 * 1024 * 1024,  # 5GB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(1280, 720), (1920, 1080)],
                preferred_resolution=(1920, 1080),
                bitrate_range=(2000, 8000),
                frame_rate=30,
                optimization_priority="quality"
            ),
            
            "twitter": PlatformSpec(
                name="twitter",
                max_duration=140,
                min_duration=1,
                aspect_ratios=[(16, 9), (1, 1)],
                preferred_aspect=(16, 9),
                max_file_size=512 * 1024 * 1024,  # 512MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(1280, 720), (1920, 1080)],
                preferred_resolution=(1280, 720),
                bitrate_range=(1500, 5000),
                frame_rate=30,
                optimization_priority="engagement"
            ),
            
            "facebook": PlatformSpec(
                name="facebook",
                max_duration=240,  # 4 minutes
                min_duration=1,
                aspect_ratios=[(16, 9), (1, 1), (9, 16)],
                preferred_aspect=(16, 9),
                max_file_size=4 * 1024 * 1024 * 1024,  # 4GB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(1280, 720), (1920, 1080)],
                preferred_resolution=(1920, 1080),
                bitrate_range=(2000, 8000),
                frame_rate=30,
                optimization_priority="quality"
            ),
            
            "whatsapp": PlatformSpec(
                name="whatsapp",
                max_duration=30,
                min_duration=1,
                aspect_ratios=[(16, 9), (1, 1), (9, 16)],
                preferred_aspect=(16, 9),
                max_file_size=16 * 1024 * 1024,  # 16MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(720, 480), (1280, 720)],
                preferred_resolution=(1280, 720),
                bitrate_range=(500, 2000),
                frame_rate=30,
                optimization_priority="size"
            ),
            
            # Generic platforms
            "instagram": PlatformSpec(
                name="instagram",
                max_duration=60,
                min_duration=3,
                aspect_ratios=[(1, 1), (9, 16), (4, 5)],
                preferred_aspect=(1, 1),
                max_file_size=4 * 1024 * 1024,  # 4MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(720, 720), (1080, 1080), (1080, 1920)],
                preferred_resolution=(1080, 1080),
                bitrate_range=(1000, 3500),
                frame_rate=30,
                optimization_priority="engagement"
            ),
            
            "youtube": PlatformSpec(
                name="youtube",
                max_duration=600,  # 10 minutes for general
                min_duration=1,
                aspect_ratios=[(16, 9), (9, 16)],
                preferred_aspect=(16, 9),
                max_file_size=256 * 1024 * 1024,  # 256MB
                video_codec="libx264",
                audio_codec="aac",
                resolution_options=[(1280, 720), (1920, 1080), (1080, 1920)],
                preferred_resolution=(1920, 1080),
                bitrate_range=(2000, 8000),
                frame_rate=30,
                optimization_priority="quality"
            )
        }
    
    def get_platform_spec(self, platform: str) -> PlatformSpec:
        """Get platform specification by name"""
        platform_lower = platform.lower().replace(" ", "_").replace("-", "_")
        return self.platforms.get(platform_lower)
    
    def get_all_platforms(self) -> List[str]:
        """Get list of all supported platforms"""
        return list(self.platforms.keys())
    
    def get_platform_categories(self) -> Dict[str, List[str]]:
        """Get platforms grouped by categories"""
        return {
            "short_form": [
                "instagram_story", "instagram_reels", "tiktok", "youtube_shorts"
            ],
            "standard": [
                "instagram_feed", "youtube_standard", "linkedin", "twitter", "facebook"
            ],
            "messaging": ["whatsapp"],
            "vertical": [
                "instagram_story", "instagram_reels", "tiktok", "youtube_shorts"
            ],
            "horizontal": [
                "youtube_standard", "linkedin", "twitter", "facebook"
            ],
            "square": ["instagram_feed"],
            "instagram_all": [
                "instagram_story", "instagram_feed", "instagram_reels", "instagram"
            ],
            "youtube_all": ["youtube_shorts", "youtube_standard", "youtube"],
            "high_engagement": [
                "tiktok", "instagram_reels", "youtube_shorts", "instagram_story"
            ],
            "professional": ["linkedin", "youtube_standard"],
            "social": ["facebook", "twitter", "instagram"],
            "mobile_first": [
                "tiktok", "instagram_story", "instagram_reels", "youtube_shorts", "whatsapp"
            ]
        }
    
    def get_platforms_by_aspect_ratio(self, aspect_ratio: str) -> List[str]:
        """Get platforms that support specific aspect ratio"""
        
        aspect_map = {
            "16:9": (16, 9),
            "9:16": (9, 16),
            "1:1": (1, 1),
            "4:5": (4, 5),
            "4:3": (4, 3)
        }
        
        if aspect_ratio not in aspect_map:
            return []
        
        target_aspect = aspect_map[aspect_ratio]
        
        supported_platforms = []
        for platform_name, spec in self.platforms.items():
            if target_aspect in spec.aspect_ratios:
                supported_platforms.append(platform_name)
        
        return supported_platforms
    
    def get_optimal_platforms_for_content(
        self,
        duration: int,
        aspect_ratio: str,
        content_type: str = "general"
    ) -> List[str]:
        """Get optimal platforms for given content characteristics"""
        
        suitable_platforms = []
        
        for platform_name, spec in self.platforms.items():
            # Check duration compatibility
            if not (spec.min_duration <= duration <= spec.max_duration):
                continue
            
            # Check aspect ratio compatibility
            aspect_map = {
                "16:9": (16, 9),
                "9:16": (9, 16),
                "1:1": (1, 1),
                "4:5": (4, 5),
                "4:3": (4, 3)
            }
            
            if aspect_ratio in aspect_map:
                target_aspect = aspect_map[aspect_ratio]
                if target_aspect not in spec.aspect_ratios:
                    continue
            
            # Content type optimization
            if content_type == "short_form" and spec.max_duration > 90:
                continue
            elif content_type == "long_form" and spec.max_duration < 120:
                continue
            elif content_type == "professional" and spec.optimization_priority != "quality":
                continue
            elif content_type == "viral" and spec.optimization_priority != "engagement":
                continue
            
            suitable_platforms.append(platform_name)
        
        return suitable_platforms
    
    def validate_content_for_platform(
        self,
        platform: str,
        duration: int,
        file_size: int,
        width: int,
        height: int
    ) -> Dict[str, any]:
        """Validate content against platform requirements"""
        
        spec = self.get_platform_spec(platform)
        if not spec:
            return {
                "valid": False,
                "errors": [f"Unknown platform: {platform}"],
                "warnings": []
            }
        
        errors = []
        warnings = []
        
        # Check duration
        if duration < spec.min_duration:
            errors.append(f"Duration {duration}s below minimum {spec.min_duration}s")
        elif duration > spec.max_duration:
            errors.append(f"Duration {duration}s exceeds maximum {spec.max_duration}s")
        
        # Check file size
        if file_size > spec.max_file_size:
            warnings.append(f"File size {file_size} bytes exceeds recommended {spec.max_file_size} bytes")
        
        # Check resolution
        if (width, height) not in spec.resolution_options:
            closest_res = min(
                spec.resolution_options,
                key=lambda res: abs(res[0] - width) + abs(res[1] - height)
            )
            warnings.append(f"Resolution {width}x{height} not optimal, consider {closest_res[0]}x{closest_res[1]}")
        
        # Check aspect ratio
        current_aspect = width / height if height > 0 else 1
        supported_aspects = [w/h for w, h in spec.aspect_ratios]
        
        if not any(abs(current_aspect - asp) < 0.1 for asp in supported_aspects):
            preferred = spec.preferred_aspect
            warnings.append(f"Aspect ratio not optimal for {platform}, consider {preferred[0]}:{preferred[1]}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "recommendations": {
                "preferred_resolution": spec.preferred_resolution,
                "preferred_aspect": spec.preferred_aspect,
                "max_duration": spec.max_duration,
                "max_file_size": spec.max_file_size
            }
        }