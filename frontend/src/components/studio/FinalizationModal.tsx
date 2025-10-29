import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { studioAPI } from "@/services/studioAPI";
import { useNavigate } from "react-router-dom";
import { ProcessingStage } from "@/hooks/useSessionSSE";

interface FinalizationModalProps {
  sessionId: string;
  completedStages: number;
  totalStages: number;
  stages: ProcessingStage[];
  onClose: () => void;
}

const FinalizationModal: React.FC<FinalizationModalProps> = ({
  sessionId,
  completedStages,
  totalStages,
  stages,
  onClose,
}) => {
  const navigate = useNavigate();
  const [action, setAction] = useState<"save" | "discard">("save");
  const [showDiscardConfirmation, setShowDiscardConfirmation] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Extract optimized text from text_optimization stage if present
  const textOptStage = stages.find(
    (s) => s.stage_id === "optimize_text" && s.metadata?.optimized_text
  );
  const optimizedText = textOptStage?.metadata?.optimized_text as string | undefined;

  const handleFinalize = async () => {
    // If user selected discard, show confirmation first
    if (action === "discard" && !showDiscardConfirmation) {
      setShowDiscardConfirmation(true);
      return;
    }

    setIsFinalizing(true);
    setError(null);

    try {
      const result = await studioAPI.finalizeSession(sessionId, action, {
        preserveSources: false, // Cleanup temp artifacts
        optimizedText: optimizedText, // Pass streamed text content from frontend
      });

      console.log("[FinalizationModal] Finalization successful:", result);
      setSuccess(true);

      // Wait 1.5 seconds to show success message, then redirect
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("[FinalizationModal] Finalization failed:", err);
      setError(err.message || "Failed to finalize session");
      setIsFinalizing(false);
    }
  };

  const handleDiscardCancel = () => {
    setShowDiscardConfirmation(false);
    setAction("save"); // Reset to save option
  };

  const handleClose = () => {
    if (isFinalizing || success || isClosing) return;

    setIsClosing(true);
    // Small delay to allow exit animation
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleBackdropClick = () => {
    // If showing discard confirmation, go back instead of closing
    if (showDiscardConfirmation && !isFinalizing) {
      handleDiscardCancel();
      return;
    }

    // Otherwise, close the modal if not finalizing or in success state
    if (!isFinalizing && !success) {
      handleClose();
    }
  };

  return (
    <>
      {!isClosing && (
        <motion.div
          key="finalization-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border border-slate-200/80 bg-white shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative border-b border-slate-100 px-5 py-4 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {success ? (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="h-4.5 w-4.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                        <Sparkles className="h-4.5 w-4.5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                        {success ? "Processing Complete" : "Finalize Session"}
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {completedStages} of {totalStages} steps completed
                        successfully
                      </p>
                    </div>
                  </div>
                  {!success && !isFinalizing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                      }}
                      disabled={isClosing}
                      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                      aria-label="Close modal"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {success ? (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        damping: 15,
                        stiffness: 200,
                      }}
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <CheckCircle2 className="h-7 w-7 text-white" />
                      </div>
                    </motion.div>
                    <p className="text-sm font-medium text-slate-900">
                      {action === "discard"
                        ? "Session Discarded"
                        : "Results Saved"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Redirecting to dashboard...
                    </p>
                  </div>
                ) : showDiscardConfirmation ? (
                  // Discard confirmation dialog
                  <div className="py-4">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">
                          Discard All Results?
                        </h3>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          This will permanently delete all processed artifacts
                          and temp files. This action cannot be undone.
                        </p>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-2.5 bg-red-50/80 border border-red-200/60 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-red-700 leading-relaxed">
                            {error}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
                      Choose how to finalize your processed content
                    </p>

                    <RadioGroup
                      value={action}
                      onValueChange={(v) => setAction(v as typeof action)}
                    >
                      <div className="space-y-2">
                        {/* Save as New */}
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`group relative rounded-lg border p-3.5 cursor-pointer transition-all ${
                            action === "save"
                              ? "border-blue-500/50 bg-gradient-to-br from-blue-50 to-cyan-50/30 shadow-sm"
                              : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}
                          onClick={() => setAction("save")}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value="save"
                              id="save"
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor="save"
                                className="text-[11px] font-semibold text-slate-900 cursor-pointer leading-tight"
                              >
                                Save as New Version
                              </Label>
                              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                                Keep both original and processed
                              </p>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                                action === "save"
                                  ? "bg-blue-500/10"
                                  : "bg-slate-100 group-hover:bg-slate-200"
                              }`}
                            >
                              <Save
                                className={`h-3.5 w-3.5 ${action === "save" ? "text-blue-600" : "text-slate-500"}`}
                              />
                            </div>
                          </div>
                        </motion.div>

                        {/* Discard */}
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`group relative rounded-lg border p-3.5 cursor-pointer transition-all ${
                            action === "discard"
                              ? "border-red-500/50 bg-gradient-to-br from-red-50 to-rose-50/30 shadow-sm"
                              : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                          }`}
                          onClick={() => setAction("discard")}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value="discard"
                              id="discard"
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor="discard"
                                className="text-[11px] font-semibold text-slate-900 cursor-pointer leading-tight"
                              >
                                Discard Results
                              </Label>
                              <p className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                                Delete all processed artifacts
                              </p>
                            </div>
                            <div
                              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                                action === "discard"
                                  ? "bg-red-500/10"
                                  : "bg-slate-100 group-hover:bg-slate-200"
                              }`}
                            >
                              <Trash2
                                className={`h-3.5 w-3.5 ${action === "discard" ? "text-red-600" : "text-slate-500"}`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </RadioGroup>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-2.5 bg-red-50/80 border border-red-200/60 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-red-700 leading-relaxed">
                            {error}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {!success && (
                <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-3.5 flex items-center justify-end gap-2">
                  {showDiscardConfirmation ? (
                    <>
                      <button
                        onClick={handleDiscardCancel}
                        disabled={isFinalizing}
                        className="px-3 h-8 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        No, Go Back
                      </button>
                      <button
                        onClick={handleFinalize}
                        disabled={isFinalizing}
                        className="px-3 h-8 rounded-lg text-[11px] font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                      >
                        <span className="flex items-center gap-1.5">
                          {isFinalizing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Discarding
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              Yes, Discard All
                            </>
                          )}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleClose}
                        disabled={isFinalizing || isClosing}
                        className="px-3 h-8 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFinalize}
                        disabled={isFinalizing}
                        className={`px-3 h-8 rounded-lg text-[11px] font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                          action === "discard"
                            ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
                            : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isFinalizing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Processing
                            </>
                          ) : (
                            <>
                              {action === "discard" ? (
                                <>
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Discard
                                </>
                              ) : (
                                <>
                                  <Save className="h-3.5 w-3.5" />
                                  Save
                                </>
                              )}
                            </>
                          )}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default FinalizationModal;
