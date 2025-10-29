// components/dashboard-landing/BestMomentsStoryGenerator.tsx
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Video, Star, ArrowRight, Loader2, Users, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import * as momentHelpers from "@/utils/momentHelpers";

interface BestMomentsStoryGeneratorProps {
  onError?: (error: string) => void;
}

/**
 * BestMomentsStoryGenerator - Automatic story video from best moments
 *
 * Uses momentHelpers.extractBestMomentsFromTestimonials which:
 * - Filters testimonials to video type only
 * - Filters moments by engagement_score >= 0.7
 * - Filters moments by type === 'general' OR 'highlight'
 * - Ranks testimonials by composite score (engagement * rating * sentiment)
 * - Returns top 4 testimonials with their best moments
 */
const BestMomentsStoryGenerator: React.FC<BestMomentsStoryGeneratorProps> =
  observer(({ onError }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    const testimonials = workspaceHub.testimonialManager.testimonials || [];

    // Get eligible testimonials with best moments using momentHelpers
    const testimonialsWithMoments = useMemo(() => {
      try {
        // extractBestMomentsFromTestimonials handles all filtering logic:
        // - engagement_score >= 0.7
        // - type === 'general' OR 'highlight'
        // - Composite score ranking
        const result = momentHelpers.extractBestMomentsFromTestimonials(
          testimonials,
          4, // max 4 testimonials
          undefined // no limit per testimonial
        );

        return result;
      } catch (error) {
        console.error("Error extracting best moments:", error);
        return [];
      }
    }, [testimonials]);

    // Calculate stats
    const stats = useMemo(() => {
      const totalMoments = testimonialsWithMoments.reduce(
        (sum, t) => sum + t.moments.length,
        0
      );
      const totalDuration = testimonialsWithMoments.reduce(
        (sum, t) => sum + momentHelpers.calculateTotalDuration(t.moments),
        0
      );
      const avgEngagement =
        testimonialsWithMoments.length > 0
          ? testimonialsWithMoments.reduce(
              (sum, t) =>
                sum + momentHelpers.calculateAverageEngagement(t.moments),
              0
            ) / testimonialsWithMoments.length
          : 0;

      return {
        testimonialCount: testimonialsWithMoments.length,
        momentCount: totalMoments,
        totalDuration,
        avgEngagement,
      };
    }, [testimonialsWithMoments]);

    const handleGenerateStory = async () => {
      setIsProcessing(true);

      try {
        // Navigate to Studio with best-moments context
        // The Studio will use StoryVideoConfig which loads moments via:
        // momentHelpers.extractBestMomentsFromTestimonials (same logic)
        const testimonialIds = testimonialsWithMoments
          .map((t) => t.testimonial.id)
          .join(",");
        navigate(
          `/studio/story?context=best-moments&testimonialIds=${testimonialIds}`
        );
      } catch (error) {
        console.error("Story generation failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Story generation failed";
        if (onError) {
          onError(errorMessage);
        }
      } finally {
        setIsProcessing(false);
      }
    };

    // IMPORTANT: Minimum 2 testimonials required (changed from 4)
    // This matches the max=4 parameter in extractBestMomentsFromTestimonials
    // but allows story creation with fewer testimonials if that's all that's available
    const hasEligibleTestimonials = testimonialsWithMoments.length >= 2;

    // Not enough eligible testimonials
    if (!hasEligibleTestimonials) {
      return (
        <Card className="border border-slate-200">
          <CardContent className="p-3 text-center">
            <Video className="h-5 w-5 text-slate-400 mx-auto mb-1.5" />
            <h3 className="text-xs font-medium text-slate-900 mb-1">
              Video Stories Ready Soon
            </h3>
            <p className="text-xs text-slate-600">
              Need 2+ video testimonials with quality highlights to create story
            </p>
          </CardContent>
        </Card>
      );
    }

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <Video className="h-3.5 w-3.5 text-white" />
              </div>
              <CardTitle className="text-xs font-semibold text-slate-900">
                Create Story Video
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2.5 pt-0 pb-3 px-3">
          {/* Stats Bar */}
          <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium text-slate-900">
                {stats.testimonialCount} videos
              </span>
              <span>•</span>
              <span>{stats.momentCount} moments</span>
              <span>•</span>
              <span>~{formatDuration(stats.totalDuration / 1000)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs h-6 px-2 text-slate-600 hover:text-slate-900"
            >
              {showPreview ? "Hide" : "View"}
            </Button>
          </div>

          {/* Preview List */}
          {showPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 max-h-48 overflow-y-auto"
            >
              {testimonialsWithMoments.map((item) => {
                const testimonial = item.testimonial;
                const moments = item.moments;
                // const totalDuration = momentHelpers.calculateTotalDuration(moments);
                const avgEngagement =
                  momentHelpers.calculateAverageEngagement(moments);

                return (
                  <div
                    key={testimonial.id}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-3 w-3 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {testimonial.author_name || "Anonymous"}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">
                          {testimonial.author_company || "Unknown Company"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <div className="flex items-center gap-0.5">
                        {[...Array(testimonial.rating || 0)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-2.5 w-2.5 fill-amber-400 text-amber-400"
                          />
                        ))}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1.5 bg-slate-900 text-white border-slate-900"
                      >
                        {moments.length} • {Math.round(avgEngagement * 100)}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateStory}
            disabled={isProcessing}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Preparing Studio...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-2" />
                Create Story Video
                <ArrowRight className="h-3.5 w-3.5 ml-2" />
              </>
            )}
          </Button>

          <p className="text-[10px] text-slate-500 text-center">
            Processing time: 3-5 minutes •{" "}
            {Math.round(stats.avgEngagement * 100)}% avg engagement
          </p>
        </CardContent>
      </Card>
    );
  });

export default BestMomentsStoryGenerator;
