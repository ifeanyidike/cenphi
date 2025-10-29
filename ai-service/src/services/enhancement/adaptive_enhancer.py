"""
Adaptive Video Enhancement using Scene Analysis

This module provides context-aware video enhancement that applies
different enhancement strategies based on scene characteristics.
"""

import os
import subprocess
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import logging

from .scene_analyzer import SceneAnalyzer, SceneSegment, SceneCharacteristics

logger = logging.getLogger(__name__)


@dataclass
class EnhancementResult:
    """Result of adaptive enhancement"""
    output_path: str
    scenes_analyzed: int
    enhancements_applied: List[str]
    quality_improvement: Optional[Dict[str, float]] = None
    processing_time: float = 0.0


class AdaptiveEnhancer:
    """
    Adaptive video enhancer that analyzes scene content and applies
    context-aware enhancements for optimal results.
    """

    def __init__(self):
        self.scene_analyzer = SceneAnalyzer()
        self.enhancement_profiles = self._init_enhancement_profiles()

    def _init_enhancement_profiles(self) -> Dict[str, Dict[str, Any]]:
        """Initialize enhancement profiles for different scene types"""
        return {
            "talking_head": {
                "priority_enhancements": [
                    "face_enhancement",
                    "skin_tone_optimization",
                    "face_lighting_boost",
                ],
                "ffmpeg_filters": {
                    "face_enhancement": "unsharp=5:5:1.0:5:5:0.5",
                    "skin_tone_optimization": "colorbalance=rs=0.1:gs=-0.05:bs=-0.05:rm=0.05:gm=0:bm=-0.02",
                    "face_lighting_boost": "eq=brightness=0.05:contrast=1.1",
                    "lighting_correction": "eq=brightness=0.03:contrast=1.05",
                    "contrast_enhancement": "eq=contrast=1.08",
                    "sharpness_boost": "unsharp=5:5:0.8:5:5:0.4",
                },
            },
            "product_demo": {
                "priority_enhancements": [
                    "color_accuracy",
                    "detail_enhancement",
                    "saturation_boost",
                ],
                "ffmpeg_filters": {
                    "color_accuracy": "eq=gamma=1.0:contrast=1.08:saturation=1.12",  # Reduced contrast and saturation
                    "detail_enhancement": "unsharp=7:7:1.0:7:7:0.5",  # Reduced from 1.2 to 1.0
                    "saturation_boost": "eq=saturation=1.15",  # Reduced from 1.2 to 1.15
                    "lighting_correction": "eq=brightness=0.02:contrast=1.08",
                    "contrast_enhancement": "eq=contrast=1.10",  # Reduced from 1.12
                    "sharpness_boost": "unsharp=5:5:0.8:5:5:0.4",  # Reduced from 0.9 to 0.8
                },
            },
            "screen_recording": {
                "priority_enhancements": [
                    "text_clarity",
                    "contrast_boost",
                    "sharpness_enhancement",
                ],
                "ffmpeg_filters": {
                    "text_clarity": "unsharp=7:7:1.2:7:7:0.6,eq=contrast=1.12",  # Reduced from 1.5 and 1.15
                    "contrast_boost": "eq=contrast=1.15",  # Reduced from 1.2
                    "sharpness_enhancement": "unsharp=7:7:1.1:7:7:0.5",  # Reduced from 1.3
                    "lighting_correction": "eq=brightness=0.03:contrast=1.08",  # Reduced adjustments
                },
            },
            "b_roll": {
                "priority_enhancements": [
                    "cinematic_grading",
                    "color_enhancement",
                ],
                "ffmpeg_filters": {
                    "cinematic_grading": "colorbalance=rs=0.05:gs=0:bs=-0.05:rm=0.02:gm=0:bm=-0.02,eq=contrast=1.12:saturation=1.15",
                    # "motion_smoothness": removed - extremely slow (10-20x processing time)
                    "color_enhancement": "eq=saturation=1.15:gamma=1.03",  # Reduced from 1.2 to 1.15
                    "lighting_correction": "eq=brightness=0.03:contrast=1.1",
                    "contrast_enhancement": "eq=contrast=1.08",  # Reduced from 1.1 to 1.08
                },
            },
            "mixed": {
                "priority_enhancements": [
                    "lighting_correction",
                    "contrast_enhancement",
                    "sharpness_boost",
                ],
                "ffmpeg_filters": {
                    "lighting_correction": "eq=brightness=0.03:contrast=1.08",
                    "contrast_enhancement": "eq=contrast=1.1",
                    "sharpness_boost": "unsharp=5:5:0.9:5:5:0.4",
                    # noise_reduction removed - extremely slow, kept only as separate service
                },
            },
        }

    def enhance_video(
        self,
        input_path: str,
        output_path: str,
        quality_preset: str = "high",
        max_samples: int = 30,
        sample_interval: float = 2.0,
    ) -> EnhancementResult:
        """
        Enhance video using adaptive scene-based processing.

        Args:
            input_path: Path to input video
            output_path: Path to save enhanced video
            quality_preset: Quality preset (low/medium/high/ultra)
            max_samples: Maximum frames to sample for analysis
            sample_interval: Interval between samples in seconds

        Returns:
            EnhancementResult with details about enhancements applied
        """
        import time

        start_time = time.time()

        # Analyze video scenes
        logger.info(f"Analyzing scenes in {input_path}...")
        segments = self.scene_analyzer.analyze_video(
            input_path, sample_interval=sample_interval, max_samples=max_samples
        )

        if not segments:
            logger.warning("No segments detected, applying default enhancement")
            self._apply_default_enhancement(input_path, output_path, quality_preset)
            return EnhancementResult(
                output_path=output_path,
                scenes_analyzed=0,
                enhancements_applied=["default_enhancement"],
                processing_time=time.time() - start_time,
            )

        # Determine dominant scene type
        scene_types = [seg.characteristics.scene_type for seg in segments]
        dominant_scene = max(set(scene_types), key=scene_types.count)

        logger.info(
            f"Analyzed {len(segments)} segments. Dominant scene type: {dominant_scene}"
        )

        # Get recommended enhancements
        all_recommendations = []
        for segment in segments:
            all_recommendations.extend(segment.characteristics.recommended_enhancements)

        # Count occurrences and prioritize
        enhancement_counts = {}
        for rec in all_recommendations:
            enhancement_counts[rec] = enhancement_counts.get(rec, 0) + 1

        # Select top enhancements based on frequency
        sorted_enhancements = sorted(
            enhancement_counts.items(), key=lambda x: x[1], reverse=True
        )
        selected_enhancements = [e[0] for e in sorted_enhancements[:5]]

        # Filter enhancements based on scene quality to avoid over-processing
        selected_enhancements = self._filter_safe_enhancements(
            selected_enhancements, segments
        )

        logger.info(f"Selected enhancements (after safety filtering): {selected_enhancements}")

        # Apply enhancements
        self._apply_enhancements(
            input_path,
            output_path,
            dominant_scene,
            selected_enhancements,
            quality_preset,
        )

        processing_time = time.time() - start_time

        return EnhancementResult(
            output_path=output_path,
            scenes_analyzed=len(segments),
            enhancements_applied=selected_enhancements,
            processing_time=processing_time,
        )

    def _filter_safe_enhancements(
        self,
        enhancements: List[str],
        segments: List[SceneSegment]
    ) -> List[str]:
        """
        Filter enhancements to prevent over-processing based on scene characteristics.
        Only apply enhancements if scene actually needs them.
        """
        # Calculate average scene characteristics
        avg_sharpness = sum(s.characteristics.sharpness for s in segments) / len(segments)
        avg_saturation = sum(s.characteristics.color_saturation for s in segments) / len(segments)
        avg_contrast = sum(s.characteristics.contrast_level for s in segments) / len(segments)
        avg_brightness = sum(s.characteristics.avg_brightness for s in segments) / len(segments)

        filtered = []

        for enhancement in enhancements:
            # Sharpening filters - only apply if video is actually blurry
            if enhancement in ["sharpness_boost", "sharpness_enhancement", "detail_enhancement"]:
                if avg_sharpness < 0.4:  # Only if blurry
                    filtered.append(enhancement)
                else:
                    logger.info(f"Skipping {enhancement}: video is already sharp (score: {avg_sharpness:.2f})")

            # Saturation filters - only apply if video is desaturated
            elif enhancement in ["saturation_boost", "color_enhancement"]:
                if avg_saturation < 0.5:  # Only if desaturated
                    filtered.append(enhancement)
                else:
                    logger.info(f"Skipping {enhancement}: video is already saturated (score: {avg_saturation:.2f})")

            # Contrast filters - only apply if contrast is low
            elif enhancement in ["contrast_boost", "contrast_enhancement"]:
                if avg_contrast < 0.4:  # Only if low contrast
                    filtered.append(enhancement)
                else:
                    logger.info(f"Skipping {enhancement}: video has good contrast (score: {avg_contrast:.2f})")

            # Lighting corrections - only if lighting is poor
            elif enhancement in ["lighting_correction", "face_lighting_boost"]:
                # Apply if very dark (< 60) or very bright (> 195)
                if avg_brightness < 60 or avg_brightness > 195:
                    filtered.append(enhancement)
                else:
                    logger.info(f"Skipping {enhancement}: lighting is acceptable (brightness: {avg_brightness:.1f})")

            # Safe enhancements - always apply
            elif enhancement in ["text_clarity", "cinematic_grading", "color_accuracy"]:
                filtered.append(enhancement)

            # Noise reduction - skip entirely (too slow, separate service exists)
            elif enhancement == "noise_reduction":
                logger.info("Skipping noise_reduction: use dedicated noise reduction service for this")

            # Unknown enhancement - include it to be safe
            else:
                filtered.append(enhancement)

        # Always apply at least basic corrections if nothing else qualifies
        if not filtered:
            logger.info("No enhancements passed safety filter, applying minimal default")
            filtered = ["lighting_correction"]  # Most universally safe

        return filtered

    def _apply_enhancements(
        self,
        input_path: str,
        output_path: str,
        scene_type: str,
        enhancements: List[str],
        quality_preset: str,
    ):
        """Apply selected enhancements using FFmpeg"""
        profile = self.enhancement_profiles.get(scene_type, self.enhancement_profiles["mixed"])

        # Build FFmpeg filter chain
        filters = []
        for enhancement in enhancements:
            if enhancement in profile["ffmpeg_filters"]:
                filters.append(profile["ffmpeg_filters"][enhancement])

        if not filters:
            # Apply default if no filters matched
            filters = [
                "eq=brightness=0.03:contrast=1.08",
                "unsharp=5:5:0.8:5:5:0.4",
            ]

        filter_chain = ",".join(filters)

        # Quality preset to codec settings
        codec_settings = self._get_codec_settings(quality_preset)

        # Build FFmpeg command
        cmd = [
            "ffmpeg",
            "-i",
            input_path,
            "-vf",
            filter_chain,
            *codec_settings,
            "-y",
            output_path,
        ]

        logger.info(f"Applying enhancements with FFmpeg: {' '.join(cmd)}")

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
            )
            logger.info("Enhancement completed successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg enhancement failed: {e.stderr}")
            raise RuntimeError(f"Enhancement failed: {e.stderr}")

    def _apply_default_enhancement(
        self, input_path: str, output_path: str, quality_preset: str
    ):
        """Apply default enhancement when scene analysis fails"""
        codec_settings = self._get_codec_settings(quality_preset)

        cmd = [
            "ffmpeg",
            "-i",
            input_path,
            "-vf",
            "eq=brightness=0.03:contrast=1.08,unsharp=5:5:0.8:5:5:0.4",
            *codec_settings,
            "-y",
            output_path,
        ]

        try:
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            logger.info("Default enhancement applied successfully")
        except subprocess.CalledProcessError as e:
            logger.error(f"Default enhancement failed: {e.stderr}")
            raise RuntimeError(f"Default enhancement failed: {e.stderr}")

    def _get_codec_settings(self, quality_preset: str) -> List[str]:
        """Get FFmpeg codec settings for quality preset"""
        presets = {
            "low": ["-c:v", "libx264", "-preset", "veryfast", "-crf", "28"],
            "medium": ["-c:v", "libx264", "-preset", "medium", "-crf", "23"],
            "high": ["-c:v", "libx264", "-preset", "slow", "-crf", "20"],
            "ultra": ["-c:v", "libx264", "-preset", "veryslow", "-crf", "18"],
        }

        settings = presets.get(quality_preset, presets["high"])
        # Add audio copy
        settings.extend(["-c:a", "aac", "-b:a", "192k"])

        return settings

    def get_enhancement_preview(
        self,
        input_path: str,
        output_path: str,
        duration: int = 10,
        start_time: int = 0,
    ) -> EnhancementResult:
        """
        Generate a quick preview with enhancements applied.

        Args:
            input_path: Path to input video
            output_path: Path to save preview
            duration: Preview duration in seconds
            start_time: Start time in seconds

        Returns:
            EnhancementResult for the preview
        """
        import tempfile
        import time

        start = time.time()

        # Extract preview segment first
        temp_segment = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name

        try:
            # Extract segment
            extract_cmd = [
                "ffmpeg",
                "-i",
                input_path,
                "-ss",
                str(start_time),
                "-t",
                str(duration),
                "-c",
                "copy",
                "-y",
                temp_segment,
            ]

            subprocess.run(extract_cmd, capture_output=True, check=True)

            # Analyze and enhance the segment
            result = self.enhance_video(
                temp_segment,
                output_path,
                quality_preset="medium",
                max_samples=15,
                sample_interval=1.0,
            )

            result.processing_time = time.time() - start
            return result

        finally:
            # Cleanup temp file
            if os.path.exists(temp_segment):
                os.unlink(temp_segment)
