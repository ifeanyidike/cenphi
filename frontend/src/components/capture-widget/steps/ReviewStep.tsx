// src/components/capture-widget/steps/ReviewStep.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { TestimonialStep } from "../types";
import { formatTime, generateTitleFromTranscript } from "../utils/formatting";
import {
  createMediaBlobFromChunks,
  createObjectURL,
  revokeObjectURL,
} from "../utils/media";

interface MediaState {
  url: string | null;
  blob: Blob | null;
  isLoaded: boolean;
  hasError: boolean;
  errorMessage: string;
}

const ReviewStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const {
    mediaType,
    userCameraChoice,
    recordedChunks,
    uploadedMediaFile,
    transcriptText,
    isSubmitting,
    error,
  } = state;

  // Refs
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const mediaStateRef = useRef<MediaState>({
    url: null,
    blob: null,
    isLoaded: false,
    hasError: false,
    errorMessage: "",
  });

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mediaState, setMediaState] = useState<MediaState>(
    () => mediaStateRef.current
  );
  const [title, setTitle] = useState(() =>
    transcriptText
      ? generateTitleFromTranscript(transcriptText)
      : "My Testimonial"
  );
  const [description, setDescription] = useState(transcriptText || "");

  // Stable media creation function
  const createMediaFromSource = useCallback((): MediaState => {
    console.log("🎬 Creating media from source...");

    try {
      let blob: Blob;
      let sourceType: string;

      if (recordedChunks.length > 0) {
        // Create blob from recorded chunks
        const chunkSizes = recordedChunks.map((chunk) => chunk.size);
        const totalSize = chunkSizes.reduce((sum, size) => sum + size, 0);

        console.log(
          `📊 Processing ${recordedChunks.length} chunks, total: ${totalSize} bytes`
        );

        if (totalSize === 0) {
          throw new Error("All recorded chunks have zero size");
        }

        const mimeType = mediaType === "video" ? "video/webm" : "audio/webm";
        blob = createMediaBlobFromChunks(recordedChunks, mimeType);
        sourceType = "recorded";
      } else if (uploadedMediaFile) {
        if (uploadedMediaFile.size === 0) {
          throw new Error("Uploaded file has zero size");
        }

        blob = uploadedMediaFile;
        sourceType = "uploaded";
      } else {
        throw new Error("No media source available");
      }

      console.log(
        `✅ Created ${sourceType} blob: ${blob.size} bytes, type: ${blob.type}`
      );

      if (blob.size === 0) {
        throw new Error("Created blob has zero size");
      }

      const url = createObjectURL(blob);
      console.log("🔗 Created object URL:", url);

      return {
        url,
        blob,
        isLoaded: false,
        hasError: false,
        errorMessage: "",
      };
    } catch (error) {
      console.error("❌ Error creating media:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      return {
        url: null,
        blob: null,
        isLoaded: false,
        hasError: true,
        errorMessage,
      };
    }
  }, [recordedChunks, uploadedMediaFile, mediaType]);

  // Initialize media URL once
  useEffect(() => {
    console.log("📋 ReviewStep - Initializing media...");

    const newMediaState = createMediaFromSource();
    mediaStateRef.current = newMediaState;
    setMediaState(newMediaState);

    // Cleanup function
    return () => {
      if (mediaStateRef.current.url) {
        console.log("🧹 Cleaning up media URL");
        revokeObjectURL(mediaStateRef.current.url);
      }
    };
  }, []); // Empty dependency array - run only once

  // Media event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (!mediaRef.current) return;

    try {
      const mediaDuration = mediaRef.current.duration;
      console.log("📊 Media metadata loaded, duration:", mediaDuration);

      if (isFinite(mediaDuration) && mediaDuration > 0) {
        setDuration(mediaDuration);

        // Update media state
        const updatedState = {
          ...mediaStateRef.current,
          isLoaded: true,
          hasError: false,
        };
        mediaStateRef.current = updatedState;
        setMediaState(updatedState);

        console.log("✅ Media loaded successfully");
      } else {
        console.warn("⚠️ Invalid duration, using fallback");
        setDuration(state.recordingTime || 30);
      }
    } catch (error) {
      console.error("❌ Error handling metadata:", error);
      setDuration(state.recordingTime || 30);
    }
  }, [state.recordingTime]);

  const handleTimeUpdate = useCallback(() => {
    if (!mediaRef.current) return;

    const mediaCurrentTime = mediaRef.current.currentTime;
    const mediaDuration = mediaRef.current.duration || duration;

    if (isFinite(mediaCurrentTime)) {
      setCurrentTime(mediaCurrentTime);

      // Update progress bar
      if (mediaDuration > 0 && progressRef.current) {
        const progress = Math.min(
          100,
          Math.max(0, (mediaCurrentTime / mediaDuration) * 100)
        );
        progressRef.current.style.width = `${progress}%`;
      }
    }
  }, [duration]);

  const handleCanPlay = useCallback(() => {
    console.log("✅ Media can play");

    const updatedState = {
      ...mediaStateRef.current,
      isLoaded: true,
      hasError: false,
    };
    mediaStateRef.current = updatedState;
    setMediaState(updatedState);
  }, []);

  const handleError = useCallback((event: any) => {
    console.error("❌ Media error:", event);

    const updatedState = {
      ...mediaStateRef.current,
      hasError: true,
      errorMessage: "Failed to load media. Please try again.",
    };
    mediaStateRef.current = updatedState;
    setMediaState(updatedState);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (mediaRef.current) {
      mediaRef.current.currentTime = 0;
    }
  }, []);

  // Playback controls
  const handlePlayPause = useCallback(() => {
    if (!mediaRef.current || !mediaState.isLoaded) return;

    try {
      if (isPlaying) {
        mediaRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = mediaRef.current.play();
        if (playPromise) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((error) => {
              console.error("Error playing media:", error);
              setIsPlaying(false);
            });
        } else {
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  }, [isPlaying, mediaState.isLoaded]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!mediaRef.current || !mediaState.isLoaded || duration <= 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const pos = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const newTime = pos * duration;

      try {
        mediaRef.current.currentTime = newTime;
        setCurrentTime(newTime);
      } catch (error) {
        console.error("Error seeking:", error);
      }
    },
    [mediaState.isLoaded, duration]
  );

  // Form handlers
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if (name === "title") {
        setTitle(value);
      } else if (name === "description") {
        setDescription(value);
      }
    },
    []
  );

  // Submission handler
  const handleSubmit = useCallback(async () => {
    if (!mediaState.blob) {
      dispatch({
        type: "SET_ERROR",
        payload:
          "No media available for submission. Please record or upload media first.",
      });
      return;
    }

    dispatch({
      type: "SET_AUTHOR_INFO",
      payload: {
        title: title || "My Testimonial",
        description: description || "",
      },
    });

    dispatch({ type: "SET_SUBMITTING", payload: true });

    try {
      const formData = new FormData();

      // Add media file
      const filename = `testimonial.${mediaType === "video" ? "webm" : "webm"}`;
      formData.append("file", mediaState.blob, filename);

      // Add metadata
      formData.append("campaignId", state.config.campaignId);
      formData.append("mediaType", mediaType);
      formData.append("sessionId", Date.now().toString());

      // Add author info
      const authorData = {
        name: state.authorInfo.name,
        email: state.authorInfo.email,
        company: state.authorInfo.company,
        position: state.authorInfo.position,
        consentGiven: state.authorInfo.consent,
        title: title || "My Testimonial",
        description: description || "",
        transcript: transcriptText,
      };

      formData.append("authorInfo", JSON.stringify(authorData));

      // Add profile image if available
      if (state.uploadedImageFile) {
        formData.append("profileImage", state.uploadedImageFile);
      }

      // Submit testimonial
      const response = await fetch(
        `${state.config.apiBaseUrl}/api/testimonials`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      console.log("✅ Testimonial submitted successfully");

      dispatch({ type: "SET_SUBMITTING", payload: false });
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "SET_STEP", payload: TestimonialStep.ThankYou });
    } catch (err) {
      console.error("❌ Error submitting testimonial:", err);
      dispatch({ type: "SET_SUBMITTING", payload: false });
      dispatch({
        type: "SET_ERROR",
        payload:
          err instanceof Error
            ? err.message
            : "Failed to submit testimonial. Please try again.",
      });
    }
  }, [
    mediaState.blob,
    title,
    description,
    transcriptText,
    mediaType,
    state,
    dispatch,
  ]);

  const isVideo = mediaType === "video";

  // Render error state
  if (mediaState.hasError) {
    return (
      <div className="tw-step">
        <div className="tw-error-message">
          <div className="tw-error-icon">
            <Icon name="wifiOff" />
          </div>
          <h3>Media Error</h3>
          <p>{mediaState.errorMessage}</p>
          <Button
            variant="secondary"
            onClick={() =>
              dispatch({
                type: "SET_STEP",
                payload: TestimonialStep.MediaOption,
              })
            }
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (!mediaState.url) {
    return (
      <div className="tw-step">
        <div className="tw-loading-state">
          <div className="tw-loading-spinner"></div>
          <div className="tw-loading-text">Preparing media...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-step">
      <h3
        className="tw-label"
        style={{ fontSize: "19px", marginBottom: "20px", fontWeight: 600 }}
      >
        Review your {isVideo ? "video" : "audio"}
      </h3>

      <div className="tw-player">
        {isVideo ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            className={`tw-player-video ${userCameraChoice === "portrait" ? "portrait" : ""}`}
            src={mediaState.url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onError={handleError}
            onEnded={handleEnded}
            preload="metadata"
            playsInline
          />
        ) : (
          <div className="tw-player-audio">
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={mediaState.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onError={handleError}
              onEnded={handleEnded}
              preload="metadata"
            />
          </div>
        )}

        {!mediaState.isLoaded && (
          <div className="tw-player-loading">
            <div className="tw-player-loading-spinner"></div>
            <div className="tw-player-loading-text">Loading media...</div>
          </div>
        )}

        <div className="tw-player-controls">
          <Button
            className="tw-control-btn"
            onClick={handlePlayPause}
            disabled={!mediaState.isLoaded}
          >
            <Icon name={isPlaying ? "pause" : "play"} />
          </Button>

          <div className="tw-progress" onClick={handleProgressClick}>
            <div
              className="tw-progress-inner"
              ref={progressRef}
              style={{ width: "0%" }}
            />
          </div>

          <div className="tw-player-time">
            {duration > 0
              ? `${formatTime(Math.floor(currentTime))} / ${formatTime(Math.floor(duration))}`
              : "0:00 / 0:00"}
          </div>
        </div>
      </div>

      <div className="tw-form-group" style={{ marginTop: "25px" }}>
        <label className="tw-label" htmlFor="tw-testimonial-title">
          Title
        </label>
        <input
          className="tw-input"
          type="text"
          id="tw-testimonial-title"
          name="title"
          placeholder="Give your testimonial a title"
          value={title}
          onChange={handleInputChange}
        />
      </div>

      <div className="tw-form-group">
        <label className="tw-label" htmlFor="tw-testimonial-description">
          Description (Optional)
        </label>
        <textarea
          className="tw-textarea"
          id="tw-testimonial-description"
          name="description"
          placeholder="Add any additional context or details about your testimonial"
          value={description}
          onChange={handleInputChange}
        />
      </div>

      {error && (
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
          {error}
        </div>
      )}

      <div className="tw-footer">
        <Button
          variant="secondary"
          leftIcon="chevronLeft"
          onClick={() =>
            dispatch({
              type: "SET_STEP",
              payload:
                recordedChunks.length > 0
                  ? TestimonialStep.Record
                  : TestimonialStep.MediaOption,
            })
          }
          disabled={isSubmitting}
        >
          Back
        </Button>

        <Button
          variant="primary"
          leftIcon="check"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          disabled={!mediaState.blob}
        >
          Submit
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
