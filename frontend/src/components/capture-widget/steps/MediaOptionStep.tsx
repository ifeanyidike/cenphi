// src/components/capture-widget/steps/MediaOptionStep.tsx
import React, { useState, useRef } from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { TestimonialStep, CameraOrientation } from "../types";
import { createObjectURL } from "../utils/media";
import { useThemeVariables } from "../hooks/useThemeVariables";

type OptionTab = "record" | "upload";

const MediaOptionStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { mediaType, userCameraChoice, uploadedMediaFile } = state;
  const { getBrandBackground } = useThemeVariables();

  // State for active tab
  const [activeTab, setActiveTab] = useState<OptionTab>("record");

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state
  const [mediaUrl, setMediaUrl] = useState<string | null>(
    uploadedMediaFile ? createObjectURL(uploadedMediaFile) : null
  );

  const isVideo = mediaType === "video";

  const handleCameraOrientationChange = (orientation: CameraOrientation) => {
    dispatch({ type: "SET_CAMERA_CHOICE", payload: orientation });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (isVideo && !file.type.startsWith("video/")) {
        dispatch({
          type: "SET_ERROR",
          payload: "Please select a valid video file",
        });
        return;
      } else if (!isVideo && !file.type.startsWith("audio/")) {
        dispatch({
          type: "SET_ERROR",
          payload: "Please select a valid audio file",
        });
        return;
      }

      dispatch({ type: "SET_UPLOADED_MEDIA", payload: file });

      // Create object URL for preview
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
      setMediaUrl(createObjectURL(file));
    }
  };

  const handleRemoveMedia = () => {
    dispatch({ type: "SET_UPLOADED_MEDIA", payload: null });
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
      setMediaUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleStartRecording = () => {
    dispatch({ type: "SET_STEP", payload: TestimonialStep.Record });
  };

  const handleNextWithUpload = () => {
    if (uploadedMediaFile) {
      dispatch({ type: "SET_STEP", payload: TestimonialStep.Review });
    }
  };

  // Generate segment highlight style
  const getSegmentHighlightStyle = () => {
    return {
      ...getBrandBackground(),
      width: "50%",
      left: activeTab === "record" ? "0%" : "50%",
    };
  };

  return (
    <div className="tw-step">
      <h3
        className="tw-label"
        style={{ fontSize: "19px", marginBottom: "20px", fontWeight: 600 }}
      >
        {isVideo ? "Video" : "Audio"} Testimonial
      </h3>

      <div className="tw-segmented-control">
        <div
          className={`tw-segment ${activeTab === "record" ? "active" : ""}`}
          onClick={() => setActiveTab("record")}
        >
          Record
        </div>
        <div
          className={`tw-segment ${activeTab === "upload" ? "active" : ""}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload
        </div>
        <div
          className="tw-segment-highlight"
          style={getSegmentHighlightStyle()}
        ></div>
      </div>

      {activeTab === "record" ? (
        <div id="tw-record-option" className="tw-fade-in">
          <p
            style={{ marginBottom: "20px", color: "var(--tw-text-secondary)" }}
          >
            Use your {isVideo ? "camera" : "microphone"} to record a{" "}
            {isVideo ? "video" : "audio"} testimonial. We recommend keeping it
            between 30-60 seconds.
          </p>

          {isVideo && (
            <div className="tw-orientation-selector">
              <div
                className={`tw-orientation-option ${userCameraChoice === "portrait" ? "active" : ""}`}
                onClick={() => handleCameraOrientationChange("portrait")}
              >
                <div className="tw-orientation-icon">
                  <Icon name="portraitPhone" />
                </div>
                <div className="tw-orientation-label">Portrait</div>
              </div>
              <div
                className={`tw-orientation-option ${userCameraChoice === "landscape" ? "active" : ""}`}
                onClick={() => handleCameraOrientationChange("landscape")}
              >
                <div className="tw-orientation-icon">
                  <Icon name="landscapePhone" />
                </div>
                <div className="tw-orientation-label">Landscape</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button
              variant="primary"
              leftIcon={isVideo ? "camera" : "mic"}
              onClick={handleStartRecording}
            >
              Start Recording
            </Button>
          </div>
        </div>
      ) : (
        <div id="tw-upload-option" className="tw-fade-in">
          <div
            className="tw-upload-container"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="tw-upload-icon">
              <Icon name={isVideo ? "fileVideo" : "fileAudio"} />
            </div>
            <div className="tw-upload-title">
              Upload {isVideo ? "Video" : "Audio"} File
            </div>
            <div className="tw-upload-hint">
              Drop your file here or click to browse
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="tw-upload-input"
              accept={isVideo ? "video/*" : "audio/*"}
              onChange={handleFileChange}
            />
          </div>

          {mediaUrl && (
            <div className="tw-player" style={{ marginTop: "20px" }}>
              {isVideo ? (
                <video
                  className={`tw-player-video ${userCameraChoice === "portrait" ? "portrait" : ""}`}
                  src={mediaUrl}
                  controls
                ></video>
              ) : (
                <div className="tw-player-audio">
                  <audio
                    style={{ width: "100%" }}
                    src={mediaUrl}
                    controls
                  ></audio>
                </div>
              )}

              <div className="tw-player-controls">
                <div
                  className="tw-uploaded-action"
                  onClick={handleRemoveMedia}
                  style={{ backgroundColor: "#E11D48" }}
                >
                  <Icon name="trash" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {state.error && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            backgroundColor: "rgba(220, 38, 38, 0.1)",
            color: "#DC2626",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {state.error}
        </div>
      )}

      <div className="tw-footer">
        <Button
          variant="secondary"
          leftIcon="chevronLeft"
          onClick={() =>
            dispatch({ type: "SET_STEP", payload: TestimonialStep.Method })
          }
        >
          Back
        </Button>

        {activeTab === "upload" && uploadedMediaFile && (
          <Button
            variant="primary"
            rightIcon="chevronRight"
            onClick={handleNextWithUpload}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default MediaOptionStep;
