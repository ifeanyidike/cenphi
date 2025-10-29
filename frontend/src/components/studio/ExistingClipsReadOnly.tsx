import React, { useState } from "react";
import {
  CheckCircle,
  Play,
  ExternalLink,
  RotateCcw,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";

interface Clip {
  id: string;
  title: string;
  duration: number;
  start_time: number;
  end_time: number;
  theme?: string;
  preview_url?: string;
}

interface ExistingClipsReadOnlyProps {
  clips: Clip[];
  onViewAllClips?: () => void; // Navigate to clips tab
  onGenerateNew?: () => void; // Start new clipping session
  onClose?: () => void; // Close the session
}

export const ExistingClipsReadOnly: React.FC<ExistingClipsReadOnlyProps> = ({
  clips,
  onViewAllClips,
  onGenerateNew,
  onClose,
}) => {
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVideoPlay = (clipId: string) => {
    setPlayingClipId(clipId);
  };

  const handleVideoPause = () => {
    setPlayingClipId(null);
  };

  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);

  return (
    <div className="space-y-4">
      {/* Premium Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-white to-blue-50/30" />
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-slate-900 mb-1 tracking-tight">
                Clips Already Saved
              </h3>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {clips.length} clip{clips.length === 1 ? "" : "s"}{" "}
                {clips.length === 1 ? "is" : "are"} already processed and saved
                to permanent storage. View or generate new variants.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Elegant Stats Bar */}
      <div className="flex items-center justify-between px-1 py-2 rounded-lg bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-semibold text-slate-900 tracking-tight">
            {clips.length} Clip{clips.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
          <Clock className="w-3 h-3" />
          <span className="font-medium">{formatDuration(totalDuration)}</span>
        </div>
      </div>

      {/* Premium Clips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clips.map((clip, index) => {
          const isPlaying = playingClipId === clip.id;

          return (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative rounded-xl border border-slate-200/70 bg-white hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Elegant Saved Badge */}
              <div className="absolute top-2.5 right-2.5 z-10">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500 shadow-md">
                  <CheckCircle
                    className="w-2.5 h-2.5 text-white"
                    strokeWidth={2.5}
                  />
                  <span className="text-[8px] text-white font-bold tracking-wide uppercase">
                    Saved
                  </span>
                </div>
              </div>

              {/* Video Preview with Enhanced Overlay */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-950 rounded-t-xl overflow-hidden">
                {clip.preview_url ? (
                  <video
                    src={clip.preview_url}
                    className="w-full h-full object-cover"
                    controls={false}
                    onPlay={() => handleVideoPlay(clip.id)}
                    onPause={handleVideoPause}
                    onClick={(e) => {
                      const video = e.currentTarget;
                      if (video.paused) {
                        video.play();
                      } else {
                        video.pause();
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                      <Play className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                )}

                {/* Sophisticated Play Overlay */}
                {clip.preview_url && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                    {!isPlaying && (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileHover={{ scale: 1, opacity: 1 }}
                        className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-xl"
                      >
                        <Play
                          className="w-6 h-6 text-slate-900 ml-0.5"
                          fill="currentColor"
                        />
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Refined Clip Info */}
              <div className="p-3">
                <h4 className="text-[10px] font-semibold text-slate-900 line-clamp-1 mb-1.5 tracking-tight">
                  {clip.title}
                </h4>
                <div className="flex items-center gap-2 text-[9px]">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-2.5 h-2.5" />
                    <span className="font-medium">
                      {formatDuration(clip.duration)}
                    </span>
                  </div>
                  {clip.theme && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="capitalize text-slate-500 truncate font-medium">
                        {clip.theme}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sophisticated Action Section */}
      <div className="border-t border-slate-200/60 pt-4 mt-1">
        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          {onViewAllClips && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewAllClips}
              className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white shadow-md hover:shadow-lg transition-all text-[10px] font-semibold flex items-center justify-center gap-2 tracking-tight"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>View All Clips</span>
            </motion.button>
          )}

          {onGenerateNew && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGenerateNew}
              className="flex-1 h-10 px-4 rounded-xl border-2 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-700 transition-all text-[10px] font-semibold flex items-center justify-center gap-2 tracking-tight"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>Generate New</span>
            </motion.button>
          )}

          {onClose && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="sm:w-auto w-full h-10 px-5 rounded-xl border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 hover:text-slate-800 transition-all text-[10px] font-semibold tracking-tight"
            >
              Close
            </motion.button>
          )}
        </div>

        {/* Refined Info Text */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[9px] text-slate-500 text-center leading-relaxed font-medium">
            Permanently saved • Available in Clips tab
          </p>
        </div>
      </div>
    </div>
  );
};
