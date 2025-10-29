import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Copy,
  Download,
  FileText,
  Video,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TestimonialArtifact } from "@/types/testimonial";
import MarkdownRenderer from "@/components/ai-generated-content/MarkdownRenderer";
import { authStore } from "@/stores/authStore";

interface ContentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: TestimonialArtifact | null;
  onSave: (artifactId: string, newContent: string) => Promise<void>;
}

const ContentEditModal: React.FC<ContentEditModalProps> = ({
  isOpen,
  onClose,
  artifact,
  onSave,
}) => {
  const [editedContent, setEditedContent] = useState(
    artifact?.text_content || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [regenerationError, setRegenerationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (artifact?.text_content) {
      setEditedContent(artifact.text_content);
    }
  }, [artifact]);

  if (!artifact) return null;

  const isVideoArtifact =
    artifact.processing_type === "story_mode_generation" ||
    artifact.processing_type === "best_story_moments" ||
    artifact.processing_type === "video_platform_optimization";

  const isMarkdownContent =
    artifact.processing_type === "content_generation" ||
    artifact.processing_type === "text_polishing";

  const getTypeInfo = () => {
    switch (artifact.processing_type) {
      case "content_generation":
        return { label: "Generated Content", color: "emerald", icon: FileText };
      case "text_polishing":
        return { label: "Polished Text", color: "blue", icon: FileText };
      case "translation":
        return { label: "Translation", color: "purple", icon: FileText };
      case "story_mode_generation":
      case "best_story_moments":
        return { label: "Story Video", color: "blue", icon: Video };
      case "video_platform_optimization":
        return { label: "Platform Video", color: "purple", icon: Video };
      default:
        return { label: "Content", color: "slate", icon: FileText };
    }
  };

  const typeInfo = getTypeInfo();
  const TypeIcon = typeInfo.icon;

  const handleSave = async () => {
    if (!artifact) return;
    setIsSaving(true);
    try {
      await onSave(artifact.id, editedContent);
      onClose();
    } catch (error) {
      console.error("Failed to save content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${typeInfo.label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${isMarkdownContent ? "md" : "txt"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = async () => {
    if (!artifact) return;

    setIsRegenerating(true);
    setRegenerationError(null);

    try {
      const serverAddr = import.meta.env.VITE_API_URL;

      // Get authentication token
      const tokenInfo = await authStore.getToken();
      const token = tokenInfo.token;

      // Call the regenerate content API - simpler and doesn't auto-save
      const response = await fetch(`${serverAddr}/ai/regenerate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: editedContent,
          preserve_authenticity: true,
          target_style: "professional",
          prompt:
            "Regenerate and improve this content while maintaining its core message and authenticity.",
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to regenerate content: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let regeneratedContent = "";
      const decoder = new TextDecoder();

      // Clear current content before streaming new content
      setEditedContent("");

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        regeneratedContent += chunk;

        // Update content progressively for live streaming preview
        setEditedContent(regeneratedContent);
      }

      if (regeneratedContent) {
        setRegenerationError(
          "Content regenerated successfully! Review and click 'Save Changes' if you're satisfied."
        );
      } else {
        throw new Error("No content was generated");
      }
    } catch (error) {
      console.error("Failed to regenerate content:", error);
      setRegenerationError(
        error instanceof Error
          ? error.message
          : "Failed to regenerate content. Please try again."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  // Calculate stats
  const wordCount = editedContent.trim().split(/\s+/).filter(Boolean).length;
  const charCount = editedContent.length;
  const hasChanges = editedContent !== artifact.text_content;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={`relative bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col ${
              isFullscreen
                ? "w-full h-full m-0"
                : "w-full max-w-4xl max-h-[90vh]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`p-1.5 rounded-lg bg-${typeInfo.color}-50 border border-${typeInfo.color}-200 flex-shrink-0`}
                >
                  <TypeIcon
                    className={`h-3.5 w-3.5 text-${typeInfo.color}-600`}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900 truncate">
                    Edit {typeInfo.label}
                  </h2>
                  <p className="text-[10px] text-slate-500 truncate">
                    {isVideoArtifact
                      ? "Edit text content for this video"
                      : "Modify generated content"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="h-7 w-7 p-0 hover:bg-slate-100"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-3.5 w-3.5" />
                  ) : (
                    <Maximize2 className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-7 w-7 p-0 hover:bg-slate-100"
                  title="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-white border-slate-200"
                >
                  {wordCount} words
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-white border-slate-200"
                >
                  {charCount} chars
                </Badge>
                {hasChanges && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">
                    Unsaved changes
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 px-2 text-[10px] hover:bg-white"
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3 w-3 mr-1 text-emerald-600" />
                      <span className="hidden sm:inline">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Copy</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-6 px-2 text-[10px] hover:bg-white"
                  title="Download as file"
                >
                  <Download className="h-3 w-3 mr-1" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="h-6 px-2 text-[10px] hover:bg-blue-50 hover:text-blue-700"
                  title="Regenerate with AI"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      <span className="hidden sm:inline">Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Regenerate</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Regeneration Error/Info */}
            <AnimatePresence>
              {regenerationError && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className="p-3 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-blue-700 leading-relaxed">
                          {regenerationError}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRegenerationError(null)}
                        className="h-5 w-5 p-0 hover:bg-blue-100 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1 p-4 min-h-0 overflow-hidden">
              <div className="h-full  border border-slate-200 rounded-lg overflow-hidden bg-white">
                {isMarkdownContent ? (
                  <div className="h-full ">
                    <MarkdownRenderer
                      content={editedContent}
                      jobId={artifact.id}
                      isComplete={true}
                      onSave={async (newContent) => {
                        setEditedContent(newContent);
                      }}
                    />
                  </div>
                ) : (
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="h-full w-full border-0 resize-none focus:ring-0 text-[11px] leading-relaxed p-3 focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Enter your content here..."
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/30 flex-shrink-0">
              <p className="text-[10px] text-slate-500">
                {isMarkdownContent
                  ? "Supports markdown formatting"
                  : "Plain text editing"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-8 px-3 text-[11px] border-slate-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="h-8 px-3 text-[11px] bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1.5" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContentEditModal;
