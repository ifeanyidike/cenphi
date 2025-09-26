import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  MessageSquare,
  Sparkles,
  Video,
  CheckCircle,
  Clock,
  Bell,
  BellOff,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface ProcessingScreenProps {
  onComplete: () => void;
  onGoToDashboard: () => void;
  testimonialType?: "video" | "audio" | "text";
  fileName?: string;
}

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "processing" | "completed" | "error";
  estimatedTime?: string;
}

interface NotificationPreference {
  inApp: boolean;
  email: boolean;
}

export const ProcessingScreen: React.FC<ProcessingScreenProps> = ({
  onComplete,
  onGoToDashboard,
  testimonialType = "video",
  fileName = "testimonial.mp4",
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [notifications, setNotifications] = useState<NotificationPreference>({
    inApp: true,
    email: false,
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);

  const processingSteps: ProcessingStep[] = [
    {
      id: "uploading",
      title: "Uploading",
      description: "Securely transferring your content",
      icon: <Upload className="h-5 w-5" />,
      status:
        currentStepIndex >= 0
          ? currentStepIndex > 0
            ? "completed"
            : "processing"
          : "pending",
      estimatedTime: "30s",
    },
    {
      id: "transcribing",
      title: "Transcribing",
      description: "Converting speech to text with AI",
      icon: <MessageSquare className="h-5 w-5" />,
      status:
        currentStepIndex >= 1
          ? currentStepIndex > 1
            ? "completed"
            : "processing"
          : "pending",
      estimatedTime: "45s",
    },
    {
      id: "extracting",
      title: "Extracting highlights",
      description: "Finding the most impactful moments",
      icon: <Sparkles className="h-5 w-5" />,
      status:
        currentStepIndex >= 2
          ? currentStepIndex > 2
            ? "completed"
            : "processing"
          : "pending",
      estimatedTime: "40s",
    },
    {
      id: "rendering",
      title: "Rendering clip",
      description: "Creating your shareable video",
      icon: <Video className="h-5 w-5" />,
      status: currentStepIndex >= 3 ? "completed" : "pending",
      estimatedTime: "30s",
    },
  ];

  // Simulate processing progress
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < processingSteps.length - 1) {
          return prev + 1;
        } else {
          // Processing complete
          setTimeout(() => {
            setShowCompletionAnimation(true);
            setTimeout(() => {
              onComplete();
            }, 2000);
          }, 1000);
          clearInterval(stepTimer);
          return prev;
        }
      });
    }, 8000); // Each step takes ~8 seconds

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, [onComplete, processingSteps.length]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (): number => {
    const baseProgress = (currentStepIndex / processingSteps.length) * 100;
    const currentStepProgress = Math.min(((elapsedTime % 8) / 8) * 25, 25);
    return Math.min(baseProgress + currentStepProgress, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-12 pt-12 pb-8 text-center border-b border-gray-100/50">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 relative">
                <Loader2 className="h-7 w-7 text-white animate-spin" />
                <div className="absolute inset-0 bg-blue-400/20 rounded-2xl animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
              Processing your {testimonialType}
            </h1>
            <p className="text-sm text-gray-600 font-light max-w-md mx-auto leading-relaxed">
              We're analyzing your content and creating highlights. This usually
              finishes in ~2 minutes.
            </p>
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50/80 rounded-full border border-blue-100">
              <Clock className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-xs text-blue-700 font-medium">
                Elapsed: {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-12 pt-8 pb-4">
            <div className="relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-gray-500 font-medium">
                  {Math.round(getProgressPercentage())}% complete
                </span>
              </div>
            </div>
          </div>

          {/* Processing Steps */}
          <div className="px-12 py-8">
            <div className="space-y-6">
              {processingSteps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  {/* Step Icon */}
                  <div
                    className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${
                      step.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : step.status === "processing"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-400"
                    }
                  `}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : step.status === "processing" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        {step.icon}
                      </motion.div>
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`
                        text-base font-semibold transition-colors
                        ${
                          step.status === "completed"
                            ? "text-green-700"
                            : step.status === "processing"
                              ? "text-blue-700"
                              : "text-gray-500"
                        }
                      `}
                      >
                        {step.title}
                      </h3>
                      {step.estimatedTime && step.status === "pending" && (
                        <span className="text-xs text-gray-400 font-medium">
                          ~{step.estimatedTime}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-light mt-1">
                      {step.description}
                    </p>

                    {/* Processing Animation */}
                    {step.status === "processing" && (
                      <motion.div
                        className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="h-full bg-blue-500 rounded-full"
                          animate={{ x: [-100, 100] }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          style={{ width: "30%" }}
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* File Info */}
          <div className="px-12 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Video className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Processing in background
                  </p>
                </div>
              </div>

              {/* Notification Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 font-medium">
                  Notify me:
                </span>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      inApp: !prev.inApp,
                    }))
                  }
                  className={`
                    p-2 rounded-lg transition-colors
                    ${notifications.inApp ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}
                  `}
                >
                  {notifications.inApp ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="px-12 py-8 border-t border-gray-100/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToDashboard}
              className="
                w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 px-4 
                rounded-2xl transition-all duration-300 flex items-center justify-center
                shadow-lg hover:shadow-xl text-sm tracking-wide
              "
            >
              Continue to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.button>
            <p className="text-center text-xs text-gray-500 mt-3 font-light">
              You can safely close this page. We'll notify you when ready.
            </p>
          </div>

          {/* Footer */}
          <div className="px-12 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Step 3 of 4 • Processing your content
          </p>
        </div>

        {/* Completion Animation */}
        <AnimatePresence>
          {showCompletionAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-white rounded-3xl p-8 shadow-2xl border border-white/20"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-green-100 rounded-2xl mx-auto flex items-center justify-center mb-4"
                  >
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Processing complete!
                  </h2>
                  <p className="text-sm text-gray-600">
                    Your testimonial is ready to view
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
