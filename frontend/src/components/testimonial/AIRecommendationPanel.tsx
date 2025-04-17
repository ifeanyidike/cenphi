// components/AIRecommendationPanel.tsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../repo/workspace_hub";
import PremiumButton from "./UI/PremiumButton";
import { Testimonial } from "@/types/testimonial";

interface AIRecommendationPanelProps {
  testimonial: Testimonial | null;
}

interface Recommendation {
  id: string;
  type: "placement" | "enhancement" | "audience" | "conversion" | "promotion";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  aiConfidence: number; // 0-1
  implemented: boolean;
  timeToImplement: string; // e.g. "5 min", "1 hour"
}

const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = observer(
  ({ testimonial }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>(
      []
    );
    const [activeRecommendation, setActiveRecommendation] = useState<
      string | null
    >(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [aiThinking, setAiThinking] = useState(false);
    const [showRecommendationDetails, setShowRecommendationDetails] =
      useState(false);
    const [implementingId, setImplementingId] = useState<string | null>(null);

    // Simulated loading of AI recommendations
    useEffect(() => {
      if (!testimonial) return;

      setIsLoading(true);
      setError(null);

      // Simulating API call delay
      const timer = setTimeout(() => {
        try {
          // In a real app, this would be fetched from an API
          setRecommendations(getMockRecommendations(testimonial));
          setIsLoading(false);
        } catch (err) {
          setError("Failed to load recommendations");
          console.log("err", err);
          setIsLoading(false);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }, [testimonial]);

    // Get mock recommendations based on testimonial data
    const getMockRecommendations = (
      testimonial: Testimonial
    ): Recommendation[] => {
      // Here we're generating mock recommendations based on the testimonial
      // In a real app, these would come from an AI service

      const baseRecommendations: Recommendation[] = [
        {
          id: "rec-1",
          type: "placement",
          title: "Add to Homepage Hero Section",
          description: `Based on the positive sentiment and high rating of this ${testimonial.format} testimonial, featuring it prominently on your homepage could increase visitor engagement by up to 24%.`,
          impact: "high",
          aiConfidence: 0.92,
          implemented: false,
          timeToImplement: "5 min",
        },
        {
          id: "rec-2",
          type: "enhancement",
          title:
            testimonial.format === "video"
              ? "Add Captions to Video"
              : testimonial.format === "audio"
                ? "Create Audio Waveform Visualization"
                : testimonial.format === "text"
                  ? "Add Visual Quote Styling"
                  : "Enhance Image Quality",
          description: `Enhancing this ${testimonial.format} with visual improvements will make it more accessible and increase engagement metrics by approximately 18%.`,
          impact: "medium",
          aiConfidence: 0.85,
          implemented: false,
          timeToImplement: "15 min",
        },
        {
          id: "rec-3",
          type: "audience",
          title: "Target to Enterprise Customers",
          description:
            "The language and context of this testimonial resonates well with enterprise decision-makers. Consider using it in enterprise marketing materials.",
          impact: "medium",
          aiConfidence: 0.78,
          implemented: false,
          timeToImplement: "10 min",
        },
        {
          id: "rec-4",
          type: "conversion",
          title: "Add to Checkout Flow",
          description:
            "This testimonial addresses common purchase hesitations. Adding it to your checkout flow could reduce cart abandonment by up to 12%.",
          impact: "high",
          aiConfidence: 0.89,
          implemented: false,
          timeToImplement: "20 min",
        },
        {
          id: "rec-5",
          type: "promotion",
          title: "Create Social Media Campaign",
          description: `Creating a dedicated social media campaign featuring this ${testimonial.format} testimonial could expand your reach to similar audience segments.`,
          impact: "medium",
          aiConfidence: 0.81,
          implemented: false,
          timeToImplement: "45 min",
        },
      ];

      // If testimonial has high rating, add a recommendation about featuring it
      if (testimonial.rating && testimonial.rating >= 4) {
        baseRecommendations.push({
          id: "rec-6",
          type: "promotion",
          title: "Feature in Email Newsletter",
          description:
            "This high-rating testimonial would perform well in your next email newsletter to existing customers.",
          impact: "medium",
          aiConfidence: 0.87,
          implemented: false,
          timeToImplement: "15 min",
        });
      }

      // Return randomized subset of recommendations to simulate variety
      return baseRecommendations.sort(() => Math.random() - 0.5).slice(0, 4);
    };

    // Handlers
    const handleExpand = () => {
      setIsExpanded(!isExpanded);
    };

    const handleSelectRecommendation = (id: string) => {
      if (activeRecommendation === id) {
        setActiveRecommendation(null);
        setShowRecommendationDetails(false);
      } else {
        setActiveRecommendation(id);
        setShowRecommendationDetails(true);
      }
    };

    const handleGenerateNew = () => {
      setAiThinking(true);

      // Simulate AI thinking time
      setTimeout(() => {
        setRecommendations(
          recommendations.map((rec) => ({
            ...rec,
            aiConfidence: Math.min(
              rec.aiConfidence + Math.random() * 0.1,
              0.99
            ),
          }))
        );
        setAiThinking(false);
      }, 2000);
    };

    const handleImplement = (id: string) => {
      setImplementingId(id);

      // Simulate implementation delay
      setTimeout(() => {
        setRecommendations(
          recommendations.map((rec) =>
            rec.id === id ? { ...rec, implemented: true } : rec
          )
        );
        setImplementingId(null);
      }, 1500);
    };

    // Helper functions
    const getImpactColor = (impact: "high" | "medium" | "low") => {
      const colors = {
        high: {
          dark: { text: "text-emerald-400", bg: "bg-emerald-900/30" },
          light: { text: "text-emerald-700", bg: "bg-emerald-100" },
        },
        medium: {
          dark: { text: "text-blue-400", bg: "bg-blue-900/30" },
          light: { text: "text-blue-700", bg: "bg-blue-100" },
        },
        low: {
          dark: { text: "text-amber-400", bg: "bg-amber-900/30" },
          light: { text: "text-amber-700", bg: "bg-amber-100" },
        },
      };

      return isDarkMode ? colors[impact].dark : colors[impact].light;
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case "placement":
          return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
            </svg>
          );
        case "enhancement":
          return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          );
        case "audience":
          return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          );
        case "conversion":
          return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                clipRule="evenodd"
              />
            </svg>
          );
        case "promotion":
          return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clipRule="evenodd"
              />
            </svg>
          );
        default:
          return (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          );
      }
    };

    // Animation variants
    const containerVariants = {
      collapsed: {
        height: "auto",
      },
      expanded: {
        height: "auto",
      },
    };

    const listItemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: i * 0.1,
          duration: 0.3,
        },
      }),
      exit: { opacity: 0, y: -20 },
    };

    const glowVariants = {
      idle: { opacity: 0.5, scale: 1 },
      pulse: {
        opacity: [0.5, 0.8, 0.5],
        scale: [1, 1.05, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          repeatType: "loop",
        },
      },
    };

    // Render loading state
    if (isLoading) {
      return (
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-500 ${
            isDarkMode
              ? "bg-slate-800/80 backdrop-blur-sm ring-1 ring-white/10"
              : "bg-white/90 backdrop-blur-sm ring-1 ring-black/5"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? "bg-indigo-900/30" : "bg-indigo-100"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    AI Recommendations
                  </h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Generating personalized insights...
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center py-12">
              <div className="relative">
                <motion.div
                  className={`absolute inset-0 rounded-full blur-xl ${
                    isDarkMode ? "bg-indigo-600/20" : "bg-indigo-500/20"
                  }`}
                  //@ts-expect-error skip this error
                  variants={glowVariants}
                  initial="idle"
                  animate="pulse"
                />
                <svg
                  className={`w-12 h-12 relative ${isDarkMode ? "text-indigo-400" : "text-indigo-500"}`}
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
                  ></path>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-24 rounded-lg animate-pulse ${
                    isDarkMode ? "bg-slate-700/50" : "bg-slate-200/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Render error state
    if (error) {
      return (
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-500 ${
            isDarkMode
              ? "bg-slate-800/80 backdrop-blur-sm ring-1 ring-white/10"
              : "bg-white/90 backdrop-blur-sm ring-1 ring-black/5"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? "bg-red-900/30" : "bg-red-100"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    AI Recommendations
                  </h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-500"}`}
                  >
                    {error}
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`p-6 rounded-lg text-center ${
                isDarkMode ? "bg-slate-700/50" : "bg-slate-100"
              }`}
            >
              <p
                className={`mb-4 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                We couldn't generate AI recommendations at this time.
              </p>
              <PremiumButton
                variant={isDarkMode ? "outline" : "primary"}
                size="sm"
                withRipple={true}
                isDarkMode={isDarkMode}
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                onClick={handleGenerateNew}
              >
                Try Again
              </PremiumButton>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`rounded-2xl overflow-hidden transition-all duration-500 ${
          isDarkMode
            ? "bg-slate-800/80 backdrop-blur-sm ring-1 ring-white/10"
            : "bg-white/90 backdrop-blur-sm ring-1 ring-black/5"
        }`}
      >
        {/* Background gradient decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-teal-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? "bg-indigo-900/30" : "bg-indigo-100"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3
                  className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  AI Recommendations
                </h3>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  {recommendations.length} personalized insights for this
                  testimonial
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <PremiumButton
                variant="ghost"
                size="sm"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                isLoading={aiThinking}
                isDarkMode={isDarkMode}
                onClick={handleGenerateNew}
                tooltip="Generate new recommendations"
              >
                Refresh
              </PremiumButton>

              <PremiumButton
                variant="ghost"
                size="sm"
                icon={
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
                isDarkMode={isDarkMode}
                tooltip="Export recommendations"
              >
                Export
              </PremiumButton>
            </div>
          </div>

          {/* AI thinking indicator */}
          {aiThinking && (
            <div
              className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
                isDarkMode ? "bg-indigo-900/20" : "bg-indigo-50"
              }`}
            >
              <div className="relative">
                <motion.div
                  className={`absolute inset-0 rounded-full blur-md ${
                    isDarkMode ? "bg-indigo-500/30" : "bg-indigo-400/30"
                  }`}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                />
                <svg
                  className={`w-8 h-8 relative ${isDarkMode ? "text-indigo-400" : "text-indigo-500"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                </svg>
              </div>

              <div>
                <p
                  className={`font-medium ${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`}
                >
                  AI is analyzing your testimonial...
                </p>
                <p
                  className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                >
                  Generating enhanced recommendations based on latest data
                </p>
              </div>
            </div>
          )}

          {/* Recommendations grid */}
          <motion.div
            variants={containerVariants}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4"
          >
            <AnimatePresence mode="wait">
              {recommendations.map((recommendation, index) => (
                <motion.div
                  key={recommendation.id}
                  custom={index}
                  variants={listItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={`group rounded-xl p-4 transition-all cursor-pointer border ${
                    activeRecommendation === recommendation.id
                      ? isDarkMode
                        ? "bg-slate-700/80 border-indigo-500/50"
                        : "bg-white shadow-md border-indigo-200"
                      : isDarkMode
                        ? "bg-slate-700/50 hover:bg-slate-700 border-transparent hover:border-slate-600"
                        : "bg-white/70 hover:bg-white hover:shadow-md border-slate-200"
                  }`}
                  onClick={() => handleSelectRecommendation(recommendation.id)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`${
                          isDarkMode ? "text-indigo-400" : "text-indigo-600"
                        }`}
                      >
                        {getTypeIcon(recommendation.type)}
                      </div>

                      <span
                        className={`font-semibold line-clamp-1 ${
                          isDarkMode ? "text-white" : "text-slate-800"
                        }`}
                      >
                        {recommendation.title}
                      </span>
                    </div>

                    <div
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        getImpactColor(recommendation.impact).bg
                      } ${getImpactColor(recommendation.impact).text}`}
                    >
                      {recommendation.impact.charAt(0).toUpperCase() +
                        recommendation.impact.slice(1)}
                    </div>
                  </div>

                  <p
                    className={`text-sm mb-3 line-clamp-2 ${
                      isDarkMode ? "text-slate-300" : "text-slate-600"
                    }`}
                  >
                    {recommendation.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center text-xs ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>
                        AI: {(recommendation.aiConfidence * 100).toFixed(0)}%
                        confidence
                      </span>
                    </div>

                    <div
                      className={`flex items-center text-xs ${
                        isDarkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{recommendation.timeToImplement}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Recommendation details */}
          <AnimatePresence>
            {showRecommendationDetails && activeRecommendation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`mb-4 rounded-xl overflow-hidden ${
                  isDarkMode
                    ? "bg-slate-700"
                    : "bg-slate-50 border border-slate-200"
                }`}
              >
                {recommendations
                  .filter((r) => r.id === activeRecommendation)
                  .map((recommendation) => (
                    <div key={recommendation.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isDarkMode ? "bg-slate-800" : "bg-white"
                            }`}
                          >
                            <span
                              className={`${
                                isDarkMode
                                  ? "text-indigo-400"
                                  : "text-indigo-600"
                              }`}
                            >
                              {getTypeIcon(recommendation.type)}
                            </span>
                          </div>

                          <div>
                            <h4
                              className={`font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                            >
                              {recommendation.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                                  getImpactColor(recommendation.impact).bg
                                } ${getImpactColor(recommendation.impact).text}`}
                              >
                                {recommendation.impact.charAt(0).toUpperCase() +
                                  recommendation.impact.slice(1)}{" "}
                                Impact
                              </span>

                              <span
                                className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                              >
                                {recommendation.timeToImplement} to implement
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          className={`p-2 rounded-lg ${
                            isDarkMode
                              ? "hover:bg-slate-600"
                              : "hover:bg-slate-200"
                          }`}
                          onClick={() => setShowRecommendationDetails(false)}
                        >
                          <svg
                            className="w-5 h-5 text-slate-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>

                      <div className="mb-4">
                        <p
                          className={`mb-3 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                        >
                          {recommendation.description}
                        </p>

                        {/* AI confidence visualization */}
                        <div
                          className={`p-3 rounded-lg ${
                            isDarkMode ? "bg-slate-800" : "bg-white"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-slate-300" : "text-slate-700"
                              }`}
                            >
                              AI Confidence
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                recommendation.aiConfidence > 0.8
                                  ? isDarkMode
                                    ? "text-green-400"
                                    : "text-green-600"
                                  : recommendation.aiConfidence > 0.6
                                    ? isDarkMode
                                      ? "text-amber-400"
                                      : "text-amber-600"
                                    : isDarkMode
                                      ? "text-red-400"
                                      : "text-red-600"
                              }`}
                            >
                              {(recommendation.aiConfidence * 100).toFixed(0)}%
                            </span>
                          </div>

                          <div
                            className={`h-2 w-full rounded-full overflow-hidden ${
                              isDarkMode ? "bg-slate-700" : "bg-slate-200"
                            }`}
                          >
                            <motion.div
                              className={`h-full rounded-full ${
                                recommendation.aiConfidence > 0.8
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : recommendation.aiConfidence > 0.6
                                    ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                                    : "bg-gradient-to-r from-red-500 to-rose-500"
                              }`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${recommendation.aiConfidence * 100}%`,
                              }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Implementation section */}
                      <div className="flex justify-between">
                        {recommendation.implemented ? (
                          <div
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                              isDarkMode
                                ? "bg-green-900/30 text-green-400"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-medium">Implemented</span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <PremiumButton
                              variant="outline"
                              size="sm"
                              rounded="lg"
                              isDarkMode={isDarkMode}
                            >
                              Save for Later
                            </PremiumButton>

                            <PremiumButton
                              variant={isDarkMode ? "gradient" : "primary"}
                              size="sm"
                              rounded="lg"
                              withShine={true}
                              isLoading={implementingId === recommendation.id}
                              icon={
                                <svg
                                  className="w-4 h-4"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              }
                              isDarkMode={isDarkMode}
                              onClick={() => handleImplement(recommendation.id)}
                            >
                              {implementingId === recommendation.id
                                ? "Implementing..."
                                : "Implement Now"}
                            </PremiumButton>
                          </div>
                        )}

                        <PremiumButton
                          variant="ghost"
                          size="sm"
                          rounded="lg"
                          icon={
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                            </svg>
                          }
                          isDarkMode={isDarkMode}
                          tooltip="Get help with implementation"
                        >
                          Get Help
                        </PremiumButton>
                      </div>
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer for expand/collapse */}
          <motion.div
            className="flex justify-center"
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm ${
                isDarkMode
                  ? "text-slate-400 hover:text-white hover:bg-slate-700/70"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
              onClick={handleExpand}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{isExpanded ? "Show less" : "Show more"}</span>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }
);

export default AIRecommendationPanel;
