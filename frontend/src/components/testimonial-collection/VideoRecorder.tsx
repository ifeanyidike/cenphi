import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Circle,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJobProgress } from "@/hooks/useJobProgress";
import { workspaceHub } from "@/repo/workspace_hub";
import PersonalDetailsForm from "./PersonalDetailsForm";
import { observer } from "mobx-react-lite";

interface TestimonialFormData {
  name: string;
  email: string;
  company: string;
  textContent: string;
  rating: number;
}

interface VideoRecorderProps {
  formData: TestimonialFormData;
  setFormData: (data: TestimonialFormData) => void;
  onSubmitSuccess: (testimonialId?: string) => void;
  onBack?: () => void;
  workspaceId: string;
  collectionId?: string;
}

const GUIDING_QUESTIONS = [
  "What specific problem did our solution solve for you?",
  "How has our solution impacted your business or workflow?",
  "What would you tell someone considering our solution?",
];

type RecordingStatus =
  | "idle"
  | "preparing"
  | "ready"
  | "countdown"
  | "recording"
  | "stopped"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

/**
 * VideoRecorder - Immersive studio recording interface
 *
 * Professional features:
 * - Countdown before recording
 * - Full-screen studio feel
 * - Mobile responsive design
 * - Collapsible question guide
 * - Touch-friendly controls
 */
