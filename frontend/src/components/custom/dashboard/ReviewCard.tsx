
import { useState } from "react";
import { MessageSquare, Share2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/types/types";
import { ExtendedReview } from "@/components/custom/dashboard/AudioPlayer";
import { AudioPlayer } from "@/components/custom/dashboard/AudioPlayer";
import { VideoPlayer } from "@/components/custom/dashboard/VideoPlayer";
import { ReviewDetailModal } from "@/components/custom/dashboard/ReviewDetailModal.tsx";
import { ShareModal } from "@/components/custom/dashboard/ShareModal";

export const ReviewCard = ({ review }: { review: Review }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div
      key={review.id}
      className="w-full md:w-[400px] h-[300px] bg-white/95 border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-102 p-6 backdrop-blur-sm flex flex-col relative group overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(252,252,255,0.95) 100%)",
      }}
    >
      {/* Premium hover effect - subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-indigo-300/10 to-purple-300/10 rounded-full blur-xl" />
      <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-gradient-to-tr from-purple-300/10 to-pink-300/10 rounded-full blur-xl" />
      
      {/* Content wrapper with z-index to stay above decorative elements */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-semibold text-xl shadow-md group-hover:shadow-lg transition-shadow">
              {review.initials}
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-900 transition-colors">{review.name}</h4>
              <div className="flex items-center text-sm text-gray-500">
                <span>{review.timeAgo}</span>
                <span className="mx-2">&bull;</span>
                <Badge
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 ${
                    review.status === "New"
                      ? "bg-green-50 text-green-600 border-green-200 group-hover:bg-green-100 group-hover:border-green-300"
                      : review.status === "Replied"
                      ? "bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-100 group-hover:border-blue-300"
                      : review.status === "Verified"
                      ? "bg-yellow-50 text-yellow-600 border-yellow-200 group-hover:bg-yellow-100 group-hover:border-yellow-300"
                      : "bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-100 group-hover:border-purple-300"
                  }`}
                >
                  {review.status}
                </Badge>
              </div>
            </div>
          </div>
          {/* Star Rating */}
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 transition-colors duration-300 ${
                  i < review.rating
                    ? "text-yellow-500 fill-current group-hover:text-yellow-400"
                    : "text-gray-300 group-hover:text-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Container - Fixed height for consistency across media types */}
        <div className="mt-4 flex-grow overflow-hidden flex flex-col">
          {/* Review Text Content */}
          {review.mediaType !== "video" && review.mediaType !== "audio" && (
            <div className="mb-auto">
              <p className="text-gray-700 text-base leading-relaxed italic line-clamp-8">{review.content}</p>
            </div>
          )}

          {/* Media Content - Same-sized container regardless of media type */}
          <div className={`${(review.mediaType === "video" || review.mediaType === "audio") ? "mt-2 h-64 flex items-center justify-center" : "hidden"}`}>
            {review.mediaType === "audio" && (
              <div className="w-full">
                <AudioPlayer review={review as ExtendedReview} />
              </div>
            )}
            {review.mediaType === "video" && (
              <div className="w-full">
                <VideoPlayer review={review as ExtendedReview} />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions - Fixed to bottom */}
        <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex space-x-4">
            <button className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors group">
              <MessageSquare className="h-5 w-5 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Reply</span>
            </button>
            <button 
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors group"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 className="h-5 w-5 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>
          <div>
            <ReviewDetailModal review={review} />
          </div>
        </div>
        
        {/* Premium corner accent */}
        <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-gradient-to-tl from-indigo-500/20 to-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>

      {/* Share Modal */}
      <ShareModal
        review={review}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
