import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Edit3,
  Check,
  Copy,
  Download,
  FileText,
  Bold,
  Italic,
  List,
  Link,
  Code,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  jobId?: string;
  onSave?: (content: string, jobId: string) => Promise<void>;
  readOnly?: boolean;
  title?: string;
  className?: string;
  // New adaptive props
  adaptiveMode?: boolean;
  maxPreviewLines?: number;
  context?: "jobMonitor" | "standalone" | "compact";
}

interface ContentAnalysis {
  wordCount: number;
  lineCount: number;
  readingTime: number;
  hasStructure: boolean;
  contentHeight: "short" | "medium" | "long";
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
  isComplete = false,
  jobId,
  onSave,
  readOnly = false,
  title = "Content",
  className = "",
  adaptiveMode = true,
  maxPreviewLines = 4,
  context = "standalone",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [, setViewMode] = useState<"preview" | "full">();

  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Analyze content to determine optimal display strategy
  const analyzeContent = useCallback(
    (text: string): ContentAnalysis => {
      const words = text.split(/\s+/).filter((word) => word.length > 0);
      const lines = text.split("\n").filter((line) => line.trim().length > 0);
      const hasHeaders = /^#+\s/.test(text);
      const hasLists = /^[*\-+]\s|^\d+\.\s/.test(text);
      const hasStructure = hasHeaders || hasLists;

      let contentHeight: "short" | "medium" | "long";
      if (lines.length <= maxPreviewLines) {
        contentHeight = "short";
      } else if (lines.length <= maxPreviewLines * 3) {
        contentHeight = "medium";
      } else {
        contentHeight = "long";
      }

      return {
        wordCount: words.length,
        lineCount: lines.length,
        readingTime: Math.ceil(words.length / 200),
        hasStructure,
        contentHeight,
      };
    },
    [maxPreviewLines]
  );

  const analysis = analyzeContent(content);

  const handleSaveContent = async () => {
    if (!onSave || !jobId) return;

    setSaveState("saving");
    setSaveError(null);

    try {
      const contentToSave = isEditing ? editContent : content;
      await onSave(contentToSave, jobId);
      setSaveState("success");

      // Reset success state after 3 seconds
      setTimeout(() => {
        setSaveState("idle");
      }, 3000);
    } catch (error) {
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Save failed");

      // Reset error state after 5 seconds
      setTimeout(() => {
        setSaveState("idle");
        setSaveError(null);
      }, 5000);
    }
  };

