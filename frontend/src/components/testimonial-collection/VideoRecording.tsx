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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PersonalDetailsForm from "./PersonalDetailsForm";

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
    | "uploading"
    | "completed"
    | "error";
  duration: number;
  error?: string;
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
  onSubmitSuccess: () => void;
}

const VideoRecording: React.FC<VideoRecordingProps> = ({
  formData,
  setFormData,
  onSubmitSuccess,
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

  const initializeMedia = async () => {
    try {
      setPermissionError(null);

      const constraints: MediaStreamConstraints = {
        video: {
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      if (file.size > 100 * 1024 * 1024) {
        setRecordingState({
          status: "error",
          duration: 0,
          error: "Video file must be smaller than 100MB",
        });
        return;
      }
      setUploadedFile(file);
      recordedBlobRef.current = file;

      // Stop camera when uploading
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Show uploaded video in preview
      if (recordedVideoRef.current) {
        recordedVideoRef.current.src = URL.createObjectURL(file);
      }

      setRecordingState({ status: "stopped", duration: 0 });
    } else {
      setRecordingState({
        status: "error",
        duration: 0,
        error: "Please select a valid video file",
      });
    }
  };

  const submitTestimonial = async () => {
    if (!recordedBlobRef.current) return;

    setRecordingState((prev) => ({ ...prev, status: "uploading" }));
    setUploadProgress(0);

    try {
      const formDataObj = new FormData();
      formDataObj.append(
        "video",
        recordedBlobRef.current,
        `testimonial_${Date.now()}.webm`
      );
      formDataObj.append("author_name", formData.name);
      formDataObj.append("author_email", formData.email);
      formDataObj.append("company", formData.company || "");
      formDataObj.append("rating", formData.rating.toString());
      formDataObj.append(
        "video_method",
        uploadedFile ? "uploaded" : "recorded"
      );
      formDataObj.append("type", "video");

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle response
      xhr.addEventListener("load", () => {
        if (xhr.status === 201 || xhr.status === 200) {
          setRecordingState((prev) => ({ ...prev, status: "completed" }));
          setTimeout(() => onSubmitSuccess(), 1000);
        } else {
          const errorData = xhr.responseText
            ? JSON.parse(xhr.responseText)
            : {};
          setRecordingState({
            status: "error",
            duration: recordingState.duration,
            error: errorData.message || "Failed to submit video testimonial",
          });
        }
      });

      xhr.addEventListener("error", () => {
        setRecordingState({
          status: "error",
          duration: recordingState.duration,
          error: "Upload failed. Please check your connection and try again.",
        });
      });

      // Send request
      xhr.open(
        "POST",
        `${import.meta.env.VITE_API_URL}/api/public/testimonials`
      );
      xhr.send(formDataObj);
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
                {recordingState.status === "idle" ||
                recordingState.status === "recording" ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full aspect-video object-cover rounded-t-2xl"
                  />
                ) : (
                  <video
                    ref={recordedVideoRef}
                    controls
                    playsInline
                    className="w-full aspect-video object-cover rounded-t-2xl"
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
                  {recordingState.status === "uploading" && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm mb-2">
                          Uploading your testimonial...
                        </p>
                        <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {uploadProgress}%
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

export default VideoRecording;
