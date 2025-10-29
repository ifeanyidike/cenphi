import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Check,
  Star,
  Play,
  User,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Trash2,
  Sparkles,
  FileText,
  Calendar,
  Building2,
  BarChart3,
  ExternalLink,
  X,
  Brain,
} from "lucide-react";
import { Testimonial } from "@/types/testimonial";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ConfirmDialog from "../common/ConfirmDialog";
import { observer } from "mobx-react-lite";

interface TestimonialCardProps {
  testimonial: Testimonial;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const TestimonialCard = ({
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

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (testimonial.media_url) {
      setShowVideoModal(true);
    }
  };

  // Determine content length for adaptive sizing
  const contentLength = testimonial.content?.length || 0;
  const isLongContent = contentLength > 200;
  const isVideoTestimonial = testimonial.type === "video";
  const sentimentScore = testimonial.sentiment_score || 0;

  return (
    <>
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
              onClick={(e) => e.stopPropagation()}
            >
              View Details
              <ExternalLink className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
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
    </>
  );
};

// Video Modal Component
const VideoModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  testimonial: Testimonial;
}> = ({ isOpen, onClose, videoUrl, testimonial }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4"
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

export default observer(TestimonialCard);
