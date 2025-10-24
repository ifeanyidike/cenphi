// components/ai-generated-content/CompetitiveBenchmarkCard.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  Award,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface IndustryBenchmark {
  metric: string;
  industry_average: number;
  top_performers: number;
  your_score: number;
  percentile_rank: number;
  status: "leading" | "above_average" | "average" | "below_average";
}

interface ContentTrend {
  trend_name: string;
  description: string;
  adoption_rate: number;
  effectiveness_score: number;
  applies_to_your_content: boolean;
  recommendation: string;
}

interface CompetitiveBenchmarkData {
  industry: string;
  overall_competitive_score: number;
  competitive_position: "leader" | "strong" | "average" | "emerging";
  benchmarks: IndustryBenchmark[];
  content_trends: ContentTrend[];
  key_advantages: string[];
  improvement_opportunities: string[];
  industry_insights: string[];
  summary: string;
}

interface CompetitiveBenchmarkCardProps {
  data: CompetitiveBenchmarkData;
  className?: string;
}

const CompetitiveBenchmarkCard: React.FC<CompetitiveBenchmarkCardProps> = ({
  data,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Position color mapping
  const getPositionColor = (position: string) => {
    switch (position) {
      case "leader":
        return "text-green-600 bg-green-50 border-green-200";
      case "strong":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "average":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "emerging":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "leading":
        return "bg-green-100 text-green-700 border-green-300";
      case "above_average":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "average":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "below_average":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-blue-600";
    if (score >= 55) return "text-yellow-600";
    return "text-orange-600";
  };

  return (
    <Card className={`${className} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Competitive Benchmarking
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">{data.industry} Industry</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${getPositionColor(data.competitive_position)}`}
          >
            {data.competitive_position}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Competitive Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Competitive Score
            </span>
            <span
              className={`text-3xl font-bold ${getScoreColor(
                data.overall_competitive_score
              )}`}
            >
              {data.overall_competitive_score}
              <span className="text-base text-gray-400">/100</span>
            </span>
          </div>
          <Progress value={data.overall_competitive_score} className="h-2" />
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100">
          <p className="text-xs text-blue-900">{data.summary}</p>
        </div>

        {/* Key Advantages & Opportunities */}
        <div className="grid grid-cols-1 gap-3">
          {data.key_advantages.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 text-green-600" />
                Competitive Advantages
              </p>
              <div className="space-y-1">
                {data.key_advantages.map((advantage, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-gray-600 pl-5 flex items-start gap-1.5"
                  >
                    <span className="text-green-600 mt-0.5">✓</span>
                    <span>{advantage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.improvement_opportunities.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-orange-600" />
                Opportunities
              </p>
              <div className="space-y-1">
                {data.improvement_opportunities.map((opportunity, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-gray-600 pl-5 flex items-start gap-1.5"
                  >
                    <span className="text-orange-600 mt-0.5">→</span>
                    <span>{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Industry Insights */}
        {data.industry_insights.length > 0 && (
          <div className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs font-medium text-purple-900">
                  Industry Insights
                </p>
                {data.industry_insights.map((insight, idx) => (
                  <p key={idx} className="text-xs text-purple-700">
                    • {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-center gap-2 pt-2 border-t">
              <span className="text-xs font-medium text-gray-600">
                {isExpanded ? "Hide Details" : "Show Benchmarks & Trends"}
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
              {/* Benchmark Comparison */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700">
                  Industry Benchmarks
                </p>
                <div className="space-y-2">
                  {data.benchmarks.map((benchmark, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-gray-700">
                          {benchmark.metric}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getStatusColor(benchmark.status)}`}
                          >
                            {benchmark.percentile_rank}th percentile
                          </Badge>
                          <span className="text-xs font-semibold text-gray-900">
                            {benchmark.your_score.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <Progress value={benchmark.your_score} className="h-1.5 mb-1.5" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Avg: {benchmark.industry_average.toFixed(0)}</span>
                        <span>Top: {benchmark.top_performers.toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Trends */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Content Trends to Consider
                </p>
                <div className="space-y-2">
                  {data.content_trends
                    .filter((t) => t.applies_to_your_content)
                    .slice(0, 5)
                    .map((trend, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100"
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-xs font-medium text-purple-900">
                            {trend.trend_name}
                          </p>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className="text-xs bg-white border-purple-200 text-purple-700"
                            >
                              {(trend.adoption_rate * 100).toFixed(0)}% adoption
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-purple-700 mb-1.5">
                          {trend.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-purple-600">
                          <TrendingUp className="h-3 w-3" />
                          <span>
                            +{trend.effectiveness_score}% effectiveness boost
                          </span>
                        </div>
                        <p className="text-xs text-purple-700 mt-1.5 pt-1.5 border-t border-purple-200">
                          💡 {trend.recommendation}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default CompetitiveBenchmarkCard;
