// components/dashboard-landing/BestMomentsStoryGenerator.tsx
import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Sparkles,
  TrendingUp,
  Star,
  Brain,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Users,
  Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { workspaceHub } from "@/repo/workspace_hub";
import { aiStudioManager } from "@/repo/managers/ai_studio_manager";
import { ServiceType } from "@/types/ai-service";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
// import { useNavigate } from "react-router-dom";

interface BestMomentsStoryGeneratorProps {
  onError?: (error: string) => void;
}

const BestMomentsStoryGenerator: React.FC<BestMomentsStoryGeneratorProps> =
  observer(({ onError }) => {
    const [showPreview, setShowPreview] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    // const navigate = useNavigate();

    const testimonials = workspaceHub.testimonialManager.testimonials || [];

    // Get eligible testimonials for story generation
    const eligibleTestimonials = useMemo(() => {
      return testimonials.filter(
        (t) =>
          // Video testimonials only
          t.type === "video" &&
          // Sentiment criteria: >= 0.7 OR (> 0.5 AND rating >= 4)
          (t.sentiment_score >= 0.7 ||
            (t.sentiment_score > 0.5 && (t.rating || 0) >= 4)) &&
          // Has highlight extraction artifacts
          t.artifacts?.some((a) => a.processing_type === "highlight_extraction")
      );
    }, [testimonials]);

    // Prepare transcript segments for story generation
    const prepareTestimonialSegments = useCallback(() => {
      const testimonialSegments: any[] = [];

      eligibleTestimonials.forEach((testimonial) => {
        const highlightArtifacts =
          testimonial.artifacts?.filter(
            (a) => a.processing_type === "highlight_extraction"
          ) || [];

        // Get highlights from one key only: "highlights" first, then "general"
        let selectedHighlights: any[] = [];

        for (const artifact of highlightArtifacts) {
          // Try "highlights" first
          if (
            artifact.data?.highlights &&
            Array.isArray(artifact.data.highlights)
          ) {
            selectedHighlights = artifact.data.highlights.filter(
              (h: any) => h.engagement_score >= 0.7 || !h.engagement_score
            );
            if (selectedHighlights.length > 0) break;
          }

          // Then try "general"
          if (artifact.data?.general && Array.isArray(artifact.data.general)) {
            selectedHighlights = artifact.data.general.filter(
              (h: any) => h.engagement_score >= 0.7
            );
            if (selectedHighlights.length > 0) break;
          }
        }

        // Only include testimonials with quality highlights
        if (selectedHighlights.length > 0) {
          const highlightMoments = selectedHighlights.map((highlight) => ({
            id: highlight.id || testimonial.id,
            start_time: highlight.start_time || 0,
            end_time: highlight.end_time || 30,
            text: highlight.text || "",
            theme: highlight.theme || "general",
            importance_score: highlight.importance_score || 0.5,
            engagement_score: highlight.engagement_score || 0.8,
            highlight_type: "general",
            keywords: highlight.keywords || [],
            enhance_clip: true,
            include_logo: true,
            quality: "high",
            add_background_music: true,
            remove_noise: true,
          }));

          testimonialSegments.push({
            testimonial_id: testimonial.id,
            media_url: testimonial.media_url || "",
            highlights: highlightMoments,
          });
        }
      });

      return testimonialSegments;
    }, [eligibleTestimonials]);

    const handleGenerateStory = async () => {
      setIsProcessing(true);

      try {
        const testimonialSegments = prepareTestimonialSegments();

        const jobId = await aiStudioManager.jobsManager.startJob(
          "story_mode" as ServiceType,
          { type: "best_story_moments" } as any,
          {
            testimonial_segments: testimonialSegments,
            add_background_music: true,
            background_music: "corporate",
            music_volume: "low",
            include_logo: true,
            brand_context: workspaceHub.workspace?.brand_context,
            auto_order: true,
          } as any,
          { shouldQueue: true } as any
        );

        runInAction(() => {
          console.log("Story generation job started:", jobId);
          const ourJob = aiStudioManager.jobs.find((j) => j.id === jobId);
          console.log("Our job found in array:", ourJob);
        });
        // navigate("/studio/stories");
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

    // Check if we have enough eligible testimonials with quality highlights
    const testimonialsWithHighlights = useMemo(() => {
      return eligibleTestimonials.filter((testimonial) => {
        const highlightArtifacts =
          testimonial.artifacts?.filter(
            (a) => a.processing_type === "highlight_extraction"
          ) || [];

        // Check if any artifact has quality highlights
        return highlightArtifacts.some((artifact) => {
          const highlightsData = artifact.data?.highlights || [];
          const generalData = artifact.data?.general || [];

          return (
            highlightsData.some(
              (h: any) => h.engagement_score >= 0.7 || !h.engagement_score
            ) || generalData.some((h: any) => h.engagement_score >= 0.7)
          );
        });
      });
    }, [eligibleTestimonials]);

    const hasEligibleTestimonials = testimonialsWithHighlights.length >= 2;

    if (!hasEligibleTestimonials) {
      return (
        <Card className="border border-gray-200">
          <CardContent className="p-4 text-center">
            <Video className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Video Stories Ready Soon
            </h3>
            <p className="text-xs text-gray-600">
              Need 2+ video testimonials with quality highlights (engagement
              score ≥ 0.7) to create story
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border border-blue-200 bg-blue-50/20">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-900">
                  Create Story Video
                </CardTitle>
                <p className="text-xs text-gray-600 mt-0.5">
                  Automatically combine your best customer moments
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 border-blue-200 text-xs"
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
                  {testimonialsWithHighlights.length} selected
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <TrendingUp className="h-3 w-3" />
                <span>Ready for story</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs h-6 px-2"
            >
              {showPreview ? "Hide" : "Preview"}
            </Button>
          </div>

          {showPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-1 max-h-32 overflow-y-auto"
            >
              {testimonialsWithHighlights.slice(0, 5).map((testimonial) => (
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
                    <Badge
                      variant="outline"
                      className="text-xs py-0 px-1 bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Video
                    </Badge>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          <Button
            onClick={handleGenerateStory}
            disabled={isProcessing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-9"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Create Video Story
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Professional video ready in ~3-5 minutes
          </p>
        </CardContent>
      </Card>
    );
  });

export default BestMomentsStoryGenerator;
