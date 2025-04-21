
import { useState } from "react";
import { MessageSquare, Share2, Star, CheckCircle, XCircle, MoreHorizontal, Calendar, VideoIcon, HeadsetIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Testimonial } from "@/types/testimonial";
import { AudioPlayer } from "@/components/custom/dashboard/AudioPlayer";
import { ReviewDetailModal } from "@/components/custom/dashboard/ReviewDetailModal.tsx";
import { ShareModal } from "@/components/custom/dashboard/ShareModal";

interface ReviewCardProps {
  testimonial: Testimonial;
  onAction?: (id: string, action: 'approve' | 'reject' | 'feature' | 'archive') => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ testimonial, onAction }) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Determine status styling
  const getStatusStyle = () => {
    switch(testimonial.status) {
      case 'pending':
        return {
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-200',
          hoverBg: 'group-hover:bg-emerald-100',
          hoverBorder: 'group-hover:border-emerald-300',
          icon: <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
        };
      case 'approved':
        return {
          bgColor: 'bg-sky-50',
          textColor: 'text-sky-600',
          borderColor: 'border-sky-200',
          hoverBg: 'group-hover:bg-sky-100',
          hoverBorder: 'group-hover:border-sky-300',
          icon: <CheckCircle className="w-3.5 h-3.5 mr-1 text-sky-500" />
        };
      case 'rejected':
        return {
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-600',
          borderColor: 'border-rose-200',
          hoverBg: 'group-hover:bg-rose-100',
          hoverBorder: 'group-hover:border-rose-300',
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-rose-500" />
        };
      default:
        return {
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-600',
          borderColor: 'border-purple-200',
          hoverBg: 'group-hover:bg-purple-100',
          hoverBorder: 'group-hover:border-purple-300',
          icon: null
        };
    }
  };

  const statusStyle = getStatusStyle();
  
  // Format date if available
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };
  
 
  return (
    <div
      className="group relative w-full h-60 max-w-md mx-auto
        bg-white border border-gray-200 rounded-xl
        shadow-md hover:shadow-xl transition-all duration-500 
        transform hover:-translate-y-1 overflow-hidden"
    >
      {/* Premium gradient border effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 via-purple-500/5 to-transparent rounded-full opacity-70" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-purple-500/5 via-pink-500/5 to-transparent rounded-full opacity-70" />
      
      {/* Content container */}
      <div className="relative z-10 p-4 flex flex-col h-full">
        {/* Header with avatar and rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-[70%]">
            <div className="relative">
              <div className="h-10 w-10 rounded-full 
                bg-gradient-to-br from-indigo-500 to-purple-600 
                flex items-center justify-center text-white 
                font-semibold text-lg shadow-md ring-2 ring-white
                group-hover:shadow-lg group-hover:ring-indigo-50 transition-all">
                {testimonial.customer_profile?.avatar_url ? (
                  <img 
                    src={testimonial.customer_profile.avatar_url} 
                    alt={testimonial.customer_profile?.name || "User"} 
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  testimonial.customer_profile?.name ? 
                  testimonial.customer_profile.name.substring(0, 1).toUpperCase() : 
                  "?"
                )}
              </div>
              
              {/* Format indicator */}
              {testimonial.format && (testimonial.format === "video" || testimonial.format === "audio") && (
  <div className="absolute -bottom-3 -right-1">
    <div className={`rounded-full p-1 shadow-md flex items-center justify-center transition-colors duration-200
      ${testimonial.format === "video" 
        ? "bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200" 
        : "bg-gradient-to-br from-indigo-50 to-indigo-100 hover:from-indigo-100 hover:to-indigo-200"}`}>
      <span className={`flex items-center justify-center
        ${testimonial.format === "video" ? "text-blue-600" : "text-indigo-600"}`}>
        {testimonial.format === "video" ? <VideoIcon size={16} /> : <HeadsetIcon size={16} />}
      </span>
    </div>
  </div>
)}
            </div>
            
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-gray-900 group-hover:text-indigo-900 transition-colors truncate">
                {testimonial.customer_profile?.name}
              </h4>
              <div className="flex items-center text-xs text-gray-500">
                <span className="truncate max-w-[120px] text-[10px]">{testimonial.customer_profile?.title}</span>
                {testimonial.customer_profile?.company && (
                  <>
                    <span className="mx-1 flex-shrink-0">&bull;</span>
                    <span className="truncate max-w-[80px] text-[10px]">{testimonial.customer_profile?.company}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Star Rating */}
          <div className="flex">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 transition-colors duration-300 ${
                  i < (testimonial.rating ?? 0)
                    ? "text-amber-400 fill-current group-hover:text-amber-500"
                    : "text-gray-300 group-hover:text-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Status Badge and Date */}
        <div className="mt-2 flex items-center justify-between">
          <Badge
            className={`px-2 py-0.5 text-xs font-medium rounded-full
              flex items-center transition-all duration-300 shadow-sm
              ${statusStyle.bgColor} ${statusStyle.textColor} ${statusStyle.borderColor}
              ${statusStyle.hoverBg} ${statusStyle.hoverBorder}`}
          >
            {statusStyle.icon}
            <span className="text-[10px]">{testimonial.status.replace(/_/g, ' ')}</span>
          </Badge>
          
          {testimonial.created_at && (
            <div className="flex items-center text-[10px] text-gray-500">
              <Calendar className="w-3 h-3 mr-1 opacity-70" />
              <span>{formatDate(testimonial.created_at)}</span>
            </div>
          )}
        </div>

        {/* Content Section - Reduced height */}
        <div className="mt-2 h-36 overflow-hidden flex flex-col">
          {/* Text Content */}
          {testimonial.format !== "audio" && (
            <div className="mb-auto">
              <p className="text-xs text-gray-700 leading-relaxed italic 
                line-clamp-4 p-3 bg-gradient-to-br from-gray-50 to-white rounded-lg
                border border-gray-100 shadow-sm">
                {testimonial.content}
              </p>
            </div>
          )}

          {/* Media Content */}
          <div className={`${(testimonial.format === "audio") ? 
            "h-full rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-white border border-gray-100 shadow-sm p-2" : "hidden"}`}>
            {testimonial.format === "audio" && (
              <AudioPlayer testimonial={testimonial} />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-2 border-t border-gray-200 flex items-center justify-between">
          <div className="flex space-x-1">
            <button className="flex items-center text-gray-600 hover:text-indigo-600 
              transition-all group px-2 py-1 rounded-full hover:bg-indigo-50 hover:shadow-sm">
              <MessageSquare className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium">Reply</span>
            </button>
            <button 
              className="flex items-center text-gray-600 hover:text-indigo-600 
                transition-all group px-2 py-1 rounded-full hover:bg-indigo-50 hover:shadow-sm"
              onClick={() => setIsShareModalOpen(true)}
            >
              <Share2 className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-medium">Share</span>
            </button>
          </div>
          
          <div className="flex items-center">
            <ReviewDetailModal testimonial={testimonial} />
            {onAction && (
              <button 
                className="ml-1 text-gray-500 hover:text-indigo-600 
                  p-1 rounded-full hover:bg-indigo-50 transition-all hover:shadow-sm"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Premium corner accent */}
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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