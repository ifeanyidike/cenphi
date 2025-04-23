import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion, AnimatePresence } from "framer-motion";
import { workspaceHub } from "../../../repo/workspace_hub";
import SentimentAnalysis from "./SentimentAnalysis";
import KeyInsights from "./KeyInsights";
import TranscriptAnalysis from "./TranscriptAnalysis";
import EngagementMetrics from "./EngagementMetrics";
import Button from "../UI/Button";
import { AnalysisType } from "@/types/testimonial";

const AnalysisPanel: React.FC = observer(() => {
  const { analysisManager, uiManager } = workspaceHub;
  const { activeAnalysisType } = uiManager;
  const { isAnalyzing, analysisResults } = analysisManager;
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Function to get appropriate color theme based on analysis type
  const getAnalysisColorTheme = (type: AnalysisType | null) => {
    switch (type) {
      case "sentiment":
        return {
          light: {
            primary: "text-emerald-600",
            secondary: "bg-emerald-50",
            accent: "from-emerald-500 to-teal-500",
          },
          dark: {
            primary: "text-emerald-400",
            secondary: "bg-emerald-900/20",
            accent: "from-emerald-600 to-teal-600",
          },
        };
      case "key_insights":
        return {
          light: {
            primary: "text-blue-600",
            secondary: "bg-blue-50",
            accent: "from-blue-500 to-indigo-500",
          },
          dark: {
            primary: "text-blue-400",
            secondary: "bg-blue-900/20",
            accent: "from-blue-600 to-indigo-600",
          },
        };
      case "transcript":
        return {
          light: {
            primary: "text-amber-600",
            secondary: "bg-amber-50",
            accent: "from-amber-500 to-orange-500",
          },
          dark: {
            primary: "text-amber-400",
            secondary: "bg-amber-900/20",
            accent: "from-amber-600 to-orange-600",
          },
        };
      case "engagement":
        return {
          light: {
            primary: "text-purple-600",
            secondary: "bg-purple-50",
            accent: "from-purple-500 to-indigo-500",
          },
          dark: {
            primary: "text-purple-400",
            secondary: "bg-purple-900/20",
            accent: "from-purple-600 to-indigo-600",
          },
        };
      default:
        return {
          light: {
            primary: "text-slate-600",
            secondary: "bg-slate-50",
            accent: "from-slate-500 to-slate-600",
          },
          dark: {
            primary: "text-slate-400",
            secondary: "bg-slate-800/40",
            accent: "from-slate-600 to-slate-700",
          },
        };
    }
  };

  const colors = getAnalysisColorTheme(activeAnalysisType);
  const colorTheme = uiManager.isDarkMode ? colors.dark : colors.light;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
  };

  const renderAnalysisContent = () => {
    if (isAnalyzing) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="relative w-16 h-16 mb-4">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorTheme.accent} opacity-25 animate-ping`}
            ></div>
            <div className="relative flex items-center justify-center w-16 h-16">
              <svg
                className={`animate-spin h-10 w-10 ${colorTheme.primary}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          </div>
          <p
            className={`text-lg font-medium ${uiManager.isDarkMode ? "text-white" : "text-slate-700"}`}
          >
            Running Analysis
          </p>
          <p
            className={`text-sm mt-2 ${uiManager.isDarkMode ? "text-slate-400" : "text-slate-500"}`}
          >
            Extracting insights from your testimonial...
          </p>

          {/* Progress bar animation */}
          <div className="w-64 h-1.5 bg-slate-200 rounded-full mt-6 overflow-hidden">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${colorTheme.accent}`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut" }}
            />
          </div>
        </div>
      );
    }

    if (!activeAnalysisType || !analysisResults[activeAnalysisType]) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className={`p-6 rounded-full ${colorTheme.secondary} mb-4`}>
            <svg
              className={`w-16 h-16 ${colorTheme.primary}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h3
            className={`text-lg font-medium mb-2 ${uiManager.isDarkMode ? "text-white" : "text-slate-800"}`}
          >
            Ready to Analyze
          </h3>
          <p
            className={`text-sm max-w-md mx-auto ${uiManager.isDarkMode ? "text-slate-400" : "text-slate-600"}`}
          >
            Select an analysis type from the Action Panel to get started. Our AI
            tools can extract valuable insights from your testimonial.
          </p>

          {/* Quick action buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              variant={uiManager.isDarkMode ? "ghost" : "outline"}
              size="sm"
              onClick={() => {
                uiManager.setActiveAnalysisType("sentiment");
                analysisManager.runAnalysis(
                  "sentiment",
                  workspaceHub.testimonialManager.testimonial!
                );
              }}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" />
                </svg>
              }
            >
              Sentiment Analysis
            </Button>
            <Button
              variant={uiManager.isDarkMode ? "ghost" : "outline"}
              size="sm"
              onClick={() => {
                uiManager.setActiveAnalysisType("key_insights");
                analysisManager.runAnalysis(
                  "key_insights",
                  workspaceHub.testimonialManager.testimonial!
                );
              }}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Key Insights
            </Button>
          </div>
        </div>
      );
    }

    switch (activeAnalysisType) {
      case "sentiment":
        return <SentimentAnalysis data={analysisResults[activeAnalysisType]} />;
      case "key_insights":
        return <KeyInsights data={analysisResults[activeAnalysisType]} />;
      case "transcript":
        return (
          <TranscriptAnalysis data={analysisResults[activeAnalysisType]} />
        );
      case "engagement":
        return <EngagementMetrics data={analysisResults[activeAnalysisType]} />;
      default:
        return (
          <div className="p-6">
            <pre
              className={`p-4 rounded-lg whitespace-pre-wrap overflow-auto max-h-80 ${
                uiManager.isDarkMode
                  ? "bg-slate-800 text-slate-200"
                  : "bg-slate-50 text-slate-800"
              }`}
            >
              {JSON.stringify(analysisResults[activeAnalysisType], null, 2)}
            </pre>
          </div>
        );
    }
  };

  const getAnalysisTitle = (type: AnalysisType | null) => {
    switch (type) {
      case "sentiment":
        return "Sentiment Analysis";
      case "key_insights":
        return "Key Insights";
      case "transcript":
        return "Transcript Analysis";
      case "engagement":
        return "Engagement Metrics";
      default:
        return "Analysis Results";
    }
  };

  const getAnalysisDescription = (type: AnalysisType | null) => {
    switch (type) {
      case "sentiment":
        return "Understanding the emotional tone and sentiment behind the testimonial";
      case "key_insights":
        return "Extracting the most important points and messages from the testimonial";
      case "transcript":
        return "Detailed analysis of the testimonial transcript with speaker information";
      case "engagement":
        return "Metrics showing how users interact with and respond to this testimonial";
      default:
        return "Detailed analysis of your testimonial";
    }
  };

  const getAnalysisIcon = (type: AnalysisType | null) => {
    switch (type) {
      case "sentiment":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "key_insights":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        );
      case "transcript":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "engagement":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
        uiManager.isDarkMode
          ? "bg-slate-800/80 backdrop-blur-sm ring-1 ring-white/10"
          : "bg-white/90 backdrop-blur-sm ring-1 ring-black/5 shadow-xl"
      }`}
    >
      {/* Background highlights */}
      {activeAnalysisType && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${colorTheme.accent} opacity-10 blur-3xl transform rotate-12`}
          ></div>
          <div
            className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-tr ${colorTheme.accent} opacity-10 blur-3xl`}
          ></div>
        </div>
      )}

      <div className="relative p-6 z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            variants={itemVariants}
            className="flex justify-between items-start mb-6"
          >
            <div className="flex items-center">
              {activeAnalysisType && (
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg mr-4 flex items-center justify-center ${colorTheme.secondary}`}
                >
                  <span className={colorTheme.primary}>
                    {getAnalysisIcon(activeAnalysisType)}
                  </span>
                </div>
              )}
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    uiManager.isDarkMode ? "text-white" : "text-slate-800"
                  }`}
                >
                  {getAnalysisTitle(activeAnalysisType)}
                </h2>
                {activeAnalysisType && (
                  <p
                    className={`mt-1 text-sm ${
                      uiManager.isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                  >
                    {getAnalysisDescription(activeAnalysisType)}
                  </p>
                )}
              </div>
            </div>

            {activeAnalysisType &&
              !isAnalyzing &&
              analysisResults[activeAnalysisType] && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    }
                    onClick={() => {
                      // Toggle full screen or other view options
                    }}
                  >
                    <></>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    }
                    onClick={() => toggleSection("options")}
                  >
                    <></>
                  </Button>
                </div>
              )}
          </motion.div>

          {expandedSection === "options" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-6 p-4 rounded-lg ${
                uiManager.isDarkMode ? "bg-slate-700/50" : "bg-slate-50"
              }`}
            >
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={uiManager.isDarkMode ? "ghost" : "outline"}
                  size="sm"
                  className="justify-start"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                      <path
                        fillRule="evenodd"
                        d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  Save Analysis
                </Button>
                <Button
                  variant={uiManager.isDarkMode ? "ghost" : "outline"}
                  size="sm"
                  className="justify-start"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                    </svg>
                  }
                >
                  Export PDF
                </Button>
                <Button
                  variant={uiManager.isDarkMode ? "ghost" : "outline"}
                  size="sm"
                  className="justify-start"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  }
                >
                  Share Analysis
                </Button>
                <Button
                  variant={uiManager.isDarkMode ? "ghost" : "outline"}
                  size="sm"
                  className="justify-start"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  More Options
                </Button>
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeAnalysisType || "empty"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative"
            >
              {renderAnalysisContent()}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
});

export default AnalysisPanel;
