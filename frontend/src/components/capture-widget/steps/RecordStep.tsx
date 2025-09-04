// src/components/capture-widget/steps/RecordStep.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTestimonial } from "../contexts/TestimonialContext";
import BrowserCompatibilityCheck from "./BrowserCompatibilityCheck";
import { useWebSocket } from "../hooks/useWebSocket";
import { useMediaRecorder } from "../hooks/useMediaRecorder";
import Button from "../ui/Button";
import Icon from "../ui/Icon";
import { TestimonialStep, ConnectionStatus } from "../types";
import { formatTime, generateSessionId } from "../utils/formatting";
// import { setupAudioVisualization } from "../utils/media";
import { useThemeVariables } from "../hooks/useThemeVariables";

interface SessionState {
  currentQuestion: string;
  questionIndex: number;
  totalQuestions: number;
  isInterviewComplete: boolean;
  recordingStartTime: number | null;
  allResponses: string[];
}

const RecordStep: React.FC = () => {
  const { state, dispatch } = useTestimonial();
  const { config, mediaType, userCameraChoice, transcriptText } = state;
  const { getBrandBackground } = useThemeVariables();

  // Session management
  const [sessionId] = useState(() => generateSessionId());
  const [sessionState, setSessionState] = useState<SessionState>({
    currentQuestion:
      "What problem were you trying to solve before using our solution?",
    questionIndex: 0,
    totalQuestions: 3,
    isInterviewComplete: false,
    recordingStartTime: null,
    allResponses: [],
  });

  // UI state
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  // Audio visualization
  // Audio visualizer state removed
  const visualizerRef = useRef<{
    start: () => void;
    stop: () => void;
    getAverageVolume: () => number;
  } | null>(null);

  // Refs for stable references
  const sessionStateRef = useRef<SessionState>(sessionState);
  const isConnectedRef = useRef<boolean>(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // Update ref when state changes
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (data: any) => {
      console.log("📨 Received WebSocket message:", data.type, data);

      switch (data.type) {
        case "welcome":
          console.log("✅ Connected to interview session");
          if (data.data?.question) {
            setSessionState((prev) => ({
              ...prev,
              currentQuestion: data.data.question,
              questionIndex: 0,
            }));
          }
          if (data.data?.session) {
            const session = data.data.session;
            setSessionState((prev) => ({
              ...prev,
              totalQuestions: session.max_questions || 3,
            }));
          }
          break;

        case "transcript":
          console.log("📝 Transcript update:", data.data?.text);
          if (data.data?.text) {
            dispatch({ type: "SET_TRANSCRIPT", payload: data.data.text });
          }
          break;

        case "next_question":
          console.log("❓ Next question:", data.data?.question);
          if (data.data?.question) {
            // Save current response before moving to next question
            setSessionState((prev) => ({
              ...prev,
              currentQuestion: data.data.question,
              questionIndex: prev.questionIndex + 1,
              allResponses: [...prev.allResponses, transcriptText || ""],
            }));
            // Reset transcript for new question but keep recording going
            dispatch({ type: "SET_TRANSCRIPT", payload: "" });
          }
          break;

        case "interview_complete":
          console.log("✅ Interview completed");
          setSessionState((prev) => ({
            ...prev,
            isInterviewComplete: true,
          }));
          // Transition to review step
          setTimeout(() => {
            dispatch({ type: "SET_STEP", payload: TestimonialStep.Review });
          }, 1000);
          break;

        case "hint":
          if (data.data?.text && config.showAIHints) {
            setAiHint(data.data.text);
            setTimeout(() => setAiHint(null), 5000);
          }
          break;

        case "error":
          console.error("❌ WebSocket error:", data.data?.message);
          break;

        // Ignore internal messages like pong
        case "pong":
          // This is handled internally by the WebSocket hook
          break;

        default:
          console.log("⚠️ Unknown message type:", data.type);
      }
    },
    [config.showAIHints, dispatch]
  );

  // WebSocket connection
  const wsClient = useWebSocket(config.websocketBaseUrl, {
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log("🔌 WebSocket connected to interview session");
      setConnectionStatus("connected");
      isConnectedRef.current = true;
    },
    onDisconnect: () => {
      console.log("🔌 WebSocket disconnected from interview session");
      setConnectionStatus("disconnected");
      isConnectedRef.current = false;
    },
    onError: (error) => {
      console.error("🔌 WebSocket connection error:", error);
      setConnectionStatus("disconnected");
    },
    heartbeatInterval: 30000, // 30 seconds between pings
  });

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

  } = useMediaRecorder(mediaType, userCameraChoice, {
    onDataAvailable: handleDataAvailable,
    onStop: handleRecordingFinished,
    chunkInterval: config.chunkInterval,
    maxDuration: config.maxDuration,
  });

  // Initialize WebSocket connection
  useEffect(() => {
    if (sessionId && config.campaignId) {
      const path = `/ws/interview/${config.campaignId}?session=${sessionId}`;
      console.log("🔌 Connecting to WebSocket:", path);
      wsClient.connect(path);
    }

    return () => {
      wsClient.disconnect();
      if (visualizerRef.current) {
        visualizerRef.current.stop();
      }
    };
  }, [sessionId, config.campaignId]);

  // Send author info when connected
  useEffect(() => {
    if (connectionStatus === "connected" && !isConnectedRef.current) {
      isConnectedRef.current = true;

      const clientInfo = {
        type: "client_info",
        sessionId: sessionId,
        data: {
          authorInfo: {
            name: state.authorInfo.name || "",
            email: state.authorInfo.email || "",
            company: state.authorInfo.company || "",
            position: state.authorInfo.position || "",
          },
          campaignId: config.campaignId,
          mediaType: mediaType,
        },
        timestamp: Date.now(),
      };

      console.log("📤 Sending client info:", clientInfo);
      wsClient.send(clientInfo);
    }
  }, [
    connectionStatus,
    sessionId,
    state.authorInfo,
    config.campaignId,
    mediaType,
    wsClient,
  ]);

  // Audio visualizer removed (audio mode not supported)
  useEffect(() => {}, [mediaType, mediaStream, isRecording]);

  // Data available handler
  function handleDataAvailable(chunk: Blob) {
    // Send chunk to WebSocket for real-time processing
    if (isConnectedRef.current && chunk.size > 0) {
      sendMediaChunkToWebSocket(chunk, false);
    }
  }

  // Recording finished handler
  function handleRecordingFinished(finalChunks: Blob[]) {
    console.log("🎬 Recording finished with", finalChunks.length, "chunks");

    if (finalChunks.length === 0) {
      console.error("❌ No chunks received!");
      dispatch({
        type: "SET_ERROR",
        payload: "Recording failed to capture any media. Please try again.",
      });
      return;
    }

    const totalSize = finalChunks.reduce((size, chunk) => size + chunk.size, 0);
    console.log(`📊 Total recorded data: ${totalSize} bytes`);

    if (totalSize === 0) {
      console.error("❌ All chunks have zero size!");
      dispatch({
        type: "SET_ERROR",
        payload: "Recording failed to capture media data. Please try again.",
      });
      return;
    }

    // Set chunks in state
    dispatch({ type: "SET_RECORDED_CHUNKS", payload: finalChunks });

    // Send final chunk with completion flag
    if (isConnectedRef.current && finalChunks.length > 0) {
      const lastChunk = finalChunks[finalChunks.length - 1];
      sendMediaChunkToWebSocket(lastChunk, true);
    }

    // Stop audio visualizer
    if (visualizerRef.current) {
      visualizerRef.current.stop();
    }
  }

  // Send media chunk to WebSocket
  async function sendMediaChunkToWebSocket(chunk: Blob, isLastChunk: boolean) {
    try {
      const reader = new FileReader();
      reader.onloadend = function () {
        const base64data = (reader.result as string).split(",")[1];

        const message = {
          type: "media_chunk",
          sessionId: sessionId,
          data: {
            data: base64data,
            mediaType: mediaType,
            isLastChunk: isLastChunk,
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
        };

        wsClient.send(message);
      };
      reader.readAsDataURL(chunk);
    } catch (err) {
      console.error("❌ Error sending media chunk:", err);
    }
  }

  // Start recording with countdown
  const handleStartRecording = useCallback(() => {
    console.log("🎬 Starting recording process...");

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
          // Mark recording start time
          setSessionState((prevState) => ({
            ...prevState,
            recordingStartTime: Date.now(),
          }));
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

  // Question navigation
  const handleNextQuestion = useCallback(() => {
    if (isConnectedRef.current) {
      // Send current response and request next question
      wsClient.send({
        type: "recording_complete",
        sessionId: sessionId,
        data: {
          duration: recordingTime,
          transcript: transcriptText,
          skipped: false,
        },
        timestamp: Date.now(),
      });
    }
  }, [sessionId, recordingTime, transcriptText, wsClient]);

  const handleSkipQuestion = useCallback(() => {
    if (isConnectedRef.current) {
      // Skip current question
      wsClient.send({
        type: "recording_complete",
        sessionId: sessionId,
        data: {
          duration: 0,
          transcript: "",
          skipped: true,
        },
        timestamp: Date.now(),
      });
    }
  }, [sessionId, wsClient]);

  const handleEndRecording = useCallback(() => {
    // Stop recording and go to review
    stopRecording();

    // Send completion message
    if (isConnectedRef.current) {
      wsClient.send({
        type: "interview_complete",
        sessionId: sessionId,
        data: {
          early_completion: true,
          final_transcript: transcriptText,
        },
        timestamp: Date.now(),
      });
    }

    // Go to review step after a short delay
    setTimeout(() => {
      dispatch({ type: "SET_STEP", payload: TestimonialStep.Review });
    }, 500);
  }, [stopRecording, sessionId, transcriptText, wsClient, dispatch]);

  const handleQuitProcess = useCallback(() => {
    // Stop recording and close modal
    if (isRecording) {
      stopRecording();
    }

    // Disconnect WebSocket
    wsClient.disconnect();

    // Close modal
    dispatch({ type: "CLOSE_MODAL" });
  }, [isRecording, stopRecording, wsClient, dispatch]);

  // Get progress
  const progress =
    sessionState.totalQuestions > 0
      ? (sessionState.questionIndex / sessionState.totalQuestions) * 100
      : 0;

  // Determine recorder class
  const recorderClass = mediaType === "video" && userCameraChoice === "portrait" ? "portrait" : "";

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
            Question {sessionState.questionIndex + 1} of{" "}
            {sessionState.totalQuestions}
          </span>
          <span className="tw-label" style={{ fontSize: "14px" }}>
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div
          className="tw-progress"
          style={{ height: "4px", borderRadius: "2px" }}
        >
          <div
            className="tw-progress-inner"
            style={{ width: `${progress}%`, borderRadius: "2px" }}
          />
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

        {/* Question overlay */}
        <div className="tw-recorder-overlay">
          <div className="tw-question">{sessionState.currentQuestion}</div>
          <div className={`tw-recorder-hint ${isRecording ? "active" : ""}`}>
            {sessionState.isInterviewComplete
              ? "Interview complete! Preparing your testimonial..."
              : isRecording
                ? `Recording question ${sessionState.questionIndex + 1} of ${sessionState.totalQuestions} - Click "Next Question" to continue or "End & Submit" when done`
                : "Click record to start your testimonial interview"}
          </div>
        </div>

        {/* Audio visualizer removed */}

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

        {/* AI hint */}
        {aiHint && (
          <div className="tw-ai-hint visible">
            <Icon name="lightbulb" width={16} height={16} />
            <span>{aiHint}</span>
          </div>
        )}

        {/* Connection status */}
        <div className={`tw-connection-status ${connectionStatus} visible`}>
          <div className="tw-connection-indicator" />
          <span>
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "connecting"
                ? "Connecting..."
                : "Disconnected"}
          </span>
        </div>
      </div>

      {/* Recording controls */}
      {!sessionState.isInterviewComplete && (
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

              {/* Question navigation and completion */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  variant="secondary"
                  onClick={handleSkipQuestion}
                  disabled={
                    sessionState.questionIndex >=
                    sessionState.totalQuestions - 1
                  }
                  style={{ fontSize: "14px", padding: "8px 16px" }}
                >
                  Skip Question
                </Button>

                <Button
                  variant="primary"
                  onClick={handleNextQuestion}
                  disabled={
                    sessionState.questionIndex >=
                    sessionState.totalQuestions - 1
                  }
                  style={{ fontSize: "14px", padding: "8px 16px" }}
                >
                  Next Question
                </Button>

                <Button
                  variant="primary"
                  onClick={handleEndRecording}
                  style={{
                    fontSize: "14px",
                    padding: "8px 16px",
                    backgroundColor: "#059669",
                  }}
                >
                  End & Submit
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

      {/* Transcript display */}
      {config.showTranscription && (
        <div className={`tw-transcript ${isRecording ? "active" : ""}`}>
          {transcriptText ||
            (isRecording
              ? "Your speech will appear here as you speak..."
              : "Start recording to see live transcription")}
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
