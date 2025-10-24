import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  CheckCircle,
  Play,
  Square,
  RotateCcw,
  AlertCircle,
  QrCode,
  Target,
  Clock,
  CloudUpload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PersonalDetailsForm from "./PersonalDetailsForm";
import { useJobProgress } from "@/hooks/useJobProgress";
import { observer } from "mobx-react-lite";
import { videoCompressionService } from "@/services/video-compression";

// Questions to display alongside recording
const TESTIMONIAL_QUESTIONS = [
  "What specific problem did our solution solve for you?",
  "How has our solution impacted your business or workflow?",
  "What would you tell someone considering our solution?",
];

interface RecordingState {
  status:
    | "idle"
    | "recording"
    | "stopped"
    | "compressing"
    | "uploading"
    | "queued"
    | "processing"
    | "completed"
    | "error";
  duration: number;
  error?: string;
  jobId?: string;
  stage?: string;
  message?: string;
  testimonialId?: string;
  compressionProgress?: number;
}

interface TestimonialFormData {
  name: string;
  email: string;
  company: string;
  textContent: string;
  rating: number;
}

interface VideoRecordingProps {
  formData: TestimonialFormData;
  setFormData: (data: TestimonialFormData) => void;
  onSubmitSuccess: (testimonialId?: string) => void;
  workspaceId: string;
}

