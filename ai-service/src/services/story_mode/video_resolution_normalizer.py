# src/services/story_mode/video_resolution_normalizer.py

import os
import logging
import tempfile
import subprocess
from typing import Dict, Any, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = logging.getLogger(__name__)

class VideoResolutionNormalizer:
    """
    Advanced video resolution normalizer for story mode
    Handles different resolution videos and creates seamless, professional story videos
    """

    def __init__(self):
        self._storage_manager = None
        self._ffmpeg_optimizer = None

        # Standard resolution configurations for different output types
        self.resolution_profiles = {
            "instagram_story": {
                "width": 1080,
                "height": 1920,
                "aspect_ratio": "9:16",
                "min_bitrate": "2500k",
                "max_bitrate": "4000k"
            },
            "instagram_reel": {
                "width": 1080,
                "height": 1920,
                "aspect_ratio": "9:16",
                "min_bitrate": "3500k",
                "max_bitrate": "5000k"
            },
            "youtube_shorts": {
                "width": 1080,
                "height": 1920,
                "aspect_ratio": "9:16",
                "min_bitrate": "4000k",
                "max_bitrate": "8000k"
            },
            "tiktok": {
                "width": 1080,
                "height": 1920,
                "aspect_ratio": "9:16",
                "min_bitrate": "3000k",
                "max_bitrate": "6000k"
            },
            "linkedin": {
                "width": 1920,
                "height": 1080,
                "aspect_ratio": "16:9",
                "min_bitrate": "4000k",
                "max_bitrate": "8000k"
            },
            "square": {
                "width": 1080,
                "height": 1080,
                "aspect_ratio": "1:1",
                "min_bitrate": "3000k",
                "max_bitrate": "6000k"
            },
            "default": {
                "width": 1920,
                "height": 1080,
                "aspect_ratio": "16:9",
                "min_bitrate": "3000k",
                "max_bitrate": "6000k"
            }
        }

        logger.info("VideoResolutionNormalizer initialized with advanced resolution profiles")

    @property
    def storage_manager(self):
        if self._storage_manager is None:
            from src.utils.storage import StorageManager
            self._storage_manager = StorageManager()
        return self._storage_manager

    @property
    def ffmpeg_optimizer(self):
        if self._ffmpeg_optimizer is None:
            from src.utils.ffmpeg_optimizer import FFmpegOptimizer
            self._ffmpeg_optimizer = FFmpegOptimizer()
        return self._ffmpeg_optimizer

    def normalize_video_resolutions_for_story(
        self,
        video_segments: List[Dict[str, Any]],
        target_profile: str = "default",
        temp_files: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Normalize multiple video segments to consistent resolution and quality

        Args:
            video_segments: List of video segment dictionaries with 'media_url' keys
            target_profile: Target resolution profile name
            temp_files: List to track temporary files for cleanup

        Returns:
            List of normalized video segments with updated paths
        """

        if temp_files is None:
            temp_files = []

        try:
            profile = self.resolution_profiles.get(target_profile, self.resolution_profiles["default"])
            logger.info(f"🎯 Normalizing {len(video_segments)} video segments to {profile['width']}x{profile['height']}")

            # Analyze all videos first to determine optimal settings
            video_info_futures = []
            with ThreadPoolExecutor(max_workers=min(8, len(video_segments))) as executor:
                for segment in video_segments:
                    media_url = segment.get('media_url')
                    if media_url:
                        future = executor.submit(self._analyze_video_properties, media_url)
                        video_info_futures.append((segment, future))

                # Collect analysis results
                analyzed_segments = []
                for segment, future in video_info_futures:
                    try:
                        video_info = future.result()
                        segment['_video_info'] = video_info
                        analyzed_segments.append(segment)
                    except Exception as e:
                        logger.warning(f"Failed to analyze video {segment.get('media_url')}: {e}")
                        analyzed_segments.append(segment)  # Include anyway, will handle in normalization

            # Determine optimal normalization strategy
            normalization_strategy = self._determine_normalization_strategy(analyzed_segments, profile)
            logger.info(f"📊 Using normalization strategy: {normalization_strategy['strategy_type']}")

            # Normalize videos in parallel
            normalized_segments = []
            normalize_futures = []

            with ThreadPoolExecutor(max_workers=min(6, len(analyzed_segments))) as executor:
                for segment in analyzed_segments:
                    future = executor.submit(
                        self._normalize_single_video,
                        segment,
                        profile,
                        normalization_strategy,
                        temp_files
                    )
                    normalize_futures.append((segment, future))

                # Collect normalized results
                for segment, future in normalize_futures:
                    try:
                        normalized_segment = future.result()
                        normalized_segments.append(normalized_segment)
                        logger.info(f"✅ Normalized video: {os.path.basename(segment.get('media_url', ''))}")
                    except Exception as e:
                        logger.error(f"❌ Failed to normalize video {segment.get('media_url')}: {e}")
                        # Use original segment as fallback
                        normalized_segments.append(segment)

            logger.info(f"🎬 Successfully normalized {len(normalized_segments)} video segments")
            return normalized_segments

        except Exception as e:
            logger.error(f"Video resolution normalization failed: {e}")
            # Return original segments as fallback
            return video_segments

    def _analyze_video_properties(self, media_url: str) -> Dict[str, Any]:
        """Analyze video properties using ffprobe"""

        try:
            # Download video if it's a URL
            if media_url.startswith('http'):
                local_path = self.storage_manager.download_media(media_url)
                if not local_path:
                    raise Exception("Failed to download media for analysis")
            else:
                local_path = media_url

            if not os.path.exists(local_path):
                raise Exception(f"Video file not found: {local_path}")

            # Use ffprobe to get video information
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', local_path
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            import json
            probe_data = json.loads(result.stdout)

            # Extract video stream information
            video_stream = None
            audio_stream = None

            for stream in probe_data.get('streams', []):
                if stream.get('codec_type') == 'video' and not video_stream:
                    video_stream = stream
                elif stream.get('codec_type') == 'audio' and not audio_stream:
                    audio_stream = stream

            if not video_stream:
                raise Exception("No video stream found")

            return {
                'width': int(video_stream.get('width', 0)),
                'height': int(video_stream.get('height', 0)),
                'duration': float(probe_data.get('format', {}).get('duration', 0)),
                'bitrate': int(probe_data.get('format', {}).get('bit_rate', 0)),
                'fps': eval(video_stream.get('r_frame_rate', '30/1')),
                'codec': video_stream.get('codec_name', 'unknown'),
                'aspect_ratio': video_stream.get('width', 1) / video_stream.get('height', 1),
                'has_audio': audio_stream is not None,
                'file_size': int(probe_data.get('format', {}).get('size', 0))
            }

        except Exception as e:
            logger.warning(f"Video analysis failed for {media_url}: {e}")
            # Return default values as fallback
            return {
                'width': 1920, 'height': 1080, 'duration': 30.0,
                'bitrate': 2000000, 'fps': 30, 'codec': 'h264',
                'aspect_ratio': 16/9, 'has_audio': True, 'file_size': 10000000
            }

    def _determine_normalization_strategy(
        self,
        segments: List[Dict[str, Any]],
        target_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Determine optimal normalization strategy based on input video analysis"""

        video_infos = []
        for segment in segments:
            if '_video_info' in segment:
                video_infos.append(segment['_video_info'])

        if not video_infos:
            return {"strategy_type": "conservative", "quality_level": "balanced"}

        # Analyze input characteristics
        resolutions = [(info['width'], info['height']) for info in video_infos]
        bitrates = [info['bitrate'] for info in video_infos]
        aspect_ratios = [info['aspect_ratio'] for info in video_infos]

        target_width = target_profile['width']
        target_height = target_profile['height']
        target_aspect = target_width / target_height

        # Determine strategy based on input diversity
        unique_resolutions = len(set(resolutions))
        aspect_ratio_variance = max(aspect_ratios) - min(aspect_ratios) if aspect_ratios else 0
        avg_bitrate = sum(bitrates) / len(bitrates) if bitrates else 2000000

        strategy = {
            "target_width": target_width,
            "target_height": target_height,
            "target_aspect": target_aspect,
            "pad_color": "black",
            "scale_mode": "pad",  # pad, crop, stretch
            "quality_preset": "balanced",
            "bitrate_strategy": "adaptive"
        }

        if unique_resolutions > 3 or aspect_ratio_variance > 0.5:
            # High diversity - use padding for consistency
            strategy.update({
                "strategy_type": "consistency_focused",
                "scale_mode": "pad",
                "pad_color": "#1a1a1a",  # Professional dark padding
                "quality_preset": "high"
            })
        elif avg_bitrate < 1500000:
            # Low quality inputs - enhance quality
            strategy.update({
                "strategy_type": "quality_enhancement",
                "scale_mode": "crop",
                "quality_preset": "premium",
                "bitrate_strategy": "boost"
            })
        else:
            # Standard processing
            strategy.update({
                "strategy_type": "optimized",
                "scale_mode": "crop",
                "quality_preset": "balanced"
            })

        return strategy

    def _normalize_single_video(
        self,
        segment: Dict[str, Any],
        target_profile: Dict[str, Any],
        strategy: Dict[str, Any],
        temp_files: List[str]
    ) -> Dict[str, Any]:
        """Normalize a single video segment"""

        try:
            media_url = segment.get('media_url')
            if not media_url:
                return segment

            # Download if URL
            if media_url.startswith('http'):
                local_path = self.storage_manager.download_media(media_url)
                if local_path:
                    temp_files.append(local_path)
            else:
                local_path = media_url

            if not local_path or not os.path.exists(local_path):
                logger.warning(f"Cannot access video file: {media_url}")
                return segment

            # Generate output path
            output_path = tempfile.mktemp(suffix='_normalized.mp4')
            temp_files.append(output_path)

            # Build FFmpeg command for normalization
            cmd = self._build_normalization_command(local_path, output_path, target_profile, strategy)

            # Execute normalization
            logger.debug(f"Normalizing video with command: {' '.join(cmd)}")
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                logger.warning(f"Video normalization failed: {result.stderr}")
                return segment

            if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
                logger.warning(f"Normalization produced empty file: {output_path}")
                return segment

            # Update segment with normalized path
            normalized_segment = segment.copy()
            normalized_segment['media_url'] = output_path
            normalized_segment['_is_normalized'] = True
            normalized_segment['_normalization_profile'] = target_profile

            logger.debug(f"✅ Video normalized: {os.path.basename(media_url)} -> {os.path.basename(output_path)}")
            return normalized_segment

        except Exception as e:
            logger.error(f"Single video normalization failed: {e}")
            return segment

    def _build_normalization_command(
        self,
        input_path: str,
        output_path: str,
        target_profile: Dict[str, Any],
        strategy: Dict[str, Any]
    ) -> List[str]:
        """Build FFmpeg command for video normalization"""

        target_width = strategy['target_width']
        target_height = strategy['target_height']
        scale_mode = strategy['scale_mode']
        quality_preset = strategy['quality_preset']

        # Base command
        cmd = ['ffmpeg', '-y', '-i', input_path]

        # Video filters
        vf_filters = []

        if scale_mode == 'pad':
            # Pad to maintain aspect ratio with letterboxing/pillarboxing
            pad_color = strategy.get('pad_color', 'black')
            vf_filters.append(f"scale={target_width}:{target_height}:force_original_aspect_ratio=decrease")
            vf_filters.append(f"pad={target_width}:{target_height}:(ow-iw)/2:(oh-ih)/2:{pad_color}")
        elif scale_mode == 'crop':
            # Crop to fill target dimensions
            vf_filters.append(f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase")
            vf_filters.append(f"crop={target_width}:{target_height}")
        else:
            # Stretch (not recommended but available)
            vf_filters.append(f"scale={target_width}:{target_height}")

        # Quality and encoding settings
        if quality_preset == 'premium':
            cmd.extend(['-c:v', 'libx264', '-preset', 'slow', '-crf', '18'])
            bitrate = target_profile.get('max_bitrate', '4000k')
        elif quality_preset == 'high':
            cmd.extend(['-c:v', 'libx264', '-preset', 'medium', '-crf', '20'])
            bitrate = target_profile.get('max_bitrate', '3500k')
        else:  # balanced
            cmd.extend(['-c:v', 'libx264', '-preset', 'fast', '-crf', '23'])
            bitrate = target_profile.get('min_bitrate', '2500k')

        # Add bitrate limiting
        cmd.extend(['-maxrate', bitrate, '-bufsize', f'{int(bitrate[:-1]) * 2}k'])

        # Audio settings
        cmd.extend(['-c:a', 'aac', '-b:a', '128k', '-ar', '44100'])

        # Pixel format and other settings
        cmd.extend([
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-r', '30'  # Force 30fps for consistency
        ])

        # Apply video filters
        if vf_filters:
            cmd.extend(['-vf', ','.join(vf_filters)])

        # Output path
        cmd.append(output_path)

        return cmd

    def get_recommended_profile_for_platform(self, platform: str) -> str:
        """Get recommended resolution profile for a specific platform"""

        platform_lower = platform.lower()

        if any(p in platform_lower for p in ['instagram_story', 'story']):
            return 'instagram_story'
        elif any(p in platform_lower for p in ['instagram_reel', 'reel']):
            return 'instagram_reel'
        elif 'tiktok' in platform_lower:
            return 'tiktok'
        elif 'youtube_shorts' in platform_lower or 'shorts' in platform_lower:
            return 'youtube_shorts'
        elif 'linkedin' in platform_lower:
            return 'linkedin'
        elif any(p in platform_lower for p in ['instagram_feed', 'square']):
            return 'square'
        else:
            return 'default'

    def cleanup_normalized_files(self, segments: List[Dict[str, Any]]):
        """Clean up normalized video files"""

        for segment in segments:
            if segment.get('_is_normalized'):
                media_url = segment.get('media_url')
                if media_url and os.path.exists(media_url):
                    try:
                        os.unlink(media_url)
                        logger.debug(f"Cleaned up normalized file: {os.path.basename(media_url)}")
                    except Exception as e:
                        logger.warning(f"Failed to cleanup normalized file {media_url}: {e}")