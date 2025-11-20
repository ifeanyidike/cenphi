import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Grid,
  List,
  Check,
  Star,
  Play,
  FileText,
  Calendar,
  User,
  Building2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ExternalLink,
  X,
  Trash2,
  Sparkles,
  Brain,
  Film,
  Zap,
  Download,
} from "lucide-react";
import { workspaceHub } from "@/repo/workspace_hub";
import { Testimonial } from "@/types/testimonial";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import ConfirmDialog from "../common/ConfirmDialog";
import ExportModal from "./ExportModal";
import SimpleModalPortal from "@/utils/SimpleModalPortal";

interface TestimonialCardProps {
  testimonial: Testimonial;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const TestimonialCard = observer(
  ({
    testimonial,
    isSelected,
    onToggleSelect,
    onDelete,
    isDeleting = false,
  }: TestimonialCardProps) => {
    const navigate = useNavigate();
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getSentimentIcon = (score: number) => {
      if (score >= 0.7)
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      if (score >= 0.4) return <Minus className="w-4 h-4 text-amber-600" />;
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    };

    const getSentimentLabel = (score: number) => {
      if (score >= 0.7) return "Positive";
      if (score >= 0.4) return "Neutral";
      return "Negative";
    };

    const getSentimentColor = (score: number) => {
      if (score >= 0.7)
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      if (score >= 0.4) return "text-amber-700 bg-amber-50 border-amber-200";
      return "text-red-700 bg-red-50 border-red-200";
    };

    const sentimentScore = testimonial.sentiment_score || 0;

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    const truncateText = (text: string, maxLength: number) => {
      if (!text) return "";
      if (text.length <= maxLength) return text;
      return text.slice(0, maxLength).trimEnd() + "...";
    };

    // Determine content length for adaptive sizing
    const contentLength = testimonial.content?.length || 0;
    const isLongContent = contentLength > 200;
    const isVideoTestimonial = testimonial.type === "video";

    const handleVideoClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (testimonial.media_url) {
        setShowVideoModal(true);
      }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
      onDelete(testimonial.id);
      setShowDeleteConfirm(false);
    };

    const handleSelectClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSelect(testimonial.id);
    };

