# ai-service/src/services/platform_optimizer/platform_recommender.py

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class PlatformRecommendation:
    """A single platform recommendation with reasoning"""
    platform: str
    score: float  # 0.0 to 1.0
    confidence: str  # "high", "medium", "low"
    recommended_aspect_ratio: str
    reasons: List[str]
    optimization_tips: List[str]
    estimated_engagement: str  # "very_high", "high", "medium", "low"


@dataclass
class PlatformRecommendationResult:
    """Complete platform recommendation analysis"""
    primary_recommendation: PlatformRecommendation
    alternative_platforms: List[PlatformRecommendation]
    avoid_platforms: List[Dict[str, str]]  # platforms with reasons to avoid
    content_analysis: Dict[str, Any]


class PlatformRecommender:
    """
    IMPROVEMENT #2: Smart Platform Recommendation Engine

    Analyzes testimonial content and intelligently recommends the best platform(s)
    for maximum engagement. Considers:
    - Video duration and format
    - Content tone and sentiment
    - Industry/niche relevance
    - Viral potential per platform
    - Technical constraints (aspect ratio, file size)
    """

    # Platform characteristics and ideal content profiles
    PLATFORM_PROFILES = {
        "tiktok": {
            "ideal_duration": (15, 60),
            "optimal_duration": (15, 30),
            "aspect_ratios": ["9:16"],
            "max_file_size_mb": 287,
            "audience": "gen_z_millennials",
            "content_style": ["authentic", "entertaining", "quick", "trendy"],
            "ideal_tone": ["energetic", "casual", "humorous", "relatable"],
            "ideal_industries": ["beauty", "fashion", "food", "tech", "lifestyle", "education"],
            "engagement_multiplier": 1.5,
            "viral_coefficient": 1.8
        },
        "instagram_reels": {
            "ideal_duration": (15, 90),
            "optimal_duration": (30, 60),
            "aspect_ratios": ["9:16", "4:5"],
            "max_file_size_mb": 4000,
            "audience": "millennials_gen_z",
            "content_style": ["aesthetic", "polished", "lifestyle", "aspirational"],
            "ideal_tone": ["inspiring", "beautiful", "professional", "engaging"],
            "ideal_industries": ["fashion", "beauty", "travel", "fitness", "luxury", "design"],
            "engagement_multiplier": 1.3,
            "viral_coefficient": 1.4
        },
        "youtube_shorts": {
            "ideal_duration": (15, 60),
            "optimal_duration": (30, 60),
            "aspect_ratios": ["9:16"],
            "max_file_size_mb": 256,
            "audience": "broad_all_ages",
            "content_style": ["informative", "entertaining", "storytelling", "educational"],
            "ideal_tone": ["informative", "engaging", "clear", "valuable"],
            "ideal_industries": ["tech", "education", "gaming", "how-to", "reviews", "entertainment"],
            "engagement_multiplier": 1.2,
            "viral_coefficient": 1.3
        },
        "linkedin": {
            "ideal_duration": (30, 180),
            "optimal_duration": (60, 120),
            "aspect_ratios": ["16:9", "1:1", "9:16"],
            "max_file_size_mb": 5000,
            "audience": "professionals_business",
            "content_style": ["professional", "insightful", "success_story", "industry_relevant"],
            "ideal_tone": ["professional", "authoritative", "inspiring", "credible"],
            "ideal_industries": ["b2b", "saas", "consulting", "finance", "hr", "enterprise"],
            "engagement_multiplier": 1.1,
            "viral_coefficient": 0.9
        },
        "facebook": {
            "ideal_duration": (30, 240),
            "optimal_duration": (60, 120),
            "aspect_ratios": ["1:1", "16:9", "9:16"],
            "max_file_size_mb": 10000,
            "audience": "broad_older_demographics",
            "content_style": ["relatable", "community", "emotional", "shareable"],
            "ideal_tone": ["friendly", "emotional", "family_friendly", "community"],
            "ideal_industries": ["retail", "local_business", "community", "nonprofit", "family"],
            "engagement_multiplier": 1.0,
            "viral_coefficient": 1.1
        },
        "twitter": {
            "ideal_duration": (10, 45),
            "optimal_duration": (15, 30),
            "aspect_ratios": ["16:9", "1:1"],
            "max_file_size_mb": 512,
            "audience": "news_conscious_engaged",
            "content_style": ["news", "commentary", "quick_takes", "viral_moments"],
            "ideal_tone": ["witty", "timely", "concise", "impactful"],
            "ideal_industries": ["news", "tech", "politics", "sports", "entertainment"],
            "engagement_multiplier": 1.1,
            "viral_coefficient": 1.2
        }
    }

    # Content tone classifiers
    TONE_KEYWORDS = {
        "energetic": ["excited", "amazing", "incredible", "love", "awesome", "fantastic"],
        "professional": ["professional", "reliable", "quality", "service", "recommend", "trust"],
        "casual": ["like", "really", "just", "pretty", "kind of", "sort of"],
        "emotional": ["changed my life", "grateful", "appreciate", "thankful", "moved", "touched"],
        "humorous": ["funny", "hilarious", "laugh", "joke", "fun", "entertaining"],
        "inspiring": ["inspired", "motivated", "transform", "achieve", "success", "goal"],
        "authoritative": ["proven", "demonstrated", "research", "data", "results", "evidence"]
    }

    def __init__(self):
        self._viral_detector = None
        logger.info("PlatformRecommender initialized")

    @property
    def viral_detector(self):
        if self._viral_detector is None:
            from src.services.viral_analyzer.viral_detector import ViralContentDetector
            self._viral_detector = ViralContentDetector()
        return self._viral_detector

    def recommend_platforms(
        self,
        duration: float,
        transcript: str = "",
        sentiment_data: Optional[Dict[str, Any]] = None,
        industry: Optional[str] = None,
        current_aspect_ratio: Optional[str] = None,
        file_size_mb: Optional[float] = None,
        viral_analysis: Optional[Any] = None
    ) -> PlatformRecommendationResult:
        """
        Analyze testimonial and recommend best platforms.

        Args:
            duration: Video duration in seconds
            transcript: Full transcript text
            sentiment_data: Sentiment analysis results
            industry: Business industry/niche
            current_aspect_ratio: Current video aspect ratio (e.g., "16:9")
            file_size_mb: Current file size in MB
            viral_analysis: Optional pre-computed viral analysis

        Returns:
            PlatformRecommendationResult with ranked recommendations
        """
        logger.info(f"Analyzing testimonial for platform recommendations (duration={duration}s)")

        # Analyze content characteristics
        content_analysis = self._analyze_content(
            duration=duration,
            transcript=transcript,
            sentiment_data=sentiment_data,
            industry=industry
        )

        # Score each platform
        platform_scores = self._score_platforms(
            duration=duration,
            content_analysis=content_analysis,
            current_aspect_ratio=current_aspect_ratio,
            file_size_mb=file_size_mb,
            viral_analysis=viral_analysis
        )

        # Sort platforms by score
        ranked_platforms = sorted(
            platform_scores.items(),
            key=lambda x: x[1]["total_score"],
            reverse=True
        )

        # Build recommendations
        recommendations = []
        avoid_platforms = []

        for platform, score_data in ranked_platforms:
            if score_data["total_score"] >= 0.6:  # Good fit
                rec = self._build_recommendation(platform, score_data, content_analysis)
                recommendations.append(rec)
            elif score_data["total_score"] < 0.4:  # Poor fit
                avoid_platforms.append({
                    "platform": platform,
                    "reason": score_data.get("primary_issue", "Not ideal for this content")
                })

        # Ensure we have at least one recommendation
        if not recommendations and ranked_platforms:
            # Best available even if score is low
            platform, score_data = ranked_platforms[0]
            recommendations.append(
                self._build_recommendation(platform, score_data, content_analysis)
            )

        result = PlatformRecommendationResult(
            primary_recommendation=recommendations[0] if recommendations else None,
            alternative_platforms=recommendations[1:4] if len(recommendations) > 1 else [],
            avoid_platforms=avoid_platforms[:3],
            content_analysis=content_analysis
        )

        logger.info(f"Platform recommendation complete: primary={result.primary_recommendation.platform if result.primary_recommendation else 'none'}")
        return result

    def _analyze_content(
        self,
        duration: float,
        transcript: str,
        sentiment_data: Optional[Dict[str, Any]],
        industry: Optional[str]
    ) -> Dict[str, Any]:
        """Analyze content to extract key characteristics"""

        analysis = {
            "duration": duration,
            "duration_category": self._categorize_duration(duration),
            "tone": self._detect_tone(transcript),
            "sentiment": self._extract_sentiment_summary(sentiment_data),
            "industry": industry or "general",
            "transcript_length": len(transcript),
            "word_count": len(transcript.split()) if transcript else 0,
            "energy_level": self._assess_energy_level(transcript, sentiment_data),
            "professionalism": self._assess_professionalism(transcript)
        }

        return analysis

    def _categorize_duration(self, duration: float) -> str:
        """Categorize video duration"""
        if duration <= 15:
            return "micro"  # Perfect for TikTok/Reels hooks
        elif duration <= 30:
            return "short"  # Ideal for short-form platforms
        elif duration <= 60:
            return "medium"  # Good for all short-form
        elif duration <= 120:
            return "long"  # LinkedIn/YouTube Shorts upper limit
        else:
            return "extended"  # May need editing for short-form

    def _detect_tone(self, transcript: str) -> List[str]:
        """Detect dominant tones in transcript"""
        if not transcript:
            return ["neutral"]

        transcript_lower = transcript.lower()
        detected_tones = []

        for tone, keywords in self.TONE_KEYWORDS.items():
            match_count = sum(1 for keyword in keywords if keyword in transcript_lower)
            if match_count >= 2:  # At least 2 keyword matches
                detected_tones.append(tone)

        return detected_tones if detected_tones else ["neutral"]

    def _extract_sentiment_summary(self, sentiment_data: Optional[Dict[str, Any]]) -> str:
        """Extract overall sentiment"""
        if not sentiment_data:
            return "neutral"

        # Try different sentiment data formats
        if isinstance(sentiment_data, dict):
            if "overall_sentiment" in sentiment_data:
                return sentiment_data["overall_sentiment"]
            elif "sentiment" in sentiment_data:
                return sentiment_data["sentiment"]
            elif "dominant_emotion" in sentiment_data:
                return sentiment_data["dominant_emotion"]

        return "positive"  # Default for testimonials

    def _assess_energy_level(
        self,
        transcript: str,
        sentiment_data: Optional[Dict[str, Any]]
    ) -> str:
        """Assess energy level: high, medium, low"""

        high_energy_words = ["amazing", "incredible", "love", "excited", "fantastic", "wow"]
        exclamation_count = transcript.count("!") if transcript else 0

        high_energy_count = sum(
            1 for word in high_energy_words if word in transcript.lower()
        ) if transcript else 0

        if high_energy_count >= 3 or exclamation_count >= 3:
            return "high"
        elif high_energy_count >= 1 or exclamation_count >= 1:
            return "medium"
        else:
            return "low"

    def _assess_professionalism(self, transcript: str) -> str:
        """Assess professionalism level: high, medium, casual"""

        if not transcript:
            return "medium"

        professional_words = ["professional", "quality", "service", "reliable", "recommend"]
        casual_words = ["like", "really", "just", "pretty", "kind of", "you know"]

        professional_count = sum(1 for word in professional_words if word in transcript.lower())
        casual_count = sum(1 for word in casual_words if word in transcript.lower())

        if professional_count > casual_count + 2:
            return "high"
        elif casual_count > professional_count + 2:
            return "casual"
        else:
            return "medium"

    def _score_platforms(
        self,
        duration: float,
        content_analysis: Dict[str, Any],
        current_aspect_ratio: Optional[str],
        file_size_mb: Optional[float],
        viral_analysis: Optional[Any]
    ) -> Dict[str, Dict[str, Any]]:
        """Score each platform based on content fit"""

        platform_scores = {}

        for platform, profile in self.PLATFORM_PROFILES.items():
            score_breakdown = {
                "duration_score": 0.0,
                "tone_score": 0.0,
                "industry_score": 0.0,
                "technical_score": 0.0,
                "viral_score": 0.0,
                "total_score": 0.0,
                "reasons": [],
                "issues": []
            }

            # Duration score (weight: 0.25)
            ideal_min, ideal_max = profile["ideal_duration"]
            if ideal_min <= duration <= ideal_max:
                score_breakdown["duration_score"] = 1.0
                score_breakdown["reasons"].append(f"Perfect duration for {platform}")
            else:
                optimal_min, optimal_max = profile["optimal_duration"]
                if optimal_min <= duration <= optimal_max:
                    score_breakdown["duration_score"] = 0.8
                elif duration < ideal_min:
                    score_breakdown["duration_score"] = 0.6
                    score_breakdown["issues"].append(f"Shorter than ideal ({ideal_min}s)")
                elif duration > ideal_max:
                    penalty = min((duration - ideal_max) / ideal_max, 0.5)
                    score_breakdown["duration_score"] = max(0.3, 0.8 - penalty)
                    score_breakdown["issues"].append(f"Longer than ideal ({ideal_max}s)")

            # Tone score (weight: 0.2)
            content_tones = content_analysis.get("tone", [])
            ideal_tones = profile["ideal_tone"]
            tone_matches = len([t for t in content_tones if t in ideal_tones])
            score_breakdown["tone_score"] = min(tone_matches / len(ideal_tones), 1.0)
            if tone_matches > 0:
                score_breakdown["reasons"].append(f"Content tone matches {platform} audience")

            # Industry score (weight: 0.15)
            industry = content_analysis.get("industry", "general")
            if industry in profile["ideal_industries"]:
                score_breakdown["industry_score"] = 1.0
                score_breakdown["reasons"].append(f"{industry.title()} performs well on {platform}")
            else:
                score_breakdown["industry_score"] = 0.6  # Neutral

            # Technical score (weight: 0.2)
            tech_score = 1.0
            if file_size_mb and file_size_mb > profile["max_file_size_mb"]:
                tech_score *= 0.5
                score_breakdown["issues"].append(f"File size exceeds {platform} limit")

            if current_aspect_ratio and current_aspect_ratio not in profile["aspect_ratios"]:
                tech_score *= 0.8
                score_breakdown["reasons"].append(f"Requires crop to {profile['aspect_ratios'][0]}")

            score_breakdown["technical_score"] = tech_score

            # Viral score (weight: 0.2)
            if viral_analysis and hasattr(viral_analysis, "platform_recommendations"):
                platform_viral = viral_analysis.platform_recommendations.get(platform, 0.5)
                score_breakdown["viral_score"] = platform_viral
                if platform_viral > 0.7:
                    score_breakdown["reasons"].append(f"High viral potential on {platform}")
            else:
                # Use engagement multiplier as proxy
                score_breakdown["viral_score"] = min(profile["engagement_multiplier"] / 1.5, 1.0)

            # Calculate weighted total
            weights = {
                "duration_score": 0.25,
                "tone_score": 0.20,
                "industry_score": 0.15,
                "technical_score": 0.20,
                "viral_score": 0.20
            }

            total = sum(
                score_breakdown[key] * weight
                for key, weight in weights.items()
            )

            score_breakdown["total_score"] = round(total, 3)

            # Set primary issue if score is low
            if score_breakdown["total_score"] < 0.4 and score_breakdown["issues"]:
                score_breakdown["primary_issue"] = score_breakdown["issues"][0]

            platform_scores[platform] = score_breakdown

        return platform_scores

    def _build_recommendation(
        self,
        platform: str,
        score_data: Dict[str, Any],
        content_analysis: Dict[str, Any]
    ) -> PlatformRecommendation:
        """Build a PlatformRecommendation object"""

        profile = self.PLATFORM_PROFILES[platform]
        score = score_data["total_score"]

        # Determine confidence
        if score >= 0.8:
            confidence = "high"
            estimated_engagement = "very_high"
        elif score >= 0.7:
            confidence = "high"
            estimated_engagement = "high"
        elif score >= 0.6:
            confidence = "medium"
            estimated_engagement = "medium"
        else:
            confidence = "low"
            estimated_engagement = "low"

        # Get reasons
        reasons = score_data.get("reasons", [])
        if not reasons:
            reasons = [f"Compatible with {platform} format"]

        # Generate optimization tips
        optimization_tips = self._generate_optimization_tips(
            platform, profile, content_analysis, score_data
        )

        return PlatformRecommendation(
            platform=platform,
            score=score,
            confidence=confidence,
            recommended_aspect_ratio=profile["aspect_ratios"][0],
            reasons=reasons,
            optimization_tips=optimization_tips,
            estimated_engagement=estimated_engagement
        )

    def _generate_optimization_tips(
        self,
        platform: str,
        profile: Dict[str, Any],
        content_analysis: Dict[str, Any],
        score_data: Dict[str, Any]
    ) -> List[str]:
        """Generate platform-specific optimization tips"""

        tips = []

        # Duration optimization
        duration = content_analysis["duration"]
        optimal_min, optimal_max = profile["optimal_duration"]
        if duration > optimal_max:
            tips.append(f"Consider trimming to {optimal_max}s for optimal {platform} performance")
        elif duration < optimal_min:
            tips.append(f"Add intro/outro to reach {optimal_min}s minimum")

        # Aspect ratio
        if profile["aspect_ratios"][0] == "9:16":
            tips.append("Use vertical 9:16 format for mobile-first viewing")
        elif profile["aspect_ratios"][0] == "1:1":
            tips.append("Square 1:1 format maximizes feed visibility")

        # Platform-specific tips
        if platform == "tiktok":
            tips.extend([
                "Add hook in first 1-2 seconds",
                "Use trending sounds if possible",
                "Include captions for sound-off viewing"
            ])
        elif platform == "instagram_reels":
            tips.extend([
                "Maintain high visual quality and aesthetics",
                "Use smooth transitions between scenes",
                "Add brand logo watermark for recognition"
            ])
        elif platform == "youtube_shorts":
            tips.extend([
                "Clear narrative structure with beginning/middle/end",
                "Add value or entertainment in first 3 seconds",
                "Strong CTA in final frame"
            ])
        elif platform == "linkedin":
            tips.extend([
                "Professional tone and presentation",
                "Include captions for accessibility",
                "Add company logo and clear CTA",
                "Optimize for desktop and mobile viewing"
            ])

        # Energy/tone optimization
        if content_analysis.get("energy_level") == "low" and platform in ["tiktok", "instagram_reels"]:
            tips.append("Consider adding background music to increase energy")

        return tips[:5]  # Return top 5 tips