  // Add this save status component (place it in your header or status footer)
  const SaveStatusIndicator = () => {
    if (saveState === "idle") return null;

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-300">
        {saveState === "saving" && (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-blue-700">Saving...</span>
          </>
        )}

        {saveState === "success" && (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-700 font-medium">
              Saved successfully!
            </span>
          </>
        )}

        {saveState === "error" && (
          <>
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div className="flex flex-col">
              <span className="text-red-700 font-medium">Save failed</span>
              {saveError && (
                <span className="text-red-600 text-xs">{saveError}</span>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Enhanced markdown rendering optimized for business presentation
  const renderMarkdown = useCallback(
    (text: string, isPreview: boolean = false): string => {
      if (!text) return "";

      let processedText = text;

      // If in preview mode and content is long, truncate intelligently
      if (isPreview && analysis.contentHeight !== "short") {
        const lines = text.split("\n");
        const previewLines = lines.slice(0, maxPreviewLines);
        processedText = previewLines.join("\n");
        if (lines.length > maxPreviewLines) {
          processedText += "\n\n*[Content continues...]*";
        }
      }

      let html = processedText
        // Executive-grade headers
        .replace(
          /^# (.*$)/gim,
          '<h1 class="text-lg font-bold text-gray-900 mb-3 pb-2 border-b border-gray-200">$1</h1>'
        )
        .replace(
          /^## (.*$)/gim,
          '<h2 class="text-base font-semibold text-gray-900 mb-2 mt-4">$1</h2>'
        )
        .replace(
          /^### (.*$)/gim,
          '<h3 class="text-sm font-medium text-gray-900 mb-2 mt-3">$1</h3>'
        )
        // Professional text formatting
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        )
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
        // Code blocks with business styling
        .replace(
          /```(\w+)?\n([\s\S]*?)```/g,
          '<div class="my-2"><pre class="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm overflow-x-auto"><code class="font-mono text-gray-800">$2</code></pre></div>'
        )
        .replace(
          /`([^`]+)`/g,
          '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono border">$1</code>'
        )
        // Executive blockquotes
        .replace(
          /^> (.*)$/gim,
          '<blockquote class="border-l-3 border-blue-500 bg-blue-50 pl-3 py-1 my-2 text-sm text-gray-700">$1</blockquote>'
        )
        // Clean lists
        .replace(/^\* (.*)$/gim, '<li class="text-gray-700 text-sm">$1</li>')
        .replace(/^- (.*)$/gim, '<li class="text-gray-700 text-sm">$1</li>')
        .replace(/^\d+\. (.*)$/gim, '<li class="text-gray-700 text-sm">$1</li>')
        // Professional links
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-600 hover:text-blue-800 underline underline-offset-1 transition-colors text-sm" target="_blank" rel="noopener noreferrer">$1</a>'
        )
        // Line breaks
        .replace(
          /\n\n/g,
          '</p><p class="text-gray-700 text-sm leading-relaxed mb-2">'
        )
        .replace(/\n/g, "<br>");

      // Wrap list items
      html = html.replace(
        /(<li[^>]*>.*?<\/li>)(\s*<li[^>]*>.*?<\/li>)*/g,
        (match) => `<ul class="list-disc ml-4 space-y-0.5 mb-2">${match}</ul>`
      );

      // Paragraph wrapping
      if (
        html &&
        !html.includes("<p>") &&
        !html.includes("<h") &&
        !html.includes("<ul>")
      ) {
        html = `<p class="text-gray-700 text-sm leading-relaxed mb-2">${html}</p>`;
      } else if (html.includes("<p>")) {
        html = `<p class="text-gray-700 text-sm leading-relaxed mb-2">${html}</p>`;
      }

      return html;
    },
    [analysis.contentHeight, maxPreviewLines]
  );

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 400) + "px";
    }
  }, []);

  useEffect(() => {
    if (isEditing) adjustTextareaHeight();
  }, [isEditing, editContent, adjustTextareaHeight]);

  // Determine initial display mode based on content and context
  useEffect(() => {
    if (context === "jobMonitor" && adaptiveMode) {
      if (analysis.contentHeight === "short") {
        setViewMode("full");
        setIsExpanded(true);
      } else {
        setViewMode("preview");
        setIsExpanded(false);
      }
    }
  }, [analysis.contentHeight, context, adaptiveMode]);

  // Actions
  const handleStartEdit = () => {
    setEditContent(content);
    setIsEditing(true);
    setShowActions(false);
  };

  const handleSaveEdit = () => {
    if (onSave && jobId) {
      onSave(editContent, jobId);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
      setShowActions(false);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-${jobId || Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowActions(false);
  };

  const toggleExpansion = () => {
    if (analysis.contentHeight === "short") return;

    setIsExpanded(!isExpanded);
    setViewMode(isExpanded ? "preview" : "full");
  };

  const insertMarkdown = (before: string, after: string = "") => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);

    const newContent =
      editContent.substring(0, start) +
      before +
      selectedText +
      after +
      editContent.substring(end);
    setEditContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  if (!content && !isStreaming) {
    return (
      <div className="flex items-center justify-center py-6 text-center">
        <div>
          <FileText className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No content available</p>
        </div>
      </div>
    );
  }

  const shouldShowExpansionControl =
    adaptiveMode && analysis.contentHeight !== "short" && !isEditing;
  const containerClasses = `
    ${className} 
    ${isFullscreen ? "fixed inset-4 z-50 bg-white shadow-2xl rounded-lg border" : ""}
    transition-all duration-300
  `;

  return (
    <div ref={containerRef} className={containerClasses}>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Smart Header - Contextual */}
        {context !== "compact" && (
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-md flex items-center justify-center">
                {isEditing ? (
                  <Edit3 className="w-3 h-3 text-white" />
                ) : (
                  <FileText className="w-3 h-3 text-white" />
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{analysis.wordCount} words</span>
                  <span>~{analysis.readingTime}m read</span>
                  {isStreaming && (
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 font-medium">Live</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {shouldShowExpansionControl && (
                <button
                  onClick={toggleExpansion}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  title={isExpanded ? "Show less" : "Show more"}
                >
                  {isExpanded ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Less</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>More</span>
                    </>
                  )}
                </button>
              )}

              {context !== "jobMonitor" && (
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  <Maximize2 className="w-3 h-3" />
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>

                {showActions && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[120px]">
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {showCopySuccess ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {showCopySuccess ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    {!readOnly && onSave && jobId && (
                      <button
                        onClick={handleStartEdit}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Editing Toolbar */}
        {isEditing && (
          <div className="flex items-center gap-1 px-4 py-2 bg-white border-b border-gray-100">
            <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200 mr-2">
              <button
                onClick={() => insertMarkdown("**", "**")}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Bold"
              >
                <Bold className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertMarkdown("*", "*")}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Italic"
              >
                <Italic className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-0.5 mr-auto">
              <button
                onClick={() => insertMarkdown("- ")}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="List"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertMarkdown("[", "](url)")}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Link"
              >
                <Link className="w-3 h-3" />
              </button>
              <button
                onClick={() => insertMarkdown("`", "`")}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Code"
              >
                <Code className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        )}
        {/* Content Area - Adaptive Height */}
        <div
          className={`
          ${isEditing ? "p-0" : "p-4"}
          ${isFullscreen ? "h-full overflow-y-auto" : ""}
          transition-all duration-300
        `}
        >
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                adjustTextareaHeight();
              }}
              className="w-full p-4 resize-none focus:outline-none text-gray-900 leading-relaxed border-0 font-mono text-sm"
              placeholder="Edit content here..."
              spellCheck="true"
            />
          ) : (
            <div className="relative">
              <div
                ref={contentRef}
                className={`prose prose-sm max-w-none transition-all duration-300 ${
                  !isExpanded && analysis.contentHeight !== "short"
                    ? "max-h-32 overflow-hidden"
                    : ""
                }`}
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(
                    content,
                    !isExpanded && analysis.contentHeight !== "short"
                  ),
                }}
              />

              {/* Gradient overlay for preview mode */}
              {!isExpanded && analysis.contentHeight !== "short" && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}

              {isStreaming && (
                <span className="inline-flex items-center ml-1">
                  <span className="w-0.5 h-4 bg-blue-500 animate-pulse rounded-sm" />
                </span>
              )}
            </div>
          )}
        </div>
        {/* Smart Expansion Control */}
        {shouldShowExpansionControl && (
          <div className="px-4 pb-4">
            <button
              onClick={toggleExpansion}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 rounded-md transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Show less</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>
                    Show more ({analysis.lineCount - maxPreviewLines} more
                    lines)
                  </span>
                </>
              )}
            </button>
          </div>
        )}
        {/* Status Footer - Compact */}
        {(isComplete || !isStreaming) &&
          content &&
          !isEditing &&
          context === "standalone" && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-3">
                  <span>{analysis.wordCount} characters</span>
                  <span>{analysis.lineCount} lines</span>
                  {/* Add save status indicator here */}
                  <SaveStatusIndicator />
                </div>

                {!readOnly && onSave && jobId && (
                  <button
                    onClick={handleSaveContent}
                    disabled={saveState === "saving"}
                    className={`
              px-3 py-1.5 text-xs rounded transition-all duration-200 flex items-center gap-1.5
              ${
                saveState === "saving"
                  ? "bg-blue-100 text-blue-600 cursor-not-allowed"
                  : saveState === "success"
                    ? "bg-green-100 text-green-700"
                    : saveState === "error"
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
              }
            `}
                  >
                    {saveState === "saving" && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    {saveState === "success" && (
                      <CheckCircle2 className="w-3 h-3" />
                    )}
                    {saveState === "error" && (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {saveState === "idle" && <Save className="w-3 h-3" />}

                    {saveState === "saving"
                      ? "Saving..."
                      : saveState === "success"
                        ? "Saved!"
                        : saveState === "error"
                          ? "Retry"
                          : "Save"}
                  </button>
                )}
              </div>
            </div>
          )}
        {context === "jobMonitor" && saveState !== "idle" && (
          <div className="absolute top-2 right-2 z-30">
            <div
              className={`
      px-3 py-2 rounded-lg shadow-lg border transition-all duration-300 transform
      ${
        saveState === "saving"
          ? "bg-blue-50 border-blue-200"
          : saveState === "success"
            ? "bg-green-50 border-green-200 scale-105"
            : "bg-red-50 border-red-200"
      }
    `}
            >
              <SaveStatusIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowActions(false)}
        />
      )}
    </div>
  );
};

export default MarkdownRenderer;
