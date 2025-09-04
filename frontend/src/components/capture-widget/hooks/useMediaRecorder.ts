// src/components/capture-widget/hooks/useMediaRecorder.ts
import { useState, useRef, useCallback, useEffect } from "react";
import { MediaType, CameraOrientation } from "../types";

interface MediaRecorderOptions {
  onDataAvailable?: (data: Blob) => void;
  onStop?: (chunks: Blob[]) => void;
  mimeType?: string;
  chunkInterval?: number;
  maxDuration?: number;
}

interface UseMediaRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  isRecording: boolean;
  isPaused: boolean;
  recordingTime: number;
  mediaStream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  error: string | null;
  recordedChunks: Blob[];
  isInitialized: boolean;
}

export const useMediaRecorder = (
  mediaType: MediaType,
  cameraOrientation: CameraOrientation = "landscape",
  options: MediaRecorderOptions = {}
): UseMediaRecorderReturn => {
  const {
    onDataAvailable,
    onStop,
    mimeType = mediaType === "video" ? "video/webm" : "audio/webm",
    chunkInterval = 250,
    maxDuration = 60,
  } = options;

  // State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Refs for stable references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);
  const chunksCollectorRef = useRef<Blob[]>([]);
  const isStoppingRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear timer
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Stop and clear recorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Error stopping MediaRecorder during cleanup:", err);
      }
    }
    mediaRecorderRef.current = null;

    // Stop and clear stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }
    streamRef.current = null;
    setMediaStream(null);

    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setIsInitialized(false);
    isStoppingRef.current = false;
  }, []);

  // Initialize media stream
  const initializeMedia = useCallback(async (): Promise<MediaStream | null> => {
    if (isInitializingRef.current) {
      console.log("📱 Media initialization already in progress");
      return streamRef.current;
    }

    isInitializingRef.current = true;
    setError(null);

    try {
      // Check if we already have a valid stream
      if (streamRef.current && streamRef.current.active) {
        const hasRequiredTracks =
          mediaType === "video"
            ? streamRef.current.getVideoTracks().length > 0 &&
              streamRef.current.getAudioTracks().length > 0
            : streamRef.current.getAudioTracks().length > 0;

        if (hasRequiredTracks) {
          console.log("📱 Using existing valid stream");
          isInitializingRef.current = false;
          setIsInitialized(true);
          return streamRef.current;
        }
      }

      // Clean up any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Set up constraints
      let videoConstraints: boolean | MediaTrackConstraints = false;
      if (mediaType === "video") {
        videoConstraints = {
          facingMode: "user",
          width:
            cameraOrientation === "portrait" ? { ideal: 480 } : { ideal: 1280 },
          height:
            cameraOrientation === "portrait" ? { ideal: 640 } : { ideal: 720 },
        };
      }

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: videoConstraints,
      };

      console.log("📱 Requesting media with constraints:", constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Validate stream
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      if (mediaType === "video" && videoTracks.length === 0) {
        throw new Error("Failed to get video track");
      }

      if (audioTracks.length === 0) {
        throw new Error("Failed to get audio track");
      }

      console.log("✅ Media stream obtained successfully");
      console.log("🎥 Video tracks:", videoTracks.length);
      console.log("🎵 Audio tracks:", audioTracks.length);

      // Store stream
      streamRef.current = stream;
      setMediaStream(stream);

      // Set up video preview
      if (mediaType === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
          console.log("✅ Video preview started");
        } catch (err) {
          console.warn("⚠️ Could not start video preview:", err);
        }
      }

      setIsInitialized(true);
      isInitializingRef.current = false;
      return stream;
    } catch (err) {
      console.error("❌ Error accessing media devices:", err);
      isInitializingRef.current = false;

      let errorMessage = "Unable to access camera/microphone. ";

      if (err instanceof Error) {
        switch (err.name) {
          case "NotAllowedError":
            errorMessage +=
              "Please allow camera and microphone permissions in your browser.";
            break;
          case "NotFoundError":
            errorMessage +=
              "No camera or microphone found. Please connect a device.";
            break;
          case "NotReadableError":
            errorMessage +=
              "Camera/microphone is being used by another application.";
            break;
          case "AbortError":
            errorMessage += "Permission request was cancelled.";
            break;
          case "OverconstrainedError":
            errorMessage += "No devices match the required constraints.";
            break;
          default:
            errorMessage += err.message || "Unknown error occurred.";
        }
      }

      setError(errorMessage);
      setIsInitialized(false);
      return null;
    }
  }, [mediaType, cameraOrientation]);

  // Initialize media stream on mount or when media type/orientation changes
  useEffect(() => {
    console.log("🎬 Initializing media stream...");
    initializeMedia();
  }, [mediaType, cameraOrientation]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecording || isStoppingRef.current) {
      console.log("⚠️ Recording already in progress or stopping");
      return;
    }

    console.log("🎬 Starting recording...");

    // Reset state
    chunksCollectorRef.current = [];
    setRecordedChunks([]);
    setRecordingTime(0);
    setError(null);

    // Ensure we have a media stream
    let stream = streamRef.current;
    if (!stream || !stream.active) {
      console.log("📱 Media stream not ready, initializing...");
      stream = await initializeMedia();
      if (!stream) {
        console.error("❌ Failed to initialize media stream");
        return;
      }
    }

    try {
      // Determine MIME type
      let finalMimeType = mimeType;
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`⚠️ ${mimeType} not supported, trying alternatives`);

        const alternatives =
          mediaType === "video"
            ? ["video/webm;codecs=vp9", "video/webm", "video/mp4"]
            : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

        finalMimeType =
          alternatives.find((type) => MediaRecorder.isTypeSupported(type)) ||
          mimeType;
      }

      console.log("🎙️ Creating MediaRecorder with MIME type:", finalMimeType);

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType: finalMimeType });
      mediaRecorderRef.current = recorder;

      // Set up event handlers
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`📦 Data chunk: ${event.data.size} bytes`);
          chunksCollectorRef.current.push(event.data);
          setRecordedChunks((prev) => [...prev, event.data]);

          if (onDataAvailable) {
            onDataAvailable(event.data);
          }
        }
      };

      recorder.onstop = () => {
        console.log("🛑 Recording stopped");
        const finalChunks = [...chunksCollectorRef.current];
        console.log(`📊 Final chunks count: ${finalChunks.length}`);

        setIsRecording(false);
        setIsPaused(false);

        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        if (onStop && finalChunks.length > 0) {
          onStop(finalChunks);
        }

        isStoppingRef.current = false;
      };

      recorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        setError("Recording error occurred. Please try again.");
        cleanup();
      };

      // Start recording
      recorder.start(chunkInterval);
      setIsRecording(true);

      console.log("✅ Recording started successfully");

      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            console.log("⏰ Maximum duration reached, stopping...");
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("❌ Failed to create MediaRecorder:", err);
      setError("Recording is not supported in your browser.");
      cleanup();
    }
  }, [
    isRecording,
    initializeMedia,
    mimeType,
    mediaType,
    chunkInterval,
    maxDuration,
    onDataAvailable,
    onStop,
  ]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!isRecording || isStoppingRef.current) {
      console.log("⚠️ Not recording or already stopping");
      return;
    }

    console.log("🛑 Stopping recording...");
    isStoppingRef.current = true;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        // Request final data
        mediaRecorderRef.current.requestData();

        // Stop after brief delay to ensure data is captured
        setTimeout(() => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        }, 100);
      } catch (err) {
        console.error("❌ Error stopping recorder:", err);
        isStoppingRef.current = false;
      }
    } else {
      console.log("⚠️ MediaRecorder not in recording state");
      isStoppingRef.current = false;
    }
  }, [isRecording]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.pause();
        setIsPaused(true);

        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        console.log("⏸️ Recording paused");
      } catch (err) {
        console.error("❌ Error pausing recording:", err);
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      try {
        mediaRecorderRef.current.resume();
        setIsPaused(false);

        // Restart timer
        timerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => {
            const newTime = prev + 1;
            if (newTime >= maxDuration) {
              stopRecording();
              return maxDuration;
            }
            return newTime;
          });
        }, 1000);

        console.log("▶️ Recording resumed");
      } catch (err) {
        console.error("❌ Error resuming recording:", err);
      }
    }
  }, [maxDuration, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    recordingTime,
    mediaStream,
    videoRef,
    error,
    recordedChunks,
    isInitialized,
  };
};
