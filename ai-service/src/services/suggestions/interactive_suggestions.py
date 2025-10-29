# src/services/suggestions/interactive_suggestions.py

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class Suggestion:
    """A single AI suggestion"""
    suggestion_id: str
    type: str  # "optimization", "warning", "enhancement", "tip", "next_step"
    priority: str  # "high", "medium", "low"
    title: str
    message: str
    action_label: Optional[str]  # Button text if actionable
    action_type: Optional[str]  # "apply_enhancement", "change_setting", "add_step", etc.
    action_params: Optional[Dict[str, Any]]  # Parameters for the action
    dismissible: bool
    context: Dict[str, Any]  # Additional context data


@dataclass
class SuggestionContext:
    """Context about current processing state"""
    step_name: str
    testimonial_id: str
    platform: str
    duration: float
    video_metadata: Dict[str, Any]
    previous_steps: List[str]
    quality_metrics: Optional[Dict[str, Any]] = None
    hook_analysis: Optional[Dict[str, Any]] = None
    arc_analysis: Optional[Dict[str, Any]] = None


class InteractiveSuggestionEngine:
    """
    Generates contextual AI suggestions during video processing.

    Provides intelligent recommendations at each step based on:
    - Current video characteristics
    - Previous processing steps
    - Platform best practices
    - Quality analysis results
    """

    def __init__(self):
        logger.info("InteractiveSuggestionEngine initialized")

    def get_suggestions_for_step(
        self,
        context: SuggestionContext
    ) -> List[Suggestion]:
        """
        Generate suggestions for current processing step.

        Args:
            context: Current processing context

        Returns:
            List of relevant suggestions
        """
        suggestions = []

        # Step-specific suggestions
        if context.step_name == "crop_resize":
            suggestions.extend(self._suggest_for_crop(context))
        elif context.step_name == "enhance":
            suggestions.extend(self._suggest_for_enhance(context))
        elif context.step_name == "assemble":
            suggestions.extend(self._suggest_for_assemble(context))
        elif context.step_name == "captions":
            suggestions.extend(self._suggest_for_captions(context))
        elif context.step_name == "music":
            suggestions.extend(self._suggest_for_music(context))

        # Cross-step suggestions
        suggestions.extend(self._suggest_next_steps(context))
        suggestions.extend(self._suggest_optimizations(context))
        suggestions.extend(self._suggest_warnings(context))

        # Sort by priority
        priority_order = {"high": 0, "medium": 1, "low": 2}
        suggestions.sort(key=lambda s: priority_order.get(s.priority, 3))

        return suggestions

    def _suggest_for_crop(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggestions during crop/resize step"""
        suggestions = []

        aspect_ratio = context.video_metadata.get("aspect_ratio", "")
        platform = context.platform.lower()

        # Suggest optimal aspect ratio
        optimal_ratios = {
            "tiktok": "9:16",
            "instagram": "9:16",
            "youtube": "16:9",
            "linkedin": "16:9"
        }

        optimal = optimal_ratios.get(platform, "16:9")

        if aspect_ratio != optimal:
            suggestions.append(Suggestion(
                suggestion_id="crop_aspect_ratio",
                type="optimization",
                priority="high",
                title="Optimize Aspect Ratio",
                message=f"For {platform.title()}, use {optimal} aspect ratio for best performance. Current: {aspect_ratio}",
                action_label="Change to " + optimal,
                action_type="change_aspect_ratio",
                action_params={"aspect_ratio": optimal},
                dismissible=True,
                context={"current": aspect_ratio, "recommended": optimal}
            ))

        # Suggest safe crop area
        duration = context.duration
        if duration > 90 and platform in ["tiktok", "instagram"]:
            suggestions.append(Suggestion(
                suggestion_id="crop_duration",
                type="warning",
                priority="medium",
                title="Video Length Warning",
                message=f"Video is {duration:.0f}s. {platform.title()} performs best with videos under 60s.",
                action_label="Suggest Clips",
                action_type="suggest_clipping",
                action_params={"target_duration": 60},
                dismissible=True,
                context={"duration": duration, "platform": platform}
            ))

        return suggestions

    def _suggest_for_enhance(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggestions during enhancement step"""
        suggestions = []

        quality_metrics = context.quality_metrics

        if quality_metrics:
            quality_score = quality_metrics.get("overall_score", 75)

            if quality_score < 70:
                suggestions.append(Suggestion(
                    suggestion_id="enhance_quality",
                    type="enhancement",
                    priority="high",
                    title="Quality Enhancement Recommended",
                    message=f"Current quality score: {quality_score:.0f}/100. Enhancement can improve clarity and professionalism.",
                    action_label="Apply Enhancement",
                    action_type="apply_enhancement",
                    action_params={"preset": "medium"},
                    dismissible=True,
                    context={"score": quality_score}
                ))

        # Suggest scene-aware enhancement
        has_scene_analysis = context.video_metadata.get("has_scene_analysis", False)
        if not has_scene_analysis:
            suggestions.append(Suggestion(
                suggestion_id="scene_aware_enhancement",
                type="tip",
                priority="medium",
                title="Try Scene-Aware Enhancement",
                message="Adaptive enhancement analyzes your video and applies optimal improvements for each scene type.",
                action_label="Use Adaptive Enhancement",
                action_type="use_adaptive_enhancement",
                action_params={},
                dismissible=True,
                context={}
            ))

        return suggestions

    def _suggest_for_assemble(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggestions during assembly step"""
        suggestions = []

        arc_analysis = context.arc_analysis

        if arc_analysis:
            arc_quality = arc_analysis.get("arc_quality_score", 70)

            if arc_quality < 70:
                arc_type = arc_analysis.get("arc_type", "problem_solution")
                suggestions.append(Suggestion(
                    suggestion_id="improve_story_arc",
                    type="optimization",
                    priority="high",
                    title="Improve Story Flow",
                    message=f"Story arc quality: {arc_quality:.0f}/100. Reordering clips can create stronger emotional impact.",
                    action_label="Optimize Order",
                    action_type="reorder_clips",
                    action_params={"arc_type": arc_type},
                    dismissible=True,
                    context={"score": arc_quality, "arc_type": arc_type}
                ))

        # Suggest smart transitions
        if "smart_transitions" not in context.previous_steps:
            suggestions.append(Suggestion(
                suggestion_id="smart_transitions",
                type="enhancement",
                priority="medium",
                title="Use Smart Transitions",
                message="AI-selected transitions based on content and platform can improve watch-through rate by up to 25%.",
                action_label="Enable Smart Transitions",
                action_type="enable_smart_transitions",
                action_params={},
                dismissible=True,
                context={}
            ))

        return suggestions

    def _suggest_for_captions(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggestions for caption step"""
        suggestions = []

        platform = context.platform.lower()

        # Platform-specific caption recommendations
        if platform in ["tiktok", "instagram"]:
            suggestions.append(Suggestion(
                suggestion_id="caption_style",
                type="tip",
                priority="medium",
                title="Caption Best Practice",
                message=f"For {platform.title()}, use large, high-contrast captions. 85% of users watch without sound.",
                action_label=None,
                action_type=None,
                action_params=None,
                dismissible=True,
                context={"platform": platform}
            ))

        # Hook in captions
        hook_analysis = context.hook_analysis
        if hook_analysis:
            best_hook = hook_analysis.get("best_hook", {})
            hook_score = best_hook.get("engagement_score", 0.5)

            if hook_score > 0.7:
                suggestions.append(Suggestion(
                    suggestion_id="highlight_hook",
                    type="tip",
                    priority="medium",
                    title="Highlight Your Hook",
                    message=f"Your opening hook scores {hook_score*100:.0f}/100. Consider emphasizing it in captions for maximum impact.",
                    action_label=None,
                    action_type=None,
                    action_params=None,
                    dismissible=True,
                    context={"hook_score": hook_score}
                ))

        return suggestions

    def _suggest_for_music(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggestions for music step"""
        suggestions = []

        platform = context.platform.lower()
        duration = context.duration

        # Music volume recommendation
        if platform in ["linkedin", "youtube"]:
            suggestions.append(Suggestion(
                suggestion_id="music_volume",
                type="tip",
                priority="low",
                title="Music Volume Tip",
                message=f"For {platform.title()}, keep background music subtle (20-30% volume) to maintain professional tone.",
                action_label=None,
                action_type=None,
                action_params=None,
                dismissible=True,
                context={"platform": platform}
            ))
        else:
            suggestions.append(Suggestion(
                suggestion_id="music_volume_social",
                type="tip",
                priority="low",
                title="Music Volume Tip",
                message=f"For {platform.title()}, more prominent music (40% volume) can increase emotional engagement.",
                action_label=None,
                action_type=None,
                action_params=None,
                dismissible=True,
                context={"platform": platform}
            ))

        return suggestions

    def _suggest_next_steps(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggest logical next steps in workflow"""
        suggestions = []

        previous = context.previous_steps

        # After crop, suggest captions
        if "crop_resize" in previous and "captions" not in previous:
            suggestions.append(Suggestion(
                suggestion_id="next_captions",
                type="next_step",
                priority="medium",
                title="Next: Add Captions",
                message="Captions improve accessibility and increase watch time by 40% on average.",
                action_label="Add Captions",
                action_type="add_step",
                action_params={"step": "captions"},
                dismissible=True,
                context={}
            ))

        # After captions, suggest music
        if "captions" in previous and "music" not in previous:
            suggestions.append(Suggestion(
                suggestion_id="next_music",
                type="next_step",
                priority="low",
                title="Next: Add Background Music",
                message="Background music can enhance emotional impact and brand recall.",
                action_label="Add Music",
                action_type="add_step",
                action_params={"step": "music"},
                dismissible=True,
                context={}
            ))

        # After enhancement, suggest quality check
        if "enhance" in previous:
            suggestions.append(Suggestion(
                suggestion_id="next_quality_check",
                type="next_step",
                priority="medium",
                title="Review Quality Improvements",
                message="Check before/after quality metrics to see enhancement results.",
                action_label="View Metrics",
                action_type="view_quality_metrics",
                action_params={},
                dismissible=True,
                context={}
            ))

        return suggestions

    def _suggest_optimizations(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggest general optimizations based on context"""
        suggestions = []

        platform = context.platform.lower()
        duration = context.duration

        # Platform-specific optimizations
        if platform == "tiktok" and duration > 30:
            suggestions.append(Suggestion(
                suggestion_id="optimize_for_tiktok",
                type="optimization",
                priority="medium",
                title="TikTok Optimization",
                message="TikTok videos perform best at 15-30 seconds. Consider creating a shorter version.",
                action_label="Create Short Version",
                action_type="create_short_version",
                action_params={"target_duration": 25},
                dismissible=True,
                context={"current_duration": duration}
            ))

        # Suggest A/B testing
        if len(context.previous_steps) >= 3:
            suggestions.append(Suggestion(
                suggestion_id="ab_test_suggestion",
                type="tip",
                priority="low",
                title="Consider A/B Testing",
                message="Test different hooks or pacing to find what resonates best with your audience.",
                action_label="Generate Test Plan",
                action_type="generate_ab_test",
                action_params={},
                dismissible=True,
                context={}
            ))

        return suggestions

    def _suggest_warnings(self, context: SuggestionContext) -> List[Suggestion]:
        """Suggest warnings about potential issues"""
        suggestions = []

        duration = context.duration
        platform = context.platform.lower()

        # Duration warnings
        max_durations = {
            "tiktok": 180,
            "instagram": 90,
            "youtube": 600,
            "linkedin": 600
        }

        max_duration = max_durations.get(platform, 180)

        if duration > max_duration:
            suggestions.append(Suggestion(
                suggestion_id="duration_warning",
                type="warning",
                priority="high",
                title="Duration Exceeds Platform Limit",
                message=f"Video is {duration:.0f}s but {platform.title()} performs best under {max_duration}s.",
                action_label="Trim Video",
                action_type="trim_video",
                action_params={"target_duration": max_duration},
                dismissible=False,
                context={"duration": duration, "max": max_duration}
            ))

        return suggestions

    def get_suggestion_summary(self, suggestions: List[Suggestion]) -> Dict[str, Any]:
        """Generate summary of suggestions"""
        return {
            "total": len(suggestions),
            "by_type": {
                "optimization": len([s for s in suggestions if s.type == "optimization"]),
                "warning": len([s for s in suggestions if s.type == "warning"]),
                "enhancement": len([s for s in suggestions if s.type == "enhancement"]),
                "tip": len([s for s in suggestions if s.type == "tip"]),
                "next_step": len([s for s in suggestions if s.type == "next_step"])
            },
            "by_priority": {
                "high": len([s for s in suggestions if s.priority == "high"]),
                "medium": len([s for s in suggestions if s.priority == "medium"]),
                "low": len([s for s in suggestions if s.priority == "low"])
            },
            "actionable": len([s for s in suggestions if s.action_type is not None])
        }
