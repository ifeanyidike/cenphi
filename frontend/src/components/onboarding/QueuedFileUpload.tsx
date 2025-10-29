import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  File,
  Clock,
  CloudUpload,
  Zap,
} from "lucide-react";
import { authStore } from "@/stores/authStore";
import { useJobProgress } from "@/hooks/useJobProgress";

interface QueuedFileUploadProps {
  onUploadComplete: (testimonialId: string) => void;
  onError: (error: string) => void;
  onSkip: () => void;
  workspaceId: string;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

interface UploadState {
  status:
    | "idle"
    | "compressing"
    | "uploading"
    | "queued"
    | "processing"
    | "completed"
    | "error";
  progress: number;
  error?: string;
  file?: File;
  jobId?: string;
  stage?: string;
  message?: string;
  compressionProgress?: number;
  testimonialId?: string;
}

const ACCEPTED_FORMATS = [
  { mime: "video/mp4", ext: "MP4", description: "Most common format" },
  { mime: "video/webm", ext: "WebM", description: "Web optimized" },
  { mime: "video/quicktime", ext: "MOV", description: "Apple format" },
  { mime: "video/avi", ext: "AVI", description: "Windows format" },
];

export const QueuedFileUpload: React.FC<QueuedFileUploadProps> = ({
  onUploadComplete,
  onError,
  onSkip,
  workspaceId,
  maxFileSize = 1024 * 1024 * 400, // 400MB default (with compression support)
  acceptedFormats = ["video/mp4", "video/webm", "video/quicktime", "video/avi"],
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
  });
  const [dragActive, setDragActive] = useState(false);
  const { jobStatus, startTracking, stopTracking } = useJobProgress();

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.some((format) => file.type === format)) {
      return `Unsupported format. Please use: ${ACCEPTED_FORMATS.filter((f) =>
        acceptedFormats.includes(f.mime)
      )
        .map((f) => f.ext)
        .join(", ")}`;
    }

    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      return `File too large. Maximum size: ${maxSizeMB}MB`;
    }

    // Check file is not empty
    if (file.size === 0) {
      return "File appears to be empty";
    }

    return null;
  };

  // Handle job status updates from SSE
  useEffect(() => {
    if (jobStatus) {
      setUploadState((prev) => ({
        ...prev,
        status:
          jobStatus.status === "completed"
            ? "completed"
            : jobStatus.status === "failed"
              ? "error"
              : "processing",
        progress: jobStatus.progress || prev.progress,
        stage: jobStatus.stage,
        message: jobStatus.message,
        testimonialId: jobStatus.testimonial_id,
        error: jobStatus.error,
      }));

      // Complete the upload if done
      if (jobStatus.status === "completed" && jobStatus.testimonial_id) {
        setTimeout(() => {
          onUploadComplete(jobStatus.testimonial_id || "");
        }, 1000);
      }

      // Handle errors
      if (jobStatus.status === "failed" && jobStatus.error) {
        onError(jobStatus.error);
      }
    }
  }, [jobStatus, onUploadComplete, onError]);

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadState({
        status: "error",
        progress: 0,
        error: validationError,
        file,
      });
      onError(validationError);
      return;
    }

    setUploadState({
      status: "uploading",
      progress: 5,
      file,
      message: "Preparing upload...",
    });

    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      formData.append("video", file);
      formData.append("author_name", authStore.user?.displayName || "User");
      formData.append("author_email", authStore.user?.email || "");
      formData.append("collection_method", "form");

      // Use queued upload endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/collection/workspaces/${workspaceId}/testimonials/upload/video/queue`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Upload failed with status ${response.status}`
        );
      }

      const result = await response.json();

      setUploadState((prev) => ({
        ...prev,
        status: "queued",
        progress: 10,
        jobId: result.job_id,
        message: "Upload queued successfully! Processing will begin shortly...",
      }));

      // Start tracking job progress via SSE
      startTracking(result.job_id);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setUploadState((prev) => ({
        ...prev,
        status: "error",
        error: error.message,
      }));
      onError(error.message);
    }
  };

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    uploadFile(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleCancel = () => {
    stopTracking();
    setUploadState({
      status: "idle",
      progress: 0,
    });
  };

  const getStatusIcon = () => {
    switch (uploadState.status) {
      case "uploading":
        return <CloudUpload className="w-8 h-8 text-blue-600 animate-pulse" />;
      case "queued":
        return <Clock className="w-8 h-8 text-yellow-600 animate-spin" />;
      case "processing":
        return <Zap className="w-8 h-8 text-purple-600 animate-pulse" />;
      case "completed":
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <FileVideo className="w-8 h-8 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (uploadState.status) {
      case "uploading":
        return "Uploading file...";
      case "queued":
        return "Upload queued! Processing will begin shortly...";
      case "processing":
        return uploadState.message || "Processing video...";
      case "completed":
        return "Upload completed successfully!";
      case "error":
        return uploadState.error || "Upload failed";
      default:
        return "Ready to upload";
    }
  };

  const getProgressText = () => {
    if (uploadState.status === "processing" && uploadState.stage) {
      return `${uploadState.stage} (${uploadState.progress}%)`;
    }
    return `${uploadState.progress}%`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Upload Your Video Testimonial
        </h2>
        <p className="text-gray-600">
          Quick upload with instant progress tracking
        </p>
      </div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : uploadState.status === "error"
                ? "border-red-300 bg-red-50"
                : uploadState.status === "completed"
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <AnimatePresence mode="wait">
          {uploadState.status === "idle" ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Upload className="w-16 h-16 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Drop your video here
                </h3>
                <p className="text-gray-600 mb-4">or click to browse files</p>
                <input
                  type="file"
                  accept={acceptedFormats.join(",")}
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </label>
              </div>
              <div className="text-sm text-gray-500">
                Supports: {ACCEPTED_FORMATS.map((f) => f.ext).join(", ")} • Max:{" "}
                {Math.round(maxFileSize / (1024 * 1024))}MB
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Status Icon */}
              <div className="flex justify-center">{getStatusIcon()}</div>

              {/* File Info */}
              {uploadState.file && (
                <div className="flex items-center justify-center gap-3 p-4 bg-white rounded-lg border">
                  <File className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {uploadState.file.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {(uploadState.file.size / (1024 * 1024)).toFixed(1)} MB
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {getStatusText()}
                  </span>
                  <span className="text-gray-500">{getProgressText()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      uploadState.status === "error"
                        ? "bg-red-500"
                        : uploadState.status === "completed"
                          ? "bg-green-500"
                          : uploadState.status === "processing"
                            ? "bg-purple-500"
                            : "bg-blue-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadState.progress}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                {uploadState.status !== "completed" &&
                  uploadState.status !== "error" && (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                {uploadState.status === "error" && (
                  <button
                    onClick={() =>
                      setUploadState({ status: "idle", progress: 0 })
                    }
                    className="px-4 py-2 bg-blue-600 text-inherit rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onSkip}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          Skip for now
        </button>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4 text-yellow-500" />
          Powered by intelligent queuing
        </div>
      </div>
    </div>
  );
};
