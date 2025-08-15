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
  Square,
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
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    <div className="min-h-screen w-full flex items-center justify-center bg-black">
      {/* Left column: Instructions and tips */}
      <div className="flex flex-col justify-center items-start w-full max-w-xs px-8 py-12">
        {/* Logo */}
        <div className="mb-8">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="h-8 w-8 rounded-md object-contain bg-white/90 p-1 shadow-lg"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-lg"
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
        </div>
        {/* Step and question */}
        <div className="mb-6">
          <div className="text-indigo-400 font-semibold text-sm mb-2">Step {currentQuestionIndex + 1} of {totalQuestions}</div>
          <div className="text-white text-2xl font-bold mb-2 leading-snug">{currentQuestion}</div>
        </div>
        {/* Tips checklist */}
        <div className="mb-8">
          <div className="text-indigo-300 font-medium mb-2">Tips:</div>
          <ul className="space-y-2">
            <li className="flex items-center text-white/80 text-base"><CheckCircle className="w-5 h-5 mr-2 text-indigo-400" />Pick a quiet and well-lit place</li>
            <li className="flex items-center text-white/80 text-base"><CheckCircle className="w-5 h-5 mr-2 text-indigo-400" />Relax & be yourself – it doesn’t have to be perfect</li>
            <li className="flex items-center text-white/80 text-base"><CheckCircle className="w-5 h-5 mr-2 text-indigo-400" />You can redo your recording if you’re not happy with it</li>
          </ul>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-auto">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>
      {/* Right column: Video preview and controls */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen py-12">
        <div
          ref={containerRef}
          className={cn(
            "relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-gray-800 flex flex-col items-center justify-center",
            "backdrop-blur-sm bg-opacity-95"
          )}
          style={{
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
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
                // Resize canvas to match video
                // if (canvasRef.current) { // Removed canvasRef usage
                //   canvasRef.current.width = videoRef.current.videoWidth;
                //   canvasRef.current.height = videoRef.current.videoHeight;
                // }
              }
            }}
          />
          {/* Face detection canvas overlay */}
          {/* Removed face detection canvas overlay */}
          {/* Face guide overlay if no face detected */}
          {/* Removed face guide overlay */}
          {/* Model error fallback */}
          {/* Removed model error fallback */}
          {/* Recording indicator */}
          {recordingState === "recording" && (
            <div className="absolute top-4 right-4 flex items-center gap-2 backdrop-blur-sm bg-black/40 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm z-10 shadow-lg border border-red-500/30">
              <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500 animate-pulse shadow-inner"></div>
              <span className="font-medium">REC</span>
              <span>{formatTime(recordingTime)}</span>
            </div>
          )}
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
          {/* Controls: floating mic/camera/settings */}
          <div className="absolute top-4 left-4 flex gap-3 z-20">
            <Button size="icon" variant="ghost" onClick={toggleCamera} className="bg-black/60 text-white hover:bg-black/80">
              {cameraEnabled ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6 text-red-500" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={toggleMicrophone} className="bg-black/60 text-white hover:bg-black/80">
              {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6 text-red-500" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setShowSettings(true)} className="bg-black/60 text-white hover:bg-black/80">
              <Settings className="w-6 h-6" />
            </Button>
          </div>
          {/* Large record button centered below video */}
          {(recordingState === "idle" || recordingState === "paused") && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
              <Button
                size="icon"
                className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl border-4 border-white/20 hover:scale-105 transition-transform duration-200"
                onClick={handleStartCountdown}
              >
                <PlayCircle className="w-12 h-12 text-white" />
              </Button>
              <span className="mt-3 text-white/80 text-base font-medium">Start Recording</span>
            </div>
          )}
          {/* Pause/Resume/Stop controls during recording */}
          {recordingState === "recording" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-6">
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-yellow-500/90 hover:bg-yellow-600 text-white shadow-xl"
                onClick={pauseRecording}
              >
                <PauseCircle className="w-10 h-10" />
              </Button>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-xl"
                onClick={stopRecording}
              >
                <Square className="w-10 h-10" />
              </Button>
            </div>
          )}
          {/* Resume button if paused */}
          {recordingState === "paused" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-6">
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-green-500/90 hover:bg-green-600 text-white shadow-xl"
                onClick={resumeRecording}
              >
                <PlayCircle className="w-10 h-10" />
              </Button>
              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-xl"
                onClick={stopRecording}
              >
                <Square className="w-10 h-10" />
              </Button>
            </div>
          )}
          {/* Processing and complete overlays remain unchanged */}
          {/* ... existing overlays ... */}
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoRecorder;
