import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Search,
  Sparkles,
  Check,
  Loader2,
  Download,
  Copy,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudioContext } from "@/pages/Studio";
import { workspaceHub } from "@/repo/workspace_hub";
import { authStore } from "@/stores/authStore";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { marked } from "marked";

interface ContentGenerationConfigProps {
  context: StudioContext;
  onBack: () => void;
}

interface ContentType {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedLength: string;
}

const CONTENT_TYPES: ContentType[] = [
  {
    id: "email",
    name: "Email Campaign",
    description: "Professional email campaigns to engage customers",
    category: "marketing",
    estimatedLength: "Medium (300-500 words)",
  },
  {
    id: "blog",
    name: "Blog Post",
    description: "SEO-optimized blog articles",
    category: "content",
    estimatedLength: "Long (800-1200 words)",
  },
  {
    id: "case_study",
    name: "Case Study",
    description: "Detailed customer success analysis",
    category: "sales",
    estimatedLength: "Long (1000-1500 words)",
  },
  {
    id: "fundraising_talking_points",
    name: "Fundraising Talking Points",
    description: "Compelling points for investor presentations",
    category: "fundraising",
    estimatedLength: "Short (200-400 words)",
  },
  {
    id: "white_paper",
    name: "White Paper",
    description: "In-depth technical thought leadership",
    category: "thought_leadership",
    estimatedLength: "Very Long (2000-4000 words)",
  },
  {
    id: "sales_deck",
    name: "Sales Deck",
    description: "Persuasive presentation materials",
    category: "sales",
    estimatedLength: "Medium (400-600 words)",
  },
  {
    id: "roi_analysis",
    name: "ROI Analysis",
    description: "Financial impact reports",
    category: "analytics",
    estimatedLength: "Medium (500-800 words)",
  },
  {
    id: "competitive_analysis",
    name: "Competitive Analysis",
    description: "Market positioning content",
    category: "strategy",
    estimatedLength: "Long (800-1200 words)",
  },
  {
    id: "business_proposal",
    name: "Business Proposal",
    description: "Professional business proposals",
    category: "sales",
    estimatedLength: "Long (1000-1500 words)",
  },
  {
    id: "thought_leadership",
    name: "Thought Leadership Article",
    description: "Industry insights and expert commentary",
    category: "thought_leadership",
    estimatedLength: "Long (800-1200 words)",
  },
  {
    id: "customer_success_story",
    name: "Customer Success Story",
    description: "Narrative-driven customer achievements",
    category: "content",
    estimatedLength: "Medium (600-800 words)",
  },
  {
    id: "market_research_report",
    name: "Market Research Report",
    description: "Data-driven industry insights",
    category: "analytics",
    estimatedLength: "Very Long (1500-2500 words)",
  },
  {
    id: "sales_enablement_guide",
    name: "Sales Enablement Guide",
    description: "Training materials for sales teams",
    category: "sales",
    estimatedLength: "Long (1000-1500 words)",
  },
];

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  marketing: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  content: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  sales: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  fundraising: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  thought_leadership: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  analytics: {
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  strategy: {
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
  },
};

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8081/api";

