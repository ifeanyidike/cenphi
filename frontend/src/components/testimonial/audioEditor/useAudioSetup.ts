import { useEffect, useRef, useState, useCallback } from "react";

interface UseAudioSetupOptions {
  audioUrl: string;
  volume?: number;
  playbackRate?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onError?: (error: string) => void;
  onReady?: () => void;
  visualize?: boolean;
}

interface UseAudioSetupReturn {
  audioRef: React.RefObject<HTMLAudioElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (value: number) => void;
  setPlaybackRate: (value: number) => void;
  toggleMute: () => void;
  isMuted: boolean;
}

/**
 * Custom hook to handle audio element setup, Web Audio API integration,
 * and waveform visualization with proper connection handling to avoid
 * the common issue of audio playing but no sound being heard.
 */
export const useAudioSetup = ({
  audioUrl,
  volume = 1,
  playbackRate = 1,
  onTimeUpdate,
  onDurationChange,
  onError,
  onReady,
  visualize = true,
}: UseAudioSetupOptions): UseAudioSetupReturn => {
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  //   const animationFrameRef = useRef<number | null>(null);
  const audioSetupCompleteRef = useRef<boolean>(false);

  // State
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(playbackRate);

  // Initialize audio and set up event listeners
  useEffect(() => {
    if (!audioRef.current || !audioUrl) return;

    const audio = audioRef.current;

    // Set current properties
    audio.volume = isMuted ? 0 : currentVolume;
    audio.playbackRate = currentPlaybackRate;

    // Reset to initial loading state when audio URL changes
    if (audio.src !== audioUrl) {
      setIsLoading(true);
      setError(null);
      audio.src = audioUrl;
      audio.load();
    }

    // Set up event listeners
    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded");
      if (audio.duration && onDurationChange) {
        onDurationChange(audio.duration);
      }
    };

    const handleLoadedData = () => {
      console.log("Audio data loaded");
      setIsLoading(false);
      setIsReady(true);
      if (onReady) onReady();
    };

    const handleTimeUpdate = () => {
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime);
      }
    };

    const handleError = () => {
      const errorMessage = audio.error
        ? `Error code ${audio.error.code}: ${audio.error.message || "Unknown error"}`
        : "Unknown audio error occurred";

      console.error("Audio error:", errorMessage);
      setError(errorMessage);
      setIsLoading(false);

      if (onError) onError(errorMessage);
    };

    const handleEnded = () => {
      pause();
      if (audio) {
        // Optionally reset to beginning
        audio.currentTime = 0;
        if (onTimeUpdate) onTimeUpdate(0);
      }
    };

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);

    // Clean up
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [
    audioUrl,
    currentVolume,
    currentPlaybackRate,
    isMuted,
    onTimeUpdate,
    onDurationChange,
    onReady,
    onError,
  ]);

  // Set up Web Audio API for visualization if requested
  useEffect(() => {
    if (
      !visualize ||
      !audioRef.current ||
      !canvasRef.current ||
      audioSetupCompleteRef.current
    ) {
      return;
    }

    // Only set up once
    try {
      console.log("Setting up Web Audio API for visualization");

      // Create Audio Context
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        console.warn("Web Audio API not supported");
        return;
      }

      const context = new AudioCtx();
      audioContextRef.current = context;

      // Create analyzer
      const analyser = context.createAnalyser();
      analyser.fftSize = 256; // Power of 2, smaller values have better performance
      analyserRef.current = analyser;

      // Create a source node from the audio element
      // This is the key part that often causes audio to be muted
      const source = context.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      // Correct connection chain: source -> analyser -> destination
      source.connect(analyser);
      analyser.connect(context.destination);

      // Mark setup as complete
      audioSetupCompleteRef.current = true;
      console.log("Web Audio API setup complete");
    } catch (err) {
      console.error("Failed to set up Web Audio API:", err);
      // Continue without visualization, audio should still play
    }

    // Clean up on unmount
    return () => {
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch((err) => {
          console.warn("Error closing audio context:", err);
        });
      }
    };
  }, [visualize]);

  // Play function
  const play = useCallback(async (): Promise<void> => {
    if (!audioRef.current) throw new Error("Audio element not initialized");

    // Resume AudioContext if it was suspended (autoplay policy)
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }

    try {
      await audioRef.current.play();
    } catch (err) {
      console.error("Error playing audio:", err);
      setError("Could not play audio. Browser may have blocked autoplay.");
      throw err;
    }
  }, []);

  // Pause function
  const pause = useCallback((): void => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Seek function
  const seek = useCallback(
    (time: number): void => {
      if (audioRef.current) {
        audioRef.current.currentTime = Math.max(
          0,
          Math.min(time, audioRef.current.duration || 0)
        );
        if (onTimeUpdate) onTimeUpdate(audioRef.current.currentTime);
      }
    },
    [onTimeUpdate]
  );

  // Volume control
  const setVolume = useCallback(
    (value: number): void => {
      const normalizedVolume = Math.max(0, Math.min(value, 1));
      setCurrentVolume(normalizedVolume);

      if (audioRef.current) {
        audioRef.current.volume = isMuted ? 0 : normalizedVolume;
      }
    },
    [isMuted]
  );

  // Playback rate control
  const setPlaybackRate = useCallback((value: number): void => {
    setCurrentPlaybackRate(value);

    if (audioRef.current) {
      audioRef.current.playbackRate = value;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback((): void => {
    setIsMuted(!isMuted);

    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : currentVolume;
    }
  }, [isMuted, currentVolume]);

  return {
    audioRef,
    canvasRef,
    containerRef,
    isReady,
    isLoading,
    error,
    play,
    pause,
    seek,
    setVolume,
    setPlaybackRate,
    toggleMute,
    isMuted,
  };
};
