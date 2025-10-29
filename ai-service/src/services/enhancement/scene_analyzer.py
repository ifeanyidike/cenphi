# ai-service/src/services/enhancement/scene_analyzer.py

import cv2
import numpy as np
import logging
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict

logger = logging.getLogger(__name__)


@dataclass
class SceneCharacteristics:
    """Characteristics of a video scene"""
    scene_type: str  # "talking_head", "product_demo", "screen_recording", "b_roll", "mixed"
    lighting_quality: str  # "excellent", "good", "poor", "very_poor"
    avg_brightness: float  # 0-255
    contrast_level: float  # 0-1
    color_saturation: float  # 0-1
    motion_level: str  # "static", "low", "medium", "high"
    face_detected: bool
    face_size_ratio: float  # 0-1, proportion of frame
    background_complexity: str  # "simple", "moderate", "complex"
    sharpness: float  # 0-1
    noise_level: float  # 0-1
    has_text_overlay: bool
    dominant_colors: List[Tuple[int, int, int]]  # RGB colors
    recommended_enhancements: List[str]


@dataclass
class SceneSegment:
    """A segment of video with consistent characteristics"""
    start_time: float
    end_time: float
    characteristics: SceneCharacteristics
    sample_frame_path: Optional[str] = None


class SceneAnalyzer:
    """
    IMPROVEMENT #1: Content-Aware Scene Analysis & Adaptive Enhancement

    Analyzes video content to understand scene characteristics and recommend
    intelligent, context-aware enhancements. Different content types require
    different enhancement strategies:

    - Talking heads: Face-focused lighting, skin tone optimization
    - Product demos: Color accuracy, detail enhancement
    - Screen recordings: Text clarity, contrast boost
    - B-roll: Cinematic grading, motion smoothness
    """

    # Scene type detection thresholds
    FACE_SIZE_THRESHOLD_TALKING_HEAD = 0.15  # Face occupies 15%+ of frame
    MOTION_THRESHOLD_LOW = 0.02
    MOTION_THRESHOLD_MEDIUM = 0.05
    MOTION_THRESHOLD_HIGH = 0.10

    def __init__(self):
        self._face_cascade = None
        logger.info("SceneAnalyzer initialized")

    @property
    def face_cascade(self):
        """Lazy load face detection cascade"""
        if self._face_cascade is None:
            try:
                # Load OpenCV's pre-trained face detector
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                self._face_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception as e:
                logger.warning(f"Failed to load face cascade: {e}")
                self._face_cascade = None
        return self._face_cascade

    def analyze_video(
        self,
        video_path: str,
        sample_interval: float = 2.0,
        max_samples: int = 30
    ) -> List[SceneSegment]:
        """
        Analyze video content and segment by scene characteristics.

        Args:
            video_path: Path to video file
            sample_interval: Seconds between samples
            max_samples: Maximum frames to analyze (performance limit)

        Returns:
            List of scene segments with characteristics
        """
        logger.info(f"Analyzing video scenes: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0

        # Calculate sampling
        frame_interval = int(sample_interval * fps)
        sample_count = min(max_samples, int(duration / sample_interval))

        logger.info(f"Video: {duration:.1f}s, {total_frames} frames, {fps:.1f} fps")
        logger.info(f"Sampling {sample_count} frames at {sample_interval}s intervals")

        # Analyze samples
        frame_analyses = []
        prev_frame = None

        for i in range(sample_count):
            frame_number = i * frame_interval
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
            ret, frame = cap.read()

            if not ret:
                break

            timestamp = frame_number / fps
            characteristics = self._analyze_frame(frame, prev_frame)

            frame_analyses.append({
                'timestamp': timestamp,
                'characteristics': characteristics
            })

            prev_frame = frame

        cap.release()

        # Segment by similar characteristics
        segments = self._segment_by_characteristics(frame_analyses, duration)

        logger.info(f"Identified {len(segments)} scene segments")
        return segments

    def _analyze_frame(
        self,
        frame: np.ndarray,
        prev_frame: Optional[np.ndarray] = None
    ) -> SceneCharacteristics:
        """Analyze a single frame for characteristics"""

        # Convert to different color spaces for analysis
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # Lighting analysis
        avg_brightness = float(np.mean(gray))
        brightness_std = float(np.std(gray))

        # Contrast
        contrast = self._calculate_contrast(gray)

        # Color saturation
        saturation = float(np.mean(hsv[:, :, 1])) / 255.0

        # Face detection
        face_detected, face_size_ratio = self._detect_faces(gray, frame.shape)

        # Motion detection
        motion_level = self._detect_motion(gray, prev_frame) if prev_frame is not None else 0.0

        # Sharpness
        sharpness = self._calculate_sharpness(gray)

        # Noise estimation
        noise_level = self._estimate_noise(gray)

        # Background complexity
        background_complexity = self._analyze_background_complexity(gray)

        # Dominant colors
        dominant_colors = self._extract_dominant_colors(frame)

        # Text detection (simple edge-based heuristic)
        has_text_overlay = self._detect_text_overlay(gray)

        # Classify lighting quality
        lighting_quality = self._classify_lighting(avg_brightness, brightness_std, contrast)

        # Classify motion level
        motion_category = self._classify_motion(motion_level)

        # Determine scene type
        scene_type = self._classify_scene_type(
            face_detected,
            face_size_ratio,
            motion_level,
            has_text_overlay,
            background_complexity
        )

        # Recommend enhancements
        recommended_enhancements = self._recommend_enhancements(
            scene_type=scene_type,
            lighting_quality=lighting_quality,
            contrast_level=contrast,
            sharpness=sharpness,
            noise_level=noise_level,
            saturation=saturation
        )

        return SceneCharacteristics(
            scene_type=scene_type,
            lighting_quality=lighting_quality,
            avg_brightness=avg_brightness,
            contrast_level=contrast,
            color_saturation=saturation,
            motion_level=motion_category,
            face_detected=face_detected,
            face_size_ratio=face_size_ratio,
            background_complexity=background_complexity,
            sharpness=sharpness,
            noise_level=noise_level,
            has_text_overlay=has_text_overlay,
            dominant_colors=dominant_colors,
            recommended_enhancements=recommended_enhancements
        )

    def _calculate_contrast(self, gray: np.ndarray) -> float:
        """Calculate image contrast using RMS contrast"""
        return float(np.std(gray)) / 128.0  # Normalize to 0-1

    def _detect_faces(self, gray: np.ndarray, frame_shape: Tuple) -> Tuple[bool, float]:
        """Detect faces and calculate size ratio"""
        if self.face_cascade is None:
            return False, 0.0

        try:
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )

            if len(faces) == 0:
                return False, 0.0

            # Calculate largest face size ratio
            frame_area = frame_shape[0] * frame_shape[1]
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            face_area = largest_face[2] * largest_face[3]
            size_ratio = face_area / frame_area

            return True, float(size_ratio)
        except Exception as e:
            logger.warning(f"Face detection error: {e}")
            return False, 0.0

    def _detect_motion(self, gray: np.ndarray, prev_gray: np.ndarray) -> float:
        """Calculate motion between frames using frame difference"""
        if prev_gray is None:
            return 0.0

        try:
            # Resize for faster processing
            curr_small = cv2.resize(gray, (160, 90))
            prev_small = cv2.resize(prev_gray, (160, 90))

            # Calculate absolute difference
            diff = cv2.absdiff(curr_small, prev_small)
            motion = float(np.mean(diff)) / 255.0

            return motion
        except Exception as e:
            logger.warning(f"Motion detection error: {e}")
            return 0.0

    def _calculate_sharpness(self, gray: np.ndarray) -> float:
        """Calculate image sharpness using Laplacian variance"""
        try:
            laplacian = cv2.Laplacian(gray, cv2.CV_64F)
            variance = float(laplacian.var())
            # Normalize (empirically, sharp images have variance > 100)
            return min(variance / 500.0, 1.0)
        except Exception as e:
            logger.warning(f"Sharpness calculation error: {e}")
            return 0.5

    def _estimate_noise(self, gray: np.ndarray) -> float:
        """Estimate noise level using local standard deviation"""
        try:
            # Use median filter to estimate noise
            median = cv2.medianBlur(gray, 5)
            noise = cv2.absdiff(gray, median)
            noise_level = float(np.mean(noise)) / 255.0
            return noise_level
        except Exception as e:
            logger.warning(f"Noise estimation error: {e}")
            return 0.0

    def _analyze_background_complexity(self, gray: np.ndarray) -> str:
        """Analyze background complexity using edge density"""
        try:
            edges = cv2.Canny(gray, 50, 150)
            edge_density = float(np.sum(edges > 0)) / edges.size

            if edge_density < 0.05:
                return "simple"
            elif edge_density < 0.15:
                return "moderate"
            else:
                return "complex"
        except Exception as e:
            logger.warning(f"Background analysis error: {e}")
            return "moderate"

    def _extract_dominant_colors(self, frame: np.ndarray, k: int = 5) -> List[Tuple[int, int, int]]:
        """Extract dominant colors using k-means clustering"""
        try:
            # Resize for faster processing
            small = cv2.resize(frame, (100, 100))
            pixels = small.reshape(-1, 3).astype(np.float32)

            # K-means clustering
            criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
            _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

            # Convert to RGB tuples
            centers = centers.astype(int)
            dominant = [tuple(map(int, c[::-1])) for c in centers]  # BGR to RGB

            return dominant[:3]  # Top 3 colors
        except Exception as e:
            logger.warning(f"Color extraction error: {e}")
            return []

    def _detect_text_overlay(self, gray: np.ndarray) -> bool:
        """Detect if frame has text overlay using edge patterns"""
        try:
            # Text typically has strong horizontal edges
            edges = cv2.Canny(gray, 100, 200)

            # Check for text-like patterns (high edge density in certain regions)
            height, width = edges.shape

            # Divide into horizontal bands
            band_height = height // 5
            bands = [edges[i*band_height:(i+1)*band_height, :] for i in range(5)]

            # Text overlay typically in top or bottom bands
            top_density = float(np.sum(bands[0] > 0)) / bands[0].size
            bottom_density = float(np.sum(bands[4] > 0)) / bands[4].size

            return top_density > 0.15 or bottom_density > 0.15
        except Exception as e:
            logger.warning(f"Text detection error: {e}")
            return False

    def _classify_lighting(self, brightness: float, brightness_std: float, contrast: float) -> str:
        """Classify lighting quality"""
        # Good lighting: well-exposed (70-180), good contrast (>0.3), consistent
        if 70 <= brightness <= 180 and contrast > 0.3 and brightness_std < 60:
            return "excellent"
        elif 50 <= brightness <= 200 and contrast > 0.25:
            return "good"
        elif brightness < 40 or brightness > 220 or contrast < 0.15:
            return "very_poor"
        else:
            return "poor"

    def _classify_motion(self, motion_level: float) -> str:
        """Classify motion level"""
        if motion_level < self.MOTION_THRESHOLD_LOW:
            return "static"
        elif motion_level < self.MOTION_THRESHOLD_MEDIUM:
            return "low"
        elif motion_level < self.MOTION_THRESHOLD_HIGH:
            return "medium"
        else:
            return "high"

    def _classify_scene_type(
        self,
        face_detected: bool,
        face_size_ratio: float,
        motion_level: float,
        has_text_overlay: bool,
        background_complexity: str
    ) -> str:
        """Classify scene type based on characteristics"""

        # Screen recording: has text overlay, simple background, low motion
        if has_text_overlay and background_complexity == "simple" and motion_level < 0.05:
            return "screen_recording"

        # Talking head: large face, simple/moderate background
        if face_detected and face_size_ratio > self.FACE_SIZE_THRESHOLD_TALKING_HEAD:
            return "talking_head"

        # Product demo: moderate motion, no large faces
        if not face_detected and 0.03 < motion_level < 0.08:
            return "product_demo"

        # B-roll: higher motion, complex background
        if motion_level > 0.08 or background_complexity == "complex":
            return "b_roll"

        # Default
        return "mixed"

    def _recommend_enhancements(
        self,
        scene_type: str,
        lighting_quality: str,
        contrast_level: float,
        sharpness: float,
        noise_level: float,
        saturation: float
    ) -> List[str]:
        """Recommend context-aware enhancements"""

        enhancements = []

        # Scene-specific base enhancements
        if scene_type == "talking_head":
            enhancements.append("face_enhancement")
            enhancements.append("skin_tone_optimization")
            if lighting_quality in ["poor", "very_poor"]:
                enhancements.append("face_lighting_boost")

        elif scene_type == "product_demo":
            enhancements.append("color_accuracy")
            enhancements.append("detail_enhancement")
            if saturation < 0.3:
                enhancements.append("saturation_boost")

        elif scene_type == "screen_recording":
            enhancements.append("text_clarity")
            enhancements.append("contrast_boost")
            enhancements.append("sharpness_enhancement")

        elif scene_type == "b_roll":
            enhancements.append("cinematic_grading")
            enhancements.append("motion_smoothness")
            if saturation < 0.4:
                enhancements.append("color_enhancement")

        # Universal fixes based on quality issues
        if lighting_quality in ["poor", "very_poor"]:
            enhancements.append("lighting_correction")

        if contrast_level < 0.25:
            enhancements.append("contrast_enhancement")

        if sharpness < 0.3:
            enhancements.append("sharpness_boost")

        if noise_level > 0.25:  # Increased threshold - noise_reduction is very slow
            enhancements.append("noise_reduction")

        return list(set(enhancements))  # Remove duplicates

    def _segment_by_characteristics(
        self,
        frame_analyses: List[Dict],
        total_duration: float
    ) -> List[SceneSegment]:
        """Segment video by similar scene characteristics"""

        if not frame_analyses:
            return []

        segments = []
        current_segment_start = 0.0
        current_characteristics = frame_analyses[0]['characteristics']

        for i in range(1, len(frame_analyses)):
            prev_char = frame_analyses[i-1]['characteristics']
            curr_char = frame_analyses[i]['characteristics']

            # Check if characteristics changed significantly
            if self._characteristics_differ(prev_char, curr_char):
                # End current segment
                segment = SceneSegment(
                    start_time=current_segment_start,
                    end_time=frame_analyses[i]['timestamp'],
                    characteristics=current_characteristics
                )
                segments.append(segment)

                # Start new segment
                current_segment_start = frame_analyses[i]['timestamp']
                current_characteristics = curr_char

        # Add final segment
        if current_segment_start < total_duration:
            segment = SceneSegment(
                start_time=current_segment_start,
                end_time=total_duration,
                characteristics=current_characteristics
            )
            segments.append(segment)

        return segments

    def _characteristics_differ(
        self,
        char1: SceneCharacteristics,
        char2: SceneCharacteristics
    ) -> bool:
        """Check if two scene characteristics differ significantly"""

        # Major differences
        if char1.scene_type != char2.scene_type:
            return True

        if char1.lighting_quality != char2.lighting_quality:
            return True

        if char1.motion_level != char2.motion_level:
            return True

        # Minor differences (threshold-based)
        brightness_diff = abs(char1.avg_brightness - char2.avg_brightness)
        if brightness_diff > 40:
            return True

        contrast_diff = abs(char1.contrast_level - char2.contrast_level)
        if contrast_diff > 0.2:
            return True

        return False
