// components/AIFeedback.tsx
import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check as CheckIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AIFeedbackProps {
  feedback: {
    sentiment: "positive" | "negative" | "neutral";
    score: number;
    summary: string;
    suggestions?: string[];
    keywords?: string[];
    contentWarnings?: string[];
  };
  className?: string;
}

export const AIFeedback: React.FC<AIFeedbackProps> = ({
  feedback,
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const getSentimentColor = () => {
    switch (feedback.sentiment) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getSentimentIcon = () => {
    switch (feedback.sentiment) {
      case "positive":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "negative":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(feedback.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-lg border p-6", getSentimentColor(), className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getSentimentIcon()}
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            Confidence Score: {Math.round(feedback.score * 100)}%
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="relative mb-6 bg-white rounded-md p-4">
        <div className="prose prose-sm max-w-none">{feedback.summary}</div>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-md transition-colors"
          title="Copy summary"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CheckIcon className="w-4 h-4 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Keywords */}
      {feedback.keywords && feedback.keywords.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Key Themes</h4>
          <div className="flex flex-wrap gap-2">
            {feedback.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {feedback.suggestions && feedback.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Suggestions</h4>
          <ul className="space-y-2">
            {feedback.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <div className="w-5 h-5 flex items-center justify-center rounded-full bg-white shrink-0">
                  {index + 1}
                </div>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Warnings */}
      {feedback.contentWarnings && feedback.contentWarnings.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">
            Content Notices
          </h4>
          <ul className="space-y-1">
            {feedback.contentWarnings.map((warning, index) => (
              <li
                key={index}
                className="text-sm text-yellow-700 flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
};
