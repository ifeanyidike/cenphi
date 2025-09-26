// components/job-system/StreamingJobModal.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { observer } from "mobx-react-lite";
import {
  X,
  Save,
  Copy,
  Check,
  Brain,
  Activity,
  CheckCircle2,
  ArrowRight,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessingJob, StreamingResult } from "@/types/ai-service";
import MarkdownRenderer from "@/components/ai-studio/MarkdownRenderer";

interface StreamingJobModalProps {
  isOpen: boolean;
  job: ProcessingJob | null;
  streamingResult: StreamingResult | null;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  onNavigateToResult: () => void;
}

const StreamingJobModal: React.FC<StreamingJobModalProps> = observer(
  ({ isOpen, job, streamingResult, onClose, onSave, onNavigateToResult }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      if (job?.status === "completed") {
        setIsSaved(false); // Reset saved state when job completes
      }
    }, [job?.status]);

    if (!isOpen || !job) return null;

    const handleSave = async () => {
      if (!streamingResult?.content) return;

      setIsSaving(true);
      try {
        await onSave(streamingResult.content);
        setIsSaved(true);

        // Auto-close after successful save
        setTimeout(() => {
          onClose();
          onNavigateToResult();
        }, 1500);
      } catch (error) {
        console.error("Failed to save content:", error);
      } finally {
        setIsSaving(false);
      }
    };

    const handleCopy = async () => {
      if (!streamingResult?.content) return;

      try {
        await navigator.clipboard.writeText(streamingResult.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy content:", error);
      }
    };

    const getServiceConfig = (service: string) => {
      const configs = {
        content_generation: {
          icon: Brain,
          name: "Content Generation",
          color: "from-green-500 to-emerald-500",
        },
        text_polishing: {
          icon: Sparkles,
          name: "Text Enhancement",
          color: "from-violet-500 to-purple-500",
        },
        translation: {
          icon: FileText,
          name: "Translation",
          color: "from-teal-500 to-cyan-500",
        },
      };

      return (
        configs[service as keyof typeof configs] || {
          icon: FileText,
          name: service,
          color: "from-gray-400 to-gray-500",
        }
      );
    };

    const serviceConfig = getServiceConfig(job.service);
    const ServiceIcon = serviceConfig.icon;
    const isStreaming = streamingResult?.isStreaming;
    const isCompleted = job.status === "completed";
    const content = streamingResult?.content || "";

    const modal = (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${serviceConfig.color} flex items-center justify-center`}
                  >
                    <ServiceIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {serviceConfig.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="secondary"
                        className={`${
                          isStreaming
                            ? "bg-blue-100 text-blue-700"
                            : isCompleted
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {isStreaming ? (
                          <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1" />
                            Live
                          </>
                        ) : isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Complete
                          </>
                        ) : (
                          <>
                            <Activity className="w-3 h-3 mr-1" />
                            Processing
                          </>
                        )}
                      </Badge>
                      {content && (
                        <span className="text-sm text-gray-600">
                          {content.length} characters
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {content && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="h-8"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              {isStreaming && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">Generating content...</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1 bg-blue-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress || 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-blue-600 text-xs font-medium">
                        {job.progress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 p-6 overflow-y-auto">
                  {content ? (
                    <div className="prose prose-sm max-w-none">
                      <MarkdownRenderer
                        content={content}
                        isStreaming={isStreaming}
                        isComplete={isCompleted}
                        jobId={job.id}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                        <p>Waiting for content generation...</p>
                      </div>
                    </div>
                  )}

                  {/* Streaming indicator */}
                  {isStreaming && (
                    <div className="mt-4 flex items-center text-sm text-gray-500">
                      <div className="flex gap-1 mr-2">
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse delay-100" />
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse delay-200" />
                      </div>
                      <span>Content is being generated in real-time...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {isCompleted
                    ? "Content generation complete. Save to add to testimonial."
                    : isStreaming
                      ? "Content is being generated. You can save it anytime."
                      : "Preparing to generate content..."}
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                    className="h-9"
                  >
                    {isCompleted ? "Close" : "Cancel"}
                  </Button>

                  {content && (
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || isSaved}
                      className="h-9 bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <Activity className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : isSaved ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save & Continue
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );

    return createPortal(modal, document.body);
  }
);

export default StreamingJobModal;
