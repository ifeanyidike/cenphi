// components/dashboard-landing/AIFeaturesDashboard.tsx
import React, { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, ChevronDown, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { workspaceHub } from "@/repo/workspace_hub";
import BestMomentsStoryGenerator from "./BestMomentsStoryGenerator";
import ContentGenerationDashboard from "./ContentGenerationDashboard";
import { useNavigate } from "react-router-dom";

const AIFeaturesDashboard: React.FC = observer(() => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const testimonials = workspaceHub.testimonialManager.testimonials || [];

  // Fetch testimonials with artifacts if needed for AI features
  React.useEffect(() => {
    const needsArtifacts = testimonials.some(
      (t) => !t.artifacts || t.artifacts.length === 0
    );
    if (needsArtifacts && testimonials.length > 0) {
      workspaceHub.testimonialManager.getTestimonials(false);
    }
  }, [testimonials.length]);

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
    const testimonialIdsParam = testimonialIds.join(",");
    navigate(
      `/studio/content?testimonialIds=${testimonialIdsParam}&contentType=${contentType}&autoGenerate=true`
    );
  };

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
  }, []);

  if (!shouldShowAIFeatures) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header Card */}
      <Card className="border border-slate-200 bg-white">
        <div className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-xs font-semibold text-slate-900">
                AI Content Generator
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-600 hover:text-slate-900 h-7 px-2 text-xs"
            >
              {isExpanded ? "Hide" : "Show"}
              <ChevronDown
                className={`h-3 w-3 ml-1 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="h-7 text-xs"
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {hasVideoTestimonials && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <BestMomentsStoryGenerator onError={handleError} />
                </motion.div>
              )}

              {hasQualityTestimonials && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                >
                  <ContentGenerationDashboard
                    onGenerateContent={handleGenerateContent}
                  />
                </motion.div>
              )}
            </div>

            {/* Unlock More Features Message */}
            {(!hasVideoTestimonials || !hasQualityTestimonials) && (
              <Card className="border border-slate-200 bg-slate-50/50 mt-3">
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1.5">
                    <Sparkles className="h-4 w-4 text-slate-400" />
                    <h4 className="text-xs font-semibold text-slate-900">
                      Unlock More Features
                    </h4>
                  </div>
                  <div className="text-xs text-slate-600">
                    {!hasVideoTestimonials && !hasQualityTestimonials ? (
                      <p>Add video testimonials to unlock story generation and content tools</p>
                    ) : !hasVideoTestimonials ? (
                      <p>Add video testimonials for story generation</p>
                    ) : (
                      <p>Collect more testimonials for advanced content generation</p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default AIFeaturesDashboard;
