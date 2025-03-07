import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  Dispatch,
  SetStateAction,
  FC,
} from "react";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  Timer,
  RefreshCcw,
  Download,
  Maximize2,
  Keyboard,
  Settings,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { observer } from "mobx-react-lite";
// Assume ProgressIndicator is a separate responsive component

export interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number;
  showGuideLines?: boolean;
  allowFilters?: boolean;
  quality?: "standard" | "high" | "ultra";
}

interface ShortcutActionParams {
  isRecording: boolean;
  preview: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  togglePause: () => void;
  retakeRecording: () => void;
  toggleFullscreen: () => void;
  setIsMuted: Dispatch<SetStateAction<boolean>>;
}

interface KeyboardShortcut {
  key: string;
  label: string;
  description: string;
  action: (params: ShortcutActionParams) => void;
  requiresRecording?: boolean;
  requiresPreview?: boolean;
}

const KEYBOARD_SHORTCUTS: { [name: string]: KeyboardShortcut } = {
  SPACE: {
    key: " ",
    label: "Space",
    description: "Start/Stop Recording",
    action: ({ isRecording, preview, startRecording, stopRecording }) => {
      if (!isRecording && !preview) startRecording();
      else if (isRecording) stopRecording();
    },
    requiresRecording: false,
  },
  PAUSE: {
    key: "p",
    label: "P",
    description: "Pause/Resume",
    action: ({ isRecording, togglePause }) => {
      if (isRecording) togglePause();
    },
    requiresRecording: true,
  },
  RETAKE: {
    key: "r",
    label: "R",
    description: "Retake",
    action: ({ preview, retakeRecording }) => {
      if (preview) retakeRecording();
    },
    requiresPreview: true,
  },
  FULLSCREEN: {
    key: "f",
    label: "F",
    description: "Toggle Fullscreen",
    action: ({ toggleFullscreen }) => toggleFullscreen(),
    requiresRecording: false,
  },
  MUTE: {
    key: "m",
    label: "M",
    description: "Toggle Mute",
    action: ({ setIsMuted }) => setIsMuted((prev) => !prev),
    requiresRecording: false,
  },
};

