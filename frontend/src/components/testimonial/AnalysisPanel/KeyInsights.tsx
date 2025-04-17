// components/AnalysisPanel/KeyInsights.tsx

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../../repo/workspace_hub";
import Button from "../UI/Button";
import Badge from "../UI/Badge";

interface KeyInsightsProps {
  data: string[];
}

const KeyInsights: React.FC<KeyInsightsProps> = observer(({ data }) => {
  const { uiManager } = workspaceHub;
  const { isDarkMode } = uiManager;
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [insightsTags, setInsightsTags] = useState<Record<number, string[]>>({
    0: ["Product", "Quality", "Satisfaction"],
    1: ["Service", "Speed", "Responsiveness"],
    2: ["Value", "Price", "Comparison"],
    3: ["Referral", "Loyalty", "Recommendation"],
  });
  const [expandedTagIndex, setExpandedTagIndex] = useState<number | null>(null);
  const [filterByTag, setFilterByTag] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // All possible tags for filtering
  const allTags = Array.from(
    new Set(Object.values(insightsTags).flat())
  ).sort();

  // Toggle expanded state for an insight
  const toggleInsight = (index: number) => {
    setExpandedInsight(expandedInsight === index ? null : index);
  };

  // Toggle AI explanation
  const toggleAIExplanation = () => {
    setShowAIExplanation(!showAIExplanation);
  };

  // Toggle tag expansion
  const toggleTagExpansion = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedTagIndex(expandedTagIndex === index ? null : index);
  };

  // Toggle tag filter
  const toggleTagFilter = (tag: string) => {
    setFilterByTag(filterByTag === tag ? null : tag);
  };

  // Toggle export menu
  const toggleExportMenu = () => {
    setShowExportMenu(!showExportMenu);
  };

  // Add a tag to an insight
  const addTag = (insightIndex: number, tag: string) => {
    if (!insightsTags[insightIndex]?.includes(tag)) {
      setInsightsTags({
        ...insightsTags,
        [insightIndex]: [...(insightsTags[insightIndex] || []), tag],
      });
    }
    setExpandedTagIndex(null);
  };

  // Remove a tag from an insight
  const removeTag = (
    insightIndex: number,
    tag: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    setInsightsTags({
      ...insightsTags,
      [insightIndex]: insightsTags[insightIndex].filter((t) => t !== tag),
    });
  };

  // Get icon based on insight content
  const getInsightIcon = (insight: string) => {
    if (insight.toLowerCase().includes("quality")) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (
      insight.toLowerCase().includes("service") ||
      insight.toLowerCase().includes("speed")
    ) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (
      insight.toLowerCase().includes("price") ||
      insight.toLowerCase().includes("value")
    ) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (
      insight.toLowerCase().includes("recommend") ||
      insight.toLowerCase().includes("referral")
    ) {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
  };

  // Get a color for a tag
  const getTagColor = (
    tag: string
  ):
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "danger" => {
    const tagMap: Record<
      string,
      | "primary"
      | "secondary"
      | "accent"
      | "info"
      | "success"
      | "warning"
      | "danger"
    > = {
      Product: "primary",
      Quality: "success",
      Satisfaction: "accent",
      Service: "secondary",
      Speed: "info",
      Responsiveness: "primary",
      Value: "warning",
      Price: "accent",
      Comparison: "info",
      Referral: "danger",
      Loyalty: "success",
      Recommendation: "secondary",
    };

    return tagMap[tag] || "primary";
  };

  // Filter insights by tag if filter is active
  const filteredInsights = filterByTag
    ? data.filter((_, index) => insightsTags[index]?.includes(filterByTag))
    : data;

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

  const expandVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
      },
    },
  };

  const tagContainerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
      },
    },
  };

  const exportMenuVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6"
    >
      <motion.div
        variants={itemVariants}
        className="mb-6 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <h2
            className={`text-2xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}
          >
            Key Insights
          </h2>
          <p className={`${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            AI-extracted insights from this testimonial
          </p>
        </div>

        <div className="flex items-center gap-3">
          {filterByTag && (
            <Badge
              variant="soft"
              color={getTagColor(filterByTag)}
              size="sm"
              className="animate-pulse"
              icon={
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            >
              Filtering: {filterByTag}
              <button
                className="ml-1 hover:text-black dark:hover:text-white"
                onClick={() => setFilterByTag(null)}
              >
                ×
              </button>
            </Badge>
          )}

          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleExportMenu}
              className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
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
              Export
            </Button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  ref={exportMenuRef}
                  variants={exportMenuVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-10 ${
                    isDarkMode
                      ? "bg-slate-800 border border-slate-700"
                      : "bg-white border border-slate-200"
                  }`}
                >
                  <div className="py-1">
                    {[
                      { format: "PDF", icon: "📄" },
                      { format: "Word", icon: "📝" },
                      { format: "CSV", icon: "📊" },
                      { format: "Image", icon: "🖼️" },
                    ].map((item) => (
                      <button
                        key={item.format}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                          isDarkMode
                            ? "text-slate-300 hover:bg-slate-700"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                        onClick={() => {
                          // Handle export
                          setShowExportMenu(false);
                        }}
                      >
                        <span className="mr-2">{item.icon}</span>
                        Export as {item.format}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant={showAIExplanation ? "primary" : "outline"}
            size="sm"
            onClick={toggleAIExplanation}
            className={
              !showAIExplanation && isDarkMode
                ? "border-slate-700 text-slate-300"
                : ""
            }
            icon={
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            }
          >
            AI Explanation
          </Button>
        </div>
      </motion.div>

      {/* Tag filter section */}
      <motion.div variants={itemVariants} className="mb-6">
        <div
          className={`p-3 rounded-lg flex flex-wrap gap-2 ${
            isDarkMode ? "bg-slate-800" : "bg-slate-100"
          }`}
        >
          <span
            className={`text-xs font-medium flex items-center ${
              isDarkMode ? "text-slate-300" : "text-slate-700"
            }`}
          >
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
            Filter by tag:
          </span>

          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTagFilter(tag)}
              className={`text-xs px-2 py-1 rounded-full ${
                filterByTag === tag
                  ? `bg-${getTagColor(tag)}-500 text-white`
                  : isDarkMode
                    ? `bg-slate-700 text-${getTagColor(tag)}-300 hover:bg-slate-600`
                    : `bg-white text-${getTagColor(tag)}-700 hover:bg-slate-50 border border-${getTagColor(tag)}-200`
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* AI Explanation panel */}
      <AnimatePresence>
        {showAIExplanation && (
          <motion.div
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={`mb-6 p-4 rounded-lg border-l-4 border-blue-500 ${
              isDarkMode ? "bg-slate-800" : "bg-blue-50"
            }`}
          >
            <div className="flex">
              <div
                className={`p-2 rounded-full mr-3 ${
                  isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a1 1 0 11-2 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                </svg>
              </div>
              <div>
                <h3
                  className={`font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  How AI Generated These Insights
                </h3>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                >
                  Our AI analyzes the testimonial content using natural language
                  processing techniques to identify key themes, sentiments, and
                  notable aspects. The system detects patterns of emphasis,
                  repetition, and emotional intensity to extract the most
                  meaningful insights.
                </p>
                <p
                  className={`text-sm mt-2 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                >
                  Each insight is categorized and tagged automatically based on
                  a taxonomy of customer experience factors. You can use these
                  insights to understand what matters most to your customers and
                  identify areas for improvement or promotional emphasis.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insights list */}
      <motion.div variants={itemVariants} className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div
            className={`p-8 text-center rounded-lg ${
              isDarkMode ? "bg-slate-800" : "bg-slate-50"
            }`}
          >
            <svg
              className={`w-12 h-12 mx-auto mb-4 ${
                isDarkMode ? "text-slate-600" : "text-slate-400"
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
            <p
              className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
            >
              No insights match this filter
            </p>
            <p
              className={`text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              Try selecting a different tag or clear the filter
            </p>
            <Button
              variant="outline"
              size="sm"
              className={`mt-4 ${isDarkMode ? "border-slate-700 text-slate-300" : ""}`}
              onClick={() => setFilterByTag(null)}
            >
              Clear Filter
            </Button>
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const dataIndex = data.indexOf(insight);
            return (
              <motion.div
                key={dataIndex}
                variants={itemVariants}
                layoutId={`insight-${dataIndex}`}
                className={`group p-4 rounded-lg border-l-4 border-blue-500 shadow-sm transition-all ${
                  expandedInsight === dataIndex
                    ? isDarkMode
                      ? "bg-slate-800 shadow-lg"
                      : "bg-white shadow-lg"
                    : isDarkMode
                      ? "bg-slate-800 hover:bg-slate-700"
                      : "bg-white hover:bg-slate-50"
                } cursor-pointer`}
                onClick={() => toggleInsight(dataIndex)}
              >
                <div className="flex items-start">
                  <div
                    className={`p-2 rounded-lg mr-3 flex-shrink-0 ${
                      isDarkMode ? "bg-slate-700" : "bg-slate-100"
                    }`}
                  >
                    <div
                      className={isDarkMode ? "text-blue-400" : "text-blue-600"}
                    >
                      {getInsightIcon(insight)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div
                        className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}
                      >
                        {insight}
                      </div>
                      <div className="flex items-center ml-4">
                        <Badge
                          variant="soft"
                          color="info"
                          size="xs"
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                            expandedInsight === dataIndex ? "opacity-100" : ""
                          }`}
                        >
                          {expandedInsight === dataIndex
                            ? "Collapse"
                            : "Expand"}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {insightsTags[dataIndex]?.map((tag, tagIndex) => (
                        <Badge
                          key={tagIndex}
                          variant="soft"
                          color={getTagColor(tag)}
                          size="xs"
                          className="cursor-pointer group/tag"
                          //   onClick={(e) => e.stopPropagation()}
                        >
                          {tag}
                          <button
                            className="ml-1 opacity-0 group-hover/tag:opacity-100 hover:text-black dark:hover:text-white"
                            onClick={(e) => removeTag(dataIndex, tag, e)}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}

                      {/* Add tag button */}
                      <div className="relative">
                        <button
                          className={`text-xs px-1.5 py-0.5 rounded-full border ${
                            isDarkMode
                              ? "border-slate-600 text-slate-400 hover:text-slate-300 hover:border-slate-500"
                              : "border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400"
                          }`}
                          onClick={(e) => toggleTagExpansion(dataIndex, e)}
                        >
                          + Add Tag
                        </button>

                        <AnimatePresence>
                          {expandedTagIndex === dataIndex && (
                            <motion.div
                              variants={tagContainerVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              className={`absolute z-10 mt-1 p-2 rounded-lg shadow-lg ${
                                isDarkMode
                                  ? "bg-slate-800 border border-slate-700"
                                  : "bg-white border border-slate-200"
                              }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {allTags
                                  .filter(
                                    (tag) =>
                                      !insightsTags[dataIndex]?.includes(tag)
                                  )
                                  .map((tag, i) => (
                                    <button
                                      key={i}
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        isDarkMode
                                          ? `bg-slate-700 text-${getTagColor(tag)}-300 hover:bg-slate-600`
                                          : `bg-slate-50 text-${getTagColor(tag)}-700 hover:bg-slate-100`
                                      }`}
                                      onClick={() => addTag(dataIndex, tag)}
                                    >
                                      {tag}
                                    </button>
                                  ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedInsight === dataIndex && (
                    <motion.div
                      variants={expandVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className={`mt-4 pt-4 border-t ${
                        isDarkMode ? "border-slate-700" : "border-slate-200"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className={`p-3 rounded-lg ${
                          isDarkMode ? "bg-slate-700" : "bg-slate-50"
                        }`}
                      >
                        <h4
                          className={`text-sm font-medium mb-2 ${
                            isDarkMode ? "text-white" : "text-slate-800"
                          }`}
                        >
                          AI Analysis
                        </h4>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-slate-300" : "text-slate-600"
                          }`}
                        >
                          This insight indicates strong customer satisfaction
                          with{" "}
                          {insight.toLowerCase().includes("quality")
                            ? "product quality"
                            : insight.toLowerCase().includes("service")
                              ? "customer service"
                              : insight.toLowerCase().includes("price")
                                ? "price-to-value ratio"
                                : "the overall experience"}
                          . It has a confidence score of{" "}
                          {Math.floor(Math.random() * 20) + 80}% and was
                          extracted from {Math.floor(Math.random() * 3) + 1}{" "}
                          different statements in the testimonial.
                        </p>

                        <div
                          className={`mt-3 p-2 rounded-lg ${
                            isDarkMode ? "bg-slate-800" : "bg-white"
                          }`}
                        >
                          <h5
                            className={`text-xs font-medium mb-1 ${
                              isDarkMode ? "text-slate-300" : "text-slate-700"
                            }`}
                          >
                            Suggested Marketing Usage
                          </h5>
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            Consider highlighting this insight in{" "}
                            {insight.toLowerCase().includes("quality")
                              ? "product pages and feature comparisons"
                              : insight.toLowerCase().includes("service")
                                ? "service offering materials and support pages"
                                : insight.toLowerCase().includes("price")
                                  ? "pricing pages and promotional materials"
                                  : "general marketing materials and testimonial collections"}
                            .
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button
                          variant="outline"
                          size="xs"
                          icon={
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          }
                          className={
                            isDarkMode ? "border-slate-700 text-slate-300" : ""
                          }
                        >
                          Edit Insight
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* Action buttons */}
      <motion.div variants={itemVariants} className="mt-8 flex justify-between">
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
          Re-analyze
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
            }
            className={isDarkMode ? "border-slate-700 text-slate-300" : ""}
          >
            Create Report
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            }
          >
            Share Insights
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default KeyInsights;
