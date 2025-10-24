# src/services/story_mode/emotional_arc_analyzer.py

import logging
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
import statistics

logger = logging.getLogger(__name__)


@dataclass
class EmotionalMoment:
    """A moment with emotional significance"""
    timestamp: float
    emotion: str  # "negative", "neutral", "positive", "transformation"
    intensity: float  # 0-1
    clip_index: int
    text_content: str


@dataclass
class EmotionalArc:
    """Analysis of emotional journey through story"""
    arc_type: str  # "hero_journey", "problem_solution", "transformation", "progressive_success"
    moments: List[EmotionalMoment]
    arc_quality_score: float  # 0-100
    pacing_recommendation: str  # "fast", "balanced", "slow"
    suggested_reordering: List[int]  # Indices for optimal emotional flow
    reasoning: str


class EmotionalArcAnalyzer:
    """
    Analyzes and optimizes emotional arc in story videos.

    Based on storytelling principles:
    - Hero's Journey (problem → struggle → solution → success)
    - Problem-Solution (pain → solution → relief)
    - Transformation (before → during → after)
    - Progressive Success (win → bigger win → biggest win)
    """

    # Emotion classification from highlight types
    EMOTION_MAPPING = {
        "pain_point": ("negative", 0.8),
        "problem": ("negative", 0.7),
        "challenge": ("negative", 0.6),
        "concern": ("negative", 0.5),
        "solution": ("positive", 0.6),
        "benefit": ("positive", 0.7),
        "outcome": ("positive", 0.8),
        "transformation": ("transformation", 0.9),
        "success": ("positive", 0.9),
        "testimonial": ("positive", 0.6),
        "general": ("neutral", 0.3)
    }

    # Arc patterns (emotional sequence that tells compelling story)
    ARC_PATTERNS = {
        "hero_journey": {
            "sequence": ["negative", "negative", "transformation", "positive", "positive"],
            "description": "Problem → Struggle → Solution → Success → Victory",
            "ideal_for": ["transformation stories", "overcoming challenges"]
        },
        "problem_solution": {
            "sequence": ["negative", "transformation", "positive"],
            "description": "Pain → Solution → Relief",
            "ideal_for": ["product testimonials", "service reviews"]
        },
        "transformation": {
            "sequence": ["negative", "transformation", "positive", "positive"],
            "description": "Before → Change → During → After",
            "ideal_for": ["lifestyle changes", "business growth"]
        },
        "progressive_success": {
            "sequence": ["positive", "positive", "positive"],
            "description": "Win → Bigger Win → Biggest Win",
            "ideal_for": ["momentum building", "success stories"]
        }
    }

    def __init__(self):
        logger.info("EmotionalArcAnalyzer initialized")

    def analyze_emotional_arc(
        self,
        clips: List[Dict[str, Any]],
        target_arc: Optional[str] = None  # If None, auto-detect best arc
    ) -> EmotionalArc:
        """
        Analyze emotional arc of clips and recommend optimal ordering.

        Args:
            clips: List of clip metadata with highlight_type, text_content, duration
            target_arc: Optional target arc type (if None, auto-detect)

        Returns:
            EmotionalArc with analysis and recommendations
        """
        if len(clips) < 2:
            return EmotionalArc(
                arc_type="insufficient",
                moments=[],
                arc_quality_score=0,
                pacing_recommendation="balanced",
                suggested_reordering=list(range(len(clips))),
                reasoning="Need at least 2 clips for emotional arc analysis"
            )

        logger.info(f"Analyzing emotional arc for {len(clips)} clips")

        # Extract emotional moments from clips
        moments = self._extract_emotional_moments(clips)

        # Determine current emotional sequence
        current_sequence = [m.emotion for m in moments]

        # Auto-detect best arc if not specified
        if target_arc is None:
            target_arc = self._detect_best_arc(moments)

        logger.info(f"Target arc: {target_arc}")
        logger.info(f"Current sequence: {' → '.join(current_sequence)}")

        # Get ideal sequence for target arc
        ideal_sequence = self.ARC_PATTERNS[target_arc]["sequence"]

        # Calculate arc quality score (how well current matches ideal)
        arc_quality = self._calculate_arc_quality(current_sequence, ideal_sequence)

        # Generate reordering suggestion if quality is low
        if arc_quality < 70:
            suggested_reordering, reordered_sequence = self._suggest_reordering(
                moments, ideal_sequence
            )
            new_quality = self._calculate_arc_quality(reordered_sequence, ideal_sequence)

            reasoning = (
                f"Current arc quality: {arc_quality:.1f}/100. "
                f"Reordering to match '{target_arc}' pattern improves to {new_quality:.1f}/100. "
                f"Sequence: {' → '.join(reordered_sequence)}"
            )
        else:
            suggested_reordering = list(range(len(clips)))
            reasoning = (
                f"Current arc quality: {arc_quality:.1f}/100. "
                f"Clips already follow good '{target_arc}' pattern. No reordering needed."
            )

        # Determine optimal pacing based on emotional intensity
        pacing_recommendation = self._recommend_pacing(moments)

        return EmotionalArc(
            arc_type=target_arc,
            moments=moments,
            arc_quality_score=round(arc_quality, 2),
            pacing_recommendation=pacing_recommendation,
            suggested_reordering=suggested_reordering,
            reasoning=reasoning
        )

    def _extract_emotional_moments(
        self,
        clips: List[Dict[str, Any]]
    ) -> List[EmotionalMoment]:
        """Extract emotional moments from clips"""
        moments = []
        cumulative_time = 0

        for i, clip in enumerate(clips):
            highlight_type = clip.get("highlight_type", "general")
            emotion, intensity = self.EMOTION_MAPPING.get(
                highlight_type,
                ("neutral", 0.3)
            )

            moment = EmotionalMoment(
                timestamp=cumulative_time,
                emotion=emotion,
                intensity=intensity,
                clip_index=i,
                text_content=clip.get("text_content", "")[:100]
            )

            moments.append(moment)
            cumulative_time += clip.get("duration", 0)

        return moments

    def _detect_best_arc(self, moments: List[EmotionalMoment]) -> str:
        """Auto-detect best arc type based on available emotional content"""
        current_sequence = [m.emotion for m in moments]

        # Count emotion types
        has_negative = "negative" in current_sequence
        has_transformation = "transformation" in current_sequence
        has_positive = "positive" in current_sequence
        mostly_positive = current_sequence.count("positive") > len(current_sequence) / 2

        # Decision tree for arc selection
        if has_negative and has_transformation and has_positive:
            # Has full emotional range - prefer hero journey or transformation
            if len(moments) >= 5:
                return "hero_journey"
            else:
                return "transformation"

        elif has_negative and has_positive:
            # Has contrast - prefer problem-solution
            return "problem_solution"

        elif mostly_positive:
            # Mostly positive - prefer progressive success
            return "progressive_success"

        else:
            # Default to problem-solution (works for most cases)
            return "problem_solution"

    def _calculate_arc_quality(
        self,
        current_sequence: List[str],
        ideal_sequence: List[str]
    ) -> float:
        """
        Calculate how well current sequence matches ideal arc.

        Uses sequence alignment scoring.
        """
        if not current_sequence or not ideal_sequence:
            return 0

        # If sequences are exact match
        if current_sequence == ideal_sequence:
            return 100

        # Calculate similarity using position-weighted matching
        matches = 0
        total_positions = max(len(current_sequence), len(ideal_sequence))

        # Normalize sequences to same length by repeating ideal pattern
        while len(ideal_sequence) < len(current_sequence):
            ideal_sequence = ideal_sequence + ideal_sequence[:1]

        # Compare positions
        for i in range(min(len(current_sequence), len(ideal_sequence))):
            if current_sequence[i] == ideal_sequence[i]:
                # Weight early positions higher (opening is critical)
                weight = 1.5 if i == 0 else (1.2 if i < 3 else 1.0)
                matches += weight

        # Calculate score (0-100)
        max_possible_score = sum([
            1.5 if i == 0 else (1.2 if i < 3 else 1.0)
            for i in range(min(len(current_sequence), len(ideal_sequence)))
        ])

        score = (matches / max_possible_score) * 100 if max_possible_score > 0 else 0

        return min(100, score)

    def _suggest_reordering(
        self,
        moments: List[EmotionalMoment],
        ideal_sequence: List[str]
    ) -> Tuple[List[int], List[str]]:
        """
        Suggest clip reordering to match ideal emotional sequence.

        Uses greedy matching algorithm.
        """
        # Group moments by emotion type
        by_emotion = {}
        for moment in moments:
            if moment.emotion not in by_emotion:
                by_emotion[moment.emotion] = []
            by_emotion[moment.emotion].append(moment)

        # Build reordering by matching ideal sequence
        reordered_indices = []
        reordered_sequence = []
        used_indices = set()

        for target_emotion in ideal_sequence:
            # Find unused moment with target emotion
            candidates = [
                m for m in by_emotion.get(target_emotion, [])
                if m.clip_index not in used_indices
            ]

            if candidates:
                # Prefer moments with higher intensity
                best = max(candidates, key=lambda m: m.intensity)
                reordered_indices.append(best.clip_index)
                reordered_sequence.append(best.emotion)
                used_indices.add(best.clip_index)
            else:
                # No exact match - find closest emotion
                for fallback_emotion in ["transformation", "positive", "negative", "neutral"]:
                    candidates = [
                        m for m in by_emotion.get(fallback_emotion, [])
                        if m.clip_index not in used_indices
                    ]
                    if candidates:
                        best = candidates[0]
                        reordered_indices.append(best.clip_index)
                        reordered_sequence.append(best.emotion)
                        used_indices.add(best.clip_index)
                        break

        # Add any remaining clips at the end
        for moment in moments:
            if moment.clip_index not in used_indices:
                reordered_indices.append(moment.clip_index)
                reordered_sequence.append(moment.emotion)
                used_indices.add(moment.clip_index)

        return reordered_indices, reordered_sequence

    def _recommend_pacing(self, moments: List[EmotionalMoment]) -> str:
        """
        Recommend pacing based on emotional intensity distribution.

        - High intensity variation → Fast pacing (keep energy high)
        - Low intensity variation → Slow pacing (let story breathe)
        - Balanced → Balanced pacing
        """
        if len(moments) < 2:
            return "balanced"

        intensities = [m.intensity for m in moments]

        # Calculate intensity variation
        mean_intensity = statistics.mean(intensities)
        std_dev = statistics.stdev(intensities) if len(intensities) > 1 else 0

        # Calculate emotion changes (how often emotion type changes)
        emotion_changes = sum(
            1 for i in range(1, len(moments))
            if moments[i].emotion != moments[i-1].emotion
        )
        change_rate = emotion_changes / (len(moments) - 1) if len(moments) > 1 else 0

        # Decision logic
        if std_dev > 0.2 or change_rate > 0.6:
            # High variation or frequent changes → Fast pacing
            return "fast"
        elif std_dev < 0.1 and change_rate < 0.3:
            # Low variation and few changes → Slow pacing
            return "slow"
        else:
            # Moderate variation → Balanced pacing
            return "balanced"

    def get_arc_preview(self, clips: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Get preview of all possible arcs for user selection.

        Returns:
            Dict with preview of each arc type and quality scores
        """
        previews = {}

        for arc_type in self.ARC_PATTERNS.keys():
            analysis = self.analyze_emotional_arc(clips, target_arc=arc_type)

            previews[arc_type] = {
                "arc_type": arc_type,
                "description": self.ARC_PATTERNS[arc_type]["description"],
                "ideal_for": self.ARC_PATTERNS[arc_type]["ideal_for"],
                "quality_score": analysis.arc_quality_score,
                "needs_reordering": analysis.suggested_reordering != list(range(len(clips))),
                "pacing_recommendation": analysis.pacing_recommendation
            }

        # Sort by quality score
        sorted_previews = dict(sorted(
            previews.items(),
            key=lambda x: x[1]["quality_score"],
            reverse=True
        ))

        return sorted_previews
