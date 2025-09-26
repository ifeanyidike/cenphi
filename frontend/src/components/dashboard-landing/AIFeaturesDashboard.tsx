// components/dashboard-landing/AIFeaturesDashboard.tsx
import React, { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { workspaceHub } from "@/repo/workspace_hub";
import { aiStudioManager } from "@/repo/managers/ai_studio_manager";
import BestMomentsStoryGenerator from "./BestMomentsStoryGenerator";
import ContentGenerationDashboard from "./ContentGenerationDashboard";
import { ServiceType } from "@/types/ai-service";
import { AI_SERVICES } from "@/components/ai-studio/definitions";
import { useNavigate } from "react-router-dom";

const AIFeaturesDashboard: React.FC = observer(() => {
  const [processingContent, setProcessingContent] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const testimonials = workspaceHub.testimonialManager.testimonials || [];

  // Check for video testimonials with quality highlights
  const hasVideoTestimonials = testimonials.some(
    (t) =>
      (t.sentiment_score >= 0.7 ||
        (t.sentiment_score > 0.5 && (t.rating || 0) >= 4)) &&
      t.type === "video" &&
      t.artifacts?.some((a) => a.processing_type === "highlight_extraction")
  );

  const hasQualityTestimonials = testimonials.some(
    (t) =>
      t.sentiment_score >= 0.6 &&
      (t.rating || 0) >= 3 &&
      t.content &&
      t.content.length > 50
  );

  const shouldShowAIFeatures = hasVideoTestimonials || hasQualityTestimonials;

  const handleGenerateContent = async (
    contentType: string,
    testimonialIds: string[]
  ) => {
    setProcessingContent(true);
    setError(null);

    try {
      // Temporarily set the selected testimonials in aiStudioManager
      // This is needed so determineSourceInfo can access them
      const previousSelection = aiStudioManager.selectedTestimonials;
      aiStudioManager.handleTestimonialsChanged(testimonialIds);

      // Find the content_generation service definition
      const service = AI_SERVICES.find((s) => s.id === "content_generation");
      if (!service) {
        throw new Error("Content generation service not found");
      }

      const jobId = await aiStudioManager.startJob(
        "content_generation" as ServiceType,
        [], // selectedArtifacts (empty for content generation)
        undefined, // artifactData (undefined for content generation)
        {
          content_type: contentType,
          prompt: null,
        },
        service // Pass the service definition
      );
      console.log("jobid", jobId);

      // Restore previous selection
      aiStudioManager.handleTestimonialsChanged(previousSelection);

      console.log("Content generation job started:", jobId);

      // Navigate to AI Studio to show the streaming result
      navigate("/studio");
    } catch (error) {
      console.error("Content generation failed:", error);
      setError(
        error instanceof Error ? error.message : "Content generation failed"
      );
    } finally {
      setProcessingContent(false);
    }
  };

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  if (!shouldShowAIFeatures) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="border border-gray-200 bg-gray-50/20">
        <CardHeader className="py-2.5 px-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded bg-gray-900 flex items-center justify-center">
                <Brain className="h-3 w-3 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm text-gray-900">
                  AI Content Generator
                </CardTitle>
                <p className="text-xs text-gray-600 mt-0">
                  Create professional marketing materials instantly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-gray-200">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-medium text-gray-900">
                  {testimonials.length}
                </span>
                <span className="text-xs text-gray-600">ready</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 w-7 p-0"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="ml-2 h-6 text-xs"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <motion.div
        animate={{
          height: isExpanded ? "auto" : 0,
          opacity: isExpanded ? 1 : 0,
          marginTop: isExpanded ? 16 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          {hasVideoTestimonials && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <BestMomentsStoryGenerator onError={handleError} />
            </motion.div>
          )}

          {hasQualityTestimonials && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ContentGenerationDashboard
                onGenerateContent={handleGenerateContent}
                isProcessing={processingContent}
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {(!hasVideoTestimonials || !hasQualityTestimonials) && (
        <motion.div
          animate={{
            height: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0,
            marginTop: isExpanded ? 16 : 0,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <Card className="border border-gray-200 bg-gray-50/20">
            <CardContent className="p-3 text-center">
              <Sparkles className="h-5 w-5 text-gray-400 mx-auto mb-2" />
              <h3 className="text-xs font-medium text-gray-900 mb-1">
                Unlock More AI Features
              </h3>
              <div className="space-y-0.5 text-xs text-gray-600">
                {!hasVideoTestimonials && (
                  <p>
                    • Add video testimonials with positive sentiment and quality
                    highlights for story generation
                  </p>
                )}
                {!hasQualityTestimonials && (
                  <p>
                    • Collect more quality testimonials for advanced content
                    generation
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

    </motion.div>
  );
});

export default AIFeaturesDashboard;
