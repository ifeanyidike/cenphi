// components/TestimonialDetail/PlatformRecommendations.tsx
import { useState, useEffect } from "react";
import {
  Target,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authStore } from "@/stores/authStore";

interface Platform {
  platform: string;
  score: number;
  confidence: string;
  recommended_aspect_ratio: string;
  reasons: string[];
  optimization_tips: string[];
  estimated_engagement: string;
}

interface PlatformRecommendationsProps {
  testimonialId: string;
  onOptimize?: (platform: string) => void;
}

const PLATFORM_CONFIG: Record<
  string,
  {
    name: string;
    color: string;
  }
> = {
  tiktok: {
    name: "TikTok",
    color: "#000000",
  },
  instagram_reels: {
    name: "Instagram Reels",
    color: "#E1306C",
  },
  youtube_shorts: {
    name: "YouTube Shorts",
    color: "#FF0000",
  },
  linkedin: {
    name: "LinkedIn",
    color: "#0A66C2",
  },
  facebook: {
    name: "Facebook",
    color: "#1877F2",
  },
  twitter: {
    name: "Twitter/X",
    color: "#000000",
  },
};

const ENGAGEMENT_LEVELS = {
  very_high: { label: "Very High", color: "text-emerald-700 bg-emerald-50" },
  high: { label: "High", color: "text-green-700 bg-green-50" },
  medium: { label: "Medium", color: "text-amber-700 bg-amber-50" },
  low: { label: "Low", color: "text-slate-600 bg-slate-50" },
};

export default function PlatformRecommendations({
  testimonialId,
  onOptimize,
}: PlatformRecommendationsProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primary, setPrimary] = useState<Platform | null>(null);
  const [alternatives, setAlternatives] = useState<Platform[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, [testimonialId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await authStore.user?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/testimonials/${testimonialId}/platform-recommendations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch platform recommendations");
      }

      const data = await response.json();

      setPrimary(data.primary_recommendation);
      setAlternatives(data.alternative_platforms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setGenerating(true);
      setError(null);

      const token = await authStore.user?.getIdToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/testimonials/${testimonialId}/generate-platform-recommendations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate platform recommendations");
      }

      const data = await response.json();

      setPrimary(data.primary_recommendation);
      setAlternatives(data.alternative_platforms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const getPlatformName = (key: string) => {
    return (
      PLATFORM_CONFIG[key]?.name ||
      key
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    );
  };

  if (loading) {
    return (
      <Card className="p-8 border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-xs text-slate-500">Analyzing best platforms...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-5 border border-red-100 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-red-900 mb-1">
              Unable to Load Recommendations
            </h4>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!primary && !loading) {
    return (
      <Card className="p-8 border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-slate-600" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-base font-semibold text-slate-900">
              Discover Your Best Platforms
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Get AI-powered insights on which social platforms will maximize
              your reach and engagement for this testimonial
            </p>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={generating}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 h-10 text-xs font-medium"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  if (!primary) {
    return null;
  }

  const scorePercentage = Math.round(primary.score * 100);
  const engagementLevel =
    ENGAGEMENT_LEVELS[
      primary.estimated_engagement as keyof typeof ENGAGEMENT_LEVELS
    ] || ENGAGEMENT_LEVELS.medium;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Platform Recommendations
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            AI-powered distribution insights
          </p>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] px-2 py-1 border-slate-300 text-slate-600"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Primary Platform Card */}
      <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          {/* Top Section */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-bold text-slate-900">
                  {getPlatformName(primary.platform)}
                </h4>
                <Badge className="bg-slate-900 text-white text-[10px] px-2 py-0.5 font-medium">
                  Best Match
                </Badge>
              </div>
              <p className="text-xs text-slate-600">
                {primary.recommended_aspect_ratio} • Optimized for maximum reach
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  {scorePercentage}
                </span>
                <span className="text-sm font-medium text-slate-500">%</span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                Match Score
              </span>
            </div>
          </div>

          {/* Engagement Badge */}
          <div className="mb-6">
            <Badge
              className={cn(
                "text-xs px-3 py-1.5 font-medium",
                engagementLevel.color
              )}
            >
              {engagementLevel.label} Engagement Potential
            </Badge>
          </div>

          {/* Key Insights */}
          <div className="space-y-3 mb-6">
            <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Why This Platform
            </h5>
            <div className="space-y-2">
              {primary.reasons.slice(0, expanded ? undefined : 2).map((reason, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100"
                >
                  <CheckCircle className="w-4 h-4 text-slate-700 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {reason}
                  </p>
                </div>
              ))}
            </div>

            {primary.reasons.length > 2 && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 mt-2"
              >
                Show {primary.reasons.length - 2} more reasons
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Optimization Tips */}
          {expanded && primary.optimization_tips.length > 0 && (
            <div className="pt-6 border-t border-slate-100 mb-6">
              <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">
                Optimization Tips
              </h5>
              <ul className="space-y-2">
                {primary.optimization_tips.map((tip, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs text-slate-600"
                  >
                    <span className="text-slate-400 mt-0.5">•</span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Button */}
          {onOptimize && (
            <Button
              onClick={() => onOptimize(primary.platform)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 text-sm font-medium"
            >
              Optimize for {getPlatformName(primary.platform)}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>

      {/* Alternative Platforms */}
      {alternatives.length > 0 && (
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Alternative Platforms
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {alternatives.slice(0, 4).map((alt) => {
              const altScore = Math.round(alt.score * 100);
              const altEngagement =
                ENGAGEMENT_LEVELS[
                  alt.estimated_engagement as keyof typeof ENGAGEMENT_LEVELS
                ] || ENGAGEMENT_LEVELS.medium;

              return (
                <Card
                  key={alt.platform}
                  className="border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => onOptimize && onOptimize(alt.platform)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h6 className="text-sm font-semibold text-slate-900 truncate mb-1">
                          {getPlatformName(alt.platform)}
                        </h6>
                        <p className="text-[10px] text-slate-500">
                          {alt.recommended_aspect_ratio}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xl font-bold text-slate-900">
                          {altScore}
                          <span className="text-xs text-slate-500">%</span>
                        </span>
                      </div>
                    </div>

                    <Badge
                      className={cn(
                        "text-[10px] px-2 py-0.5 font-medium mb-3",
                        altEngagement.color
                      )}
                    >
                      {altEngagement.label}
                    </Badge>

                    {alt.reasons.length > 0 && (
                      <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2">
                        {alt.reasons[0]}
                      </p>
                    )}

                    <div className="mt-3 flex items-center text-slate-400 group-hover:text-slate-600 transition-colors">
                      <span className="text-[10px] font-medium">
                        View details
                      </span>
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          Show less
        </button>
      )}
    </div>
  );
}
