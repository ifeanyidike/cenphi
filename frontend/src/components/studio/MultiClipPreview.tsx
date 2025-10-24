import React, { useState } from "react";
import {
  Check,
  X,
  CheckCircle2,
  XCircle,
  Play,
  Save,
  Trash2,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { studioAPI } from "@/services/studioAPI";

interface Clip {
  id: string;
  title: string;
  duration: number;
  start_time: number;
  end_time: number;
  theme?: string;
  preview_url?: string;
}

interface MultiClipPreviewProps {
  clips: Clip[];
  sessionId?: string;
  stageId?: string;
  onSaveComplete?: () => void;
}

export const MultiClipPreview: React.FC<MultiClipPreviewProps> = ({
  clips,
  sessionId,
  stageId,
  onSaveComplete,
}) => {
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(
    new Set(clips.map((c) => c.id))
  );
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleClip = (clipId: string) => {
    setSelectedClipIds((prev) => {
      const next = new Set(prev);
      if (next.has(clipId)) {
        next.delete(clipId);
      } else {
        next.add(clipId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedClipIds(new Set(clips.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedClipIds(new Set());
  };

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

  const handleSaveSelected = async () => {
    if (!sessionId || !stageId) {
      setSaveError("Session ID or Stage ID is missing");
      return;
    }

    if (selectedClipIds.size === 0) {
      setSaveError("Please select at least one clip to save");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const clipIds = Array.from(selectedClipIds);
      await studioAPI.selectClips(sessionId, stageId, clipIds);
      await studioAPI.finalizeSession(sessionId, "save");

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error("[MultiClipPreview] Save failed:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save clips"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardAll = async () => {
    if (!sessionId) {
      setSaveError("Session ID is missing");
      return;
    }

    setIsDiscarding(true);
    setSaveError(null);

    try {
      await studioAPI.finalizeSession(sessionId, "discard");

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error("[MultiClipPreview] Discard failed:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to discard clips"
      );
    } finally {
      setIsDiscarding(false);
    }
  };

  const selectedDuration = clips
    .filter((c) => selectedClipIds.has(c.id))
    .reduce((sum, c) => sum + c.duration, 0);

  return (
    <div className="space-y-4">
      {/* Sophisticated Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 tracking-tight">
              New Clips Generated
            </h3>
            <p className="text-[9px] text-slate-500 font-medium">
              {selectedClipIds.size} of {clips.length} selected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={selectAll}
            disabled={selectedClipIds.size === clips.length}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 disabled:text-slate-300 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            <span className="hidden sm:inline">All</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={deselectAll}
            disabled={selectedClipIds.size === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:text-slate-300 disabled:cursor-not-allowed rounded-lg transition-all"
          >
            <XCircle className="w-3 h-3" strokeWidth={2.5} />
            <span className="hidden sm:inline">None</span>
          </motion.button>
        </div>
      </div>

      {/* Premium Clips Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clips.map((clip, index) => {
          const isSelected = selectedClipIds.has(clip.id);
          const isPlaying = playingClipId === clip.id;

          return (
            <motion.div
              key={clip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative rounded-xl border transition-all duration-300 ${
                isSelected
                  ? "border-blue-300 bg-blue-50/30 shadow-md"
                  : "border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              {/* Elegant Selection Indicator */}
              <div
                onClick={() => toggleClip(clip.id)}
                className={`absolute top-2.5 right-2.5 z-10 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-500 border-blue-500 scale-110"
                    : "bg-white border-slate-300 group-hover:border-blue-400 group-hover:scale-105"
                }`}
              >
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
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
                        <Play className="w-6 h-6 text-slate-900 ml-0.5" fill="currentColor" />
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
                <div className="flex items-center gap-2 text-[9px] mb-2.5">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-2.5 h-2.5" />
                    <span className="font-medium">{formatDuration(clip.duration)}</span>
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

                {/* Elegant Actions */}
                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleClip(clip.id)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-semibold rounded-lg transition-all ${
                      isSelected
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <Check className="w-3 h-3" strokeWidth={2.5} />
                    {isSelected ? "Selected" : "Select"}
                  </motion.button>

                  {isSelected && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleClip(clip.id)}
                      className="w-8 h-8 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Elegant Summary */}
      <AnimatePresence>
        {selectedClipIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between px-1 py-2.5 rounded-lg bg-blue-50/50 border border-blue-100"
          >
            <span className="text-[10px] font-semibold text-slate-900 tracking-tight">
              {selectedClipIds.size === clips.length
                ? "All clips selected"
                : `${selectedClipIds.size} clip${selectedClipIds.size !== 1 ? "s" : ""} selected`}
            </span>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
              <Clock className="w-3 h-3" />
              <span className="font-semibold">{formatDuration(selectedDuration)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sophisticated Actions */}
      <div className="border-t border-slate-200/60 pt-4">
        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl"
            >
              <p className="text-[10px] text-red-700 font-semibold">{saveError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveSelected}
            disabled={isSaving || isDiscarding || selectedClipIds.size === 0}
            className="flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 disabled:from-slate-300 disabled:to-slate-300 text-white shadow-md hover:shadow-lg transition-all text-[10px] font-semibold flex items-center justify-center gap-2 disabled:cursor-not-allowed tracking-tight"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                <span>Saving {selectedClipIds.size}...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Save {selectedClipIds.size} Clip{selectedClipIds.size !== 1 && "s"}</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDiscardAll}
            disabled={isSaving || isDiscarding}
            className="sm:w-auto w-full h-10 px-5 rounded-xl border-2 border-slate-300 hover:border-rose-400 hover:bg-rose-50/50 disabled:bg-slate-100 text-slate-700 hover:text-rose-700 transition-all text-[10px] font-semibold flex items-center justify-center gap-2 disabled:cursor-not-allowed tracking-tight"
          >
            {isDiscarding ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                <span>Discarding...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>Discard All</span>
              </>
            )}
          </motion.button>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[9px] text-slate-500 text-center leading-relaxed font-medium">
            Save selected • Discard deletes all from storage
          </p>
        </div>
      </div>
    </div>
  );
};
