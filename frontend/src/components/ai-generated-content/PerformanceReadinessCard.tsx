// components/ai-generated-content/PerformanceReadinessCard.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Info,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PerformanceFactor {
  name: string;
  score: number;
  weight: number;
  status: "excellent" | "good" | "fair" | "needs_improvement";
  recommendation: string;
}

interface PerformanceReadinessData {
  overall_score: number;
  confidence_level: "high" | "medium" | "low";
  readiness_tier: "publication_ready" | "minor_tweaks" | "needs_work";
  factors: PerformanceFactor[];
  strengths: string[];
  improvements: string[];
  platform_alignment: Record<string, number>;
  predicted_performance: string;
  summary: string;
}

interface PerformanceReadinessCardProps {
  data: PerformanceReadinessData;
  className?: string;
}

const PerformanceReadinessCard: React.FC<PerformanceReadinessCardProps> = ({
  data,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Color mapping for readiness tier
  const getTierColor = (tier: string) => {
    switch (tier) {
      case "publication_ready":
        return "text-green-600 bg-green-50 border-green-200";
      case "minor_tweaks":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "needs_work":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Color mapping for status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "bg-green-100 text-green-700 border-green-300";
      case "good":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "fair":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "needs_improvement":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 65) return "text-yellow-600";
    return "text-orange-600";
  };

  // Confidence badge
  const getConfidenceBadge = (level: string) => {
    const colors = {
      high: "bg-green-100 text-green-700 border-green-300",
      medium: "bg-blue-100 text-blue-700 border-blue-300",
      low: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return (
      <Badge variant="outline" className={`text-xs ${colors[level as keyof typeof colors]}`}>
        {level} confidence
      </Badge>
    );
  };

  return (
    <Card className={`${className} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Performance Readiness
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Platform optimization assessment
              </p>
            </div>
          </div>
          {getConfidenceBadge(data.confidence_level)}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Overall Score
            </span>
            <span
              className={`text-3xl font-bold ${getScoreColor(data.overall_score)}`}
            >
              {data.overall_score}
              <span className="text-base text-gray-400">/100</span>
            </span>
          </div>
          <Progress value={data.overall_score} className="h-2" />
        </div>

        {/* Readiness Tier */}
        <div
          className={`p-3 rounded-lg border ${getTierColor(data.readiness_tier)}`}
        >
          <div className="flex items-start gap-2">
            {data.readiness_tier === "publication_ready" ? (
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : data.readiness_tier === "minor_tweaks" ? (
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">
                {data.readiness_tier.replace(/_/g, " ").toUpperCase()}
              </p>
              <p className="text-xs mt-1 opacity-90">{data.summary}</p>
            </div>
          </div>
        </div>

        {/* Predicted Performance */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-purple-900">
                Performance Outlook
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {data.predicted_performance}
              </p>
            </div>
          </div>
        </div>

        {/* Strengths & Improvements */}
        {(data.strengths.length > 0 || data.improvements.length > 0) && (
          <div className="grid grid-cols-1 gap-3">
            {data.strengths.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  Strengths
                </p>
                <div className="space-y-1">
                  {data.strengths.slice(0, 3).map((strength, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-600 pl-5 flex items-start gap-1.5"
                    >
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.improvements.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-orange-600" />
                  Recommended Improvements
                </p>
                <div className="space-y-1">
                  {data.improvements.slice(0, 3).map((improvement, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-gray-600 pl-5 flex items-start gap-1.5"
                    >
                      <span className="text-orange-600 mt-0.5">•</span>
                      <span>{improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-center gap-2 pt-2 border-t">
              <span className="text-xs font-medium text-gray-600">
                {isExpanded ? "Hide Details" : "Show Details"}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              )}
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 space-y-4"
            >
              {/* Factor Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Factor Breakdown
                </p>
                <div className="space-y-2">
                  {data.factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">
                          {factor.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(factor.status)}`}
                          >
                            {factor.status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs font-semibold text-gray-900">
                            {factor.score.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <Progress value={factor.score} className="h-1.5 mb-1.5" />
                      {factor.recommendation && (
                        <p className="text-xs text-gray-600 mt-1.5">
                          💡 {factor.recommendation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Alignment */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Platform Alignment
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(data.platform_alignment).map(
                    ([platform, score]) => (
                      <div
                        key={platform}
                        className="p-2 rounded-lg bg-gray-50 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700 capitalize">
                            {platform}
                          </span>
                          <span
                            className={`text-xs font-semibold ${getScoreColor(score)}`}
                          >
                            {score}
                          </span>
                        </div>
                        <Progress value={score} className="h-1" />
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default PerformanceReadinessCard;
