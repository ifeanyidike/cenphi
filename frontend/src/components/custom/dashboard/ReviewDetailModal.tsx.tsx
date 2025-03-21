import { useState } from "react";
import { X, Volume2, Film, ImageIcon, MessageSquare, Badge, Star, ChevronRight } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { Review } from "@/types/types";
import { ExtendedReview } from "@/components/custom/dashboard/AudioPlayer";
import { ExtendedReview2 } from "@/components/custom/dashboard/VideoPlayer";
import { AudioPlayer } from "@/components/custom/dashboard/AudioPlayer";
import { VideoPlayer } from "@/components/custom/dashboard/VideoPlayer";

export const ReviewDetailModal = ({ review }: { review: Review }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-indigo-600 flex items-center font-medium text-sm hover:text-indigo-700 transition-all"
      >
        Details
        <ChevronRight className="h-5 w-5 ml-1" />
      </button>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          
          <div className="relative bg-white rounded-2xl max-w-3xl w-full mx-4 p-8 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="space-y-6">
              {/* Media Display */}
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                {review.mediaType === 'video' && (
                  <div className="aspect-video">
                    <VideoPlayer review={review as ExtendedReview2} />
                  </div>
                )}
                
                {review.mediaType === 'audio' && (
                  <div className="p-6">
                    <AudioPlayer review={review as ExtendedReview} />
                  </div>
                )}
                
                {review.mediaType === 'image' && (
                  <img 
                    src={review.imageUrl || ''}
                    alt={review.content}
                    className="w-full h-full object-contain max-h-[70vh]"
                  />
                )}
                
                {review.mediaType === 'text' && (
                  <div className="p-6 flex items-center justify-center text-gray-500">
                    <MessageSquare className="h-12 w-12" />
                  </div>
                )}
              </div>

              {/* Review Content */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-medium">
                      {review.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{review.name}</h3>
                      <p className="text-sm text-gray-500">{review.timeAgo}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < review.rating 
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">{review.content}</p>
                
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Badge
                    className={`px-2 py-1 rounded-full ${
                      review.status === "New" ? "bg-green-50 text-green-600" :
                      review.status === "Replied" ? "bg-blue-50 text-blue-600" :
                      review.status === "Verified" ? "bg-yellow-50 text-yellow-600" :
                      "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {review.status}
                  </Badge>
                  <span className="mx-1">•</span>
                  <div className="flex items-center space-x-1">
                    {review.mediaType === 'video' && <Film className="h-4 w-4" />}
                    {review.mediaType === 'audio' && <Volume2 className="h-4 w-4" />}
                    {review.mediaType === 'image' && <ImageIcon className="h-4 w-4" />}
                    <span className="capitalize">{review.mediaType}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
};