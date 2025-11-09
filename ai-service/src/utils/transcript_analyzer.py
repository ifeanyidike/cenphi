"""
Transcript Boundary Analyzer for Story Video Smoothness
Safely analyzes transcript text to determine optimal crossfade strategies
"""

import logging
import re
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class TranscriptBoundaryAnalyzer:
    """
    Safe analyzer for determining clip boundary quality and optimal crossfade parameters.
    All methods have fallbacks and never raise exceptions that would break video processing.
    """

    # Safe defaults if analysis fails - REDUCED for memory safety
    DEFAULT_CROSSFADE_DURATION = 1.0
    SHORT_CROSSFADE = 0.8  # Clean boundaries - natural pause
    MEDIUM_CROSSFADE = 1.5  # One rough boundary - need blending
    LONG_CROSSFADE = 2.0  # Both rough - aggressive blending (CAPPED at 2.0s for 4GB memory limit)

    # Sentence-ending punctuation
    SENTENCE_ENDINGS = {'.', '!', '?'}

    # Words that suggest incomplete thoughts
    INCOMPLETE_INDICATORS = {
        'and', 'but', 'or', 'so', 'because', 'when', 'while', 'if',
        'although', 'however', 'therefore', 'the', 'a', 'an', 'to', 'for'
    }

    @staticmethod
    def analyze_clip_boundary(
        text_content: Optional[str],
        is_start: bool = True
    ) -> Dict[str, any]:
        """
        Safely analyze if clip starts/ends at a natural boundary.

        Args:
            text_content: The transcript text (can be None or empty)
            is_start: True to analyze start boundary, False for end boundary

        Returns:
            Dict with analysis results and safe defaults
        """
        try:
            # Safe defaults
            result = {
                "boundary_quality": "unknown",
                "is_clean": False,
                "confidence": 0.0,
                "reason": "No transcript available"
            }

            # Validate input
            if not text_content or not isinstance(text_content, str):
                return result

            text = text_content.strip()
            if not text:
                return result

            if is_start:
                return TranscriptBoundaryAnalyzer._analyze_start_boundary(text)
            else:
                return TranscriptBoundaryAnalyzer._analyze_end_boundary(text)

        except Exception as e:
            logger.warning(f"Boundary analysis failed safely: {e}")
            return {
                "boundary_quality": "unknown",
                "is_clean": False,
                "confidence": 0.0,
                "reason": f"Analysis error: {str(e)}"
            }

    @staticmethod
    def _analyze_start_boundary(text: str) -> Dict[str, any]:
        """Analyze start boundary quality"""
        try:
            # Check if starts with capital letter (likely sentence start)
            first_char = text[0] if text else ''
            starts_with_capital = first_char.isupper()

            # Get first few words
            words = text.split()
            first_word = words[0].lower() if words else ''

            # Check if first word suggests continuation
            is_incomplete_start = first_word in TranscriptBoundaryAnalyzer.INCOMPLETE_INDICATORS

            # Determine quality
            if starts_with_capital and not is_incomplete_start:
                return {
                    "boundary_quality": "clean",
                    "is_clean": True,
                    "confidence": 0.85,
                    "reason": "Starts with capital letter and complete word"
                }
            elif starts_with_capital:
                return {
                    "boundary_quality": "fair",
                    "is_clean": False,
                    "confidence": 0.5,
                    "reason": "Starts with capital but may be mid-thought"
                }
            else:
                return {
                    "boundary_quality": "poor",
                    "is_clean": False,
                    "confidence": 0.2,
                    "reason": "Likely starts mid-sentence"
                }

        except Exception as e:
            logger.warning(f"Start boundary analysis failed: {e}")
            return {"boundary_quality": "unknown", "is_clean": False, "confidence": 0.0, "reason": str(e)}

    @staticmethod
    def _analyze_end_boundary(text: str) -> Dict[str, any]:
        """Analyze end boundary quality"""
        try:
            # Check if ends with sentence-ending punctuation
            last_char = text[-1] if text else ''
            ends_with_punctuation = last_char in TranscriptBoundaryAnalyzer.SENTENCE_ENDINGS

            # Get last few words
            words = text.split()
            last_word = words[-1].lower().rstrip('.,!?') if words else ''

            # Check if last word suggests continuation
            is_incomplete_end = last_word in TranscriptBoundaryAnalyzer.INCOMPLETE_INDICATORS

            # Determine quality
            if ends_with_punctuation and not is_incomplete_end:
                return {
                    "boundary_quality": "clean",
                    "is_clean": True,
                    "confidence": 0.9,
                    "reason": "Ends with punctuation and complete thought"
                }
            elif ends_with_punctuation:
                return {
                    "boundary_quality": "fair",
                    "is_clean": False,
                    "confidence": 0.6,
                    "reason": "Ends with punctuation but may be mid-thought"
                }
            else:
                return {
                    "boundary_quality": "poor",
                    "is_clean": False,
                    "confidence": 0.1,
                    "reason": "Likely ends mid-sentence"
                }

        except Exception as e:
            logger.warning(f"End boundary analysis failed: {e}")
            return {"boundary_quality": "unknown", "is_clean": False, "confidence": 0.0, "reason": str(e)}

    @staticmethod
    def calculate_optimal_crossfade(
        clip1_text: Optional[str],
        clip2_text: Optional[str]
    ) -> Dict[str, any]:
        """
        Calculate optimal crossfade duration and curve based on clip boundaries.
        Always returns safe values, never fails.

        Args:
            clip1_text: Transcript of first clip (can be None)
            clip2_text: Transcript of second clip (can be None)

        Returns:
            Dict with crossfade parameters
        """
        try:
            # Analyze both boundaries
            clip1_end = TranscriptBoundaryAnalyzer.analyze_clip_boundary(clip1_text, is_start=False)
            clip2_start = TranscriptBoundaryAnalyzer.analyze_clip_boundary(clip2_text, is_start=True)

            # Determine crossfade duration based on boundary quality
            clip1_clean = clip1_end.get("is_clean", False)
            clip2_clean = clip2_start.get("is_clean", False)

            if clip1_clean and clip2_clean:
                # Both clean boundaries - short, natural crossfade
                duration = TranscriptBoundaryAnalyzer.SHORT_CROSSFADE
                curve = "qsin"  # Quarter sine - smooth and natural
                quality = "excellent"
                reason = "Both clips have clean boundaries"
            elif clip1_clean or clip2_clean:
                # One clean boundary - medium crossfade
                duration = TranscriptBoundaryAnalyzer.MEDIUM_CROSSFADE
                curve = "exp"  # Exponential - masks imperfections
                quality = "good"
                reason = "One clip has clean boundary"
            else:
                # Neither clean - long crossfade to mask abrupt transitions
                duration = TranscriptBoundaryAnalyzer.LONG_CROSSFADE
                curve = "exp"  # Exponential - best for masking cuts
                quality = "compensating"
                reason = "Both clips have rough boundaries, using longer crossfade"

            return {
                "duration": duration,
                "curve": curve,
                "quality": quality,
                "reason": reason,
                "clip1_end_analysis": clip1_end,
                "clip2_start_analysis": clip2_start
            }

        except Exception as e:
            logger.warning(f"Crossfade calculation failed safely, using defaults: {e}")
            # Safe fallback to defaults
            return {
                "duration": TranscriptBoundaryAnalyzer.DEFAULT_CROSSFADE_DURATION,
                "curve": "tri",  # Linear - existing behavior
                "quality": "default",
                "reason": f"Using safe defaults due to error: {str(e)}",
                "clip1_end_analysis": {"boundary_quality": "unknown", "is_clean": False},
                "clip2_start_analysis": {"boundary_quality": "unknown", "is_clean": False}
            }

    @staticmethod
    def get_crossfade_parameters_safe(
        segments: list,
        index: int
    ) -> Dict[str, any]:
        """
        Safely get crossfade parameters for transition between two segments.
        Always succeeds with safe defaults.

        Args:
            segments: List of segments (ProcessedSegment protobuf objects)
            index: Index of first clip in the transition

        Returns:
            Dict with safe crossfade parameters
        """
        try:
            # Validate inputs
            if not segments or index < 0 or index >= len(segments) - 1:
                raise ValueError("Invalid segment index or empty segments")

            # Safely extract text content
            clip1_text = None
            clip2_text = None

            try:
                clip1_text = getattr(segments[index], 'text_content', None)
            except Exception:
                pass

            try:
                clip2_text = getattr(segments[index + 1], 'text_content', None)
            except Exception:
                pass

            # Calculate optimal crossfade
            return TranscriptBoundaryAnalyzer.calculate_optimal_crossfade(
                clip1_text,
                clip2_text
            )

        except Exception as e:
            logger.warning(f"Safe crossfade parameter extraction failed, using defaults: {e}")
            return {
                "duration": TranscriptBoundaryAnalyzer.DEFAULT_CROSSFADE_DURATION,
                "curve": "tri",
                "quality": "default",
                "reason": f"Error occurred: {str(e)}"
            }
