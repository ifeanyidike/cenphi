
import React, { useState } from "react";
import { 
  Share2, 
  Star,  
  Calendar,
  CheckCircle,
  ArchiveIcon,
  VideoIcon,
  HeadsetIcon
} from "lucide-react";
import { Testimonial } from "@/types/testimonial";
import { ReviewDetailModal } from "@/components/custom/dashboard/ReviewDetailModal.tsx";
import { ShareModal } from "@/components/custom/dashboard/ShareModal";
import { motion } from "framer-motion";

export const ReviewListItem = ({ 
  testimonial,
  onSelect,
  isSelected,
  onActionClick,
  renderFormatIcon
}: { 
  testimonial: Testimonial;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  onActionClick?: (testimonial: Testimonial, action: 'feature' | 'share' | 'archive') => void;
  renderFormatIcon?: (format: string) => React.ReactNode;
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Format date for display
  const formatDate = (date: Date) => {
    if (!date) return "No date";
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  // Render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative group hover:bg-gray-50 transition-all border-b border-gray-200 duration-200"
    >
      {/* Add thin line at bottom that gets thicker on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-100 group-hover:h-0.5 group-hover:bg-gray-200 transition-all duration-200"></div>
      
      <div className="p-4 sm:p-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Mobile header - only visible on small screens */}
          <div className="lg:hidden col-span-1 flex items-center justify-between w-full mb-2">
            <div className="flex items-center">
              {onSelect && (
                <input 
                  type="checkbox"
                  className="rounded-md text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelect(testimonial.id);
                  }}
                />
              )}
              <div className="ml-4 flex">
                {renderStars(testimonial.rating ?? 0)}
                <span className="ml-2 text-sm text-gray-500">
                  {testimonial.rating ?? 0}/5
                </span>
              </div>
            </div>
            
            <div className="flex items-center text-xs text-gray-500">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(testimonial.created_at)}
            </div>
          </div>
        
          {/* Checkbox - only if onSelect is provided */}
          {onSelect && (
            <div 
              className="hidden lg:flex lg:col-span-1 items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <input 
                type="checkbox"
                className="rounded-md text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                checked={isSelected}
                onChange={() => onSelect(testimonial.id)}
              />
            </div>
          )}

          {/* Profile */}
          <div className={`${onSelect ? 'lg:col-span-3' : 'lg:col-span-4'} flex items-center`}>
            <div className="relative">
              <div 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-800 font-semibold text-lg ring-2 ring-white shadow-sm overflow-hidden"
              >
                {testimonial.customer_profile?.avatar_url ? (
                  <img 
                    src={testimonial.customer_profile.avatar_url} 
                    alt={testimonial.customer_profile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${testimonial.customer_profile?.name}&background=random`} 
                    alt={testimonial.customer_profile?.name} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              {renderFormatIcon && (
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  {renderFormatIcon(testimonial.format)}
                </div>
              )}
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
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {testimonial.customer_profile?.name || "Anonymous customer"}
              </div>
              <div className="text-xs text-gray-500 flex flex-wrap items-center">
                {testimonial.customer_profile?.title || 'Customer'} 
                {testimonial.customer_profile?.company && (
                  <>
                    <span className="mx-1.5 text-gray-300">•</span>
                    <span>{testimonial.customer_profile.company}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Rating - Only visible on desktop */}
          <div className="hidden lg:flex lg:col-span-2 items-center">
            <div className="flex items-center">
              {renderStars(testimonial.rating ?? 0)}
            </div>
            <span className="ml-2 text-sm text-gray-500">
              {testimonial.rating ?? 0}/5
            </span>
          </div>

          {/* Date - Only visible on desktop */}
          <div className="hidden lg:flex lg:col-span-2 items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            {formatDate(testimonial.created_at)}
          </div>

          {/* Testimonial Content */}
          <div className="lg:col-span-4 text-sm text-gray-700">
            <p className="line-clamp-2 italic">{testimonial.content}</p>
          </div>

          {/* Actions */}
          <div 
            className="lg:col-span-2 flex justify-end items-center space-x-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex space-x-1">
              {onActionClick && (
                <>
                  <button 
                    onClick={() => onActionClick(testimonial, 'feature')}
                    className="text-green-600 bg-green-50 hover:bg-green-100 p-2 rounded-lg transition-colors"
                    title="Feature"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onActionClick(testimonial, 'archive')}
                    className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                    title="Archive"
                  >
                    <ArchiveIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              <button 
                onClick={() => {
                  if (onActionClick) {
                    onActionClick(testimonial, 'share');
                  } else {
                    setIsShareModalOpen(true);
                  }
                }}
                className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <div className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors">
              <ReviewDetailModal testimonial={testimonial} />
            </div>
          </div>
          
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        testimonial={testimonial}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </motion.div>
  );
};