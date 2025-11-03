"""
Advanced Smart Cropping System v2
Uses multiple detection strategies with intelligent fallbacks:
1. Motion-based subject tracking (works for any moving subject)
2. Optical flow analysis (tracks camera movement)
3. Edge/saliency detection (finds visual interest points)
4. Face detection (traditional fallback)
"""

import cv2
import numpy as np
from typing import Tuple, List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class SmartCropV2:
    """
    Improved smart cropping with multi-strategy detection
    """

    def __init__(self):
        self.face_cascade = self._init_face_cascade()

    def _init_face_cascade(self):
        """Initialize face cascade with fallback"""
        try:
            cascade_paths = [
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
                '/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml',
                '/opt/conda/share/opencv4/haarcascades/haarcascade_frontalface_default.xml'
            ]

            for path in cascade_paths:
                try:
                    cascade = cv2.CascadeClassifier(path)
                    if not cascade.empty():
                        return cascade
                except:
                    continue

            logger.warning("Face cascade not found")
            return None
        except Exception as e:
            logger.warning(f"Face cascade init failed: {e}")
            return None

    def detect_optimal_center(
        self,
        video_path: str,
        target_aspect: float,
        sample_frames: int = 7
    ) -> Tuple[int, int]:
        """
        OPTIMIZED multi-strategy detection with intelligent fallbacks

        Performance optimizations:
        - Single pass through video (all strategies run on same frames)
        - Resolution downscaling (max 720p for analysis)
        - Early exit on first success
        - Memory-efficient frame processing

        Strategy priority:
        1. Motion tracking (fast, detects any moving subject)
        2. Face detection (fast, traditional)
        3. Optical flow (medium speed, camera movement)
        4. Saliency detection (slowest, visual interest)
        5. Center fallback
        """
        cap = None
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception("Cannot open video")

            orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            if orig_width <= 0 or orig_height <= 0 or total_frames <= 0:
                return (960, 540)

            center_x, center_y = orig_width // 2, orig_height // 2

            # Check if smart crop is needed (early exit)
            source_aspect = orig_width / orig_height
            aspect_diff = abs(source_aspect - target_aspect) / target_aspect

            if aspect_diff < 0.15:
                logger.info(f"📐 Aspect ratio close enough ({aspect_diff:.2%}), using center")
                return (center_x, center_y)

            # OPTIMIZATION: Downscale for analysis (max 720p height)
            max_analysis_height = 720
            if orig_height > max_analysis_height:
                scale_factor = max_analysis_height / orig_height
                analysis_width = int(orig_width * scale_factor)
                analysis_height = max_analysis_height
                logger.info(f"📊 Downscaling from {orig_width}x{orig_height} to {analysis_width}x{analysis_height} for analysis")
            else:
                scale_factor = 1.0
                analysis_width = orig_width
                analysis_height = orig_height

            logger.info(f"🎯 Aspect difference ({aspect_diff:.2%}), analyzing content (single pass)...")

            # OPTIMIZATION: Single-pass detection - run all strategies on same frames
            sample_frames = min(sample_frames, total_frames, 7)
            frame_indices = np.linspace(0, total_frames - 1, sample_frames, dtype=int)

            # Collectors for each strategy (memory-efficient)
            motion_data = []
            face_data = []
            flow_data = []
            saliency_data = []

            prev_gray = None

            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ret, frame = cap.read()

                if not ret or frame is None:
                    continue

                # Downscale frame for analysis
                if scale_factor < 1.0:
                    frame = cv2.resize(frame, (analysis_width, analysis_height), interpolation=cv2.INTER_AREA)

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray_blur = cv2.GaussianBlur(gray, (21, 21), 0)

                # Strategy 1: Motion tracking (lightweight)
                if prev_gray is not None:
                    frame_diff = cv2.absdiff(prev_gray, gray_blur)
                    _, thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)
                    motion_data.append(thresh)

                # Strategy 2: Face detection (optimized for off-center faces)
                if self.face_cascade:
                    faces = self.face_cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.1,   # More sensitive (smaller steps)
                        minNeighbors=2,    # More permissive (catches more candidates)
                        minSize=(max(15, analysis_width // 25), max(15, analysis_height // 25))  # Smaller min size
                    )
                    if len(faces) > 0:
                        face_data.append(faces)

                prev_gray = gray_blur

            # PRIORITIZE FACE DETECTION FIRST - faces are most reliable for speaker-centered content
            # Strategy 1: Face detection (highest priority for speakers)
            if len(face_data) >= 1:  # Even single detection is valuable
                face_center = self._analyze_face_data(face_data, analysis_width, analysis_height)
                if face_center:
                    final_x = int(face_center[0] / scale_factor)
                    final_y = int(face_center[1] / scale_factor)
                    logger.info(f"✓ Face detection found subject at ({final_x}, {final_y})")
                    return (final_x, final_y)

            # Strategy 2: Motion tracking (fallback for non-speaker content)
            if len(motion_data) >= 2:
                motion_center = self._analyze_motion_data(motion_data, analysis_width, analysis_height)
                if motion_center:
                    # Scale back to original resolution
                    final_x = int(motion_center[0] / scale_factor)
                    final_y = int(motion_center[1] / scale_factor)
                    logger.info(f"✓ Motion tracking found subject at ({final_x}, {final_y})")
                    return (final_x, final_y)

            # If fast methods fail, try slower methods (only if needed)
            logger.info("⚠️ Fast methods found nothing, trying advanced detection...")

            # Strategy 3: Optical flow (medium speed) - run only if fast methods failed
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            flow_center = self._detect_by_optical_flow(cap, analysis_width, analysis_height, total_frames, min(5, sample_frames))
            if flow_center:
                final_x = int(flow_center[0] / scale_factor)
                final_y = int(flow_center[1] / scale_factor)
                logger.info(f"✓ Optical flow detected focus at ({final_x}, {final_y})")
                return (final_x, final_y)

            # Strategy 4: Saliency (slowest) - last resort
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            saliency_center = self._detect_by_saliency(cap, analysis_width, analysis_height, total_frames, min(4, sample_frames))
            if saliency_center:
                final_x = int(saliency_center[0] / scale_factor)
                final_y = int(saliency_center[1] / scale_factor)
                logger.info(f"✓ Saliency detection found interest at ({final_x}, {final_y})")
                return (final_x, final_y)

            # Strategy 5: Center fallback
            logger.info("⚠️ All detection methods found nothing, using geometric center")
            return (center_x, center_y)

        except Exception as e:
            logger.error(f"Smart crop detection failed: {e}")
            return (960, 540)
        finally:
            if cap:
                cap.release()

    def _analyze_motion_data(
        self,
        motion_data: List[np.ndarray],
        width: int,
        height: int
    ) -> Optional[Tuple[int, int]]:
        """Analyze collected motion data to find subject center"""
        try:
            # Accumulate motion
            motion_accumulation = np.zeros((height, width), dtype=np.float32)
            for motion_map in motion_data:
                motion_accumulation += motion_map.astype(np.float32)

            motion_accumulation = motion_accumulation / len(motion_data)

            # Find center of mass
            moments = cv2.moments(motion_accumulation)
            if moments['m00'] > 300:  # REDUCED threshold for better off-center detection
                center_x = int(moments['m10'] / moments['m00'])
                center_y = int(moments['m01'] / moments['m00'])

                # IMPROVED: Adaptive margins based on motion strength
                motion_strength = moments['m00'] / (width * height)

                # Strong motion (>5% of frame) = minimal margin (5%)
                # Weak motion (<1% of frame) = larger margin (10%)
                if motion_strength > 0.05:
                    margin_ratio = 0.05  # Very permissive for strong motion
                elif motion_strength > 0.02:
                    margin_ratio = 0.07  # Moderate for medium motion
                else:
                    margin_ratio = 0.10  # More restrictive for weak motion

                margin_x = int(width * margin_ratio)
                margin_y = int(height * margin_ratio)

                # Accept if within bounds (even near edges for strong motion)
                if margin_x < center_x < (width - margin_x) and margin_y < center_y < (height - margin_y):
                    return (center_x, center_y)

                # FALLBACK: If detection is strong but near edge, clamp it
                if motion_strength > 0.03:
                    clamped_x = int(np.clip(center_x, margin_x, width - margin_x))
                    clamped_y = int(np.clip(center_y, margin_y, height - margin_y))
                    logger.info(f"⚠️ Strong motion near edge, clamping from ({center_x}, {center_y}) to ({clamped_x}, {clamped_y})")
                    return (clamped_x, clamped_y)

            return None
        except Exception as e:
            logger.debug(f"Motion analysis failed: {e}")
            return None

    def _analyze_face_data(
        self,
        face_data: List[np.ndarray],
        width: int,
        height: int
    ) -> Optional[Tuple[int, int]]:
        """
        Analyze collected face detection data with aggressive off-center detection.

        KEY IMPROVEMENT: No clamping - return actual face position even if near edge.
        The goal is to center the crop on the speaker, not to avoid edge positions.
        """
        try:
            weighted_centers = []

            for faces in face_data:
                for (x, y, w, h) in faces:
                    if w > 0 and h > 0:
                        face_area = w * h
                        face_ratio = face_area / (width * height)

                        # VERY PERMISSIVE: Accept even tiny faces (0.3% of frame)
                        if face_ratio > 0.003:
                            # Head-center calculation (focus on upper face where eyes are)
                            face_center_x = x + w // 2
                            head_center_y = y + int(h * 0.3)

                            # Higher weight for larger faces
                            weight = min(face_ratio * 100, 5.0)
                            weighted_centers.append((face_center_x, head_center_y, weight))

            if not weighted_centers:
                return None

            total_weight = sum(w for _, _, w in weighted_centers)
            # VERY PERMISSIVE: Accept even weak detections
            if total_weight < 0.05:
                return None

            # Calculate weighted average of all face positions
            avg_x = sum(x * w for x, y, w in weighted_centers) / total_weight
            avg_y = sum(y * w for x, y, w in weighted_centers) / total_weight

            # CRITICAL: Minimal safety margin (only 2% to prevent crop from going out of bounds)
            # This allows the face to be very close to the edge while still centering on it
            min_margin_x = int(width * 0.02)
            min_margin_y = int(height * 0.02)

            # Only clamp if absolutely necessary to prevent out-of-bounds crop
            # This ensures we center on the speaker even if they're way off to one side
            final_x = int(np.clip(avg_x, min_margin_x, width - min_margin_x))
            final_y = int(np.clip(avg_y, min_margin_y, height - min_margin_y))

            logger.info(f"Face analysis: detected at ({final_x}, {final_y}), weight={total_weight:.2f}, faces={len(weighted_centers)}")
            return (final_x, final_y)

        except Exception as e:
            logger.debug(f"Face analysis failed: {e}")
            return None

    def _detect_by_motion(
        self,
        cap,
        width: int,
        height: int,
        total_frames: int,
        sample_frames: int
    ) -> Optional[Tuple[int, int]]:
        """
        Detect subject by motion analysis
        Works for any moving subject (person, product, object)
        """
        try:
            # Sample frames evenly
            sample_frames = min(sample_frames, total_frames, 10)
            frame_indices = np.linspace(0, total_frames - 1, sample_frames, dtype=int)

            prev_gray = None
            motion_maps = []

            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ret, frame = cap.read()

                if not ret or frame is None:
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray = cv2.GaussianBlur(gray, (21, 21), 0)

                if prev_gray is not None:
                    # Calculate frame difference (motion)
                    frame_diff = cv2.absdiff(prev_gray, gray)
                    _, thresh = cv2.threshold(frame_diff, 25, 255, cv2.THRESH_BINARY)

                    # Dilate to fill holes
                    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
                    thresh = cv2.dilate(thresh, kernel, iterations=2)

                    motion_maps.append(thresh)

                prev_gray = gray

            if not motion_maps:
                return None

            # Accumulate motion across frames
            motion_accumulation = np.zeros((height, width), dtype=np.float32)
            for motion_map in motion_maps:
                motion_accumulation += motion_map.astype(np.float32)

            # Normalize
            motion_accumulation = motion_accumulation / len(motion_maps)

            # Find center of mass of motion
            moments = cv2.moments(motion_accumulation)

            # REDUCED threshold from 1000 to 500
            if moments['m00'] > 500:  # Minimum motion threshold
                center_x = int(moments['m10'] / moments['m00'])
                center_y = int(moments['m01'] / moments['m00'])

                # IMPROVED: Adaptive margins based on motion strength
                motion_strength = moments['m00'] / (width * height)

                if motion_strength > 0.05:
                    margin_ratio = 0.05  # Strong motion
                elif motion_strength > 0.02:
                    margin_ratio = 0.07  # Medium motion
                else:
                    margin_ratio = 0.10  # Weak motion

                margin_x = int(width * margin_ratio)
                margin_y = int(height * margin_ratio)

                # Accept if within bounds
                if margin_x < center_x < (width - margin_x) and margin_y < center_y < (height - margin_y):
                    logger.info(f"Motion detected: center of mass at ({center_x}, {center_y})")
                    return (center_x, center_y)

                # FALLBACK: Clamp to bounds if strong motion
                if motion_strength > 0.03:
                    clamped_x = int(np.clip(center_x, margin_x, width - margin_x))
                    clamped_y = int(np.clip(center_y, margin_y, height - margin_y))
                    logger.info(f"Motion near edge, clamped to ({clamped_x}, {clamped_y})")
                    return (clamped_x, clamped_y)

            return None

        except Exception as e:
            logger.debug(f"Motion detection failed: {e}")
            return None

    def _detect_by_optical_flow(
        self,
        cap,
        width: int,
        height: int,
        total_frames: int,
        sample_frames: int
    ) -> Optional[Tuple[int, int]]:
        """
        Detect focus point using optical flow
        Tracks where camera is panning or where most visual activity occurs
        """
        try:
            sample_frames = min(sample_frames, total_frames, 8)
            frame_indices = np.linspace(0, total_frames - 1, sample_frames, dtype=int)

            prev_gray = None
            flow_centers = []

            for idx in frame_indices[1:]:  # Skip first frame
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ret, frame = cap.read()

                if not ret or frame is None:
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

                if prev_gray is not None:
                    # Calculate dense optical flow
                    flow = cv2.calcOpticalFlowFarneback(
                        prev_gray, gray,
                        None,
                        pyr_scale=0.5,
                        levels=3,
                        winsize=15,
                        iterations=3,
                        poly_n=5,
                        poly_sigma=1.2,
                        flags=0
                    )

                    # Calculate magnitude of flow
                    mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])

                    # Find areas with significant flow
                    significant_flow = mag > np.percentile(mag, 75)

                    if np.sum(significant_flow) > 100:
                        # Find center of significant flow
                        y_coords, x_coords = np.where(significant_flow)
                        if len(x_coords) > 0:
                            center_x = int(np.median(x_coords))
                            center_y = int(np.median(y_coords))
                            flow_centers.append((center_x, center_y))

                prev_gray = gray

            # REDUCED from 3 to 2 detections needed
            if len(flow_centers) >= 2:
                # Average flow centers with outlier removal
                centers_array = np.array(flow_centers)
                median_x = np.median(centers_array[:, 0])
                median_y = np.median(centers_array[:, 1])

                # Filter outliers (more than 20% away from median)
                distances = np.sqrt((centers_array[:, 0] - median_x)**2 + (centers_array[:, 1] - median_y)**2)
                max_dist = min(width, height) * 0.2
                valid_centers = centers_array[distances < max_dist]

                if len(valid_centers) > 0:
                    avg_x = int(np.mean(valid_centers[:, 0]))
                    avg_y = int(np.mean(valid_centers[:, 1]))

                    # IMPROVED: Adaptive margins (reduced from 1/8 to 1/12)
                    confidence = len(valid_centers) / len(flow_centers)
                    if confidence > 0.8:  # High confidence
                        margin_ratio = 0.05
                    elif confidence > 0.5:  # Medium confidence
                        margin_ratio = 0.07
                    else:  # Low confidence
                        margin_ratio = 0.10

                    margin_x = int(width * margin_ratio)
                    margin_y = int(height * margin_ratio)

                    # Clamp to bounds (always return a position)
                    final_x = int(np.clip(avg_x, margin_x, width - margin_x))
                    final_y = int(np.clip(avg_y, margin_y, height - margin_y))
                    logger.info(f"Optical flow focus: ({final_x}, {final_y})")
                    return (final_x, final_y)

            return None

        except Exception as e:
            logger.debug(f"Optical flow detection failed: {e}")
            return None

    def _detect_by_saliency(
        self,
        cap,
        width: int,
        height: int,
        total_frames: int,
        sample_frames: int
    ) -> Optional[Tuple[int, int]]:
        """
        Detect visually interesting regions using saliency detection
        """
        try:
            sample_frames = min(sample_frames, total_frames, 5)
            frame_indices = np.linspace(0, total_frames - 1, sample_frames, dtype=int)

            saliency_centers = []

            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ret, frame = cap.read()

                if not ret or frame is None:
                    continue

                # Use static saliency (spectral residual approach)
                saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
                success, saliency_map = saliency.computeSaliency(frame)

                if success and saliency_map is not None:
                    # Normalize and threshold
                    saliency_map = (saliency_map * 255).astype(np.uint8)
                    _, thresh = cv2.threshold(saliency_map, 127, 255, cv2.THRESH_BINARY)

                    # Find center of salient region
                    moments = cv2.moments(thresh)
                    if moments['m00'] > 1000:
                        center_x = int(moments['m10'] / moments['m00'])
                        center_y = int(moments['m01'] / moments['m00'])
                        saliency_centers.append((center_x, center_y))

            # REDUCED from 3 to 2 detections needed
            if len(saliency_centers) >= 2:
                # Average with outlier filtering
                centers_array = np.array(saliency_centers)
                avg_x = int(np.median(centers_array[:, 0]))
                avg_y = int(np.median(centers_array[:, 1]))

                # IMPROVED: Adaptive margins
                confidence = len(saliency_centers) / sample_frames
                if confidence > 0.7:  # High confidence
                    margin_ratio = 0.05
                elif confidence > 0.4:  # Medium confidence
                    margin_ratio = 0.07
                else:  # Low confidence
                    margin_ratio = 0.10

                margin_x = int(width * margin_ratio)
                margin_y = int(height * margin_ratio)

                # Clamp to bounds
                final_x = int(np.clip(avg_x, margin_x, width - margin_x))
                final_y = int(np.clip(avg_y, margin_y, height - margin_y))
                logger.info(f"Saliency center: ({final_x}, {final_y})")
                return (final_x, final_y)

            return None

        except Exception as e:
            logger.debug(f"Saliency detection failed: {e}")
            return None

    def _detect_by_faces(
        self,
        cap,
        width: int,
        height: int,
        total_frames: int,
        sample_frames: int
    ) -> Optional[Tuple[int, int]]:
        """
        Traditional face detection (fallback method)
        """
        if not self.face_cascade:
            return None

        try:
            sample_frames = min(sample_frames, total_frames, 7)
            frame_indices = np.linspace(0, total_frames - 1, sample_frames, dtype=int)

            weighted_centers = []

            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
                ret, frame = cap.read()

                if not ret or frame is None:
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,   # More sensitive
                    minNeighbors=2,    # More permissive
                    minSize=(max(15, width // 25), max(15, height // 25))  # Smaller minimum
                )

                for (x, y, w, h) in faces:
                    if w > 0 and h > 0 and x >= 0 and y >= 0 and x + w <= width and y + h <= height:
                        face_area = w * h
                        face_ratio = face_area / (width * height)

                        # VERY PERMISSIVE: Accept even tiny faces (0.3% of frame)
                        if face_ratio > 0.003:
                            # Calculate head center (upper portion of face)
                            face_center_x = x + w // 2
                            head_center_y = y + int(h * 0.3)

                            weight = min(face_ratio * 100, 5.0)
                            weighted_centers.append((face_center_x, head_center_y, weight))

            if not weighted_centers:
                return None

            total_weight = sum(w for _, _, w in weighted_centers)
            # VERY PERMISSIVE: Accept even weak detections
            if total_weight < 0.05:
                return None

            avg_x = sum(x * w for x, y, w in weighted_centers) / total_weight
            avg_y = sum(y * w for x, y, w in weighted_centers) / total_weight

            # CRITICAL: Minimal safety margin (only 2% to prevent crop from going out of bounds)
            min_margin_x = int(width * 0.02)
            min_margin_y = int(height * 0.02)

            # Only clamp if absolutely necessary to prevent out-of-bounds crop
            final_x = int(np.clip(avg_x, min_margin_x, width - min_margin_x))
            final_y = int(np.clip(avg_y, min_margin_y, height - min_margin_y))

            logger.info(f"Face center: ({final_x}, {final_y}), weight={total_weight:.2f}")
            return (final_x, final_y)

        except Exception as e:
            logger.debug(f"Face detection failed: {e}")
            return None
