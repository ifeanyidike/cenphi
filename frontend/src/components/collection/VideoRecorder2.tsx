import { useState, useRef, useEffect } from "react";

import {
  PlayCircle,
  CheckCircle,
  PauseCircle,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";

import { cn } from "@/lib/utils";


const questions = [
  (company: string) => `Can you share a specific moment or challenge where ${company} made a difference for you?`,
  () => "What are your favorite features or aspects of the product/service, and why?",
  (company: string) => `In what ways has ${company} improved your workflow, productivity, or results?`,
  () => "What measurable benefits or changes have you seen since using the product?",
  (company: string) => `If you were to recommend ${company} to a friend or colleague, what would you tell them?`,
  () => "Was there anything unexpected that impressed you about the experience?",
];

const totalQuestions = questions.length;

type VideoRecorder2Props = {
  companyName?: string;
  companyLogoUrl?: string;
  companyWebsite?: string;
  onRecordingComplete?: (blob: Blob) => void;
  maxDuration?: number;
};
const VideoRecorder2 = ({ companyName = "Your Company", companyLogoUrl = "", companyWebsite = "", ...props }: VideoRecorder2Props) => {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // Removed unused state
  // const [isMuted, setIsMuted] = useState(false);
  // const [isPlaying, setIsPlaying] = useState(false);
 
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMic, setSelectedMic] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const countdownTimerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulated recording blob for demonstration
  const recordedVideoURL = useRef<string | null>(null);

  useEffect(() => {
    if (window.innerWidth < 768) setIsMobileView(true);
    const checkIfMobile = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const initDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const mics = devices.filter((device) => device.kind === "audioinput");
        setSelectedCamera(cameras[0]?.deviceId || "");
        setSelectedMic(mics[0]?.deviceId || "");
        await initializeStream();
      } catch (err) {
        toast({
          title: "Device Access Error",
          description: "Unable to access camera or microphone. Please check your permissions.",
          variant: "destructive",
        });
      }
    };
    initDevices();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recordedVideoURL.current) URL.revokeObjectURL(recordedVideoURL.current);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedCamera || selectedMic) {
      initializeStream();
    }
    // eslint-disable-next-line
  }, [selectedCamera, selectedMic, isMobileView]);

  // Removed unused function
  // const handleToggleCamera = () => { ... }
  // const handleToggleMic = () => { ... }

  useEffect(() => {
    if (recordingState === "countdown") {
      if (countdown > 0) {
        countdownTimerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
      } else {
        startRecording();
      }
    }
    return () => {
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    };
  }, [recordingState, countdown]);

  let videoConstraints: any = {
    deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
  };
  const constraints = {
    video: videoConstraints,
    audio: selectedMic
      ? {
          deviceId: { exact: selectedMic },
          echoCancellation: true,
          noiseSuppression: true,
        }
      : false,
  };

  const initializeStream = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (isMobileView) {
        videoConstraints.width = { min: 480, ideal: 480 };
        videoConstraints.height = { min: 640, ideal: 640 };
      } else {
        videoConstraints.width = { min: 640, ideal: 640 };
        videoConstraints.height = { min: 480, ideal: 480 };
      }
      videoConstraints.frameRate = { min: 24, ideal: 30 };
      if (isMobileView) videoConstraints.facingMode = "user";
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera or microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStartCountdown = () => {
    setCountdown(3);
    setRecordingState("countdown");
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    let videoBitsPerSecond = 2500000;
    let options = {
      mimeType: "video/webm;codecs=vp9,opus",
      videoBitsPerSecond,
    };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = "video/webm;codecs=vp8,opus";
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "video/webm";
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = {} as any;
        }
      }
    }
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
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
      mediaRecorder.start(1000);
      setRecordingState("recording");
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      toast({
        title: "Recording Error",
        description: "Unable to start recording. Please try again or select a lower quality setting.",
        variant: "destructive",
      });
      setRecordingState("idle");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      setRecordingState("recording");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      (recordingState === "recording" || recordingState === "paused")
    ) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingState("reviewing");
    }
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Submitted!",
        description: "Your answers have been submitted.",
        className: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg border-0"
      });
    }, 1500);
  };

  // Favicon fallback logic
  let faviconUrl = "";
  if (!companyLogoUrl && companyWebsite) {
    try {
      const hostname = new URL(companyWebsite).hostname;
      faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {}
  }
  const siteFavicon = "/vite.svg";
  const logoToShow = companyLogoUrl || faviconUrl || siteFavicon;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative rounded-2xl">
      {/* Company logo at top right */}
      {logoToShow ? (
        <img
          src={logoToShow}
          alt={companyName}
          className="absolute top-6 right-8 z-50 h-12 w-12 object-contain rounded-md bg-white/90 p-1 shadow-lg"
          style={{ maxWidth: 56, maxHeight: 56 }}
        />
      ) : (
        <div
          className="absolute top-6 right-8 z-50 h-12 w-12 flex items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold shadow-lg"
          style={{ maxWidth: 56, maxHeight: 56 }}
        >
          {companyName.slice(0, 2).toUpperCase()}
        </div>
      )}
      {/* Left column: Instructions and tips */}
      <div className="flex flex-col justify-center items-start w-full max-w-xs px-8 py-12">
        {/* Step and question */}
        <div className="mb-6 w-full flex items-center justify-between">
          <div>
            <div className="text-indigo-400 font-semibold text-sm mb-2">Step {currentQuestionIndex + 1} of {totalQuestions}</div>
            <div className="text-white text-base font-semibold mb-2 leading-snug">
              {typeof questions[currentQuestionIndex] === "function"
                ? questions[currentQuestionIndex](companyName)
                : questions[currentQuestionIndex]}
            </div>
          </div>
          {/* Remove logo from here */}
        </div>
        {/* Tips checklist */}
        <div className="mb-8">
          <div className="text-indigo-300 font-medium mb-2">Tips:</div>
          <ul className="space-y-2">
            <li className="flex items-center text-white/80 text-sm"><CheckCircle className="w-3 h-3 mr-2 text-indigo-400" />Pick a quiet and well-lit place</li>
            <li className="flex items-center text-white/80 text-sm"><CheckCircle className="w-3 h-3 mr-2 text-indigo-400" />Relax & be yourself</li>
            <li className="flex items-center text-white/80 text-sm"><CheckCircle className="w-3 h-3 mr-2 text-indigo-400" />You can redo your recording</li>
          </ul>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-auto">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          ></div>
        </div>
        {/* Question navigation */}
        <div className="flex justify-between mt-8 w-full">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          {currentQuestionIndex < totalQuestions - 1 ? (
            <Button
              variant="default"
              onClick={() => setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="default"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          )}
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
          <video
            ref={videoRef}
            className={cn(
              "w-full h-full transition-all duration-500",
              isMobileView ? "object-cover" : "object-contain",
              "filter saturate-105"
            )}
            autoPlay
            playsInline
            // muted={recordingState !== "reviewing" || isMuted} // Remove isMuted reference
            muted={recordingState !== "reviewing"}
          />
          {/* Countdown Overlay */}
          {recordingState === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
              <span className="text-7xl font-bold text-white animate-pulse">{countdown}</span>
            </div>
          )}
          {/* Controls: floating mic/camera/settings */}
          



          {/* Large record button centered below video */}
          {(recordingState === "idle") && (
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
                className="w-12 h-12 rounded-full bg-black hover:bg-black text-white font-semibold shadow-xl"
                onClick={pauseRecording}
              >
                <PauseCircle className="w-10 h-10" />
              </Button>
              <Button
                size="icon"
                className="w-12 h-12 rounded-full bg-purple-500/90 hover:bg-purple-600 text-white shadow-xl"
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
                className="w-12 h-12 rounded-full bg-black hover:bg-black text-white shadow-xl"
                onClick={resumeRecording}
              >
                <PlayCircle className="w-10 h-10" />
              </Button>
              <Button
                size="icon"
                className="w-12 h-12 rounded-full bg-purple-600/90 hover:bg-purple-700 text-white shadow-xl"
                onClick={stopRecording}
              >
                <Square className="w-10 h-10" />
              </Button>
            </div>
          )}
          {/* Progress bar during recording */}
          {recordingState === "recording" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                style={{ width: `${(recordingTime / (props.maxDuration || 60)) * 100}%` }}
              />
            </div>
          )}
          {/* After recording: reviewing controls */}
          {recordingState === "reviewing" && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-4">
              <Button
                variant="outline"
                className="rounded-lg px-6 py-2 text-base font-semibold border-primary text-primary hover:bg-primary/10 flex items-center"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                  }
                }}
              >
                <PlayCircle className="mr-2 w-5 h-5" /> Play
              </Button>
              <Button
                variant="default"
                className="rounded-lg px-6 py-2 text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:from-indigo-600 hover:to-purple-700 flex items-center"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
              {currentQuestionIndex < totalQuestions - 1 && (
                <Button
                  variant="default"
                  className="rounded-lg px-6 py-2 text-base font-semibold text-white hover:bg-primary/90 flex items-center bg-gradient-to-r from-indigo-500 to-purple-600"
                  onClick={() => {
                    setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1));
                    setRecordingState("idle");
                    setRecordingTime(0);
                    if (recordedVideoURL.current) {
                      URL.revokeObjectURL(recordedVideoURL.current);
                      recordedVideoURL.current = null;
                    }
                    initializeStream();
                  }}
                >
                  Continue
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoRecorder2; 