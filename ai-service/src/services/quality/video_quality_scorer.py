# src/services/quality/video_quality_scorer.py

import os
import subprocess
import logging
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)


@dataclass
class QualityMetrics:
    """Video quality metrics"""
    # Technical metrics
    resolution_score: float  # 0-100
    bitrate_score: float  # 0-100
    frame_rate_score: float  # 0-100
    audio_quality_score: float  # 0-100

    # Perceptual metrics
    sharpness_score: float  # 0-100
    brightness_score: float  # 0-100
    contrast_score: float  # 0-100
    color_saturation_score: float  # 0-100

    # Overall score
    overall_score: float  # 0-100

    # Raw values for comparison
    raw_metrics: Dict[str, Any] = None


@dataclass
class QualityComparison:
    """Before/after quality comparison"""
    before: QualityMetrics
    after: QualityMetrics
    improvement_percentage: float
    degradation_areas: list
    improvement_areas: list
    recommendation: str


class VideoQualityScorer:
    """
    Automatic video quality assessment using FFmpeg and OpenCV.

    Provides:
    - Objective technical metrics (resolution, bitrate, fps)
    - Perceptual quality metrics (sharpness, brightness, contrast)
    - Before/after comparison
    - Quality recommendations
    """

    # Quality thresholds
    RESOLUTION_THRESHOLDS = {
        (3840, 2160): 100,  # 4K
        (1920, 1080): 90,   # 1080p
        (1280, 720): 75,    # 720p
        (854, 480): 60,     # 480p
        (640, 360): 40,     # 360p
    }

    BITRATE_THRESHOLDS = {
        "4k": (20000, 50000),      # 20-50 Mbps
        "1080p": (5000, 15000),    # 5-15 Mbps
        "720p": (2500, 7500),      # 2.5-7.5 Mbps
        "480p": (1000, 3000),      # 1-3 Mbps
    }

    FPS_THRESHOLDS = {
        60: 100,
        30: 90,
        24: 80,
        15: 50,
    }

    def __init__(self):
        logger.info("VideoQualityScorer initialized")

    def score_video(self, video_path: str) -> QualityMetrics:
        """
        Score video quality comprehensively.

        Args:
            video_path: Path to video file

        Returns:
            QualityMetrics with all scores
        """
        logger.info(f"Scoring video quality: {video_path}")

        # Get technical metrics from FFprobe
        tech_metrics = self._get_technical_metrics(video_path)

        # Get perceptual metrics from video analysis
        percep_metrics = self._get_perceptual_metrics(video_path)

        # Calculate scores
        resolution_score = self._score_resolution(
            tech_metrics["width"],
            tech_metrics["height"]
        )

        bitrate_score = self._score_bitrate(
            tech_metrics["bitrate"],
            tech_metrics["width"],
            tech_metrics["height"]
        )

        frame_rate_score = self._score_frame_rate(tech_metrics["fps"])

        audio_quality_score = self._score_audio(
            tech_metrics.get("audio_bitrate", 0),
            tech_metrics.get("audio_sample_rate", 0)
        )

        # Perceptual scores (0-100 scale)
        sharpness_score = percep_metrics["sharpness"] * 100
        brightness_score = self._score_brightness(percep_metrics["brightness"])
        contrast_score = percep_metrics["contrast"] * 100
        color_saturation_score = percep_metrics["saturation"] * 100

        # Calculate overall score (weighted average)
        overall_score = (
            resolution_score * 0.20 +
            bitrate_score * 0.15 +
            frame_rate_score * 0.10 +
            audio_quality_score * 0.10 +
            sharpness_score * 0.15 +
            brightness_score * 0.10 +
            contrast_score * 0.10 +
            color_saturation_score * 0.10
        )

        return QualityMetrics(
            resolution_score=round(resolution_score, 2),
            bitrate_score=round(bitrate_score, 2),
            frame_rate_score=round(frame_rate_score, 2),
            audio_quality_score=round(audio_quality_score, 2),
            sharpness_score=round(sharpness_score, 2),
            brightness_score=round(brightness_score, 2),
            contrast_score=round(contrast_score, 2),
            color_saturation_score=round(color_saturation_score, 2),
            overall_score=round(overall_score, 2),
            raw_metrics={**tech_metrics, **percep_metrics}
        )

    def compare_quality(
        self,
        before_path: str,
        after_path: str
    ) -> QualityComparison:
        """
        Compare quality before and after processing.

        Args:
            before_path: Path to original video
            after_path: Path to processed video

        Returns:
            QualityComparison with detailed analysis
        """
        logger.info(f"Comparing quality: {before_path} vs {after_path}")

        before_metrics = self.score_video(before_path)
        after_metrics = self.score_video(after_path)

        # Calculate improvement
        improvement = after_metrics.overall_score - before_metrics.overall_score
        improvement_pct = (improvement / before_metrics.overall_score) * 100

        # Identify improvement and degradation areas
        improvement_areas = []
        degradation_areas = []

        metrics_to_check = [
            ("resolution", before_metrics.resolution_score, after_metrics.resolution_score),
            ("bitrate", before_metrics.bitrate_score, after_metrics.bitrate_score),
            ("sharpness", before_metrics.sharpness_score, after_metrics.sharpness_score),
            ("brightness", before_metrics.brightness_score, after_metrics.brightness_score),
            ("contrast", before_metrics.contrast_score, after_metrics.contrast_score),
            ("color_saturation", before_metrics.color_saturation_score, after_metrics.color_saturation_score),
        ]

        for name, before_val, after_val in metrics_to_check:
            diff = after_val - before_val
            if diff > 2:  # Significant improvement (> 2 points)
                improvement_areas.append(f"{name}: +{diff:.1f}")
            elif diff < -2:  # Significant degradation
                degradation_areas.append(f"{name}: {diff:.1f}")

        # Generate recommendation
        recommendation = self._generate_recommendation(
            before_metrics,
            after_metrics,
            improvement_pct,
            degradation_areas
        )

        return QualityComparison(
            before=before_metrics,
            after=after_metrics,
            improvement_percentage=round(improvement_pct, 2),
            degradation_areas=degradation_areas,
            improvement_areas=improvement_areas,
            recommendation=recommendation
        )

    def _get_technical_metrics(self, video_path: str) -> Dict[str, Any]:
        """Extract technical metrics using FFprobe"""
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            video_path
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            raise Exception(f"FFprobe failed: {result.stderr}")

        data = json.loads(result.stdout)

        # Extract video stream info
        video_stream = next((s for s in data.get("streams", []) if s["codec_type"] == "video"), {})
        audio_stream = next((s for s in data.get("streams", []) if s["codec_type"] == "audio"), {})

        # Parse frame rate
        fps_str = video_stream.get("r_frame_rate", "30/1")
        fps_parts = fps_str.split("/")
        fps = float(fps_parts[0]) / float(fps_parts[1]) if len(fps_parts) == 2 else 30.0

        return {
            "width": int(video_stream.get("width", 0)),
            "height": int(video_stream.get("height", 0)),
            "bitrate": int(data.get("format", {}).get("bit_rate", 0)) // 1000,  # Convert to kbps
            "fps": fps,
            "duration": float(data.get("format", {}).get("duration", 0)),
            "audio_bitrate": int(audio_stream.get("bit_rate", 0)) // 1000 if audio_stream else 0,
            "audio_sample_rate": int(audio_stream.get("sample_rate", 0)) if audio_stream else 0,
            "codec": video_stream.get("codec_name", "unknown")
        }

    def _get_perceptual_metrics(self, video_path: str) -> Dict[str, float]:
        """
        Extract perceptual quality metrics using OpenCV.

        Samples 5 frames from video and averages metrics.
        """
        try:
            import cv2
            import numpy as np
        except ImportError:
            logger.warning("OpenCV not available, using default perceptual metrics")
            return {
                "sharpness": 0.5,
                "brightness": 128,
                "contrast": 0.5,
                "saturation": 0.5
            }

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise Exception(f"Failed to open video: {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        sample_indices = [int(total_frames * i / 5) for i in range(1, 6)]

        sharpness_values = []
        brightness_values = []
        contrast_values = []
        saturation_values = []

        for idx in sample_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()

            if not ret:
                continue

            # Sharpness (Laplacian variance)
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            sharpness = laplacian.var() / 1000.0  # Normalize to 0-1 range (approx)
            sharpness_values.append(min(sharpness, 1.0))

            # Brightness (mean luminance)
            brightness = np.mean(gray)
            brightness_values.append(brightness)

            # Contrast (std dev of luminance)
            contrast = np.std(gray) / 128.0  # Normalize to 0-1 range
            contrast_values.append(min(contrast, 1.0))

            # Saturation (mean saturation in HSV)
            hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
            saturation = np.mean(hsv[:, :, 1]) / 255.0  # Normalize to 0-1
            saturation_values.append(saturation)

        cap.release()

        return {
            "sharpness": np.mean(sharpness_values) if sharpness_values else 0.5,
            "brightness": np.mean(brightness_values) if brightness_values else 128,
            "contrast": np.mean(contrast_values) if contrast_values else 0.5,
            "saturation": np.mean(saturation_values) if saturation_values else 0.5
        }

    def _score_resolution(self, width: int, height: int) -> float:
        """Score resolution (0-100)"""
        for (w, h), score in self.RESOLUTION_THRESHOLDS.items():
            if width >= w and height >= h:
                return score

        # Below 360p
        return max(20, (width * height) / (640 * 360) * 40)

    def _score_bitrate(self, bitrate_kbps: int, width: int, height: int) -> float:
        """Score bitrate relative to resolution (0-100)"""
        # Determine resolution category
        if width >= 3840:
            category = "4k"
        elif width >= 1920:
            category = "1080p"
        elif width >= 1280:
            category = "720p"
        else:
            category = "480p"

        min_bitrate, max_bitrate = self.BITRATE_THRESHOLDS[category]

        if bitrate_kbps >= max_bitrate:
            return 100
        elif bitrate_kbps >= min_bitrate:
            # Linear scale between min and max
            return 70 + (bitrate_kbps - min_bitrate) / (max_bitrate - min_bitrate) * 30
        else:
            # Below minimum
            return max(20, (bitrate_kbps / min_bitrate) * 70)

    def _score_frame_rate(self, fps: float) -> float:
        """Score frame rate (0-100)"""
        for threshold, score in self.FPS_THRESHOLDS.items():
            if fps >= threshold:
                return score

        # Below 15 fps
        return max(20, (fps / 15) * 50)

    def _score_audio(self, bitrate_kbps: int, sample_rate: int) -> float:
        """Score audio quality (0-100)"""
        if bitrate_kbps == 0:
            return 50  # No audio (not necessarily bad for some videos)

        bitrate_score = min(100, (bitrate_kbps / 320) * 100)  # 320 kbps = perfect
        sample_rate_score = min(100, (sample_rate / 48000) * 100)  # 48kHz = perfect

        return (bitrate_score + sample_rate_score) / 2

    def _score_brightness(self, brightness: float) -> float:
        """Score brightness (0-100), optimal is around 128"""
        optimal = 128
        deviation = abs(brightness - optimal)

        # Penalize deviation from optimal
        score = 100 - (deviation / optimal) * 100

        return max(0, min(100, score))

    def _generate_recommendation(
        self,
        before: QualityMetrics,
        after: QualityMetrics,
        improvement_pct: float,
        degradation_areas: list
    ) -> str:
        """Generate recommendation based on comparison"""
        if improvement_pct > 10:
            return f"✅ Excellent improvement ({improvement_pct:.1f}%). Processing enhanced video quality significantly."
        elif improvement_pct > 5:
            return f"✅ Good improvement ({improvement_pct:.1f}%). Processing improved video quality."
        elif improvement_pct > 0:
            return f"✓ Minor improvement ({improvement_pct:.1f}%). Processing had positive effect."
        elif improvement_pct > -5:
            if degradation_areas:
                return f"⚠ Slight quality loss ({abs(improvement_pct):.1f}%). Areas affected: {', '.join(degradation_areas)}"
            else:
                return f"≈ Quality maintained ({improvement_pct:.1f}% change). Processing preserved quality."
        else:
            return f"❌ Quality degradation ({abs(improvement_pct):.1f}%). Review processing settings. Areas affected: {', '.join(degradation_areas)}"
