import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  SkipForward,
  Eye,
  Clock,
} from "lucide-react";
import { ProcessingStage } from "@/hooks/useSessionSSE";

interface StageNavigationBarProps {
  stages: ProcessingStage[];
  selectedStageId: string | null;
  onStageSelect: (stageId: string) => void;
  className?: string;
}

export const StageNavigationBar: React.FC<StageNavigationBarProps> = ({
  stages,
  selectedStageId,
  onStageSelect,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected stage
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const selected = selectedRef.current;
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();

      // Calculate if element is out of view
      const isOutOfView =
        selectedRect.left < containerRect.left ||
        selectedRect.right > containerRect.right;

      if (isOutOfView) {
        selected.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedStageId]);

  // Filter only stages with previews (completed/accepted/reviewing)
  const navigableStages = stages.filter(
    (stage) =>
      (stage.status === "completed" ||
        stage.status === "accepted" ||
        stage.status === "reviewing") &&
      stage.metadata?.preview_url && // Has preview URL in metadata
      stage.metadata.preview_url.trim() !== ""
  );

  if (navigableStages.length === 0) {
    return null; // Don't show navigation if no navigable stages
  }

  const getStageIcon = (stage: ProcessingStage) => {
    switch (stage.status) {
      case "completed":
      case "accepted":
      case "reviewing":
        return <CheckCircle2 className="h-4 w-4" />;
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "skipped":
      case "skipped_auto":
        return <SkipForward className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getStageColor = (stage: ProcessingStage, isSelected: boolean) => {
    if (isSelected) {
      return {
        bg: "bg-gradient-to-br from-blue-600 to-cyan-600",
        border: "border-blue-500/60",
        text: "text-white",
        ring: "ring-4 ring-blue-500/20",
      };
    }

    switch (stage.status) {
      case "completed":
      case "reviewing":
        return {
          bg: "bg-gradient-to-br from-emerald-500 to-teal-500",
          border: "border-emerald-400/50",
          text: "text-white",
          ring: "hover:ring-4 hover:ring-emerald-500/20",
        };
      case "accepted":
        return {
          bg: "bg-gradient-to-br from-emerald-600 to-emerald-700",
          border: "border-emerald-500/60",
          text: "text-white",
          ring: "hover:ring-4 hover:ring-emerald-500/20",
        };
      case "processing":
        return {
          bg: "bg-gradient-to-br from-blue-500 to-cyan-500",
          border: "border-blue-400/50",
          text: "text-white",
          ring: "",
        };
      case "failed":
        return {
          bg: "bg-white",
          border: "border-red-400/60",
          text: "text-red-600",
          ring: "hover:ring-4 hover:ring-red-500/20",
        };
      default:
        return {
          bg: "bg-slate-100",
          border: "border-slate-200/60",
          text: "text-slate-400",
          ring: "",
        };
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-slate-600" />
          <h3 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wide">
            Stage Timeline
          </h3>
          <span className="text-[9px] text-slate-500 font-medium">
            {navigableStages.length} stage{navigableStages.length !== 1 ? "s" : ""}{" "}
            available
          </span>
        </div>
        {selectedStageId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[9px] text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-md border border-blue-200/60"
          >
            Viewing:{" "}
            {navigableStages.find((s) => s.stage_id === selectedStageId)
              ?.display_name || "Preview"}
          </motion.div>
        )}
      </div>

      {/* Timeline Container */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
      >
        <div className="flex items-center gap-0 min-w-max px-2">
          {navigableStages.map((stage, index) => {
            const isSelected = stage.stage_id === selectedStageId;
            const isClickable = stage.metadata?.preview_url && stage.metadata.preview_url.trim() !== "";
            const colors = getStageColor(stage, isSelected);
            const stageIndex = stages.findIndex((s) => s.id === stage.id);

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Node */}
                <div className="relative flex flex-col items-center">
                  <motion.button
                    ref={isSelected ? selectedRef : null}
                    onClick={() => isClickable && onStageSelect(stage.stage_id)}
                    disabled={!isClickable}
                    aria-label={`View ${stage.display_name} preview`}
                    className={`group relative flex flex-col items-center gap-2 focus:outline-none disabled:cursor-not-allowed ${
                      isClickable ? "cursor-pointer" : "cursor-default"
                    }`}
                    whileHover={isClickable ? { y: -2 } : {}}
                    whileTap={isClickable ? { scale: 0.96 } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Node Circle */}
                    <motion.div
                      className={`relative w-10 h-10 rounded-full border-2 ${colors.border} ${colors.bg} ${colors.ring} shadow-md flex items-center justify-center transition-all duration-200 ${
                        isClickable && !isSelected
                          ? "hover:scale-110 hover:shadow-lg"
                          : ""
                      }`}
                      animate={isSelected ? { scale: [1, 1.05, 1] } : {}}
                      transition={
                        isSelected
                          ? { duration: 2, repeat: Infinity }
                          : undefined
                      }
                    >
                      <div className={colors.text}>
                        {getStageIcon(stage)}
                      </div>

                      {/* Selected indicator ring */}
                      {isSelected && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-blue-500"
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}

                      {/* Stage number badge */}
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-sm">
                        <span className="text-[8px] font-bold text-slate-700">
                          {stageIndex + 1}
                        </span>
                      </div>
                    </motion.div>

                    {/* Stage Label */}
                    <div className="flex flex-col items-center gap-1 min-w-[80px] max-w-[100px]">
                      <p
                        className={`text-[9px] font-semibold text-center leading-tight transition-colors ${
                          isSelected
                            ? "text-blue-600"
                            : "text-slate-700 group-hover:text-slate-900"
                        }`}
                      >
                        {stage.display_name}
                      </p>
                      {stage.completed_at && (
                        <div className="flex items-center gap-1 text-[8px] text-slate-500">
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            {new Date(stage.completed_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Hover Tooltip */}
                    {isClickable && !isSelected && (
                      <AnimatePresence>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileHover={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full mt-2 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl text-[10px] font-medium whitespace-nowrap">
                            Click to view preview
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </motion.button>
                </div>

                {/* Connector Line */}
                {index < navigableStages.length - 1 && (
                  <div className="relative flex items-center h-10 px-2">
                    <div className="h-0.5 w-12 bg-gradient-to-r from-slate-300 to-slate-200 relative">
                      {/* Animated progress line */}
                      {stage.status === "completed" ||
                      stage.status === "accepted" ||
                      stage.status === "reviewing" ? (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          style={{ transformOrigin: "left" }}
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-3 px-1">
        <p className="text-[9px] text-slate-500 leading-relaxed">
          💡 <span className="font-medium">Tip:</span> Click on any completed stage
          to view its preview. You can save results from any stage.
        </p>
      </div>
    </div>
  );
};
