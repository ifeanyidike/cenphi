import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Square,
  RotateCcw,
  Upload,
  Settings,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  SkipForward,
} from "lucide-react";
import { authStore } from "@/stores/authStore";

interface VideoRecorderProps {
  onUploadComplete: (testimonialId: string) => void;
  onError: (error: string) => void;
  onSkip: () => void;
  workspaceId: string;
  maxDuration?: number;
}

interface RecordingState {
  status:
    | "idle"
    | "recording"
    | "stopped"
    | "uploading"
    | "validating" // New state for backend validation
    | "completed"
    | "error";
  duration: number;
  error?: string;
}

interface ValidationResult {
  success: boolean;
  score: number;
  hasSpeech: boolean;
  issues: string[];
  recommendation: string;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  onUploadComplete,
  onError,
  onSkip,
  workspaceId,
  maxDuration = 120, // 2 minutes for testimonials
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
  });

  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<number | null>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  // Initialize camera and microphone
  useEffect(() => {
    initializeMedia();
    return () => cleanup();
  }, [videoEnabled, audioEnabled]);

  const initializeMedia = async () => {
    try {
      setPermissionError(null);

      const constraints: MediaStreamConstraints = {
        video: videoEnabled
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            }
          : false,
        audio: audioEnabled
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setHasPermissions(true);
    } catch (error: any) {
      console.error("Failed to access media devices:", error);
      setPermissionError(
        error.name === "NotAllowedError"
          ? "Camera and microphone access denied. Please allow permissions and refresh."
          : "Failed to access camera or microphone. Please check your devices."
      );
      setHasPermissions(false);
    }
  };

  const startRecording = () => {
    if (!streamRef.current || !hasPermissions) return;

    // Simple validation - just check if audio is enabled for testimonials
    if (!audioEnabled) {
      onError(
        "Audio is required for testimonials. Please enable your microphone."
      );
      return;
    }

    try {
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        recordedBlobRef.current = blob;

        if (recordedVideoRef.current) {
          recordedVideoRef.current.src = URL.createObjectURL(blob);
        }
      };

      mediaRecorder.start(1000);
      setRecordingState({ status: "recording", duration: 0 });

      // Start duration counter
      intervalRef.current = window.setInterval(() => {
        setRecordingState((prev) => {
          const newDuration = prev.duration + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return { ...prev, duration: maxDuration };
          }
          return { ...prev, duration: newDuration };
        });
      }, 1000);
    } catch (error: any) {
      console.error("Failed to start recording:", error);
      setRecordingState({
        status: "error",
        duration: 0,
        error: "Failed to start recording",
      });
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setRecordingState((prev) => ({ ...prev, status: "stopped" }));
  };

  const resetRecording = () => {
    if (recordedBlobRef.current && recordedVideoRef.current) {
      URL.revokeObjectURL(recordedVideoRef.current.src);
    }

    recordedBlobRef.current = null;
    chunksRef.current = [];
    setRecordingState({ status: "idle", duration: 0 });
    setUploadProgress(0);
    setValidationResult(null);
  };

  const uploadRecording = async () => {
    if (!recordedBlobRef.current) return;

    setRecordingState((prev) => ({ ...prev, status: "uploading" }));
    setUploadProgress(0);
    setValidationResult(null);

    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      formData.append(
        "video",
        recordedBlobRef.current,
        `testimonial_recording_${Date.now()}.webm`
      );
      formData.append("author_name", authStore.user?.displayName || "User");
      formData.append("author_email", authStore.user?.email || "");
      formData.append("video_method", "recorded");
      formData.append("require_voice_validation", "true"); // Tell backend to validate

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle response
      xhr.addEventListener("load", async () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);

          // Check if backend validation passed
          if (response.voice_detected === false) {
            setValidationResult({
              success: false,
              score: 0,
              hasSpeech: false,
              issues: ["No voice detected in recording"],
              recommendation:
                response.quality_feedback ||
                "Please record again and speak clearly into your microphone throughout the testimonial.",
            });
            setRecordingState({
              status: "error",
              duration: recordingState.duration,
              error:
                response.quality_feedback ||
                "No voice detected in testimonial. Please record again with clear speech.",
            });
            return;
          }

          if (response.can_transcribe === false) {
            setValidationResult({
              success: false,
              score: response.quality_score || 0,
              hasSpeech: response.voice_detected || false,
              issues: ["Audio quality too poor for transcription"],
              recommendation:
                response.quality_feedback ||
                "Please record in a quieter environment with clearer speech.",
            });
            setRecordingState({
              status: "error",
              duration: recordingState.duration,
              error:
                response.quality_feedback ||
                "Audio quality insufficient for processing. Please record in a quieter environment.",
            });
            return;
          }

          // Success!
          setValidationResult({
            success: true,
            score: response.quality_score || 100,
            hasSpeech: true,
            issues: [],
            recommendation:
              response.quality_feedback || "Testimonial recorded successfully!",
          });

          setRecordingState((prev) => ({ ...prev, status: "completed" }));
          onUploadComplete(response.testimonial_id);
        } else {
          const errorData = xhr.responseText
            ? JSON.parse(xhr.responseText)
            : {};

          // Handle specific validation errors from backend
          if (xhr.status === 400) {
            if (
              errorData.message?.includes("voice") ||
              errorData.message?.includes("speech")
            ) {
              setValidationResult({
                success: false,
                score: errorData.quality_score || 0,
                hasSpeech: errorData.voice_detected || false,
                issues: [errorData.message],
                recommendation:
                  errorData.quality_feedback ||
                  "Please record again and speak clearly about your experience.",
              });
              setRecordingState({
                status: "error",
                duration: recordingState.duration,
                error: errorData.message || "Upload validation failed",
              });
              return;
            }

            // Handle other 400 errors (file format, size, etc.)
            setRecordingState({
              status: "error",
              duration: recordingState.duration,
              error:
                errorData.message ||
                "Invalid upload. Please check your file and try again.",
            });
            return;
          }

          // Handle other HTTP errors (500, network issues, etc.)
          const errorMessage =
            errorData.message ||
            (xhr.status >= 500
              ? "Server error occurred. Please try again later."
              : `Upload failed with status ${xhr.status}`);

          setRecordingState({
            status: "error",
            duration: recordingState.duration,
            error: errorMessage,
          });
          onError(errorMessage);
        }
      });

      xhr.addEventListener("error", () => {
        throw new Error(
          "Upload failed. Please check your connection and try again."
        );
      });

      // Send request
      xhr.open(
        "POST",
        `${import.meta.env.VITE_API_URL}/collection/workspaces/${workspaceId}/testimonials/upload/video`
      );
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setRecordingState({
        status: "error",
        duration: recordingState.duration,
        error: error.message,
      });
      onError(error.message);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (recordedBlobRef.current && recordedVideoRef.current) {
      URL.revokeObjectURL(recordedVideoRef.current.src);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercentage = (): number => {
    return (recordingState.duration / maxDuration) * 100;
  };

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
          <div className="px-8 pt-8 pb-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <div className="text-center">
                <h1 className="text-xl font-semibold text-gray-900 tracking-tight mb-1">
                  Record Your Testimonial
                </h1>
                <p className="text-sm text-gray-600 font-light">
                  Share your experience in up to {Math.floor(maxDuration / 60)}{" "}
                  minutes
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {hasPermissions && (
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                )}
                <button
                  onClick={onSkip}
                  className="flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </button>
              </div>
            </div>
          </div>

          {/* Permission Error */}
          {permissionError && (
            <div className="px-8 py-6 bg-red-50 border-b border-red-100">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {permissionError}
                  </p>
                  <button
                    onClick={initializeMedia}
                    className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audio Requirement Notice */}
          {hasPermissions && !audioEnabled && (
            <div className="px-8 py-4 bg-yellow-50 border-b border-yellow-100">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Audio is required for testimonials
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please enable your microphone to record your testimonial.
                    Your voice will be transcribed and processed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validation Result */}
          {validationResult && !validationResult.success && (
            <div className="px-8 py-6 bg-red-50 border-b border-red-100">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Testimonial Validation Failed
                  </p>
                  <p className="text-sm text-red-700 mb-3">
                    {validationResult.recommendation}
                  </p>
                  {validationResult.issues.length > 0 && (
                    <div className="text-xs text-red-600">
                      <p className="font-medium mb-1">Issues detected:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {validationResult.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Video Display */}
          <div className="p-8">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video mb-6">
              {/* Live Preview */}
              {recordingState.status === "idle" ||
              recordingState.status === "recording" ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Recorded Video Playback */
                <video
                  ref={recordedVideoRef}
                  controls
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}

              {/* Recording Indicator */}
              {recordingState.status === "recording" && (
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white text-sm font-medium">
                    RECORDING
                  </span>
                </div>
              )}

              {/* Duration Display */}
              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                {formatTime(recordingState.duration)} /{" "}
                {formatTime(maxDuration)}
              </div>

              {/* Upload Progress */}
              {recordingState.status === "uploading" && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Uploading... {uploadProgress}%</p>
                  </div>
                </div>
              )}

              {/* Validation Progress */}
              {recordingState.status === "validating" && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Validating audio quality...</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Checking for voice content
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {recordingState.status === "recording" && (
              <div className="mb-6">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage()}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            )}

            {/* Success Message */}
            {validationResult && validationResult.success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Testimonial validated successfully!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      {validationResult.recommendation}
                    </p>
                    {validationResult.score > 0 && (
                      <div className="text-xs text-green-600 mt-2">
                        Audio Quality Score: {validationResult.score}/100
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {recordingState.status === "idle" && hasPermissions && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startRecording}
                  disabled={!audioEnabled}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                    audioEnabled
                      ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                      : "bg-gray-400 cursor-not-allowed text-gray-600"
                  }`}
                  title={
                    !audioEnabled
                      ? "Microphone required for testimonials"
                      : "Start recording"
                  }
                >
                  <Video className="h-6 w-6" />
                </motion.button>
              )}

              {recordingState.status === "recording" && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={stopRecording}
                  className="w-16 h-16 bg-gray-800 hover:bg-black text-white rounded-2xl flex items-center justify-center transition-colors shadow-lg"
                >
                  <Square className="h-6 w-6" />
                </motion.button>
              )}

              {recordingState.status === "stopped" && (
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={resetRecording}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl flex items-center transition-colors shadow-sm"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Re-record
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={uploadRecording}
                    className="px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl flex items-center transition-colors shadow-lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Testimonial
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </motion.button>
                </div>
              )}

              {recordingState.status === "completed" && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Testimonial submitted successfully!
                  </span>
                </div>
              )}
            </div>

            {/* Error Display */}
            {recordingState.status === "error" && recordingState.error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {recordingState.error}
                    </p>
                    <button
                      onClick={resetRecording}
                      className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-100/50 bg-gray-50/50"
              >
                <div className="px-8 py-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Recording Settings
                  </h3>
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setVideoEnabled(!videoEnabled)}
                        className={`p-2 rounded-lg transition-colors ${
                          videoEnabled
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {videoEnabled ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <VideoOff className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-sm text-gray-600">Camera</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`p-2 rounded-lg transition-colors ${
                          audioEnabled
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {audioEnabled ? (
                          <Mic className="h-4 w-4" />
                        ) : (
                          <MicOff className="h-4 w-4" />
                        )}
                      </button>
                      <span className="text-sm text-gray-600">Microphone</span>
                      <span className="text-xs text-red-600 font-medium">
                        (Required)
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Step 3 of 4 • Record testimonial (voice required)
          </p>
        </div>
      </div>
    </div>
  );
};