const ContentGenerationConfig: React.FC<ContentGenerationConfigProps> = observer(({
  context,
  onBack,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const autoGenerateTriggered = useRef(false);

  const filteredTypes = CONTENT_TYPES.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTestimonialIds = (): string[] => {
    if (context.type === "testimonial") {
      return [context.testimonialId];
    } else if (context.type === "multi-testimonial") {
      return context.testimonialIds;
    }
    return [];
  };

  const handleGenerate = async () => {
    if (!selectedType) return;

    const testimonialIds = getTestimonialIds();
    const workspaceId = workspaceHub.workspace?.id;

    if (!workspaceId) {
      setError("No workspace selected");
      return;
    }

    if (testimonialIds.length === 0) {
      setError("Please select at least one testimonial");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent("");
    setStreamingContent("");
    setError(null);

    try {
      const tokenInfo = await authStore.getToken();

      console.log("Sending request:", {
        workspace_id: workspaceId,
        content_type: selectedType,
        testimonial_count: testimonialIds.length,
      });

      const response = await fetch(`${API_BASE_URL}/ai/generate-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenInfo.token}`,
        },
        body: JSON.stringify({
          workspace_id: workspaceId,
          content_type: selectedType,
          prompt: customPrompt.trim() || undefined,
          source: {
            type: "testimonial",
            from: "content_generation",
            data: testimonialIds,
            applied_services: ["content_generation"],
            metadata: {},
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`Failed to generate content: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body reader available");
      }

      let accumulatedContent = "";
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log(
            "Stream complete, total content length:",
            accumulatedContent.length
          );
          if (accumulatedContent) {
            setGeneratedContent(accumulatedContent);
            setStreamingContent("");
          }
          break;
        }

        // Backend sends raw text chunks, not SSE format
        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
          accumulatedContent += chunk;
          setStreamingContent(accumulatedContent);
          console.log(
            "Received chunk, total length:",
            accumulatedContent.length
          );
        }
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate content"
      );
      setStreamingContent("");
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-select content type from URL params
  useEffect(() => {
    const contentType = searchParams.get("contentType");
    if (contentType && !selectedType) {
      console.log("Auto-selecting content type:", contentType);
      setSelectedType(contentType);
    }
  }, [searchParams, selectedType]);

  // Auto-generate when content type is set and autoGenerate=true
  useEffect(() => {
    const autoGenerate = searchParams.get("autoGenerate") === "true";

    if (
      autoGenerate &&
      selectedType &&
      !autoGenerateTriggered.current &&
      !isGenerating &&
      !generatedContent &&
      !streamingContent
    ) {
      console.log("Auto-generating content for type:", selectedType);
      autoGenerateTriggered.current = true;

      // Remove autoGenerate param from URL to prevent re-triggering on refresh/back
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("autoGenerate");
      setSearchParams(newParams, { replace: true });

      handleGenerate();
    }
  }, [
    selectedType,
    searchParams,
    isGenerating,
    generatedContent,
    streamingContent,
    setSearchParams,
  ]);

  const handleCopy = async () => {
    const content = generatedContent || streamingContent;
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = generatedContent || streamingContent;
    if (!content) return;

    const selectedContentType = CONTENT_TYPES.find(
      (t) => t.id === selectedType
    );
    const filename = `${selectedContentType?.name.replace(/\s+/g, "_")}_${Date.now()}.md`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    const content = generatedContent || streamingContent;
    if (!content) return;

    try {
      const selectedContentType = CONTENT_TYPES.find(
        (t) => t.id === selectedType
      );
      const filename = `${selectedContentType?.name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;

      // Parse markdown to HTML
      const htmlContent = await marked.parse(content);

      // Create a temporary container with the rendered content
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.width = "800px";
      tempDiv.style.padding = "40px";
      tempDiv.style.backgroundColor = "white";
      tempDiv.style.fontFamily =
        "system-ui, -apple-system, 'Segoe UI', sans-serif";
      tempDiv.style.color = "#1e293b";
      tempDiv.innerHTML = `
        <div>
          <div style="margin-bottom: 32px; border-bottom: 3px solid #10b981; padding-bottom: 16px;">
            <h1 style="font-size: 28px; font-weight: 700; margin: 0 0 8px 0; color: #0f172a;">${selectedContentType?.name}</h1>
            <p style="font-size: 13px; color: #64748b; margin: 0;">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div style="font-size: 14px; line-height: 1.8; color: #334155;">
            ${htmlContent}
          </div>
        </div>
      `;

      // Apply comprehensive CSS styling for all markdown elements
      const style = document.createElement("style");
      style.textContent = `
        #pdf-temp-container h1 { font-size: 24px; font-weight: 700; margin: 28px 0 14px 0; color: #0f172a; line-height: 1.3; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        #pdf-temp-container h2 { font-size: 20px; font-weight: 600; margin: 24px 0 12px 0; color: #1e293b; line-height: 1.3; }
        #pdf-temp-container h3 { font-size: 17px; font-weight: 600; margin: 20px 0 10px 0; color: #334155; line-height: 1.3; }
        #pdf-temp-container h4 { font-size: 15px; font-weight: 600; margin: 16px 0 8px 0; color: #475569; line-height: 1.3; }
        #pdf-temp-container h5 { font-size: 14px; font-weight: 600; margin: 14px 0 7px 0; color: #64748b; line-height: 1.3; }
        #pdf-temp-container h6 { font-size: 13px; font-weight: 600; margin: 12px 0 6px 0; color: #64748b; line-height: 1.3; }
        #pdf-temp-container p { margin: 12px 0; line-height: 1.8; color: #334155; }
        #pdf-temp-container ul { margin: 12px 0; padding-left: 24px; list-style-type: disc; }
        #pdf-temp-container ol { margin: 12px 0; padding-left: 24px; list-style-type: decimal; }
        #pdf-temp-container li { margin: 6px 0; line-height: 1.7; color: #334155; }
        #pdf-temp-container li > ul, #pdf-temp-container li > ol { margin: 4px 0; }
        #pdf-temp-container strong { font-weight: 600; color: #0f172a; }
        #pdf-temp-container em { font-style: italic; color: #475569; }
        #pdf-temp-container a { color: #10b981; text-decoration: underline; }
        #pdf-temp-container code { background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; font-family: 'Courier New', monospace; color: #be185d; }
        #pdf-temp-container pre { background-color: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0; overflow-x: auto; }
        #pdf-temp-container pre code { background-color: transparent; padding: 0; color: #e2e8f0; }
        #pdf-temp-container blockquote { border-left: 4px solid #10b981; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic; background-color: #f0fdf4; padding: 12px 16px; border-radius: 4px; }
        #pdf-temp-container table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 13px; }
        #pdf-temp-container th { background-color: #10b981; color: white; padding: 10px 12px; text-align: left; font-weight: 600; }
        #pdf-temp-container td { border: 1px solid #e2e8f0; padding: 8px 12px; }
        #pdf-temp-container tr:nth-child(even) { background-color: #f8fafc; }
        #pdf-temp-container hr { border: none; border-top: 2px solid #e2e8f0; margin: 24px 0; }
      `;
      tempDiv.id = "pdf-temp-container";
      document.head.appendChild(style);
      document.body.appendChild(tempDiv);

      // Wait for fonts and styles to load
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(tempDiv);
      document.head.removeChild(style);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("Failed to generate PDF");
    }
  };

  const selectedContentType = CONTENT_TYPES.find((t) => t.id === selectedType);
  const testimonialIds = getTestimonialIds();
  const hasContent = !!(generatedContent || streamingContent);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-3 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Content Generation
              </h1>
              <p className="text-sm text-slate-600">
                Generate professional marketing content from{" "}
                {testimonialIds.length} testimonial
                {testimonialIds.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Content Type Selection */}
            <Card className="border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">
                  Select Content Type
                </h3>
              </div>

              <div className="p-4">
                {/* Search */}
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Content Types */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {filteredTypes.map((type) => {
                    const categoryStyle =
                      CATEGORY_COLORS[type.category] || CATEGORY_COLORS.content;
                    return (
                      <div
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`
                          relative cursor-pointer rounded-lg border p-3 transition-all
                          ${
                            selectedType === type.id
                              ? "border-green-500 bg-green-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }
                        `}
                      >
                        {selectedType === type.id && (
                          <div className="absolute top-2 right-2">
                            <Check className="h-4 w-4 text-green-600" />
                          </div>
                        )}

                        <div className="pr-6">
                          <div className="text-xs font-semibold text-slate-900 mb-1">
                            {type.name}
                          </div>
                          <p className="text-xs text-slate-600 mb-1.5">
                            {type.description}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
                          >
                            {type.category}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Custom Instructions */}
            <Card className="border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">
                  Custom Instructions{" "}
                  <span className="text-slate-500 font-normal">(Optional)</span>
                </h3>
              </div>
              <div className="p-4">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add specific requirements or style preferences..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                />
              </div>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!selectedType || isGenerating}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg disabled:opacity-50"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>

            {selectedContentType && (
              <div className="text-xs text-slate-600 space-y-1 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  Type: <strong>{selectedContentType.name}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  Length: <strong>{selectedContentType.estimatedLength}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Generated Content */}
          <div className="lg:col-span-3 sticky">
            <Card className="border-slate-200 shadow-sm h-full flex flex-col">
              <div className="p-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      Generated Content
                    </h3>
                    {selectedContentType && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {selectedContentType.name}
                      </p>
                    )}
                  </div>

                  {hasContent && !isGenerating && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleCopy}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1.5" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1.5" />
                            Copy
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={handleDownload}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                      >
                        <Download className="h-3 w-3 mr-1.5" />
                        MD
                      </Button>
                      <Button
                        onClick={handleDownloadPDF}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                      >
                        <FileDown className="h-3 w-3 mr-1.5" />
                        PDF
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 min-h-[600px]">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          Error
                        </p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {!hasContent && !isGenerating && !error && (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex items-center justify-center"
                    >
                      <div className="text-center max-w-sm">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-10 w-10 text-slate-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-900 mb-2">
                          No Content Generated Yet
                        </h4>
                        <p className="text-xs text-slate-600">
                          Select a content type and click "Generate Content" to
                          create professional marketing materials.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {isGenerating && !streamingContent && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex items-center justify-center"
                    >
                      <div className="text-center">
                        <Loader2 className="h-16 w-16 text-green-600 animate-spin mx-auto mb-4" />
                        <h4 className="text-sm font-medium text-slate-900 mb-2">
                          Generating Content...
                        </h4>
                        <p className="text-xs text-slate-600">
                          Analyzing testimonials and creating your content
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {(streamingContent || generatedContent) && (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-sm max-w-none"
                    >
                      <MarkdownRenderer
                        content={streamingContent || generatedContent}
                      />
                      {isGenerating && streamingContent && (
                        <span className="inline-block w-2 h-4 bg-green-600 animate-pulse ml-1 align-middle" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ContentGenerationConfig;