export const VideoRecorder: React.FC<VideoRecorderProps> = observer(
  ({
    onRecordingComplete,
    maxDuration = 300, // default to 5 minutes
    showGuideLines = true,
    quality = "high",
  }) => {
    // Refs for DOM and MediaRecorder
    const videoRef = useRef<HTMLVideoElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<number | null>(null);
    const audioAnalyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Component states
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [recordingQuality, setRecordingQuality] = useState<
      "standard" | "high" | "ultra"
    >(quality);
    const [brightness, setBrightness] = useState(1);
    const [contrast, setContrast] = useState(1);
    const [isNightMode, setIsNightMode] = useState(false);
    const [showGuidelines, setShowGuidelines] = useState(showGuideLines);
    const [cameraFacing, setCameraFacing] = useState<"user" | "environment">(
      "user"
    );
    const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
    const [lastUsedShortcut, setLastUsedShortcut] = useState<string | null>(
      null
    );
    const [isCameraActive, setIsCameraActive] = useState(false);

    const stopMediaTracks = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsCameraActive(false);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }, []);

    const stopRecording = useCallback(() => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setIsPaused(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }, [isRecording]);

    const togglePause = useCallback(() => {
      if (mediaRecorderRef.current && isRecording) {
        if (isPaused) {
          mediaRecorderRef.current.resume();
        } else {
          mediaRecorderRef.current.pause();
        }
        setIsPaused((prev) => !prev);
      }
    }, [isRecording, isPaused]);

    const retakeRecording = useCallback(() => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
      setPreview(null);
      setDuration(0);
      chunksRef.current = [];
      if (!isRecording) {
        reinitializeStream();
      }
    }, [preview, isRecording]);

    useEffect(() => {
      if (isRecording && !isPaused && audioAnalyserRef.current) {
        const dataArray = new Uint8Array(128);
        const updateAudioLevel = () => {
          audioAnalyserRef.current?.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(average);
          if (isRecording) {
            requestAnimationFrame(updateAudioLevel);
          }
        };
        updateAudioLevel();
      }
    }, [isRecording, isPaused]);

    const setupAudioAnalysis = useCallback((stream: MediaStream) => {
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioAnalyserRef.current = analyser;
    }, []);

    const getVideoConstraints = useCallback((): MediaTrackConstraints => {
      const qualitySettings = {
        standard: { width: 1280, height: 720 },
        high: { width: 1920, height: 1080 },
        ultra: { width: 3840, height: 2160 },
      };
      return {
        ...qualitySettings[recordingQuality],
        facingMode: cameraFacing,
        frameRate: recordingQuality === "ultra" ? 30 : 60,
      };
    }, [recordingQuality, cameraFacing]);

    const startRecording = useCallback(async () => {
      try {
        if (countdown !== null) {
          for (let i = countdown; i > 0; i--) {
            setCountdown(i);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          setCountdown(null);
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: getVideoConstraints(),
          audio: true,
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        setupAudioAnalysis(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        const options: MediaRecorderOptions = {
          mimeType: "video/webm;codecs=vp9,opus",
          videoBitsPerSecond: recordingQuality === "ultra" ? 8000000 : 4000000,
        };
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];
        mediaRecorder.ondataavailable = (event: BlobEvent) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          setPreview(url);
          onRecordingComplete(blob);
          stopMediaTracks();
        };
        mediaRecorder.start(1000);
        setIsRecording(true);
      } catch (err) {
        console.error("Error starting recording:", err);
        setError("Could not access camera or microphone");
      }
    }, [
      maxDuration,
      onRecordingComplete,
      countdown,
      getVideoConstraints,
      setupAudioAnalysis,
      stopMediaTracks,
      recordingQuality,
    ]);

    useEffect(() => {
      if (isRecording && !isPaused) {
        timerRef.current = setInterval(() => {
          setDuration((prev) => {
            if (prev >= maxDuration) {
              stopRecording();
              return prev;
            }
            return prev + 1;
          });
        }, 1000);
      } else if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [isRecording, isPaused, maxDuration, stopRecording]);

    const toggleFullscreen = useCallback(() => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.error);
      } else {
        document.exitFullscreen().catch(console.error);
      }
    }, []);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.style.filter = `brightness(${brightness}) contrast(${contrast}) ${
          isNightMode ? "hue-rotate(180deg)" : ""
        }`;
      }
    }, [brightness, contrast, isNightMode]);

    const reinitializeStream = useCallback(async () => {
      if (!isRecording) {
        stopMediaTracks();
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: getVideoConstraints(),
            audio: true,
          });
          streamRef.current = stream;
          setIsCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setupAudioAnalysis(stream);
        } catch (err) {
          console.error("Error reinitializing stream:", err);
          setError("Could not access camera or microphone");
        }
      }
    }, [isRecording, getVideoConstraints, stopMediaTracks, setupAudioAnalysis]);

    useEffect(() => {
      reinitializeStream();
    }, [cameraFacing, recordingQuality, reinitializeStream]);

    useEffect(() => {
      if (preview && previewVideoRef.current) {
        previewVideoRef.current.load();
      }
    }, [preview]);

    useEffect(() => {
      const handleKeyPress = (e: globalThis.KeyboardEvent) => {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        )
          return;
        const shortcut = Object.values(KEYBOARD_SHORTCUTS).find(
          (s) => s.key === e.key.toLowerCase()
        );
        if (shortcut) {
          e.preventDefault();
          if (shortcut.requiresRecording && !isRecording) return;
          if (shortcut.requiresPreview && !preview) return;
          shortcut.action({
            isRecording,
            preview,
            startRecording,
            stopRecording,
            togglePause,
            retakeRecording,
            toggleFullscreen,
            setIsMuted,
          });
          setLastUsedShortcut(shortcut.label);
          setTimeout(() => setLastUsedShortcut(null), 1000);
        }
      };
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }, [
      isRecording,
      preview,
      startRecording,
      stopRecording,
      togglePause,
      retakeRecording,
      toggleFullscreen,
    ]);

    return (
      <div
        className={`flex flex-col items-center space-y-4 ${
          isNightMode ? "bg-gray-900" : "bg-white"
        } p-4 sm:p-8`}
      >
        <div className="relative w-full sm:max-w-4xl aspect-video rounded-lg overflow-hidden shadow-lg">
          {showGuidelines && !preview && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full border-4 border-white/30 rounded-lg" />
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>
            </div>
          )}
          {preview ? (
            <video
              ref={previewVideoRef}
              src={preview}
              autoPlay
              muted
              playsInline
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
              />
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                  <p className="text-white text-lg">
                    Click "Start Recording" to begin
                  </p>
                </div>
              )}
            </>
          )}
          {!preview && (
            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Timer className="!w-3 md:w-4 !h-3 md:h-4 text-white" />
                  <span className="text-white font-medium text-sm md:text-base">
                    {Math.floor(duration / 60)}:
                    {(duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex space-x-1 md:space-x-2">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      variant="default"
                      size="sm"
                      disabled={duration >= maxDuration}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Play className=" w-4 h-4 md:mr-2" />
                      <span className="hidden md:block">Start Recording</span>
                      <span className="block md:hidden"> Start</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={togglePause}
                        variant="secondary"
                        size="sm"
                      >
                        {isPaused ? (
                          <Play className="!w-3 md:!w-4 !h-3 md:!h-4" />
                        ) : (
                          <Pause className="!w-3 md:!w-4 !h-3 md:!h-4" />
                        )}
                      </Button>
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        size="sm"
                      >
                        <Square className="!w-3 md:!w-4 !h-3 md:!h-4" />
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex items-center space-x-0 md:space-x-2">
                  <Button
                    onClick={() => setIsMuted((prev) => !prev)}
                    variant="ghost"
                    size="sm"
                    className="text-white"
                  >
                    {isMuted ? (
                      <VolumeX className="!w-3 md:!w-4 !h-3 md:!h-4" />
                    ) : (
                      <Volume2 className="!w-3 md:!w-4 !h-3 md:!h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={toggleFullscreen}
                    variant="ghost"
                    size="sm"
                    className="text-white"
                  >
                    <Maximize2 className="!w-3 md:!w-4 !h-3 md:!h-4" />
                  </Button>
                  <Dialog open={showSettings} onOpenChange={setShowSettings}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-white">
                        <Settings className="!w-3 md:!w-4 !h-3 md:!h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recording Settings</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 p-4">
                        <div className="flex items-center justify-between">
                          <span>Quality</span>
                          <select
                            value={recordingQuality}
                            onChange={(e) =>
                              setRecordingQuality(
                                e.target.value as "standard" | "high" | "ultra"
                              )
                            }
                            className="p-2 rounded"
                          >
                            <option value="standard">Standard (720p)</option>
                            <option value="high">High (1080p)</option>
                            <option value="ultra">Ultra (4K)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label>Brightness</label>
                          <Slider
                            value={[brightness]}
                            min={0.5}
                            max={1.5}
                            step={0.1}
                            onValueChange={([value]) => setBrightness(value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label>Contrast</label>
                          <Slider
                            value={[contrast]}
                            min={0.5}
                            max={1.5}
                            step={0.1}
                            onValueChange={([value]) => setContrast(value)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Night Mode</span>
                          <Switch
                            checked={isNightMode}
                            onCheckedChange={setIsNightMode}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Guidelines</span>
                          <Switch
                            checked={showGuidelines}
                            onCheckedChange={setShowGuidelines}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Camera</span>
                          <Button
                            onClick={() =>
                              setCameraFacing((prev) =>
                                prev === "user" ? "environment" : "user"
                              )
                            }
                            variant="outline"
                            size="sm"
                          >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Switch Camera
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          )}

          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-6xl text-white font-bold">{countdown}</span>
            </div>
          )}
        </div>

        <div className="w-full relative">
          {preview ? (
            <div className="flex justify-center gap-4">
              <Button onClick={retakeRecording} variant="secondary" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
              <Button
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = preview;
                  a.download = "testimonial.webm";
                  a.click();
                }}
                variant="default"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                onClick={toggleFullscreen}
                variant="ghost"
                size="sm"
                className="text-gray-700 bg-gray-100"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-700">
                {Math.floor(duration / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(duration % 60).toString().padStart(2, "0")}
              </span>
              <div className="relative flex-1">
                <div className="bg-gray-300 rounded-full h-2 shadow-inner overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(duration / maxDuration) * 100}%`,
                      background: "linear-gradient(to right, #f87171, #fbbf24)",
                    }}
                  />
                  {isRecording && (
                    <div className="absolute -top-2 right-0 w-3 h-3 rounded-full bg-red-600 animate-pulse border-2 border-white" />
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-700">
                {Math.floor(maxDuration / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(maxDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        {isRecording && !isPaused && (
          <div className="w-full flex justify-center">
            <div className="flex flex-col items-center w-full md:w-1/2">
              <span className="text-xs font-semibold text-gray-700 mb-1">
                Audio Level
              </span>
              <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${(audioLevel / 255) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {isRecording && !isPaused && (
          <Alert className="mt-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Recording in progress - {recordingQuality} quality
            </AlertDescription>
          </Alert>
        )}
        {isPaused && (
          <Alert className="mt-4 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-yellow-700">
              Recording paused
            </AlertDescription>
          </Alert>
        )}

        {!isRecording && !preview && (
          <div className="text-sm text-gray-500 mt-4 space-y-2">
            <p>• Ensure good lighting and minimal background noise</p>
            <p>• Look directly at the camera for better engagement</p>
            <p>• Keep your device steady during recording</p>
            <p>
              • Maximum recording time: {Math.floor(maxDuration / 60)} minutes
            </p>
          </div>
        )}
        <div className="text-xs text-gray-400 mt-4">
          Keyboard shortcuts: Space (Start/Stop) • P (Pause) • R (Retake) • F
          (Fullscreen)
        </div>
        <div className="mt-4">
          <ShortcutsHelp
            lastUsedShortcut={lastUsedShortcut}
            showShortcutsDialog={showShortcutsDialog}
            setShowShortcutsDialog={setShowShortcutsDialog}
          />
        </div>
      </div>
    );
  }
);

export default VideoRecorder;

const ShortcutsHelp: FC<{
  showShortcutsDialog: boolean;
  setShowShortcutsDialog: (value: boolean) => void;
  lastUsedShortcut: string | null;
}> = React.memo(
  ({ showShortcutsDialog, setShowShortcutsDialog, lastUsedShortcut }) => (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-400 hover:text-gray-600"
        onClick={() => {
          setShowShortcutsDialog(true);
        }}
      >
        <Keyboard className="w-4 h-4 mr-2" />
        Keyboard Shortcuts
      </Button>
      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {Object.values(KEYBOARD_SHORTCUTS).map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex justify-between items-center"
              >
                <span className="text-gray-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-sm">
                  {shortcut.label}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      {lastUsedShortcut && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-out">
          Shortcut: {lastUsedShortcut}
        </div>
      )}
    </>
  )
);
