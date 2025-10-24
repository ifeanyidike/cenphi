// components/TestimonialDetail/HookDetection.tsx
import { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle2,
  Clock,
  Target,
  AlertCircle,
  Play,
  HelpCircle,
  Sparkle,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authStore } from "@/stores/authStore";

interface HookCandidate {
  start_time: number;
  end_time: number;
  text: string;
  hook_type: string;
  engagement_score: number;
  placement_recommendation: string;
  reasoning: string;
  keywords: string[];
}

interface HookDetectionProps {
  testimonialId: string;
  platform?: string;
  onApplyHook?: (hook: HookCandidate) => void;
}

const HOOK_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  question: { icon: HelpCircle, color: "text-blue-700", bgColor: "bg-blue-50/80 border-blue-200", label: "Question" },
  surprise: { icon: Sparkle, color: "text-purple-700", bgColor: "bg-purple-50/80 border-purple-200", label: "Surprise" },
  emotional: { icon: TrendingUp, color: "text-pink-700", bgColor: "bg-pink-50/80 border-pink-200", label: "Emotional" },
  statistic: { icon: Target, color: "text-emerald-700", bgColor: "bg-emerald-50/80 border-emerald-200", label: "Data" },
  benefit: { icon: CheckCircle2, color: "text-green-700", bgColor: "bg-green-50/80 border-green-200", label: "Benefit" },
  problem: { icon: AlertCircle, color: "text-amber-700", bgColor: "bg-amber-50/80 border-amber-200", label: "Problem" },
  general: { icon: MessageCircle, color: "text-gray-700", bgColor: "bg-gray-50/80 border-gray-200", label: "General" },
};

export default function HookDetection({
  testimonialId,
  platform = "general",
  onApplyHook
}: HookDetectionProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hooks, setHooks] = useState<HookCandidate[]>([]);
  const [bestHook, setBestHook] = useState<HookCandidate | null>(null);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);

  useEffect(() => {
    fetchHooks();
  }, [testimonialId, platform]);

  const fetchHooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await authStore.user?.getIdToken();
      const url = `${import.meta.env.VITE_API_URL}/testimonials/${testimonialId}/hooks${platform !== "general" ? `?platform=${platform}` : ""}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to detect hooks");
      }

      const data = await response.json();
      setHooks(data.hooks || []);
      setBestHook(data.best_hook);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const generateHooks = async () => {
    try {
      setGenerating(true);
      setError(null);

      const token = await authStore.user?.getIdToken();
      const url = `${import.meta.env.VITE_API_URL}/testimonials/${testimonialId}/generate-hooks${platform !== "general" ? `?platform=${platform}` : ""}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate hooks");
      }

      const data = await response.json();
      setHooks(data.hooks || []);
      setBestHook(data.best_hook);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 8) return "text-emerald-700 bg-emerald-50/80 border-emerald-200";
    if (score >= 6) return "text-blue-700 bg-blue-50/80 border-blue-200";
    if (score >= 4) return "text-amber-700 bg-amber-50/80 border-amber-200";
    return "text-gray-700 bg-gray-50/80 border-gray-200";
  };

  if (loading) {
    return (
      <Card className="p-6 border-gray-200">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-3 border-amber-200/60 bg-amber-50/30">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-900 leading-relaxed">{error}</p>
        </div>
      </Card>
    );
  }

  if (!hooks.length && !loading) {
    return (
      <Card className="p-6 border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-gray-600" />
            <h3 className="text-xs font-semibold text-gray-900">
              Hook Detection
            </h3>
          </div>
          <p className="text-[10px] text-gray-600 text-center max-w-xs">
            Identify compelling hooks in your testimonial to maximize viewer retention and engagement
          </p>
          <Button
            size="sm"
            className="h-8 text-[10px] bg-purple-600 hover:bg-purple-700"
            onClick={generateHooks}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                Detecting Hooks...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Detect Hooks
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  if (!hooks.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-3.5 h-3.5 text-gray-700" />
          <h3 className="text-[11px] font-semibold text-gray-900">Hook Detection</h3>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-gray-300 text-gray-600">
          {hooks.length} found
        </Badge>
      </div>

      {/* Best Hook - Featured */}
      {bestHook && (
        <Card className="border-blue-200 bg-white shadow-sm">
          <div className="p-3.5">
            <div className="flex items-start justify-between mb-2.5">
              <Badge className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 font-medium">
                BEST HOOK
              </Badge>
              <Badge
                variant="secondary"
                className={cn("text-[8px] px-1.5 py-0 border font-medium", getEngagementColor(bestHook.engagement_score))}
              >
                {bestHook.engagement_score.toFixed(1)}/10
              </Badge>
            </div>

            <p className="text-[10px] text-gray-900 leading-relaxed font-medium mb-2.5">
              "{bestHook.text}"
            </p>

            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {(() => {
                const config = HOOK_TYPE_CONFIG[bestHook.hook_type] || HOOK_TYPE_CONFIG.general;
                const Icon = config.icon;
                return (
                  <>
                    <Badge variant="secondary" className={cn("text-[8px] px-1.5 py-0.5 border font-medium", config.bgColor)}>
                      <Icon className="w-2.5 h-2.5 mr-1" />
                      {config.label}
                    </Badge>
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 border-gray-300 text-gray-600">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      {formatTime(bestHook.start_time)}
                    </Badge>
                  </>
                );
              })()}
            </div>

            <p className="text-[9px] text-gray-600 leading-relaxed mb-3">
              {bestHook.reasoning}
            </p>

            {onApplyHook && (
              <Button
                size="sm"
                className="w-full h-7 text-[10px] bg-blue-600 hover:bg-blue-700 shadow-sm"
                onClick={() => {
                  setSelectedHook(bestHook.text);
                  onApplyHook(bestHook);
                }}
              >
                <Play className="w-3 h-3 mr-1.5" />
                Use This Hook
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Other Hooks */}
      {hooks.length > 1 && (
        <div className="space-y-2">
          <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">
            Alternatives ({hooks.length - 1})
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {hooks
              .filter(h => bestHook ? h.text !== bestHook.text : true)
              .slice(0, 5)
              .map((hook, idx) => {
                const config = HOOK_TYPE_CONFIG[hook.hook_type] || HOOK_TYPE_CONFIG.general;
                const Icon = config.icon;
                const isSelected = selectedHook === hook.text;

                return (
                  <Card
                    key={idx}
                    className={cn(
                      "transition-all cursor-pointer border",
                      isSelected
                        ? "border-blue-300 bg-blue-50/30"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    )}
                    onClick={() => setSelectedHook(hook.text)}
                  >
                    <div className="p-2.5">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          <div className={cn("w-6 h-6 rounded flex items-center justify-center", config.bgColor)}>
                            <Icon className={cn("w-3 h-3", config.color)} />
                          </div>
                          <span className="text-[9px] font-medium text-gray-700">
                            {config.label}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn("text-[8px] px-1.5 py-0 border", getEngagementColor(hook.engagement_score))}
                        >
                          {hook.engagement_score.toFixed(1)}
                        </Badge>
                      </div>

                      <p className="text-[10px] text-gray-900 leading-relaxed mb-2">
                        "{hook.text.length > 80 ? hook.text.substring(0, 80) + "..." : hook.text}"
                      </p>

                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-gray-300 text-gray-600">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          {formatTime(hook.start_time)}
                        </Badge>

                        {onApplyHook && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[9px] hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHook(hook.text);
                              onApplyHook(hook);
                            }}
                          >
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
