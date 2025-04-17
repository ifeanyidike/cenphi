import { useState } from "react";
import {
  MessageSquare,
  Share2,
  ChevronRight,
  Star,
  Heart,
  MoreHorizontal,
  Play,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Testimonial } from "@/types/testimonial";
import { formatMessageDateIntlShort } from "@/utils/general";
import { getInitials } from "@/utils/testimonial";

export const ReviewCard = ({ review }: { review: Testimonial }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

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

  const isLongContent = (review.content?.length || 0) > 150;
  const displayContent =
    isExpanded || !isLongContent
      ? review.content
      : `${review.content?.slice(0, 150)}...`;

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}
      animate={{
        boxShadow: isHovered
          ? "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <Avatar className="h-12 w-12 border-2 border-purple-100">
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-indigo-500 text-white font-medium">
                {getInitials(review)}
              </AvatarFallback>
              {review.customer_profile?.avatar_url && (
                <AvatarImage
                  src={review.customer_profile?.avatar_url}
                  alt={review.customer_profile?.name}
                />
              )}
            </Avatar>
            <div className="ml-3">
              <div className="font-semibold text-gray-900">
                {review.customer_profile?.name}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                {formatMessageDateIntlShort(review.created_at as Date)}
                {review.verified_at && (
                  <div className="flex items-center ml-2 text-green-600">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <Badge variant="outline" className={getBadgeColor(review.status)}>
              {review.status}
            </Badge>
            <button className="ml-2 text-gray-400 hover:text-gray-600 p-1">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < review.rating!
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>

          <p className="text-gray-700">{displayContent}</p>

          {isLongContent && (
            <button
              onClick={toggleExpand}
              className="mt-1 text-purple-600 text-sm font-medium hover:text-purple-800 focus:outline-none"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Media content */}
        <AnimatePresence>
          {review.format !== "text" && (
            <motion.div
              className="mt-4 rounded-xl overflow-hidden bg-gray-100"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {review.format === "video" && (
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <img
                    src={
                      (review as any).media_thumbnail ||
                      "https://placehold.co/400x225"
                    }
                    alt="Video thumbnail"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-14 w-14 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                      <Play className="h-6 w-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
              )}

              {review.format === "audio" && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                      <Volume2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1.5">
                        <div className="h-1.5 bg-gray-200 rounded-full w-full overflow-hidden">
                          <div className="h-1.5 bg-purple-600 rounded-full w-1/3"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>0:42</span>
                        <span>2:17</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {review.format === "image" && (
                <div className="aspect-video bg-gray-100">
                  <img
                    src={
                      (review as any).media_url ||
                      "https://placehold.co/600x225"
                    }
                    alt={`Review by ${review.customer_profile?.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex space-x-4">
            <button className="text-gray-500 flex items-center hover:text-purple-600 transition-colors group">
              <MessageSquare className="h-5 w-5 mr-1.5 group-hover:text-purple-600" />
              <span className="text-sm">{(review as any).replies || 10}</span>
            </button>
            <button className="text-gray-500 flex items-center hover:text-red-500 transition-colors group">
              <Heart className="h-5 w-5 mr-1.5 group-hover:text-red-500" />
              <span className="text-sm">{(review as any).likes || 50}</span>
            </button>
            <button className="text-gray-500 flex items-center hover:text-purple-600 transition-colors">
              <Share2 className="h-5 w-5 mr-1.5" />
            </button>
          </div>

          <button className="flex items-center text-purple-600 font-medium text-sm hover:text-purple-800 transition-colors group">
            <span>Details</span>
            <ChevronRight className="h-5 w-5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
