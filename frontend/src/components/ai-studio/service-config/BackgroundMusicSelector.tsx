// components/ai-studio/service-config/BackgroundMusicSelector.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Music, Volume2, Link, Check, Play, Pause, Waves } from "lucide-react";
import { backgroundMusicOptions } from "../constants";
import { useState, useEffect, useRef } from "react";
import { MusicConfig } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

type Props = {
  config: MusicConfig;
  updateConfig: (key: string, value: any) => void;
};

// Subtle music visualization bars
const MusicVisualization = ({ isPlaying }: { isPlaying: boolean }) => {
  const bars = [20, 35, 45, 30, 55, 25, 40, 60, 35, 45, 30, 50];

  return (
    <div className="flex items-end justify-center gap-1 h-6 px-3">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-0.5 bg-slate-400 rounded-full"
          initial={{ height: "15%" }}
          animate={{
            height: isPlaying
              ? [`15%`, `${height}%`, `${height * 0.6}%`, `${height}%`]
              : "15%",
            backgroundColor: isPlaying ? "#3b82f6" : "#94a3b8",
          }}
          transition={{
            duration: 0.7 + i * 0.08,
            repeat: isPlaying ? Infinity : 0,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const BackgroundMusicSelector = ({ config, updateConfig }: Props) => {
  const enabledKey = "add_background_music";
  const musicVolumeKey = "music_volume";
  const selectedMusicKey = "background_music";
  const customMusicKey = "custom_music_url";

  const isEnabled = config[enabledKey] || false;
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleAudioPreview = async (trackId: string, url: string) => {
    try {
      setAudioError(null);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      if (previewingTrack === trackId) {
        setPreviewingTrack(null);
        return;
      }

      console.log("Attempting to play:", url);

      const audio = new Audio();
      audio.crossOrigin = "anonymous";

      // Set volume based on user selection
      const volumeLevel = config[musicVolumeKey] || "low";
      const volumeMap = {
        low: 0.2,
        medium: 0.5,
        high: 0.8,
      };
      audio.volume = volumeMap[volumeLevel as keyof typeof volumeMap];

      audio.addEventListener("error", (e) => {
        console.error("Audio error:", e);
        setAudioError("Unable to load audio track");
        setPreviewingTrack(null);
      });

      audio.addEventListener("ended", () => {
        setPreviewingTrack(null);
      });

      audioRef.current = audio;
      audio.src = url;

      setPreviewingTrack(trackId);
      await audio.play();

      setTimeout(() => {
        if (audioRef.current === audio) {
          audio.pause();
          setPreviewingTrack(null);
        }
      }, 15000);
    } catch (error) {
      console.error("Play failed:", error);
      setAudioError("Playback failed - check browser permissions");
      setPreviewingTrack(null);
    }
  };

  const handleTrackSelect = (trackId: string) => {
    updateConfig(selectedMusicKey, trackId);
    if (config[customMusicKey]) {
      updateConfig(customMusicKey, "");
    }
  };

  const handleCustomUrlChange = (url: string) => {
    updateConfig(customMusicKey, url);
    if (config[selectedMusicKey]) {
      updateConfig(selectedMusicKey, "");
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const selectedTrack = backgroundMusicOptions?.find(
    (track) => track.id === config[selectedMusicKey]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Clean header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center">
              <Music className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Background Music
              </h3>
              <p className="text-xs text-gray-600">
                Add atmosphere to your content
              </p>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={(checked) => updateConfig(enabledKey, checked)}
            className="data-[state=checked]:bg-gray-800"
          />
        </div>
      </div>

      <AnimatePresence>
        {isEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 space-y-5"
          >
            {/* Volume Control */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-gray-200 flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-900">
                    Volume Level
                  </Label>
                  <p className="text-xs text-gray-500">
                    Background audio intensity
                  </p>
                </div>
              </div>
              <Select
                value={config[musicVolumeKey] || "low"}
                onValueChange={(value) => updateConfig(musicVolumeKey, value)}
              >
                <SelectTrigger className="w-32 h-8 text-xs bg-white border-gray-200 focus:border-blue-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "low", label: "Low", bars: 1 },
                    { value: "medium", label: "Medium", bars: 2 },
                    { value: "high", label: "High", bars: 3 },
                  ].map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 3 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-3 rounded-full ${
                                i < level.bars ? "bg-blue-500" : "bg-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium">
                          {level.label}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Display */}
            {audioError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-xs text-red-600">{audioError}</p>
              </motion.div>
            )}

            {/* Music Library */}
            {backgroundMusicOptions && backgroundMusicOptions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Waves className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-medium text-gray-900">
                    Music Library
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {backgroundMusicOptions.map((track) => {
                    const isSelected = config[selectedMusicKey] === track.id;
                    const isPreviewing = previewingTrack === track.id;

                    return (
                      <motion.div
                        key={track.id}
                        layout
                        whileHover={{ y: -1 }}
                        className={`relative p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-blue-200 bg-blue-50/50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                        }`}
                        onClick={() => handleTrackSelect(track.id)}
                      >
                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"
                          >
                            <Check className="h-3 w-3 text-white" />
                          </motion.div>
                        )}

                        <div className="space-y-3">
                          {/* Track info */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {track.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              {track.mood || track.description} •{" "}
                              {track.duration || "2:30"}
                            </p>
                          </div>

                          {/* Visualization */}
                          <div className="bg-gray-50 rounded-md">
                            <MusicVisualization isPlaying={isPreviewing} />
                          </div>

                          {/* Preview button */}
                          <Button
                            size="sm"
                            variant={isPreviewing ? "secondary" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAudioPreview(
                                track.id,
                                track.url || track.previewUrl
                              );
                            }}
                            className={`w-full h-7 text-xs ${
                              isPreviewing
                                ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                                : "border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {isPreviewing ? (
                              <>
                                <Pause className="h-3 w-3 mr-1" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3 mr-1" />
                                Preview
                              </>
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Simple divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-medium text-gray-500">
                  Custom Audio
                </span>
              </div>
            </div>

            {/* Custom URL Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-medium text-gray-900">
                  Use Your Own Track
                </Label>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="https://example.com/your-audio-file.mp3"
                    value={config[customMusicKey] || ""}
                    onChange={(e) => handleCustomUrlChange(e.target.value)}
                    className="pl-9 h-9 text-xs border-gray-200 focus:border-blue-300 rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                  <strong>Tip:</strong> Use direct links to MP3, WAV, or OGG
                  files that are publicly accessible.
                </p>
              </div>
            </div>

            {/* Selection Status */}
            {(config[selectedMusicKey] || config[customMusicKey]) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <Music className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">
                      {config[customMusicKey]
                        ? "Custom Track Selected"
                        : selectedTrack?.name}
                    </p>
                    <p className="text-xs text-green-700">
                      Volume: {config[musicVolumeKey] || "low"} • Ready for
                      processing
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-medium text-green-600">
                      Active
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default observer(BackgroundMusicSelector);
