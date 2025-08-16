import React, { useState } from "react";
import {
  Search,
  Grid,
  List,
  Check,
  Star,
  Play,
  FileText,
  Sparkles,
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
} from "lucide-react";
import { workspaceHub } from "@/repo/workspace_hub";
import { Testimonial } from "@/types/testimonial";
import { Link } from "react-router-dom";
import { TestimonialStateManager } from "@/utils/TestimonialStateManager";
import { observer } from "mobx-react-lite";

interface TestimonialCardProps {
  testimonial: Testimonial;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}

interface TestimonialListProps {
  onNavigateToAIStudio: (selectedIds: string[]) => void;
}

const TestimonialCard = ({
  testimonial,
  isSelected,
  onToggleSelect,
}: TestimonialCardProps) => {
  const [showVideoModal, setShowVideoModal] = useState(false);

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

  const handleViewDetails = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.stopPropagation();
    console.log(`Navigate to testimonial details: ${testimonial.id}`);
  };

  return (
    <div
      className={`group relative bg-white border transition-all duration-200 hover:shadow-lg rounded-xl overflow-hidden cursor-pointer ${
        isSelected
          ? "ring-2 ring-slate-900 border-slate-200 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
      onClick={() => onToggleSelect(testimonial.id)}
    >
      {/* Selection Checkbox */}
      <div
        className={`absolute top-4 left-4 w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center z-10 ${
          isSelected
            ? "bg-slate-900 border-slate-900"
            : "border-gray-300 bg-white hover:border-gray-400 group-hover:border-gray-400"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>

      <div className="p-5 pt-12">
        {/* Author Info */}
        <div className="flex items-center space-x-3 mb-4">
          {testimonial.author_avatar_url ? (
            <img
              src={testimonial.author_avatar_url}
              alt={testimonial.author_name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-400" />
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
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(testimonial.created_at)}
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
                      className={`w-4 h-4 ${
                        i < (testimonial.rating || 0)
                          ? "text-amber-400 fill-amber-400"
                          : "text-gray-200"
                      }`}
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
                  className={`px-2 py-1 rounded text-xs font-medium border ${getSentimentColor(sentimentScore)}`}
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
    </div>
  );
};

const TestimonialList = () => {
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(
    []
  );
  const [viewMode, setViewMode] = useState("masonry");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const isLoading = workspaceHub.testimonialManager.loading_testimonials;
  const testimonials = workspaceHub.testimonialManager.testimonials || [];

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

  const handleToggleSelect = (testimonialId: string) => {
    setSelectedTestimonials((prev) =>
      prev.includes(testimonialId)
        ? prev.filter((id) => id !== testimonialId)
        : [...prev, testimonialId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTestimonials(filteredTestimonials.map((t) => t.id));
  };

  const handleClearSelection = () => {
    setSelectedTestimonials([]);
  };

  const handleProcessWithAI = () => {
    TestimonialStateManager.navigateToAIStudio(selectedTestimonials);
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
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 py-3">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
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
                className="flex text-sm items-center space-x-1 bg-gradient-to-r from-slate-900 to-slate-700 text-white px-6 py-3 rounded-xl hover:from-slate-800 hover:to-slate-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                <span>
                  Process with AI Studio ({selectedTestimonials.length})
                </span>
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between ">
            <div className="flex items-center space-x-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search testimonials..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 w-96 text-sm bg-white shadow-sm"
                />
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm bg-white shadow-sm"
              >
                <option value="all">All Types</option>
                <option value="video">Video Testimonials</option>
                <option value="text">Text Testimonials</option>
                <option value="high_rating">High Rating (4+)</option>
              </select>
            </div>

            <div className="flex items-center space-x-6">
              {/* Selection Controls */}
              {filteredTestimonials.length > 0 && (
                <div className="flex items-center space-x-4 text-sm">
                  <button
                    onClick={handleSelectAll}
                    className="text-slate-700 hover:text-slate-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleClearSelection}
                    className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                    disabled={selectedTestimonials.length === 0}
                  >
                    Clear Selection
                  </button>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("masonry")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    viewMode === "masonry"
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Grid className="w-4 h-4 mr-2 inline" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    viewMode === "list"
                      ? "bg-white text-slate-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <List className="w-4 h-4 mr-2 inline" />
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Selection Summary */}
          {selectedTestimonials.length > 0 && (
            <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-slate-800 font-medium ">
                  {selectedTestimonials.length} testimonial
                  {selectedTestimonials.length !== 1 ? "s" : ""} selected for AI
                  processing
                </span>
                <span className="text-slate-600 text-sm">
                  Generate insights, extract highlights, create content, and
                  more
                </span>
              </div>
              <button
                onClick={handleClearSelection}
                className="text-slate-600 hover:text-slate-800 font-medium"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-8">
        {filteredTestimonials.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No testimonials found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search criteria or filters to discover more
              customer testimonials.
            </p>
          </div>
        ) : (
          <div
            className={
              viewMode === "masonry"
                ? "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
                : "grid grid-cols-1 max-w-4xl mx-auto gap-6"
            }
          >
            {filteredTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className={
                  viewMode === "masonry" ? "break-inside-avoid mb-6" : ""
                }
              >
                <TestimonialCard
                  testimonial={testimonial}
                  isSelected={selectedTestimonials.includes(testimonial.id)}
                  onToggleSelect={handleToggleSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-black rounded-xl overflow-hidden max-w-4xl w-full max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
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
    </div>
  );
};
