# src/services/analytics/performance_scorer.py

import logging
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
import statistics

logger = logging.getLogger(__name__)


@dataclass
class PerformanceFactor:
    """A single factor contributing to performance readiness"""
    name: str
    score: float  # 0-100
    weight: float  # Importance weight
    status: str  # "excellent", "good", "fair", "needs_improvement"
    recommendation: str  # What to do to improve


@dataclass
class PerformanceReadinessScore:
    """Complete performance readiness assessment"""
    overall_score: float  # 0-100
    confidence_level: str  # "high", "medium", "low"
    readiness_tier: str  # "publication_ready", "minor_tweaks", "needs_work"
    factors: List[PerformanceFactor]
    strengths: List[str]
    improvements: List[str]
    platform_alignment: Dict[str, float]  # Per-platform scores
    predicted_performance: str  # Qualitative prediction
    summary: str


class PerformanceScorer:
    """
    Assesses video performance readiness based on measurable quality factors
    and platform best practices.

    This is NOT a prediction of exact metrics (views/engagement) but rather
    an assessment of how well the video follows proven best practices.
    """

    # Platform best practices (research-backed standards)
    PLATFORM_STANDARDS = {
        "tiktok": {
            "optimal_length_range": (15, 60),  # seconds
            "max_length": 180,
            "aspect_ratio": "9:16",
            "captions_required": True,
            "hook_critical": True,
            "fast_pacing": True,
            "engagement_drivers": ["hook_quality", "pacing", "emotional_arc"]
        },
        "instagram": {
            "optimal_length_range": (30, 90),
            "max_length": 90,
            "aspect_ratio": "9:16",
            "captions_recommended": True,
            "hook_critical": True,
            "fast_pacing": True,
            "engagement_drivers": ["visual_quality", "hook_quality", "brand_consistency"]
        },
        "youtube": {
            "optimal_length_range": (60, 300),
            "max_length": 600,
            "aspect_ratio": "16:9",
            "captions_recommended": True,
            "hook_critical": False,
            "fast_pacing": False,
            "engagement_drivers": ["content_quality", "emotional_arc", "storytelling"]
        },
        "linkedin": {
            "optimal_length_range": (30, 120),
            "max_length": 600,
            "aspect_ratio": "16:9",
            "captions_required": True,
            "hook_critical": False,
            "fast_pacing": False,
            "engagement_drivers": ["professionalism", "value_proposition", "credibility"]
        }
    }

    # Industry benchmark engagement rates (realistic averages)
    INDUSTRY_BENCHMARKS = {
        "tiktok": {"avg_engagement_rate": 0.055},  # 5.5%
        "instagram": {"avg_engagement_rate": 0.013},  # 1.3%
        "youtube": {"avg_engagement_rate": 0.018},  # 1.8%
        "linkedin": {"avg_engagement_rate": 0.027}  # 2.7%
    }

    def __init__(self):
        logger.info("PerformanceScorer initialized")

    def score_video_readiness(
        self,
        video_metadata: Dict[str, Any],
        target_platform: str = "instagram",
        quality_metrics: Optional[Dict[str, Any]] = None,
        hook_analysis: Optional[Dict[str, Any]] = None,
        arc_analysis: Optional[Dict[str, Any]] = None,
        transition_quality: Optional[Dict[str, Any]] = None
    ) -> PerformanceReadinessScore:
        """
        Score video performance readiness based on measurable factors.

        Args:
            video_metadata: Duration, resolution, aspect_ratio, etc.
            target_platform: Platform to optimize for
            quality_metrics: From VideoQualityScorer
            hook_analysis: From HookDetector
            arc_analysis: From EmotionalArcAnalyzer
            transition_quality: From SmartTransitionSelector

        Returns:
            PerformanceReadinessScore with assessment
        """
        logger.info(f"Scoring performance readiness for {target_platform}")

        factors = []

        # Factor 1: Technical Quality
        if quality_metrics:
            quality_factor = self._score_technical_quality(quality_metrics)
            factors.append(quality_factor)

        # Factor 2: Platform Optimization
        platform_factor = self._score_platform_optimization(
            video_metadata, target_platform
        )
        factors.append(platform_factor)

        # Factor 3: Hook Effectiveness
        if hook_analysis:
            hook_factor = self._score_hook_effectiveness(
                hook_analysis, target_platform
            )
            factors.append(hook_factor)

        # Factor 4: Storytelling Quality
        if arc_analysis:
            story_factor = self._score_storytelling(arc_analysis)
            factors.append(story_factor)

        # Factor 5: Production Polish
        polish_factor = self._score_production_polish(
            video_metadata, transition_quality
        )
        factors.append(polish_factor)

        # Calculate weighted overall score
        total_weight = sum(f.weight for f in factors)
        overall_score = sum(f.score * f.weight for f in factors) / total_weight

        # Determine confidence level (based on available data)
        confidence_level = self._calculate_confidence(
            has_quality=quality_metrics is not None,
            has_hook=hook_analysis is not None,
            has_arc=arc_analysis is not None
        )

        # Determine readiness tier
        readiness_tier = self._determine_readiness_tier(overall_score)

        # Extract strengths and improvements
        strengths = [f.name for f in factors if f.score >= 80]
        improvements = [
            f.recommendation for f in factors
            if f.score < 70 and f.recommendation
        ]

        # Platform alignment scores
        platform_alignment = self._calculate_platform_alignment(
            video_metadata, factors
        )

        # Predicted performance (qualitative)
        predicted_performance = self._predict_performance_tier(
            overall_score, target_platform
        )

        # Summary
        summary = self._generate_summary(
            overall_score, readiness_tier, target_platform
        )

        return PerformanceReadinessScore(
            overall_score=round(overall_score, 1),
            confidence_level=confidence_level,
            readiness_tier=readiness_tier,
            factors=factors,
            strengths=strengths,
            improvements=improvements,
            platform_alignment=platform_alignment,
            predicted_performance=predicted_performance,
            summary=summary
        )

    def _score_technical_quality(
        self,
        quality_metrics: Dict[str, Any]
    ) -> PerformanceFactor:
        """Score based on video quality metrics"""
        score = quality_metrics.get("after_score", quality_metrics.get("overall_score", 70))

        if score >= 85:
            status = "excellent"
            recommendation = ""
        elif score >= 75:
            status = "good"
            recommendation = "Consider minor quality enhancements"
        elif score >= 60:
            status = "fair"
            recommendation = "Apply video enhancement for better quality"
        else:
            status = "needs_improvement"
            recommendation = "Strongly recommend quality enhancement before publishing"

        return PerformanceFactor(
            name="Technical Quality",
            score=score,
            weight=1.5,  # Very important
            status=status,
            recommendation=recommendation
        )

    def _score_platform_optimization(
        self,
        video_metadata: Dict[str, Any],
        target_platform: str
    ) -> PerformanceFactor:
        """Score based on platform-specific best practices"""
        standards = self.PLATFORM_STANDARDS.get(target_platform, self.PLATFORM_STANDARDS["instagram"])

        score = 0
        max_score = 0
        issues = []

        # Check duration
        duration = video_metadata.get("duration", 0)
        optimal_min, optimal_max = standards["optimal_length_range"]
        max_score += 30

        if optimal_min <= duration <= optimal_max:
            score += 30
        elif duration < optimal_min:
            score += 15
            issues.append(f"Video is short ({duration}s). Optimal: {optimal_min}-{optimal_max}s")
        elif duration <= standards["max_length"]:
            score += 20
            issues.append(f"Video is long ({duration}s). Optimal: {optimal_min}-{optimal_max}s")
        else:
            issues.append(f"Video exceeds max length ({duration}s > {standards['max_length']}s)")

        # Check aspect ratio
        aspect_ratio = video_metadata.get("aspect_ratio", "")
        max_score += 25
        if aspect_ratio == standards["aspect_ratio"]:
            score += 25
        else:
            score += 10
            issues.append(f"Aspect ratio {aspect_ratio} doesn't match {standards['aspect_ratio']}")

        # Check captions
        has_captions = video_metadata.get("has_captions", False)
        max_score += 25
        if has_captions:
            score += 25
        elif standards.get("captions_required"):
            issues.append("Captions required for this platform")
        else:
            score += 15
            issues.append("Captions recommended for better engagement")

        # Check branding
        has_branding = video_metadata.get("has_branding", False)
        max_score += 20
        if has_branding:
            score += 20
        else:
            score += 10
            issues.append("Add branding for better brand recall")

        # Normalize score
        final_score = (score / max_score) * 100 if max_score > 0 else 70

        if final_score >= 85:
            status = "excellent"
            recommendation = ""
        elif final_score >= 70:
            status = "good"
            recommendation = issues[0] if issues else ""
        elif final_score >= 55:
            status = "fair"
            recommendation = "; ".join(issues[:2])
        else:
            status = "needs_improvement"
            recommendation = "; ".join(issues[:3])

        return PerformanceFactor(
            name="Platform Optimization",
            score=final_score,
            weight=2.0,  # Most important
            status=status,
            recommendation=recommendation
        )

    def _score_hook_effectiveness(
        self,
        hook_analysis: Dict[str, Any],
        target_platform: str
    ) -> PerformanceFactor:
        """Score based on hook quality"""
        standards = self.PLATFORM_STANDARDS.get(target_platform, self.PLATFORM_STANDARDS["instagram"])

        best_hook = hook_analysis.get("best_hook", {})
        engagement_score = best_hook.get("engagement_score", 0.5)
        hook_type = best_hook.get("hook_type", "unknown")

        # Convert engagement score (0-1) to 0-100
        score = engagement_score * 100

        # Boost score if hook is in first 3 seconds
        start_time = best_hook.get("start_time", 5)
        if start_time <= 3:
            score = min(100, score * 1.2)

        # Penalize if no hook but platform requires it
        if score < 50 and standards.get("hook_critical"):
            score = max(30, score)

        if score >= 80:
            status = "excellent"
            recommendation = ""
        elif score >= 65:
            status = "good"
            recommendation = "Consider starting with hook earlier (first 3 seconds)"
        elif score >= 50:
            status = "fair"
            recommendation = "Improve hook strength for better engagement"
        else:
            status = "needs_improvement"
            recommendation = "Add strong hook in first 3 seconds"

        weight = 1.8 if standards.get("hook_critical") else 1.2

        return PerformanceFactor(
            name="Hook Effectiveness",
            score=score,
            weight=weight,
            status=status,
            recommendation=recommendation
        )

    def _score_storytelling(
        self,
        arc_analysis: Dict[str, Any]
    ) -> PerformanceFactor:
        """Score based on emotional arc quality"""
        arc_quality = arc_analysis.get("arc_quality_score", 70)
        arc_type = arc_analysis.get("arc_type", "unknown")

        if arc_quality >= 85:
            status = "excellent"
            recommendation = ""
        elif arc_quality >= 70:
            status = "good"
            recommendation = "Emotional arc is solid"
        elif arc_quality >= 55:
            status = "fair"
            recommendation = "Consider reordering clips for better emotional flow"
        else:
            status = "needs_improvement"
            recommendation = "Reorder clips to follow proven storytelling arc"

        return PerformanceFactor(
            name="Storytelling Quality",
            score=arc_quality,
            weight=1.3,
            status=status,
            recommendation=recommendation
        )

    def _score_production_polish(
        self,
        video_metadata: Dict[str, Any],
        transition_quality: Optional[Dict[str, Any]]
    ) -> PerformanceFactor:
        """Score based on production polish indicators"""
        score = 70  # Base score

        # Check for music
        has_music = video_metadata.get("has_music", False)
        if has_music:
            score += 10

        # Check for noise removal
        has_noise_removal = video_metadata.get("noise_removed", False)
        if has_noise_removal:
            score += 10

        # Check transition quality
        if transition_quality:
            transitions_optimized = transition_quality.get("optimized", False)
            if transitions_optimized:
                score += 10

        score = min(100, score)

        issues = []
        if not has_music:
            issues.append("Add background music")
        if not has_noise_removal:
            issues.append("Apply noise removal")
        if not transition_quality or not transition_quality.get("optimized"):
            issues.append("Optimize transitions")

        if score >= 85:
            status = "excellent"
            recommendation = ""
        elif score >= 70:
            status = "good"
            recommendation = issues[0] if issues else ""
        else:
            status = "fair"
            recommendation = "; ".join(issues[:2])

        return PerformanceFactor(
            name="Production Polish",
            score=score,
            weight=1.0,
            status=status,
            recommendation=recommendation
        )

    def _calculate_confidence(
        self,
        has_quality: bool,
        has_hook: bool,
        has_arc: bool
    ) -> str:
        """Calculate confidence level based on available data"""
        data_points = sum([has_quality, has_hook, has_arc])

        if data_points >= 3:
            return "high"
        elif data_points >= 2:
            return "medium"
        else:
            return "low"

    def _determine_readiness_tier(self, score: float) -> str:
        """Determine readiness tier from overall score"""
        if score >= 80:
            return "publication_ready"
        elif score >= 65:
            return "minor_tweaks"
        else:
            return "needs_work"

    def _calculate_platform_alignment(
        self,
        video_metadata: Dict[str, Any],
        factors: List[PerformanceFactor]
    ) -> Dict[str, float]:
        """Calculate how well video aligns with each platform"""
        alignment = {}

        for platform in self.PLATFORM_STANDARDS.keys():
            platform_factor = self._score_platform_optimization(
                video_metadata, platform
            )
            alignment[platform] = round(platform_factor.score, 1)

        return alignment

    def _predict_performance_tier(
        self,
        overall_score: float,
        target_platform: str
    ) -> str:
        """Predict performance tier (qualitative)"""
        benchmark = self.INDUSTRY_BENCHMARKS.get(
            target_platform,
            {"avg_engagement_rate": 0.02}
        )

        avg_engagement = benchmark["avg_engagement_rate"] * 100

        if overall_score >= 85:
            return f"Strong potential for above-average engagement (>{avg_engagement:.1f}% benchmark)"
        elif overall_score >= 70:
            return f"Good potential to meet platform average (~{avg_engagement:.1f}% engagement)"
        elif overall_score >= 55:
            return f"May underperform platform average (<{avg_engagement:.1f}% engagement)"
        else:
            return "Likely to underperform without improvements"

    def _generate_summary(
        self,
        overall_score: float,
        readiness_tier: str,
        target_platform: str
    ) -> str:
        """Generate human-readable summary"""
        if readiness_tier == "publication_ready":
            return (
                f"Video is optimized for {target_platform.title()} and follows "
                f"platform best practices. Ready for publication."
            )
        elif readiness_tier == "minor_tweaks":
            return (
                f"Video is nearly optimized for {target_platform.title()}. "
                f"A few minor improvements will maximize performance."
            )
        else:
            return (
                f"Video needs optimization for {target_platform.title()}. "
                f"Follow recommendations to improve performance potential."
            )

    def get_performance_report(
        self,
        readiness_score: PerformanceReadinessScore
    ) -> str:
        """
        Generate a formatted text report for logging/display.
        """
        report = []
        report.append("=" * 60)
        report.append("PERFORMANCE READINESS REPORT")
        report.append("=" * 60)
        report.append(f"Overall Score: {readiness_score.overall_score}/100")
        report.append(f"Readiness: {readiness_score.readiness_tier.replace('_', ' ').title()}")
        report.append(f"Confidence: {readiness_score.confidence_level.title()}")
        report.append(f"\n{readiness_score.summary}")
        report.append(f"\n{readiness_score.predicted_performance}")

        report.append("\n" + "-" * 60)
        report.append("FACTOR BREAKDOWN")
        report.append("-" * 60)
        for factor in readiness_score.factors:
            report.append(f"{factor.name}: {factor.score:.1f}/100 ({factor.status})")
            if factor.recommendation:
                report.append(f"  → {factor.recommendation}")

        if readiness_score.strengths:
            report.append("\n" + "-" * 60)
            report.append("STRENGTHS")
            report.append("-" * 60)
            for strength in readiness_score.strengths:
                report.append(f"✓ {strength}")

        if readiness_score.improvements:
            report.append("\n" + "-" * 60)
            report.append("RECOMMENDED IMPROVEMENTS")
            report.append("-" * 60)
            for i, improvement in enumerate(readiness_score.improvements, 1):
                report.append(f"{i}. {improvement}")

        report.append("\n" + "-" * 60)
        report.append("PLATFORM ALIGNMENT")
        report.append("-" * 60)
        for platform, score in sorted(
            readiness_score.platform_alignment.items(),
            key=lambda x: x[1],
            reverse=True
        ):
            report.append(f"{platform.title()}: {score}/100")

        report.append("=" * 60)

        return "\n".join(report)
