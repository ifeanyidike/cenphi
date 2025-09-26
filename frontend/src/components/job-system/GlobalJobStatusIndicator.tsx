// components/job-system/GlobalJobStatusIndicator.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { observer } from "mobx-react-lite";
import {
  ChevronUp,
  ChevronDown,
  Activity,
  X,
  ArrowRight,
  Sparkles,
  Video,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProcessingJob } from "@/types/ai-service";
import { useNavigate } from "react-router-dom";

const serviceConfig = {
  enhancement: {
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    name: "Enhancement",
  },
  story_mode: {
    icon: Video,
    color: "from-blue-500 to-indigo-500",
    name: "Story Video",
  },
  clipping: {
    icon: Video,
    color: "from-orange-500 to-red-500",
    name: "Clipping",
  },
  content_generation: {
    icon: FileText,
    color: "from-green-500 to-emerald-500",
    name: "Content Gen",
  },
  text_polishing: {
    icon: FileText,
    color: "from-violet-500 to-purple-500",
    name: "Text Polish",
  },
  translation: {
    icon: FileText,
    color: "from-teal-500 to-cyan-500",
    name: "Translation",
  },
  narration: {
    icon: FileText,
    color: "from-cyan-500 to-blue-500",
    name: "Narration",
  },
  platform_optimizer: {
    icon: Video,
    color: "from-green-500 to-emerald-500",
    name: "Platform Opt",
  },
  viral_analysis: {
    icon: TrendingUp,
    color: "from-yellow-500 to-orange-500",
    name: "Viral Analysis",
  },
};

interface GlobalJobStatusIndicatorProps {
  jobs: ProcessingJob[];
}

const GlobalJobStatusIndicator: React.FC<GlobalJobStatusIndicatorProps> =
  observer(({ jobs }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const activeJobs = jobs.filter(
      (j) =>
        (j.status === "processing" || j.status === "queued") &&
        !["content_generation", "text_polishing", "translation"].includes(
          j.service
        )
    );

    if (activeJobs.length === 0) return null;

    const getJobNavigationPath = (job: ProcessingJob) => {
      if (job.testimonialId) {
        return `/detail/${job.testimonialId}?jobId=${job.id}`;
      }

      if (job.service === "story_mode") {
        return `/studio/stories/${job.id}`;
      }

      if (job.status === "streaming") {
        return null;
      }

      return `/studio`;
    };

    const handleJobClick = (job: ProcessingJob) => {
      const path = getJobNavigationPath(job);
      if (path) {
        navigate(path);
      }
      setIsExpanded(false);
    };

    const indicator = (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-4 right-4 z-[9000]"
      >
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden backdrop-blur-sm">
          <div
            className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all duration-200"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-sm">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Activity className="w-4 h-4 text-white" />
                </motion.div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-blue-400"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {activeJobs.length} job{activeJobs.length !== 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-1">
                    <motion.div
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-600">
                  {activeJobs[0]
                    ? serviceConfig[
                        activeJobs[0].service as keyof typeof serviceConfig
                      ]?.name || activeJobs[0].service
                    : "Processing"}
                  {activeJobs.length > 1 && ` +${activeJobs.length - 1} more`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-full">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-600 font-medium">
                  Active
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-gray-100"
              >
                <div className="max-h-64 overflow-y-auto">
                  {activeJobs.map((job) => {
                    const service =
                      serviceConfig[job.service as keyof typeof serviceConfig];
                    const ServiceIcon = service?.icon || FileText;

                    return (
                      <div
                        key={job.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-b-0 transition-colors"
                        onClick={() => handleJobClick(job)}
                      >
                        <div
                          className={`w-6 h-6 rounded bg-gradient-to-br ${service?.color || "from-gray-400 to-gray-500"} flex items-center justify-center flex-shrink-0`}
                        >
                          <ServiceIcon className="w-3 h-3 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {service?.name || job.service}
                            </span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                job.status === "streaming"
                                  ? "bg-blue-100 text-blue-700"
                                  : job.status === "processing"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {job.status === "streaming" ? "Live" : job.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <motion.div
                                className="w-1 h-1 bg-blue-500 rounded-full"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: 0,
                                }}
                              />
                              <motion.div
                                className="w-1 h-1 bg-blue-500 rounded-full"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: 0.3,
                                }}
                              />
                              <motion.div
                                className="w-1 h-1 bg-blue-500 rounded-full"
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  delay: 0.6,
                                }}
                              />
                              <span className="text-xs text-gray-500 ml-1">
                                Processing
                              </span>
                            </div>
                          </div>
                        </div>

                        <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>

                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                      Click any job to view progress
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(false);
                      }}
                      className="text-xs h-6 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );

    return createPortal(indicator, document.body);
  });

export default GlobalJobStatusIndicator;
