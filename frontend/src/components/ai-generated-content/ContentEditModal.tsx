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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { TestimonialArtifact } from "@/types/testimonial";
import MarkdownRenderer from "@/components/ai-studio/MarkdownRenderer";

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
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (artifact?.text_content) {
      setEditedContent(artifact.text_content);
    }
  }, [artifact]);

  if (!artifact) return null;

  const isVideoArtifact =
    artifact.processing_type === "story_mode_generation" ||
    artifact.processing_type === "best_story_moments";

  const isMarkdownContent =
    artifact.processing_type === "content_generation" ||
    artifact.processing_type === "text_polishing";

  const getTypeInfo = () => {
    switch (artifact.processing_type) {
      case "content_generation":
        return { label: "Generated Content", color: "purple", icon: FileText };
      case "text_polishing":
        return { label: "Polished Text", color: "blue", icon: FileText };
      case "translation":
        return { label: "Translation", color: "green", icon: FileText };
      case "story_mode_generation":
      case "best_story_moments":
        return { label: "Story Video", color: "orange", icon: Video };
      default:
        return { label: "Content", color: "gray", icon: FileText };
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
    link.download = `${typeInfo.label.toLowerCase()}-${Date.now()}.${isMarkdownContent ? 'md' : 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${typeInfo.color}-50 border border-${typeInfo.color}-200`}>
                  <TypeIcon className={`h-4 w-4 text-${typeInfo.color}-600`} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit {typeInfo.label}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {isVideoArtifact ? "Edit the text content for this video" : "Modify your generated content"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-xs">
                  {editedContent.length} characters
                </Badge>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 px-3 text-xs"
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <Copy className="h-3 w-3 mr-1" />
                    )}
                    {isCopied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-8 px-3 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
                {isMarkdownContent ? (
                  <div className="h-full">
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
                    className="h-full min-h-[400px] border-0 resize-none focus:ring-0 text-sm leading-relaxed p-4"
                    placeholder="Enter your content here..."
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs text-gray-500">
                {isMarkdownContent ? "Supports markdown formatting" : "Plain text editing"}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-9 px-4 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || editedContent === artifact.text_content}
                  className="h-9 px-4 text-sm bg-gray-900 hover:bg-gray-800"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-2" />
                  )}
                  Save Changes
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