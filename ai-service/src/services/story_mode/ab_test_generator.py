# src/services/story_mode/ab_test_generator.py

import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import uuid

logger = logging.getLogger(__name__)


@dataclass
class VariantConfig:
    """Configuration for a single A/B test variant"""
    variant_id: str
    variant_name: str
    description: str
    test_hypothesis: str
    modifications: Dict[str, Any]
    expected_impact: str  # "hook engagement", "completion rate", "conversion", etc.


@dataclass
class ABTestPlan:
    """Complete A/B test plan with multiple variants"""
    test_id: str
    test_name: str
    test_objective: str
    control_config: Dict[str, Any]  # Original/baseline configuration
    variants: List[VariantConfig]
    recommended_variant: str  # variant_id of most promising variant
    metrics_to_track: List[str]
    test_duration_recommendation: str
    sample_size_recommendation: int


class ABTestGenerator:
    """
    Generates A/B test variants for testimonial videos.

    Creates multiple versions with strategic differences to test
    different content strategies (hook styles, pacing, structure, etc.)
    """

    # Test strategies for different objectives
    TEST_STRATEGIES = {
        "hook_effectiveness": {
            "description": "Test different opening hooks to maximize first 3-second retention",
            "variants": [
                {
                    "name": "Question Hook",
                    "hypothesis": "Starting with a question increases curiosity and engagement",
                    "modifications": {"hook_type": "question", "hook_duration": 3}
                },
                {
                    "name": "Stat Hook",
                    "hypothesis": "Leading with impressive statistics builds credibility fast",
                    "modifications": {"hook_type": "statistic", "hook_duration": 3}
                },
                {
                    "name": "Problem Hook",
                    "hypothesis": "Opening with a relatable problem creates immediate connection",
                    "modifications": {"hook_type": "problem", "hook_duration": 3}
                }
            ]
        },
        "pacing_optimization": {
            "description": "Test different video pacing to find optimal watch-through rate",
            "variants": [
                {
                    "name": "Fast Paced",
                    "hypothesis": "Quick cuts and fast pacing keep attention on short-form platforms",
                    "modifications": {"pacing": "fast", "transition_duration": 0.2, "clip_length_target": 5}
                },
                {
                    "name": "Balanced Paced",
                    "hypothesis": "Moderate pacing allows information absorption without drag",
                    "modifications": {"pacing": "balanced", "transition_duration": 0.3, "clip_length_target": 8}
                },
                {
                    "name": "Slow Paced",
                    "hypothesis": "Deliberate pacing builds trust and lets story resonate",
                    "modifications": {"pacing": "slow", "transition_duration": 0.5, "clip_length_target": 12}
                }
            ]
        },
        "storytelling_structure": {
            "description": "Test different narrative structures for maximum emotional impact",
            "variants": [
                {
                    "name": "Hero's Journey",
                    "hypothesis": "Problem→Struggle→Solution→Victory creates strongest emotional arc",
                    "modifications": {"arc_type": "hero_journey", "ordering_strategy": "emotional_arc"}
                },
                {
                    "name": "Problem-Solution",
                    "hypothesis": "Direct Problem→Solution approach is clearest for B2B audiences",
                    "modifications": {"arc_type": "problem_solution", "ordering_strategy": "emotional_arc"}
                },
                {
                    "name": "Progressive Success",
                    "hypothesis": "Building momentum with successive wins creates aspirational appeal",
                    "modifications": {"arc_type": "progressive_success", "ordering_strategy": "emotional_arc"}
                }
            ]
        },
        "video_length": {
            "description": "Test different video lengths to balance engagement vs information",
            "variants": [
                {
                    "name": "Ultra-Short (15-30s)",
                    "hypothesis": "Bite-sized content maximizes completion rate and shareability",
                    "modifications": {"target_duration": 22, "clips_count": 2}
                },
                {
                    "name": "Short (30-60s)",
                    "hypothesis": "Medium length provides context while maintaining attention",
                    "modifications": {"target_duration": 45, "clips_count": 3}
                },
                {
                    "name": "Standard (60-90s)",
                    "hypothesis": "Full story with details builds stronger trust and conversion",
                    "modifications": {"target_duration": 75, "clips_count": 5}
                }
            ]
        },
        "caption_style": {
            "description": "Test different caption approaches for accessibility and engagement",
            "variants": [
                {
                    "name": "Minimal Captions",
                    "hypothesis": "Clean aesthetic with key phrases only appeals to premium audiences",
                    "modifications": {"caption_style": "minimal", "caption_words_per_clip": 5}
                },
                {
                    "name": "Full Captions",
                    "hypothesis": "Complete transcription maximizes accessibility and retention",
                    "modifications": {"caption_style": "full", "caption_words_per_clip": 15}
                },
                {
                    "name": "Dynamic Captions",
                    "hypothesis": "Animated word-by-word captions create TikTok-style engagement",
                    "modifications": {"caption_style": "dynamic", "caption_animation": "word_by_word"}
                }
            ]
        },
        "music_intensity": {
            "description": "Test background music intensity for emotional amplification",
            "variants": [
                {
                    "name": "No Music",
                    "hypothesis": "Pure authenticity without music builds more trust",
                    "modifications": {"music_enabled": False}
                },
                {
                    "name": "Subtle Music",
                    "hypothesis": "Light background music enhances without distraction",
                    "modifications": {"music_enabled": True, "music_volume": 0.2}
                },
                {
                    "name": "Prominent Music",
                    "hypothesis": "Uplifting music creates emotional connection and energy",
                    "modifications": {"music_enabled": True, "music_volume": 0.4}
                }
            ]
        }
    }

    def __init__(self):
        logger.info("ABTestGenerator initialized")

    def generate_ab_test_plan(
        self,
        test_objective: str,
        baseline_config: Dict[str, Any],
        platform: str = "instagram",
        num_variants: int = 3
    ) -> ABTestPlan:
        """
        Generate an A/B test plan with multiple variants.

        Args:
            test_objective: What to optimize ("hook_effectiveness", "pacing_optimization", etc.)
            baseline_config: Current/control configuration
            platform: Target platform
            num_variants: Number of variants to generate (2-4 recommended)

        Returns:
            ABTestPlan with variants and recommendations
        """
        logger.info(f"Generating A/B test plan for objective: {test_objective}")

        # Get strategy for objective
        strategy = self.TEST_STRATEGIES.get(
            test_objective,
            self.TEST_STRATEGIES["hook_effectiveness"]
        )

        # Generate test ID
        test_id = str(uuid.uuid4())[:8]

        # Create variants
        variants = []
        variant_data = strategy["variants"][:num_variants]

        for i, variant_template in enumerate(variant_data):
            # Merge modifications with baseline
            variant_config = baseline_config.copy()
            variant_config.update(variant_template["modifications"])

            # Create variant
            variant = VariantConfig(
                variant_id=f"variant_{chr(65+i)}",  # A, B, C, etc.
                variant_name=variant_template["name"],
                description=strategy["description"],
                test_hypothesis=variant_template["hypothesis"],
                modifications=variant_template["modifications"],
                expected_impact=self._determine_expected_impact(
                    test_objective, variant_template["name"]
                )
            )

            variants.append(variant)

        # Determine recommended variant based on platform
        recommended = self._recommend_variant(
            variants, platform, test_objective
        )

        # Metrics to track
        metrics = self._get_tracking_metrics(test_objective)

        # Test duration and sample size recommendations
        duration_rec = self._recommend_test_duration(test_objective, platform)
        sample_size = self._recommend_sample_size(num_variants)

        return ABTestPlan(
            test_id=test_id,
            test_name=f"{test_objective.replace('_', ' ').title()} Test",
            test_objective=strategy["description"],
            control_config=baseline_config,
            variants=variants,
            recommended_variant=recommended,
            metrics_to_track=metrics,
            test_duration_recommendation=duration_rec,
            sample_size_recommendation=sample_size
        )

    def generate_all_test_plans(
        self,
        baseline_config: Dict[str, Any],
        platform: str = "instagram"
    ) -> List[ABTestPlan]:
        """
        Generate test plans for all available test strategies.

        Useful for getting a comprehensive testing roadmap.

        Args:
            baseline_config: Current configuration
            platform: Target platform

        Returns:
            List of all test plans
        """
        plans = []

        for objective in self.TEST_STRATEGIES.keys():
            plan = self.generate_ab_test_plan(
                test_objective=objective,
                baseline_config=baseline_config,
                platform=platform,
                num_variants=3
            )
            plans.append(plan)

        # Sort by priority (platform-specific)
        plans = self._prioritize_tests(plans, platform)

        return plans

    def _determine_expected_impact(
        self,
        test_objective: str,
        variant_name: str
    ) -> str:
        """Determine expected impact area for variant"""
        impact_map = {
            "hook_effectiveness": "3-second retention rate",
            "pacing_optimization": "watch-through rate",
            "storytelling_structure": "emotional engagement & conversion",
            "video_length": "completion rate & sharing",
            "caption_style": "accessibility & retention",
            "music_intensity": "emotional connection & brand recall"
        }

        return impact_map.get(test_objective, "overall engagement")

    def _recommend_variant(
        self,
        variants: List[VariantConfig],
        platform: str,
        test_objective: str
    ) -> str:
        """Recommend most promising variant based on platform"""
        # Platform-specific recommendations
        platform_preferences = {
            "tiktok": {
                "hook_effectiveness": "Question Hook",
                "pacing_optimization": "Fast Paced",
                "video_length": "Ultra-Short (15-30s)",
                "caption_style": "Dynamic Captions"
            },
            "instagram": {
                "hook_effectiveness": "Problem Hook",
                "pacing_optimization": "Fast Paced",
                "video_length": "Short (30-60s)",
                "caption_style": "Full Captions"
            },
            "youtube": {
                "hook_effectiveness": "Stat Hook",
                "pacing_optimization": "Balanced Paced",
                "video_length": "Standard (60-90s)",
                "caption_style": "Minimal Captions"
            },
            "linkedin": {
                "hook_effectiveness": "Stat Hook",
                "pacing_optimization": "Balanced Paced",
                "video_length": "Standard (60-90s)",
                "caption_style": "Full Captions"
            }
        }

        platform_key = platform.lower()
        preferred_name = platform_preferences.get(platform_key, {}).get(
            test_objective,
            variants[0].variant_name
        )

        # Find matching variant
        for variant in variants:
            if variant.variant_name == preferred_name:
                return variant.variant_id

        # Default to first variant
        return variants[0].variant_id

    def _get_tracking_metrics(self, test_objective: str) -> List[str]:
        """Get recommended metrics to track for test"""
        base_metrics = [
            "impressions",
            "views",
            "completion_rate",
            "engagement_rate"
        ]

        objective_metrics = {
            "hook_effectiveness": ["3_sec_retention", "hook_dropoff_rate"],
            "pacing_optimization": ["avg_watch_time", "rewatch_rate"],
            "storytelling_structure": ["emotional_reaction_rate", "comment_quality"],
            "video_length": ["completion_rate", "share_rate"],
            "caption_style": ["retention_with_sound_off", "accessibility_score"],
            "music_intensity": ["emotional_engagement", "brand_recall"]
        }

        specific_metrics = objective_metrics.get(test_objective, [])

        return base_metrics + specific_metrics

    def _recommend_test_duration(
        self,
        test_objective: str,
        platform: str
    ) -> str:
        """Recommend test duration based on platform and objective"""
        # Platform velocity
        platform_speed = {
            "tiktok": "3-5 days",
            "instagram": "5-7 days",
            "youtube": "14-21 days",
            "linkedin": "14-21 days"
        }

        return platform_speed.get(platform.lower(), "7-10 days")

    def _recommend_sample_size(self, num_variants: int) -> int:
        """Recommend minimum sample size per variant"""
        # Statistical significance requires minimum samples
        base_sample = 300  # Minimum for statistical significance

        # More variants = need more samples
        multiplier = 1 + (num_variants - 2) * 0.2

        return int(base_sample * multiplier)

    def _prioritize_tests(
        self,
        plans: List[ABTestPlan],
        platform: str
    ) -> List[ABTestPlan]:
        """Prioritize test plans based on platform and impact"""
        # Priority order by platform
        priority_map = {
            "tiktok": [
                "hook_effectiveness",
                "video_length",
                "pacing_optimization",
                "caption_style",
                "storytelling_structure",
                "music_intensity"
            ],
            "instagram": [
                "hook_effectiveness",
                "pacing_optimization",
                "video_length",
                "storytelling_structure",
                "caption_style",
                "music_intensity"
            ],
            "youtube": [
                "storytelling_structure",
                "video_length",
                "hook_effectiveness",
                "pacing_optimization",
                "music_intensity",
                "caption_style"
            ],
            "linkedin": [
                "storytelling_structure",
                "video_length",
                "caption_style",
                "hook_effectiveness",
                "pacing_optimization",
                "music_intensity"
            ]
        }

        platform_key = platform.lower()
        priority_order = priority_map.get(
            platform_key,
            priority_map["instagram"]
        )

        # Create priority dict
        priority_dict = {obj: i for i, obj in enumerate(priority_order)}

        # Extract objective from test name
        def get_priority(plan: ABTestPlan) -> int:
            # Find matching objective
            for objective in priority_order:
                if objective.replace("_", " ") in plan.test_name.lower():
                    return priority_dict[objective]
            return 999

        plans_sorted = sorted(plans, key=get_priority)

        return plans_sorted

    def get_variant_summary(self, plan: ABTestPlan) -> str:
        """Generate human-readable summary of test plan"""
        lines = []
        lines.append(f"A/B Test Plan: {plan.test_name}")
        lines.append(f"Objective: {plan.test_objective}")
        lines.append(f"Test ID: {plan.test_id}")
        lines.append("")
        lines.append("Variants:")

        for variant in plan.variants:
            lines.append(f"  {variant.variant_id.upper()}: {variant.variant_name}")
            lines.append(f"     Hypothesis: {variant.test_hypothesis}")
            lines.append(f"     Expected Impact: {variant.expected_impact}")
            if variant.variant_id == plan.recommended_variant:
                lines.append(f"     ⭐ RECOMMENDED for best results")
            lines.append("")

        lines.append(f"Metrics to Track: {', '.join(plan.metrics_to_track)}")
        lines.append(f"Recommended Duration: {plan.test_duration_recommendation}")
        lines.append(f"Minimum Sample Size: {plan.sample_size_recommendation} views per variant")

        return "\n".join(lines)
