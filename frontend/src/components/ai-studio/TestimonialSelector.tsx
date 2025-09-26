// components/ai-studio/TestimonialSelector.tsx - Enhanced to include artifacts
import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  FileText,
  PlayCircle,
  Star,
  ChevronDown,
  AlertCircle,
  CheckSquare,
  Scissors,
  Sparkles,
  Target,
  Volume2,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Testimonial, TestimonialArtifact } from "@/types/testimonial";
import { workspaceHub } from "@/repo/workspace_hub";
import { runInAction } from "mobx";

interface TestimonialSelectorProps {
  selectedTestimonials: string[];
  onSelectionChange: (testimonialIds: string[]) => void;
  selectedArtifacts?: string[];
  onArtifactSelectionChange?: (artifactIds: string[]) => void;
  targetService?: string;
  isCompact?: boolean;
  enableArtifactSelection?: boolean;
}

// Service compatibility for artifacts
const ARTIFACT_COMPATIBILITY = {
  enhancement: [
    "clipping",
    "story_mode_generation",
    "video_platform_optimization",
  ],
  platform_optimizer: ["clipping", "enhancement", "story_mode_generation"],
  story_mode: ["clipping"],
  narration: ["text_polishing", "translation", "content_generation"],
  translation: ["text_polishing"],
};

// Service exclusions (can't apply same service twice)
const SERVICE_EXCLUSIONS = {
  enhancement: ["enhancement"],
  platform_optimizer: [
    "video_platform_optimization",
    "text_platform_optization",
  ],
  story_mode: ["story_mode_generation"],
  text_polishing: ["text_polishing"],
  translation: ["translation"],
  narration: ["narration"],
};