const VideoRecording: React.FC<VideoRecordingProps> = ({
  formData,
  setFormData,
  onSubmitSuccess,
  workspaceId,
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showMobileTransfer, setShowMobileTransfer] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { jobStatus, startTracking, stopTracking } = useJobProgress();

  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Check if user is on mobile
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  const maxDuration = 120; // 2 minutes

  // Initialize camera when component mounts
  useEffect(() => {
    initializeMedia();

    return () => {
      cleanup();
    };
  }, []);

  // Handle job status updates from SSE
  useEffect(() => {
    if (jobStatus) {
      setRecordingState((prev) => ({
        ...prev,
        status:
          jobStatus.status === "completed"
            ? "completed"
            : jobStatus.status === "failed"
              ? "error"
              : "processing",
        stage: jobStatus.stage,
        message: jobStatus.message,
        testimonialId: jobStatus.testimonial_id,
        error: jobStatus.error,
      }));

      // Complete the upload if done
      if (jobStatus.status === "completed" && jobStatus.testimonial_id) {
        setTimeout(() => {
          onSubmitSuccess(jobStatus.testimonial_id);
        }, 1000);
      }
    }
  }, [jobStatus, onSubmitSuccess]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const initializeMedia = async () => {
    try {
      setPermissionError(null);

      // Mobile-optimized constraints
      const constraints: MediaStreamConstraints = {
        video: isMobile
          ? {
              width: { ideal: 720 },
              height: { ideal: 1280 },
              frameRate: { ideal: 30 },
              facingMode: "user",
            }
          : {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
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
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      setRecordingState({
        status: "error",
        duration: 0,
        error: "Please select a valid video file",
      });
      return;
    }

    // Validate file size and check if compression is needed
    const validation = videoCompressionService.validateFileSize(file);

    if (!validation.isValid) {
      setRecordingState({
        status: "error",
        duration: 0,
        error: validation.message,
      });
      return;
    }

    // Stop camera when uploading
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    let finalFile = file;

    // Compress if needed
    if (validation.shouldCompress) {
      try {
        setRecordingState({
          status: "compressing",
          duration: 0,
          message: validation.message,
          compressionProgress: 0,
        });

        const result = await videoCompressionService.compressVideo(file, {
          onProgress: (progress) => {
            setRecordingState((prev) => ({
              ...prev,
              compressionProgress: progress,
            }));
          },
        });

        if ("error" in result) {
          // Compression failed - check if original file is under 200MB
          if (file.size <= 200 * 1024 * 1024) {
            console.warn(
              "Compression failed, using original file:",
              result.error
            );
            finalFile = file;
          } else {
            setRecordingState({
              status: "error",
              duration: 0,
              error:
                "File is too large and compression failed. Please use a file smaller than 200MB.",
            });
            return;
          }
        } else {
          finalFile = result.compressedFile;
          console.log(
            `Video compressed: ${videoCompressionService.formatFileSize(result.originalSize)} → ${videoCompressionService.formatFileSize(result.compressedSize)} (${result.compressionRatio.toFixed(1)}% reduction)`
          );
        }
      } catch (error) {
        // Compression failed - fallback to original if under 200MB
        if (file.size <= 200 * 1024 * 1024) {
          console.warn("Compression failed, using original file:", error);
          finalFile = file;
        } else {
          setRecordingState({
            status: "error",
            duration: 0,
            error:
              "File is too large and compression failed. Please use a file smaller than 200MB.",
          });
          return;
        }
      }
    }

    // Set uploaded file and blob
    setUploadedFile(finalFile);
    recordedBlobRef.current = finalFile;

    // Show uploaded video in preview
    if (recordedVideoRef.current) {
      const videoUrl = URL.createObjectURL(finalFile);
      recordedVideoRef.current.src = videoUrl;
      recordedVideoRef.current.load(); // Force reload the video element
    }

    setRecordingState({ status: "stopped", duration: 0 });
  };

  const submitTestimonial = async () => {
    if (!recordedBlobRef.current) return;

    let finalBlob = recordedBlobRef.current;

    // Check if compression is needed for recorded videos
    if (
      videoCompressionService.shouldCompress(
        (recordedBlobRef.current as File) ||
          new File([recordedBlobRef.current], "recorded.webm")
      )
    ) {
      try {
        setRecordingState((prev) => ({
          ...prev,
          status: "compressing",
          message: "Compressing recorded video for faster upload...",
          compressionProgress: 0,
        }));

        const file =
          recordedBlobRef.current instanceof File
            ? recordedBlobRef.current
            : new File([recordedBlobRef.current], "recorded.webm", {
                type: "video/webm",
              });

        const result = await videoCompressionService.compressVideo(file, {
          onProgress: (progress) => {
            setRecordingState((prev) => ({
              ...prev,
              compressionProgress: progress,
            }));
          },
        });

        if ("error" in result) {
          console.warn(
            "Compression failed for recorded video, using original:",
            result.error
          );
          finalBlob = recordedBlobRef.current;
        } else {
          finalBlob = result.compressedFile;
          console.log(
            `Recorded video compressed: ${videoCompressionService.formatFileSize(result.originalSize)} → ${videoCompressionService.formatFileSize(result.compressedSize)} (${result.compressionRatio.toFixed(1)}% reduction)`
          );
        }
      } catch (error) {
        console.warn(
          "Compression failed for recorded video, using original:",
          error
        );
        finalBlob = recordedBlobRef.current;
      }
    }

    setRecordingState((prev) => ({ ...prev, status: "uploading" }));
    setUploadProgress(5);

    try {
      // Use the workspace ID passed as prop

      const formDataObj = new FormData();
      formDataObj.append(
        "video",
        finalBlob,
        `testimonial_${Date.now()}.${finalBlob instanceof File ? "mp4" : "webm"}`
      );
      formDataObj.append("author_name", formData.name);
      formDataObj.append("author_email", formData.email);
      formDataObj.append("author_company", formData.company || "");
      formDataObj.append("rating", formData.rating.toString());
      formDataObj.append("collection_method", uploadedFile ? "form" : "form");

      // Use queued upload endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/collection/workspaces/${workspaceId}/testimonials/upload/video/queue`,
        {
          method: "POST",
          body: formDataObj,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      const result = await response.json();

      setRecordingState((prev) => ({
        ...prev,
        status: "queued",
        jobId: result.job_id,
        message: "Upload queued successfully! Processing will begin shortly...",
      }));

      // Start tracking job progress via SSE
      startTracking(result.job_id);
    } catch (error: any) {
      console.error("Error submitting testimonial:", error);
      setRecordingState({
        status: "error",
        duration: recordingState.duration,
        error:
          error.message || "Failed to submit testimonial. Please try again.",
      });
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
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Questions sidebar */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 sticky top-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="h-3 w-3 text-blue-600" />
              Recording Guide
            </h3>

            <div className="space-y-2 mb-4">
              {TESTIMONIAL_QUESTIONS.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-2.5 rounded-md transition-all cursor-pointer ${
                    currentQuestion === index
                      ? "bg-blue-100 border border-blue-300"
                      : "bg-white border border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setCurrentQuestion(index)}
                >
                  <div className="flex gap-2">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        currentQuestion === index
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {question}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recording tips */}
            <div className="bg-white rounded-md p-2.5 border border-gray-200">
              <h4 className="text-xs font-semibold text-gray-900 mb-1.5">
                Tips
              </h4>
              <ul className="text-xs text-gray-600 space-y-0.5">
                <li className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-green-500 rounded-full flex-shrink-0"></div>
                  Look directly at camera
                </li>
                <li className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-green-500 rounded-full flex-shrink-0"></div>
                  Speak clearly and naturally
                </li>
                <li className="flex items-center gap-1.5">
                  <div className="w-1 h-1 bg-green-500 rounded-full flex-shrink-0"></div>
                  Keep it under 2 minutes
                </li>
              </ul>
            </div>

            {isMobile && !showMobileTransfer && (
              <button
                onClick={() => setShowMobileTransfer(true)}
                className="mt-2 w-full text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1.5 py-1.5 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
              >
                <QrCode className="h-3 w-3" />
                Continue on computer
              </button>
            )}
          </div>
        </div>

        {/* Professional Recording Studio */}
        <div className="lg:col-span-3">
          {/* Permission Error */}
          {permissionError && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{permissionError}</p>
                <button
                  onClick={initializeMedia}
                  className="text-xs text-red-600 hover:text-red-800 underline"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {showMobileTransfer ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Continue on Desktop
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Scan QR code for better recording quality
              </p>
              <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xs text-gray-500">QR Code</span>
              </div>
              <button
                onClick={() => setShowMobileTransfer(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Record here instead
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 rounded-2xl overflow-hidden shadow-2xl border border-gray-300">
              {/* Video Display */}
              <div className="relative bg-black">
                {/* Live Preview or Recorded Video */}
                {uploadedFile || recordedBlobRef.current ? (
                  <video
                    ref={recordedVideoRef}
                    controls
                    playsInline
                    className={`w-full object-cover rounded-t-2xl ${
                      isMobile ? "aspect-[9/16]" : "aspect-video"
                    }`}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full object-cover rounded-t-2xl ${
                      isMobile ? "aspect-[9/16]" : "aspect-video"
                    }`}
                  />
                )}

                {/* Overlay Elements */}
                <div className="absolute inset-0">
                  {!hasPermissions && !permissionError && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm">Initializing camera...</p>
                      </div>
                    </div>
                  )}

                  {/* Elegant Recording Indicator */}
                  {recordingState.status === "recording" && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-medium tracking-wide">
                          REC
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sleek Timer */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-mono">
                      {formatTime(recordingState.duration)}
                      <span className="text-gray-400">
                        /{formatTime(maxDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Upload Progress */}
                  {(recordingState.status === "compressing" ||
                    recordingState.status === "uploading" ||
                    recordingState.status === "queued" ||
                    recordingState.status === "processing") && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="flex justify-center mb-3">
                          {recordingState.status === "compressing" && (
                            <Zap className="w-12 h-12 text-green-500 animate-pulse" />
                          )}
                          {recordingState.status === "uploading" && (
                            <CloudUpload className="w-12 h-12 text-blue-500 animate-pulse" />
                          )}
                          {recordingState.status === "queued" && (
                            <Clock className="w-12 h-12 text-yellow-500 animate-spin" />
                          )}
                          {recordingState.status === "processing" && (
                            <Zap className="w-12 h-12 text-purple-500 animate-pulse" />
                          )}
                        </div>
                        <p className="text-sm mb-2">
                          {recordingState.status === "compressing" &&
                            "Compressing video for faster upload..."}
                          {recordingState.status === "uploading" &&
                            "Uploading your testimonial..."}
                          {recordingState.status === "queued" &&
                            "Upload queued for processing..."}
                          {recordingState.status === "processing" &&
                            "AI processing in progress..."}
                        </p>
                        {recordingState.stage && (
                          <p className="text-xs text-gray-400 mb-2">
                            {recordingState.stage}
                          </p>
                        )}
                        <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              recordingState.status === "compressing"
                                ? "bg-green-500"
                                : recordingState.status === "uploading"
                                  ? "bg-blue-500"
                                  : recordingState.status === "queued"
                                    ? "bg-yellow-500"
                                    : "bg-purple-500"
                            }`}
                            style={{
                              width: `${
                                recordingState.status === "compressing"
                                  ? recordingState.compressionProgress || 0
                                  : jobStatus?.progress || uploadProgress
                              }%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {recordingState.status === "compressing"
                            ? `${recordingState.compressionProgress || 0}%`
                            : `${jobStatus?.progress || uploadProgress}%`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Question Prompt */}
                  {hasPermissions && recordingState.status === "idle" && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-gradient-to-r from-blue-600/90 to-purple-600/90 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="text-white text-sm">
                          <span className="text-blue-200 font-medium">
                            Question {currentQuestion + 1}:
                          </span>
                          <br />
                          <span className="text-white/90">
                            {TESTIMONIAL_QUESTIONS[currentQuestion]}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Elegant Progress Bar */}
              {recordingState.status === "recording" && (
                <div className="px-6 py-2 bg-gray-50">
                  <div className="h-1.5 bg-gray-300 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${getProgressPercentage()}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}

              {/* Professional Controls */}
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {recordingState.status === "idle" && hasPermissions && (
                      <Button
                        onClick={startRecording}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    )}

                    {recordingState.status === "recording" && (
                      <Button
                        onClick={stopRecording}
                        className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg font-medium"
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    )}

                    {recordingState.status === "stopped" && (
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={resetRecording}
                          variant="outline"
                          className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Re-record
                        </Button>
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium text-sm">Ready!</span>
                        </div>
                      </div>
                    )}

                    {recordingState.status === "completed" && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Successfully submitted!
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button
                      variant="outline"
                      className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Personal details form */}
          {(recordedBlobRef.current || uploadedFile) &&
            !showMobileTransfer &&
            recordingState.status !== "completed" && (
              <PersonalDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={submitTestimonial}
                isSubmitting={recordingState.status === "uploading"}
              />
            )}
        </div>
      </div>
    </div>
  );
};

export default observer(VideoRecording);
