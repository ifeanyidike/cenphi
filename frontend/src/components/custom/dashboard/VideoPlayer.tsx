
import { useState } from "react";
import { Play, Pause } from "lucide-react"; // or the appropriate library/file
import { Testimonial } from "@//types/testimonial";

// Define the ExtendedReview type
export type ExtendedTestimonial2 = Testimonial & {
  id: string;
}
// Video player component
export const VideoPlayer = ({ testimonial }: { testimonial: ExtendedTestimonial2 }) => {
    const [isPlaying, setIsPlaying] = useState(false);
  
    const togglePlay = () => {
      if (isPlaying) {
        setPlayingMedia(null);
      } else {
        setPlayingMedia(testimonial.id);
      }
      setIsPlaying(!isPlaying);
    };
  
    return (
      <div className="mt-3 rounded-lg overflow-hidden">
        <div className="relative">
          {/* Video thumbnail */}
          <div className="aspect-video bg-gray-100 relative">
          <video 
  src={(Array.isArray(testimonial.media_urls) ? testimonial.media_urls[0] : testimonial.media_urls) || "/api/placeholder/video.mp4"} 
  controls 
  className="w-full h-full object-cover"
>
  Your browser does not support the video tag.
</video>

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
            <span className="text-xs">{testimonial.view_count}</span>
          </div>
        </div>
      </div>
    );
  };

const setPlayingMedia = (mediaId: string | null) => {
  console.log(`Playing media with id: ${mediaId}`);
};
  

