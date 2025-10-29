import React, { useState, useMemo, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import {
  Search,
  Video,
  Star,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { workspaceHub } from "@/repo/workspace_hub";
import { ServiceType } from "@/pages/Studio";

interface TestimonialSelectorProps {
  selectedService: ServiceType | null;
  onTestimonialSelect: (testimonialId: string) => void;
  onMultiTestimonialSelect?: (testimonialIds: string[]) => void;
  onCancel: () => void;
}

const TestimonialSelector: React.FC<TestimonialSelectorProps> = observer(
  ({ selectedService, onTestimonialSelect, onMultiTestimonialSelect, onCancel }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);

    useEffect(() => {
      (async () => {
        // Use excludeArtifacts=true for faster list loading
        await workspaceHub.testimonialManager.getTestimonials(false);
      })();
    }, []);

    const testimonials = workspaceHub.testimonialManager.testimonials || [];

    // Filter testimonials based on search and type
    const filteredTestimonials = useMemo(() => {
      let filtered = testimonials;

      // Content generation supports both video and text, others only video
      if (selectedService !== "content_generation") {
        filtered = filtered.filter((t) => t.type === "video");
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.author_name?.toLowerCase().includes(query) ||
            t.author_company?.toLowerCase().includes(query) ||
            t.content?.toLowerCase().includes(query)
        );
      }

      // Sort by created_at desc (use slice to avoid mutating observable array)
      return filtered.slice().sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }, [testimonials, searchQuery, selectedService]);

    const getServiceName = () => {
      switch (selectedService) {
        case "platform_optimization":
          return "Platform Optimization";
        case "clipping":
          return "Smart Clipping";
        case "story_video":
          return "Story Video";
        case "content_generation":
          return "Content Generation";
        case "custom_pipeline":
          return "Custom Pipeline";
        default:
          return "AI Processing";
      }
    };

    const supportsMultiSelection = () => {
      return selectedService === "content_generation" || selectedService === "story_video";
    };

    const getMaxSelection = () => {
      switch (selectedService) {
        case "content_generation":
          return 10;
        case "story_video":
          return 4;
        default:
          return 1;
      }
    };

    const getServiceRequirement = () => {
      switch (selectedService) {
        case "platform_optimization":
          return "Select a video testimonial to optimize for social platforms";
        case "clipping":
          return "Select a video testimonial to extract highlight clips";
        case "story_video":
          return "Select 1-4 video testimonials to create a story";
        case "content_generation":
          return "Select 1-10 testimonials (video or text) to generate marketing content";
        case "custom_pipeline":
          return "Select a video testimonial for custom processing";
        default:
          return "Select a video testimonial to process";
      }
    };

    const handleSelect = (testimonialId: string) => {
      if (supportsMultiSelection()) {
        const maxSelection = getMaxSelection();

        // Toggle selection for multi-select services
        setSelectedTestimonials(prev => {
          if (prev.includes(testimonialId)) {
            // Deselect
            return prev.filter(id => id !== testimonialId);
          } else {
            // Check max limit before selecting
            if (prev.length >= maxSelection) {
              // Don't allow selection beyond max
              return prev;
            }
            return [...prev, testimonialId];
          }
        });
      } else {
        // Single select - proceed immediately
        setIsLoading(true);
        onTestimonialSelect(testimonialId);
      }
    };

    const handleContinue = () => {
      if (selectedTestimonials.length > 0 && onMultiTestimonialSelect) {
        setIsLoading(true);
        onMultiTestimonialSelect(selectedTestimonials);
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mb-4 text-slate-600 hover:text-slate-900 -ml-2"
          >
            <ChevronRight className="h-4 w-4 mr-1.5 rotate-180" />
            Back
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                Select Testimonial
              </h1>
              <p className="text-sm lg:text-base text-slate-600">
                {getServiceRequirement()}
              </p>
            </div>

            {selectedService && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-3 py-1"
              >
                {getServiceName()}
              </Badge>
            )}
          </div>
        </div>

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by author, company, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 text-sm"
            />
          </div>
        </Card>

        {/* Info Banner for no context */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                No Testimonial Selected
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                You navigated to the studio without selecting a testimonial.
                Please select one below to continue.
                <span className="font-medium"> Tip:</span> For faster access,
                select a testimonial from your dashboard first, then choose an
                AI service.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Max Selection Warning */}
        {supportsMultiSelection() && selectedTestimonials.length >= getMaxSelection() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-1">
                  Maximum Selection Reached
                </h4>
                <p className="text-xs text-amber-700 leading-relaxed">
                  You've selected the maximum of {getMaxSelection()} testimonials for {getServiceName()}.
                  Deselect a testimonial to choose a different one.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Testimonials List */}
        {filteredTestimonials.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              {selectedService === "content_generation" ? (
                <FileText className="h-8 w-8 text-slate-400" />
              ) : (
                <Video className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">
              {searchQuery
                ? "No testimonials found"
                : selectedService === "content_generation"
                ? "No testimonials yet"
                : "No video testimonials yet"}
            </h3>
            <p className="text-xs text-slate-600 mb-6">
              {searchQuery
                ? "Try adjusting your search query"
                : selectedService === "content_generation"
                ? "Create your first testimonial to get started with content generation"
                : "Create your first video testimonial to get started with AI processing"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTestimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Card
                  className={`group relative overflow-hidden border-2 transition-all duration-200 cursor-pointer h-full ${
                    supportsMultiSelection() && selectedTestimonials.includes(testimonial.id)
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : supportsMultiSelection() && selectedTestimonials.length >= getMaxSelection() && !selectedTestimonials.includes(testimonial.id)
                      ? "border-slate-200 opacity-50 cursor-not-allowed"
                      : "border-slate-200 hover:border-blue-400 hover:shadow-md"
                  }`}
                  onClick={() => handleSelect(testimonial.id)}
                >
                  {/* Media Thumbnail - Different rendering for video vs text */}
                  {testimonial.type === "video" ? (
                    <div className="relative h-40 bg-slate-100 overflow-hidden">
                      <video
                        src={testimonial.media_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        <Badge className="bg-black/60 text-white border-0 text-xs px-2 py-0.5">
                          <Video className="h-3 w-3 mr-1" />
                          Video
                        </Badge>
                      </div>
                      {/* Multi-select checkbox indicator */}
                      {supportsMultiSelection() && (
                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedTestimonials.includes(testimonial.id)
                                ? "bg-blue-600 border-blue-600"
                                : "bg-white/90 border-white"
                            }`}
                          >
                            {selectedTestimonials.includes(testimonial.id) && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-40 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden flex items-center justify-center p-4">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 line-clamp-3">
                          {testimonial.content || "Text testimonial"}
                        </p>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <Badge className="bg-slate-700 text-white border-0 text-xs px-2 py-0.5">
                          <FileText className="h-3 w-3 mr-1" />
                          Text
                        </Badge>
                      </div>
                      {/* Multi-select checkbox indicator */}
                      {supportsMultiSelection() && (
                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedTestimonials.includes(testimonial.id)
                                ? "bg-blue-600 border-blue-600"
                                : "bg-slate-300 border-slate-400"
                            }`}
                          >
                            {selectedTestimonials.includes(testimonial.id) && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1">
                        {testimonial.author_name || "Anonymous"}
                      </h3>
                      {testimonial.author_company && (
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {testimonial.author_company}
                        </p>
                      )}
                    </div>

                    {/* Content Preview */}
                    {testimonial.content && (
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                        {testimonial.content}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(testimonial.created_at)}</span>
                      </div>
                      {testimonial.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="font-medium">
                            {testimonial.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Select Button */}
                    {!supportsMultiSelection() && (
                      <Button
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs h-9 group-hover:bg-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(testimonial.id);
                        }}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Select
                            <ChevronRight className="h-3 w-3 ml-1.5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {filteredTestimonials.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Showing {filteredTestimonials.length}{" "}
              {selectedService === "content_generation"
                ? `testimonial${filteredTestimonials.length !== 1 ? "s" : ""}`
                : `video testimonial${filteredTestimonials.length !== 1 ? "s" : ""}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* Fixed Continue Button for Multi-Select */}
        {supportsMultiSelection() && selectedTestimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
          >
            <Card className="shadow-2xl border-2 border-blue-500">
              <div className="px-6 py-4 flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-semibold text-slate-900">
                    {selectedTestimonials.length}
                  </span>
                  <span className="text-slate-600 ml-1">
                    / {getMaxSelection()} testimonial{selectedTestimonials.length !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <Button
                  onClick={handleContinue}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white h-9"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }
);

export default TestimonialSelector;
