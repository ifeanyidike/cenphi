// components/AnalysisPanel/EngagementMetrics.tsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import Button from "../UI/Button";
import Badge from "../UI/Badge";

interface EngagementMetricsProps {
  data: {
    overallScore: number;
    metrics: {
      viewCompletion: number;
      shareRate: number;
      conversionImpact: number;
      audienceRetention: number;
    };
    trends: {
      weekly: string;
      monthly: string;
    };
  };
}

const EngagementMetrics: React.FC<EngagementMetricsProps> = observer(
  ({ data }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    // State
    const [activeTab, setActiveTab] = useState<
      "metrics" | "trends" | "recommendations"
    >("metrics");
    const [animateScore, setAnimateScore] = useState(false);
    const [showScoreDetails, setShowScoreDetails] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const [comparisonMode, setComparisonMode] = useState<
      "average" | "best" | "similar"
    >("average");

    // Trigger score animation on mount
    useEffect(() => {
      setAnimateScore(true);

      const timer = setTimeout(() => {
        setAnimateScore(false);
      }, 2000);

      return () => clearTimeout(timer);
    }, []);

    // Toggle score details
    const toggleScoreDetails = () => {
      setShowScoreDetails(!showScoreDetails);
    };

    // Select a metric for detailed view
    const selectMetric = (metric: string) => {
      setSelectedMetric(selectedMetric === metric ? null : metric);
    };

    // Set comparison mode
    const changeComparisonMode = (mode: "average" | "best" | "similar") => {
      setComparisonMode(mode);
    };

    // Helper to generate comparison data
    const getComparisonData = (value: number) => {
      switch (comparisonMode) {
        case "average":
          return value * 0.8; // 80% of current value
        case "best":
          return value * 1.2; // 120% of current value
        case "similar":
          return value * (0.9 + Math.random() * 0.2); // 90-110% of current value
        default:
          return value * 0.8;
      }
    };

    // Helper to format percentage
    const formatPercentage = (value: number): string => {
      return `${(value * 100).toFixed(1)}%`;
    };

    // Helper to get color based on performance (good, average, needs improvement)
    const getMetricColor = (
      value: number
    ): "success" | "warning" | "danger" | "info" => {
      if (value >= 0.7) return "success";
      if (value >= 0.4) return "warning";
      return "danger";
    };

    // Helper to get trend icon
    const getTrendIcon = (trend: string) => {
      if (trend.includes("+")) {
        return (
          <svg
            className="w-4 h-4 text-emerald-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      } else {
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      }
    };

    // Sample recommendations data
    const recommendations = [
      {
        title: "Improve Share Rate",
        description:
          "Add clear share buttons and CTAs to increase viral potential.",
        difficulty: "Easy",
        impact: "Medium",
      },
      {
        title: "Boost Conversion Impact",
        description:
          "Feature this testimonial on product pages near the purchase button.",
        difficulty: "Medium",
        impact: "High",
      },
      {
        title: "Enhance Retention",
        description:
          "Edit the testimonial to highlight the key benefits in the first 10 seconds.",
        difficulty: "Medium",
        impact: "High",
      },
    ];

    // Sample historical data for charts
    const historicalData = {
      views: [420, 480, 520, 780, 840, 990, 1248],
      shares: [32, 38, 45, 60, 72, 80, 89],
      conversion: [0.18, 0.22, 0.25, 0.28, 0.3, 0.32, 0.34],
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

    const scoreCircleVariants = {
      hidden: { pathLength: 0 },
      visible: {
        pathLength: data.overallScore / 100,
        transition: { duration: 1.5, ease: "easeOut" },
      },
    };

    const scoreNumberVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { delay: 0.5, duration: 0.5 } },
    };

    const barVariants = {
      hidden: { width: 0 },
      visible: (custom: number) => ({
        width: `${custom * 100}%`,
        transition: { duration: 1, ease: "easeOut" },
      }),
    };

    const pulseVariants = {
      pulse: {
        scale: [1, 1.03, 1],
        opacity: [1, 0.9, 1],
        transition: { duration: 1.5, repeat: Infinity, repeatType: "reverse" },
      },
    };

    const detailsVariants = {
      hidden: { opacity: 0, height: 0 },
      visible: {
        opacity: 1,
        height: "auto",
        transition: { duration: 0.3 },
      },
    };

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="p-6"
      >
        {/* Header section */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8"
        >
          <div>
            <h2
              className={`text-2xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
            >
              Engagement Analysis
            </h2>
            <p
              className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
            >
              How this testimonial resonates with your audience
            </p>
          </div>

          <div
            className={`relative flex items-center rounded-xl p-4 ${
              isDarkMode
                ? "bg-slate-800 border border-slate-700"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
            }`}
          >
            <div className="mr-3 relative">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                  strokeWidth="8"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke={isDarkMode ? "#3b82f6" : "#3b82f6"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="226.2" // 2π × r
                  strokeDashoffset="226.2" // Start from empty
                  variants={scoreCircleVariants}
                  custom={data.overallScore / 100}
                />
              </svg>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                variants={scoreNumberVariants}
              >
                <motion.p
                  className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  animate={animateScore ? "pulse" : ""}
                  //@ts-expect-error skip this error
                  variants={pulseVariants}
                >
                  {data.overallScore}
                </motion.p>
              </motion.div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  Overall Score
                </h3>
                <button
                  className={`p-1 rounded-full ${
                    isDarkMode ? "hover:bg-slate-700" : "hover:bg-blue-100"
                  }`}
                  onClick={toggleScoreDetails}
                >
                  <svg
                    className={`w-4 h-4 ${
                      isDarkMode ? "text-slate-400" : "text-slate-500"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex space-x-3 mt-1">
                <div className="flex items-center gap-1">
                  <div
                    className={`inline-flex items-center ${
                      data.trends.weekly.includes("+")
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {getTrendIcon(data.trends.weekly)}
                    <span className="text-sm font-medium">
                      {data.trends.weekly}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    week
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <div
                    className={`inline-flex items-center ${
                      data.trends.monthly.includes("+")
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {getTrendIcon(data.trends.monthly)}
                    <span className="text-sm font-medium">
                      {data.trends.monthly}
                    </span>
                  </div>
                  <span
                    className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    month
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Score details panel */}
        <AnimatePresence>
          {showScoreDetails && (
            <motion.div
              variants={detailsVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={`mb-6 p-4 rounded-lg ${
                isDarkMode ? "bg-slate-800" : "bg-blue-50"
              }`}
            >
              <div className="flex gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isDarkMode ? "bg-slate-700" : "bg-blue-100"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h4
                    className={`font-medium mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    How the Engagement Score is Calculated
                  </h4>
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                  >
                    The engagement score is a weighted average of view
                    completion (30%), share rate (20%), conversion impact (30%),
                    and audience retention (20%). Scores above 80 are considered
                    excellent, 60-80 good, and below 60 may need improvement.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <motion.div
          variants={itemVariants}
          className={`border-b mb-6 ${
            isDarkMode ? "border-slate-700" : "border-slate-200"
          }`}
        >
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`pb-2 text-sm font-medium border-b-2 ${
                activeTab === "metrics"
                  ? isDarkMode
                    ? "text-white border-blue-500"
                    : "text-slate-900 border-blue-500"
                  : isDarkMode
                    ? "text-slate-400 border-transparent hover:text-slate-300"
                    : "text-slate-500 border-transparent hover:text-slate-700"
              } transition-colors`}
            >
              Key Metrics
            </button>
            <button
              onClick={() => setActiveTab("trends")}
              className={`pb-2 text-sm font-medium border-b-2 ${
                activeTab === "trends"
                  ? isDarkMode
                    ? "text-white border-blue-500"
                    : "text-slate-900 border-blue-500"
                  : isDarkMode
                    ? "text-slate-400 border-transparent hover:text-slate-300"
                    : "text-slate-500 border-transparent hover:text-slate-700"
              } transition-colors`}
            >
              Historical Trends
            </button>
            <button
              onClick={() => setActiveTab("recommendations")}
              className={`pb-2 text-sm font-medium border-b-2 ${
                activeTab === "recommendations"
                  ? isDarkMode
                    ? "text-white border-blue-500"
                    : "text-slate-900 border-blue-500"
                  : isDarkMode
                    ? "text-slate-400 border-transparent hover:text-slate-300"
                    : "text-slate-500 border-transparent hover:text-slate-700"
              } transition-colors`}
            >
              Recommendations
            </button>
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {/* Key Metrics Tab */}
          {activeTab === "metrics" && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3
                  className={`font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  Performance Metrics
                </h3>

                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={isDarkMode ? "text-slate-400" : "text-slate-500"}
                  >
                    Compare to:
                  </span>
                  <div
                    className={`flex rounded-lg overflow-hidden ${
                      isDarkMode ? "bg-slate-800" : "bg-slate-100"
                    }`}
                  >
                    {[
                      { id: "average", label: "Average" },
                      { id: "best", label: "Best" },
                      { id: "similar", label: "Similar" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        className={`px-3 py-1 text-xs ${
                          comparisonMode === item.id
                            ? isDarkMode
                              ? "bg-blue-600 text-white"
                              : "bg-blue-500 text-white"
                            : isDarkMode
                              ? "text-slate-300 hover:bg-slate-700"
                              : "text-slate-600 hover:bg-slate-200"
                        }`}
                        onClick={() => changeComparisonMode(item.id as any)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(data.metrics).map(([key, value], index) => {
                  const compValue = getComparisonData(value);
                  const metricName = key
                    .replace(/([A-Z])/g, " $1")
                    .toLowerCase();
                  const metricColor = getMetricColor(value);

                  return (
                    <motion.div
                      key={key}
                      variants={itemVariants}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedMetric === key
                          ? isDarkMode
                            ? "bg-slate-700 shadow-lg"
                            : "bg-white shadow-lg border border-slate-200"
                          : isDarkMode
                            ? "bg-slate-800 hover:bg-slate-700"
                            : "bg-white hover:bg-slate-50 border border-slate-200"
                      }`}
                      onClick={() => selectMetric(key)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4
                            className={`font-medium capitalize ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            {metricName}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="soft" color={metricColor} size="xs">
                              {value >= 0.7
                                ? "Excellent"
                                : value >= 0.4
                                  ? "Good"
                                  : "Needs Improvement"}
                            </Badge>
                            <span
                              className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                            >
                              (ranked {index + 1}/4)
                            </span>
                          </div>
                        </div>
                        <div
                          className={`text-xl font-bold ${
                            isDarkMode
                              ? `text-${metricColor}-400`
                              : `text-${metricColor}-600`
                          }`}
                        >
                          {formatPercentage(value)}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span
                              className={
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }
                            >
                              Current
                            </span>
                            <span
                              className={
                                isDarkMode ? "text-white" : "text-slate-800"
                              }
                            >
                              {formatPercentage(value)}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full bg-${metricColor}-500`}
                              custom={value}
                              variants={barVariants}
                              initial="hidden"
                              animate="visible"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span
                              className={
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }
                            >
                              {comparisonMode.charAt(0).toUpperCase() +
                                comparisonMode.slice(1)}
                            </span>
                            <span
                              className={
                                isDarkMode ? "text-slate-300" : "text-slate-600"
                              }
                            >
                              {formatPercentage(compValue)}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isDarkMode ? "bg-slate-500" : "bg-slate-400"
                              }`}
                              style={{ width: `${compValue * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {selectedMetric === key && (
                          <motion.div
                            variants={detailsVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className={`mt-4 pt-4 border-t ${
                              isDarkMode
                                ? "border-slate-700"
                                : "border-slate-200"
                            }`}
                          >
                            <div
                              className={`p-3 rounded-lg ${
                                isDarkMode ? "bg-slate-800" : "bg-slate-50"
                              }`}
                            >
                              <h5
                                className={`text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                              >
                                What This Means
                              </h5>
                              <p
                                className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                              >
                                {key === "viewCompletion"
                                  ? "View completion measures how many viewers watched the entire testimonial. A high rate indicates engaging content that holds attention."
                                  : key === "shareRate"
                                    ? "Share rate tracks how often viewers share this testimonial with others. This impacts reach and viral potential."
                                    : key === "conversionImpact"
                                      ? "Conversion impact measures how this testimonial influences purchase decisions when displayed on product pages."
                                      : "Audience retention tracks how well this testimonial maintains viewer attention throughout its duration."}
                              </p>

                              <h5
                                className={`text-sm font-medium mt-3 mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                              >
                                Improvement Tip
                              </h5>
                              <p
                                className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                              >
                                {key === "viewCompletion"
                                  ? "Consider trimming the testimonial to highlight the most impactful statements first to increase completion rates."
                                  : key === "shareRate"
                                    ? "Add clear share buttons and a compelling call-to-action to encourage sharing."
                                    : key === "conversionImpact"
                                      ? "Feature this testimonial closer to the purchase button or within the checkout flow."
                                      : "Edit the testimonial to place the most engaging content in the first 10 seconds."}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Historical Trends Tab */}
          {activeTab === "trends" && (
            <motion.div
              key="trends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  variants={itemVariants}
                  className={`p-4 rounded-lg ${
                    isDarkMode
                      ? "bg-slate-800 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <h4
                    className={`font-medium mb-4 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Views Over Time
                  </h4>

                  <div className="h-40 flex items-end space-x-2">
                    {historicalData.views.map((views, index) => {
                      const height =
                        (views / Math.max(...historicalData.views)) * 100;
                      const isCurrent =
                        index === historicalData.views.length - 1;

                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center"
                        >
                          <motion.div
                            className={`w-full rounded-t-sm ${
                              isCurrent
                                ? "bg-gradient-to-t from-blue-500 to-indigo-600"
                                : isDarkMode
                                  ? "bg-slate-700"
                                  : "bg-slate-200"
                            }`}
                            initial={{ height: 0 }}
                            animate={{ height: `${height}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          />
                          <span
                            className={`text-xs mt-1 ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            W{index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span
                      className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Latest:{" "}
                      {historicalData.views[historicalData.views.length - 1]}{" "}
                      views
                    </span>
                    <div
                      className={`flex items-center gap-1 ${
                        historicalData.views[historicalData.views.length - 1] >
                        historicalData.views[historicalData.views.length - 2]
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {historicalData.views[historicalData.views.length - 1] >
                      historicalData.views[historicalData.views.length - 2]
                        ? getTrendIcon("+25%")
                        : getTrendIcon("-25%")}
                      <span className="text-sm font-medium">
                        {Math.round(
                          ((historicalData.views[
                            historicalData.views.length - 1
                          ] -
                            historicalData.views[
                              historicalData.views.length - 2
                            ]) /
                            historicalData.views[
                              historicalData.views.length - 2
                            ]) *
                            100
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className={`p-4 rounded-lg ${
                    isDarkMode
                      ? "bg-slate-800 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <h4
                    className={`font-medium mb-4 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Conversion Impact Trend
                  </h4>

                  <div className="h-40 relative">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 300 100"
                      preserveAspectRatio="none"
                    >
                      {/* Background grid */}
                      <g
                        className={
                          isDarkMode ? "text-slate-700" : "text-slate-200"
                        }
                      >
                        <line
                          x1="0"
                          y1="0"
                          x2="300"
                          y2="0"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="25"
                          x2="300"
                          y2="25"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="50"
                          x2="300"
                          y2="50"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="75"
                          x2="300"
                          y2="75"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="100"
                          x2="300"
                          y2="100"
                          stroke="currentColor"
                          strokeWidth="1"
                        />
                      </g>

                      {/* Line chart */}
                      <motion.path
                        d={`M 0,${100 - historicalData.conversion[0] * 100 * 3} ${historicalData.conversion
                          .slice(1)
                          .map((value, index) => {
                            return `L ${(index + 1) * (300 / (historicalData.conversion.length - 1))},${100 - value * 100 * 3}`;
                          })
                          .join(" ")}`}
                        fill="none"
                        stroke={isDarkMode ? "#3b82f6" : "#3b82f6"}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />

                      {/* Data points */}
                      {historicalData.conversion.map((value, index) => (
                        <motion.circle
                          key={index}
                          cx={
                            index *
                            (300 / (historicalData.conversion.length - 1))
                          }
                          cy={100 - value * 100 * 3}
                          r="4"
                          fill={isDarkMode ? "#60a5fa" : "#3b82f6"}
                          stroke={isDarkMode ? "#1e293b" : "white"}
                          strokeWidth="2"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                        />
                      ))}
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs">
                      <span
                        className={
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }
                      >
                        40%
                      </span>
                      <span
                        className={
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }
                      >
                        30%
                      </span>
                      <span
                        className={
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }
                      >
                        20%
                      </span>
                      <span
                        className={
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }
                      >
                        10%
                      </span>
                      <span
                        className={
                          isDarkMode ? "text-slate-400" : "text-slate-500"
                        }
                      >
                        0%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <span
                      className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                    >
                      Current:{" "}
                      {formatPercentage(
                        historicalData.conversion[
                          historicalData.conversion.length - 1
                        ]
                      )}
                    </span>
                    <Badge variant="soft" color="success" size="sm">
                      Positive Trend
                    </Badge>
                  </div>
                </motion.div>
              </div>

              <motion.div
                variants={itemVariants}
                className={`mt-6 p-4 rounded-lg ${
                  isDarkMode
                    ? "bg-slate-800 border border-slate-700"
                    : "bg-white border border-slate-200"
                }`}
              >
                <h4
                  className={`font-medium mb-3 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  Key Performance Indicators
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Total Views",
                      value: "1,248",
                      change: "+26%",
                      positive: true,
                    },
                    {
                      label: "Total Shares",
                      value: "89",
                      change: "+11%",
                      positive: true,
                    },
                    {
                      label: "Avg. Watch Time",
                      value: "45s",
                      change: "-5%",
                      positive: false,
                    },
                    {
                      label: "Conversion Rate",
                      value: "34%",
                      change: "+6%",
                      positive: true,
                    },
                  ].map((kpi, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${
                        isDarkMode ? "bg-slate-700" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {kpi.label}
                        </span>
                        <div
                          className={`flex items-center gap-1 ${
                            kpi.positive ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {kpi.positive ? getTrendIcon("+") : getTrendIcon("-")}
                          <span className="text-xs font-medium">
                            {kpi.change}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-bold mt-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        {kpi.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className={`mt-4 p-3 rounded-lg ${
                    isDarkMode
                      ? "bg-blue-900/20 border border-blue-900/30"
                      : "bg-blue-50 border border-blue-100"
                  }`}
                >
                  <div className="flex items-start">
                    <svg
                      className={`w-5 h-5 mt-0.5 mr-2 ${
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h5
                        className={`text-sm font-medium mb-1 ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}
                      >
                        Performance Insight
                      </h5>
                      <p
                        className={`text-sm ${isDarkMode ? "text-blue-200" : "text-blue-600"}`}
                      >
                        This testimonial shows a consistent upward trend in
                        engagement metrics over the past 7 weeks. It's
                        performing 23% better than similar testimonials, with
                        particularly strong conversion impact. Consider
                        featuring this testimonial more prominently in your
                        marketing materials.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Recommendations Tab */}
          {activeTab === "recommendations" && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                {recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    className={`p-4 rounded-lg ${
                      isDarkMode
                        ? "bg-slate-800 border border-slate-700"
                        : "bg-white border border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-lg ${
                          rec.impact === "High"
                            ? isDarkMode
                              ? "bg-emerald-900/30"
                              : "bg-emerald-50"
                            : isDarkMode
                              ? "bg-amber-900/30"
                              : "bg-amber-50"
                        }`}
                      >
                        <svg
                          className={`w-6 h-6 ${
                            rec.impact === "High"
                              ? isDarkMode
                                ? "text-emerald-400"
                                : "text-emerald-500"
                              : isDarkMode
                                ? "text-amber-400"
                                : "text-amber-500"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4
                            className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                          >
                            {rec.title}
                          </h4>
                          <div className="flex gap-2">
                            <Badge
                              variant="soft"
                              color={
                                rec.difficulty === "Easy"
                                  ? "success"
                                  : rec.difficulty === "Medium"
                                    ? "warning"
                                    : "danger"
                              }
                              size="xs"
                            >
                              {rec.difficulty} Difficulty
                            </Badge>

                            <Badge
                              variant="soft"
                              color={
                                rec.impact === "High" ? "success" : "warning"
                              }
                              size="xs"
                            >
                              {rec.impact} Impact
                            </Badge>
                          </div>
                        </div>

                        <p
                          className={`text-sm mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {rec.description}
                        </p>

                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className={
                              isDarkMode
                                ? "border-slate-700 text-slate-300"
                                : ""
                            }
                          >
                            Implement Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  variants={itemVariants}
                  className={`p-4 rounded-lg border ${
                    isDarkMode
                      ? "bg-blue-900/20 border-blue-900/30"
                      : "bg-blue-50 border-blue-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-8 h-8 ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a1 1 0 11-2 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                      </svg>
                      <div>
                        <h4
                          className={`font-medium ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}
                        >
                          Advanced AI Recommendations Available
                        </h4>
                        <p
                          className={`text-sm ${isDarkMode ? "text-blue-200" : "text-blue-600"}`}
                        >
                          Get personalized recommendations based on your
                          specific business goals
                        </p>
                      </div>
                    </div>

                    <Button variant="primary" size="sm">
                      Upgrade to Pro
                    </Button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex justify-between"
        >
          <Button
            variant="outline"
            size="sm"
            icon={
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            }
            className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
          >
            Refresh Data
          </Button>

          <div className="flex gap-2">
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
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
            >
              Export Report
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
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              View Full Analysis
            </Button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

export default EngagementMetrics;
