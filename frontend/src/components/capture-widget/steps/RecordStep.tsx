// src/components/capture-widget/steps/RecordStep.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import BrowserCompatibilityCheck from "./BrowserCompatibilityCheck";
import { useMediaRecorder } from "../hooks/useMediaRecorder";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { TestimonialStep } from "../types";
import { formatTime } from "../utils/formatting";
import { setupAudioVisualization } from "../utils/media";
import { useThemeVariables } from "../hooks/useThemeVariables";

const RecordStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { config, mediaType, userCameraChoice } = state;
  const { getBrandBackground } = useThemeVariables();

  // Simple UI state
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);

  // Audio visualization for audio testimonials
  const [visualizerBars, setVisualizerBars] = useState<number[]>(
    Array(30).fill(10)
  );
  const visualizerRef = useRef<{
    start: () => void;
    stop: () => void;
    getAverageVolume: () => number;
  } | null>(null);

  // Countdown interval ref
  const countdownIntervalRef = useRef<number | null>(null);

  // Simple data available handler - no streaming, just collect chunks
  const handleDataAvailable = (_chunk: Blob) => {
    // Just let the media recorder collect the chunks
  };

  // Simple recording finished handler
  const handleRecordingFinished = (finalChunks: Blob[]) => {
    if (finalChunks.length === 0) {
      dispatch({
        type: "SET_ERROR",
        payload: "Recording failed to capture any media. Please try again.",
      });
      return;
    }

    const totalSize = finalChunks.reduce((size, chunk) => size + chunk.size, 0);
    if (totalSize === 0) {
      dispatch({
        type: "SET_ERROR",
        payload: "Recording produced empty media. Please try again.",
      });
      return;
    }

    // Store the recorded chunks for review
    dispatch({ type: "SET_RECORDED_CHUNKS", payload: finalChunks });

    // Move to review step after brief delay
    setTimeout(() => {
      dispatch({ type: "SET_STEP", payload: TestimonialStep.Review });
    }, 1500);
  };

  // Media recorder with improved reliability
  const {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    recordingTime,
    mediaStream,
    videoRef,
    error: recorderError,
    isInitialized: _isInitialized,
  } = useMediaRecorder(mediaType, userCameraChoice, {
    onDataAvailable: handleDataAvailable,
    onStop: handleRecordingFinished,
    chunkInterval: config.chunkInterval,
    maxDuration: config.maxDuration,
  });

  // Set up audio visualizer for audio testimonials
  useEffect(() => {
    if (mediaType === "video") return; // Only for audio testimonials

    if (mediaStream && isRecording) {
      const visualizer = setupAudioVisualization(mediaStream, (dataArray) => {
        const newBars = Array(30)
          .fill(0)
          .map((_, i) => {
            const index = Math.floor(i * (dataArray.length / 30));
            const height = (dataArray[index] / 255) * 100;
            return Math.max(4, height);
          });
        setVisualizerBars(newBars);
      });

      visualizerRef.current = visualizer;
      visualizer.start();

      return () => {
        visualizer.stop();
      };
    }
  }, [mediaType, mediaStream, isRecording]);



  // Start recording with countdown
  const handleStartRecording = useCallback(() => {
    setShowCountdown(true);
    setCountdownValue(3);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            window.clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setShowCountdown(false);
          startRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startRecording]);

  // Cleanup countdown interval
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current !== null) {
        window.clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Simple recording controls
  const handleEndRecording = useCallback(() => {
    // Stop recording - the media recorder will call handleRecordingFinished
    stopRecording();
  }, [stopRecording]);

  const handleQuitProcess = useCallback(() => {
    // Stop recording and close modal
    if (isRecording) {
      stopRecording();
    }

    // Close modal
    dispatch({ type: "CLOSE_MODAL" });
  }, [isRecording, stopRecording, dispatch]);

  // Determine recorder class
  const recorderClass =
    mediaType === "video"
      ? userCameraChoice === "portrait"
        ? "portrait"
        : ""
      : "audio";

  // Render error state
  if (recorderError) {
    return (
      <div className="tw-step">
        <BrowserCompatibilityCheck />
        <div className="tw-error-message">
          <div className="tw-error-icon">
            <Icon name="wifiOff" />
          </div>
          <h3>Recording Error</h3>
          <p>{recorderError}</p>
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

  return (
    <div className="tw-step">
      <BrowserCompatibilityCheck />

      {/* Progress indicator */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span className="tw-label" style={{ fontSize: "14px" }}>
            {isRecording ? "Recording in progress..." : "Ready to record"}
          </span>
          {recordingTime > 0 && (
            <span className="tw-label" style={{ fontSize: "14px" }}>
              {formatTime(recordingTime)}
            </span>
          )}
        </div>
      </div>

      <div className={`tw-recorder ${recorderClass}`}>
        {/* Video preview */}
        {mediaType === "video" && (
          <video
            ref={videoRef}
            className="tw-video-preview"
            autoPlay
            muted
            playsInline
          />
        )}

        {/* Recording status overlay */}
        <div className="tw-recorder-overlay">
          <div className="tw-question">Share your testimonial</div>
          <div className={`tw-recorder-hint ${isRecording ? "active" : ""}`}>
            {isRecording
              ? "Recording... Click 'Stop' when finished"
              : "Click 'Start Recording' to begin sharing your experience"}
          </div>
        </div>

        {/* Audio visualizer */}
        {mediaType === "audio" && (
          <div className="tw-visualizer">
            {visualizerBars.map((height, i) => (
              <div
                key={i}
                className="tw-visualizer-bar"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="tw-recording-indicator">
            <div className="tw-recording-dot" />
            <span>{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Countdown overlay */}
        {showCountdown && (
          <div className="tw-countdown">
            <div className="tw-countdown-number">{countdownValue}</div>
          </div>
        )}

      </div>

      {/* Recording controls */}
      {(
        <div
          className="tw-controls"
          style={{ flexDirection: "column", gap: "16px" }}
        >
          {!isRecording ? (
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <button
                className="tw-control-btn primary record"
                onClick={handleStartRecording}
                style={getBrandBackground()}
              >
                <Icon name="record" />
              </button>
              <Button variant="secondary" onClick={handleQuitProcess}>
                Quit
              </Button>
            </div>
          ) : (
            <>
              {/* Main recording controls */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                }}
              >
                {isPaused ? (
                  <button
                    className="tw-control-btn primary"
                    style={getBrandBackground()}
                    onClick={resumeRecording}
                    title="Resume recording"
                  >
                    <Icon name="play" />
                  </button>
                ) : (
                  <button
                    className="tw-control-btn"
                    onClick={pauseRecording}
                    title="Pause recording"
                  >
                    <Icon name="pause" />
                  </button>
                )}

                <button
                  className="tw-control-btn danger"
                  onClick={stopRecording}
                  title="Stop recording"
                >
                  <Icon name="stop" />
                </button>
              </div>

              {/* Recording completion */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="primary"
                  onClick={handleEndRecording}
                  style={{
                    fontSize: "14px",
                    padding: "8px 16px",
                    backgroundColor: "#059669",
                  }}
                >
                  Finish Recording
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleQuitProcess}
                  style={{ fontSize: "14px", padding: "8px 16px" }}
                >
                  Quit
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Recording status */}
      {config.showTranscription && (
        <div className={`tw-transcript ${isRecording ? "active" : ""}`}>
          {isRecording
            ? "Recording in progress... Your testimonial is being captured."
            : "Ready to record your testimonial"}
        </div>
      )}

      {state.error && (
        <div className="tw-error-message" style={{ marginTop: "16px" }}>
          <div className="tw-error-icon">
            <Icon name="wifiOff" />
          </div>
          <p>{state.error}</p>
        </div>
      )}

      <div className="tw-footer">
        <Button
          variant="secondary"
          leftIcon="chevronLeft"
          onClick={() =>
            dispatch({ type: "SET_STEP", payload: TestimonialStep.MediaOption })
          }
          disabled={isRecording}
        >
          Back
        </Button>
      </div>
    </div>
  );
};

export default RecordStep;
