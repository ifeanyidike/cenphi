// components/job-system/JobLaunchNotification.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Clock,
  Sparkles,
  Video,
  FileText,
  Pin,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface JobLaunchNotificationProps {
  isVisible: boolean;
  jobDetails: {
    id: string;
    service: string;
    serviceName: string;
    testimonialCount: number;
    estimatedTime: string;
    type: "streaming" | "processing";
  };
  onDismiss: () => void;
  onNavigate: () => void;
  onPin: () => void;
  isPinned: boolean;
}

const serviceConfig = {
  enhancement: { icon: Sparkles, color: "from-purple-500 to-pink-500" },
  story_mode: { icon: Video, color: "from-blue-500 to-indigo-500" },
  clipping: { icon: Video, color: "from-orange-500 to-red-500" },
  content_generation: {
    icon: FileText,
    color: "from-green-500 to-emerald-500",
  },
  text_polishing: { icon: FileText, color: "from-violet-500 to-purple-500" },
  translation: { icon: FileText, color: "from-teal-500 to-cyan-500" },
  narration: { icon: FileText, color: "from-cyan-500 to-blue-500" },
  platform_optimizer: { icon: Video, color: "from-green-500 to-emerald-500" },
};

const JobLaunchNotification: React.FC<JobLaunchNotificationProps> = ({
  isVisible,
  jobDetails,
  onDismiss,
  onNavigate,
  onPin,
  isPinned,
}) => {
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(4);

  useEffect(() => {
    if (!isVisible || isPinned) return;

    const timer = setInterval(() => {
      setAutoCloseCountdown((prev) => {
        if (prev <= 1) {
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, isPinned, onDismiss]);

  useEffect(() => {
    if (isVisible) {
      setAutoCloseCountdown(4);
    }
  }, [isVisible]);

  const service =
    serviceConfig[jobDetails.service as keyof typeof serviceConfig];
  const ServiceIcon = service?.icon || Clock;

  const notification = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.8 }}
          className="fixed top-4 right-4 z-[9999]"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-80 max-w-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service?.color || "from-gray-400 to-gray-500"} flex items-center justify-center`}
                >
                  <ServiceIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Job Started
                  </h4>
                  <p className="text-xs text-gray-600">
                    {jobDetails.serviceName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPin}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <Pin
                    className={`w-3 h-3 ${isPinned ? "text-blue-600" : "text-gray-400"}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {jobDetails.testimonialCount > 1
                    ? `${jobDetails.testimonialCount} testimonials`
                    : "1 testimonial"}
                </span>
                <Badge
                  variant="secondary"
                  className={`${
                    jobDetails.type === "streaming"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {jobDetails.type === "streaming" ? "Live" : "Processing"}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Estimated completion: {jobDetails.estimatedTime}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigate}
                className="text-xs h-7 px-3"
              >
                View Progress
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>

              {!isPinned && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  Auto-close in {autoCloseCountdown}s
                </div>
              )}
            </div>

            {/* Progress indicator for streaming */}
            {jobDetails.type === "streaming" && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-100" />
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-200" />
                  </div>
                  <span>Results streaming live...</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(notification, document.body);
};

export default JobLaunchNotification;
