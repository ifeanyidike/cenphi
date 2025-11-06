import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Loader2,
  X,
  ArrowLeft,
  Zap,
  CloudUpload,
  Film,
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

interface VideoUploadProps {
  formData: TestimonialFormData;
  setFormData: (data: TestimonialFormData) => void;
  onSubmitSuccess: (testimonialId?: string, compressionSessionId?: string) => void;
  onBack?: () => void;
  workspaceId: string;
  collectionId?: string;
}

const GUIDING_QUESTIONS = [
  "What specific problem did our solution solve for you?",
  "How has our solution impacted your business or workflow?",
  "What would you tell someone considering our solution?",
];

const ACCEPTED_FORMATS = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/avi",
];
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB

type UploadStatus =
  | "idle"
  | "validating"
  | "selected"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

/**
 * VideoUpload - Professional drag-and-drop upload interface
 *
 * World-class features:
 * - Beautiful drag-and-drop zone with animations
 * - Real-time file validation
 * - Video preview before upload
 * - Progress tracking with visual feedback
 * - Backend handles all compression
 * - Professional studio aesthetic
 * - Mobile responsive
 */
const VideoUpload: React.FC<VideoUploadProps> = ({
  formData,
  setFormData,
  onSubmitSuccess,
  onBack,
  workspaceId,
  collectionId,
}) => {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questionsExpanded, setQuestionsExpanded] = useState(true);
  const { jobStatus, startTracking, stopTracking } = useJobProgress();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return "Invalid file format. Please upload MP4, MOV, WebM, or AVI files.";
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return `File too large (${sizeMB}MB). Maximum file size is 250MB.`;
    }

    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setStatus("validating");

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setStatus("error");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStatus("selected");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && files[0]) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setStatus("idle");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const submitUpload = async () => {
    if (!selectedFile) return;

    try {
      setStatus("uploading");

      const result =
        await workspaceHub.testimonialManager.createVideoTestimonial({
          workspace_id: workspaceId,
          collection_id: collectionId,
          author_name: formData.name,
          author_email: formData.email,
          author_company: formData.company,
          rating: formData.rating,
          content: formData.textContent,
          videoBlob: selectedFile,
        });

      if (result.testimonial_id) {
        const compressionSessionId = result.compression_session_id;
        if (result.job_id) {
          setStatus("processing");
          startTracking(result.job_id);
        } else {
          setStatus("completed");
          setTimeout(() => onSubmitSuccess(result.testimonial_id, compressionSessionId), 1000);
        }
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Failed to upload video. Please try again.");
      setStatus("error");
    }
  };

  // Handle job completion
  React.useEffect(() => {
    if (jobStatus?.status === "completed" && status === "processing") {
      setStatus("completed");
      // Note: compression_session_id won't be available in job completion path,
      // only in immediate upload response
      setTimeout(() => onSubmitSuccess(jobStatus.testimonial_id), 1000);
    } else if (jobStatus?.status === "failed") {
      setError("Processing failed. Please try again.");
      setStatus("error");
    }
  }, [jobStatus, status, onSubmitSuccess]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      stopTracking();
    };
  }, [previewUrl, stopTracking]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="relative w-full h-full min-h-screen md:min-h-0 md:max-w-6xl md:mx-auto px-4 md:px-0 pt-16 md:pt-0">
      {/* Back Button */}
      {onBack && (status === "idle" || status === "selected") && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="fixed top-4 left-4 md:absolute md:-top-14 md:left-0 flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors z-50 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to options</span>
          <span className="sm:hidden">Back</span>
        </motion.button>
      )}

      <div className="grid md:grid-cols-12 gap-4 md:gap-6">
        {/* Guiding Questions Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-3 mb-4 md:mb-0"
        >
          <div className="md:sticky md:top-4">
            {/* Mobile: Collapsible Header */}
            <button
              onClick={() => setQuestionsExpanded(!questionsExpanded)}
              className="w-full md:hidden flex items-center justify-between bg-white rounded-lg p-4 border border-slate-200 mb-2"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Guide & Tips
                </h3>
              </div>
              {questionsExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-600" />
              )}
            </button>

            {/* Content - Always visible on desktop, collapsible on mobile */}
            <div
              className={`${questionsExpanded ? "block" : "hidden md:block"} bg-white rounded-lg p-4 md:p-5 border border-slate-200`}
            >
              <div className="hidden md:flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-slate-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-900">Your Guide</h3>
              </div>

              <div className="space-y-2.5 mb-4 md:mb-5">
                {GUIDING_QUESTIONS.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-700 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {question}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tips */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <h4 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-600" />
                  Upload Tips
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Best quality: MP4 format</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Max 250MB file size</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <div className="w-1 h-1 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                    <span>Auto-optimized by our AI</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="md:col-span-9"
        >
          <div className="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
            {/* Upload Zone or Preview */}
            <div className="relative aspect-video">
              <AnimatePresence mode="wait">
                {status === "idle" || status === "validating" ? (
                  // Drag & Drop Zone
                  <motion.div
                    key="dropzone"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleBrowseClick}
                    className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 py-8 md:py-0 ${
                      isDragging
                        ? "bg-slate-800 border-2 border-slate-600"
                        : "bg-slate-900 hover:bg-slate-850 active:bg-slate-850"
                    }`}
                  >
                    <div
                      className={`mb-4 md:mb-6 p-4 md:p-6 rounded-lg ${
                        isDragging ? "bg-slate-700" : "bg-slate-800"
                      }`}
                    >
                      <CloudUpload
                        className={`h-12 w-12 md:h-16 md:w-16 mx-auto transition-colors ${
                          isDragging ? "text-slate-300" : "text-slate-400"
                        }`}
                      />
                    </div>

                    <h3
                      className={`text-base md:text-lg font-semibold mb-2 transition-colors px-4 text-center ${
                        isDragging ? "text-white" : "text-slate-200"
                      }`}
                    >
                      {isDragging
                        ? "Drop your video here"
                        : "Tap to browse or drop video"}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 mb-4 md:mb-6 max-w-md text-center px-4 leading-relaxed">
                      MP4, MOV, WebM, or AVI • Max 250MB
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs text-slate-500 px-4">
                      <div className="flex items-center gap-1.5">
                        <Film className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>HD Quality</span>
                      </div>
                      <div className="hidden sm:block w-px h-4 bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>AI Processing</span>
                      </div>
                      <div className="hidden sm:block w-px h-4 bg-slate-700" />
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>Secure</span>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_FORMATS.join(",")}
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </motion.div>
                ) : status === "selected" ? (
                  // Video Preview
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full h-full bg-black"
                  >
                    <video
                      ref={previewRef}
                      src={previewUrl || undefined}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                    />

                    {/* File Info Overlay */}
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm text-white px-3 py-2 md:px-4 md:py-3 rounded-lg border border-slate-700 max-w-[calc(100%-6rem)]">
                      <div className="flex items-center gap-2 md:gap-3">
                        <FileVideo className="h-4 w-4 md:h-5 md:w-5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate">
                            {selectedFile?.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {selectedFile && formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={clearSelection}
                      className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-sm hover:bg-red-600 text-white p-2 md:p-3 rounded-lg transition-colors border border-slate-700 touch-manipulation"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </motion.div>
                ) : status === "uploading" || status === "processing" ? (
                  // Upload/Processing Progress
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full bg-slate-900 flex items-center justify-center"
                  >
                    <div className="text-center text-white max-w-md px-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="mb-4"
                      >
                        <Loader2 className="h-12 w-12 mx-auto text-slate-400" />
                      </motion.div>
                      <p className="text-base font-semibold mb-2">
                        {status === "uploading"
                          ? "Uploading..."
                          : "AI Processing..."}
                      </p>
                      <p className="text-xs text-slate-400 mb-4">
                        {jobStatus?.message || "Processing your testimonial"}
                      </p>
                      {jobStatus?.progress && (
                        <>
                          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${jobStatus.progress}%` }}
                              className="h-full bg-slate-300"
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-2">
                            {jobStatus.progress}%
                          </p>
                        </>
                      )}
                    </div>
                  </motion.div>
                ) : status === "error" ? (
                  // Error State
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full bg-slate-900 flex items-center justify-center"
                  >
                    <div className="text-center text-white max-w-md px-6">
                      <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-red-500 mx-auto mb-4" />
                      <p className="text-sm md:text-base font-medium mb-4">
                        {error}
                      </p>
                      <Button
                        onClick={clearSelection}
                        size="lg"
                        className="bg-white text-slate-900 hover:bg-slate-100 touch-manipulation font-medium"
                      >
                        Try Again
                      </Button>
                    </div>
                  </motion.div>
                ) : status === "completed" ? (
                  // Success State
                  <motion.div
                    key="completed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full bg-slate-900 flex items-center justify-center"
                  >
                    <div className="text-center text-white">
                      <CheckCircle2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <p className="text-lg font-semibold">
                        Testimonial Created!
                      </p>
                      <p className="text-sm text-slate-400 mt-2">
                        Redirecting to success page...
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="bg-slate-800 px-4 py-4 md:px-6 md:py-4 border-t border-slate-700">
              <div className="flex items-center justify-center gap-3 md:gap-4">
                {status === "idle" && (
                  <Button
                    onClick={handleBrowseClick}
                    size="lg"
                    className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-6 md:px-8 md:py-6 rounded-lg font-semibold text-base md:text-sm touch-manipulation w-full sm:w-auto"
                  >
                    <Upload className="h-5 w-5 mr-2" />
                    Choose Video File
                  </Button>
                )}

                {status === "selected" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"
                  >
                    <Button
                      onClick={clearSelection}
                      size="lg"
                      className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-6 md:py-2 rounded-lg touch-manipulation w-full sm:w-auto font-medium"
                    >
                      <X className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                      Remove
                    </Button>
                    <div className="flex items-center gap-2 text-white bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                      <CheckCircle2 className="h-5 w-5 md:h-4 md:w-4" />
                      <span className="text-sm font-medium">
                        Ready to submit!
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Details Form */}
          {status === "selected" && selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 md:mt-6"
            >
              <PersonalDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={submitUpload}
                isSubmitting={false}
              />
            </motion.div>
          )}
          {(status === "uploading" || status === "processing") && (
            <div className="mt-4 md:mt-6">
              <PersonalDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={submitUpload}
                isSubmitting={true}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default observer(VideoUpload);