    const handleAIStudioClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      navigate(`/studio?testimonialId=${testimonial.id}`);
    };

    return (
      <div
        className={cn(
          "group relative bg-white border transition-all duration-200 hover:shadow-lg rounded-xl overflow-hidden cursor-pointer",
          isSelected
            ? "ring-2 ring-slate-900 border-slate-200 shadow-md"
            : "border-gray-200 hover:border-gray-300"
        )}
        onClick={handleSelectClick}
      >
        {/* Selection Checkbox */}
        <div
          className={cn(
            "absolute top-4 left-4 w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center z-10",
            isSelected
              ? "bg-slate-900 border-slate-900"
              : "border-gray-300 bg-white hover:border-gray-400 group-hover:border-gray-400"
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>

        {/* Enhanced Action Buttons */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            onClick={handleAIStudioClick}
            className="h-7 px-2 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white shadow-md border-0"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            <span className="text-xs font-medium">Studio</span>
          </Button>

          <button
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="w-7 h-7 rounded-md bg-white/90 backdrop-blur hover:bg-red-50 border border-gray-200 hover:border-red-200 flex items-center justify-center transition-colors disabled:opacity-50 shadow-sm"
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 text-red-600 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3 text-red-600" />
            )}
          </button>
        </div>

        <div className="p-4 sm:p-5 pt-10 sm:pt-12">
          {/* Author Info */}
          <div className="flex items-start sm:items-center space-x-3 mb-4">
            {testimonial.author_avatar_url ? (
              <img
                src={testimonial.author_avatar_url}
                alt={testimonial.author_name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">
                {testimonial.author_name || "Anonymous"}
              </h3>
              <p className="text-xs text-gray-600 truncate">
                {testimonial.author_title}
              </p>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{testimonial.author_company}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1 hidden sm:inline" />
              <span className="text-right sm:text-left">
                {formatDate(testimonial.created_at)}
              </span>
            </div>
          </div>

          {/* Video Preview - Only for video testimonials */}
          {isVideoTestimonial && testimonial.media_url && (
            <div
              className="relative mb-4 rounded-lg overflow-hidden bg-gray-100 aspect-video"
              onClick={handleVideoClick}
            >
              <video
                src={testimonial.media_url}
                className="w-full h-full object-cover"
                muted
                poster={testimonial.thumbnail_url}
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-2 group-hover:scale-110 transition-transform">
                  <Play className="w-4 h-4 text-gray-900 fill-gray-900" />
                </div>
              </div>
              <div className="absolute top-2 left-2">
                <div className="flex items-center space-x-1 bg-black/50 rounded px-2 py-1">
                  <Play className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-medium">Video</span>
                </div>
              </div>
            </div>
          )}

          {/* Text Testimonial Indicator */}
          {!isVideoTestimonial && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <FileText className="w-4 h-4 text-gray-600 mr-2" />
                <span className="text-xs font-medium text-gray-700">
                  Text Testimonial
                </span>
                {testimonial.processing_status === "completed" && (
                  <div className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <Brain className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">
                      AI Enhanced
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Preview */}
          <div className="mb-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              {truncateText(
                testimonial.content || "",
                isVideoTestimonial ? 120 : isLongContent ? 300 : 150
              )}
            </p>
          </div>

          {/* Analytics Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex justify-between items-center w-full">
              {/* Rating */}
              {testimonial.rating && (
                <div className="flex items-center space-x-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-4 h-4",
                          i < (testimonial.rating || 0)
                            ? "text-amber-400 fill-amber-400"
                            : "text-gray-200"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700 ml-2">
                    {testimonial.rating}.0
                  </span>
                </div>
              )}

              {/* Sentiment */}
              {sentimentScore > 0 && (
                <div className="flex items-center space-x-1">
                  {getSentimentIcon(sentimentScore)}
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium border",
                      getSentimentColor(sentimentScore)
                    )}
                  >
                    {getSentimentLabel(sentimentScore)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center">
                <BarChart3 className="w-3 h-3 mr-1" />
                {testimonial.conversion_count} conversions
              </div>
            </div>

            <Link
              to={`/detail/${testimonial.id}`}
              className="flex items-center text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors group"
            >
              View Details
              <ExternalLink className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Video Modal */}
        <VideoModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          videoUrl={testimonial.media_url || ""}
          testimonial={testimonial}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
          title="Delete Testimonial"
          message={`Are you sure you want to delete the testimonial from ${testimonial.author_name || "Anonymous"}? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          isLoading={isDeleting}
        />
      </div>
    );
  }
);

interface TestimonialListProps {
  testimonials: Testimonial[];
  selectedTestimonials: string[];
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  deletingTestimonials: Set<string>;
}

const TestimonialList = ({
  testimonials,
  selectedTestimonials,
  onToggleSelect,
  onDelete,
  deletingTestimonials,
}: TestimonialListProps) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("masonry");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);

  const isLoading = workspaceHub.testimonialManager.loading_testimonials;

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

  const handleSelectAll = () => {
    filteredTestimonials.forEach((t) => {
      if (!selectedTestimonials.includes(t.id)) {
        onToggleSelect(t.id);
      }
    });
  };

  const handleClearSelection = () => {
    selectedTestimonials.forEach((id) => {
      onToggleSelect(id);
    });
  };

  const handleProcessWithAI = () => {
    const urlPath =
      selectedTestimonials.length > 0
        ? `/studio?testimonials=${selectedTestimonials.join(",")}`
        : "/studio";

    navigate(urlPath);
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading testimonials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className=" sticky top-0">
      {/* Header */}
      <div className="border-b border-gray-200 py-3">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Customer Testimonials
              </h1>
              <p className="text-gray-600 text-sm">
                {filteredTestimonials.length} testimonials •{" "}
                {selectedTestimonials.length} selected for processing
              </p>
            </div>

            {selectedTestimonials.length > 0 && (
              <button
                onClick={handleProcessWithAI}
                className="flex text-sm items-center justify-center space-x-1 bg-gradient-to-r from-slate-900 to-slate-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-slate-800 hover:to-slate-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium whitespace-nowrap"
              >
                <span className="hidden sm:inline">
                  Process with Studio ({selectedTestimonials.length})
                </span>
                <span className="sm:hidden">
                  Studio ({selectedTestimonials.length})
                </span>
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search testimonials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 h-12 rounded-xl shadow-sm"
                />
              </div>

              {/* Filter */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-12 rounded-xl shadow-sm w-full sm:w-auto sm:min-w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Video Testimonials</SelectItem>
                  <SelectItem value="text">Text Testimonials</SelectItem>
                  <SelectItem value="high_rating">High Rating (4+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-6">
              {/* Selection Controls */}
              {filteredTestimonials.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 text-sm">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-700 hover:text-slate-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleClearSelection}
                    className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    disabled={selectedTestimonials.length === 0}
                  >
                    Clear Selection
                  </button>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode("masonry")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    viewMode === "masonry"
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid className="w-4 h-4 mr-2 inline" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    viewMode === "list"
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4 mr-2 inline" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-4">
        {filteredTestimonials.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Building2 className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
              No testimonials found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base">
              Try adjusting your search criteria or filters to discover more
              customer testimonials.
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "masonry"
                ? "columns-1 sm:columns-1 md:columns-2 lg:columns-3 gap-4 sm:gap-6 space-y-4 sm:space-y-6"
                : "grid grid-cols-1 max-w-4xl mx-auto gap-4 sm:gap-6"
            }
          >
            {filteredTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className={
                  viewMode === "masonry"
                    ? "break-inside-avoid mb-4 sm:mb-6"
                    : ""
                }
              >
                <TestimonialCard
                  testimonial={testimonial}
                  isSelected={selectedTestimonials.includes(testimonial.id)}
                  onToggleSelect={onToggleSelect}
                  onDelete={onDelete}
                  isDeleting={deletingTestimonials.has(testimonial.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom-docked Selection Banner */}
      {selectedTestimonials.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 transform transition-transform duration-300 ease-out"
          style={{
            paddingBottom: "env(safe-area-inset-bottom)",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-2xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Selection Info */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        {selectedTestimonials.length} Selected
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Ready for AI processing
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center: Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Primary: Create Story */}
                  <button
                    onClick={handleProcessWithAI}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium hidden sm:inline">
                      Create Story
                    </span>
                    <span className="text-xs font-medium sm:hidden">Story</span>
                  </button>

                  {/* Secondary: Quick Analyze */}
                  <button
                    onClick={() => {
                      // Navigate to studio with analyze preset
                      navigate(
                        `/studio?testimonials=${selectedTestimonials.join(",")}&mode=analyze`
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium hidden md:inline">
                      Analyze
                    </span>
                  </button>

                  {/* Secondary: Export */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium hidden md:inline">
                      Export
                    </span>
                  </button>
                </div>

                {/* Right: Close Button */}
                <button
                  onClick={handleClearSelection}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center justify-center"
                  aria-label="Close selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        testimonials={testimonials.filter((t) =>
          selectedTestimonials.includes(t.id)
        )}
      />
    </div>
  );
};

export default observer(TestimonialList);

const VideoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  testimonial: Testimonial;
}> = ({ isOpen, onClose, videoUrl, testimonial }) => {
  return (
    <SimpleModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="relative bg-black rounded-xl overflow-hidden max-w-4xl w-full max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full h-auto"
          style={{ maxHeight: "70vh" }}
        >
          Your browser does not support the video tag.
        </video>

        <div className="p-4 bg-gray-900 text-white">
          <h3 className="font-medium text-sm">{testimonial.author_name}</h3>
          <p className="text-xs text-gray-300">{testimonial.author_company}</p>
        </div>
      </div>
    </SimpleModalPortal>
  );
};
