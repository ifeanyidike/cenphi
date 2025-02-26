import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Mic,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Settings,
  Timer,
  CheckCircle2,
  AlertCircle,
  Keyboard,
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
} from "@/components/ui/dialog";

// Keyboard shortcut type
interface ShortcutActionParams {
  isRecording: boolean;
  preview: string | null;
  startRecording: () => void;
  stopRecording: () => void;
  togglePause: () => void;
  retakeRecording: () => void;
}
interface KeyboardShortcut {
  key: string;
  label: string;
  description: string;
  action: (params: ShortcutActionParams) => void;
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
  },
  PAUSE: {
    key: "p",
    label: "P",
    description: "Pause/Resume",
    action: ({ isRecording, togglePause }) => {
      if (isRecording) togglePause();
    },
  },
  RETAKE: {
    key: "r",
    label: "R",
    description: "Retake Recording",
    action: ({ preview, retakeRecording }) => {
      if (preview) retakeRecording();
    },
  },
};

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number;
  quality?: "standard" | "high" | "ultra";
  noiseReduction?: boolean;
  echoCancellation?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 300,
  quality = "high",
  noiseReduction = true,
  echoCancellation = true,
}) => {
  // Refs for DOM and media processing
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // State variables
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(
    new Uint8Array()
  );
  const [gain, setGain] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [lastUsedShortcut, setLastUsedShortcut] = useState<string | null>(null);
  const [recordingQuality, setRecordingQuality] = useState<
    "standard" | "high" | "ultra"
  >(quality);
  const [isNoiseReductionEnabled, setIsNoiseReductionEnabled] =
    useState(noiseReduction);
  const [isEchoCancellationEnabled, setIsEchoCancellationEnabled] =
    useState(echoCancellation);

  // Stop media tracks and close audio context
  const stopMediaTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Update visualization of audio (frequency and level)
  const updateVisualization = useCallback(() => {
    if (analyserRef.current && isRecording && !isPaused) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      setFrequencyData(dataArray);
      // const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      // setAudioLevel(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateVisualization);
    }
  }, [isRecording, isPaused]);

  // Stop recording and clear timers/animations
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
    }
  }, [isRecording]);

  // Toggle pause/resume recording
  const togglePause = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        updateVisualization();
      } else {
        mediaRecorderRef.current.pause();
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
      }
      setIsPaused((prev) => !prev);
    }
  }, [isRecording, isPaused, updateVisualization]);

  // Retake recording: clear preview and reset state
  const retakeRecording = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setDuration(0);
    chunksRef.current = [];
  }, [preview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [stopMediaTracks, preview]);

  // Get audio constraints based on quality and noise/echo settings
  const getAudioConstraints = useCallback(() => {
    const qualitySettings = {
      standard: { sampleRate: 44100, sampleSize: 16 },
      high: { sampleRate: 48000, sampleSize: 24 },
      ultra: { sampleRate: 96000, sampleSize: 32 },
    };
    return {
      echoCancellation: isEchoCancellationEnabled,
      noiseSuppression: isNoiseReductionEnabled,
      autoGainControl: true,
      ...qualitySettings[recordingQuality],
    };
  }, [recordingQuality, isNoiseReductionEnabled, isEchoCancellationEnabled]);

  // Start recording: get stream, set up audio chain, start MediaRecorder, and begin visualization and timer
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: getAudioConstraints(),
      });
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const gainNode = audioContextRef.current.createGain();
      const analyser = audioContextRef.current.createAnalyser();

      gainNode.gain.value = gain;
      analyser.fftSize = 256;

      source.connect(gainNode);
      gainNode.connect(analyser);
      analyserRef.current = analyser;

      const options: MediaRecorderOptions = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: recordingQuality === "ultra" ? 256000 : 128000,
      };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setPreview(url);
        onRecordingComplete(blob);
        stopMediaTracks();
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      updateVisualization();

      //   timerRef.current = setInterval(() => {
      //     setDuration((prev) => {
      //       if (prev >= maxDuration) {
      //         stopRecording();
      //         return prev;
      //       }
      //       return prev + 1;
      //     });
      //   }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Could not access microphone");
    }
  }, [
    maxDuration,
    onRecordingComplete,
    gain,
    getAudioConstraints,
    updateVisualization,
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

  // Keyboard shortcuts implementation for audio recorder
  useEffect(() => {
    const handleKeyPress = (e: globalThis.KeyboardEvent) => {
      // Ignore if focus is on an input or textarea
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
        // Execute action if conditions are met
        shortcut.action({
          isRecording,
          preview,
          startRecording,
          stopRecording,
          togglePause,
          retakeRecording,
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
  ]);

  // Audio visualizer component
  const AudioVisualizer = () => (
    <div className="h-32 w-full bg-gray-800 rounded-lg overflow-hidden">
      <div className="h-full flex items-end justify-center space-x-1">
        {[...Array(32)].map((_, i) => {
          const value = frequencyData[i * 4] || 0;
          return (
            <div
              key={i}
              className="w-2 bg-primary rounded transition-all duration-50"
              style={{
                height: `${(value / 255) * 100}%`,
                opacity: isRecording && !isPaused ? 1 : 0.3,
              }}
            />
          );
        })}
      </div>
    </div>
  );

  // Settings dialog component
  const SettingsDialog = () => (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
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
              <option value="standard">Standard (44.1kHz)</option>
              <option value="high">High (48kHz)</option>
              <option value="ultra">Ultra (96kHz)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label>Input Gain</label>
            <Slider
              value={[gain]}
              min={0}
              max={2}
              step={0.1}
              onValueChange={([value]) => setGain(value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Noise Reduction</span>
            <Switch
              checked={isNoiseReductionEnabled}
              onCheckedChange={setIsNoiseReductionEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Echo Cancellation</span>
            <Switch
              checked={isEchoCancellationEnabled}
              onCheckedChange={setIsEchoCancellationEnabled}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Shortcuts help component to display keyboard shortcuts overlay
  const ShortcutsHelp = () => (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowShortcutsDialog(true)}
        className="text-gray-400 hover:text-gray-600"
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
  );

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-full max-w-2xl p-6 rounded-lg bg-gray-900 shadow-xl">
        <AudioVisualizer />
        {preview && (
          <div className="my-4">
            <audio ref={audioRef} src={preview} controls className="w-full" />
          </div>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-white" />
            <span className="text-white font-medium">
              {Math.floor(duration / 60)}:
              {(duration % 60).toString().padStart(2, "0")}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {preview ? (
              <>
                <Button onClick={retakeRecording} variant="secondary" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = preview;
                    a.download = "audio-testimonial.webm";
                    a.click();
                  }}
                  variant="default"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </>
            ) : !isRecording ? (
              <Button
                onClick={startRecording}
                variant="default"
                size="sm"
                className="bg-red-500 hover:bg-red-600"
                disabled={duration >= maxDuration}
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <>
                <Button onClick={togglePause} variant="secondary" size="sm">
                  {isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="sm">
                  <Square className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-white"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Improved Progress Bar */}
      <div className="w-full relative">
        <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-full h-3 shadow-inner overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out relative"
            style={{
              width: `${(duration / maxDuration) * 100}%`,
              background: "linear-gradient(to right, #60a5fa, #3b82f6)",
            }}
          >
            {[...Array(Math.floor(maxDuration / 60) + 1)].map((_, index) => (
              <div
                key={index}
                className="absolute -top-6 text-xs text-gray-700 font-semibold"
                style={{
                  left: `${((index * 60) / maxDuration) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {index}m
              </div>
            ))}
            {isRecording && (
              <div className="absolute -top-2 right-0 w-3 h-3 rounded-full bg-red-600 animate-pulse border-2 border-white" />
            )}
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isRecording && !isPaused && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            Recording in progress - {recordingQuality} quality
          </AlertDescription>
        </Alert>
      )}

      <SettingsDialog />

      <ShortcutsHelp />

      {/* Recording Tips */}
      {!isRecording && !preview && (
        <div className="text-sm text-gray-500 space-y-2">
          <p>• Speak clearly and at a consistent volume</p>
          <p>• Keep the microphone at a consistent distance</p>
          <p>• Avoid background noise and echo</p>
          <p>• Test your audio settings before recording</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
