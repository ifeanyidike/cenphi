import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  X,
  CheckCircle2,
  Users,
  Video,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VideoSegmentPreview from "./VideoSegmentPreview";
import { HighlightMoment, TestimonialWithMoments } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

interface MomentSelectionStepProps {
  testimonials: TestimonialWithMoments[];
  onComplete: (selectedMoments: HighlightMoment[]) => void;
  onBack?: () => void;
  onRegenerate?: () => void; // Optional callback to regenerate highlights
  title?: string;
  description?: string;
  minSelection?: number;
  maxSelection?: number;
  autoSelectAll?: boolean;
}

/**
 * MomentSelectionStep - Interactive moment selection interface
 *
 * Features:
 * - Shows moments from one or more testimonials
 * - Video segment preview for each moment
 * - Quick select/deselect controls
 * - Selection counter with min/max validation
 * - Grouped by testimonial
 * - Responsive grid layout
 */
const MomentSelectionStep: React.FC<MomentSelectionStepProps> = ({
  testimonials,
  onComplete,
  onBack,
  onRegenerate,
  title = "Select Moments",
  description = "Choose the moments you want to include",
  minSelection = 1,
  maxSelection,
  autoSelectAll = false,
}) => {
  // Flatten all moments with testimonial reference
  const allMoments = useMemo(() => {
    return testimonials.flatMap((testimonial) =>
      testimonial.moments.map((moment) => ({
        ...moment,
        testimonial_id: testimonial.id,
        testimonial_name: testimonial.author_name,
        testimonial_company: testimonial.author_company,
        media_url: testimonial.media_url,
      }))
    );
  }, [testimonials]);

  const [selectedMomentIds, setSelectedMomentIds] = useState<Set<string>>(
    new Set(autoSelectAll ? allMoments.map((m) => m.id) : [])
  );
  const [skippedMomentIds, setSkippedMomentIds] = useState<Set<string>>(
    new Set()
  );

  const handleToggleMoment = (momentId: string) => {
    setSelectedMomentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(momentId)) {
        newSet.delete(momentId);
      } else {
        // Check max selection
        if (maxSelection && newSet.size >= maxSelection) {
          return prev; // Don't add if at max
        }
        newSet.add(momentId);
      }
      return newSet;
    });
  };

  const handleToggleSkip = (momentId: string) => {
    setSkippedMomentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(momentId)) {
        newSet.delete(momentId);
      } else {
        newSet.add(momentId);
        // Remove from selected if it was selected
        setSelectedMomentIds((prevSelected) => {
          const newSelected = new Set(prevSelected);
          newSelected.delete(momentId);
          return newSelected;
        });
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (maxSelection) {
      setSelectedMomentIds(
        new Set(allMoments.slice(0, maxSelection).map((m) => m.id))
      );
    } else {
      setSelectedMomentIds(new Set(allMoments.map((m) => m.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedMomentIds(new Set());
  };

  const handleContinue = () => {
    const selectedMoments = allMoments.filter((m) =>
      selectedMomentIds.has(m.id)
    );
    onComplete(selectedMoments);
  };

  const selectedCount = selectedMomentIds.size;
  const canContinue =
    selectedCount >= minSelection &&
    (!maxSelection || selectedCount <= maxSelection);
  const totalDuration = allMoments
    .filter((m) => selectedMomentIds.has(m.id))
    .reduce((sum, m) => sum + (m.duration || m.end_time - m.start_time || 0), 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {title}
            </h2>
            <p className="text-sm text-slate-600">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Regenerate
              </Button>
            )}
            {onBack && (
              <Button
                onClick={onBack}
                variant="outline"
                size="sm"
                className="h-8"
              >
                Back
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <Card className="p-4 border-2 border-slate-200 bg-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Selected</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedCount} / {allMoments.length}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Video className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Duration</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatTime(totalDuration / 1000)}
                  </p>
                </div>
              </div>

              <div className="h-8 w-px bg-slate-200" />

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-600">Testimonials</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {testimonials.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleDeselectAll}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={selectedCount === 0}
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={selectedCount === allMoments.length}
              >
                <Check className="h-3 w-3 mr-1" />
                Select All
              </Button>
            </div>
          </div>

          {/* Validation Message */}
          {!canContinue && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <div className="flex items-start gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  {selectedCount < minSelection
                    ? `Select at least ${minSelection} moment${minSelection > 1 ? "s" : ""} to continue`
                    : `Maximum ${maxSelection} moments allowed`}
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Moments Grid - Grouped by Testimonial */}
      <div className="space-y-6 mb-6">
        {testimonials.map((testimonial) => {
          const testimonialMoments = allMoments.filter(
            (m) => m.testimonial_id === testimonial.id
          );
          const selectedInTestimonial = testimonialMoments.filter((m) =>
            selectedMomentIds.has(m.id)
          ).length;

          return (
            <div key={testimonial.id}>
              {/* Testimonial Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {testimonial.author_name || "Anonymous"}
                    </p>
                    {testimonial.author_company && (
                      <p className="text-xs text-slate-600">
                        {testimonial.author_company}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-50 text-slate-700 border-slate-200"
                >
                  {selectedInTestimonial} / {testimonialMoments.length} selected
                </Badge>
              </div>

              {/* Moments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {testimonialMoments.map((moment) => (
                    <motion.div
                      key={moment.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VideoSegmentPreview
                        moment={moment}
                        videoUrl={moment.media_url}
                        isSelected={selectedMomentIds.has(moment.id)}
                        isSkipped={skippedMomentIds.has(moment.id)}
                        onAccept={() => handleToggleMoment(moment.id)}
                        onSkip={() => handleToggleSkip(moment.id)}
                        showControls={true}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <Card className="p-4 border-2 border-slate-200 bg-white sticky bottom-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-slate-600">
              {canContinue
                ? "Ready to continue with selected moments"
                : `Select ${minSelection - selectedCount} more moment${minSelection - selectedCount > 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            onClick={handleContinue}
            disabled={!canContinue}
            className="bg-blue-600 hover:bg-blue-700 h-9 px-6"
          >
            <Check className="h-4 w-4 mr-2" />
            Continue with {selectedCount} Moment{selectedCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default observer(MomentSelectionStep);
