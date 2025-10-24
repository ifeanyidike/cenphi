import React, { useState } from "react";
import { X, FileDown, FileText, FileJson, FileCode, Globe } from "lucide-react";
import SimpleModalPortal from "@/utils/SimpleModalPortal";
import { Testimonial } from "@/types/testimonial";
import {
  exportTestimonials,
  ExportFormat,
} from "@/utils/testimonialExport";
import { Button } from "@/components/ui/button";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  testimonials: Testimonial[];
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  testimonials,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("csv");
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeSentiment, setIncludeSentiment] = useState(true);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const formatOptions = [
    {
      value: "csv" as ExportFormat,
      label: "CSV",
      description: "Spreadsheet format, great for Excel or analytics",
      icon: FileText,
      activeClasses: "border-emerald-500 bg-emerald-50",
      iconBg: "bg-emerald-500",
      recommended: true,
    },
    {
      value: "json" as ExportFormat,
      label: "JSON",
      description: "Developer-friendly, perfect for APIs",
      icon: FileJson,
      activeClasses: "border-blue-500 bg-blue-50",
      iconBg: "bg-blue-500",
      recommended: false,
    },
    {
      value: "markdown" as ExportFormat,
      label: "Markdown",
      description: "Clean formatted text with styling",
      icon: FileCode,
      activeClasses: "border-purple-500 bg-purple-50",
      iconBg: "bg-purple-500",
      recommended: false,
    },
    {
      value: "html" as ExportFormat,
      label: "HTML",
      description: "Beautiful web page, ready to share",
      icon: Globe,
      activeClasses: "border-orange-500 bg-orange-50",
      iconBg: "bg-orange-500",
      recommended: false,
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);

    // Simulate brief delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    exportTestimonials(testimonials, {
      format: selectedFormat,
      includeMetrics,
      includeSentiment,
      includeTranscript,
    });

    setIsExporting(false);

    // Close modal after successful export
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const videoCount = testimonials.filter((t) => t.type === "video").length;
  const textCount = testimonials.filter((t) => t.type === "text").length;

  return (
    <SimpleModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Export Testimonials
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {testimonials.length} selected • {videoCount} video{videoCount !== 1 ? 's' : ''} • {textCount} text{textCount !== 1 ? '' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Export Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {formatOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFormat(option.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedFormat === option.value
                      ? `${option.activeClasses} shadow-md`
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        selectedFormat === option.value
                          ? option.iconBg
                          : "bg-slate-100"
                      }`}
                    >
                      <option.icon
                        className={`w-4 h-4 ${
                          selectedFormat === option.value
                            ? "text-white"
                            : "text-slate-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            selectedFormat === option.value
                              ? "text-slate-900"
                              : "text-slate-700"
                          }`}
                        >
                          {option.label}
                        </span>
                        {option.recommended && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {selectedFormat === option.value && (
                    <div className="absolute top-3 right-3">
                      <div className={`w-5 h-5 rounded-full ${option.iconBg} flex items-center justify-center`}>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-3 uppercase tracking-wide">
              Include Data
            </label>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSentiment}
                  onChange={(e) => setIncludeSentiment(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    Sentiment Analysis
                  </div>
                  <div className="text-xs text-slate-500">
                    Include sentiment scores and labels
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetrics}
                  onChange={(e) => setIncludeMetrics(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    Performance Metrics
                  </div>
                  <div className="text-xs text-slate-500">
                    Include conversion and view counts
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTranscript}
                  onChange={(e) => setIncludeTranscript(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-900">
                    Video Transcripts
                  </div>
                  <div className="text-xs text-slate-500">
                    Include full transcripts for video testimonials
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileDown className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900 mb-1">
                  What's included in the export?
                </p>
                <ul className="text-xs text-slate-600 space-y-0.5">
                  <li>• Author information (name, email, company, title)</li>
                  <li>• Testimonial content and ratings</li>
                  <li>• Media URLs for video testimonials</li>
                  <li>• Timestamps and processing status</li>
                  {includeSentiment && <li>• Sentiment analysis data</li>}
                  {includeMetrics && <li>• Performance metrics</li>}
                  {includeTranscript && <li>• Video transcripts</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Export {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    </SimpleModalPortal>
  );
};

export default ExportModal;
