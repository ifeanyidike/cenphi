// VideoUpload.tsx - Video file upload component
import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileVideo,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  File,
  Clock,
} from "lucide-react";
import { UPLOAD_CONFIG } from "./constants";

interface VideoUploadProps {
  onUploadComplete: (file: File, uploadedUrl?: string) => void;
  onError: (error: string) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  config: {
    primaryColor: string;
    secondaryColor: string;
  };
}

interface UploadState {
  status: "idle" | "compressing" | "uploading" | "completed" | "error";
  progress: number;
  error?: string;
  file?: File;
  compressionProgress?: number;
  uploadedBytes?: number;
  totalBytes?: number;
  estimatedTimeLeft?: number;
}

const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadComplete,
  onError,
  maxFileSize = UPLOAD_CONFIG.maxFileSize,
  acceptedFormats = UPLOAD_CONFIG.acceptedFormats,
  config,
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: "idle",
    progress: 0,
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    // Use compression service validation

    // Check file type separately
    if (!acceptedFormats.some((format) => file.type === format)) {
      const error = `Unsupported format. Please use: ${acceptedFormats.join(", ")}`;
      setUploadState({
        status: "error",
        progress: 0,
        error,
        file,
      });
      onError(error);
      return;
    }

    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      const error = `File too large. Maximum size: ${maxSizeMB}MB`;
      setUploadState({
        status: "error",
        progress: 0,
        error,
        file,
      });
      onError(error);
      return;
    }

    let finalFile = file;

    setUploadState({
      status: "uploading",
      progress: 0,
      file: finalFile,
      uploadedBytes: 0,
      totalBytes: finalFile.size,
    });

    setUploadStartTime(Date.now());

    try {
      // For simplified widget, we'll just simulate upload progress
      // and return the compressed file directly for preview/processing
      abortControllerRef.current = new AbortController();

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadState((prev) => {
          const newProgress = Math.min(prev.progress + 10, 100);
          const elapsedTime = (Date.now() - uploadStartTime) / 1000;
          const estimatedTimeLeft = calculateEstimatedTime(
            (newProgress / 100) * finalFile.size,
            finalFile.size,
            elapsedTime
          );

          if (newProgress >= 100) {
            clearInterval(uploadInterval);
            return {
              ...prev,
              status: "completed",
              progress: 100,
              estimatedTimeLeft: 0,
            };
          }

          return {
            ...prev,
            progress: newProgress,
            uploadedBytes: (newProgress / 100) * finalFile.size,
            estimatedTimeLeft,
          };
        });
      }, 200);

      // Wait for completion
      setTimeout(() => {
        clearInterval(uploadInterval);
        setUploadState((prev) => ({
          ...prev,
          status: "completed",
          progress: 100,
        }));
        onUploadComplete(finalFile);
      }, 2000);
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

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      uploadFile(file);
    },
    [maxFileSize, acceptedFormats]
  );

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
    <div className="tw-upload-section">
      {uploadState.status === "idle" && (
        <div
          className={`tw-upload-container ${dragActive ? "active" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{ position: "relative", cursor: "pointer" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="tw-upload-input"
          />

          <div>
            <div
              className="tw-upload-icon"
              style={{
                background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
              }}
            >
              <Upload
                style={{ width: "24px", height: "24px", color: "white" }}
              />
            </div>

            <h3 className="tw-upload-title">Upload Video File</h3>
            <p className="tw-upload-hint">
              Drop your video here or click to browse
            </p>

            {/* Supported Formats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(60px, 1fr))",
                gap: "8px",
                marginTop: "16px",
                maxWidth: "280px",
                margin: "16px auto 0",
              }}
            >
              {UPLOAD_CONFIG.supportedFormats
                .filter((f) => acceptedFormats.includes(f.mime))
                .map((format) => (
                  <div
                    key={format.ext}
                    style={{
                      background: "white",
                      border: "1px solid var(--tw-border-color)",
                      borderRadius: "8px",
                      padding: "8px 4px",
                      textAlign: "center",
                      fontSize: "10px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: "600",
                        color: "var(--tw-text-primary)",
                        marginBottom: "2px",
                      }}
                    >
                      {format.ext}
                    </div>
                    <div style={{ color: "var(--tw-text-secondary)" }}>
                      {format.description}
                    </div>
                  </div>
                ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "12px",
                fontSize: "12px",
                color: "var(--tw-text-secondary)",
              }}
            >
              <File
                style={{ width: "12px", height: "12px", marginRight: "4px" }}
              />
              Max {Math.round(maxFileSize / (1024 * 1024))}MB
            </div>
          </div>
        </div>
      )}

      {(uploadState.status === "compressing" ||
        uploadState.status === "uploading") &&
        uploadState.file && (
          <div
            className="tw-content"
            style={{
              padding: "20px",
              background: "white",
              border: "1px solid var(--tw-border-color)",
              borderRadius: "12px",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "rgba(var(--tw-primary-rgb), 0.1)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileVideo
                  style={{
                    width: "24px",
                    height: "24px",
                    color: "var(--tw-primary)",
                  }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "var(--tw-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      paddingRight: "16px",
                    }}
                  >
                    {uploadState.file.name}
                  </h3>
                  <button
                    onClick={cancelUpload}
                    style={{
                      padding: "4px",
                      color: "var(--tw-text-secondary)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                    onMouseEnter={(e) =>
                      ((e.target as HTMLElement).style.color =
                        "var(--tw-text-primary)")
                    }
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.color =
                        "var(--tw-text-secondary)")
                    }
                  >
                    <X style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "var(--tw-text-secondary)",
                      marginBottom: "12px",
                    }}
                  >
                    <span>{formatFileSize(uploadState.file.size)}</span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {uploadState.uploadedBytes && uploadState.totalBytes && (
                        <span>
                          {formatFileSize(uploadState.uploadedBytes)} /{" "}
                          {formatFileSize(uploadState.totalBytes)}
                        </span>
                      )}
                      {uploadState.estimatedTimeLeft &&
                        uploadState.estimatedTimeLeft > 0 && (
                          <div
                            style={{ display: "flex", alignItems: "center" }}
                          >
                            <Clock
                              style={{
                                width: "12px",
                                height: "12px",
                                marginRight: "4px",
                              }}
                            />
                            <span>
                              {formatTime(uploadState.estimatedTimeLeft)} left
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ color: "var(--tw-text-secondary)" }}>
                        {uploadState.status === "compressing"
                          ? `${uploadState.compressionProgress || 0}% compressed`
                          : `${uploadState.progress}% complete`}
                      </span>
                      <Loader2
                        style={{
                          width: "16px",
                          height: "16px",
                          color: "var(--tw-primary)",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                    </div>
                    <div className="tw-progress">
                      <div
                        className="tw-progress-inner"
                        style={{
                          width: `${
                            uploadState.status === "compressing"
                              ? uploadState.compressionProgress || 0
                              : uploadState.progress
                          }%`,
                          background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {uploadState.status === "completed" && uploadState.file && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div
            className="tw-thankyou-icon"
            style={{
              background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2
              style={{ width: "32px", height: "32px", color: "white" }}
            />
          </div>

          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--tw-text-primary)",
              marginBottom: "8px",
            }}
          >
            File uploaded successfully!
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--tw-text-secondary)",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontWeight: "500" }}>{uploadState.file.name}</span>{" "}
            is ready for submission.
          </p>
        </div>
      )}

      {uploadState.status === "error" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "rgba(239, 68, 68, 0.1)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <AlertCircle
              style={{ width: "32px", height: "32px", color: "#ef4444" }}
            />
          </div>

          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "var(--tw-text-primary)",
              marginBottom: "8px",
            }}
          >
            Upload failed
          </h3>
          <p
            style={{ fontSize: "14px", color: "#ef4444", marginBottom: "24px" }}
          >
            {uploadState.error}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              onClick={resetUpload}
              className="tw-btn primary"
              style={{
                background: `linear-gradient(135deg, ${config.primaryColor}, ${config.secondaryColor})`,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
