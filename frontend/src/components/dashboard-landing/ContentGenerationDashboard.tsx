// components/dashboard-landing/ContentGenerationDashboard.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Target,
  Award,
  TrendingUp,
  Star,
  Brain,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workspaceHub } from "@/repo/workspace_hub";
import { Testimonial } from "@/types/testimonial";
import { observer } from "mobx-react-lite";

const CONTENT_TYPES = [
  {
    id: "case_study",
    name: "Case Study",
    description: "Professional success story with metrics",
    estimatedTime: "45s",
    icon: FileText,
    category: "sales",
    value: "high",
  },
  {
    id: "email_campaign",
    name: "Email Campaign",
    description: "Ready-to-send customer stories",
    estimatedTime: "30s",
    icon: Target,
    category: "marketing",
    value: "high",
  },
  {
    id: "blog_post",
    name: "Blog Post",
    description: "Customer success article",
    estimatedTime: "60s",
    icon: FileText,
    category: "content",
    value: "medium",
  },
  {
    id: "sales_deck_slide",
    name: "Sales Deck",
    description: "Presentation with social proof",
    estimatedTime: "50s",
    icon: Award,
    category: "sales",
    value: "high",
  },
];

interface SelectedTestimonial {
  testimonial: Testimonial;
  score: number;
  hasMetrics: boolean;
  wordCount: number;
}

interface ContentGenerationDashboardProps {
  onGenerateContent: (contentType: string, testimonialIds: string[]) => void;
  isProcessing?: boolean;
}

const ContentGenerationDashboard: React.FC<ContentGenerationDashboardProps> =
  observer(({ onGenerateContent, isProcessing = false }) => {
    const [selectedContentType, setSelectedContentType] = useState<string>("");
    const [showTestimonialPreview, setShowTestimonialPreview] = useState(false);
    const [showContentTypes, setShowContentTypes] = useState(false);

    const testimonials = workspaceHub.testimonialManager.testimonials || [];

    const selectedTestimonials = useMemo((): SelectedTestimonial[] => {
      // Updated filter criteria to match BestMomentsStoryGenerator
      const eligibleTestimonials = testimonials.filter(
        (t) =>
          (t.sentiment_score >= 0.7 ||
            (t.sentiment_score > 0.5 && (t.rating || 0) >= 4)) &&
          t.content &&
          t.content.length > 50
      );

      const scored = eligibleTestimonials.map((testimonial) => {
        const baseScore =
          testimonial.sentiment_score * 0.6 +
          ((testimonial.rating || 0) / 5) * 0.4;
        const contentWords = testimonial.content?.split(" ").length || 0;
        const hasMetrics = /\d+%|\$|ROI|revenue|increase|improve|result/i.test(
          testimonial.content || ""
        );

        return {
          testimonial,
          score: baseScore,
          hasMetrics,
          wordCount: contentWords,
        };
      });

      return scored
        .sort((a, b) => {
          if (Math.abs(a.score - b.score) < 0.03) {
            return (b.hasMetrics ? 1 : 0) - (a.hasMetrics ? 1 : 0);
          }
          return b.score - a.score;
        })
        .slice(0, 8);
    }, [testimonials]);

    const hasEligibleTestimonials = selectedTestimonials.length >= 2;
    const averageScore =
      selectedTestimonials.length > 0
        ? selectedTestimonials.reduce((sum, t) => sum + t.score, 0) /
          selectedTestimonials.length
        : 0;

    const highValueContentTypes = CONTENT_TYPES.filter(
      (type) => type.value === "high"
    );

    const handleGenerateContent = () => {
      if (!selectedContentType) return;
      const testimonialIds = selectedTestimonials.map((t) => t.testimonial.id);
      onGenerateContent(selectedContentType, testimonialIds);
    };

    const selectedContentTypeInfo = CONTENT_TYPES.find(
      (type) => type.id === selectedContentType
    );

    if (!hasEligibleTestimonials) {
      return (
        <Card className="border border-gray-200">
          <CardContent className="p-3 text-center">
            <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Content Creation Ready Soon
            </h3>
            <p className="text-xs text-gray-600">
              Need testimonials with high sentiment (≥0.7) or good ratings (≥4
              stars) for content generation
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-purple-200 bg-purple-50/20">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-purple-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-900">
                  Marketing Content
                </CardTitle>
                <p className="text-xs text-gray-600 mt-0.5">
                  Generate sales materials from your testimonials
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 border-purple-200 text-xs"
            >
              <Brain className="h-3 w-3 mr-1" />
              AI
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span className="font-medium text-gray-900">
                  {selectedTestimonials.length} selected
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <TrendingUp className="h-3 w-3" />
                <span>{(averageScore * 100).toFixed(0)}% avg</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <FileText className="h-3 w-3" />
                <span>
                  {selectedTestimonials.filter((t) => t.hasMetrics).length} with
                  metrics
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTestimonialPreview(!showTestimonialPreview)}
              className="text-xs h-6 px-2"
            >
              {showTestimonialPreview ? "Hide" : "Preview"}
            </Button>
          </div>

          <AnimatePresence>
            {showTestimonialPreview && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-1 max-h-32 overflow-y-auto"
              >
                {selectedTestimonials
                  .slice(0, 5)
                  .map(({ testimonial, score, hasMetrics }) => (
                    <div
                      key={testimonial.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <Users className="h-3 w-3 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-900">
                            {testimonial.author_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {testimonial.author_company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(testimonial.rating || 0)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                        {hasMetrics && (
                          <Badge
                            variant="outline"
                            className="text-xs py-0 px-1 bg-emerald-50 text-emerald-600 border-emerald-200"
                          >
                            Metrics
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-xs py-0 px-1 bg-purple-50 text-purple-700 border-purple-200"
                        >
                          {(score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-900">
                Content Type
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContentTypes(!showContentTypes)}
                className="text-xs h-6 px-2"
              >
                {showContentTypes ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    More
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(showContentTypes ? CONTENT_TYPES : highValueContentTypes).map(
                (type) => {
                  const Icon = type.icon;
                  const isSelected = selectedContentType === type.id;

                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedContentType(type.id)}
                      className={`p-2 rounded border text-left transition-all duration-200 ${
                        isSelected
                          ? "border-purple-300 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Icon
                          className={`h-3 w-3 ${isSelected ? "text-purple-600" : "text-gray-600"}`}
                        />
                        <span
                          className={`text-xs font-medium ${isSelected ? "text-purple-900" : "text-gray-900"}`}
                        >
                          {type.name}
                        </span>
                      </div>
                      <p
                        className={`text-xs ${isSelected ? "text-purple-700" : "text-gray-600"}`}
                      >
                        {type.description}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <Button
            onClick={handleGenerateContent}
            disabled={!selectedContentType || isProcessing}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 text-sm h-9"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate {selectedContentTypeInfo?.name || "Content"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Ready-to-use marketing materials in seconds
          </p>
        </CardContent>
      </Card>
    );
  });

export default ContentGenerationDashboard;
