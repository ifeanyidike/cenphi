import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileVideo,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  SkipForward,
  File,
  Clock,
} from "lucide-react";
import { authStore } from "@/stores/authStore";

interface FileUploadProps {
  onUploadComplete: (testimonialId: string) => void;
  onError: (error: string) => void;
  onSkip: () => void;
  workspaceId: string;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

interface UploadState {
  status: "idle" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  file?: File;
  uploadedBytes?: number;
  totalBytes?: number;
  estimatedTimeLeft?: number;
}

const ACCEPTED_FORMATS = [
  { mime: "video/mp4", ext: "MP4", description: "Most common format" },
  { mime: "video/webm", ext: "WebM", description: "Web optimized" },
  { mime: "video/quicktime", ext: "MOV", description: "Apple format" },
  { mime: "video/avi", ext: "AVI", description: "Windows format" },
];

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
  onSkip,
  workspaceId,
  maxFileSize = 1024 * 1024 * 1024, // 1GB default
  acceptedFormats = ["video/mp4", "video/webm", "video/quicktime", "video/avi"],
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const calculateEstimatedTime = (
    uploadedBytes: number,
    totalBytes: number,
    elapsedTime: number
  ): number => {
    if (uploadedBytes === 0 || elapsedTime === 0) return 0;

    const remainingBytes = totalBytes - uploadedBytes;
    const uploadRate = uploadedBytes / elapsedTime;
    return Math.round(remainingBytes / uploadRate);
  };

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
      progress: 0,
      file,
      uploadedBytes: 0,
      totalBytes: file.size,
    });

    setUploadStartTime(Date.now());

    try {
      const token = await authStore.user?.getIdToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      const formData = new FormData();
      formData.append("video", file);
      formData.append("author_name", authStore.user?.displayName || "User");
      formData.append("author_email", authStore.user?.email || "");
      formData.append("video_method", "uploaded");

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          const elapsedTime = (Date.now() - uploadStartTime) / 1000;
          const estimatedTimeLeft = calculateEstimatedTime(
            event.loaded,
            event.total,
            elapsedTime
          );

          setUploadState((prev) => ({
            ...prev,
            progress,
            uploadedBytes: event.loaded,
            totalBytes: event.total,
            estimatedTimeLeft,
          }));
        }
      });

      // Handle successful upload
      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setUploadState((prev) => ({
            ...prev,
            status: "completed",
            progress: 100,
          }));
          onUploadComplete(response.testimonial_id);
        } else {
          const errorResponse = xhr.responseText
            ? JSON.parse(xhr.responseText)
            : {};
          throw new Error(
            errorResponse.message || `Upload failed with status ${xhr.status}`
          );
        }
      });

      // Handle upload error
      xhr.addEventListener("error", () => {
        throw new Error(
          "Upload failed. Please check your connection and try again."
        );
      });

      // Handle upload abort
      xhr.addEventListener("abort", () => {
        setUploadState({
          status: "idle",
          progress: 0,
        });
      });

      // Setup abort signal
      abortControllerRef.current.signal.addEventListener("abort", () => {
        xhr.abort();
      });

      // Send the request
      xhr.open(
        "POST",
        `${import.meta.env.VITE_API_URL}/collection/workspaces/${workspaceId}/testimonials/upload/video`
      );
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
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

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const resetUpload = () => {
    setUploadState({ status: "idle", progress: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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
          <div className="px-8 pt-8 pb-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
                Upload Video Testimonial
              </h1>

              <button
                onClick={onSkip}
                className="flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip for now
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 font-light">
                Upload a video file (max{" "}
                {Math.round(maxFileSize / (1024 * 1024))}MB)
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {uploadState.status === "idle" && (
                <motion.div
                  key="upload-area"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer ${
                    dragActive
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedFormats.join(",")}
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center">
                      <Upload className="h-10 w-10 text-white" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        Drop your video here or click to browse
                      </h3>
                      <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                        Select a video file from your computer. We support most
                        common video formats.
                      </p>
                    </div>

                    {/* Supported Formats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-md">
                      {ACCEPTED_FORMATS.filter((f) =>
                        acceptedFormats.includes(f.mime)
                      ).map((format) => (
                        <div
                          key={format.ext}
                          className="bg-white border border-gray-200 rounded-xl p-3 text-center"
                        >
                          <div className="text-xs font-semibold text-gray-900 mb-1">
                            {format.ext}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format.description}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <File className="h-3 w-3 mr-1" />
                        Max {Math.round(maxFileSize / (1024 * 1024))}MB
                      </div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div>Multiple formats supported</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {uploadState.status === "uploading" && uploadState.file && (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-3xl border border-gray-200 p-8"
                >
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <FileVideo className="h-8 w-8 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900 truncate pr-4">
                          {uploadState.file.name}
                        </h3>
                        <button
                          onClick={cancelUpload}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>{formatFileSize(uploadState.file.size)}</span>
                          <div className="flex items-center space-x-4">
                            {uploadState.uploadedBytes &&
                              uploadState.totalBytes && (
                                <span>
                                  {formatFileSize(uploadState.uploadedBytes)} /{" "}
                                  {formatFileSize(uploadState.totalBytes)}
                                </span>
                              )}
                            {uploadState.estimatedTimeLeft &&
                              uploadState.estimatedTimeLeft > 0 && (
                                <div className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatTime(uploadState.estimatedTimeLeft)}{" "}
                                    left
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              {uploadState.progress}% complete
                            </span>
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          </div>
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadState.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-2xl p-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Processing will begin automatically
                              </p>
                              <p className="text-xs text-blue-700">
                                Your video will be transcribed and analyzed for
                                highlights once the upload completes.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {uploadState.status === "completed" && uploadState.file && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </motion.div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Upload successful!
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                    <span className="font-medium">{uploadState.file.name}</span>{" "}
                    has been uploaded successfully and is being processed.
                  </p>

                  <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Processing started automatically
                  </div>
                </motion.div>
              )}

              {uploadState.status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Upload failed
                  </h3>
                  <p className="text-sm text-red-600 mb-8 max-w-md mx-auto">
                    {uploadState.error}
                  </p>

                  <div className="flex items-center justify-center space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetUpload}
                      className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl transition-colors shadow-lg"
                    >
                      Try again
                    </motion.button>
                    <button
                      onClick={onSkip}
                      className="px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-2xl transition-colors"
                    >
                      Skip for now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
            Step 3 of 4 • Upload testimonial (optional)
          </p>
        </div>
      </div>
    </div>
  );
};
