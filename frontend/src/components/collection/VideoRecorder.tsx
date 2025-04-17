import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Settings,
  RefreshCw,
  CheckCircle,
  ChevronRight,
  Loader2,
  Volume2,
  VolumeX,
  ChevronDown,
  Download,
  Scissors,
  Maximize,
  ChevronLeft,
  AlertOctagon,
  Sun,
  SunMoon,
  Moon,
  ImagePlus,
  PauseCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Helper function to adjust color brightness
const adjustColor = (color: string, amount: number): string => {
  // Remove the # if it exists
  color = color.replace("#", "");

  // Parse the color to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Adjust the color
  const newR = Math.max(0, Math.min(255, r + amount));
  const newG = Math.max(0, Math.min(255, g + amount));
  const newB = Math.max(0, Math.min(255, b + amount));

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, "0")}${newG
    .toString(16)
    .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
};

interface EnhancedVideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number;
  currentQuestion?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  companyLogo?: string;
  companyName?: string;
  primaryColor?: string;
  showAIHelp?: boolean;
  forceMobileView?: boolean;
}

type RecordingState =
  | "idle"
  | "countdown"
  | "recording"
  | "paused"
  | "reviewing"
  | "processing"
  | "complete";
type VideoQuality = "standard" | "high" | "hd" | "4k";
type LightingMode = "auto" | "light" | "dark";

