import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { studioAPI } from "@/services/studioAPI";
import { ProcessingStage } from "@/hooks/useSessionSSE";
import ModalPortal from "@/utils/ModalPortal";

interface SaveFromStageModalProps {
  sessionId: string;
  selectedStage: ProcessingStage;
  totalStages: number;
  subsequentStagesCount: number;
  onClose: () => void;
}

const SaveFromStageModal: React.FC<SaveFromStageModalProps> = ({
  sessionId,
  selectedStage,
  subsequentStagesCount,
  onClose,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Call the new saveStageResult endpoint to save this individual stage
      const result = await studioAPI.saveStageResult(
        sessionId,
        selectedStage.stage_id
      );

      console.log("[SaveFromStageModal] Stage saved successfully:", result);
      setSuccess(true);

      // Show success for 2 seconds, then close modal (don't redirect)
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error("[SaveFromStageModal] Save failed:", err);
      setError(err.message || "Failed to save stage result");
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        onClick={!isSaving && !success ? onClose : undefined}
      >
        <AnimatePresence>
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
              <div className="relative border-b border-slate-100 px-5 py-4 bg-gradient-to-b from-amber-50/50 to-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {success ? (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="h-4.5 w-4.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                        <AlertTriangle className="h-4.5 w-4.5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                        {success
                          ? "Saved Successfully"
                          : "Save from Previous Stage"}
                      </h2>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {success
                          ? "Your results have been saved"
                          : `Saving from: ${selectedStage.display_name}`}
                      </p>
                    </div>
                  </div>
                  {!success && !isSaving && (
                    <button
                      onClick={onClose}
                      className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
                      Stage Saved Successfully
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      You can continue processing or save more stages
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Warning Message */}
                    <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200/60 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-amber-900 font-semibold mb-1">
                            Warning: Subsequent stages will be discarded
                          </p>
                          <p className="text-[9px] text-amber-800 leading-relaxed">
                            You're saving from{" "}
                            <span className="font-medium">
                              {selectedStage.display_name}
                            </span>
                            .
                            {subsequentStagesCount > 0 && (
                              <>
                                {" "}
                                This will discard results from{" "}
                                <span className="font-medium">
                                  {subsequentStagesCount} subsequent stage
                                  {subsequentStagesCount !== 1 ? "s" : ""}
                                </span>
                                .
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mb-4 leading-relaxed">
                      This will save the result from this stage to permanent
                      storage as a new artifact.
                      {subsequentStagesCount > 0 && (
                        <span className="block mt-2 text-amber-700 font-medium">
                          Note: {subsequentStagesCount} subsequent stage
                          {subsequentStagesCount !== 1 ? "s" : ""} will not be
                          included.
                        </span>
                      )}
                    </p>

                    {/* Single action card - always save as new */}
                    <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50/30 p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm flex-shrink-0">
                          <Save className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-900 mb-1">
                            Save as New Artifact
                          </h3>
                          <p className="text-[10px] text-slate-600 leading-relaxed">
                            This stage's result will be saved to permanent
                            storage. Your original testimonial and other
                            artifacts will remain unchanged.
                          </p>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-2.5 bg-red-50/80 border border-red-200/60 rounded-lg"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-600 mt-0.5 flex-shrink-0" />
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
                  <button
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-3 h-8 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 h-8 rounded-lg text-[11px] font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    <span className="flex items-center gap-1.5">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" />
                          Save This Stage
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </ModalPortal>
  );
};

export default SaveFromStageModal;
