// export default VideoPlayer;

import { useState, useRef } from "react";
import { Play } from "lucide-react";
import { Testimonial } from "@/types/testimonial";

export const VideoPlayer = ({ testimonial }: { testimonial: Testimonial }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-lg border border-gray-700 bg-gray-900">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={(Array.isArray(testimonial.media_urls) ? testimonial.media_urls[0] : testimonial.media_urls) || "/api/placeholder/video.mp4"}
          className="w-full h-full object-cover rounded-t-2xl"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
        />

        {/* Play Button */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-50 transition-all"
          >
            <div className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full shadow-lg">
              <Play className="h-6 w-6" />
            </div>
          </button>
        )}
      </div>

      {/* Video Info */}
      <div className="px-3 py-2 bg-gray-800 flex justify-between items-center text-xs text-gray-300">
        <span>{isPlaying ? "Playing..." : "Testimonial Video"}</span>
        <span>{testimonial.view_count} views</span>
      </div>
    </div>
  );
};

export default VideoPlayer;
