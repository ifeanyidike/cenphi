// Audio player component
import { useState } from "react";
import { Volume2, Play, Pause } from "lucide-react";
import { Review } from "@/types/types";

// Define or import the ExtendedReview type

export type ExtendedReview = Review & {
  id: string;
  duration: string;
  audioUrl: string;
  thumbnailUrl: string;
}

export const AudioPlayer = ({ review }: { review: ExtendedReview }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress] = useState(0);

  const togglePlay = () => {
    if (isPlaying) {
      setPlayingMedia(null);
    } else {
      setPlayingMedia(review.id);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="mt-3 bg-gray-50 rounded-lg p-3">
      <div className="flex items-center">
        <button 
          onClick={togglePlay}
          className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        
        <div className="ml-2 flex-1">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-2 bg-purple-600 rounded-full"
              style={{ width: `${isPlaying ? progress : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{isPlaying ? "Playing..." : "Audio review"}</span>
            <span>{review.duration}</span>
          </div>
        </div>
        
        <Volume2 className="h-4 w-4 ml-3 text-gray-500" />
      </div>
    </div>
  );
};

function setPlayingMedia(arg0: string | null) {
  console.log(`Playing media ID: ${arg0}`);
}
