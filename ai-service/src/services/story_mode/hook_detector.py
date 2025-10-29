"""
Intelligent Hook Detection & Positioning

This module analyzes video content to detect the most engaging moments
and optimal hook points for social media content.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import re

logger = logging.getLogger(__name__)


@dataclass
class HookCandidate:
    """Represents a potential hook point in the video"""
    start_time: float
    end_time: float
    text: str
    hook_type: str  # "question", "surprise", "emotional", "statistic", "benefit", "problem"
    engagement_score: float  # 0-10
    placement_recommendation: str  # "intro", "first_3_seconds", "pre_roll"
    reasoning: str
    keywords: List[str]


class HookDetector:
    """
    Detects and analyzes potential hook points in video content
    based on transcript, sentiment, and engagement patterns.
    """

    def __init__(self):
        self.hook_patterns = self._init_hook_patterns()
        self.engagement_keywords = self._init_engagement_keywords()

    def _init_hook_patterns(self) -> Dict[str, List[str]]:
        """Initialize regex patterns for different hook types"""
        return {
            "question": [
                r"\b(what if|how do you|why should|have you ever|did you know|can you imagine)\b",
                r"\b(wondering|question|curious about)\b",
                r"[?]",
            ],
            "surprise": [
                r"\b(shocking|surprising|unbelievable|incredible|amazing|mind-blowing)\b",
                r"\b(never expected|couldn't believe|shocked|stunned)\b",
                r"\b(wow|omg|no way)\b",
            ],
            "emotional": [
                r"\b(transformed|life-changing|breakthrough|game-changer)\b",
                r"\b(struggling|frustrated|desperate|overwhelmed)\b",
                r"\b(finally|at last|breakthrough moment)\b",
            ],
            "statistic": [
                r"\b\d+%\b",
                r"\b\d+x (more|faster|better|increase|growth)\b",
                r"\b(increased by|decreased by|grew to|saved)\s+\d+",
            ],
            "benefit": [
                r"\b(saved|gained|earned|achieved|doubled|tripled)\b",
                r"\b(results|success|improvement|growth)\b",
                r"\b(within|in just|after only)\s+\d+\s+(days|weeks|months)\b",
            ],
            "problem": [
                r"\b(problem|challenge|issue|struggle|difficulty)\b",
                r"\b(before|used to|couldn't|wasn't able to)\b",
                r"\b(frustrated with|tired of|sick of)\b",
            ],
        }

    def _init_engagement_keywords(self) -> Dict[str, float]:
        """Initialize keywords and their engagement weight"""
        return {
            # High engagement
            "revolutionary": 2.0,
            "breakthrough": 1.8,
            "transform": 1.7,
            "incredible": 1.6,
            "amazing": 1.5,
            "game-changer": 1.8,
            "life-changing": 1.9,
            # Curiosity
            "secret": 1.7,
            "discover": 1.4,
            "revealed": 1.5,
            "insider": 1.3,
            # Results
            "results": 1.3,
            "success": 1.2,
            "achieved": 1.3,
            "doubled": 1.6,
            "tripled": 1.7,
            # Problem solving
            "solved": 1.4,
            "solution": 1.3,
            "fixed": 1.2,
            "overcome": 1.3,
        }

    def detect_hooks(
        self,
        transcript: str,
        transcript_segments: Optional[List[Dict[str, Any]]] = None,
        sentiment_data: Optional[Dict[str, Any]] = None,
        duration: float = 0,
    ) -> List[HookCandidate]:
        """
        Detect potential hook points in the video content.

        Args:
            transcript: Full transcript text
            transcript_segments: Timestamped transcript segments
            sentiment_data: Sentiment analysis data
            duration: Video duration in seconds

        Returns:
            List of HookCandidate objects sorted by engagement score
        """
        hooks = []

        if not transcript_segments:
            # If no segments provided, create one from full transcript
            transcript_segments = [
                {
                    "text": transcript,
                    "start_time": 0,
                    "end_time": duration,
                }
            ]

        # Analyze each segment for hook potential
        for segment in transcript_segments:
            segment_text = segment.get("text", "")
            start_time = segment.get("start_time", 0)
            end_time = segment.get("end_time", start_time + 5)

            # Skip very short or empty segments
            if not segment_text or len(segment_text.strip()) < 10:
                continue

            # Detect hook type and score
            hook_type, score, keywords = self._analyze_segment_for_hooks(segment_text)

            if score > 3.0:  # Only consider segments with decent hook potential
                # Determine placement recommendation
                placement = self._recommend_placement(start_time, duration)

                # Generate reasoning
                reasoning = self._generate_reasoning(hook_type, score, keywords)

                hooks.append(
                    HookCandidate(
                        start_time=start_time,
                        end_time=end_time,
                        text=segment_text,
                        hook_type=hook_type,
                        engagement_score=score,
                        placement_recommendation=placement,
                        reasoning=reasoning,
                        keywords=keywords,
                    )
                )

        # Enhance scores with sentiment data if available
        if sentiment_data:
            hooks = self._enhance_with_sentiment(hooks, sentiment_data)

        # Sort by engagement score
        hooks.sort(key=lambda h: h.engagement_score, reverse=True)

        return hooks

    def _analyze_segment_for_hooks(
        self, text: str
    ) -> Tuple[str, float, List[str]]:
        """
        Analyze a text segment for hook potential.

        Returns:
            Tuple of (hook_type, engagement_score, keywords)
        """
        # Minimum length check - too short segments are not good hooks
        word_count = len(text.split())
        if word_count < 5:
            return "general", 0.0, []

        text_lower = text.lower()
        scores = {}
        found_keywords = []

        # Check for filler words and hesitations (negative indicators)
        filler_patterns = [
            r"\bum+\b", r"\buh+\b", r"\ber+\b",  # Hesitation sounds
            r"\blike\s+like\b",  # Repeated "like"
            r"\byou know\s+you know\b",  # Repeated "you know"
        ]
        filler_penalty = 0
        for pattern in filler_patterns:
            if re.search(pattern, text_lower):
                filler_penalty += 0.3

        # Pattern matching for hook types
        for hook_type, patterns in self.hook_patterns.items():
            score = 0
            for pattern in patterns:
                matches = re.findall(pattern, text_lower, re.IGNORECASE)
                score += len(matches) * 1.5

            scores[hook_type] = score

        # Keyword matching
        keyword_score = 0
        for keyword, weight in self.engagement_keywords.items():
            if keyword in text_lower:
                keyword_score += weight
                found_keywords.append(keyword)

        # Determine dominant hook type
        if max(scores.values()) == 0 and keyword_score == 0:
            return "general", max(0.0, 1.0 - filler_penalty), []

        dominant_type = max(scores.items(), key=lambda x: x[1])[0]
        base_score = scores[dominant_type]

        # Combine base score with keyword score
        total_score = min(10.0, base_score + keyword_score)

        # Apply filler penalty
        total_score = max(0.0, total_score - filler_penalty)

        # Adjust for text length (shorter is often better for hooks)
        if word_count < 15:
            total_score *= 1.2  # Bonus for brevity
        elif word_count > 40:
            total_score *= 0.8  # Penalty for verbosity
        elif word_count > 60:
            total_score *= 0.6  # Stronger penalty for very long segments

        return dominant_type, total_score, found_keywords

    def _recommend_placement(self, start_time: float, duration: float) -> str:
        """Recommend where this hook should be placed"""
        if start_time < 3:
            return "first_3_seconds"
        elif start_time < 10:
            return "intro"
        elif start_time < duration * 0.3:
            return "early"
        elif start_time < duration * 0.7:
            return "middle"
        else:
            return "closing"

    def _generate_reasoning(
        self, hook_type: str, score: float, keywords: List[str]
    ) -> str:
        """Generate human-readable reasoning for the hook score"""
        reasoning_map = {
            "question": "Opens with a compelling question that engages curiosity",
            "surprise": "Contains surprising or unexpected information",
            "emotional": "Emotionally engaging content that resonates",
            "statistic": "Includes concrete numbers and data points",
            "benefit": "Highlights clear benefits and results",
            "problem": "Addresses a relatable problem",
        }

        base_reason = reasoning_map.get(hook_type, "Engaging content")

        if keywords:
            base_reason += f". High-value keywords: {', '.join(keywords[:3])}"

        if score > 7:
            base_reason += ". Very strong hook potential."
        elif score > 5:
            base_reason += ". Good hook potential."

        return base_reason

    def _enhance_with_sentiment(
        self, hooks: List[HookCandidate], sentiment_data: Dict[str, Any]
    ) -> List[HookCandidate]:
        """Enhance hook scores using sentiment analysis data"""
        emotion_boost = {
            "joy": 1.3,
            "surprise": 1.4,
            "excitement": 1.5,
            "satisfaction": 1.2,
        }

        for hook in hooks:
            # Find sentiment for this time range
            for emotion_segment in sentiment_data.get("emotion_segments", []):
                seg_start = emotion_segment.get("start_time", 0)
                seg_end = emotion_segment.get("end_time", 0)

                # Check if hook overlaps with emotion segment
                if (hook.start_time >= seg_start and hook.start_time <= seg_end) or (
                    hook.end_time >= seg_start and hook.end_time <= seg_end
                ):
                    emotion = emotion_segment.get("dominant_emotion", "").lower()
                    if emotion in emotion_boost:
                        hook.engagement_score *= emotion_boost[emotion]
                        hook.reasoning += f" Enhanced by {emotion} emotion."

        return hooks

    def recommend_best_hook(
        self,
        hooks: List[HookCandidate],
        target_position: str = "intro",
        max_duration: float = 5.0,
    ) -> Optional[HookCandidate]:
        """
        Recommend the single best hook for a specific position.

        Args:
            hooks: List of detected hooks
            target_position: Desired position ("intro", "first_3_seconds", etc.)
            max_duration: Maximum hook duration in seconds

        Returns:
            Best matching HookCandidate or None
        """
        # Filter hooks by position and duration
        candidates = [
            h
            for h in hooks
            if h.placement_recommendation == target_position
            and (h.end_time - h.start_time) <= max_duration
        ]

        if not candidates:
            # Fall back to any high-scoring hook
            candidates = [h for h in hooks if (h.end_time - h.start_time) <= max_duration]

        return candidates[0] if candidates else None

    def create_hook_cut(
        self,
        hook: HookCandidate,
        pre_roll_duration: float = 0.5,
        post_roll_duration: float = 0.3,
    ) -> Dict[str, float]:
        """
        Create timing for extracting a hook clip.

        Args:
            hook: The hook candidate to extract
            pre_roll_duration: Seconds to include before the hook
            post_roll_duration: Seconds to include after the hook

        Returns:
            Dict with start_time and end_time for the cut
        """
        return {
            "start_time": max(0, hook.start_time - pre_roll_duration),
            "end_time": hook.end_time + post_roll_duration,
            "original_start": hook.start_time,
            "original_end": hook.end_time,
        }

    def optimize_for_platform(
        self, hooks: List[HookCandidate], platform: str
    ) -> List[HookCandidate]:
        """
        Optimize hook recommendations for specific platforms.

        Args:
            hooks: List of detected hooks
            platform: Target platform (tiktok, instagram, youtube, etc.)

        Returns:
            Re-scored hooks optimized for the platform
        """
        platform_preferences = {
            "tiktok": {
                "preferred_types": ["surprise", "question", "emotional"],
                "max_duration": 3.0,
                "boost_factor": 1.3,
            },
            "instagram": {
                "preferred_types": ["benefit", "emotional", "surprise"],
                "max_duration": 4.0,
                "boost_factor": 1.2,
            },
            "youtube": {
                "preferred_types": ["question", "benefit", "statistic"],
                "max_duration": 6.0,
                "boost_factor": 1.1,
            },
            "linkedin": {
                "preferred_types": ["statistic", "benefit", "problem"],
                "max_duration": 5.0,
                "boost_factor": 1.15,
            },
        }

        prefs = platform_preferences.get(platform, {"preferred_types": [], "max_duration": 5.0, "boost_factor": 1.0})

        for hook in hooks:
            # Boost score if hook type matches platform preference
            if hook.hook_type in prefs["preferred_types"]:
                hook.engagement_score *= prefs["boost_factor"]

            # Penalize if too long for platform
            duration = hook.end_time - hook.start_time
            if duration > prefs["max_duration"]:
                hook.engagement_score *= 0.7

        # Re-sort after optimization
        hooks.sort(key=lambda h: h.engagement_score, reverse=True)

        return hooks
