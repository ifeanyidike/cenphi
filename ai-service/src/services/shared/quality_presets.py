# src/services/shared/quality_presets.py

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

class QualityPresets:
    """Comprehensive quality presets for different encoding scenarios"""
    
    def __init__(self):
        # Core quality presets
        self.presets = {
            "high": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 18,
                "audio_codec": "aac",
                "audio_bitrate": "192k",
                "max_bitrate": "8000k",
                "buffer_size": "16000k",
                "pixel_format": "yuv420p"
            },
            "medium": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 23,
                "audio_codec": "aac",
                "audio_bitrate": "128k",
                "max_bitrate": "4000k",
                "buffer_size": "8000k",
                "pixel_format": "yuv420p"
            },
            "low": {
                "video_codec": "libx264",
                "preset": "ultrafast",
                "crf": 28,
                "audio_codec": "aac",
                "audio_bitrate": "96k",
                "max_bitrate": "2000k",
                "buffer_size": "4000k",
                "pixel_format": "yuv420p"
            }
        }
        
        # Platform-specific presets
        self.platform_presets = {
            "instagram": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 23,
                "audio_codec": "aac",
                "audio_bitrate": "128k",
                "max_bitrate": "3500k",
                "buffer_size": "7000k",
                "pixel_format": "yuv420p"
            },
            "tiktok": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 23,
                "audio_codec": "aac",
                "audio_bitrate": "128k",
                "max_bitrate": "4000k",
                "buffer_size": "8000k",
                "pixel_format": "yuv420p"
            },
            "youtube": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 20,
                "audio_codec": "aac",
                "audio_bitrate": "192k",
                "max_bitrate": "8000k",
                "buffer_size": "16000k",
                "pixel_format": "yuv420p"
            },
            "twitter": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 23,
                "audio_codec": "aac",
                "audio_bitrate": "128k",
                "max_bitrate": "5000k",
                "buffer_size": "10000k",
                "pixel_format": "yuv420p"
            },
            "linkedin": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 21,
                "audio_codec": "aac",
                "audio_bitrate": "192k",
                "max_bitrate": "6000k",
                "buffer_size": "12000k",
                "pixel_format": "yuv420p"
            },
            "whatsapp": {
                "video_codec": "libx264",
                "preset": "fast",
                "crf": 26,
                "audio_codec": "aac",
                "audio_bitrate": "96k",
                "max_bitrate": "1500k",
                "buffer_size": "3000k",
                "pixel_format": "yuv420p"
            }
        }
        
        # Audio-only presets
        self.audio_presets = {
            "high": {
                "codec": "aac",
                "bitrate": "320k",
                "sample_rate": "48000",
                "channels": 2
            },
            "medium": {
                "codec": "aac",
                "bitrate": "192k",
                "sample_rate": "48000",
                "channels": 2
            },
            "low": {
                "codec": "aac",
                "bitrate": "128k",
                "sample_rate": "44100",
                "channels": 2
            },
            "podcast": {
                "codec": "aac",
                "bitrate": "128k",
                "sample_rate": "44100",
                "channels": 1  # Mono for speech
            },
            "voice": {
                "codec": "aac",
                "bitrate": "64k",
                "sample_rate": "22050",
                "channels": 1
            }
        }
        
        # Image quality presets
        self.image_presets = {
            "high": {
                "format": "jpg",
                "quality": 90,
                "compression": "low"
            },
            "medium": {
                "format": "jpg", 
                "quality": 80,
                "compression": "medium"
            },
            "low": {
                "format": "jpg",
                "quality": 70,
                "compression": "high"
            },
            "web_optimized": {
                "format": "webp",
                "quality": 85,
                "compression": "medium"
            }
        }
        
        logger.debug("QualityPresets initialized")
    
    def get_preset(self, quality: str) -> Dict[str, Any]:
        """Get core quality preset by name"""
        return self.presets.get(quality, self.presets["medium"])
    
    def get_platform_preset(self, platform: str) -> Dict[str, Any]:
        """Get platform-specific preset"""
        platform_key = platform.lower().replace("_", "").replace("-", "")
        
        # Map common platform variations
        platform_mapping = {
            "instagram": "instagram",
            "instagramstory": "instagram",
            "instagramfeed": "instagram", 
            "instagramreels": "instagram",
            "tiktok": "tiktok",
            "youtube": "youtube",
            "youtubeshorts": "youtube",
            "youtubestandard": "youtube",
            "twitter": "twitter",
            "x": "twitter",
            "linkedin": "linkedin",
            "whatsapp": "whatsapp",
            "facebook": "instagram"  # Similar specs
        }
        
        mapped_platform = platform_mapping.get(platform_key, "instagram")
        return self.platform_presets.get(mapped_platform, self.platform_presets["instagram"])
    
    def get_audio_preset(self, preset_name: str) -> Dict[str, Any]:
        """Get audio-specific preset"""
        return self.audio_presets.get(preset_name, self.audio_presets["medium"])
    
    def get_image_preset(self, preset_name: str) -> Dict[str, Any]:
        """Get image-specific preset"""
        return self.image_presets.get(preset_name, self.image_presets["medium"])
    
    def get_combined_preset(self, quality: str, platform: str = None) -> Dict[str, Any]:
        """Get combined preset merging quality and platform requirements"""
        
        base_preset = self.get_preset(quality)
        
        if platform:
            platform_preset = self.get_platform_preset(platform)
            
            # Merge presets (platform takes priority for conflicts)
            combined = base_preset.copy()
            combined.update(platform_preset)
            
            # Adjust quality level based on base quality
            if quality == "high":
                combined["crf"] = max(combined.get("crf", 23) - 3, 15)
            elif quality == "low":
                combined["crf"] = min(combined.get("crf", 23) + 5, 32)
            
            return combined
        
        return base_preset
    
    def get_optimized_preset_for_specs(
        self,
        target_specs: Dict[str, Any],
        quality: str = "medium"
    ) -> Dict[str, Any]:
        """Get optimized preset based on target specifications"""
        
        base_preset = self.get_preset(quality)
        
        # Adjust based on target specs
        if target_specs.get("max_file_size"):
            max_size_mb = target_specs["max_file_size"] / (1024 * 1024)
            
            if max_size_mb < 10:  # Very small files
                base_preset["crf"] = min(base_preset.get("crf", 23) + 5, 32)
                base_preset["preset"] = "fast"
                base_preset["audio_bitrate"] = "96k"
            elif max_size_mb < 50:  # Small files
                base_preset["crf"] = min(base_preset.get("crf", 23) + 2, 28)
                base_preset["audio_bitrate"] = "128k"
        
        if target_specs.get("max_duration") and target_specs["max_duration"] < 30:
            # Short videos can use higher quality
            base_preset["crf"] = max(base_preset.get("crf", 23) - 2, 18)
        
        if target_specs.get("priority") == "speed":
            base_preset["preset"] = "ultrafast"
        elif target_specs.get("priority") == "quality":
            base_preset["preset"] = "fast"
            base_preset["crf"] = max(base_preset.get("crf", 23) - 3, 15)
        
        return base_preset
    
    def get_available_qualities(self) -> List[str]:
        """Get list of available quality presets"""
        return list(self.presets.keys())
    
    def get_available_platforms(self) -> List[str]:
        """Get list of available platform presets"""
        return list(self.platform_presets.keys())
    
    def get_audio_qualities(self) -> List[str]:
        """Get list of available audio quality presets"""
        return list(self.audio_presets.keys())
    
    def get_image_qualities(self) -> List[str]:
        """Get list of available image quality presets"""
        return list(self.image_presets.keys())
    
    def validate_preset(self, preset: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a preset configuration"""
        
        validation_result = {
            "valid": True,
            "issues": [],
            "warnings": []
        }
        
        # Check required fields
        required_video_fields = ["video_codec", "audio_codec"]
        for field in required_video_fields:
            if field not in preset:
                validation_result["valid"] = False
                validation_result["issues"].append(f"Missing required field: {field}")
        
        # Validate CRF range
        crf = preset.get("crf")
        if crf is not None:
            if not isinstance(crf, (int, float)) or crf < 0 or crf > 51:
                validation_result["valid"] = False
                validation_result["issues"].append(f"Invalid CRF value: {crf} (must be 0-51)")
        
        # Validate codec
        supported_codecs = ["libx264", "libx265", "h264", "h265", "hevc"]
        video_codec = preset.get("video_codec")
        if video_codec and video_codec not in supported_codecs:
            validation_result["warnings"].append(f"Unsupported video codec: {video_codec}")
        
        return validation_result
    
    def create_custom_preset(
        self,
        base_quality: str,
        overrides: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a custom preset based on a base quality with overrides"""
        
        base_preset = self.get_preset(base_quality)
        custom_preset = base_preset.copy()
        custom_preset.update(overrides)
        
        # Validate the custom preset
        validation = self.validate_preset(custom_preset)
        if not validation["valid"]:
            logger.warning(f"Custom preset validation issues: {validation['issues']}")
        
        return custom_preset