const TestimonialSelector: React.FC<TestimonialSelectorProps> = observer(
  ({
    selectedTestimonials,
    onSelectionChange,
    selectedArtifacts = [],
    onArtifactSelectionChange,
    targetService,
    isCompact = false,
    enableArtifactSelection = false,
  }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [showArtifacts, setShowArtifacts] = useState(enableArtifactSelection);
    const [isExpanded, setIsExpanded] = useState(
      !isCompact || selectedTestimonials.length === 0
    );

    const testimonials = workspaceHub.testimonialManager.testimonials || [];
    const isLoading = workspaceHub.testimonialManager.loading_testimonials;

    // Load testimonials if not already loaded
    useEffect(() => {
      if (!testimonials.length) {
        workspaceHub.testimonialManager.getTestimonials();
      }
    }, [testimonials.length]);

    useEffect(() => {
      if (testimonials.length) {
        runInAction(
          () => (workspaceHub.testimonialManager.loading_testimonials = false)
        );
      }
    }, [testimonials.length]);

    // Get all artifacts from selected testimonials
    const getAvailableArtifacts = () => {
      const artifacts: (TestimonialArtifact & {
        testimonial: Testimonial;
      })[] = [];

      testimonials.forEach((testimonial) => {
        if (
          selectedTestimonials.includes(testimonial.id) &&
          testimonial.artifacts
        ) {
          testimonial.artifacts.forEach((artifact) => {
            // Check if artifact is compatible with target service
            if (
              targetService &&
              isArtifactCompatible(artifact, targetService)
            ) {
              artifacts.push({ ...artifact, testimonial });
            } else if (!targetService) {
              artifacts.push({ ...artifact, testimonial });
            }
          });
        }
      });

      return artifacts;
    };

    // Check if artifact is compatible with target service
    const isArtifactCompatible = (
      artifact: TestimonialArtifact,
      service: string
    ): boolean => {
      const compatibility =
        ARTIFACT_COMPATIBILITY[service as keyof typeof ARTIFACT_COMPATIBILITY];
      const exclusions =
        SERVICE_EXCLUSIONS[service as keyof typeof SERVICE_EXCLUSIONS];

      // Check if artifact type is compatible
      const isCompatible =
        compatibility?.includes(artifact.processing_type) || false;

      // Check if service wasn't already applied (avoid duplicates)
      const wasApplied =
        exclusions?.includes(artifact.processing_type) || false;

      return isCompatible && !wasApplied;
    };

    const availableArtifacts = getAvailableArtifacts();

    // Filter testimonials
    const filteredTestimonials = testimonials.filter((testimonial) => {
      const matchesSearch =
        !searchQuery ||
        testimonial.author_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        testimonial.author_company
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        testimonial.content?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterType === "all" ||
        (filterType === "video" && testimonial.type === "video") ||
        (filterType === "text" && testimonial.type === "text") ||
        (filterType === "high_rating" && (testimonial.rating || 0) >= 4);

      return matchesSearch && matchesFilter;
    });

    // Filter artifacts
    const filteredArtifacts = availableArtifacts.filter((artifact) => {
      const matchesSearch =
        !searchQuery ||
        artifact.testimonial.author_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        artifact.processing_type
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    const handleToggleSelect = (testimonialId: string) => {
      const updated = selectedTestimonials.includes(testimonialId)
        ? selectedTestimonials.filter((id) => id !== testimonialId)
        : [...selectedTestimonials, testimonialId];
      onSelectionChange(updated);
    };

    const handleToggleArtifact = (artifactId: string) => {
      if (!onArtifactSelectionChange) return;

      const updated = selectedArtifacts.includes(artifactId)
        ? selectedArtifacts.filter((id) => id !== artifactId)
        : [...selectedArtifacts, artifactId];
      onArtifactSelectionChange(updated);
    };

    const handleSelectAll = () => {
      if (showArtifacts) {
        onArtifactSelectionChange?.(filteredArtifacts.map((a) => a.id));
      } else {
        onSelectionChange(filteredTestimonials.map((t) => t.id));
      }
    };

    const handleSelectNone = () => {
      if (showArtifacts) {
        onArtifactSelectionChange?.([]);
      } else {
        onSelectionChange([]);
      }
    };

    const getArtifactIcon = (processingType: string) => {
      const icons = {
        clipping: Scissors,
        enhancement: Sparkles,
        story_mode_generation: Video,
        video_platform_optimization: Target,
        text_platform_optization: Target,
        narration: Volume2,
        text_polishing: FileText,
        translation: FileText,
        content_generation: FileText,
      };
      return icons[processingType as keyof typeof icons] || FileText;
    };

    const getArtifactLabel = (processingType: string) => {
      const labels = {
        clipping: "Clip",
        enhancement: "Enhanced",
        story_mode_generation: "Story",
        video_platform_optimization: "Optimized",
        text_platform_optization: "Optimized",
        narration: "Audio",
        text_polishing: "Polished",
        translation: "Translated",
        content_generation: "Generated",
      };
      return labels[processingType as keyof typeof labels] || processingType;
    };

    const selectedCount = showArtifacts
      ? selectedArtifacts.length
      : selectedTestimonials.length;
    const totalCount = showArtifacts
      ? filteredArtifacts.length
      : filteredTestimonials.length;

    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                {showArtifacts ? (
                  <Sparkles className="h-4 w-4 text-blue-600" />
                ) : (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {showArtifacts
                    ? "Select Processed Content"
                    : "Select Testimonials"}
                </h3>
                <p className="text-xs text-gray-500">
                  {showArtifacts
                    ? `Choose artifacts to process with ${targetService || "AI services"}`
                    : "Choose testimonials to process with AI services"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {enableArtifactSelection && (
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="show-artifacts"
                    className="text-xs font-medium"
                  >
                    Processed Content
                  </Label>
                  <Switch
                    id="show-artifacts"
                    checked={showArtifacts}
                    onCheckedChange={setShowArtifacts}
                  />
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedCount > 0 && (
            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                {selectedCount} {showArtifacts ? "artifacts" : "testimonials"}{" "}
                selected
                {targetService && ` for ${targetService}`}
              </p>
            </div>
          )}
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent>
            <div className="p-4">
              {/* Search and Filter Controls */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder={`Search ${showArtifacts ? "artifacts" : "testimonials"}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={totalCount === 0}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectNone}
                    disabled={selectedCount === 0}
                  >
                    Select None
                  </Button>
                </div>
              </div>

              {/* Content List */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {showArtifacts ? (
                  // Artifact Selection
                  <AnimatePresence>
                    {filteredArtifacts.map((artifact) => {
                      const ArtifactIcon = getArtifactIcon(
                        artifact.processing_type
                      );
                      return (
                        <motion.div
                          key={artifact.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`
                            p-3 rounded-lg border cursor-pointer transition-all
                            ${
                              selectedArtifacts.includes(artifact.id)
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }
                          `}
                          onClick={() => handleToggleArtifact(artifact.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                              w-5 h-5 rounded border-2 flex items-center justify-center
                              ${
                                selectedArtifacts.includes(artifact.id)
                                  ? "bg-blue-600 border-blue-600"
                                  : "border-gray-300"
                              }
                            `}
                            >
                              {selectedArtifacts.includes(artifact.id) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <ArtifactIcon className="w-4 h-4 text-purple-600" />
                              <Badge
                                variant="secondary"
                                className="text-xs bg-purple-100 text-purple-700"
                              >
                                {getArtifactLabel(artifact.processing_type)}
                              </Badge>
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {artifact.testimonial.author_name ||
                                  "Anonymous"}{" "}
                                - {getArtifactLabel(artifact.processing_type)}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {artifact.testimonial.author_company ||
                                  "Company"}{" "}
                                •{" "}
                                {new Date(
                                  artifact.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            {artifact.platform && (
                              <Badge variant="outline" className="text-xs">
                                {artifact.platform}
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  // Testimonial Selection (existing)
                  <AnimatePresence>
                    {filteredTestimonials.map((testimonial) => (
                      <motion.div
                        key={testimonial.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all
                          ${
                            selectedTestimonials.includes(testimonial.id)
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }
                        `}
                        onClick={() => handleToggleSelect(testimonial.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                            w-5 h-5 rounded border-2 flex items-center justify-center
                            ${
                              selectedTestimonials.includes(testimonial.id)
                                ? "bg-blue-600 border-blue-600"
                                : "border-gray-300"
                            }
                          `}
                          >
                            {selectedTestimonials.includes(testimonial.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {testimonial.type === "video" ? (
                              <PlayCircle className="w-4 h-4 text-blue-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-green-600" />
                            )}
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                testimonial.type === "video"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {testimonial.type}
                            </Badge>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {testimonial.author_name || "Anonymous"}
                              </p>
                              {testimonial.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-gray-600">
                                    {testimonial.rating}
                                  </span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">
                              {testimonial.content?.substring(0, 80)}...
                            </p>
                          </div>

                          {/* Show available artifacts count */}
                          {testimonial.artifacts &&
                            testimonial.artifacts.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {testimonial.artifacts.length} artifacts
                              </Badge>
                            )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {/* Empty State */}
                {totalCount === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {showArtifacts
                        ? `No compatible artifacts found${targetService ? ` for ${targetService}` : ""}`
                        : "No testimonials found"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }
);

export default TestimonialSelector;
