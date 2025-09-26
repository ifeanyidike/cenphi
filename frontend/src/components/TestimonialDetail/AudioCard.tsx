import { useRef, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Check, Copy, Download, ExternalLink, Mic } from "lucide-react";
import { formatTime } from "@/utils/time-utils";
import { Button } from "../ui/button";
import { TestimonialArtifact } from "@/types/testimonial";

interface NarrationData {
  audio_url: string;
  duration: number;
  voice_provider: string;
  voice_id: string;
  quality_score: number;
}

interface AudioCardProps {
  artifact: TestimonialArtifact;
  onDownload: (url: string, filename: string) => void;
  onCopyToClipboard: (url: string, key: string) => void;
  copiedItems: Set<string>;
}

interface AudioCardProps {
  artifact: TestimonialArtifact;
  onDownload: (url: string, filename: string) => void;
  onCopyToClipboard: (url: string, key: string) => void;
  copiedItems: Set<string>;
}

const AudioCard: React.FC<AudioCardProps> = ({
  artifact,
  onDownload,
  onCopyToClipboard,
  copiedItems,
}) => {
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const data = artifact.data as NarrationData;

  const handleLoadedMetadata = (): void => {
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      setAudioDuration(duration);
      setIsLoading(false);
      console.log("Audio duration from element:", duration);
    }
  };

  const handleLoadStart = (): void => {
    setIsLoading(true);
  };

  const handleError = (): void => {
    setIsLoading(false);
    console.error("Failed to load audio metadata");
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mic className="h-5 w-5 text-purple-600" />
            Narration Audio
          </h4>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
          <audio
            ref={audioRef}
            src={data.audio_url}
            controls
            className="w-full"
            onLoadedMetadata={handleLoadedMetadata}
            onLoadStart={handleLoadStart}
            onError={handleError}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Duration:</span>
            {isLoading ? (
              <p className="font-medium text-gray-400">Loading...</p>
            ) : (
              <div>
                <p className="font-medium">
                  {audioDuration ? formatTime(audioDuration) : "00:00"}
                  <span className="text-xs text-gray-500 ml-1">
                    (from audio)
                  </span>
                </p>
                {data.duration && (
                  <p className="text-xs text-gray-400">
                    Backend: {formatTime(data.duration)}
                  </p>
                )}
              </div>
            )}
          </div>
          <div>
            <span className="text-gray-600">Voice ID:</span>
            <p className="font-medium capitalize">{data.voice_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(data.audio_url, "narration-audio.mp3")}
            className="flex-1"
          >
            <Download className="h-3 w-3 mr-1" />
            Download Audio
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onCopyToClipboard(data.audio_url, `narration-${artifact.id}`)
            }
          >
            {copiedItems.has(`narration-${artifact.id}`) ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(data.audio_url, "_blank")}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AudioCard;
