# src/services/platform_optimizer/platform_encoding_specs.py
"""
Platform-specific encoding parameters based on official platform documentation.

References:
- TikTok: https://support.tiktok.com/en/using-tiktok/creating-videos/video-format
- Instagram: https://help.instagram.com/1631821640426723
- YouTube: https://support.google.com/youtube/answer/1722171
- LinkedIn: https://www.linkedin.com/help/linkedin/answer/a522735
- Facebook: https://www.facebook.com/business/help/484584349398893

Last updated: 2025-01-22
FFmpeg version: 7.1.1
"""

from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class PlatformEncodingSpecs:
    """
    Provides platform-specific encoding parameters for optimal upload compatibility.

    All parameters are based on official platform documentation and tested with FFmpeg 7.1.1.
    """

    # Platform encoding specifications
    SPECS = {
        # TikTok - optimized for mobile viewing, fast loading
        "tiktok": {
            "preset": "faster",          # Fast encoding for quick uploads
            "crf": "23",                  # Balanced quality (TikTok re-encodes anyway)
            "profile": "main",            # H.264 Main profile
            "level": "4.1",               # H.264 level 4.1 (supports 1080p 30fps)
            "max_bitrate": "8000k",       # 8 Mbps max (TikTok recommended)
            "buffer_size": "16000k",      # 2x max bitrate
            "fps": 30,                    # 30fps standard (TikTok supports up to 60)
            "audio_codec": "aac",
            "audio_bitrate": "128k",      # AAC 128kbps
            "audio_sample_rate": 44100,
            "movflags": "+faststart",     # Enable progressive download
            "pix_fmt": "yuv420p",         # Standard compatibility
            "gop_size": 60,               # 2 seconds at 30fps (good for seeking)
        },

        # Instagram Reels - similar to TikTok
        "instagram_reels": {
            "preset": "faster",
            "crf": "23",
            "profile": "main",
            "level": "4.1",
            "max_bitrate": "8000k",
            "buffer_size": "16000k",
            "fps": 30,
            "audio_codec": "aac",
            "audio_bitrate": "128k",
            "audio_sample_rate": 44100,
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 60,
        },

        # Instagram Story - lighter encoding for quick loading
        "instagram_story": {
            "preset": "faster",
            "crf": "24",                  # Slightly lower quality (15s limit, less critical)
            "profile": "main",
            "level": "4.0",
            "max_bitrate": "5000k",       # Lower bitrate for stories
            "buffer_size": "10000k",
            "fps": 30,
            "audio_codec": "aac",
            "audio_bitrate": "128k",
            "audio_sample_rate": 44100,
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 60,
        },

        # Instagram Feed - higher quality for permanent posts
        "instagram_feed": {
            "preset": "medium",           # Better quality for feed posts
            "crf": "21",                  # Higher quality
            "profile": "high",            # H.264 High profile
            "level": "4.1",
            "max_bitrate": "10000k",      # 10 Mbps for feed
            "buffer_size": "20000k",
            "fps": 30,
            "audio_codec": "aac",
            "audio_bitrate": "128k",
            "audio_sample_rate": 44100,
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 60,
        },

        # YouTube Shorts - optimized for mobile, similar to TikTok
        "youtube_shorts": {
            "preset": "faster",
            "crf": "23",
            "profile": "high",
            "level": "4.2",               # Level 4.2 for better quality
            "max_bitrate": "10000k",      # 10 Mbps (YouTube recommendation)
            "buffer_size": "20000k",
            "fps": 30,
            "audio_codec": "aac",
            "audio_bitrate": "128k",
            "audio_sample_rate": 48000,   # YouTube prefers 48kHz
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 60,
        },

        # YouTube Standard - highest quality, supports 60fps
        "youtube_standard": {
            "preset": "medium",           # Higher quality for long-form
            "crf": "20",                  # Excellent quality
            "profile": "high",
            "level": "4.2",
            "max_bitrate": "15000k",      # 15 Mbps for 1080p
            "buffer_size": "30000k",
            "fps": 60,                    # Support 60fps for YouTube
            "audio_codec": "aac",
            "audio_bitrate": "192k",      # Higher audio quality
            "audio_sample_rate": 48000,
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 120,              # 2 seconds at 60fps
        },

        # LinkedIn - professional quality, desktop-first
        "linkedin": {
            "preset": "medium",
            "crf": "21",
            "profile": "high",
            "level": "4.1",
            "max_bitrate": "10000k",      # 10 Mbps
            "buffer_size": "20000k",
            "fps": 30,
            "audio_codec": "aac",
            "audio_bitrate": "192k",      # Higher quality audio for business
            "audio_sample_rate": 48000,
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 60,
        },

        # Facebook - balanced quality
        "facebook": {
            "preset": "medium",
            "crf": "22",
            "profile": "high",
            "level": "4.1",
            "max_bitrate": "8000k",
            "buffer_size": "16000k",
            "fps": 30,
            "audio_codec": "aac",
            "audio_bitrate": "128k",
            "audio_sample_rate": 44100,
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 60,
        },

        # Twitter/X - lightweight for fast loading
        "twitter": {
            "preset": "faster",
            "crf": "23",
            "profile": "main",
            "level": "4.0",
            "max_bitrate": "6000k",       # Lower bitrate for Twitter
            "buffer_size": "12000k",
            "fps": 30,
            "audio_codec": "aac",
            "audio_bitrate": "128k",
            "audio_sample_rate": 44100,
            "movflags": "+faststart",
            "pix_fmt": "yuv420p",
            "gop_size": 60,
        },
    }

    # Default fallback (high quality, compatible)
    DEFAULT_SPEC = {
        "preset": "medium",
        "crf": "21",
        "profile": "high",
        "level": "4.1",
        "max_bitrate": "10000k",
        "buffer_size": "20000k",
        "fps": 30,
        "audio_codec": "aac",
        "audio_bitrate": "128k",
        "audio_sample_rate": 48000,
        "movflags": "+faststart",
        "pix_fmt": "yuv420p",
        "gop_size": 60,
    }

    @classmethod
    def get_encoding_params(cls, platform: str) -> Dict[str, Any]:
        """
        Get platform-specific encoding parameters.

        Args:
            platform: Platform name (case-insensitive)

        Returns:
            Dictionary of encoding parameters safe for FFmpeg 7.1.1
        """
        platform_lower = platform.lower() if platform else ""

        # Direct match
        if platform_lower in cls.SPECS:
            spec = cls.SPECS[platform_lower].copy()
            logger.info(f"Using platform-specific encoding for: {platform_lower}")
            return spec

        # Fallback for generic platform names (e.g., "instagram" -> "instagram_reels")
        if platform_lower == "instagram":
            logger.info("Generic 'instagram' detected, using instagram_reels encoding")
            return cls.SPECS["instagram_reels"].copy()

        if platform_lower == "youtube":
            logger.info("Generic 'youtube' detected, using youtube_standard encoding")
            return cls.SPECS["youtube_standard"].copy()

        # Default fallback
        logger.warning(f"Unknown platform '{platform}', using default encoding parameters")
        return cls.DEFAULT_SPEC.copy()

    @classmethod
    def build_ffmpeg_video_params(cls, platform: str) -> list:
        """
        Build FFmpeg video encoding parameters array.

        Args:
            platform: Platform name

        Returns:
            List of FFmpeg parameters (e.g., ["-c:v", "libx264", "-preset", "faster", ...])
        """
        spec = cls.get_encoding_params(platform)

        params = [
            "-c:v", "libx264",
            "-preset", spec["preset"],
            "-crf", spec["crf"],
            "-profile:v", spec["profile"],
            "-level", spec["level"],
            "-maxrate", spec["max_bitrate"],
            "-bufsize", spec["buffer_size"],
            "-pix_fmt", spec["pix_fmt"],
            "-movflags", spec["movflags"],
        ]

        # Add GOP size (keyframe interval)
        params.extend(["-g", str(spec["gop_size"])])

        # Add FPS if specified
        if "fps" in spec and spec["fps"]:
            params.extend(["-r", str(spec["fps"])])

        return params

    @classmethod
    def build_ffmpeg_audio_params(cls, platform: str) -> list:
        """
        Build FFmpeg audio encoding parameters array.

        Args:
            platform: Platform name

        Returns:
            List of FFmpeg parameters (e.g., ["-c:a", "aac", "-b:a", "128k", ...])
        """
        spec = cls.get_encoding_params(platform)

        return [
            "-c:a", spec["audio_codec"],
            "-b:a", spec["audio_bitrate"],
            "-ar", str(spec["audio_sample_rate"]),
        ]

    @classmethod
    def get_target_fps(cls, platform: str) -> int:
        """Get target FPS for platform."""
        spec = cls.get_encoding_params(platform)
        return spec.get("fps", 30)

    @classmethod
    def get_max_bitrate(cls, platform: str) -> str:
        """Get maximum bitrate for platform."""
        spec = cls.get_encoding_params(platform)
        return spec.get("max_bitrate", "10000k")
