import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  MessageSquare,
  Sparkles,
  Video,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  SkipForward,
  Pause,
  Play,
  WifiOff,
  Wifi,
} from "lucide-react";
import { authStore } from "@/stores/authStore";

interface SSEProcessingProps {
  testimonialId: string;
  compressionSessionId?: string; // For tracking upload/compression progress
  onComplete: () => void;
  onGoToDashboard: () => void;
  fileName?: string;
}

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "pending" | "processing" | "completed" | "error";
  progress?: number; // For upload/compression progress
  estimatedTime?: string;
  actualTime?: number;
}

interface ProcessingEvent {
  type: string;
  data: {
    testimonial_id?: string;
    step?: string;
    progress?: number;
    message?: string;
    status?: string;
    error?: string;
    completed?: boolean;
    processing_details?: {
      step_name: string;
      progress_percentage: number;
      estimated_completion_time?: number;
      current_operation?: string;
    };
  };
}

type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"
  | "reconnecting";

export const SSEProcessing: React.FC<SSEProcessingProps> = ({
  testimonialId,
  compressionSessionId,
  onComplete,
  onGoToDashboard,
}) => {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: "compressing",
      title: "Optimizing Video",
      description: "Compressing video for best quality",
      icon: <Upload className="h-5 w-5" />,
      status: compressionSessionId ? "processing" : "completed", // If sessionId provided, show progress
      progress: 0,
      estimatedTime: "1-2 min",
    },
    {
      id: "transcribing",
      title: "Transcribing Audio",
      description: "Converting speech to text with AI",
      icon: <MessageSquare className="h-5 w-5" />,
      status: "pending",
      estimatedTime: "45s",
    },
    {
      id: "extracting",
      title: "Extracting Highlights",
      description: "Finding key moments and insights",
      icon: <Sparkles className="h-5 w-5" />,
      status: "pending",
      estimatedTime: "40s",
    },
    {
      id: "rendering",
      title: "Generating Clips",
      description: "Creating shareable video clips",
      icon: <Video className="h-5 w-5" />,
      status: "pending",
      estimatedTime: "30s",
    },
  ]);

  const [currentStepIndex, setCurrentStepIndex] = useState(compressionSessionId ? 0 : 1); // Start with compression if sessionId provided
  const [elapsedTime, setElapsedTime] = useState(0);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [detailedProgress, setDetailedProgress] = useState<string>("");

  const eventSourceRef = useRef<EventSource | null>(null);
  const studioEventSourceRef = useRef<EventSource | null>(null); // For studio upload/compression events
  const timerRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    connectToSSE();
    if (compressionSessionId) {
      connectToStudioSSE();
    }
    startTimer();

    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testimonialId, compressionSessionId]);

  const connectToSSE = async () => {
    try {
      setConnectionStatus("connecting");
      setError(null);

      const token = await authStore.user?.getIdToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Connect to SSE endpoint
      const url = new URL(
        `${import.meta.env.VITE_API_URL}/api/processing/testimonials/stream`
      );
      url.searchParams.set("testimonial_id", testimonialId);
      url.searchParams.set("token", token);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection opened");
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: ProcessingEvent = JSON.parse(event.data);
          handleProcessingEvent(data);
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        setConnectionStatus("error");

        if (!isCompleted && reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionStatus("reconnecting");
          const delay = Math.min(
            Math.pow(2, reconnectAttempts.current) * 1000,
            30000
          );
          console.log(
            `Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`
          );

          reconnectTimeoutRef.current = window.setTimeout(() => {
            reconnectAttempts.current++;
            connectToSSE();
          }, delay);
        } else if (!isCompleted) {
          setError(
            "Failed to connect after multiple attempts. Please refresh to try again."
          );
        }
      };

      // Handle specific event types
      const handleSpecificEvent =
        (eventType: string) => (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            handleProcessingEvent({ type: eventType, data });
          } catch (error) {
            console.error(`Failed to parse ${eventType} event:`, error);
          }
        };

      eventSource.addEventListener("progress", handleSpecificEvent("progress"));
      eventSource.addEventListener(
        "step_change",
        handleSpecificEvent("step_change")
      );
      eventSource.addEventListener(
        "completed",
        handleSpecificEvent("completed")
      );
      eventSource.addEventListener("error", handleSpecificEvent("error"));
      eventSource.addEventListener(
        "processing_update",
        handleSpecificEvent("processing_update")
      );
    } catch (error: any) {
      console.error("Failed to connect to SSE:", error);
      setConnectionStatus("error");
      setError(error.message);
    }
  };

  const connectToStudioSSE = async () => {
    if (!compressionSessionId) {
      console.log("No compression session ID provided, skipping studio SSE");
      return;
    }

    try {
      console.log("Connecting to studio SSE for compression tracking...");

      // Close existing studio connection
      if (studioEventSourceRef.current) {
        studioEventSourceRef.current.close();
      }

      // Connect to studio SSE endpoint for upload/compression events
      const sseUrl = `${import.meta.env.VITE_API_URL}/studio/sessions/${compressionSessionId}/stream`;
      const eventSource = new EventSource(sseUrl);
      studioEventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("Studio SSE connection opened for compression tracking");
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleStudioEvent(data);
        } catch (error) {
          console.error("Failed to parse studio SSE message:", error);
        }
      };

      eventSource.onerror = (error) => {
        console.error("Studio SSE connection error:", error);
        // Don't retry studio SSE connection - it's optional for progress tracking
        if (studioEventSourceRef.current) {
          studioEventSourceRef.current.close();
          studioEventSourceRef.current = null;
        }
      };

      // Handle specific studio event types
      const handleStudioSpecificEvent =
        (eventType: string) => (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            handleStudioEvent({ ...data, type: eventType });
          } catch (error) {
            console.error(`Failed to parse studio ${eventType} event:`, error);
          }
        };

      eventSource.addEventListener(
        "upload_complete",
        handleStudioSpecificEvent("upload_complete")
      );
      eventSource.addEventListener(
        "compression_progress",
        handleStudioSpecificEvent("compression_progress")
      );
      eventSource.addEventListener(
        "compression_complete",
        handleStudioSpecificEvent("compression_complete")
      );
    } catch (error: any) {
      console.error("Failed to connect to studio SSE:", error);
      // Don't set error state - studio SSE is optional for progress tracking
    }
  };

  const handleStudioEvent = (event: any) => {
    const { type, data } = event;

    console.log("Studio event received:", type, data);

    switch (type) {
      case "upload_complete":
        setSteps((prev) =>
          prev.map((step) =>
            step.id === "compressing"
              ? {
                  ...step,
                  status: "processing" as const,
                  description: data?.message || "Optimizing video for best quality...",
                  progress: 10,
                }
              : step
          )
        );
        break;

      case "compression_progress": {
        const progress = data?.progress || 0;
        setSteps((prev) =>
          prev.map((step) =>
            step.id === "compressing"
              ? {
                  ...step,
                  status: "processing" as const,
                  description: data?.message || `Optimizing video: ${progress}%`,
                  progress: progress,
                }
              : step
          )
        );
        break;
      }

      case "compression_complete":
        setSteps((prev) =>
          prev.map((step, index) =>
            step.id === "compressing"
              ? {
                  ...step,
                  status: "completed" as const,
                  description: data?.message || "Video optimized successfully",
                  progress: 100,
                  actualTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
                }
              : index === 1 // Move to transcribing step
                ? { ...step, status: "processing" as const }
                : step
          )
        );
        setCurrentStepIndex(1); // Move to transcribing step

        // Close studio SSE connection after compression is complete
        if (studioEventSourceRef.current) {
          studioEventSourceRef.current.close();
          studioEventSourceRef.current = null;
        }
        break;

      default:
        console.log("Unknown studio event type:", type, data);
    }
  };

  const handleProcessingEvent = (event: ProcessingEvent) => {
    const { type, data } = event;

    switch (type) {
      case "progress":
      case "processing_update":
        if (data.processing_details) {
          const details = data.processing_details;
          updateStepWithDetails(details.step_name, details);
          setDetailedProgress(details.current_operation || "");
        } else if (data.step) {
          updateStepStatus(data.step, "processing");
        }
        break;

      case "step_change":
        if (data.step) {
          completeCurrentStepAndAdvance(data.step);
        }
        break;

      case "completed":
        if (data.testimonial_id === testimonialId) {
          setIsCompleted(true);
          setSteps((prev) =>
            prev.map((step) => ({ ...step, status: "completed" as const }))
          );
          setConnectionStatus("disconnected");

          // Auto-redirect after showing completion
          setTimeout(() => {
            onComplete();
          }, 3000);
        }
        break;

      case "error":
        setError(data.error || "Processing failed");
        setSteps((prev) =>
          prev.map((step, index) =>
            index === currentStepIndex
              ? { ...step, status: "error" as const }
              : step
          )
        );
        setConnectionStatus("error");
        break;

      default:
        console.log("Unknown event type:", type, data);
    }
  };

  const updateStepWithDetails = (stepName: string, details: any) => {
    setSteps((prev) => {
      const stepIndex = findStepIndex(stepName, prev);
      if (stepIndex === -1) return prev;

      const newSteps = [...prev];

      // Mark previous steps as completed
      for (let i = 0; i < stepIndex; i++) {
        if (newSteps[i].status !== "completed") {
          newSteps[i].status = "completed";
          newSteps[i].actualTime = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
        }
      }

      // Update current step
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        status: "processing",
        description:
          details.current_operation || newSteps[stepIndex].description,
      };

      setCurrentStepIndex(stepIndex);
      return newSteps;
    });
  };

  const updateStepStatus = (
    stepName: string,
    status: ProcessingStep["status"]
  ) => {
    setSteps((prev) => {
      const stepIndex = findStepIndex(stepName, prev);
      if (stepIndex === -1) return prev;

      const newSteps = [...prev];

      // Mark previous steps as completed
      for (let i = 0; i < stepIndex; i++) {
        if (newSteps[i].status !== "completed") {
          newSteps[i].status = "completed";
        }
      }

      newSteps[stepIndex].status = status;
      setCurrentStepIndex(stepIndex);

      return newSteps;
    });
  };

  const completeCurrentStepAndAdvance = (nextStepName: string) => {
    setSteps((prev) => {
      const currentIndex = currentStepIndex;
      const nextIndex = findStepIndex(nextStepName, prev);

      if (currentIndex >= 0 && currentIndex < prev.length) {
        const newSteps = [...prev];
        newSteps[currentIndex] = {
          ...newSteps[currentIndex],
          status: "completed",
          actualTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
        };

        if (nextIndex !== -1) {
          newSteps[nextIndex].status = "processing";
          setCurrentStepIndex(nextIndex);
        }

        return newSteps;
      }

      return prev;
    });
  };

  const findStepIndex = (stepName: string, steps: ProcessingStep[]): number => {
    return steps.findIndex(
      (step) =>
        step.id.toLowerCase() === stepName.toLowerCase() ||
        step.title.toLowerCase().includes(stepName.toLowerCase()) ||
        stepName.toLowerCase().includes(step.id.toLowerCase())
    );
  };

  const startTimer = () => {
    timerRef.current = window.setInterval(() => {
      if (!isPaused) {
        setElapsedTime((prev) => prev + 1);
      }
    }, 1000);
  };

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (studioEventSourceRef.current) {
      studioEventSourceRef.current.close();
      studioEventSourceRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (): number => {
    const completedSteps = steps.filter(
      (step) => step.status === "completed"
    ).length;
    const processingSteps = steps.filter(
      (step) => step.status === "processing"
    ).length;
    return ((completedSteps + processingSteps * 0.5) / steps.length) * 100;
  };

  const retryConnection = () => {
    reconnectAttempts.current = 0;
    setError(null);
    connectToSSE();
  };

  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          icon: <Wifi className="h-4 w-4 text-green-600" />,
          text: "Connected",
          color: "text-green-600",
        };
      case "connecting":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />,
          text: "Connecting",
          color: "text-blue-600",
        };
      case "reconnecting":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />,
          text: "Reconnecting",
          color: "text-yellow-600",
        };
      case "error":
      case "disconnected":
        return {
          icon: <WifiOff className="h-4 w-4 text-red-600" />,
          text: "Disconnected",
          color: "text-red-600",
        };
      default:
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-gray-600" />,
          text: "Loading",
          color: "text-gray-600",
        };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-12 pt-12 pb-8 text-center border-b border-gray-100/50 relative">
            {/* Skip Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToDashboard}
              className="absolute top-6 right-6 flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Go to Dashboard
            </motion.button>

            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 relative">
                {isCompleted ? (
                  <CheckCircle className="h-7 w-7 text-white" />
                ) : (
                  <>
                    <Loader2 className="h-7 w-7 text-white animate-spin" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-2xl animate-pulse"></div>
                  </>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
              {isCompleted
                ? "Processing complete!"
                : "Processing your testimonial"}
            </h1>

            <p className="text-sm text-gray-600 font-light max-w-md mx-auto leading-relaxed">
              {isCompleted
                ? "Your testimonial has been successfully processed and is ready to view"
                : "We're analyzing your content and creating highlights. This usually takes 2-3 minutes."}
            </p>

            {/* Status Bar */}
            <div className="mt-4 flex items-center justify-center space-x-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50/80 rounded-full border border-blue-100">
                <Clock className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-xs text-blue-700 font-medium">
                  {formatTime(elapsedTime)}
                </span>
              </div>

              <div
                className={`inline-flex items-center px-4 py-2 bg-gray-50/80 rounded-full border border-gray-100`}
              >
                {statusDisplay.icon}
                <span
                  className={`text-xs font-medium ml-2 ${statusDisplay.color}`}
                >
                  {statusDisplay.text}
                </span>
              </div>

              <button
                onClick={() => setIsPaused(!isPaused)}
                className="inline-flex items-center px-4 py-2 bg-gray-50/80 hover:bg-gray-100/80 rounded-full border border-gray-100 transition-colors"
              >
                {isPaused ? (
                  <Play className="h-4 w-4 text-gray-600" />
                ) : (
                  <Pause className="h-4 w-4 text-gray-600" />
                )}
                <span className="text-xs text-gray-600 font-medium ml-2">
                  {isPaused ? "Resume" : "Pause"}
                </span>
              </button>
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

          {/* Detailed Progress */}
          {detailedProgress && (
            <div className="px-12 pb-4">
              <div className="bg-blue-50/50 rounded-2xl p-4 text-center">
                <p className="text-sm text-blue-700 font-medium">
                  {detailedProgress}
                </p>
              </div>
            </div>
          )}

          {/* Processing Steps */}
          <div className="px-12 py-8">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  {/* Step Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      step.status === "completed"
                        ? "bg-green-100 text-green-600"
                        : step.status === "processing"
                          ? "bg-blue-100 text-blue-600"
                          : step.status === "error"
                            ? "bg-red-100 text-red-600"
                            : "bg-gray-100 text-gray-400"
                    }`}
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
                    ) : step.status === "error" ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-base font-semibold transition-colors ${
                          step.status === "completed"
                            ? "text-green-700"
                            : step.status === "processing"
                              ? "text-blue-700"
                              : step.status === "error"
                                ? "text-red-700"
                                : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </h3>

                      <div className="text-xs text-gray-500 font-medium">
                        {step.status === "completed" && step.actualTime
                          ? `${step.actualTime}s`
                          : step.status === "pending" && step.estimatedTime
                            ? `~${step.estimatedTime}`
                            : ""}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 font-light mt-1">
                      {step.description}
                    </p>

                    {/* Processing Animation or Progress Bar */}
                    {step.status === "processing" && (
                      <motion.div
                        className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {step.id === "compressing" && typeof step.progress === "number" ? (
                          // Show actual progress for compression
                          <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${step.progress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                          />
                        ) : (
                          // Show indeterminate animation for other steps
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
                        )}
                      </motion.div>
                    )}

                    {/* Show progress percentage for compression */}
                    {step.id === "compressing" &&
                     step.status === "processing" &&
                     typeof step.progress === "number" && (
                      <div className="mt-1.5 text-right">
                        <span className="text-xs text-blue-600 font-semibold">
                          {step.progress}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="px-12 pb-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Processing Error
                    </p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>

                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={retryConnection}
                    className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                  >
                    Retry Connection
                  </button>
                  <button
                    onClick={onGoToDashboard}
                    className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="px-12 py-8 border-t border-gray-100/50">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToDashboard}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 px-4 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl text-sm tracking-wide"
            >
              {isCompleted ? "View Results" : "Continue to Dashboard"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.button>
            <p className="text-center text-xs text-gray-500 mt-3 font-light">
              {isCompleted
                ? "Your testimonial is ready to view and share"
                : "You can safely leave this page. We'll notify you when ready."}
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
            Step 4 of 4 • Processing your content
          </p>
        </div>
      </div>
    </div>
  );
};
