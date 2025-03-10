import { MessageSquare, Share2, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/types/types";
import { getBadgeColor } from "@/util/utils";

export const ReviewListItem = ({ review }: { review: Review }) => (
  <div
    className="p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors flex items-center justify-between"
  >
    <div className="flex items-center space-x-4">
      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-sm">
        {review.initials}
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">
            {review.name}
          </h4>
          <Badge
            variant="outline"
            className={`${getBadgeColor(review.status)} px-2 py-0.5 text-xs`}
          >
            {review.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {review.timeAgo}
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
          "{review.content}"
        </p>
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600">
        <MessageSquare className="h-4 w-4" />
      </button>
      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-purple-600">
        <Share2 className="h-4 w-4" />
      </button>
      <button className="ml-2 p-2 hover:bg-purple-50 rounded-full transition-colors text-purple-600">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);