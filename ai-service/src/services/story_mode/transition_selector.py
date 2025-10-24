# src/services/story_mode/transition_selector.py

import logging
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class TransitionRecommendation:
    """Recommended transition between two clips"""
    transition_type: str
    duration: float
    confidence: float
    reasoning: str


class SmartTransitionSelector:
    """
    Intelligent transition selection based on clip content, pacing, and platform.

    Analyzes:
    - Clip content similarity (text, highlight type)
    - Scene changes (talking head → product demo)
    - Emotional tone shifts
    - Platform best practices
    - Pacing and rhythm
    """

    # Platform-specific transition preferences
    PLATFORM_PREFERENCES = {
        "tiktok": {
            "preferred": ["fade", "wipe"],
            "duration": 0.2,  # Fast cuts for TikTok
            "max_duration": 0.3
        },
        "instagram": {
            "preferred": ["fade", "dissolve", "slideright"],
            "duration": 0.3,
            "max_duration": 0.5
        },
        "youtube": {
            "preferred": ["fade", "dissolve"],
            "duration": 0.5,  # Smoother for YouTube
            "max_duration": 1.0
        },
        "linkedin": {
            "preferred": ["fade", "dissolve"],
            "duration": 0.4,
            "max_duration": 0.6
        },
        "default": {
            "preferred": ["fade"],
            "duration": 0.3,
            "max_duration": 0.5
        }
    }

    # Transition types and their characteristics
    TRANSITION_CHARACTERISTICS = {
        "fade": {
            "energy": "low",
            "use_case": "gentle, professional transitions",
            "best_for": ["similar_content", "continuous_narrative"]
        },
        "dissolve": {
            "energy": "low",
            "use_case": "smooth blending between scenes",
            "best_for": ["time_passage", "topic_continuation"]
        },
        "wipe": {
            "energy": "medium",
            "use_case": "dynamic scene changes",
            "best_for": ["topic_shift", "different_speakers"]
        },
        "slideright": {
            "energy": "medium",
            "use_case": "directional progression",
            "best_for": ["sequential_steps", "before_after"]
        },
        "slidedown": {
            "energy": "medium",
            "use_case": "hierarchical information",
            "best_for": ["top_down_narrative", "conclusion"]
        },
        "none": {
            "energy": "high",
            "use_case": "fast-paced, energetic content",
            "best_for": ["high_energy", "rapid_fire_testimonials"]
        }
    }

    def __init__(self):
        logger.info("SmartTransitionSelector initialized")

    def recommend_transitions(
        self,
        clips: List[Dict[str, Any]],
        target_platform: str = "instagram",
        pacing: str = "balanced"  # "fast", "balanced", "slow"
    ) -> List[TransitionRecommendation]:
        """
        Recommend optimal transitions between clips.

        Args:
            clips: List of clip metadata (must have text_content, highlight_type, duration)
            target_platform: Target platform (tiktok, instagram, youtube, linkedin)
            pacing: Desired pacing (fast, balanced, slow)

        Returns:
            List of TransitionRecommendation (length = len(clips) - 1)
        """
        if len(clips) < 2:
            return []

        logger.info(f"Recommending transitions for {len(clips)} clips on {target_platform} with {pacing} pacing")

        recommendations = []

        for i in range(len(clips) - 1):
            clip_a = clips[i]
            clip_b = clips[i + 1]

            recommendation = self._recommend_transition_pair(
                clip_a=clip_a,
                clip_b=clip_b,
                target_platform=target_platform,
                pacing=pacing,
                position_in_story=i / (len(clips) - 1)  # 0.0 to 1.0
            )

            recommendations.append(recommendation)

        return recommendations

    def _recommend_transition_pair(
        self,
        clip_a: Dict[str, Any],
        clip_b: Dict[str, Any],
        target_platform: str,
        pacing: str,
        position_in_story: float
    ) -> TransitionRecommendation:
        """
        Recommend transition between two specific clips.

        Args:
            clip_a: First clip metadata
            clip_b: Second clip metadata
            target_platform: Target platform
            pacing: Desired pacing
            position_in_story: Position in story (0.0 = start, 1.0 = end)

        Returns:
            TransitionRecommendation
        """
        # Get platform preferences
        platform_pref = self.PLATFORM_PREFERENCES.get(
            target_platform.lower(),
            self.PLATFORM_PREFERENCES["default"]
        )

        # Analyze content similarity
        content_similarity = self._analyze_content_similarity(clip_a, clip_b)

        # Analyze scene change intensity
        scene_change = self._analyze_scene_change(clip_a, clip_b)

        # Analyze emotional shift
        emotional_shift = self._analyze_emotional_shift(clip_a, clip_b)

        # Determine transition type based on analysis
        transition_type, confidence, reasoning = self._select_transition_type(
            content_similarity=content_similarity,
            scene_change=scene_change,
            emotional_shift=emotional_shift,
            platform_pref=platform_pref,
            pacing=pacing,
            position_in_story=position_in_story
        )

        # Determine transition duration
        duration = self._calculate_transition_duration(
            transition_type=transition_type,
            clip_a_duration=clip_a.get("duration", 0),
            clip_b_duration=clip_b.get("duration", 0),
            platform_pref=platform_pref,
            pacing=pacing
        )

        return TransitionRecommendation(
            transition_type=transition_type,
            duration=duration,
            confidence=confidence,
            reasoning=reasoning
        )

    def _analyze_content_similarity(
        self,
        clip_a: Dict[str, Any],
        clip_b: Dict[str, Any]
    ) -> float:
        """
        Analyze content similarity between two clips (0.0 = completely different, 1.0 = very similar).

        Args:
            clip_a: First clip
            clip_b: Second clip

        Returns:
            Similarity score (0.0 to 1.0)
        """
        similarity = 0.0

        # Same highlight type = +0.3
        if clip_a.get("highlight_type") == clip_b.get("highlight_type"):
            similarity += 0.3

        # Same testimonial = +0.2
        if clip_a.get("testimonial_id") == clip_b.get("testimonial_id"):
            similarity += 0.2

        # Text overlap analysis (simple keyword matching)
        text_a = set((clip_a.get("text_content", "").lower().split()))
        text_b = set((clip_b.get("text_content", "").lower().split()))

        if text_a and text_b:
            overlap = len(text_a & text_b) / len(text_a | text_b)
            similarity += overlap * 0.5

        return min(similarity, 1.0)

    def _analyze_scene_change(
        self,
        clip_a: Dict[str, Any],
        clip_b: Dict[str, Any]
    ) -> str:
        """
        Analyze intensity of scene change (low, medium, high).

        Args:
            clip_a: First clip
            clip_b: Second clip

        Returns:
            Scene change intensity ("low", "medium", "high")
        """
        # Different testimonials = high scene change
        if clip_a.get("testimonial_id") != clip_b.get("testimonial_id"):
            return "high"

        # Different highlight types = medium scene change
        if clip_a.get("highlight_type") != clip_b.get("highlight_type"):
            return "medium"

        # Same testimonial, same type = low scene change
        return "low"

    def _analyze_emotional_shift(
        self,
        clip_a: Dict[str, Any],
        clip_b: Dict[str, Any]
    ) -> str:
        """
        Analyze emotional shift between clips (low, medium, high).

        Args:
            clip_a: First clip
            clip_b: Second clip

        Returns:
            Emotional shift intensity ("low", "medium", "high")
        """
        # Map highlight types to emotional categories
        emotional_categories = {
            "pain_point": "negative",
            "problem": "negative",
            "challenge": "negative",
            "solution": "positive",
            "benefit": "positive",
            "outcome": "positive",
            "transformation": "positive",
            "success": "positive",
            "general": "neutral"
        }

        emotion_a = emotional_categories.get(clip_a.get("highlight_type", ""), "neutral")
        emotion_b = emotional_categories.get(clip_b.get("highlight_type", ""), "neutral")

        # Negative → Positive = high shift (transformation moment)
        if emotion_a == "negative" and emotion_b == "positive":
            return "high"

        # Positive → Negative = high shift (concern/caveat)
        if emotion_a == "positive" and emotion_b == "negative":
            return "high"

        # Same emotion = low shift
        if emotion_a == emotion_b:
            return "low"

        # Neutral transitions = medium shift
        return "medium"

    def _select_transition_type(
        self,
        content_similarity: float,
        scene_change: str,
        emotional_shift: str,
        platform_pref: Dict[str, Any],
        pacing: str,
        position_in_story: float
    ) -> Tuple[str, float, str]:
        """
        Select optimal transition type based on analysis.

        Returns:
            Tuple of (transition_type, confidence, reasoning)
        """
        reasons = []

        # High content similarity → gentle transition (fade/dissolve)
        if content_similarity > 0.7:
            if "fade" in platform_pref["preferred"]:
                reasons.append("high content similarity suggests gentle fade")
                return "fade", 0.9, "; ".join(reasons)
            elif "dissolve" in platform_pref["preferred"]:
                reasons.append("high content similarity suggests smooth dissolve")
                return "dissolve", 0.9, "; ".join(reasons)

        # High scene change → dynamic transition (wipe/slide)
        if scene_change == "high":
            if "wipe" in platform_pref["preferred"]:
                reasons.append("high scene change (different testimonials) suggests dynamic wipe")
                return "wipe", 0.85, "; ".join(reasons)
            elif "slideright" in platform_pref["preferred"]:
                reasons.append("high scene change suggests directional slide")
                return "slideright", 0.8, "; ".join(reasons)

        # High emotional shift → emphasize with transition
        if emotional_shift == "high":
            reasons.append("high emotional shift (transformation moment)")
            # Use platform's most dynamic transition
            if "wipe" in platform_pref["preferred"]:
                reasons.append("using wipe to emphasize transformation")
                return "wipe", 0.8, "; ".join(reasons)
            elif "dissolve" in platform_pref["preferred"]:
                reasons.append("using dissolve to smooth emotional transition")
                return "dissolve", 0.75, "; ".join(reasons)

        # Fast pacing → minimal transition
        if pacing == "fast":
            reasons.append("fast pacing requested")
            if position_in_story > 0.8:  # Near end
                reasons.append("near story end, using fade for closure")
                return "fade", 0.7, "; ".join(reasons)
            else:
                reasons.append("using fade for fast pacing")
                return "fade", 0.75, "; ".join(reasons)

        # Slow pacing → longer transition
        if pacing == "slow":
            reasons.append("slow pacing requested")
            if "dissolve" in platform_pref["preferred"]:
                reasons.append("using dissolve for smooth slow pacing")
                return "dissolve", 0.8, "; ".join(reasons)

        # Default: use platform's first preferred transition
        default_transition = platform_pref["preferred"][0]
        reasons.append(f"using {target_platform} default ({default_transition})")
        return default_transition, 0.6, "; ".join(reasons)

    def _calculate_transition_duration(
        self,
        transition_type: str,
        clip_a_duration: float,
        clip_b_duration: float,
        platform_pref: Dict[str, Any],
        pacing: str
    ) -> float:
        """
        Calculate optimal transition duration.

        Args:
            transition_type: Type of transition
            clip_a_duration: Duration of first clip
            clip_b_duration: Duration of second clip
            platform_pref: Platform preferences
            pacing: Desired pacing

        Returns:
            Transition duration in seconds
        """
        base_duration = platform_pref["duration"]
        max_duration = platform_pref["max_duration"]

        # Adjust for pacing
        if pacing == "fast":
            duration = base_duration * 0.7
        elif pacing == "slow":
            duration = base_duration * 1.3
        else:
            duration = base_duration

        # Ensure transition doesn't exceed clip lengths
        # Transition should be at most 10% of shorter clip
        min_clip_duration = min(clip_a_duration, clip_b_duration)
        max_safe_duration = min_clip_duration * 0.1

        duration = min(duration, max_safe_duration, max_duration)

        # Minimum transition duration
        if transition_type != "none":
            duration = max(duration, 0.1)

        return round(duration, 2)

    def get_uniform_transition(
        self,
        num_transitions: int,
        target_platform: str = "instagram",
        pacing: str = "balanced"
    ) -> List[TransitionRecommendation]:
        """
        Get uniform transitions (same type/duration for all transitions).

        Useful when user explicitly selects a transition style.

        Args:
            num_transitions: Number of transitions needed
            target_platform: Target platform
            pacing: Desired pacing

        Returns:
            List of identical TransitionRecommendation
        """
        platform_pref = self.PLATFORM_PREFERENCES.get(
            target_platform.lower(),
            self.PLATFORM_PREFERENCES["default"]
        )

        transition_type = platform_pref["preferred"][0]
        duration = platform_pref["duration"]

        if pacing == "fast":
            duration *= 0.7
        elif pacing == "slow":
            duration *= 1.3

        recommendation = TransitionRecommendation(
            transition_type=transition_type,
            duration=round(duration, 2),
            confidence=1.0,
            reasoning=f"Uniform {transition_type} transition for {target_platform}"
        )

        return [recommendation] * num_transitions