export const EnhancedVideoRecorder: React.FC<EnhancedVideoRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 60,
  currentQuestion = "What problem were you trying to solve?",
  currentQuestionIndex = 0,
  totalQuestions = 4,
  companyLogo = "",
  companyName = "Your Company",
  primaryColor = "#6366F1",
  forceMobileView = false,
}) => {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("high");
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>(
    []
  );
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [lightingMode, setLightingMode] = useState<LightingMode>("auto");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBackgroundBlurred] = useState(false);
  // New state variables for quality improvement
  const [actualResolution, setActualResolution] =
    useState<string>("Detecting...");
  const [testVideoURL, setTestVideoURL] = useState<string | null>(null);
  const [showTestVideo, setShowTestVideo] = useState(false);
  const [lastResolutionError, setLastResolutionError] = useState<string | null>(
    null
  );
  // New state for responsive layout
  const [isMobileView, setIsMobileView] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulated recording blob for demonstration
  const recordedVideoURL = useRef<string | null>(null);

  // Check for mobile view or use forced mobile view
  useEffect(() => {
    if (forceMobileView) {
      setIsMobileView(true);
      return;
    }

    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, [forceMobileView]);

  // Initialize media devices
  useEffect(() => {
    const initDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();

        const cameras = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const mics = devices.filter((device) => device.kind === "audioinput");

        setAvailableCameras(cameras);
        setAvailableMics(mics);

        if (cameras.length > 0) {
          setSelectedCamera(cameras[0].deviceId || `camera-0`);
        } else {
          setSelectedCamera("default-camera");
        }

        if (mics.length > 0) {
          setSelectedMic(mics[0].deviceId || `mic-0`);
        } else {
          setSelectedMic("default-mic");
        }

        await initializeStream();
      } catch (err) {
        console.error("Error accessing media devices:", err);
        toast({
          title: "Device Access Error",
          description:
            "Unable to access camera or microphone. Please check your permissions.",
          variant: "destructive",
        });

        // Set fallback values
        setSelectedCamera("default-camera");
        setSelectedMic("default-mic");
      }
    };

    initDevices();

    return () => {
      // Clean up stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Clean up test video URLs
      if (testVideoURL) {
        URL.revokeObjectURL(testVideoURL);
      }

      // Clean up recorded video URL
      if (recordedVideoURL.current) {
        URL.revokeObjectURL(recordedVideoURL.current);
      }
    };
  }, []);

  // Update stream when camera or mic selection changes or when view mode changes
  useEffect(() => {
    if (selectedCamera || selectedMic) {
      initializeStream();
    }
  }, [
    selectedCamera,
    selectedMic,
    videoQuality,
    isBackgroundBlurred,
    isMobileView,
  ]);

  // Handle countdown timer
  useEffect(() => {
    if (recordingState === "countdown") {
      if (countdown > 0) {
        countdownTimerRef.current = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        startRecording();
      }
    }

    return () => {
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
      }
    };
  }, [recordingState, countdown]);
  // Set video constraints based on quality setting with stronger requirements
  const videoConstraints: MediaTrackConstraints = {
    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
  };
  const constraints: MediaStreamConstraints = {
    video: cameraEnabled ? videoConstraints : false,
    audio: micEnabled
      ? {
          deviceId: selectedMic ? { exact: selectedMic } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
        }
      : false,
  };

  // Initialize media stream with improved resolution handling
  const initializeStream = async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Reset resolution error state
      setLastResolutionError(null);

      // Define quality presets with both ideal and min values for better enforcement
      if (isMobileView) {
        // For mobile, we want portrait-oriented video (taller than wide)
        switch (videoQuality) {
          case "standard":
            videoConstraints.width = { min: 480, ideal: 480 };
            videoConstraints.height = { min: 640, ideal: 640 };
            break;
          case "high":
            videoConstraints.width = { min: 720, ideal: 720 };
            videoConstraints.height = { min: 1280, ideal: 1280 };
            break;
          case "hd":
            videoConstraints.width = { min: 1080, ideal: 1080 };
            videoConstraints.height = { min: 1920, ideal: 1920 };
            break;
          case "4k":
            videoConstraints.width = { min: 2160, ideal: 2160 };
            videoConstraints.height = { min: 3840, ideal: 3840 };
            break;
        }
      } else {
        // For desktop, maintain landscape orientation (wider than tall)
        switch (videoQuality) {
          case "standard":
            videoConstraints.width = { min: 640, ideal: 640 };
            videoConstraints.height = { min: 480, ideal: 480 };
            break;
          case "high":
            videoConstraints.width = { min: 1280, ideal: 1280 };
            videoConstraints.height = { min: 720, ideal: 720 };
            break;
          case "hd":
            videoConstraints.width = { min: 1920, ideal: 1920 };
            videoConstraints.height = { min: 1080, ideal: 1080 };
            break;
          case "4k":
            videoConstraints.width = { min: 3840, ideal: 3840 };
            videoConstraints.height = { min: 2160, ideal: 2160 };
            break;
        }
      }

      // Add frameRate constraint for smoother video at higher resolutions
      videoConstraints.frameRate = { min: 24, ideal: 30 };

      // Add facingMode constraint for mobile - use front camera by default
      if (isMobileView) {
        videoConstraints.facingMode = "user";
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Get the actual video track settings to show real resolution
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        setActualResolution(`${settings.width}×${settings.height}`);

        // Log detailed info about the video track capabilities
        console.log("Video track settings:", settings);
        console.log("Video track constraints:", videoTrack.getConstraints());

        // Check if we got the expected resolution based on quality setting
        let expectedWidth = 0;
        switch (videoQuality) {
          case "standard":
            expectedWidth = 640;
            break;
          case "high":
            expectedWidth = 1280;
            break;
          case "hd":
            expectedWidth = 1920;
            break;
          case "4k":
            expectedWidth = 3840;
            break;
        }

        if (settings.width && settings.width < expectedWidth * 0.9) {
          toast({
            title: "Resolution Limited",
            description: `Your camera provided ${settings.width}×${settings.height} instead of the requested quality. This is the best your camera can do.`,
            variant: "destructive",
          });
          setLastResolutionError(
            "Camera cannot provide the requested resolution"
          );
        }
      } else {
        setActualResolution("No video");
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Ensure the video element itself doesn't constrain the actual resolution
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            // Set video element to preserve aspect ratio
            if (videoTrack) {
              const settings = videoTrack.getSettings();
              console.log(
                "Video dimensions on load:",
                settings.width,
                settings.height
              );
            }
          }
        };
      }
    } catch (err: any) {
      console.error("Error initializing stream:", err);
      setActualResolution("Failed to set resolution");

      // Handle OverconstrainedError specifically
      if (err.name === "OverconstrainedError") {
        setLastResolutionError("Your camera doesn't support this resolution");
        toast({
          title: "Resolution Not Supported",
          description:
            "Your camera doesn't support the selected resolution. Trying with best available quality.",
          variant: "destructive",
        });

        // Try again with more relaxed constraints - only use ideal values
        const fallbackConstraints = { ...videoConstraints };
        // Remove min constraints but keep ideal values
        if (
          fallbackConstraints.width &&
          typeof fallbackConstraints.width === "object"
        ) {
          const idealWidth = fallbackConstraints.width.ideal;
          fallbackConstraints.width = { ideal: idealWidth };
        }
        if (
          fallbackConstraints.height &&
          typeof fallbackConstraints.height === "object"
        ) {
          const idealHeight = fallbackConstraints.height.ideal;
          fallbackConstraints.height = { ideal: idealHeight };
        }

        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: cameraEnabled ? fallbackConstraints : false,
            audio: constraints.audio,
          });

          streamRef.current = fallbackStream;

          // Get the actual fallback resolution
          const videoTrack = fallbackStream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            setActualResolution(
              `${settings.width}×${settings.height} (best available)`
            );
          }

          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
        } catch (fallbackErr) {
          console.error("Fallback stream error:", fallbackErr);
          toast({
            title: "Camera Error",
            description:
              "Unable to access camera with any resolution. Please check your device.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Camera Error",
          description:
            "Unable to access camera or microphone. Please check your permissions.",
          variant: "destructive",
        });
      }
    }
  };

  // Start recording countdown
  const handleStartCountdown = () => {
    setCountdown(3);
    setRecordingState("countdown");
  };

  // Start recording with improved quality settings
  const startRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];

    // Set appropriate bitrate based on selected quality
    let videoBitsPerSecond = 2500000; // Default to 2.5 Mbps

    switch (videoQuality) {
      case "standard":
        videoBitsPerSecond = 1000000; // 1 Mbps for 480p
        break;
      case "high":
        videoBitsPerSecond = 2500000; // 2.5 Mbps for 720p
        break;
      case "hd":
        videoBitsPerSecond = 5000000; // 5 Mbps for 1080p
        break;
      case "4k":
        videoBitsPerSecond = 20000000; // 20 Mbps for 4K
        break;
    }

    let options: MediaRecorderOptions = {
      mimeType: "video/webm;codecs=vp9,opus",
      videoBitsPerSecond: videoBitsPerSecond,
    };

    // Fallback codecs if vp9 is not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType as string)) {
      options.mimeType = "video/webm;codecs=vp8,opus";

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = {}; // Use browser defaults if no supported type is found
        }
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: options.mimeType || "video/webm",
        });
        recordedVideoURL.current = URL.createObjectURL(blob);

        if (videoRef.current && recordingState !== "reviewing") {
          videoRef.current.srcObject = null;
          videoRef.current.src = recordedVideoURL.current;
          videoRef.current.play();
        }
      };

      console.log("MediaRecorder started with options:", options);
      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;

      setRecordingState("recording");
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Error",
        description:
          "Unable to start recording. Please try again or select a lower quality setting.",
        variant: "destructive",
      });
      setRecordingState("idle");
    }
  };

  // Create a test recording to check quality
  const createTestRecording = async () => {
    if (!streamRef.current) {
      toast({
        title: "Test Failed",
        description:
          "No camera stream available. Please check your camera settings.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Testing Quality",
      description: "Recording 2 seconds of video to verify quality settings...",
    });

    // Set appropriate bitrate based on selected quality
    let videoBitsPerSecond = 2500000; // Default to 2.5 Mbps

    switch (videoQuality) {
      case "standard":
        videoBitsPerSecond = 1000000;
        break; // 1 Mbps for 480p
      case "high":
        videoBitsPerSecond = 2500000;
        break; // 2.5 Mbps for 720p
      case "hd":
        videoBitsPerSecond = 5000000;
        break; // 5 Mbps for 1080p
      case "4k":
        videoBitsPerSecond = 20000000;
        break; // 20 Mbps for 4K
    }

    let options: MediaRecorderOptions = {
      mimeType: "video/webm;codecs=vp9,opus",
      videoBitsPerSecond: videoBitsPerSecond,
    };

    // Fallback codecs if vp9 is not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType as string)) {
      options.mimeType = "video/webm;codecs=vp8,opus";

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";

        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = {}; // Use browser defaults if no supported type is found
        }
      }
    }

    try {
      const testRecorder = new MediaRecorder(streamRef.current, options);
      const testChunks: Blob[] = [];

      testRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) testChunks.push(e.data);
      };

      testRecorder.onstop = () => {
        const testBlob = new Blob(testChunks, {
          type: options.mimeType || "video/webm",
        });

        // Clean up previous test URL if it exists
        if (testVideoURL) {
          URL.revokeObjectURL(testVideoURL);
        }

        const newTestURL = URL.createObjectURL(testBlob);
        setTestVideoURL(newTestURL);
        setShowTestVideo(true);
      };

      testRecorder.start();
      setTimeout(() => testRecorder.stop(), 2000);
    } catch (err) {
      console.error("Test recording error:", err);
      toast({
        title: "Test Failed",
        description: "Could not create a test recording with current settings.",
        variant: "destructive",
      });
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      setRecordingState("paused");
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      setRecordingState("recording");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (recordingState === "recording" || recordingState === "paused")
    ) {
      mediaRecorderRef.current.stop();

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      setRecordingState("reviewing");
    }
  };

  // Reset recording
  const resetRecording = () => {
    setRecordingState("idle");
    setRecordingTime(0);

    if (recordedVideoURL.current) {
      URL.revokeObjectURL(recordedVideoURL.current);
      recordedVideoURL.current = null;
    }

    initializeStream();
  };

  // Complete recording
  const completeRecording = () => {
    setRecordingState("processing");

    setTimeout(() => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      onRecordingComplete(blob);
      setRecordingState("complete");
    }, 2000);
  };

  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle playback
  const handlePlaybackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseInt(e.target.value);
      videoRef.current.currentTime = time;
      setPlaybackTime(time);
    }
  };

  // Toggle playback
  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);

    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Handle lighting mode change
  const handleLightingChange = (mode: LightingMode) => {
    setLightingMode(mode);

    // Apply CSS filter to video element based on lighting mode
    if (videoRef.current) {
      switch (mode) {
        case "light":
          videoRef.current.style.filter = "brightness(1.2) contrast(1.1)";
          break;
        case "dark":
          videoRef.current.style.filter = "brightness(1.4) contrast(1.2)";
          break;
        default:
          videoRef.current.style.filter = "none";
      }
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    setCameraEnabled(!cameraEnabled);
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    setMicEnabled(!micEnabled);
  };

  // Check if recording is short
  const isRecordingTooShort = recordingTime < 5;

  // Set aspect ratio class based on screen size
  const aspectRatioClass = isMobileView ? "aspect-[9/16]" : "aspect-video";

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full rounded-xl overflow-hidden bg-black shadow-2xl transition-all border border-gray-800",
        "backdrop-blur-sm bg-opacity-95",
        isFullscreen ? "fixed inset-0 z-50" : "relative"
      )}
      style={{
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
      }}
    >
      <div
        className={cn("relative bg-black overflow-hidden", aspectRatioClass)}
        style={{
          maxHeight: isFullscreen ? "calc(100vh - 10rem)" : undefined,
          background:
            "linear-gradient(145deg, rgba(20, 20, 20, 1) 0%, rgba(10, 10, 10, 1) 100%)",
        }}
      >
        {/* Video preview/playback */}
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full transition-all duration-500",
            isMobileView ? "object-cover" : "object-contain",
            "filter saturate-105",
            isBackgroundBlurred &&
              recordingState === "idle" &&
              "backdrop-blur-sm"
          )}
          autoPlay
          playsInline
          muted={recordingState !== "reviewing" || isMuted}
          onTimeUpdate={() => {
            if (videoRef.current && recordingState === "reviewing") {
              setPlaybackTime(Math.floor(videoRef.current.currentTime));
            }
          }}
          onEnded={() => {
            if (recordingState === "reviewing") {
              setIsPlaying(false);
            }
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              console.log(
                "Video dimensions on load:",
                videoRef.current.videoWidth,
                videoRef.current.videoHeight
              );
            }
          }}
        />

        {/* Company branding */}
        <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="h-6 w-6 sm:h-8 sm:w-8 rounded-md object-contain bg-white/90 p-1 shadow-lg"
            />
          ) : (
            <div
              className="h-6 w-6 sm:h-8 sm:w-8 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-lg"
              style={{
                backgroundColor: primaryColor,
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(
                  primaryColor,
                  -20
                )} 100%)`,
              }}
            >
              {companyName.slice(0, 2).toUpperCase()}
            </div>
          )}
          {!isFullscreen && !isMobileView && (
            <span className="text-white text-sm font-medium drop-shadow-lg hidden md:inline-block backdrop-blur-sm bg-black/30 px-2 py-0.5 rounded">
              {companyName}
            </span>
          )}
        </div>

        {/* Countdown overlay */}
        <AnimatePresence>
          {recordingState === "countdown" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 z-20"
            >
              <motion.div
                key={countdown}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.5 }}
                className="text-5xl sm:text-7xl font-bold text-white"
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording indicator */}
        {recordingState === "recording" && (
          <div className="absolute top-4 right-4 flex items-center gap-2 backdrop-blur-sm bg-black/40 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm z-10 shadow-lg border border-red-500/30">
            <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500 animate-pulse shadow-inner"></div>
            <span className="font-medium">REC</span>
            <span>{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Question display - Simplified for mobile */}
        {(recordingState === "idle" ||
          recordingState === "recording" ||
          recordingState === "paused") && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 py-4 sm:p-6 z-10">
            <h3 className="text-base sm:text-xl font-medium text-white mb-1 sm:mb-2 text-shadow">
              {currentQuestion}
            </h3>
            {!isMobileView && (
              <p className="text-white/90 text-xs sm:text-sm backdrop-blur-sm bg-black/20 inline-block px-2 py-1 rounded">
                Answer naturally in 30-60 seconds. You can re-record if needed.
              </p>
            )}
          </div>
        )}

        {/* Processing overlay */}
        <AnimatePresence>
          {recordingState === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 opacity-20 blur-xl animate-pulse"></div>
                <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 text-white animate-spin relative z-10" />
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-white mt-4 sm:mt-6 tracking-wide">
                Processing your video...
              </h3>
              <p className="text-white/70 text-xs sm:text-sm mt-2 max-w-md text-center px-4">
                We're applying enhancements and preparing your testimonial. This
                will only take a moment.
              </p>
              <div className="w-36 sm:w-48 h-1.5 bg-gray-700 rounded-full mt-4 sm:mt-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                ></motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Complete overlay */}
        <AnimatePresence>
          {recordingState === "complete" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-20"
            >
              <motion.div
                className="relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 opacity-20 blur-xl animate-pulse"></div>
                <div className="rounded-full p-3 sm:p-4 mb-3 sm:mb-4 relative z-10 bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <CheckCircle className="h-10 w-10 sm:h-16 sm:w-16 text-white" />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-4 text-center"
              >
                <h3 className="text-xl sm:text-2xl font-medium text-white">
                  Great job!
                </h3>
                <p className="text-white/90 text-sm sm:text-base mt-2 sm:mt-3 text-center max-w-md leading-relaxed">
                  Your testimonial has been successfully recorded and enhanced.
                  {currentQuestionIndex < totalQuestions - 1
                    ? " Let's continue to the next question."
                    : " Thank you for sharing your experience!"}
                </p>

                {currentQuestionIndex < totalQuestions - 1 && (
                  <motion.div
                    className="mt-4 sm:mt-6 flex justify-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full px-4 sm:px-6 text-white gap-2 border-none shadow-lg hover:shadow-xl">
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control bar */}
      <div className="bg-gradient-to-b from-gray-900 to-black text-white border-t border-gray-800">
        {/* Progress/timeline */}
        <div className="h-1.5 w-full bg-gray-800 relative">
          {recordingState === "reviewing" ? (
            <input
              type="range"
              min="0"
              max={recordingTime}
              value={playbackTime}
              onChange={handlePlaybackChange}
              className="absolute h-1.5 w-full opacity-0 cursor-pointer z-10"
            />
          ) : null}

          <div
            className="h-full transition-all duration-200"
            style={{
              width:
                recordingState === "reviewing"
                  ? `${(playbackTime / recordingTime) * 100}%`
                  : `${(recordingTime / maxDuration) * 100}%`,
              backgroundColor: primaryColor,
              boxShadow: `0 0 8px ${primaryColor}40`,
            }}
          ></div>
        </div>

        {/* Main controls - Responsive design */}
        <div className="p-2 sm:p-4 flex items-center justify-between">
          {/* Left side controls */}
          <div className="flex items-center gap-1 sm:gap-3">
            {recordingState === "idle" && (
              <>
                {/* Desktop controls */}
                {!isMobileView && (
                  <>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="!text-white hover:!bg-white/10"
                            onClick={toggleCamera}
                          >
                            {cameraEnabled ? (
                              <Camera className="h-5 w-5" />
                            ) : (
                              <CameraOff className="h-5 w-5 text-red-400" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{cameraEnabled ? "Disable" : "Enable"} Camera</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="!text-white hover:!bg-white/10"
                            onClick={toggleMicrophone}
                          >
                            {micEnabled ? (
                              <Mic className="h-5 w-5" />
                            ) : (
                              <MicOff className="h-5 w-5 text-red-400" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{micEnabled ? "Disable" : "Enable"} Microphone</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="!text-white hover:!bg-white/10"
                            onClick={() => setShowSettings(!showSettings)}
                          >
                            <Settings className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Settings</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="!text-white hover:!bg-white/10 h-8"
                          >
                            <Sun className="h-4 w-4 mr-1" />
                            <span className="text-xs">Lighting</span>
                            <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-32">
                          <DropdownMenuItem
                            className={cn(
                              lightingMode === "auto" && "bg-accent"
                            )}
                            onClick={() => handleLightingChange("auto")}
                          >
                            <SunMoon className="h-4 w-4 mr-2" />
                            <span>Auto</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={cn(
                              lightingMode === "light" && "bg-accent"
                            )}
                            onClick={() => handleLightingChange("light")}
                          >
                            <Sun className="h-4 w-4 mr-2" />
                            <span>Brighten</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className={cn(
                              lightingMode === "dark" && "bg-accent"
                            )}
                            onClick={() => handleLightingChange("dark")}
                          >
                            <Moon className="h-4 w-4 mr-2" />
                            <span>Low Light</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}

                {/* Mobile controls */}
                {isMobileView && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white text-xs gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="hidden xs:inline">Settings</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 text-white border-gray-700 sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Camera Settings</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        {/* Camera toggle */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Camera className="h-5 w-5" />
                            <span>Camera</span>
                          </div>
                          <Switch
                            checked={cameraEnabled}
                            onCheckedChange={toggleCamera}
                          />
                        </div>

                        {/* Camera selection */}
                        {availableCameras.length > 1 && (
                          <div className="space-y-2">
                            <Label
                              htmlFor="mobile-camera-select"
                              className="text-white"
                            >
                              Select Camera
                            </Label>
                            <Select
                              value={selectedCamera}
                              onValueChange={setSelectedCamera}
                            >
                              <SelectTrigger
                                id="mobile-camera-select"
                                className="bg-gray-800 border-gray-700 text-white"
                              >
                                <SelectValue placeholder="Select camera" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                {availableCameras.map((camera) => (
                                  <SelectItem
                                    key={camera.deviceId}
                                    value={
                                      camera.deviceId ||
                                      `camera-${availableCameras.indexOf(camera)}`
                                    }
                                  >
                                    {camera.label ||
                                      `Camera ${availableCameras.indexOf(camera) + 1}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Microphone toggle */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Mic className="h-5 w-5" />
                            <span>Microphone</span>
                          </div>
                          <Switch
                            checked={micEnabled}
                            onCheckedChange={toggleMicrophone}
                          />
                        </div>

                        {/* Microphone selection */}
                        {availableMics.length > 1 && (
                          <div className="space-y-2">
                            <Label
                              htmlFor="mobile-mic-select"
                              className="text-white"
                            >
                              Select Microphone
                            </Label>
                            <Select
                              value={selectedMic}
                              onValueChange={setSelectedMic}
                            >
                              <SelectTrigger
                                id="mobile-mic-select"
                                className="bg-gray-800 border-gray-700 text-white"
                              >
                                <SelectValue placeholder="Select microphone" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                {availableMics.map((mic) => (
                                  <SelectItem
                                    key={mic.deviceId}
                                    value={
                                      mic.deviceId ||
                                      `mic-${availableMics.indexOf(mic)}`
                                    }
                                  >
                                    {mic.label ||
                                      `Microphone ${availableMics.indexOf(mic) + 1}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Lighting setting */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Sun className="h-5 w-5" />
                            <span>Lighting</span>
                          </Label>
                          <Select
                            value={lightingMode}
                            onValueChange={(value) =>
                              handleLightingChange(value as LightingMode)
                            }
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="light">Bright</SelectItem>
                              <SelectItem value="dark">Low Light</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Video quality setting */}
                        <div className="space-y-2">
                          <Label
                            htmlFor="mobile-quality-select"
                            className="text-white"
                          >
                            Video Quality
                          </Label>
                          <Select
                            value={videoQuality}
                            onValueChange={(value: VideoQuality) =>
                              setVideoQuality(value)
                            }
                          >
                            <SelectTrigger
                              id="mobile-quality-select"
                              className="bg-gray-800 border-gray-700 text-white"
                            >
                              <SelectValue placeholder="Select quality" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="standard">
                                Standard (480p)
                              </SelectItem>
                              <SelectItem value="high">High (720p)</SelectItem>
                              <SelectItem value="hd">HD (1080p)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          className="w-full bg-gray-800 text-white hover:bg-gray-700"
                          onClick={() => initializeStream()}
                        >
                          Apply Settings
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}

            {recordingState === "reviewing" && (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <PauseCircle className="h-5 w-5" />
                        ) : (
                          <PlayCircle className="h-5 w-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isPlaying ? "Pause" : "Play"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {!isMobileView && (
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/10"
                            onClick={toggleMute}
                          >
                            {isMuted ? (
                              <VolumeX className="h-5 w-5" />
                            ) : (
                              <Volume2 className="h-5 w-5" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{isMuted ? "Unmute" : "Mute"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <div className="w-24 hidden md:block">
                      <Slider
                        defaultValue={[0.8]}
                        max={1}
                        step={0.1}
                        value={[volume]}
                        onValueChange={handleVolumeChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                <span className="text-xs sm:text-sm text-white/70 font-mono ml-1 sm:ml-2">
                  {formatTime(playbackTime)} / {formatTime(recordingTime)}
                </span>
              </>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1 sm:gap-3">
            {recordingState === "idle" && (
              <>
                <Button
                  className="rounded-full px-3 sm:px-6 py-1 text-xs sm:text-sm text-white gap-1 sm:gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 border-none"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(
                      primaryColor,
                      -20
                    )} 100%)`,
                  }}
                  onClick={handleStartCountdown}
                >
                  <span>Start Recording</span>
                </Button>
              </>
            )}

            {recordingState === "recording" && (
              <>
                {isMobileView ? (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 h-8 px-2"
                      onClick={pauseRecording}
                    >
                      <PauseCircle className="h-4 w-4" />
                    </Button>

                    <Button
                      className="rounded-full h-8 px-3 gap-1 text-xs text-white bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all"
                      onClick={stopRecording}
                    >
                      <span>Finish</span>
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      onClick={pauseRecording}
                    >
                      <PauseCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Pause</span>
                    </Button>

                    <Button
                      className="rounded-full px-6 gap-2 text-white bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-300 border-none relative group overflow-hidden"
                      onClick={stopRecording}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Finish Recording
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </Button>
                  </>
                )}
              </>
            )}

            {recordingState === "paused" && (
              <>
                {isMobileView ? (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 h-8 px-2"
                      onClick={resumeRecording}
                    >
                      <PlayCircle className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="destructive"
                      className="rounded-full h-8 px-3 text-xs"
                      onClick={stopRecording}
                    >
                      Finish
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      onClick={resumeRecording}
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Resume</span>
                    </Button>

                    <Button
                      variant="destructive"
                      className="rounded-full px-6"
                      onClick={stopRecording}
                    >
                      Finish Recording
                    </Button>
                  </>
                )}
              </>
            )}

            {recordingState === "reviewing" && (
              <>
                {isMobileView ? (
                  <div className="flex gap-1 items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10 h-8 px-2"
                      onClick={resetRecording}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>

                    <Button
                      className="rounded-full h-8 px-3 gap-1 text-xs text-white shadow-lg border-none"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(
                          primaryColor,
                          -20
                        )} 100%)`,
                      }}
                      onClick={completeRecording}
                      disabled={isRecordingTooShort}
                    >
                      {isRecordingTooShort ? (
                        <AlertOctagon className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      <span>{isRecordingTooShort ? "Too short" : "Use"}</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      onClick={resetRecording}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      <span className="text-xs">Re-record</span>
                    </Button>

                    <Button
                      className="rounded-full px-6 gap-2 text-white relative group overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-none"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(
                          primaryColor,
                          -20
                        )} 100%)`,
                      }}
                      onClick={completeRecording}
                      disabled={isRecordingTooShort}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isRecordingTooShort ? (
                          <>
                            <AlertOctagon className="h-4 w-4" />
                            <span>Video too short</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            <span>Use This Recording</span>
                          </>
                        )}
                      </span>
                      <span
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `linear-gradient(135deg, ${adjustColor(
                            primaryColor,
                            10
                          )} 0%, ${adjustColor(primaryColor, -10)} 100%)`,
                        }}
                      ></span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings panel with resolution feedback - Desktop only */}
      <AnimatePresence>
        {showSettings && recordingState === "idle" && !isMobileView && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 border-t border-gray-700"
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Camera Settings
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="camera-select" className="text-white">
                      Camera
                    </Label>
                    <Select
                      value={selectedCamera}
                      onValueChange={setSelectedCamera}
                    >
                      <SelectTrigger
                        id="camera-select"
                        className="bg-gray-700 border-gray-600 text-white"
                      >
                        <SelectValue placeholder="Select camera" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        {availableCameras.map((camera) => (
                          <SelectItem
                            key={camera.deviceId}
                            value={
                              camera.deviceId ||
                              `camera-${availableCameras.indexOf(camera)}`
                            }
                          >
                            {camera.label ||
                              `Camera ${availableCameras.indexOf(camera) + 1}`}
                          </SelectItem>
                        ))}
                        {availableCameras.length === 0 && (
                          <SelectItem value="default-camera">
                            Default Camera
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="quality-select" className="text-white">
                        Video Quality
                      </Label>
                      <Badge
                        variant="outline"
                        className="bg-gray-800 border-gray-600 text-white/70"
                      >
                        Current: {actualResolution}
                      </Badge>
                    </div>
                    <Select
                      value={videoQuality}
                      onValueChange={(value: VideoQuality) =>
                        setVideoQuality(value)
                      }
                    >
                      <SelectTrigger
                        id="quality-select"
                        className="bg-gray-700 border-gray-600 text-white"
                      >
                        <SelectValue placeholder="Select quality" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        <SelectItem value="standard">
                          Standard (480p)
                        </SelectItem>
                        <SelectItem value="high">High (720p)</SelectItem>
                        <SelectItem value="hd">HD (1080p)</SelectItem>
                        <SelectItem value="4k">4K (2160p)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-white/50 mt-1">
                      Higher resolutions require more bandwidth and processing
                      power.
                      {videoQuality === "4k" &&
                        " Not all cameras support 4K resolution."}
                    </p>
                    {lastResolutionError && (
                      <p className="text-xs text-amber-400 mt-1">
                        Note: {lastResolutionError}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="!text-white !bg-inherit !border-white/20 hover:!bg-white/10 w-full"
                      onClick={createTestRecording}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Current Quality
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">
                    Audio Settings
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="mic-select" className="text-white">
                      Microphone
                    </Label>
                    <Select value={selectedMic} onValueChange={setSelectedMic}>
                      <SelectTrigger
                        id="mic-select"
                        className="bg-gray-700 border-gray-600 text-white"
                      >
                        <SelectValue placeholder="Select microphone" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600 text-white">
                        {availableMics.map((mic) => (
                          <SelectItem
                            key={mic.deviceId}
                            value={
                              mic.deviceId ||
                              `mic-${availableMics.indexOf(mic)}`
                            }
                          >
                            {mic.label ||
                              `Microphone ${availableMics.indexOf(mic) + 1}`}
                          </SelectItem>
                        ))}
                        {availableMics.length === 0 && (
                          <SelectItem value="default-mic">
                            Default Microphone
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-white">Microphone Volume</Label>
                      <span className="text-sm text-white/70">80%</span>
                    </div>
                    <Slider
                      defaultValue={[0.8]}
                      max={1}
                      step={0.1}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <Button
                      variant="ghost"
                      className="!text-white !bg-inherit hover:!bg-white/10"
                      onClick={() => initializeStream()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Test Audio & Video
                    </Button>

                    <Button
                      variant="outline"
                      className="!text-white bg-inherit !border-white/20 hover:!bg-white/10"
                      onClick={() => setShowSettings(false)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Video Dialog */}
      <Dialog open={showTestVideo} onOpenChange={setShowTestVideo}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Test Recording</DialogTitle>
            <DialogDescription className="text-white/70">
              This is a test recording using your current quality settings (
              {videoQuality}).
              <br />
              Actual resolution: {actualResolution}
            </DialogDescription>
          </DialogHeader>
          {testVideoURL && (
            <div className="relative aspect-video bg-black overflow-hidden rounded-md">
              <video
                src={testVideoURL}
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
            </div>
          )}
          <DialogFooter>
            <Button
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={() => {
                if (testVideoURL) {
                  URL.revokeObjectURL(testVideoURL);
                  setTestVideoURL(null);
                }
                setShowTestVideo(false);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question progress - Simplified for mobile */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-t border-gray-700 py-2 sm:py-3 px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-white/70 text-xs sm:text-sm">
            Q{currentQuestionIndex + 1}/{totalQuestions}
          </span>
          <div className="w-20 sm:w-32 h-1.5 sm:h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-700 ease-out rounded-full"
              style={{
                width: `${
                  (currentQuestionIndex / (totalQuestions - 1)) * 100
                }%`,
                background: `linear-gradient(90deg, ${primaryColor}80 0%, ${primaryColor} 100%)`,
                boxShadow: `0 0 8px ${primaryColor}40`,
              }}
            ></div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {!isMobileView && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="!text-white hover:!bg-white/10 !h-8"
                    onClick={toggleFullscreen}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open fullscreen mode</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {recordingState === "reviewing" && !isMobileView && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 h-8"
                >
                  <Scissors className="h-4 w-4 mr-1" />
                  <span className="text-xs">Edit</span>
                  <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Scissors className="h-4 w-4 mr-2" />
                  <span>Trim Video</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  <span>Download Copy</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <ImagePlus className="h-4 w-4 mr-2" />
                  <span>Add Background</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {currentQuestionIndex > 0 && recordingState === "idle" && (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "!text-white !border-white/20 hover:!bg-white/10",
                isMobileView ? "h-7 px-2" : "h-8"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              {!isMobileView && <span>Previous</span>}
            </Button>
          )}

          {currentQuestionIndex < totalQuestions - 1 &&
            recordingState === "idle" && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "!text-white bg-inherit !border-white/20 hover:!bg-white/10",
                  isMobileView ? "h-7 px-2" : "h-8"
                )}
              >
                {!isMobileView && <span>Skip</span>}
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoRecorder;
