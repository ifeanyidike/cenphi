// components/ai-studio/ArtifactSelector.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Scissors,
  Sparkles,
  Target,
  Check,
  PlayCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Volume2,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "@/repo/workspace_hub";

interface ArtifactSelectorProps {
  selectedArtifacts: string[];
  onSelectionChange: (selected: string[]) => void;
  serviceType?: string;
  isCompact?: boolean;
  preloadedArtifact?: any;
}

const ArtifactSelector: React.FC<ArtifactSelectorProps> = observer(
  ({
    selectedArtifacts,
    onSelectionChange,
    serviceType,
    isCompact = false,
    preloadedArtifact,
  }) => {
    const [isExpanded, setIsExpanded] = useState(!isCompact);

    // Get available artifacts that can be processed with the current service
    const getAvailableArtifacts = () => {
      // If we have a preloaded artifact, use it
      if (preloadedArtifact) {
        return [
          {
            ...preloadedArtifact.data,
            testimonialTitle: "Selected Content",
            testimonialId: preloadedArtifact.parentTestimonialId,
          },
        ];
      }

      const allTestimonials =
        workspaceHub.testimonialManager.testimonials || [];
      const artifacts: any[] = [];

      allTestimonials.forEach((testimonial) => {
        testimonial.artifacts?.forEach((artifact) => {
          // Check if artifact can be processed with current service
          if (canProcessArtifact(artifact, serviceType)) {
            artifacts.push({
              ...artifact,
              testimonialTitle: testimonial.author_name || "Anonymous",
              testimonialId: testimonial.id,
            });
          }
        });
      });

      return artifacts;
    };

    const canProcessArtifact = (artifact: any, service?: string): boolean => {
      if (!service) return true;

      const appliedServices =
        artifact.processing_metadata?.applied_services || [];

      // Clipping can only be done on original testimonials, not artifacts
      if (service === "clipping") return false;

      // Narration can be applied to text content (polished text, generated content)
      if (service === "narration") {
        return (
          (artifact.processing_type === "text_polishing" ||
            artifact.processing_type === "content_generation") &&
          artifact.text_content &&
          !appliedServices.includes("narration")
        );
      }

      // Enhancement and platform optimization can be done if not already applied
      if (service === "enhancement") {
        return (
          !appliedServices.includes("enhancement") &&
          (artifact.processing_type === "clipping" ||
            artifact.processing_type === "story_mode_generation" ||
            artifact.processing_type === "video_platform_optimization")
        );
      }

      if (service === "platform_optimizer") {
        return (
          !appliedServices.includes("platform_optimizer") &&
          (artifact.processing_type === "clipping" ||
            artifact.processing_type === "enhancement" ||
            artifact.processing_type === "story_mode_generation")
        );
      }

      return true;
    };

    const getServiceIcon = (processingType: string) => {
      switch (processingType) {
        case "clipping":
          return Scissors;
        case "enhancement":
          return Sparkles;
        case "video_platform_optimization":
          return Target;
        case "story_mode_generation":
          return Video;
        case "text_polishing":
          return FileText;
        case "content_generation":
          return FileText;
        case "narration":
          return Volume2;
        default:
          return FileText;
      }
    };

    const availableArtifacts = getAvailableArtifacts();

    const toggleSelection = (artifactId: string) => {
      const newSelected = selectedArtifacts.includes(artifactId)
        ? selectedArtifacts.filter((id) => id !== artifactId)
        : [...selectedArtifacts, artifactId];
      onSelectionChange(newSelected);
    };

    if (availableArtifacts.length === 0) {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Content Available
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              No clips or videos are available for processing with{" "}
              {serviceType || "this service"}.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Available Content
              </h3>
              <p className="text-sm text-gray-600">
                {preloadedArtifact
                  ? `Selected content to process${serviceType ? ` with ${serviceType}` : ""}`
                  : `Select clips or videos to process${serviceType ? ` with ${serviceType}` : ""}`}
              </p>
            </div>
            {!preloadedArtifact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            )}
          </div>

          <AnimatePresence>
            {(isExpanded || preloadedArtifact) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3"
              >
                {availableArtifacts.map((artifact) => {
                  const Icon = getServiceIcon(artifact.processing_type);
                  const isSelected = selectedArtifacts.includes(artifact.id);

                  return (
                    <Card
                      key={artifact.id}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "ring-2 ring-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => toggleSelection(artifact.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isSelected ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <Icon className="w-4 h-4 text-gray-600" />
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {artifact.processing_type?.replace("_", " ")}
                              </Badge>
                              <span className="text-sm font-medium text-gray-900">
                                from {artifact.testimonialTitle}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Created{" "}
                              {new Date(
                                artifact.created_at
                              ).toLocaleDateString()}
                              {artifact.text_content &&
                                ` • ${Math.min(artifact.text_content.length, 80)} chars`}
                            </p>
                          </div>

                          {(artifact.asset_url || artifact.text_content) && (
                            <div className="flex items-center">
                              {artifact.asset_url && (
                                <PlayCircle className="w-5 h-5 text-blue-600" />
                              )}
                              {artifact.text_content && (
                                <FileText className="w-5 h-5 text-green-600" />
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }
);

export default ArtifactSelector;
