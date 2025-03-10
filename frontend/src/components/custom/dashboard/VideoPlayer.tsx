
import React, { useState } from "react";
import { Play, Pause } from "lucide-react"; // or the appropriate library/file

// Define the ExtendedReview type
interface ExtendedReview {
  id: string;
  name: string;
  thumbnailUrl: string;
  duration: string;
}
// Video player component
export const VideoPlayer = ({ review }: { review: ExtendedReview }) => {
    const [isPlaying, setIsPlaying] = useState(false);
  
    const togglePlay = () => {
      if (isPlaying) {
        setPlayingMedia(null);
      } else {
        setPlayingMedia(review.id);
      }
      setIsPlaying(!isPlaying);
    };
  
    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        <div className="relative">
          {/* Video thumbnail */}
          <div className="aspect-video bg-gray-100 relative">
            <img 
              src={review.thumbnailUrl || "/api/placeholder/320/180"} 
              alt={`${review.name}'s video review`}
              className="w-full h-full object-cover"
            />
            {!isPlaying && (
              <button 
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-colors"
              >
                <div className="p-3 bg-purple-600 text-white rounded-full">
                  <Play className="h-5 w-5" />
                </div>
              </button>
            )}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <button 
                  onClick={togglePlay}
                  className="p-3 bg-purple-600 text-white rounded-full"
                >
                  <Pause className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
          {/* Video controls */}
          <div className="bg-gray-800 text-white px-3 py-2 flex justify-between items-center">
            <span className="text-xs">{isPlaying ? "Playing..." : "Video review"}</span>
            <span className="text-xs">{review.duration}</span>
          </div>
        </div>
      </div>
    );
  };

const setPlayingMedia = (mediaId: string | null) => {
  console.log(`Playing media with id: ${mediaId}`);
};
  