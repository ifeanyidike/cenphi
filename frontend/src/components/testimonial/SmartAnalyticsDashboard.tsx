// components/SmartAnalyticsDashboard.tsx

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { observer } from "mobx-react-lite";
import { workspaceHub } from "../../repo/workspace_hub";
import PremiumButton from "./UI/PremiumButton";
import { Testimonial } from "@/types/testimonial";

interface AnalyticsData {
  performance: {
    views: number;
    viewsChange: number;
    shares: number;
    sharesChange: number;
    engagement: number;
    engagementChange: number;
    conversion: number;
    conversionChange: number;
    viewHistory: { date: string; value: number }[];
  };
  audience: {
    sources: { name: string; value: number; color: string }[];
    devices: { name: string; value: number }[];
    demographics: {
      age: { range: string; percentage: number }[];
      gender: { type: string; percentage: number }[];
      location: { country: string; value: number }[];
    };
  };
  impact: {
    sentiment: {
      score: number;
      change: number;
      breakdown: { positive: number; neutral: number; negative: number };
    };
    keywordCloud: { text: string; value: number }[];
    conversionPoints: { name: string; value: number; change: number }[];
  };
}

interface SmartAnalyticsDashboardProps {
  testimonial: Testimonial | null;
}

const SmartAnalyticsDashboard: React.FC<SmartAnalyticsDashboardProps> =
  observer(({ testimonial }) => {
    const { uiManager } = workspaceHub;
    const { isDarkMode } = uiManager;

    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [activeTab, setActiveTab] = useState("performance");
    const [dateRange, setDateRange] = useState("30d");
    const [, setAnimateMetrics] = useState(false);

    // Trigger animation for metrics
    useEffect(() => {
      if (!isLoading && analytics) {
        setAnimateMetrics(true);
      }
    }, [isLoading, analytics]);

    // Simulated API call to get analytics data
    useEffect(() => {
      if (!testimonial) return;

      setIsLoading(true);

      // Simulating API call delay
      const timer = setTimeout(() => {
        try {
          // Mock data - in a real app, this would come from your analytics API
          const mockData: AnalyticsData = getMockAnalytics();
          setAnalytics(mockData);
          setIsLoading(false);
        } catch (error) {
          console.error("Error fetching analytics data", error);
          setIsLoading(false);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }, [testimonial, dateRange]);

    // Get mock analytics data for demonstration
    const getMockAnalytics = (): AnalyticsData => {
      // Create some realistic but randomized data based on the testimonial

      // Generate view history data
      const viewHistory = [...Array(30)].map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        const dateStr = date.toISOString().split("T")[0];

        // Create a realistic curve with some randomization
        let value = 50 + Math.floor(Math.random() * 20);

        // Add a peak in the middle
        if (i > 10 && i < 20) {
          value = value + 30 + Math.floor(Math.random() * 20);
        }

        return { date: dateStr, value };
      });

      // Calculate total views from the history
      const totalViews = viewHistory.reduce((sum, day) => sum + day.value, 0);

      return {
        performance: {
          views: totalViews,
          viewsChange: 12.4,
          shares: Math.floor(totalViews * 0.05 * (1 + Math.random() * 0.2)),
          sharesChange: 18.7,
          engagement: 72.5,
          engagementChange: 5.2,
          conversion: 3.8,
          conversionChange: 0.7,
          viewHistory,
        },
        audience: {
          sources: [
            { name: "Direct", value: 35, color: "#3b82f6" },
            { name: "Social Media", value: 25, color: "#8b5cf6" },
            { name: "Email", value: 15, color: "#ec4899" },
            { name: "Website", value: 20, color: "#10b981" },
            { name: "Other", value: 5, color: "#6b7280" },
          ],
          devices: [
            { name: "Desktop", value: 45 },
            { name: "Mobile", value: 40 },
            { name: "Tablet", value: 15 },
          ],
          demographics: {
            age: [
              { range: "18-24", percentage: 15 },
              { range: "25-34", percentage: 30 },
              { range: "35-44", percentage: 25 },
              { range: "45-54", percentage: 15 },
              { range: "55+", percentage: 15 },
            ],
            gender: [
              { type: "Male", percentage: 48 },
              { type: "Female", percentage: 52 },
            ],
            location: [
              { country: "United States", value: 65 },
              { country: "United Kingdom", value: 12 },
              { country: "Canada", value: 8 },
              { country: "Australia", value: 5 },
              { country: "Other", value: 10 },
            ],
          },
        },
        impact: {
          sentiment: {
            score: 85,
            change: 7.2,
            breakdown: { positive: 85, neutral: 12, negative: 3 },
          },
          keywordCloud: [
            { text: "quality", value: 10 },
            { text: "recommend", value: 8 },
            { text: "excellent", value: 7 },
            { text: "service", value: 12 },
            { text: "helpful", value: 6 },
            { text: "responsive", value: 8 },
            { text: "professional", value: 9 },
            { text: "amazing", value: 7 },
            { text: "satisfied", value: 5 },
            { text: "experience", value: 10 },
          ],
          conversionPoints: [
            { name: "Homepage", value: 4.2, change: 0.8 },
            { name: "Product Page", value: 3.7, change: 0.5 },
            { name: "Checkout", value: 2.8, change: 0.3 },
            { name: "Email Campaign", value: 5.1, change: 1.2 },
          ],
        },
      };
    };

    // Helper functions
    const formatNumber = (num: number): string => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
      }
      return num.toString();
    };

    const getChangeColor = (change: number): string => {
      if (change > 0) {
        return isDarkMode ? "text-green-400" : "text-green-600";
      } else if (change < 0) {
        return isDarkMode ? "text-red-400" : "text-red-600";
      }
      return isDarkMode ? "text-slate-400" : "text-slate-600";
    };

    const getChangeIcon = (change: number): JSX.Element => {
      if (change > 0) {
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      } else if (change < 0) {
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12 13a1 1 0 110 2H7a1 1 0 01-1-1v-5a1 1 0 112 0v2.586l4.293-4.293a1 1 0 011.414 0L16 10.586V8a1 1 0 112 0v5a1 1 0 01-1 1h-5z"
              clipRule="evenodd"
            />
          </svg>
        );
      }
      return (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    };

    // Simple bar chart component
    const BarChart: React.FC<{
      data: { name: string; value: number }[];
      color?: string;
      maxValue?: number;
    }> = ({ data, color = "#3b82f6", maxValue }) => {
      const max = maxValue || Math.max(...data.map((item) => item.value));

      return (
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span
                  className={isDarkMode ? "text-slate-300" : "text-slate-700"}
                >
                  {item.name}
                </span>
                <span
                  className={isDarkMode ? "text-slate-400" : "text-slate-500"}
                >
                  {item.value}%
                </span>
              </div>
              <div
                className={`h-2 w-full rounded-full overflow-hidden ${
                  isDarkMode ? "bg-slate-700" : "bg-slate-200"
                }`}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / max) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`h-full rounded-full`}
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    };

    // Donut chart component
    const DonutChart: React.FC<{
      data: { name: string; value: number; color?: string }[];
    }> = ({ data }) => {
      const total = data.reduce((sum, item) => sum + item.value, 0);
      let cumulativePercentage = 0;

      return (
        <div className="flex items-center justify-center">
          <div className="relative w-36 h-36">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const startAngle = (cumulativePercentage / 100) * 360;
                const endAngle =
                  ((cumulativePercentage + percentage) / 100) * 360;

                cumulativePercentage += percentage;

                // Calculate SVG arc path
                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                const largeArcFlag = percentage > 50 ? 1 : 0;

                const pathData = `
                M 50 50
                L ${x1} ${y1}
                A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
              `;

                return (
                  <motion.path
                    key={index}
                    d={pathData}
                    fill={item.color || `hsl(${index * 60}, 70%, 60%)`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                );
              })}
              <circle
                cx="50"
                cy="50"
                r="25"
                fill={isDarkMode ? "#1e293b" : "#ffffff"}
              />
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span
                  className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  {total}%
                </span>
              </div>
            </div>
          </div>

          <div className="ml-4 space-y-1">
            {data.map((item, index) => (
              <div key={index} className="flex items-center text-xs">
                <span
                  className="w-3 h-3 mr-2 rounded-sm"
                  style={{
                    backgroundColor:
                      item.color || `hsl(${index * 60}, 70%, 60%)`,
                  }}
                />
                <span
                  className={isDarkMode ? "text-slate-300" : "text-slate-700"}
                >
                  {item.name} ({item.value}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Line chart
    const LineChart: React.FC<{ data: { date: string; value: number }[] }> = ({
      data,
    }) => {
      const maxValue = Math.max(...data.map((item) => item.value)) * 1.1;
      const minValue = Math.min(...data.map((item) => item.value)) * 0.9;
      const chartHeight = 140;
      const chartWidth = 680;

      // Calculate points for the path
      const points = data
        .map((item, index) => {
          const x = (index / (data.length - 1)) * chartWidth;
          const y =
            chartHeight -
            ((item.value - minValue) / (maxValue - minValue)) * chartHeight;
          return `${x},${y}`;
        })
        .join(" ");

      return (
        <div className="relative h-[150px] w-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full"
          >
            {/* Horizontal grid lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`grid-h-${i}`}
                x1="0"
                y1={i * (chartHeight / 4)}
                x2={chartWidth}
                y2={i * (chartHeight / 4)}
                stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                strokeWidth="1"
              />
            ))}

            {/* Line */}
            <motion.path
              d={`M ${points}`}
              fill="none"
              stroke={isDarkMode ? "#60a5fa" : "#3b82f6"}
              strokeWidth="2.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />

            {/* Gradient area below the line */}
            <motion.path
              d={`M 0,${chartHeight} ${points} ${chartWidth},${chartHeight} Z`}
              fill="url(#gradient)"
              opacity="0.2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop
                  offset="0%"
                  stopColor={isDarkMode ? "#3b82f6" : "#3b82f6"}
                />
                <stop
                  offset="100%"
                  stopColor={isDarkMode ? "#1e3a8a" : "#ffffff"}
                />
              </linearGradient>
            </defs>
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs">
            {[0, 25, 50, 75, 100].map((percent) => {
              const index = Math.floor((data.length - 1) * (percent / 100));
              return (
                <div
                  key={`label-${percent}`}
                  className={isDarkMode ? "text-slate-400" : "text-slate-500"}
                >
                  {data[index]?.date.split("-").slice(1).join("/")}
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    // Animation variants
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.05,
          delayChildren: 0.1,
        },
      },
    };

    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    };

    // Dashboard tabs
    const tabs = [
      {
        id: "performance",
        name: "Performance",
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        ),
      },
      {
        id: "audience",
        name: "Audience",
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        ),
      },
      {
        id: "impact",
        name: "Impact",
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
          </svg>
        ),
      },
    ];

    // Date range options
    const dateRanges = [
      { id: "7d", name: "7 days" },
      { id: "30d", name: "30 days" },
      { id: "90d", name: "90 days" },
      { id: "ytd", name: "Year to date" },
    ];

    // Loading UI
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Analytics Dashboard
                  </h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Loading testimonial performance data...
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-28 rounded-lg animate-pulse ${
                    isDarkMode ? "bg-slate-700/50" : "bg-slate-200/70"
                  }`}
                />
              ))}
            </div>

            <div
              className={`h-64 rounded-lg mb-4 animate-pulse ${
                isDarkMode ? "bg-slate-700/50" : "bg-slate-200/70"
              }`}
            />

            <div className="grid grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-48 rounded-lg animate-pulse ${
                    isDarkMode ? "bg-slate-700/50" : "bg-slate-200/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-500 ${
            isDarkMode
              ? "bg-slate-800/80 backdrop-blur-sm ring-1 ring-white/10"
              : "bg-white/90 backdrop-blur-sm ring-1 ring-black/5"
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg
                  className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? "text-slate-600" : "text-slate-300"}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3
                  className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}
                >
                  No analytics data available
                </h3>
                <p
                  className={`text-sm max-w-md mx-auto mb-6 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  We couldn't load analytics data for this testimonial. This
                  could be because it's new or hasn't received any views yet.
                </p>
                <PremiumButton
                  variant={isDarkMode ? "outline" : "primary"}
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
                  isDarkMode={isDarkMode}
                >
                  Refresh Data
                </PremiumButton>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <MotionConfig transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-500 ${
            isDarkMode
              ? "bg-slate-800/80 backdrop-blur-sm ring-1 ring-white/10"
              : "bg-white/90 backdrop-blur-sm ring-1 ring-black/5"
          }`}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl"></div>
          </div>

          <div className="relative p-6">
            {/* Header with tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isDarkMode ? "bg-blue-900/30" : "bg-blue-100"
                  }`}
                >
                  <svg
                    className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div>
                  <h3
                    className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}
                  >
                    Analytics Dashboard
                  </h3>
                  <p
                    className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Performance insights for your testimonial
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Date range selector */}
                <div
                  className={`flex rounded-lg overflow-hidden ${
                    isDarkMode ? "bg-slate-700" : "bg-slate-100"
                  }`}
                >
                  {dateRanges.map((range) => (
                    <button
                      key={range.id}
                      className={`px-3 py-1.5 text-xs font-medium ${
                        dateRange === range.id
                          ? isDarkMode
                            ? "bg-slate-600 text-white"
                            : "bg-white shadow-sm text-blue-600"
                          : isDarkMode
                            ? "text-slate-300 hover:text-white"
                            : "text-slate-500 hover:text-slate-800"
                      }`}
                      onClick={() => setDateRange(range.id)}
                    >
                      {range.name}
                    </button>
                  ))}
                </div>

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
                        d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                  isDarkMode={isDarkMode}
                  tooltip="Export data"
                >
                  Export
                </PremiumButton>
              </div>
            </div>

            {/* Tabs navigation */}
            <div className="mb-6">
              <div className="flex border-b space-x-8 overflow-x-auto pb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`flex items-center pb-4 px-1 relative ${
                      activeTab === tab.id
                        ? isDarkMode
                          ? "text-blue-400"
                          : "text-blue-600"
                        : isDarkMode
                          ? "text-slate-400 hover:text-slate-300"
                          : "text-slate-500 hover:text-slate-800"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    <span className="font-medium whitespace-nowrap">
                      {tab.name}
                    </span>

                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activetab"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                          isDarkMode ? "bg-blue-500" : "bg-blue-600"
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard content */}
            <AnimatePresence mode="wait">
              {activeTab === "performance" && (
                <motion.div
                  key="performance"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  {/* KPI metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Views metric */}
                    <motion.div
                      variants={cardVariants}
                      className={`relative overflow-hidden rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Total Views
                          </p>
                          <motion.p
                            className={`text-2xl font-bold mt-1 ${
                              isDarkMode ? "text-white" : "text-slate-800"
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                          >
                            {formatNumber(analytics.performance.views)}
                          </motion.p>
                        </div>
                        <div
                          className={`p-2 rounded-lg ${
                            isDarkMode ? "bg-blue-900/20" : "bg-blue-100"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
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
                        </div>
                      </div>

                      <div className="flex items-center mt-4">
                        <div
                          className={`flex items-center ${getChangeColor(
                            analytics.performance.viewsChange
                          )}`}
                        >
                          {getChangeIcon(analytics.performance.viewsChange)}
                          <span className="text-sm font-medium ml-1">
                            {Math.abs(analytics.performance.viewsChange)}%
                          </span>
                        </div>
                        <span
                          className={`text-xs ml-2 ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          from previous period
                        </span>
                      </div>

                      <div
                        className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-20 ${
                          isDarkMode ? "bg-blue-500" : "bg-blue-300"
                        }`}
                      />
                    </motion.div>

                    {/* Shares metric */}
                    <motion.div
                      variants={cardVariants}
                      className={`relative overflow-hidden rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Total Shares
                          </p>
                          <motion.p
                            className={`text-2xl font-bold mt-1 ${
                              isDarkMode ? "text-white" : "text-slate-800"
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                          >
                            {formatNumber(analytics.performance.shares)}
                          </motion.p>
                        </div>
                        <div
                          className={`p-2 rounded-lg ${
                            isDarkMode ? "bg-purple-900/20" : "bg-purple-100"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center mt-4">
                        <div
                          className={`flex items-center ${getChangeColor(
                            analytics.performance.sharesChange
                          )}`}
                        >
                          {getChangeIcon(analytics.performance.sharesChange)}
                          <span className="text-sm font-medium ml-1">
                            {Math.abs(analytics.performance.sharesChange)}%
                          </span>
                        </div>
                        <span
                          className={`text-xs ml-2 ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          from previous period
                        </span>
                      </div>

                      <div
                        className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-20 ${
                          isDarkMode ? "bg-purple-500" : "bg-purple-300"
                        }`}
                      />
                    </motion.div>

                    {/* Engagement metric */}
                    <motion.div
                      variants={cardVariants}
                      className={`relative overflow-hidden rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Engagement Rate
                          </p>
                          <motion.p
                            className={`text-2xl font-bold mt-1 ${
                              isDarkMode ? "text-white" : "text-slate-800"
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                          >
                            {analytics.performance.engagement}%
                          </motion.p>
                        </div>
                        <div
                          className={`p-2 rounded-lg ${
                            isDarkMode ? "bg-emerald-900/20" : "bg-emerald-100"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center mt-4">
                        <div
                          className={`flex items-center ${getChangeColor(
                            analytics.performance.engagementChange
                          )}`}
                        >
                          {getChangeIcon(
                            analytics.performance.engagementChange
                          )}
                          <span className="text-sm font-medium ml-1">
                            {Math.abs(analytics.performance.engagementChange)}%
                          </span>
                        </div>
                        <span
                          className={`text-xs ml-2 ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          from previous period
                        </span>
                      </div>

                      <div
                        className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-20 ${
                          isDarkMode ? "bg-emerald-500" : "bg-emerald-300"
                        }`}
                      />
                    </motion.div>

                    {/* Conversion metric */}
                    <motion.div
                      variants={cardVariants}
                      className={`relative overflow-hidden rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            Conversion Rate
                          </p>
                          <motion.p
                            className={`text-2xl font-bold mt-1 ${
                              isDarkMode ? "text-white" : "text-slate-800"
                            }`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 1 }}
                          >
                            {analytics.performance.conversion}%
                          </motion.p>
                        </div>
                        <div
                          className={`p-2 rounded-lg ${
                            isDarkMode ? "bg-amber-900/20" : "bg-amber-100"
                          }`}
                        >
                          <svg
                            className={`w-5 h-5 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>

                      <div className="flex items-center mt-4">
                        <div
                          className={`flex items-center ${getChangeColor(
                            analytics.performance.conversionChange
                          )}`}
                        >
                          {getChangeIcon(
                            analytics.performance.conversionChange
                          )}
                          <span className="text-sm font-medium ml-1">
                            {Math.abs(analytics.performance.conversionChange)}%
                          </span>
                        </div>
                        <span
                          className={`text-xs ml-2 ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          from previous period
                        </span>
                      </div>

                      <div
                        className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full opacity-20 ${
                          isDarkMode ? "bg-amber-500" : "bg-amber-300"
                        }`}
                      />
                    </motion.div>
                  </div>

                  {/* Views over time chart */}
                  <motion.div
                    variants={cardVariants}
                    className={`rounded-xl p-5 ${
                      isDarkMode ? "bg-slate-700/50" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-slate-800"
                          }`}
                        >
                          Views Over Time
                        </h4>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Daily view count for your testimonial
                        </p>
                      </div>
                      <PremiumButton
                        variant="ghost"
                        size="xs"
                        icon={
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        }
                        isDarkMode={isDarkMode}
                        tooltip="View detailed report"
                      >
                        More
                      </PremiumButton>
                    </div>

                    <div>
                      <LineChart data={analytics.performance.viewHistory} />
                    </div>
                  </motion.div>

                  {/* Additional insights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Traffic sources */}
                    <motion.div
                      variants={cardVariants}
                      className={`rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-white"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-slate-800"
                        }`}
                      >
                        Traffic Sources
                      </h4>
                      <DonutChart data={analytics.audience.sources} />
                    </motion.div>

                    {/* Device breakdown */}
                    <motion.div
                      variants={cardVariants}
                      className={`rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-white"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-slate-800"
                        }`}
                      >
                        Device Breakdown
                      </h4>
                      <BarChart
                        data={analytics.audience.devices}
                        color={isDarkMode ? "#60a5fa" : "#3b82f6"}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === "audience" && (
                <motion.div
                  key="audience"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  {/* Demographics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Age distribution */}
                    <motion.div
                      variants={cardVariants}
                      className={`rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-white"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-slate-800"
                        }`}
                      >
                        Age Distribution
                      </h4>
                      <BarChart
                        //@ts-expect-error skip this error
                        data={analytics.audience.demographics.age}
                        color={isDarkMode ? "#a78bfa" : "#8b5cf6"}
                      />
                    </motion.div>

                    {/* Gender distribution */}
                    <motion.div
                      variants={cardVariants}
                      className={`rounded-xl p-5 ${
                        isDarkMode ? "bg-slate-700/50" : "bg-white"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-4 ${
                          isDarkMode ? "text-white" : "text-slate-800"
                        }`}
                      >
                        Gender Distribution
                      </h4>
                      <div className="flex items-center justify-center h-full">
                        <DonutChart
                          //@ts-expect-error skip this error
                          data={analytics.audience.demographics.gender.map(
                            (item, index) => ({
                              ...item,
                              color:
                                index === 0
                                  ? isDarkMode
                                    ? "#60a5fa"
                                    : "#3b82f6"
                                  : isDarkMode
                                    ? "#f472b6"
                                    : "#ec4899",
                            })
                          )}
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Geographic distribution */}
                  <motion.div
                    variants={cardVariants}
                    className={`rounded-xl p-5 ${
                      isDarkMode ? "bg-slate-700/50" : "bg-white"
                    }`}
                  >
                    <h4
                      className={`font-medium mb-4 ${
                        isDarkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      Geographic Distribution
                    </h4>
                    <BarChart
                      //@ts-expect-error skip this error
                      data={analytics.audience.demographics.location}
                      color={isDarkMode ? "#34d399" : "#10b981"}
                    />
                  </motion.div>

                  {/* AI insight card */}
                  <motion.div
                    variants={cardVariants}
                    className={`rounded-xl overflow-hidden p-0 relative`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r ${
                        isDarkMode
                          ? "from-indigo-900/90 to-purple-900/90"
                          : "from-indigo-600 to-purple-600"
                      }`}
                    ></div>

                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.2),transparent_35%),radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.2),transparent_35%)]"></div>
                    </div>

                    <div className="relative p-5 text-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <svg
                              className="w-6 h-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-semibold">
                              AI Audience Insight
                            </h4>
                            <p className="text-white/80 text-sm">
                              Powered by analytics intelligence
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                          95% confidence
                        </div>
                      </div>

                      <p className="mb-4">
                        This testimonial resonates most strongly with the 25-44
                        age demographic. Our analysis suggests focusing
                        distribution on channels where this audience segment is
                        most active.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          Social Media
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          Email Campaigns
                        </div>
                        <div className="bg-white/20 px-3 py-1 rounded-full text-sm">
                          Product Pages
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "impact" && (
                <motion.div
                  key="impact"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="space-y-6"
                >
                  {/* Sentiment analysis */}
                  <motion.div
                    variants={cardVariants}
                    className={`rounded-xl p-5 ${
                      isDarkMode ? "bg-slate-700/50" : "bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4
                          className={`font-medium ${
                            isDarkMode ? "text-white" : "text-slate-800"
                          }`}
                        >
                          Sentiment Analysis
                        </h4>
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          }`}
                        >
                          Emotional response to testimonial
                        </p>
                      </div>
                      <div
                        className={`flex items-center ${getChangeColor(
                          analytics.impact.sentiment.change
                        )}`}
                      >
                        {getChangeIcon(analytics.impact.sentiment.change)}
                        <span className="text-sm font-medium ml-1">
                          {Math.abs(analytics.impact.sentiment.change)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex-shrink-0">
                        <div className="relative w-40 h-40 mx-auto">
                          <svg
                            viewBox="0 0 100 100"
                            className="w-full h-full transform -rotate-90"
                          >
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={isDarkMode ? "#334155" : "#e2e8f0"}
                              strokeWidth="10"
                            />
                            <motion.circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={isDarkMode ? "#34d399" : "#10b981"}
                              strokeWidth="10"
                              strokeDasharray={283}
                              initial={{ strokeDashoffset: 283 }}
                              animate={{
                                strokeDashoffset:
                                  283 -
                                  (analytics.impact.sentiment.score / 100) *
                                    283,
                              }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span
                              className={`text-3xl font-bold ${
                                isDarkMode ? "text-white" : "text-slate-800"
                              }`}
                            >
                              {analytics.impact.sentiment.score}%
                            </span>
                            <span
                              className={`text-sm ${
                                isDarkMode ? "text-slate-400" : "text-slate-500"
                              }`}
                            >
                              Positive
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-green-400" : "text-green-600"
                              }`}
                            >
                              Positive
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-green-400" : "text-green-600"
                              }`}
                            >
                              {analytics.impact.sentiment.breakdown.positive}%
                            </span>
                          </div>
                          <div
                            className={`h-2 w-full rounded-full overflow-hidden ${
                              isDarkMode ? "bg-slate-600" : "bg-slate-200"
                            }`}
                          >
                            <motion.div
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${analytics.impact.sentiment.breakdown.positive}%`,
                              }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-blue-400" : "text-blue-600"
                              }`}
                            >
                              Neutral
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-blue-400" : "text-blue-600"
                              }`}
                            >
                              {analytics.impact.sentiment.breakdown.neutral}%
                            </span>
                          </div>
                          <div
                            className={`h-2 w-full rounded-full overflow-hidden ${
                              isDarkMode ? "bg-slate-600" : "bg-slate-200"
                            }`}
                          >
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-sky-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${analytics.impact.sentiment.breakdown.neutral}%`,
                              }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-red-400" : "text-red-600"
                              }`}
                            >
                              Negative
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                isDarkMode ? "text-red-400" : "text-red-600"
                              }`}
                            >
                              {analytics.impact.sentiment.breakdown.negative}%
                            </span>
                          </div>
                          <div
                            className={`h-2 w-full rounded-full overflow-hidden ${
                              isDarkMode ? "bg-slate-600" : "bg-slate-200"
                            }`}
                          >
                            <motion.div
                              className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${analytics.impact.sentiment.breakdown.negative}%`,
                              }}
                              transition={{ duration: 1 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Keyword cloud */}
                  <motion.div
                    variants={cardVariants}
                    className={`rounded-xl p-5 ${
                      isDarkMode ? "bg-slate-700/50" : "bg-white"
                    }`}
                  >
                    <h4
                      className={`font-medium mb-6 ${
                        isDarkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      Key Terms Impact
                    </h4>

                    <div className="flex flex-wrap justify-center gap-3 py-4">
                      {analytics.impact.keywordCloud.map((keyword, index) => (
                        <motion.div
                          key={keyword.text}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className={`px-3 py-1.5 rounded-full ${
                            isDarkMode
                              ? "bg-indigo-900/30 text-indigo-300"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                          style={{
                            fontSize: `${Math.max(0.75, Math.min(1.5, keyword.value / 8))}rem`,
                          }}
                        >
                          {keyword.text}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Conversion impact */}
                  <motion.div
                    variants={cardVariants}
                    className={`rounded-xl p-5 ${
                      isDarkMode ? "bg-slate-700/50" : "bg-white"
                    }`}
                  >
                    <h4
                      className={`font-medium mb-4 ${
                        isDarkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      Conversion Impact by Placement
                    </h4>

                    <div className="space-y-4">
                      {analytics.impact.conversionPoints.map((point, index) => (
                        <div key={point.name} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span
                              className={`font-medium ${
                                isDarkMode ? "text-white" : "text-slate-800"
                              }`}
                            >
                              {point.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-lg font-bold ${
                                  isDarkMode ? "text-white" : "text-slate-800"
                                }`}
                              >
                                {point.value}%
                              </span>
                              <span
                                className={`flex items-center text-xs ${getChangeColor(
                                  point.change
                                )}`}
                              >
                                {getChangeIcon(point.change)}
                                <span className="ml-1">{point.change}%</span>
                              </span>
                            </div>
                          </div>
                          <div
                            className={`h-2 w-full rounded-full overflow-hidden ${
                              isDarkMode ? "bg-slate-600" : "bg-slate-200"
                            }`}
                          >
                            <motion.div
                              className={`h-full rounded-full ${
                                isDarkMode
                                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                  : "bg-gradient-to-r from-amber-500 to-orange-500"
                              }`}
                              initial={{ width: 0 }}
                              animate={{ width: `${point.value * 15}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </MotionConfig>
    );
  });

export default SmartAnalyticsDashboard;
