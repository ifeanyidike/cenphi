import { useState } from "react";
import {
  MessageSquare,
  Share2,
  ChevronRight,
  Star,
  Heart,
  Volume2,
  Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Testimonial } from "@/types/testimonial";
import { getInitials } from "@/utils/testimonial";

export const ReviewListItem = ({ review }: { review: Testimonial }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-green-50 text-green-600 border-green-200";
      case "Replied":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "Verified":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "Featured":
        return "bg-purple-50 text-purple-600 border-purple-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white mb-4">
      {/* Header Section with Avatar & Info */}
      <div className="flex items-start gap-4">
        <div className="relative">
          {review.customer_profile?.avatar_url ? (
            <img
              src={review.customer_profile?.avatar_url}
              alt={review.customer_profile?.name}
              className="h-14 w-14 rounded-xl object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-medium text-lg shadow-md">
              {getInitials(review)}
            </div>
          )}
          {review.verified_at && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <div className="bg-green-500 text-white rounded-full p-0.5">
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-gray-900 truncate">
                {review.customer_profile?.name}
              </h4>
              <Badge
                className={`text-xs px-2 py-0.5 ${getBadgeColor(
                  review.status
                )}`}
              >
                {review.status}
              </Badge>
            </div>
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {review.created_at.toLocaleString()}
            </span>
          </div>

          {/* Rating Stars */}
          <div className="flex items-center mt-1.5 mb-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating!
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm font-medium text-gray-700">
              {review.rating}.0
            </span>
          </div>
        </div>
      </div>

      {/* Review Content */}
      <div className={`mt-3 ${isExpanded ? "" : "line-clamp-3"}`}>
        <p className="text-gray-700 text-sm leading-relaxed">
          {review.content}
        </p>
      </div>

      {(review.content?.length || 0) > 180 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
        >
          Read more
          <ChevronRight className="h-3 w-3" />
        </button>
      )}

      {/* Media Preview */}
      {review.format !== "text" && (
        <div className="mt-4 relative rounded-xl overflow-hidden bg-gray-100">
          {review.format === "video" && (
            <div className="group relative aspect-video bg-gray-900 rounded-xl overflow-hidden">
              <img
                src={
                  (review as any).media_url || "https://placehold.co/600x225"
                } // Add media_url to db
                alt="Video thumbnail"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-3 shadow-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Play className="h-5 w-5 fill-current" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                {(review as any).duration || 10}
                {/* Add media duration to db */}
              </div>
            </div>
          )}

          {review.format === "audio" && (
            <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 flex items-center gap-3">
              <div className="bg-indigo-600 rounded-full p-2 text-white">
                <Volume2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-indigo-600 rounded-full"></div>
                </div>
              </div>
              <span className="text-xs font-medium text-gray-600">
                {(review as any).duration || 10}
              </span>
              <div className="bg-white rounded-full p-1.5 shadow-sm">
                <Play className="h-3.5 w-3.5 text-gray-700" />
              </div>
            </div>
          )}

          {review.format === "image" && (
            <div className="grid grid-cols-3 gap-2">
              {review.media_urls?.slice(0, 3).map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={img}
                    alt={`Review image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {(review.media_urls?.length || 0) > 3 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  +{review.media_urls!.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-gray-500">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center gap-1.5 text-sm ${
              isLiked ? "text-rose-500" : "hover:text-gray-700"
            } transition-colors`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-500" : ""}`} />
            <span>
              {isLiked
                ? ((review as any).likes || 0) + 1
                : (review as any).likes || 0}
            </span>
          </button>

          <button className="flex items-center gap-1.5 text-sm hover:text-gray-700 transition-colors">
            <MessageSquare className="h-4 w-4" />
            <span>{(review as any).comments || 0}</span>
          </button>
        </div>

        <button className="flex items-center text-sm hover:text-gray-700 transition-colors">
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      {/* Response Section (if any) */}
      {(review as any).response && (
        <div className="mt-4 pt-3 pl-4 border-l-2 border-indigo-100">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">
              {(review as any).responseInitials || "SR"}
            </div>
            <span className="text-sm font-medium text-gray-800">
              {(review as any).responseFrom || "Store Response"}
            </span>
            <span className="text-xs text-gray-500">
              {(review as any).responseTime || "2 days ago"}
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {(review as any).response}
          </p>
        </div>
      )}
    </div>
  );
};
