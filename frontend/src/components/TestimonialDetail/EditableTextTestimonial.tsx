// components/TestimonialDetail/EditableTextTestimonial.tsx
import {
  FileText,
  Edit3,
  Save,
  X,
  RotateCcw,
  Eye,
  Type,
  AlignLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authStore } from "@/stores/authStore";

interface EditableTextTestimonialProps {
  content: string;
  authorName?: string;
  onSave: (newContent: string) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  lastModified?: string;
  wordLimit?: number;
  placeholder?: string;
  showMetrics?: boolean;
}

const EditableTextTestimonial = ({
  content,
  authorName,
  onSave,
  onCancel,
  isLoading = false,
  lastModified,
  wordLimit = 500,
  placeholder = "Enter testimonial content...",
  showMetrics = true,
}: EditableTextTestimonialProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [originalContent, setOriginalContent] = useState(content);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [aiImprovedText, setAiImprovedText] = useState("");
  const [showAIPreview, setShowAIPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update content when prop changes
  useEffect(() => {
    if (content !== originalContent && !isEditing) {
      setEditedContent(content);
      setOriginalContent(content);
    }
  }, [content, originalContent, isEditing]);

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(editedContent !== originalContent);
  }, [editedContent, originalContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(textarea.scrollHeight, 200)}px`;
    }
  }, [editedContent, isEditing]);

  const startEditing = () => {
    setIsEditing(true);
    setOriginalContent(editedContent);
    setSaveStatus("idle");

    // Focus textarea after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          editedContent.length,
          editedContent.length
        );
      }
    }, 100);
  };

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;

    setSaveStatus("saving");

    try {
      await onSave(editedContent);
      setOriginalContent(editedContent);
      setIsEditing(false);
      setSaveStatus("saved");

      // Show saved status briefly
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
      setSaveStatus("error");

      // Reset error status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleCancel = () => {
    setEditedContent(originalContent);
    setIsEditing(false);
    setSaveStatus("idle");
    onCancel?.();
  };

  const handleReset = () => {
    setEditedContent(originalContent);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleAIImprove = async () => {
    if (!editedContent.trim()) return;

    setIsImproving(true);
    setAiImprovedText("");
    setShowAIPreview(true);

    try {
      const { token } = await authStore.getToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/ai/regenerate-content`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: editedContent,
            preserve_authenticity: true,
            target_style: "authentic",
            prompt: "Improve this testimonial text while maintaining its authentic voice and specific details",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to improve text: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Backend sends raw text chunks, not SSE format
        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
          accumulatedText += chunk;
          setAiImprovedText(accumulatedText);
        }
      }
    } catch (error) {
      console.error("Failed to improve text:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsImproving(false);
    }
  };

  const handleAcceptAIImprovement = () => {
    setEditedContent(aiImprovedText);
    setShowAIPreview(false);
    setAiImprovedText("");
  };

  const handleRejectAIImprovement = () => {
    setShowAIPreview(false);
    setAiImprovedText("");
  };

  // Text metrics
  const wordCount = editedContent
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const charCount = editedContent.length;
  const isOverLimit = wordCount > wordLimit;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed

  // Get save status config
  const getSaveStatusConfig = () => {
    switch (saveStatus) {
      case "saving":
        return {
          icon: Clock,
          text: "Saving...",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      case "saved":
        return {
          icon: CheckCircle2,
          text: "Saved",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50",
          borderColor: "border-emerald-200",
        };
      case "error":
        return {
          icon: AlertCircle,
          text: "Save failed",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return null;
    }
  };

  const statusConfig = getSaveStatusConfig();

  return (
    <Card className="border-0 shadow-lg shadow-slate-100 bg-gradient-to-br from-white to-slate-50/30 overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-sm">
              <FileText className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                Text Testimonial
              </h3>
              {authorName && (
                <p className="text-sm text-slate-600 font-medium">
                  by {authorName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Save Status Indicator */}
            {statusConfig && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}
              >
                <statusConfig.icon
                  className={`h-3 w-3 ${statusConfig.color}`}
                />
                <span className={`text-xs font-medium ${statusConfig.color}`}>
                  {statusConfig.text}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            {!isEditing ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 hover:bg-slate-50"
                >
                  {showCopied ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  onClick={startEditing}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 hover:bg-slate-50"
                  disabled={isLoading}
                >
                  <Edit3 className="h-3 w-3 mr-2" />
                  Edit
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-100"
                  disabled={!hasUnsavedChanges}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  onClick={handleAIImprove}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                  disabled={isImproving || !editedContent.trim()}
                >
                  {isImproving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Improve with AI
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="border-slate-200 hover:bg-slate-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                  disabled={
                    !hasUnsavedChanges || isOverLimit || saveStatus === "saving"
                  }
                >
                  <Save className="h-3 w-3 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Bar (only show when editing or if showMetrics is true) */}
        {(isEditing || showMetrics) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Type className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">
                  {charCount} characters
                </span>
              </div>

              <div className="flex items-center gap-2">
                <AlignLeft className="h-3 w-3 text-slate-400" />
                <span
                  className={`text-xs font-medium ${isOverLimit ? "text-red-600" : "text-slate-600"}`}
                >
                  {wordCount} / {wordLimit} words
                </span>
              </div>

              {wordCount > 0 && (
                <div className="flex items-center gap-2">
                  <Eye className="h-3 w-3 text-slate-400" />
                  <span className="text-xs text-slate-600 font-medium">
                    ~{readingTime} min read
                  </span>
                </div>
              )}
            </div>

            {lastModified && !isEditing && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-slate-400" />
                <span className="text-xs text-slate-500">
                  Last updated {new Date(lastModified).toLocaleDateString()}
                </span>
              </div>
            )}

            {hasUnsavedChanges && isEditing && (
              <Badge
                variant="outline"
                className="text-xs border-amber-200 bg-amber-50 text-amber-700"
              >
                Unsaved changes
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-4">
            {/* AI Preview Comparison */}
            {showAIPreview && (
              <div className="space-y-4 p-6 bg-purple-50/50 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <h4 className="text-sm font-semibold text-purple-900">
                      AI Improvement Preview
                    </h4>
                    {isImproving && (
                      <Loader2 className="h-3 w-3 text-purple-600 animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleRejectAIImprovement}
                      variant="ghost"
                      size="sm"
                      className="text-xs hover:bg-purple-100"
                      disabled={isImproving}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleAcceptAIImprovement}
                      size="sm"
                      className="text-xs bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={isImproving || !aiImprovedText}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Original */}
                  <div>
                    <p className="text-xs font-medium text-slate-600 mb-2">
                      Original
                    </p>
                    <div className="p-4 bg-white rounded-xl border border-slate-200 min-h-[200px] max-h-[400px] overflow-y-auto">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {editedContent}
                      </p>
                    </div>
                  </div>

                  {/* AI Improved */}
                  <div>
                    <p className="text-xs font-medium text-purple-600 mb-2">
                      AI Improved
                    </p>
                    <div className="p-4 bg-white rounded-xl border border-purple-200 min-h-[200px] max-h-[400px] overflow-y-auto">
                      {isImproving && !aiImprovedText ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 text-purple-600 animate-spin" />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {aiImprovedText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-purple-700">
                  Review the AI-improved version and accept to use it, or reject
                  to keep your original text.
                </p>
              </div>
            )}

            {/* Editing Interface */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder={placeholder}
                className={`w-full min-h-[300px] p-6 border border-slate-200 rounded-2xl bg-white/60 backdrop-blur-sm text-slate-900 text-lg leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all ${
                  isOverLimit
                    ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                    : ""
                }`}
                style={{
                  fontFamily:
                    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                disabled={isImproving}
              />

              {/* Character limit warning */}
              {isOverLimit && (
                <div className="absolute bottom-4 right-4">
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-50 text-red-700"
                  >
                    Over limit by {wordCount - wordLimit} words
                  </Badge>
                </div>
              )}
            </div>

            {/* Editing Tips */}
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Type className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">
                    Writing Tips
                  </h4>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Focus on specific outcomes and results</li>
                    <li>• Use concrete examples and metrics when possible</li>
                    <li>• Keep language authentic and conversational</li>
                    <li>• Highlight the problem solved and value delivered</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Display Mode */
          <div className="space-y-6">
            {editedContent ? (
              <div className="prose prose-slate prose-lg max-w-none">
                <div className="p-8 bg-white/60 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    "{editedContent}"
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900 mb-2">
                  No content available
                </h4>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  This testimonial doesn't have any content yet. Click Edit to
                  add the testimonial text.
                </p>
                <Button
                  onClick={startEditing}
                  className="bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Add Content
                </Button>
              </div>
            )}

            {/* Quick Actions in View Mode */}
            {editedContent && (
              <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                <div className="text-sm text-slate-600">
                  {wordCount > 0 && (
                    <span>
                      {wordCount} words • ~{readingTime} minute read
                    </span>
                  )}
                </div>
                <Button
                  onClick={startEditing}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EditableTextTestimonial;
