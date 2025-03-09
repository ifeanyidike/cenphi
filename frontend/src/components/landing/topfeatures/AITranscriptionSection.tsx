import { Video } from "lucide-react";

const AITranscriptionSection = () => {
  return (
    <div className="absolute inset-0 p-6 flex flex-col text-white">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xl font-medium">AI Transcription</h4>
        <div className="bg-white/10 text-xs px-2 py-1 rounded-full">
          <span>Processing</span>
        </div>
      </div>

      <div className="flex gap-4 flex-1">
        <div className="w-1/2 bg-white/10 rounded-lg p-4 flex flex-col">
          <div className="bg-white/10 aspect-video rounded mb-3 flex items-center justify-center">
            <Video className="w-10 h-10 text-white/50" />
          </div>
          <div className="text-xs text-white/70 mb-2">
            Testimonial - Sarah C.
          </div>
          <div className="flex items-center gap-2 text-xs mt-auto">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>Ready to convert</span>
          </div>
        </div>

        <div className="w-1/2 bg-white/10 rounded-lg p-4 flex flex-col">
          <div className="space-y-2">
            <div className="h-2 bg-white/20 rounded-full w-full"></div>
            <div className="h-2 bg-white/20 rounded-full w-5/6"></div>
            <div className="h-2 bg-white/20 rounded-full w-full"></div>
            <div className="h-2 bg-white/20 rounded-full w-4/6"></div>
            <div className="h-2 bg-white/20 rounded-full w-5/6"></div>
            <div className="h-2 bg-white/20 rounded-full w-3/6"></div>
            <div className="h-2 bg-white/20 rounded-full w-full"></div>
            <div className="h-2 bg-white/20 rounded-full w-5/6"></div>
            <div className="h-2 bg-white/20 rounded-full w-4/6"></div>
          </div>
          <div className="bg-blue-400/30 rounded mt-4 p-2 text-xs">
            AI detected: 96% positive sentiment
          </div>
          <div className="flex items-center justify-between mt-4 text-xs">
            <span className="text-white/70">Auto-generated tags:</span>
            <div className="flex gap-1">
              <span className="px-2 py-0.5 bg-white/10 rounded-full">
                Product
              </span>
              <span className="px-2 py-0.5 bg-white/10 rounded-full">UX</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITranscriptionSection;
