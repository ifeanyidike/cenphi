
import { useState } from "react";
import { MessageSquare, Share2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Testimonial } from "@/types/testimonial";
import { AudioPlayer } from "@/components/custom/dashboard/AudioPlayer";
import { VideoPlayer } from "@/components/custom/dashboard/VideoPlayer";
import { ReviewDetailModal } from "@/components/custom/dashboard/ReviewDetailModal.tsx";
import { ShareModal } from "@/components/custom/dashboard/ShareModal";

interface ReviewCardProps {
  testimonial: Testimonial;
  onAction?: (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ testimonial }: { testimonial: Testimonial }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  return (
    <div
      key={testimonial.id}
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
            {testimonial.customer_name ? testimonial.customer_name.substring(0, 1).toUpperCase() : "?"}
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-bold text-gray-900 group-hover:text-indigo-900 transition-colors">{testimonial.customer_name}</h4>
              <div className="flex items-center text-sm text-gray-500">
                <span>{typeof testimonial.customer_title}</span>
                <span className="mx-2">&bull;</span>
                <Badge
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 ${
                    testimonial.status === "pending_review"
                      ? "bg-green-50 text-green-600 border-green-200 group-hover:bg-green-100 group-hover:border-green-300"
                      : testimonial.status === "approved"
                      ? "bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-100 group-hover:border-blue-300"
                      : testimonial.status === "rejected"
                      ? "bg-yellow-50 text-yellow-600 border-yellow-200 group-hover:bg-yellow-100 group-hover:border-yellow-300"
                      : "bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-100 group-hover:border-purple-300"
                  }`}
                >
                  {testimonial.status}
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
                  i < (testimonial.rating ?? 0)
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
          {testimonial.type !== "video" && testimonial.type !== "audio" && (
            <div className="mb-auto">
              <p className="text-gray-700 text-base leading-relaxed italic line-clamp-8">{testimonial.content}</p>
            </div>
          )}

          {/* Media Content - Same-sized container regardless of media type */}
          <div className={`${(testimonial.type === "video" || testimonial.type === "audio") ? "mt-2 h-64 flex items-center justify-center" : "hidden"}`}>
            {testimonial.type === "audio" && (
              <div className="w-full">
                <AudioPlayer testimonial={testimonial} />
              </div>
            )}
            {testimonial.type === "video" && (
              <div className="w-full">
                <VideoPlayer testimonial={testimonial} />
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
            <ReviewDetailModal testimonial={testimonial} />
          </div>
        </div>
        
        {/* Premium corner accent */}
        <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-gradient-to-tl from-indigo-500/20 to-purple-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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
