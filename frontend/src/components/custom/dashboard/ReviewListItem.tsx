

import { useState } from "react";
import { MessageSquare, Share2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Testimonial } from "@/types/testimonial";
import { getBadgeColor } from "@/util/utils";
import { ReviewDetailModal } from "@/components/custom/dashboard/ReviewDetailModal.tsx";
import { ShareModal } from "@/components/custom/dashboard/ShareModal";

export const ReviewListItem = ({ testimonial }: { testimonial: Testimonial }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="p-5 bg-white/90 backdrop-blur-lg transition-all rounded-xl flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Profile Initials - Elevated Effect */}
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-700 text-white font-semibold text-lg rounded-xl flex items-center justify-center shadow-md ring-1 ring-white/50">
        {testimonial.customer_name ? testimonial.customer_name.substring(0, 1).toUpperCase() : "?"}
        </div>

        <div className="flex-grow">
          {/* Name & Badge */}
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-gray-900 text-lg">{testimonial.customer_name}</h4>
            <Badge
              className={`outline ${getBadgeColor(testimonial.status)} px-3 py-1 text-sm rounded-full border-opacity-60 shadow-sm`}
            >
              {testimonial.status}
            </Badge>
          </div>

          {/* Star Rating & Time Ago */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < (testimonial.rating ?? 0)
                      ? "text-yellow-400 fill-yellow-400 drop-shadow"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500">
  {testimonial.created_at 
    ? new Date(testimonial.created_at).toLocaleDateString() 
    : "No date"}
</span>
          </div>

          {/* Review Content Preview */}
          <p className="text-gray-700 mt-2 text-sm font-light line-clamp-1">
            "{testimonial.content}"
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
          <ReviewDetailModal testimonial={testimonial} />
        </button>
      </div>

      {/* Share Modal */}
      <ShareModal
        testimonial={testimonial}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
