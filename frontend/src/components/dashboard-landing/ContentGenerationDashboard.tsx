// components/dashboard-landing/ContentGenerationDashboard.tsx
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Target,
  Award,
  Star,
  ArrowRight,
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
    id: "email",
    name: "Email Campaign",
    description: "Ready-to-send customer stories",
    estimatedTime: "30s",
    icon: Target,
    category: "marketing",
    value: "high",
  },
  {
    id: "blog",
    name: "Blog Post",
    description: "Customer success article",
    estimatedTime: "60s",
    icon: FileText,
    category: "content",
    value: "medium",
  },
  {
    id: "sales_deck",
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
}

const ContentGenerationDashboard: React.FC<ContentGenerationDashboardProps> =
  observer(({ onGenerateContent }) => {
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
        <Card className="border border-slate-200">
          <CardContent className="p-3 text-center">
            <FileText className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
            <h3 className="text-xs font-medium text-slate-900 mb-1">
              Content Creation Ready Soon
            </h3>
            <p className="text-xs text-slate-600">
              Need quality testimonials for content generation
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <CardTitle className="text-xs font-semibold text-slate-900">
                Marketing Content
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 pt-0 pb-3 px-3">
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-slate-900">
                {selectedTestimonials.length} selected
              </span>
              <span>•</span>
              <span>{(averageScore * 100).toFixed(0)}% avg quality</span>
              <span>•</span>
              <span>
                {selectedTestimonials.filter((t) => t.hasMetrics).length} with
                metrics
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTestimonialPreview(!showTestimonialPreview)}
              className="text-xs h-6 px-2 text-slate-600 hover:text-slate-900"
            >
              {showTestimonialPreview ? "Hide" : "View"}
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
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                          <Users className="h-3 w-3 text-slate-600" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">
                            {testimonial.author_name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {testimonial.author_company}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(testimonial.rating || 0)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                        {hasMetrics && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 bg-slate-100 text-slate-700 border-slate-300"
                          >
                            Metrics
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-[10px] py-0 px-1.5 bg-slate-900 text-white border-slate-900"
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
              <h4 className="text-xs font-medium text-slate-900">
                Content Type
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContentTypes(!showContentTypes)}
                className="text-xs h-6 px-2 text-slate-600 hover:text-slate-900"
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
                      className={`p-2.5 rounded-lg border text-left transition-all duration-200 ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon
                          className={`h-3 w-3 ${isSelected ? "text-white" : "text-slate-600"}`}
                        />
                        <span
                          className={`text-xs font-medium ${isSelected ? "text-white" : "text-slate-900"}`}
                        >
                          {type.name}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}
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
            disabled={!selectedContentType}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:bg-slate-300 text-xs h-8 shadow-sm"
          >
            <FileText className="h-3.5 w-3.5 mr-2" />
            Generate {selectedContentTypeInfo?.name || "Content"}
            <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </Button>

          <p className="text-[10px] text-slate-500 text-center">
            Professional marketing materials in seconds
          </p>
        </CardContent>
      </Card>
    );
  });

export default ContentGenerationDashboard;
