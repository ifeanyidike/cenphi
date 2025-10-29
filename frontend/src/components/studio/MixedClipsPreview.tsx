import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Sparkles,
  Play,
  Clock,
  ExternalLink,
  Save,
  X,
  ChevronRight,
} from "lucide-react";
import { studioAPI } from "@/services/studioAPI";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";

interface Clip {
  id: string;
  title: string;
  duration: number;
  start_time: number;
  end_time: number;
  theme: string;
  preview_url: string;
  existing_artifact?: boolean;
}

interface MixedClipsPreviewProps {
  clips: Clip[];
  existingCount: number;
  newCount: number;
  sessionId: string;
  stageId: string; // Required to select clips before saving
  testimonialId?: string; // For cache invalidation after save
  onSaveComplete?: () => void;
  onViewAllClips?: () => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
}

export const MixedClipsPreview: React.FC<MixedClipsPreviewProps> = observer(({
  clips,
  existingCount,
  newCount,
  sessionId,
  stageId,
  testimonialId,
  onSaveComplete,
  onViewAllClips,
  onError,
  onSuccess,
}) => {
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const existingClips = clips.filter((clip) => clip.existing_artifact);
  const newClips = clips.filter((clip) => !clip.existing_artifact);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeRange = (start: number, end: number): string => {
    return `${formatDuration(start / 1000)} - ${formatDuration(end / 1000)}`;
  };

  const handleSaveNewClips = async () => {
    setIsSaving(true);
    try {
      // CRITICAL: Select only the NEW clips before finalizing
      // The backend needs to know which clips to save
      const newClipIds = newClips.map(clip => clip.id);

      console.log("[MixedClipsPreview] Selecting new clips:", newClipIds);
      await studioAPI.selectClips(sessionId, stageId, newClipIds);

      // Now finalize the session to save the selected clips
      const result = await studioAPI.finalizeSession(sessionId, "save", {
        preserveSources: true,
      });

      console.log("[MixedClipsPreview] Clips saved successfully:", result);

      // CRITICAL: Invalidate testimonial cache to force refetch with new clips
      if (testimonialId) {
        console.log("[MixedClipsPreview] Invalidating cache for testimonial:", testimonialId);
        workspaceHub.testimonialManager.invalidateCache(testimonialId);
      }

      if (onSuccess) {
        onSuccess(
          `Successfully saved ${newCount} new clip${newCount !== 1 ? "s" : ""}!`
        );
      }

      if (onSaveComplete) {
        onSaveComplete();
      }
    } catch (error) {
      console.error("[MixedClipsPreview] Error saving clips:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save clips";

      if (onError) {
        onError(errorMessage + ". Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClip =
    clips.find((c) => c.id === selectedClipId) || newClips[0] || clips[0];

  return (
    <div className="space-y-4">
      {/* Premium Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white to-emerald-50/30" />
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-semibold text-slate-900 mb-1 tracking-tight">
                Mixed Results
              </h3>
              <p className="text-[10px] text-slate-600 leading-relaxed mb-2.5">
                {existingCount} saved clip{existingCount !== 1 ? "s" : ""} • {newCount} new clip{newCount !== 1 ? "s" : ""} ready to save
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200/60 rounded-md">
                  <CheckCircle className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                  <span className="text-[9px] font-semibold text-emerald-700">
                    {existingCount} Saved
                  </span>
                </div>
                {newCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 rounded-md shadow-sm">
                    <Sparkles className="w-3 h-3 text-white" strokeWidth={2.5} />
                    <span className="text-[9px] font-bold text-white tracking-wide">
                      {newCount} NEW
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Video Preview */}
        <div className="lg:col-span-2 order-1 lg:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedClip.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-2 sm:space-y-2.5"
            >
              {/* Video Player */}
              <div className="relative rounded-lg overflow-hidden bg-slate-950 shadow-lg border border-slate-200/50">
                <video
                  key={selectedClip.preview_url}
                  src={selectedClip.preview_url}
                  controls
                  autoPlay
                  className="w-full aspect-video object-contain"
                  onError={(e) => {
                    console.error("Video load error:", e);
                  }}
                />
                {/* Status Badge */}
                <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5">
                  {selectedClip.existing_artifact ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/95 backdrop-blur-sm rounded border border-slate-200 shadow-sm">
                      <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                      <span className="text-[9px] sm:text-[10px] font-medium text-slate-700">
                        Saved
                      </span>
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-blue-500 rounded shadow-sm">
                      <span className="text-[9px] sm:text-[10px] font-medium text-white">
                        New
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Clip Details */}
              <div className="bg-white rounded-lg border border-slate-200/60 p-3 sm:p-3.5">
                <div className="flex items-start justify-between mb-2.5 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] sm:text-xs font-semibold text-slate-900 mb-1">
                      {selectedClip.title ||
                        selectedClip.theme ||
                        "Untitled Clip"}
                    </h3>
                    {selectedClip.theme && (
                      <p className="text-[10px] sm:text-[11px] text-slate-500 capitalize">
                        {selectedClip.theme}
                      </p>
                    )}
                  </div>
                  {selectedClip.existing_artifact && onViewAllClips && (
                    <button
                      onClick={onViewAllClips}
                      className="flex-shrink-0 flex items-center gap-1 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded border border-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="hidden sm:inline">View All</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">Duration</span>
                    <p className="text-[10px] sm:text-[11px] text-slate-900 font-semibold mt-0.5">
                      {formatDuration(selectedClip.duration)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">
                      Time Range
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-slate-900 font-semibold mt-0.5">
                      {formatTimeRange(
                        selectedClip.start_time,
                        selectedClip.end_time
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Clips List */}
        <div className="lg:col-span-1 space-y-2.5 sm:space-y-3 order-2 lg:order-1">
          {/* Existing Clips */}
          {existingClips.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h4 className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Existing
                </h4>
                {onViewAllClips && (
                  <button
                    onClick={onViewAllClips}
                    className="text-[9px] sm:text-[10px] text-slate-500 hover:text-slate-700 font-medium flex items-center gap-0.5 transition-colors"
                  >
                    View All
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {existingClips.map((clip, index) => (
                  <motion.button
                    key={clip.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedClipId(clip.id)}
                    className={`w-full text-left p-2 sm:p-2.5 rounded-md border transition-all ${
                      selectedClipId === clip.id
                        ? "border-slate-300 bg-slate-50 shadow-sm"
                        : "border-slate-200/60 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-14 h-10 sm:w-16 sm:h-11 bg-slate-900 rounded overflow-hidden relative group">
                        {clip.preview_url ? (
                          <video
                            src={clip.preview_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Play className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Play className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute top-0.5 right-0.5">
                          <CheckCircle className="w-3 h-3 text-emerald-500 bg-white/90 rounded-full" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-medium text-slate-900 truncate mb-1">
                          {clip.title || clip.theme || `Clip ${index + 1}`}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{formatDuration(clip.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* New Clips */}
          {newClips.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <h4 className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  New
                </h4>
                <span className="text-[9px] sm:text-[10px] text-blue-600 font-medium">
                  Unsaved
                </span>
              </div>
              <div className="space-y-1.5">
                {newClips.map((clip, index) => (
                  <motion.button
                    key={clip.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (existingClips.length + index) * 0.05 }}
                    onClick={() => setSelectedClipId(clip.id)}
                    className={`w-full text-left p-2 sm:p-2.5 rounded-md border transition-all ${
                      selectedClipId === clip.id
                        ? "border-blue-300 bg-blue-50/50 shadow-sm"
                        : "border-slate-200/60 bg-white hover:border-blue-200 hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-14 h-10 sm:w-16 sm:h-11 bg-slate-900 rounded overflow-hidden relative group">
                        {clip.preview_url ? (
                          <video
                            src={clip.preview_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Play className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Play className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="absolute top-0.5 right-0.5">
                          <div className="px-1.5 py-0.5 bg-blue-500 rounded text-[8px] font-semibold text-white">
                            NEW
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-[11px] font-medium text-slate-900 truncate mb-1">
                          {clip.title || clip.theme || `Clip ${index + 1}`}
                        </p>
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-slate-500">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <span>{formatDuration(clip.duration)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sophisticated Action Section */}
      {newClips.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-slate-200/60 pt-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-gradient-to-r from-blue-50/30 to-slate-50/50 rounded-xl border border-slate-200/60"
          >
            <div className="flex-1">
              <p className="text-[10px] font-semibold text-slate-900 mb-1 tracking-tight">
                Save {newCount} New Clip{newCount !== 1 ? "s" : ""}
              </p>
              <p className="text-[9px] text-slate-600 leading-relaxed font-medium">
                {existingCount > 0 && `${existingCount} already saved • `}
                {newCount} awaiting confirmation
              </p>
            </div>
            <div className="flex items-stretch gap-2.5">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (onSaveComplete) onSaveComplete();
                }}
                className="px-4 h-10 text-[10px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-300 hover:border-slate-400 transition-all flex items-center justify-center gap-2 tracking-tight"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>Discard</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSaveNewClips}
                disabled={isSaving}
                className="px-5 h-10 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-[10px] font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-tight"
              >
                <Save className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>{isSaving ? "Saving..." : `Save ${newCount}`}</span>
              </motion.button>
            </div>
          </div>

          {/* Info Text */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-[9px] text-slate-500 text-center leading-relaxed font-medium">
              New clips will be saved to permanent storage
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
});
