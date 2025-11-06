import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Play,
  AlertTriangle,
  Hash,
  Clock,
  FileText,
  RotateCcw,
  Save,
} from "lucide-react";
import { MultiClipPreview } from "../MultiClipPreview";
import { ExistingClipsReadOnly } from "../ExistingClipsReadOnly";
import { MixedClipsPreview } from "../MixedClipsPreview";
import { ProcessingStage, PreviewArtifact } from "@/hooks/useSessionSSE";
import SaveFromStageModal from "../SaveFromStageModal";

interface PreviewSectionProps {
  stages: ProcessingStage[];
  latestPreview: PreviewArtifact | null;
  currentStage: ProcessingStage | null;
  previewError: string | null;
  sessionId: string;
  selectedStageId: string | null; // NEW: Which stage preview to show
  onCopyPreviewUrl: () => void;
  setPreviewError: (error: string | null) => void;
  onRegenerateText?: (stageId: string) => void;
  onClipsSaveComplete?: () => void; // Callback when clips are saved
  testimonialId?: string; // Optional testimonial ID for navigation
  onShowError?: (message: string, type?: "error" | "success" | "info") => void; // Show error/success modal
  onUpdateStageConfig?: (stageId: string, config: Record<string, any>) => void; // Update stage configuration
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
  stages,
  latestPreview,
  currentStage,
  previewError,
  sessionId,
  selectedStageId,
  onCopyPreviewUrl,
  setPreviewError,
  onRegenerateText,
  onClipsSaveComplete,
  testimonialId,
  onShowError,
  // onUpdateStageConfig,
}) => {
  const navigate = useNavigate();
  const selectedStage = selectedStageId
    ? stages.find((s) => s.stage_id === selectedStageId)
    : null;

  // Use selected stage's preview if available, otherwise fall back to latest
  const previewToShow: PreviewArtifact | null = selectedStage?.metadata
    ?.preview_url
    ? {
        id: selectedStage.id || "",
        session_id: sessionId,
        stage_id: selectedStage.stage_id,
        storage_path: selectedStage.metadata.storage_path || "",
        preview_url: selectedStage.metadata.preview_url,
        artifact_type:
          (selectedStage.metadata?.artifact_type as
            | "video"
            | "audio"
            | "image"
            | "json") || "video",
        file_size_bytes: selectedStage.metadata?.file_size_bytes,
        metadata: selectedStage.metadata || {},
        created_at: selectedStage.completed_at || new Date().toISOString(),
      }
    : latestPreview;

  // Calculate aspect ratio from the SELECTED stage, not latestPreview
  const getPreviewAspectRatio = (): string => {
    // Use selected stage metadata if available, otherwise use latest preview
    const metadataToUse = selectedStage?.metadata || latestPreview?.metadata;

    // Priority 1: Check for aspect_ratio field
    if (
      metadataToUse?.aspect_ratio &&
      typeof metadataToUse.aspect_ratio === "string"
    ) {
      return metadataToUse.aspect_ratio.replace(":", "/");
    }

    // Priority 2: Calculate from width and height
    const { width, height } = metadataToUse || {};
    if (width && height) {
      return `${width}/${height}`;
    }

    // Default to 16/9
    console.warn(
      "[PreviewSection] No aspect ratio in metadata, using default 16/9. Stage:",
      selectedStage?.stage_id || "latest"
    );
    return "16/9";
  };

  // Check if viewing a previous stage (not the latest)
  const latestStageWithPreview = [...stages]
    .reverse()
    .find(
      (s) =>
        (s.status === "completed" ||
          s.status === "accepted" ||
          s.status === "reviewing") &&
        s.metadata?.preview_url
    );
  const isViewingPreviousStage =
    selectedStageId &&
    latestStageWithPreview &&
    selectedStageId !== latestStageWithPreview.stage_id;

  // Check if current stage has text optimization data
  const textOptimizationStage = stages.find(
    (s) => s.stage_id === "text_optimization" && s.metadata?.optimized_text
  );
  const hasTextOptimization = !!textOptimizationStage?.metadata?.optimized_text;

  // State for Save from This Stage modal
  const [showSaveFromStageModal, setShowSaveFromStageModal] = useState(false);

  // Calculate subsequent stages count
  const selectedStageIndex = selectedStageId
    ? stages.findIndex((s) => s.stage_id === selectedStageId)
    : -1;
  const subsequentStagesCount =
    selectedStageIndex >= 0 ? stages.length - selectedStageIndex - 1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      {/* Previous Stage Warning Banner */}
      {isViewingPreviousStage && selectedStage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-lg p-3"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-amber-900 font-semibold leading-tight">
                Viewing Previous Stage
              </p>
              <p className="text-[9px] text-amber-700 mt-0.5 leading-relaxed">
                You're viewing:{" "}
                <span className="font-medium">
                  {selectedStage.display_name}
                </span>
                . You can save from this stage or switch to the latest to
                continue processing.
              </p>
            </div>
            <button
              onClick={() => setShowSaveFromStageModal(true)}
              className="flex-shrink-0 h-7 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg text-[9px] font-semibold transition-all flex items-center gap-1.5"
            >
              <Save className="h-3 w-3" />
              Save from Here
            </button>
          </div>
        </motion.div>
      )}

      {/* Render preview based on type */}
      {(() => {
        // Check for multi-clip preview first (only when viewing extract_clips stage)
        const isViewingClipsStage = selectedStageId === "extract_clips";
        const extractClipsStage = stages.find(
          (s) => s.stage_id === "extract_clips"
        );
        const clips = extractClipsStage?.metadata?.clips;
        const hasClips = clips && Array.isArray(clips) && clips.length > 0;

        // Extract metadata flags
        const hasMixedClips =
          extractClipsStage?.metadata?.has_mixed_clips === true;
        const clipsSource = extractClipsStage?.metadata?.clips_source;
        const clipsAreNew =
          extractClipsStage?.metadata?.clips_are_new !== false;
        const existingClipsCount =
          extractClipsStage?.metadata?.existing_clips_count || 0;
        const newClipsCount = extractClipsStage?.metadata?.new_clips_count || 0;

        if (isViewingClipsStage && hasClips) {
          // PRIORITY 1: Mixed scenario - some existing, some new
          if (hasMixedClips || clipsSource === "mixed") {
            return (
              <MixedClipsPreview
                clips={clips.map((clip: any) => ({
                  id: clip.id,
                  title: clip.title || clip.theme || `Clip ${clip.id}`,
                  duration: clip.duration || 0,
                  start_time: clip.start_time || 0,
                  end_time: clip.end_time || 0,
                  theme: clip.theme || "",
                  preview_url: clip.url,
                  existing_artifact: clip.existing_artifact || false,
                }))}
                existingCount={existingClipsCount}
                newCount={newClipsCount}
                sessionId={sessionId}
                stageId={extractClipsStage.stage_id}
                testimonialId={testimonialId}
                onSaveComplete={onClipsSaveComplete}
                onViewAllClips={() => {
                  // Navigate to testimonial details clipping tab
                  if (testimonialId) {
                    navigate(
                      `/detail/${testimonialId}?tab=artifacts&artifactTab=clipping`
                    );
                  } else {
                    console.warn(
                      "[PreviewSection] No testimonialId available for navigation"
                    );
                  }
                }}
                onError={(message) => {
                  if (onShowError) {
                    onShowError(message, "error");
                  }
                }}
                onSuccess={(message) => {
                  if (onShowError) {
                    onShowError(message, "success");
                  }
                }}
              />
            );
          }

          // PRIORITY 2: All new temporary clips - show save/discard interface
          if (clipsAreNew || clipsSource === "new") {
            return (
              <MultiClipPreview
                clips={clips.map((clip: any) => ({
                  id: clip.id,
                  title: clip.title || clip.theme || `Clip ${clip.id}`,
                  duration: clip.duration || 0,
                  start_time: clip.start_time || 0,
                  end_time: clip.end_time || 0,
                  theme: clip.theme || "",
                  preview_url: clip.url,
                }))}
                sessionId={sessionId}
                stageId={extractClipsStage.stage_id}
                onSaveComplete={onClipsSaveComplete}
              />
            );
          }

          // PRIORITY 3: All existing permanent clips - show read-only info
          return (
            <ExistingClipsReadOnly
              clips={clips.map((clip: any) => ({
                id: clip.id,
                title: clip.title || clip.theme || `Clip ${clip.id}`,
                duration: clip.duration || 0,
                start_time: clip.start_time || 0,
                end_time: clip.end_time || 0,
                theme: clip.theme || "",
                preview_url: clip.url,
              }))}
              onViewAllClips={() => {
                // Navigate to testimonial details clipping tab
                if (testimonialId) {
                  navigate(
                    `/detail/${testimonialId}?tab=artifacts&artifactTab=clipping`
                  );
                } else {
                  console.warn(
                    "[PreviewSection] No testimonialId available for navigation"
                  );
                }
              }}
              onGenerateNew={() => {
                // Restart clipping session to generate new clips
                console.log(
                  "[PreviewSection] Generate new clips - restart session"
                );
                if (onClipsSaveComplete) {
                  onClipsSaveComplete(); // Close current session
                }
              }}
              onClose={() => {
                // Close session without taking action
                console.log("[PreviewSection] Close existing clips view");
                if (onClipsSaveComplete) {
                  onClipsSaveComplete();
                }
              }}
            />
          );
        }

        // Single preview fallback
        return (
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg overflow-hidden border border-slate-200/40 shadow-inner"
            style={{ aspectRatio: getPreviewAspectRatio() }}
          >
            {previewError ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
                <p className="text-[11px] text-white font-semibold">
                  Failed to load preview
                </p>
                <p className="text-[10px] text-slate-300 mt-1">
                  {previewError}
                </p>
                {previewToShow?.preview_url && (
                  <button
                    onClick={onCopyPreviewUrl}
                    className="mt-3 text-[10px] text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Copy Preview URL
                  </button>
                )}
              </div>
            ) : !previewToShow || !previewToShow.preview_url ? (
              <div className="w-full h-full flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <Play className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {currentStage?.stage_id === "generate_highlights"
                      ? "Highlights generated - ready for clipping"
                      : selectedStageId
                        ? "No preview available for this stage"
                        : "Preview will appear after processing"}
                  </p>
                </div>
              </div>
            ) : previewToShow.artifact_type === "video" ? (
              <video
                key={previewToShow.preview_url} // Force re-render on preview change
                src={previewToShow.preview_url}
                controls
                preload="metadata"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error("[PreviewSection] Video load error:", e);
                  setPreviewError("Could not load video preview");
                }}
                onLoadStart={() =>
                  console.log("[PreviewSection] Video loading started")
                }
                onCanPlay={() => console.log("[PreviewSection] Video can play")}
              />
            ) : (
              <img
                key={previewToShow.preview_url} // Force re-render on preview change
                src={previewToShow.preview_url}
                alt="Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error("[PreviewSection] Image load error:", e);
                  setPreviewError("Could not load image preview");
                }}
                onLoad={() =>
                  console.log("[PreviewSection] Image loaded successfully")
                }
              />
            )}
          </div>
        );
      })()}

      {/* Preview Metadata & Actions */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/40 rounded-lg p-3 border border-slate-200/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-slate-900 mb-1">
              {selectedStage?.display_name ||
                currentStage?.display_name ||
                "Processing"}
            </p>
            {selectedStage ? (
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {selectedStage.message || "Stage completed successfully"}
              </p>
            ) : currentStage?.message ? (
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {currentStage.message}
              </p>
            ) : (
              !currentStage &&
              previewToShow && (
                <p className="text-[10px] text-slate-600">
                  Ready for next step
                </p>
              )
            )}
          </div>

          {/* Save from This Stage button - always visible when a stage is selected */}
          {selectedStage && selectedStage.metadata?.preview_url && (
            <button
              onClick={() => setShowSaveFromStageModal(true)}
              className="flex-shrink-0 h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg text-[9px] font-semibold transition-all flex items-center gap-1.5"
              title="Save results from this stage"
            >
              <Save className="h-3.5 w-3.5" />
              Save This Stage
            </button>
          )}
        </div>
      </div>

      {/* Text Optimization Display (below video preview) */}
      {hasTextOptimization && textOptimizationStage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100/40 px-4 py-3 border-b border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-600" />
              <h3 className="text-[11px] font-semibold text-slate-900">
                Optimized Text Content
              </h3>
              {textOptimizationStage.metadata?.platform && (
                <span className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {textOptimizationStage.metadata.platform}
                </span>
              )}
            </div>
            {textOptimizationStage.metadata?.can_regenerate &&
              onRegenerateText && (
                <button
                  onClick={() =>
                    onRegenerateText(textOptimizationStage.stage_id)
                  }
                  className="h-7 px-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-medium transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" />
                  Regenerate
                </button>
              )}
          </div>

          {/* Optimized Text Content */}
          <div className="p-4">
            <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-200/40">
              <p className="text-[11px] text-slate-900 leading-relaxed whitespace-pre-wrap">
                {textOptimizationStage.metadata?.optimized_text}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Hashtags */}
              {textOptimizationStage.metadata?.hashtags &&
                Array.isArray(textOptimizationStage.metadata.hashtags) &&
                textOptimizationStage.metadata.hashtags.length > 0 && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Hash className="h-3.5 w-3.5 text-slate-600" />
                      <span className="text-[10px] font-semibold text-slate-700">
                        Hashtags
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {textOptimizationStage.metadata.hashtags.map(
                        (tag: string, i: number) => (
                          <span
                            key={i}
                            className="text-[9px] px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-100"
                          >
                            #{tag}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Optimal Timing */}
              {textOptimizationStage.metadata?.optimal_timing && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-[10px] font-semibold text-slate-700">
                      Best Time to Post
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    {textOptimizationStage.metadata.optimal_timing}
                  </p>
                </div>
              )}

              {/* Character Count */}
              {textOptimizationStage.metadata?.character_count && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <FileText className="h-3.5 w-3.5 text-slate-600" />
                    <span className="text-[10px] font-semibold text-slate-700">
                      Character Count
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    {textOptimizationStage.metadata.character_count} characters
                  </p>
                </div>
              )}
            </div>

            {/* Specifications */}
            {textOptimizationStage.metadata?.specifications && (
              <div className="mt-4 pt-4 border-t border-slate-200/60">
                <p className="text-[10px] font-semibold text-slate-700 mb-2">
                  Specifications
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(
                    textOptimizationStage.metadata.specifications
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-[9px]"
                    >
                      <span className="text-slate-600 capitalize">
                        {key.replace(/_/g, " ")}:
                      </span>
                      <span className="text-slate-900 font-medium">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Save from This Stage Modal */}
      {showSaveFromStageModal && selectedStage && (
        <SaveFromStageModal
          sessionId={sessionId}
          selectedStage={selectedStage}
          totalStages={stages.length}
          subsequentStagesCount={subsequentStagesCount}
          onClose={() => setShowSaveFromStageModal(false)}
        />
      )}
    </motion.div>
  );
};
