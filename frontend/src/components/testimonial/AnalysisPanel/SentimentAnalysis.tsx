// components/AnalysisPanel/SentimentAnalysis.tsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import Button from "../UI/Button";
import Badge from "../UI/Badge";

interface SentimentAnalysisProps {
  data: {
    score: number;
    label: "positive" | "negative" | "neutral";
    breakdown?: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = observer(
  ({ data }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // State for animation
    const [isAnimating, setIsAnimating] = useState(true);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedSentiment, setSelectedSentiment] = useState<string | null>(
      null
    );

    // Calculate percentage for display
    const scorePercentage = Math.abs(data.score * 100).toFixed(1);

    // Reset animation on data change
    useEffect(() => {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 2000);

      return () => clearTimeout(timer);
    }, [data]);

    // Toggle detail view
    const toggleDetails = () => {
      setShowDetails(!showDetails);
    };

    // Select a sentiment type to highlight
    const toggleSentiment = (sentiment: string) => {
      setSelectedSentiment(selectedSentiment === sentiment ? null : sentiment);
    };

    // Example sentences for each sentiment
    const sentimentExamples = {
      positive: [
        "This product exceeded all my expectations!",
        "The customer service was outstanding.",
        "I would absolutely recommend this to anyone.",
      ],
      neutral: [
        "The product works as described.",
        "I've been using this for about a month now.",
        "It has some pros and cons.",
      ],
      negative: [
        "I was disappointed with the quality.",
        "It didn't work for me at all.",
        "Customer support was unresponsive.",
      ],
    };

    // Get color based on sentiment
    const getSentimentColor = (label: string): string => {
      switch (label) {
        case "positive":
          return isDarkMode ? "text-green-400" : "text-green-600";
        case "negative":
          return isDarkMode ? "text-red-400" : "text-red-600";
        case "neutral":
          return isDarkMode ? "text-blue-400" : "text-blue-600";
        default:
          return isDarkMode ? "text-white" : "text-slate-800";
      }
    };

    // Get background color based on sentiment
    const getSentimentBgColor = (label: string): string => {
      switch (label) {
        case "positive":
          return isDarkMode ? "bg-green-900/30" : "bg-green-50";
        case "negative":
          return isDarkMode ? "bg-red-900/30" : "bg-red-50";
        case "neutral":
          return isDarkMode ? "bg-blue-900/30" : "bg-blue-50";
        default:
          return isDarkMode ? "bg-slate-800" : "bg-slate-50";
      }
    };

    // Get badge color based on sentiment
    const getSentimentBadgeColor = (
      label: string
    ): "success" | "danger" | "info" => {
      switch (label) {
        case "positive":
          return "success";
        case "negative":
          return "danger";
        case "neutral":
          return "info";
        default:
          return "info";
      }
    };

    // Animation variants
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          when: "beforeChildren",
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: "easeOut",
        },
      },
    };

    const pulseVariants = {
      initial: { scale: 0.8, opacity: 0.5 },
      animate: {
        scale: [0.8, 1.02, 1],
        opacity: [0.5, 1, 1],
        transition: {
          duration: 1.5,
          ease: "easeOut",
          times: [0, 0.7, 1],
        },
      },
    };

    const scoreVariants = {
      initial: { opacity: 0, scale: 0.8 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.6,
          ease: "easeOut",
          delay: 0.2,
        },
      },
    };

    const barVariants = {
      hidden: { width: 0 },
      visible: (width: number) => ({
        width: `${width}%`,
        transition: {
          duration: 1,
          ease: "easeOut",
        },
      }),
    };

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6"
      >
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <motion.div
              variants={pulseVariants}
              initial="initial"
              animate={isAnimating ? "animate" : ""}
              className="relative flex items-center justify-center"
            >
              <svg className="w-48 h-48">
                <circle
                  cx="96"
                  cy="96"
                  r="90"
                  fill="none"
                  stroke={isDarkMode ? "#334155" : "#f1f5f9"}
                  strokeWidth="12"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="90"
                  fill="none"
                  stroke={
                    data.label === "positive"
                      ? "#22c55e"
                      : data.label === "negative"
                        ? "#ef4444"
                        : "#3b82f6"
                  }
                  strokeWidth="12"
                  strokeDasharray={565.48} // 2 * PI * r
                  initial={{ strokeDashoffset: 565.48 }}
                  animate={{
                    strokeDashoffset: 565.48 * (1 - Math.abs(data.score)),
                    transition: { duration: 1.5, ease: "easeOut" },
                  }}
                  strokeLinecap="round"
                  transform="rotate(-90 96 96)"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="82"
                  fill={isDarkMode ? "#0f172a" : "#ffffff"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.5 } }}
                />
              </svg>

              <motion.div
                variants={scoreVariants}
                initial="initial"
                animate="animate"
                className="absolute flex flex-col items-center justify-center"
              >
                <span
                  className={`text-4xl font-bold ${getSentimentColor(data.label)}`}
                >
                  {scorePercentage}%
                </span>
                <Badge
                  variant="soft"
                  color={getSentimentBadgeColor(data.label)}
                  shape="pill"
                  size="sm"
                  className="mt-1"
                >
                  {data.label.toUpperCase()}
                </Badge>
              </motion.div>
            </motion.div>
          </div>

          <motion.h2
            variants={itemVariants}
            className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
          >
            {data.label === "positive"
              ? "Overwhelmingly Positive"
              : data.label === "negative"
                ? "Significantly Negative"
                : "Generally Neutral"}{" "}
            Sentiment
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className={`max-w-xl mx-auto ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
          >
            {data.label === "positive"
              ? "This testimonial expresses strong positive sentiment, highlighting customer satisfaction and enthusiasm."
              : data.label === "negative"
                ? "This testimonial contains significant negative sentiment, indicating customer dissatisfaction or concerns."
                : "This testimonial expresses a balanced or neutral sentiment, with neither strong positive nor negative leanings."}
          </motion.p>
        </motion.div>

        {data.breakdown && (
          <motion.div
            variants={itemVariants}
            className={`mt-10 p-6 rounded-xl ${
              isDarkMode ? "bg-slate-800/50" : "bg-slate-50"
            }`}
          >
            <h3
              className={`text-lg font-semibold mb-6 ${isDarkMode ? "text-white" : "text-slate-800"}`}
            >
              Sentiment Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {["positive", "neutral", "negative"].map((sentiment) => {
                const value =
                  data.breakdown?.[sentiment as keyof typeof data.breakdown] ||
                  0;
                const percentage = (value * 100).toFixed(1);

                return (
                  <motion.div
                    key={sentiment}
                    variants={itemVariants}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedSentiment === sentiment
                        ? getSentimentBgColor(sentiment)
                        : isDarkMode
                          ? "bg-slate-800 hover:bg-slate-700"
                          : "bg-white hover:bg-slate-100"
                    } ${isDarkMode ? "border border-slate-700" : "shadow-sm"}`}
                    onClick={() => toggleSentiment(sentiment)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4
                        className={`font-medium capitalize ${getSentimentColor(sentiment)}`}
                      >
                        {sentiment}
                      </h4>
                      <span
                        className={`text-xl font-bold ${getSentimentColor(sentiment)}`}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className={`h-full rounded-full ${
                          sentiment === "positive"
                            ? "bg-green-500"
                            : sentiment === "negative"
                              ? "bg-red-500"
                              : "bg-blue-500"
                        }`}
                        custom={parseFloat(percentage)}
                        variants={barVariants}
                        initial="hidden"
                        animate="visible"
                      />
                    </div>

                    {selectedSentiment === sentiment && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-3"
                      >
                        <p
                          className={`text-sm mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                        >
                          Sample {sentiment} phrases:
                        </p>
                        <ul className="space-y-1">
                          {sentimentExamples[
                            sentiment as keyof typeof sentimentExamples
                          ].map((example, index) => (
                            <li
                              key={index}
                              className={`text-xs px-2 py-1 rounded ${
                                isDarkMode ? "bg-slate-800/80" : "bg-slate-100"
                              } ${getSentimentColor(sentiment)}`}
                            >
                              "{example}"
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className="mt-10">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDetails}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
            >
              {showDetails
                ? "Hide Technical Details"
                : "Show Technical Details"}
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
              >
                Re-analyze
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              >
                Export Results
              </Button>
            </div>
          </div>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`mt-4 p-4 rounded-lg overflow-x-auto ${
                isDarkMode ? "bg-slate-800" : "bg-slate-100"
              }`}
            >
              <h4
                className={`font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
              >
                Technical Analysis Details
              </h4>
              <pre
                className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                {`{
  "model": "sentiment-analysis-v3.2",
  "timestamp": "${new Date().toISOString()}",
  "score": ${data.score},
  "label": "${data.label}",
  "confidence": 0.92,
  "breakdown": {
    "positive": ${data.breakdown?.positive.toFixed(6) || 0},
    "neutral": ${data.breakdown?.neutral.toFixed(6) || 0},
    "negative": ${data.breakdown?.negative.toFixed(6) || 0}
  },
  "emotion_mapping": {
    "joy": 0.72,
    "trust": 0.65,
    "anticipation": 0.21,
    "surprise": 0.12
  }
}`}
              </pre>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }
);

export default SentimentAnalysis;