const VideoRecorder: React.FC<VideoRecorderProps> = ({
  formData,
  setFormData,
  onSubmitSuccess,
  onBack,
  workspaceId,
  collectionId,
}) => {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [questionsExpanded, setQuestionsExpanded] = useState(true);
  const { jobStatus, startTracking, stopTracking } = useJobProgress();

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  const MAX_DURATION = 120; // 2 minutes

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  useEffect(() => {
    initializeCamera();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (status === "recording") {
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  useEffect(() => {
    if (status === "recording") {
      const questionInterval = setInterval(() => {
        setCurrentQuestion((prev) => (prev + 1) % GUIDING_QUESTIONS.length);
      }, 25000);

      return () => clearInterval(questionInterval);
    }
  }, [status]);

  // Countdown effect
  useEffect(() => {
    if (status === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        // Start actual recording
        actuallyStartRecording();
      }
    }
  }, [status, countdown]);

  const initializeCamera = async () => {
    setStatus("preparing");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isMobile
          ? {
              width: { ideal: 720 },
              height: { ideal: 1280 },
              facingMode: "user",
            }
          : {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              facingMode: "user",
            },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStatus("ready");
    } catch (err: any) {
      console.error("Camera initialization failed:", err);
      setError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions."
          : "Failed to access camera. Please check your device."
      );
      setStatus("error");
    }
  };

  const startRecordingWithCountdown = () => {
    setCountdown(3);
    setStatus("countdown");
    setQuestionsExpanded(false); // Collapse questions during recording
  };

  const actuallyStartRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setDuration(0);
    setCurrentQuestion(0);

    const options = { mimeType: "video/webm;codecs=vp9" };

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        recordedBlobRef.current = blob;

        if (previewRef.current) {
          previewRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
      setStatus("recording");
    } catch (err) {
      console.error("Recording start failed:", err);
      setError("Failed to start recording. Please try again.");
      setStatus("error");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      setStatus("stopped");
      setQuestionsExpanded(true);
    }
  };

  const retake = () => {
    recordedBlobRef.current = null;
    chunksRef.current = [];
    setDuration(0);
    setCurrentQuestion(0);
    setStatus("ready");
    if (previewRef.current) {
      previewRef.current.src = "";
    }
  };

  const submitRecording = async () => {
    if (!recordedBlobRef.current) return;

    try {
      setStatus("uploading");

      const videoFile = new File(
        [recordedBlobRef.current],
        `recording_${Date.now()}.${recordedBlobRef.current.type.includes("webm") ? "webm" : "mp4"}`,
        { type: recordedBlobRef.current.type }
      );

      const result =
        await workspaceHub.testimonialManager.createVideoTestimonial({
          workspace_id: workspaceId,
          collection_id: collectionId,
          author_name: formData.name,
          author_email: formData.email,
          author_company: formData.company,
          rating: formData.rating,
          content: formData.textContent,
          videoBlob: videoFile,
        });

      if (result.testimonial_id) {
        if (result.job_id) {
          setStatus("processing");
          startTracking(result.job_id);
        } else {
          setStatus("completed");
          setTimeout(() => onSubmitSuccess(result.testimonial_id), 1000);
        }
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err.message || "Failed to submit video. Please try again.");
      setStatus("error");
    }
  };

  useEffect(() => {
    if (jobStatus?.status === "completed" && status === "processing") {
      setStatus("completed");
      setTimeout(() => onSubmitSuccess(jobStatus.testimonial_id), 1000);
    } else if (jobStatus?.status === "failed") {
      setError("Processing failed. Please try again.");
      setStatus("error");
    }
  }, [jobStatus]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    stopTracking();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercent = () => {
    return (duration / MAX_DURATION) * 100;
  };

  const isImmersiveMode = status === "countdown" || status === "recording";

  return (
    <div className="relative w-full h-full min-h-screen md:min-h-0 md:max-w-7xl md:mx-auto px-4 md:px-0 pt-16 md:pt-0">
      {/* Back Button */}
      {onBack && (status === "ready" || status === "stopped") && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={onBack}
          className="fixed top-4 left-4 md:absolute md:-top-14 md:left-0 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors z-50 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </motion.button>
      )}

      <div
        className={`${isImmersiveMode ? "" : "md:grid md:grid-cols-12 md:gap-6"} transition-all duration-300`}
      >
        {/* Questions Sidebar - Hidden during countdown/recording on desktop, collapsible on mobile */}
        {!isImmersiveMode && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="md:col-span-3 mb-4 md:mb-0"
          >
            {/* Mobile: Collapsible */}
            <div className="md:sticky md:top-4">
              <button
                onClick={() => setQuestionsExpanded(!questionsExpanded)}
                className="w-full md:hidden flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200 mb-2"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Question Guide
                  </h3>
                </div>
                {questionsExpanded ? (
                  <ChevronUp className="h-4 w-4 text-slate-600" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                )}
              </button>

              {/* Desktop: Always visible, Mobile: Collapsible */}
              <div
                className={`${
                  questionsExpanded ? "block" : "hidden md:block"
                } bg-white rounded-lg p-4 border border-slate-200`}
              >
                <div className="hidden md:flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Question Guide
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {GUIDING_QUESTIONS.map((question, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded text-xs md:text-xs transition-colors ${
                        currentQuestion === index
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex gap-2">
                        <span className="font-medium flex-shrink-0">
                          {index + 1}.
                        </span>
                        <p className="leading-relaxed">{question}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Keep under 2 minutes. Speak naturally and share specific
                    examples.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Studio Area */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`${isImmersiveMode ? "col-span-full" : "md:col-span-9"}`}
        >
          {/* Video Studio */}
          <div className="relative bg-black rounded-lg overflow-hidden border border-slate-800">
            <div
              className={`relative ${
                isMobile ? "aspect-[9/16]" : "aspect-video"
              }`}
            >
              {status !== "stopped" ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={previewRef}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Countdown Overlay */}
              {status === "countdown" && (
                <motion.div
                  key="countdown"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center"
                >
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-white text-8xl md:text-9xl font-bold"
                  >
                    {countdown}
                  </motion.div>
                </motion.div>
              )}

              {/* Recording Indicator */}
              {status === "recording" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-4 z-10"
                >
                  <div className="flex items-center gap-2 bg-red-600 px-3 py-2 rounded-full shadow-lg">
                    <Circle className="h-3 w-3 fill-current text-white animate-pulse" />
                    <span className="text-white text-sm font-medium">REC</span>
                  </div>
                </motion.div>
              )}

              {/* Timer */}
              {(status === "recording" || status === "stopped") && (
                <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-mono shadow-lg">
                  {formatTime(duration)} / {formatTime(MAX_DURATION)}
                </div>
              )}

              {/* Question Prompt - Floating during recording */}
              <AnimatePresence mode="wait">
                {status === "recording" && (
                  <motion.div
                    key={currentQuestion}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute bottom-4 left-4 right-4 md:left-8 md:right-8 md:bottom-8"
                  >
                    <div className="bg-black/80 backdrop-blur-md px-5 py-4 rounded-lg text-white border border-white/10 shadow-2xl">
                      <p className="text-sm md:text-base leading-relaxed">
                        <span className="font-semibold">
                          Q{currentQuestion + 1}:
                        </span>{" "}
                        {GUIDING_QUESTIONS[currentQuestion]}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status Overlays */}
              <AnimatePresence>
                {status === "preparing" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 flex items-center justify-center"
                  >
                    <div className="text-center text-white">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                      <p className="text-sm md:text-base">
                        Initializing camera...
                      </p>
                    </div>
                  </motion.div>
                )}

                {(status === "uploading" || status === "processing") && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 flex items-center justify-center"
                  >
                    <div className="text-center text-white max-w-sm px-6">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto mb-3" />
                      <p className="text-base mb-2">
                        {status === "uploading"
                          ? "Uploading..."
                          : "Processing..."}
                      </p>
                      <p className="text-xs text-slate-400">
                        {jobStatus?.message || "Please wait"}
                      </p>
                      {jobStatus?.progress && (
                        <div className="mt-4 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${jobStatus.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {status === "error" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 flex items-center justify-center"
                  >
                    <div className="text-center text-white max-w-sm px-6">
                      <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                      <p className="text-sm md:text-base mb-4">{error}</p>
                      <Button
                        onClick={initializeCamera}
                        size="lg"
                        className="bg-white text-slate-900 hover:bg-slate-100 touch-manipulation font-medium"
                      >
                        Try Again
                      </Button>
                    </div>
                  </motion.div>
                )}

                {status === "completed" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/90 flex items-center justify-center"
                  >
                    <div className="text-center text-white">
                      <CheckCircle2 className="h-14 w-14 mx-auto mb-3" />
                      <p className="text-base">Complete!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress Bar */}
            {status === "recording" && (
              <div className="h-1.5 md:h-1 bg-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercent()}%` }}
                  className="h-full bg-red-600 transition-all duration-300"
                />
              </div>
            )}

            {/* Controls */}
            <div className="bg-slate-900 px-4 py-4 md:px-6 md:py-3 border-t border-slate-800">
              <div className="flex items-center justify-center gap-3">
                {status === "ready" && (
                  <Button
                    onClick={startRecordingWithCountdown}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 md:py-3 rounded-lg font-medium text-base md:text-sm touch-manipulation"
                  >
                    <Circle className="h-5 w-5 md:h-4 md:w-4 mr-2 fill-current" />
                    Start Recording
                  </Button>
                )}

                {status === "recording" && (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="bg-slate-700 hover:bg-slate-600 text-white px-8 py-6 md:py-3 rounded-lg font-medium text-base md:text-sm touch-manipulation"
                  >
                    <Square className="h-5 w-5 md:h-4 md:w-4 mr-2 fill-current" />
                    Stop
                  </Button>
                )}

                {status === "stopped" && (
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <Button
                      onClick={retake}
                      size="lg"
                      className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-6 md:py-2 rounded-lg w-full sm:w-auto touch-manipulation font-medium"
                    >
                      <RotateCcw className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                      Retake
                    </Button>
                    <div className="flex items-center gap-2 text-white bg-slate-800 px-4 py-2 rounded-lg text-sm border border-slate-700">
                      <CheckCircle2 className="h-5 w-5 md:h-4 md:w-4" />
                      <span className="font-medium">Ready to submit</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Details Form */}
          {status === "stopped" && recordedBlobRef.current && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 md:mt-6"
            >
              <PersonalDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={submitRecording}
                isSubmitting={false}
              />
            </motion.div>
          )}
          {(status === "uploading" || status === "processing") && (
            <div className="mt-4 md:mt-6">
              <PersonalDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={submitRecording}
                isSubmitting={true}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default observer(VideoRecorder);
