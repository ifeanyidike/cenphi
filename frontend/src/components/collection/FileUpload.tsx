import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
  ArrowUpCircle,
  File,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

type FileStatus = "initial" | "uploading" | "processing" | "complete" | "error";
type FileType = "video" | "audio" | "document" | "image";
type AcceptedFormats = Record<string, string[]>;

interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface FileUploadProps {
  type: FileType;
  onComplete: (file: File, metadata: FileMetadata) => Promise<void>;
  onError?: (error: Error) => void;
  maxSize?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  allowMultiple?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const FileUpload: React.FC<FileUploadProps> = observer(
  ({
    type,
    onComplete,
    onError,
    maxSize = 100 * 1024 * 1024,
    acceptedFormats,
    showPreview = true,
    allowMultiple = false,
    className = "",
  }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadStatus, setUploadStatus] = useState<
      Record<string, FileStatus>
    >({});
    const [uploadProgress, setUploadProgress] = useState<
      Record<string, number>
    >({});
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
    // const controls = useAnimation();
    const { toast } = useToast();
    const navigate = useNavigate();

    const acceptedTypes: Record<FileType, AcceptedFormats> = {
      video: { "video/*": [".mp4", ".mov", ".avi"] },
      audio: { "audio/*": [".mp3", ".wav", ".m4a"] },
      document: {
        "application/pdf": [".pdf"],
        "text/plain": [".txt"],
        "application/msword": [".doc", ".docx"],
      },
      image: { "image/*": [".png", ".jpg", ".jpeg", ".gif"] },
    };

    const onDrop = useCallback(
      async (acceptedFiles: File[]) => {
        // Filter out any undefined files
        const validFiles = acceptedFiles.filter((file) => file !== undefined);

        if (validFiles.length === 0) {
          // Optionally, you can show an error message here if no valid file was dropped
          return;
        }

        // Use functional update to always get the latest state
        setFiles((prevFiles) =>
          allowMultiple ? [...prevFiles, ...validFiles] : [validFiles[0]]
        );

        // Generate previews for images
        if (showPreview && type === "image") {
          validFiles.forEach((file) => {
            const url = URL.createObjectURL(file);
            setPreviewUrls((prev) => ({ ...prev, [file.name]: url }));
          });
        }

        // Process each valid file
        validFiles.forEach((file) => {
          processFile(file);
        });
      },
      [allowMultiple, showPreview, type]
    );

    const processFile = async (file: File) => {
      setUploadStatus((prev) => ({ ...prev, [file.name]: "uploading" }));
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

      try {
        // Simulate upload progress
        await simulateUpload(file);

        setUploadStatus((prev) => ({ ...prev, [file.name]: "processing" }));

        // Process file metadata
        const metadata: FileMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        };

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        await onComplete(file, metadata);
        setUploadStatus((prev) => ({ ...prev, [file.name]: "complete" }));

        toast({
          title: "Upload Complete",
          description: `${file.name} has been successfully uploaded.`,
          variant: "default",
        });

        // collectionStore.handleComplete(file);
        navigate(`/collection/thank-you`);
      } catch (error) {
        setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }));
        onError?.(error as Error);

        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}. Please try again.`,
          variant: "destructive",
        });
      }
    };

    const simulateUpload = async (file: File) => {
      const totalSteps = 100;
      const stepTime = 50;

      for (let step = 0; step <= totalSteps; step++) {
        await new Promise((resolve) => setTimeout(resolve, stepTime));
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: Math.min((step / totalSteps) * 100, 100),
        }));
      }
    };

    const removeFile = (fileName: string) => {
      setFiles(files.filter((f) => f.name !== fileName));
      setUploadStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[fileName];
        return newStatus;
      });
      setUploadProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
      if (previewUrls[fileName]) {
        URL.revokeObjectURL(previewUrls[fileName]);
        setPreviewUrls((prev) => {
          const newUrls = { ...prev };
          delete newUrls[fileName];
          return newUrls;
        });
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      // onDrop: (files) => {
      //   console.log("Dropped files:", files);
      // },
      accept: acceptedFormats
        ? { "application/*": acceptedFormats }
        : acceptedTypes[type],
      maxSize,
      multiple: allowMultiple,
    });

    const getStatusColor = (status: FileStatus) => {
      switch (status) {
        case "uploading":
          return "from-blue-500 to-indigo-500";
        case "processing":
          return "from-amber-500 to-orange-500";
        case "complete":
          return "from-emerald-400 to-teal-500";
        case "error":
          return "from-red-500 to-rose-500";
        default:
          return "from-slate-500 to-slate-600";
      }
    };

    const getStatusIcon = (status: FileStatus) => {
      switch (status) {
        case "uploading":
          return <Upload className="h-5 w-5 animate-bounce" />;
        case "processing":
          return <Clock className="h-5 w-5 animate-spin" />;
        case "complete":
          return <CheckCircle2 className="h-5 w-5" />;
        case "error":
          return <AlertCircle className="h-5 w-5" />;
        default:
          return <File className="h-5 w-5" />;
      }
    };

    return (
      <div className={`w-full max-w-4xl mx-auto ${className}`}>
        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div
                {...getRootProps()}
                className={`
                relative overflow-hidden rounded-3xl p-8 md:p-16
                bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900
                border border-slate-700 hover:border-slate-600
                transition-all duration-300 cursor-pointer
                group
              `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 backdrop-blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

                <input {...getInputProps()} />

                <div className="relative space-y-8">
                  <motion.div
                    className="relative w-24 h-24 md:w-32 md:h-32 mx-auto"
                    animate={{
                      scale: isDragActive ? 1.1 : 1,
                      rotate: isDragActive ? 180 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse" />
                    <div className="relative h-full w-full flex items-center justify-center">
                      <ArrowUpCircle className="w-16 h-16 md:w-20 md:h-20 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300" />
                    </div>
                  </motion.div>

                  <div className="text-center space-y-4">
                    <h3 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
                      {isDragActive ? "Drop to upload" : `Upload your ${type}`}
                    </h3>
                    <p className="text-base md:text-lg text-slate-400">
                      Drag and drop or click to browse
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                    <div className="px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur-xl border border-slate-700">
                      <span className="text-slate-400">Up to </span>
                      <span className="text-indigo-400 font-medium">
                        {formatFileSize(maxSize)}
                      </span>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-slate-800/50 backdrop-blur-xl border border-slate-700">
                      <span className="text-indigo-400 font-medium">
                        {acceptedTypes[type][
                          Object.keys(acceptedTypes[type])[0]
                        ].join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {files.map((file, index) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="rounded-2xl p-6 bg-slate-900 border border-slate-700 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5" />

                  <div className="relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl opacity-20 blur-lg" />
                          <div
                            className={`
                          relative p-3 rounded-xl 
                          bg-gradient-to-br from-slate-800 to-slate-900
                          border border-slate-700
                        `}
                          >
                            {showPreview &&
                            type === "image" &&
                            previewUrls[file.name] ? (
                              <img
                                src={previewUrls[file.name]}
                                alt={file.name}
                                className="w-10 h-10 object-cover rounded-lg"
                              />
                            ) : (
                              <FileText className="h-10 w-10 text-indigo-400" />
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-lg font-semibold text-slate-200 mb-1">
                            {file.name}
                          </h4>
                          <p className="text-sm text-slate-400">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => removeFile(file.name)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 rounded-full hover:bg-slate-800/50 transition-colors group"
                      >
                        <Trash2 className="h-5 w-5 text-slate-500 group-hover:text-red-400" />
                      </motion.button>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20 blur-lg" />
                        <div className="relative h-2 rounded-full bg-slate-800/50 backdrop-blur-xl overflow-hidden border border-slate-700">
                          <motion.div
                            className={`
                            absolute inset-0 bg-gradient-to-r 
                            ${getStatusColor(uploadStatus[file.name])}
                          `}
                            initial={{ width: "0%" }}
                            animate={{ width: `${uploadProgress[file.name]}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`
                          p-2 rounded-full
                          bg-gradient-to-br from-slate-800 to-slate-900
                          border border-slate-700
                        `}
                          >
                            {getStatusIcon(uploadStatus[file.name])}
                          </div>

                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-200">
                              {uploadStatus[file.name] === "uploading" &&
                                "Uploading..."}
                              {uploadStatus[file.name] === "processing" &&
                                "Processing..."}
                              {uploadStatus[file.name] === "complete" &&
                                "Upload Complete"}
                              {uploadStatus[file.name] === "error" &&
                                "Upload Failed"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {uploadStatus[file.name] === "uploading" &&
                                `${Math.round(
                                  uploadProgress[file.name]
                                )}% uploaded`}
                              {uploadStatus[file.name] === "processing" &&
                                "Almost there..."}
                              {uploadStatus[file.name] === "complete" &&
                                "Your file is ready"}
                              {uploadStatus[file.name] === "error" &&
                                "Please try again"}
                            </p>
                          </div>
                        </div>

                        {uploadStatus[file.name] === "error" && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Failed to upload file. Please try again or contact
                              support if the issue persists.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {allowMultiple && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4"
                >
                  <div
                    {...getRootProps()}
                    className={`
                    relative p-4 rounded-xl
                    bg-gradient-to-br from-slate-800 to-slate-900
                    border border-slate-700 border-dashed
                    hover:border-slate-600 transition-colors
                    cursor-pointer text-center
                  `}
                  >
                    <input {...getInputProps()} />
                    <p className="text-sm text-slate-400">
                      Drop more files or{" "}
                      <span className="text-indigo-400">browse</span>
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast for files that exceed size limit */}
        {files.some((file) => file.size > maxSize) && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some files exceed the maximum size limit of{" "}
              {formatFileSize(maxSize)}.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
);

export default FileUpload;
