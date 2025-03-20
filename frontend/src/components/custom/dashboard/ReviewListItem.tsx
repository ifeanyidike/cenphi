

import { useState } from "react";
import { MessageSquare, Share2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/types/types";
import { getBadgeColor } from "@/util/utils";
import { ReviewDetailModal } from "@/components/custom/dashboard/ReviewDetailModal.tsx";
import { ShareModal } from "@/components/custom/dashboard/ShareModal";

export const ReviewListItem = ({ review }: { review: Review }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="p-5 bg-white/90 backdrop-blur-lg transition-all rounded-xl flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Profile Initials - Elevated Effect */}
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-700 text-white font-semibold text-lg rounded-xl flex items-center justify-center shadow-md ring-1 ring-white/50">
          {review.initials}
        </div>

        <div className="flex-grow">
          {/* Name & Badge */}
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-lg">{review.name}</h4>
            <Badge
              className={`outline ${getBadgeColor(review.status)} px-3 py-1 text-sm rounded-full border-opacity-60 shadow-sm`}
            >
              {review.status}
            </Badge>
          </div>

          {/* Star Rating & Time Ago */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? "text-yellow-400 fill-yellow-400 drop-shadow"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">{review.timeAgo}</span>
          </div>

          {/* Review Content Preview */}
          <p className="text-gray-700 mt-2 text-sm font-light line-clamp-1">
            "{review.content}"
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600 hover:text-indigo-600">
          <MessageSquare className="h-5 w-5" />
        </button>
        <button 
          className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600 hover:text-indigo-600"
          onClick={() => setIsShareModalOpen(true)}
        >
          <Share2 className="h-5 w-5" />
        </button>
        <button className="ml-2 p-2 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-all text-indigo-600">
          <ReviewDetailModal review={review} />
        </button>
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
