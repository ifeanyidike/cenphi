import { Video } from "lucide-react";

const VideoSection = () => {
  return (
    <div className="absolute inset-0 p-6 flex flex-col text-white">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xl font-medium">Premium Video Suite</h4>
        <div className="flex items-center gap-1 text-xs bg-white/10 px-2 py-0.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>Recording</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="aspect-video bg-black/30 rounded-lg mb-4 relative flex items-center justify-center">
          <Video className="w-12 h-12 text-white/30" />
          <div className="absolute bottom-3 right-3 bg-black/60 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span>HD 1080p</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-white/70">Format</span>
            </div>
            <div className="flex gap-1 text-xs">
              <button className="px-2 py-1 bg-white/20 rounded">MP4</button>
              <button className="px-2 py-1 bg-white/10 rounded">MOV</button>
              <button className="px-2 py-1 bg-white/10 rounded">GIF</button>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-white/70">Branding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
              <div className="h-2 bg-white/20 rounded-full flex-1"></div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-white/70">Effects</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="h-5 bg-white/20 rounded"></div>
              <div className="h-5 bg-white/20 rounded"></div>
              <div className="h-5 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex justify-between">
          <button className="px-3 py-1.5 bg-white/10 text-xs rounded-lg hover:bg-white/20 transition-colors">
            Preview
          </button>
          <button className="px-3 py-1.5 bg-emerald-500/80 text-xs rounded-lg hover:bg-emerald-500 transition-colors">
            Export Video
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
