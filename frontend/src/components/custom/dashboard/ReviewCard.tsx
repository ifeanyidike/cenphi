import { MessageSquare, Share2, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Review } from "@/types/types";
import { ExtendedReview } from "@/components/custom/dashboard/AudioPlayer";
import { AudioPlayer } from "@/components/custom/dashboard/AudioPlayer";
import { VideoPlayer } from "@/components/custom/dashboard/VideoPlayer";

export const ReviewCard = ({ review }: { review: Review }) => (
  <div
    key={review.id}
    className="border rounded-lg p-5 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-medium text-sm">
          {review.initials}
        </div>
        <div className="ml-3">
          <div className="font-medium">{review.name}</div>
          <div className="text-sm text-gray-500 flex items-center">
            {review.timeAgo}
            <span className="mx-2">•</span>
            <Badge
              variant="outline"
              className={
                review.status === "New" ? "bg-green-50 text-green-600" :
                review.status === "Replied" ? "bg-blue-50 text-blue-600" :
                review.status === "Verified" ? "bg-yellow-50 text-yellow-600" :
                "bg-purple-50 text-purple-600"
              }
            >
              {review.status}
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
    
    <div className="mt-3">
      <p className="text-gray-700">{review.content}</p>
    </div>
    
    {review.mediaType === "audio" && <AudioPlayer review={review as ExtendedReview} />}
    {review.mediaType === "video" && <VideoPlayer review={review as ExtendedReview} />}
    
    <div className="mt-4 pt-4 border-t flex justify-between">
      <div className="flex space-x-2">
        <button className="text-gray-500 flex items-center hover:text-purple-600">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span className="text-sm">Reply</span>
        </button>
        <button className="text-gray-500 flex items-center hover:text-purple-600">
          <Share2 className="h-4 w-4 mr-1" />
          <span className="text-sm">Share</span>
        </button>
      </div>
      <button className="text-purple-600 flex items-center font-medium text-sm">
        View Details
        <ChevronRight className="h-4 w-4 ml-1" />
      </button>
    </div>
  </div>
);