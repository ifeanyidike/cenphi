// SimpleCaptureModal.tsx - Simplified modal for video and text testimonials
import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Video,
  MessageSquare,
  ArrowLeft,
  Upload,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Send,
} from "lucide-react";
import {
  TestimonialWidgetConfig,
  MediaType,
  AuthorInfo,
  RecordingStatus,
} from "./types";
import SimpleVideoUpload from "./SimpleVideoUpload";

interface SimpleCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: Partial<TestimonialWidgetConfig>;
}

interface RecordingState {
  status: RecordingStatus;
  duration: number;
  blob: Blob | null;
}

const SimpleCaptureModal: React.FC<SimpleCaptureModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [currentView, setCurrentView] = useState<
    "selection" | "video" | "upload" | "text" | "author" | "success"
  >("selection");
  const [selectedMode, setSelectedMode] = useState<MediaType | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>({
    status: "idle",
    duration: 0,
    blob: null,
  });
  const [textContent, setTextContent] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [authorInfo, setAuthorInfo] = useState<AuthorInfo>({
    name: "",
    email: "",
    company: "",
    position: "",
    consent: false,
  });
  const [uploadProgress, setUploadProgress] = useState(0);

  // Video recording refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Colors from config
  const primaryColor = config.primaryColor || "#4F46E5";
  const secondaryColor = config.secondaryColor || "#8B5CF6";
  const companyName = config.companyName || "Our Company";
  const maxDuration = config.maxDuration || 120;

  // Initialize camera when video mode is selected
  useEffect(() => {
    if (currentView === "video") {
      initializeCamera();
    } else {
      cleanup();
    }

    return cleanup;
  }, [currentView]);

  const initializeCamera = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 720 },
          height: { ideal: 1280 }, // Portrait orientation
          frameRate: { ideal: 30 },
          facingMode: "user",
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
    } catch (error) {
      console.error("Failed to access camera:", error);
      setRecordingState((prev) => ({
        ...prev,
        status: "error",
      }));
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm",
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setRecordingState((prev) => ({
          ...prev,
          blob,
          status: "stopped",
        }));
      };

      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;

      setRecordingState((prev) => ({
        ...prev,
        status: "recording",
        duration: 0,
      }));

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
    } catch (error) {
      console.error("Failed to start recording:", error);
      setRecordingState((prev) => ({ ...prev, status: "error" }));
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
  };

  const resetRecording = () => {
    setRecordingState({
      status: "idle",
      duration: 0,
      blob: null,
    });
    setUploadProgress(0);
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
  };

  const handleModeSelect = (mode: MediaType) => {
    setSelectedMode(mode);
    setCurrentView(mode);
  };

  const handleBack = () => {
    if (currentView === "author") {
      setCurrentView(
        selectedMode === "video" && uploadedFile ? "upload" : selectedMode!
      );
    } else if (
      currentView === "video" ||
      currentView === "upload" ||
      currentView === "text"
    ) {
      setCurrentView("selection");
    }
  };

  const handleContinue = () => {
    if (currentView === "video" && recordingState.blob) {
      setCurrentView("author");
    } else if (currentView === "upload" && uploadedFile) {
      setCurrentView("author");
    } else if (currentView === "text" && textContent.trim()) {
      setCurrentView("author");
    }
  };

  const handleUploadComplete = (file: File) => {
    setUploadedFile(file);
  };

  const handleUploadError = (error: string) => {
    console.error("Upload error:", error);
  };

  const handleSubmit = async () => {
    if (!authorInfo.name || !authorInfo.email || !authorInfo.consent) {
      return;
    }

    setRecordingState((prev) => ({ ...prev, status: "uploading" }));
    setUploadProgress(0);

    try {
      const formData = new FormData();

      if (selectedMode === "video" && recordingState.blob) {
        formData.append(
          "video",
          recordingState.blob,
          `testimonial_${Date.now()}.webm`
        );
        formData.append("video_method", "recorded");
      } else if (selectedMode === "video" && uploadedFile) {
        formData.append("video", uploadedFile);
        formData.append("video_method", "uploaded");
      } else if (selectedMode === "text") {
        formData.append("text_content", textContent);
      }

      formData.append("author_name", authorInfo.name);
      formData.append("author_email", authorInfo.email);
      formData.append("author_company", authorInfo.company);
      formData.append("author_position", authorInfo.position);
      formData.append("campaign_id", config.campaignId || "");

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUploadProgress(100);
      setRecordingState((prev) => ({ ...prev, status: "completed" }));
      setCurrentView("success");

      clearInterval(uploadInterval);
    } catch (error) {
      console.error("Upload failed:", error);
      setRecordingState((prev) => ({ ...prev, status: "error" }));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const resetModal = () => {
    setCurrentView("selection");
    setSelectedMode(null);
    setTextContent("");
    setUploadedFile(null);
    setAuthorInfo({
      name: "",
      email: "",
      company: "",
      position: "",
      consent: false,
    });
    resetRecording();
    cleanup();
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Header */}
      <div
        className="tw-header"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }}
      >
        <div className="tw-header-content">
          {currentView !== "selection" && currentView !== "success" && (
            <button
              onClick={handleBack}
              className="tw-close"
              style={{ marginRight: "10px" }}
            >
              <ArrowLeft style={{ width: "16px", height: "16px" }} />
            </button>
          )}
          <div
            className="tw-logo"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              color: "white",
            }}
          >
            <MessageSquare style={{ width: "20px", height: "20px" }} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                color: "white",
                fontSize: "18px",
                fontWeight: 600,
              }}
            >
              Share Your Experience
            </h2>
            <p
              style={{
                margin: 0,
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "14px",
              }}
            >
              Help others learn about {companyName}
            </p>
          </div>
        </div>
        <button onClick={handleClose} className="tw-close">
          <X style={{ width: "16px", height: "16px" }} />
        </button>
      </div>

      {/* Content */}
      <div className="tw-content">
        <div className="tw-step">
          {/* Mode Selection */}
          {currentView === "selection" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "30px" }}>
                <h3 className="tw-question">How would you like to share?</h3>
                <p className="tw-method-desc" style={{ marginTop: "10px" }}>
                  {config.question ||
                    "What has your experience been like with our product?"}
                </p>
              </div>

              <div className="tw-methods">
                {/* Record Video Option */}
                <div
                  className="tw-method"
                  onClick={() => handleModeSelect("video")}
                >
                  <div
                    className="tw-method-icon"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <Video
                      style={{ width: "24px", height: "24px", color: "white" }}
                    />
                  </div>
                  <h4 className="tw-method-title">Record Video</h4>
                  <p className="tw-method-desc">
                    Record directly using your camera
                  </p>
                </div>

                {/* Upload Video Option */}
                <div
                  className="tw-method"
                  onClick={() => {
                    setSelectedMode("video");
                    setCurrentView("upload");
                  }}
                >
                  <div
                    className="tw-method-icon"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <Upload
                      style={{ width: "24px", height: "24px", color: "white" }}
                    />
                  </div>
                  <h4 className="tw-method-title">Upload Video</h4>
                  <p className="tw-method-desc">
                    Upload a video file from your device
                  </p>
                </div>

                {/* Text Option */}
                <div
                  className="tw-method"
                  onClick={() => handleModeSelect("text")}
                >
                  <div
                    className="tw-method-icon"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <MessageSquare
                      style={{ width: "24px", height: "24px", color: "white" }}
                    />
                  </div>
                  <h4 className="tw-method-title">Write Text</h4>
                  <p className="tw-method-desc">
                    Share your experience in writing
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Video Recording */}
          {currentView === "video" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h3 className="tw-question">Record Your Video</h3>
                <p className="tw-method-desc">
                  Up to {Math.floor(maxDuration / 60)} minutes • Portrait
                  orientation recommended
                </p>
              </div>

              {/* Video Preview */}
              <div
                className="tw-recorder portrait"
                style={{ marginBottom: "20px" }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="tw-video-preview"
                />

                {/* Recording Indicator */}
                {recordingState.status === "recording" && (
                  <div className="tw-recording-indicator">
                    <div className="tw-recording-dot"></div>
                    <span>REC</span>
                  </div>
                )}

                {/* Duration Display */}
                <div
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                  }}
                >
                  {formatTime(recordingState.duration)} /{" "}
                  {formatTime(maxDuration)}
                </div>

                {/* Upload Progress */}
                {recordingState.status === "uploading" && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                      color: "white",
                    }}
                  >
                    <div
                      className="tw-spinner"
                      style={{ marginBottom: "10px" }}
                    ></div>
                    <p style={{ fontSize: "14px" }}>
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="tw-controls">
                {recordingState.status === "idle" && (
                  <button
                    onClick={startRecording}
                    className="tw-control-btn primary record"
                  >
                    <Video style={{ width: "24px", height: "24px" }} />
                  </button>
                )}

                {recordingState.status === "recording" && (
                  <button
                    onClick={stopRecording}
                    className="tw-control-btn danger"
                  >
                    <Square style={{ width: "24px", height: "24px" }} />
                  </button>
                )}

                {recordingState.status === "stopped" && (
                  <div
                    style={{
                      display: "flex",
                      gap: "15px",
                      justifyContent: "center",
                    }}
                  >
                    <button
                      onClick={resetRecording}
                      className="tw-btn secondary"
                    >
                      <RotateCcw
                        style={{
                          width: "16px",
                          height: "16px",
                          marginRight: "8px",
                        }}
                      />
                      Re-record
                    </button>
                    <button
                      onClick={handleContinue}
                      className="tw-btn primary"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>

              {recordingState.status === "error" && (
                <div className="tw-error-message">
                  <div className="tw-error-icon">
                    <AlertCircle style={{ width: "20px", height: "20px" }} />
                  </div>
                  <p>Failed to access camera. Please check permissions.</p>
                </div>
              )}
            </div>
          )}

          {/* Video Upload */}
          {currentView === "upload" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h3 className="tw-question">Upload Your Video</h3>
                <p className="tw-method-desc">
                  Select a video file from your device to share your testimonial
                </p>
              </div>

              <SimpleVideoUpload
                onUploadComplete={handleUploadComplete}
                onError={handleUploadError}
                config={{
                  primaryColor,
                  secondaryColor,
                }}
              />

              {uploadedFile && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px",
                  }}
                >
                  <button
                    onClick={handleContinue}
                    className="tw-btn primary"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Text Input */}
          {currentView === "text" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h3 className="tw-question">Write Your Testimonial</h3>
                <p className="tw-method-desc">
                  Share your experience in your own words
                </p>
              </div>

              <div className="tw-form-group">
                <label className="tw-label">Your testimonial</label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={
                    config.question ||
                    "What has your experience been like with our product?"
                  }
                  className="tw-textarea"
                  maxLength={1000}
                  style={{ minHeight: "120px" }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "8px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--tw-text-secondary)",
                    }}
                  >
                    Share your honest experience and feedback
                  </p>
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--tw-text-tertiary)",
                    }}
                  >
                    {textContent.length}/1000
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={handleContinue}
                  disabled={!textContent.trim()}
                  className="tw-btn primary"
                  style={{
                    background: textContent.trim()
                      ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                      : "var(--tw-text-tertiary)",
                    opacity: textContent.trim() ? 1 : 0.5,
                    cursor: textContent.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Author Information */}
          {currentView === "author" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h3 className="tw-question">About You</h3>
                <p className="tw-method-desc">
                  Help others understand your background and perspective
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div className="tw-form-group">
                  <label className="tw-label">Full Name *</label>
                  <input
                    type="text"
                    value={authorInfo.name}
                    onChange={(e) =>
                      setAuthorInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="tw-input"
                  />
                </div>
                <div className="tw-form-group">
                  <label className="tw-label">Email *</label>
                  <input
                    type="email"
                    value={authorInfo.email}
                    onChange={(e) =>
                      setAuthorInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="tw-input"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  marginBottom: "20px",
                }}
              >
                <div className="tw-form-group">
                  <label className="tw-label">Company</label>
                  <input
                    type="text"
                    value={authorInfo.company}
                    onChange={(e) =>
                      setAuthorInfo((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    className="tw-input"
                  />
                </div>
                <div className="tw-form-group">
                  <label className="tw-label">Job Title</label>
                  <input
                    type="text"
                    value={authorInfo.position}
                    onChange={(e) =>
                      setAuthorInfo((prev) => ({
                        ...prev,
                        position: e.target.value,
                      }))
                    }
                    className="tw-input"
                  />
                </div>
              </div>

              <div
                className="tw-checkbox-container"
                style={{ marginBottom: "20px" }}
              >
                <input
                  type="checkbox"
                  id="consent"
                  checked={authorInfo.consent}
                  onChange={(e) =>
                    setAuthorInfo((prev) => ({
                      ...prev,
                      consent: e.target.checked,
                    }))
                  }
                  className="tw-checkbox"
                />
                <label htmlFor="consent" className="tw-checkbox-label">
                  I consent to {companyName} using this testimonial for
                  marketing purposes
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  onClick={handleSubmit}
                  disabled={
                    !authorInfo.name ||
                    !authorInfo.email ||
                    !authorInfo.consent ||
                    recordingState.status === "uploading"
                  }
                  className="tw-btn primary"
                  style={{
                    background:
                      authorInfo.name && authorInfo.email && authorInfo.consent
                        ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                        : "var(--tw-text-tertiary)",
                    opacity:
                      authorInfo.name && authorInfo.email && authorInfo.consent
                        ? 1
                        : 0.5,
                    cursor:
                      authorInfo.name && authorInfo.email && authorInfo.consent
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  {recordingState.status === "uploading" ? (
                    <>
                      <div
                        className="tw-spinner"
                        style={{
                          width: "16px",
                          height: "16px",
                          marginRight: "8px",
                        }}
                      ></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send
                        style={{
                          width: "16px",
                          height: "16px",
                          marginRight: "8px",
                        }}
                      />
                      Submit Testimonial
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {currentView === "success" && (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div
                className="tw-thankyou-icon"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <CheckCircle2
                  style={{ width: "40px", height: "40px", color: "white" }}
                />
              </div>

              <h3 className="tw-question">Thank you for sharing!</h3>
              <p className="tw-method-desc" style={{ marginBottom: "32px" }}>
                Your testimonial has been submitted successfully. It helps
                others learn about their potential experience with {companyName}
                .
              </p>

              <button
                onClick={handleClose}
                className="tw-btn primary"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SimpleCaptureModal;
