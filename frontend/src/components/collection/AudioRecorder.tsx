// import React, { useRef, useEffect, useState, useCallback } from "react";
// import {
//   Mic,
//   Play,
//   Pause,
//   Square,
//   RotateCcw,
//   Download,
//   Settings,
//   Timer,
//   CheckCircle2,
//   AlertCircle,
//   Keyboard,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";
// import { Switch } from "@/components/ui/switch";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";

// // Keyboard shortcut type
// interface ShortcutActionParams {
//   isRecording: boolean;
//   preview: string | null;
//   startRecording: () => void;
//   stopRecording: () => void;
//   togglePause: () => void;
//   retakeRecording: () => void;
// }
// interface KeyboardShortcut {
//   key: string;
//   label: string;
//   description: string;
//   action: (params: ShortcutActionParams) => void;
// }

// const KEYBOARD_SHORTCUTS: { [name: string]: KeyboardShortcut } = {
//   SPACE: {
//     key: " ",
//     label: "Space",
//     description: "Start/Stop Recording",
//     action: ({ isRecording, preview, startRecording, stopRecording }) => {
//       if (!isRecording && !preview) startRecording();
//       else if (isRecording) stopRecording();
//     },
//   },
//   PAUSE: {
//     key: "p",
//     label: "P",
//     description: "Pause/Resume",
//     action: ({ isRecording, togglePause }) => {
//       if (isRecording) togglePause();
//     },
//   },
//   RETAKE: {
//     key: "r",
//     label: "R",
//     description: "Retake Recording",
//     action: ({ preview, retakeRecording }) => {
//       if (preview) retakeRecording();
//     },
//   },
// };

// interface AudioRecorderProps {
//   onRecordingComplete: (blob: Blob) => void;
//   maxDuration?: number;
//   quality?: "standard" | "high" | "ultra";
//   noiseReduction?: boolean;
//   echoCancellation?: boolean;
// }

// export const AudioRecorder: React.FC<AudioRecorderProps> = ({
//   onRecordingComplete,
//   maxDuration = 300,
//   quality = "high",
//   noiseReduction = true,
//   echoCancellation = true,
// }) => {
//   // Refs for DOM and media processing
//   const audioRef = useRef<HTMLAudioElement>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const chunksRef = useRef<Blob[]>([]);
//   const streamRef = useRef<MediaStream | null>(null);
//   const timerRef = useRef<number | null>(null);
//   const analyserRef = useRef<AnalyserNode | null>(null);
//   const animationFrameRef = useRef<number | null>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);

//   // State variables
//   const [isRecording, setIsRecording] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const [duration, setDuration] = useState(0);
//   const [preview, setPreview] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   // const [audioLevel, setAudioLevel] = useState(0);
//   const [frequencyData, setFrequencyData] = useState<Uint8Array>(
//     new Uint8Array()
//   );
//   const [gain, setGain] = useState(1);
//   const [showSettings, setShowSettings] = useState(false);
//   const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
//   const [lastUsedShortcut, setLastUsedShortcut] = useState<string | null>(null);
//   const [recordingQuality, setRecordingQuality] = useState<
//     "standard" | "high" | "ultra"
//   >(quality);
//   const [isNoiseReductionEnabled, setIsNoiseReductionEnabled] =
//     useState(noiseReduction);
//   const [isEchoCancellationEnabled, setIsEchoCancellationEnabled] =
//     useState(echoCancellation);

//   // Stop media tracks and close audio context
//   const stopMediaTracks = useCallback(() => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach((track) => track.stop());
//       streamRef.current = null;
//     }
//     if (audioContextRef.current) {
//       audioContextRef.current.close();
//       audioContextRef.current = null;
//     }
//   }, []);

//   // Update visualization of audio (frequency and level)
//   const updateVisualization = useCallback(() => {
//     if (analyserRef.current && isRecording && !isPaused) {
//       const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
//       analyserRef.current.getByteFrequencyData(dataArray);
//       setFrequencyData(dataArray);
//       // const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
//       // setAudioLevel(average / 255);
//       animationFrameRef.current = requestAnimationFrame(updateVisualization);
//     }
//   }, [isRecording, isPaused]);

//   // Stop recording and clear timers/animations
//   const stopRecording = useCallback(() => {
//     if (mediaRecorderRef.current && isRecording) {
//       mediaRecorderRef.current.stop();
//       setIsRecording(false);
//       setIsPaused(false);
//       if (timerRef.current) clearInterval(timerRef.current);
//       if (animationFrameRef.current)
//         cancelAnimationFrame(animationFrameRef.current);
//     }
//   }, [isRecording]);

//   // Toggle pause/resume recording
//   const togglePause = useCallback(() => {
//     if (mediaRecorderRef.current && isRecording) {
//       if (isPaused) {
//         mediaRecorderRef.current.resume();
//         updateVisualization();
//       } else {
//         mediaRecorderRef.current.pause();
//         if (animationFrameRef.current)
//           cancelAnimationFrame(animationFrameRef.current);
//       }
//       setIsPaused((prev) => !prev);
//     }
//   }, [isRecording, isPaused, updateVisualization]);

//   // Retake recording: clear preview and reset state
//   const retakeRecording = useCallback(() => {
//     if (preview) URL.revokeObjectURL(preview);
//     setPreview(null);
//     setDuration(0);
//     chunksRef.current = [];
//   }, [preview]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       stopMediaTracks();
//       if (timerRef.current) clearInterval(timerRef.current);
//       if (animationFrameRef.current)
//         cancelAnimationFrame(animationFrameRef.current);
//       if (preview) URL.revokeObjectURL(preview);
//     };
//   }, [stopMediaTracks, preview]);

//   // Get audio constraints based on quality and noise/echo settings
//   const getAudioConstraints = useCallback(() => {
//     const qualitySettings = {
//       standard: { sampleRate: 44100, sampleSize: 16 },
//       high: { sampleRate: 48000, sampleSize: 24 },
//       ultra: { sampleRate: 96000, sampleSize: 32 },
//     };
//     return {
//       echoCancellation: isEchoCancellationEnabled,
//       noiseSuppression: isNoiseReductionEnabled,
//       autoGainControl: true,
//       ...qualitySettings[recordingQuality],
//     };
//   }, [recordingQuality, isNoiseReductionEnabled, isEchoCancellationEnabled]);

//   // Start recording: get stream, set up audio chain, start MediaRecorder, and begin visualization and timer
//   const startRecording = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: getAudioConstraints(),
//       });
//       streamRef.current = stream;
//       audioContextRef.current = new AudioContext();

//       const source = audioContextRef.current.createMediaStreamSource(stream);
//       const gainNode = audioContextRef.current.createGain();
//       const analyser = audioContextRef.current.createAnalyser();

//       gainNode.gain.value = gain;
//       analyser.fftSize = 256;

//       source.connect(gainNode);
//       gainNode.connect(analyser);
//       analyserRef.current = analyser;

//       const options: MediaRecorderOptions = {
//         mimeType: "audio/webm;codecs=opus",
//         audioBitsPerSecond: recordingQuality === "ultra" ? 256000 : 128000,
//       };
//       const mediaRecorder = new MediaRecorder(stream, options);
//       mediaRecorderRef.current = mediaRecorder;
//       chunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           chunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = () => {
//         const blob = new Blob(chunksRef.current, { type: "audio/webm" });
//         const url = URL.createObjectURL(blob);
//         setPreview(url);
//         onRecordingComplete(blob);
//         stopMediaTracks();
//       };

//       mediaRecorder.start(1000);
//       setIsRecording(true);
//       updateVisualization();

//       //   timerRef.current = setInterval(() => {
//       //     setDuration((prev) => {
//       //       if (prev >= maxDuration) {
//       //         stopRecording();
//       //         return prev;
//       //       }
//       //       return prev + 1;
//       //     });
//       //   }, 1000);
//     } catch (err) {
//       console.error("Error starting recording:", err);
//       setError("Could not access microphone");
//     }
//   }, [
//     maxDuration,
//     onRecordingComplete,
//     gain,
//     getAudioConstraints,
//     updateVisualization,
//   ]);

//   useEffect(() => {
//     if (isRecording && !isPaused) {
//       timerRef.current = setInterval(() => {
//         setDuration((prev) => {
//           if (prev >= maxDuration) {
//             stopRecording();
//             return prev;
//           }
//           return prev + 1;
//         });
//       }, 1000);
//     } else if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//     return () => {
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//         timerRef.current = null;
//       }
//     };
//   }, [isRecording, isPaused, maxDuration, stopRecording]);

//   // Keyboard shortcuts implementation for audio recorder
//   useEffect(() => {
//     const handleKeyPress = (e: globalThis.KeyboardEvent) => {
//       // Ignore if focus is on an input or textarea
//       if (
//         e.target instanceof HTMLInputElement ||
//         e.target instanceof HTMLTextAreaElement
//       )
//         return;
//       const shortcut = Object.values(KEYBOARD_SHORTCUTS).find(
//         (s) => s.key === e.key.toLowerCase()
//       );
//       if (shortcut) {
//         e.preventDefault();
//         // Execute action if conditions are met
//         shortcut.action({
//           isRecording,
//           preview,
//           startRecording,
//           stopRecording,
//           togglePause,
//           retakeRecording,
//         });
//         setLastUsedShortcut(shortcut.label);
//         setTimeout(() => setLastUsedShortcut(null), 1000);
//       }
//     };
//     window.addEventListener("keydown", handleKeyPress);
//     return () => window.removeEventListener("keydown", handleKeyPress);
//   }, [
//     isRecording,
//     preview,
//     startRecording,
//     stopRecording,
//     togglePause,
//     retakeRecording,
//   ]);

//   // Audio visualizer component
//   const AudioVisualizer = () => (
//     <div className="h-32 w-full bg-gray-800 rounded-lg overflow-hidden">
//       <div className="h-full flex items-end justify-center space-x-1">
//         {[...Array(32)].map((_, i) => {
//           const value = frequencyData[i * 4] || 0;
//           return (
//             <div
//               key={i}
//               className="w-2 bg-primary rounded transition-all duration-50"
//               style={{
//                 height: `${(value / 255) * 100}%`,
//                 opacity: isRecording && !isPaused ? 1 : 0.3,
//               }}
//             />
//           );
//         })}
//       </div>
//     </div>
//   );

//   // Settings dialog component
//   const SettingsDialog = () => (
//     <Dialog open={showSettings} onOpenChange={setShowSettings}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Recording Settings</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4 p-4">
//           <div className="flex items-center justify-between">
//             <span>Quality</span>
//             <select
//               value={recordingQuality}
//               onChange={(e) =>
//                 setRecordingQuality(
//                   e.target.value as "standard" | "high" | "ultra"
//                 )
//               }
//               className="p-2 rounded"
//             >
//               <option value="standard">Standard (44.1kHz)</option>
//               <option value="high">High (48kHz)</option>
//               <option value="ultra">Ultra (96kHz)</option>
//             </select>
//           </div>
//           <div className="space-y-2">
//             <label>Input Gain</label>
//             <Slider
//               value={[gain]}
//               min={0}
//               max={2}
//               step={0.1}
//               onValueChange={([value]) => setGain(value)}
//             />
//           </div>
//           <div className="flex items-center justify-between">
//             <span>Noise Reduction</span>
//             <Switch
//               checked={isNoiseReductionEnabled}
//               onCheckedChange={setIsNoiseReductionEnabled}
//             />
//           </div>
//           <div className="flex items-center justify-between">
//             <span>Echo Cancellation</span>
//             <Switch
//               checked={isEchoCancellationEnabled}
//               onCheckedChange={setIsEchoCancellationEnabled}
//             />
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );

//   // Shortcuts help component to display keyboard shortcuts overlay
//   const ShortcutsHelp = () => (
//     <>
//       <Button
//         variant="ghost"
//         size="sm"
//         onClick={() => setShowShortcutsDialog(true)}
//         className="text-gray-400 hover:text-gray-600"
//       >
//         <Keyboard className="w-4 h-4 mr-2" />
//         Keyboard Shortcuts
//       </Button>
//       <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Keyboard Shortcuts</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             {Object.values(KEYBOARD_SHORTCUTS).map((shortcut) => (
//               <div
//                 key={shortcut.key}
//                 className="flex justify-between items-center"
//               >
//                 <span className="text-gray-600">{shortcut.description}</span>
//                 <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-sm">
//                   {shortcut.label}
//                 </kbd>
//               </div>
//             ))}
//           </div>
//         </DialogContent>
//       </Dialog>
//       {lastUsedShortcut && (
//         <div className="fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-out">
//           Shortcut: {lastUsedShortcut}
//         </div>
//       )}
//     </>
//   );

//   return (
//     <div className="flex flex-col items-center space-y-4">
//       <div className="w-full max-w-2xl p-6 rounded-lg bg-gray-900 shadow-xl">
//         <AudioVisualizer />
//         {preview && (
//           <div className="my-4">
//             <audio ref={audioRef} src={preview} controls className="w-full" />
//           </div>
//         )}
//         <div className="flex items-center justify-between mt-4">
//           <div className="flex items-center space-x-2">
//             <Timer className="w-4 h-4 text-white" />
//             <span className="text-white font-medium">
//               {Math.floor(duration / 60)}:
//               {(duration % 60).toString().padStart(2, "0")}
//             </span>
//           </div>
//           <div className="flex items-center space-x-2">
//             {preview ? (
//               <>
//                 <Button onClick={retakeRecording} variant="secondary" size="sm">
//                   <RotateCcw className="w-4 h-4 mr-2" />
//                   Retake
//                 </Button>
//                 <Button
//                   onClick={() => {
//                     const a = document.createElement("a");
//                     a.href = preview;
//                     a.download = "audio-testimonial.webm";
//                     a.click();
//                   }}
//                   variant="default"
//                   size="sm"
//                 >
//                   <Download className="w-4 h-4 mr-2" />
//                   Download
//                 </Button>
//               </>
//             ) : !isRecording ? (
//               <Button
//                 onClick={startRecording}
//                 variant="default"
//                 size="sm"
//                 className="bg-red-500 hover:bg-red-600"
//                 disabled={duration >= maxDuration}
//               >
//                 <Mic className="w-4 h-4 mr-2" />
//                 Start Recording
//               </Button>
//             ) : (
//               <>
//                 <Button onClick={togglePause} variant="secondary" size="sm">
//                   {isPaused ? (
//                     <Play className="w-4 h-4" />
//                   ) : (
//                     <Pause className="w-4 h-4" />
//                   )}
//                 </Button>
//                 <Button onClick={stopRecording} variant="destructive" size="sm">
//                   <Square className="w-4 h-4" />
//                 </Button>
//               </>
//             )}
//             <Button
//               variant="ghost"
//               size="sm"
//               className="text-white"
//               onClick={() => setShowSettings(true)}
//             >
//               <Settings className="w-4 h-4" />
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Improved Progress Bar */}
//       <div className="w-full relative">
//         <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-full h-3 shadow-inner overflow-hidden">
//           <div
//             className="h-full rounded-full transition-all duration-500 ease-out relative"
//             style={{
//               width: `${(duration / maxDuration) * 100}%`,
//               background: "linear-gradient(to right, #60a5fa, #3b82f6)",
//             }}
//           >
//             {[...Array(Math.floor(maxDuration / 60) + 1)].map((_, index) => (
//               <div
//                 key={index}
//                 className="absolute -top-6 text-xs text-gray-700 font-semibold"
//                 style={{
//                   left: `${((index * 60) / maxDuration) * 100}%`,
//                   transform: "translateX(-50%)",
//                 }}
//               >
//                 {index}m
//               </div>
//             ))}
//             {isRecording && (
//               <div className="absolute -top-2 right-0 w-3 h-3 rounded-full bg-red-600 animate-pulse border-2 border-white" />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Status Alerts */}
//       {error && (
//         <Alert variant="destructive">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{error}</AlertDescription>
//         </Alert>
//       )}
//       {isRecording && !isPaused && (
//         <Alert className="bg-green-50 border-green-200">
//           <CheckCircle2 className="h-4 w-4 text-green-500" />
//           <AlertDescription className="text-green-700">
//             Recording in progress - {recordingQuality} quality
//           </AlertDescription>
//         </Alert>
//       )}

//       <SettingsDialog />

//       <ShortcutsHelp />

//       {/* Recording Tips */}
//       {!isRecording && !preview && (
//         <div className="text-sm text-gray-500 space-y-2">
//           <p>• Speak clearly and at a consistent volume</p>
//           <p>• Keep the microphone at a consistent distance</p>
//           <p>• Avoid background noise and echo</p>
//           <p>• Test your audio settings before recording</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AudioRecorder;
// src/components/collection/AudioRecorder.tsx

// import React, { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Play,
//   Pause,
//   Mic,
//   MicOff,
//   Settings,
//   RefreshCw,
//   CheckCircle,
//   ChevronRight,
//   X,
//   Loader2,
//   Maximize,
//   ChevronLeft,
//   Sparkles,
//   AlertOctagon,
//   HelpCircle,
//   Headphones,
//   AudioWaveform,
//   Sliders,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";

// import { Progress } from "@/components/ui/progress";
// import { Badge } from "@/components/ui/badge";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { cn } from "@/lib/utils";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface EnhancedAudioRecorderProps {
//   onRecordingComplete: (blob: Blob) => void;
//   maxDuration?: number;
//   currentQuestion?: string;
//   currentQuestionIndex?: number;
//   totalQuestions?: number;
//   companyLogo?: string;
//   companyName?: string;
//   primaryColor?: string;
//   showAIHelp?: boolean;
// }

// type RecordingState =
//   | "idle"
//   | "countdown"
//   | "recording"
//   | "paused"
//   | "reviewing"
//   | "processing"
//   | "complete";
// type AudioQuality = "standard" | "high" | "studio";

// export const EnhancedAudioRecorder: React.FC<EnhancedAudioRecorderProps> = ({
//   onRecordingComplete,
//   maxDuration = 60,
//   currentQuestion = "What problem were you trying to solve?",
//   currentQuestionIndex = 0,
//   totalQuestions = 4,
//   companyLogo = "",
//   companyName = "Your Company",
//   primaryColor = "#6366F1",
//   showAIHelp = true,
// }) => {
//   const { toast } = useToast();
//   const [recordingState, setRecordingState] = useState<RecordingState>("idle");
//   const [countdown, setCountdown] = useState(3);
//   const [recordingTime, setRecordingTime] = useState(0);
//   const [playbackTime, setPlaybackTime] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isMuted, setIsMuted] = useState(false);
//   const [volume, setVolume] = useState(0.8);
//   const [audioQuality, setAudioQuality] = useState<AudioQuality>("high");
//   const [micEnabled, setMicEnabled] = useState(true);
//   const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
//   const [selectedMic, setSelectedMic] = useState<string>("");
//   const [showSettings, setShowSettings] = useState(false);
//   const [showHelp, setShowHelp] = useState(false);
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [noiseReduction, setNoiseReduction] = useState(true);
//   const [echoCancellation, setEchoCancellation] = useState(true);
//   const [audioInputLevel, setAudioInputLevel] = useState(0);
//   const [visualizationData, setVisualizationData] = useState<number[]>([]);

//   const audioRef = useRef<HTMLAudioElement>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const recordedChunksRef = useRef<Blob[]>([]);
//   const recordingTimerRef = useRef<number | null>(null);
//   const countdownTimerRef = useRef<number | null>(null);
//   const playbackTimerRef = useRef<number | null>(null);
//   const containerRef = useRef<HTMLDivElement>(null);
//   const audioAnalyserRef = useRef<AnalyserNode | null>(null);
//   const visualizationTimerRef = useRef<number | null>(null);

//   // Simulated recording blob for demonstration
//   const recordedAudioURL = useRef<string | null>(null);

//   const aiTips = [
//     "Speak clearly and at a consistent volume",
//     "Take a deep breath before starting to help reduce nervousness",
//     "Share specific details about your experience",
//     "Try to include measurable results if possible",
//   ];

//   // Initialize media devices
//   useEffect(() => {
//     const initDevices = async () => {
//       try {
//         const devices = await navigator.mediaDevices.enumerateDevices();

//         const mics = devices.filter((device) => device.kind === "audioinput");

//         setAvailableMics(mics);

//         if (mics.length > 0) {
//           // Ensure the deviceId is not empty
//           setSelectedMic(mics[0].deviceId || `mic-0`);
//         } else {
//           // Fallback value if no mics are found
//           setSelectedMic("default-mic");
//         }

//         await initializeStream();
//       } catch (err) {
//         console.error("Error accessing media devices:", err);
//         toast({
//           title: "Microphone Access Error",
//           description:
//             "Unable to access microphone. Please check your permissions.",
//           variant: "destructive",
//         });

//         // Set a fallback value
//         setSelectedMic("default-mic");
//       }
//     };

//     initDevices();

//     return () => {
//       // Clean up stream when component unmounts
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }
//       if (visualizationTimerRef.current) {
//         clearInterval(visualizationTimerRef.current);
//       }
//     };
//   }, []);

//   // Update stream when mic selection changes
//   useEffect(() => {
//     if (selectedMic) {
//       initializeStream();
//     }
//   }, [selectedMic, audioQuality, noiseReduction, echoCancellation]);

//   // Handle countdown timer
//   useEffect(() => {
//     if (recordingState === "countdown") {
//       if (countdown > 0) {
//         countdownTimerRef.current = setTimeout(() => {
//           setCountdown(countdown - 1);
//         }, 1000);
//       } else {
//         startRecording();
//       }
//     }

//     return () => {
//       if (countdownTimerRef.current) {
//         clearTimeout(countdownTimerRef.current);
//       }
//     };
//   }, [recordingState, countdown]);

//   // Initialize audio visualization
//   const setupAudioVisualization = (stream: MediaStream) => {
//     if (!stream) return;

//     try {
//       const audioContext = new AudioContext();
//       const source = audioContext.createMediaStreamSource(stream);
//       const analyser = audioContext.createAnalyser();

//       analyser.fftSize = 256;
//       source.connect(analyser);
//       audioAnalyserRef.current = analyser;

//       const bufferLength = analyser.frequencyBinCount;
//       const dataArray = new Uint8Array(bufferLength);

//       // Update visualization data at regular intervals
//       if (visualizationTimerRef.current) {
//         clearInterval(visualizationTimerRef.current);
//       }

//       visualizationTimerRef.current = setInterval(() => {
//         if (audioAnalyserRef.current) {
//           analyser.getByteFrequencyData(dataArray);

//           // Calculate audio input level (0-1)
//           const average =
//             dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
//           setAudioInputLevel(average / 255);

//           // Generate visualization data (simplified for performance)
//           const sampleCount = 32; // Number of bars to display
//           const sampledData = Array.from({ length: sampleCount }, (_, i) => {
//             const index = Math.floor(i * (bufferLength / sampleCount));
//             return dataArray[index] / 255; // Normalize to 0-1
//           });

//           setVisualizationData(sampledData);
//         }
//       }, 100);
//     } catch (err) {
//       console.error("Error setting up audio visualization:", err);
//     }
//   };

//   // Initialize media stream
//   const initializeStream = async () => {
//     try {
//       // Stop any existing stream
//       if (streamRef.current) {
//         streamRef.current.getTracks().forEach((track) => track.stop());
//       }

//       const constraints: MediaStreamConstraints = {
//         audio: micEnabled
//           ? {
//               deviceId: selectedMic ? { exact: selectedMic } : undefined,
//               echoCancellation: echoCancellation,
//               noiseSuppression: noiseReduction,
//               // Additional constraints based on quality
//               ...(audioQuality === "studio" && {
//                 autoGainControl: false,
//                 channelCount: 2,
//                 sampleRate: 48000,
//                 sampleSize: 24,
//               }),
//             }
//           : false,
//       };

//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
//       streamRef.current = stream;

//       // Set up audio visualization
//       setupAudioVisualization(stream);
//     } catch (err) {
//       console.error("Error initializing stream:", err);
//       toast({
//         title: "Microphone Error",
//         description:
//           "Unable to access microphone. Please check your permissions.",
//         variant: "destructive",
//       });
//     }
//   };

//   // Start recording countdown
//   const handleStartCountdown = () => {
//     setCountdown(3);
//     setRecordingState("countdown");
//   };

//   // Start recording
//   const startRecording = () => {
//     if (!streamRef.current) return;

//     recordedChunksRef.current = [];

//     // Use different mimeType options based on quality setting
//     const mimeType = audioQuality === "studio" ? "audio/wav" : "audio/webm";

//     const options = {
//       mimeType,
//       audioBitsPerSecond:
//         audioQuality === "standard"
//           ? 128000
//           : audioQuality === "high"
//           ? 256000
//           : 320000,
//     };

//     try {
//       const mediaRecorder = new MediaRecorder(streamRef.current, options);

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data && event.data.size > 0) {
//           recordedChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = () => {
//         const blob = new Blob(recordedChunksRef.current, { type: mimeType });
//         recordedAudioURL.current = URL.createObjectURL(blob);

//         if (audioRef.current && recordingState !== "reviewing") {
//           audioRef.current.src = recordedAudioURL.current;
//           audioRef.current.load();
//         }
//       };

//       mediaRecorder.start(1000); // Collect data every second
//       mediaRecorderRef.current = mediaRecorder;

//       setRecordingState("recording");
//       setRecordingTime(0);

//       recordingTimerRef.current = setInterval(() => {
//         setRecordingTime((prev) => {
//           if (prev >= maxDuration) {
//             stopRecording();
//             return prev;
//           }
//           return prev + 1;
//         });
//       }, 1000);
//     } catch (err) {
//       console.error("Error starting recording:", err);
//       toast({
//         title: "Recording Error",
//         description: "Unable to start recording. Please try again.",
//         variant: "destructive",
//       });
//       setRecordingState("idle");
//     }
//   };

//   // Pause recording
//   const pauseRecording = () => {
//     if (mediaRecorderRef.current && recordingState === "recording") {
//       mediaRecorderRef.current.pause();

//       if (recordingTimerRef.current) {
//         clearInterval(recordingTimerRef.current);
//       }

//       setRecordingState("paused");
//     }
//   };

//   // Resume recording
//   const resumeRecording = () => {
//     if (mediaRecorderRef.current && recordingState === "paused") {
//       mediaRecorderRef.current.resume();

//       recordingTimerRef.current = setInterval(() => {
//         setRecordingTime((prev) => {
//           if (prev >= maxDuration) {
//             stopRecording();
//             return prev;
//           }
//           return prev + 1;
//         });
//       }, 1000);

//       setRecordingState("recording");
//     }
//   };

//   // Stop recording
//   const stopRecording = () => {
//     if (
//       mediaRecorderRef.current &&
//       (recordingState === "recording" || recordingState === "paused")
//     ) {
//       mediaRecorderRef.current.stop();

//       if (recordingTimerRef.current) {
//         clearInterval(recordingTimerRef.current);
//       }

//       setRecordingState("reviewing");
//     }
//   };

//   // Reset recording
//   const resetRecording = () => {
//     setRecordingState("idle");
//     setRecordingTime(0);

//     if (recordedAudioURL.current) {
//       URL.revokeObjectURL(recordedAudioURL.current);
//       recordedAudioURL.current = null;
//     }

//     initializeStream();
//   };

//   // Complete recording
//   const completeRecording = () => {
//     setRecordingState("processing");

//     setTimeout(() => {
//       const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
//       onRecordingComplete(blob);
//       setRecordingState("complete");
//     }, 2000);
//   };

//   // Format time for display (MM:SS)
//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins.toString().padStart(2, "0")}:${secs
//       .toString()
//       .padStart(2, "0")}`;
//   };

//   // Toggle fullscreen
//   const toggleFullscreen = () => {
//     if (!document.fullscreenElement) {
//       containerRef.current?.requestFullscreen();
//       setIsFullscreen(true);
//     } else {
//       document.exitFullscreen();
//       setIsFullscreen(false);
//     }
//   };

//   // Handle playback
//   const handlePlaybackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (audioRef.current) {
//       const time = parseInt(e.target.value);
//       audioRef.current.currentTime = time;
//       setPlaybackTime(time);
//     }
//   };

//   // Toggle playback
//   const togglePlayback = () => {
//     if (audioRef.current) {
//       if (isPlaying) {
//         audioRef.current.pause();
//       } else {
//         audioRef.current.play();
//       }
//       setIsPlaying(!isPlaying);
//     }
//   };

//   // Toggle mute
//   const toggleMute = () => {
//     if (audioRef.current) {
//       audioRef.current.muted = !isMuted;
//       setIsMuted(!isMuted);
//     }
//   };

//   // Handle volume change
//   const handleVolumeChange = (values: number[]) => {
//     const newVolume = values[0];
//     setVolume(newVolume);

//     if (audioRef.current) {
//       audioRef.current.volume = newVolume;
//     }

//     if (newVolume === 0) {
//       setIsMuted(true);
//     } else if (isMuted) {
//       setIsMuted(false);
//     }
//   };

//   // Toggle microphone
//   const toggleMicrophone = () => {
//     setMicEnabled(!micEnabled);
//   };

//   // Check if recording is short
//   const isRecordingTooShort = recordingTime < 5;

//   return (
//     <div
//       ref={containerRef}
//       className={cn(
//         "w-full rounded-xl overflow-hidden bg-gray-800 shadow-xl transition-all",
//         isFullscreen ? "fixed inset-0 z-50" : "relative"
//       )}
//       style={{ backgroundColor: primaryColor + "0a" }} // Very light primary color background
//     >
//       <div
//         className={cn(
//           "relative overflow-hidden p-8 flex flex-col items-center justify-center",
//           isFullscreen ? "min-h-screen" : "min-h-[300px]"
//         )}
//       >
//         {/* Audio element (hidden) */}
//         <audio
//           ref={audioRef}
//           className="hidden"
//           controls
//           onTimeUpdate={() => {
//             if (audioRef.current && recordingState === "reviewing") {
//               setPlaybackTime(Math.floor(audioRef.current.currentTime));
//             }
//           }}
//           onEnded={() => {
//             if (recordingState === "reviewing") {
//               setIsPlaying(false);
//             }
//           }}
//           onPlay={() => setIsPlaying(true)}
//           onPause={() => setIsPlaying(false)}
//         />

//         {/* Company branding */}
//         <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
//           {companyLogo ? (
//             <img
//               src={companyLogo}
//               alt={companyName}
//               className="h-8 w-8 rounded-md object-contain bg-white/80 p-1"
//             />
//           ) : (
//             <div
//               className="h-8 w-8 rounded-md flex items-center justify-center text-white font-bold text-xs"
//               style={{ backgroundColor: primaryColor }}
//             >
//               {companyName.slice(0, 2).toUpperCase()}
//             </div>
//           )}
//           {!isFullscreen && (
//             <span className="text-foreground text-sm font-medium hidden md:inline-block">
//               {companyName}
//             </span>
//           )}
//         </div>

//         {/* Countdown overlay */}
//         <AnimatePresence>
//           {recordingState === "countdown" && (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.5 }}
//               animate={{ opacity: 1, scale: 1 }}
//               exit={{ opacity: 0, scale: 1.5 }}
//               className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20"
//             >
//               <motion.div
//                 key={countdown}
//                 initial={{ opacity: 0, scale: 0.5 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 1.5 }}
//                 transition={{ duration: 0.5 }}
//                 className="text-7xl font-bold"
//                 style={{ color: primaryColor }}
//               >
//                 {countdown}
//               </motion.div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Processing overlay */}
//         <AnimatePresence>
//           {recordingState === "processing" && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-20"
//             >
//               <Loader2
//                 className="h-12 w-12 animate-spin mb-4"
//                 style={{ color: primaryColor }}
//               />
//               <h3 className="text-xl font-medium">Processing your audio...</h3>
//               <p className="text-muted-foreground text-sm mt-2">
//                 This will only take a moment
//               </p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Complete overlay */}
//         <AnimatePresence>
//           {recordingState === "complete" && (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-sm z-20"
//             >
//               <div
//                 className="rounded-full p-4 mb-4"
//                 style={{ backgroundColor: primaryColor }}
//               >
//                 <CheckCircle className="h-12 w-12 text-white" />
//               </div>
//               <h3 className="text-2xl font-medium">Great job!</h3>
//               <p className="text-muted-foreground text-base mt-2 text-center max-w-md">
//                 Your audio testimonial has been successfully recorded.
//                 {currentQuestionIndex < totalQuestions - 1
//                   ? " Let's continue to the next question."
//                   : " Thank you for sharing your experience!"}
//               </p>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Question display */}
//         {(recordingState === "idle" ||
//           recordingState === "recording" ||
//           recordingState === "paused") && (
//           <div className="text-center mb-8 max-w-xl">
//             <h3 className="text-xl font-medium mb-2">{currentQuestion}</h3>
//             <p className="text-muted-foreground text-sm">
//               Answer naturally in 30-60 seconds. You can re-record if needed.
//             </p>
//           </div>
//         )}

//         {/* Audio recording/playback visualization */}
//         <div
//           className={cn(
//             "w-full max-w-md h-32 rounded-xl mb-6 relative overflow-hidden",
//             "border transition-all duration-300",
//             recordingState === "recording"
//               ? "border-red-500/50 bg-red-500/10"
//               : "border-border bg-card"
//           )}
//         >
//           {/* Active or idle recording state visualization */}
//           {(recordingState === "idle" ||
//             recordingState === "recording" ||
//             recordingState === "paused") && (
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="w-full h-full px-4 flex items-center justify-center">
//                 <div className="w-full h-24 flex items-center justify-center gap-1">
//                   {/* Audio visualization bars */}
//                   {Array.from({ length: 32 }).map((_, i) => {
//                     const height =
//                       recordingState === "recording"
//                         ? 20 + visualizationData[i] * 80 ||
//                           5 + Math.random() * 70
//                         : 5 + Math.random() * 15;

//                     return (
//                       <motion.div
//                         key={i}
//                         className="w-2 rounded-full"
//                         style={{
//                           backgroundColor:
//                             recordingState === "recording"
//                               ? primaryColor
//                               : "#94a3b8",
//                           height: `${height}%`,
//                           opacity:
//                             recordingState === "recording"
//                               ? 0.7 + height / 100
//                               : 0.3,
//                         }}
//                         animate={{
//                           height: `${height}%`,
//                           opacity:
//                             recordingState === "recording"
//                               ? 0.7 + height / 100
//                               : 0.3,
//                         }}
//                         transition={{
//                           duration: 0.1,
//                           repeat: Infinity,
//                           repeatType: "mirror",
//                         }}
//                       />
//                     );
//                   })}
//                 </div>
//               </div>

//               {recordingState === "recording" && (
//                 <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/20 text-red-600 px-3 py-1.5 rounded-full text-sm">
//                   <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
//                   <span className="font-medium">REC</span>
//                   <span>{formatTime(recordingTime)}</span>
//                 </div>
//               )}

//               {recordingState === "paused" && (
//                 <div className="absolute top-4 left-4 flex items-center gap-2 bg-amber-500/20 text-amber-600 px-3 py-1.5 rounded-full text-sm">
//                   <Pause className="h-3 w-3" />
//                   <span className="font-medium">PAUSED</span>
//                   <span>{formatTime(recordingTime)}</span>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Audio playback visualization */}
//           {recordingState === "reviewing" && (
//             <div className="absolute inset-0 flex flex-col justify-center px-6">
//               <div className="text-center mb-2">
//                 <Badge
//                   variant="outline"
//                   className="mb-1"
//                   style={{
//                     borderColor: `${primaryColor}50`,
//                     color: primaryColor,
//                   }}
//                 >
//                   {formatTime(playbackTime)} / {formatTime(recordingTime)}
//                 </Badge>
//               </div>

//               <div className="relative h-12 bg-muted/30 rounded-lg overflow-hidden">
//                 <div
//                   className="absolute top-0 bottom-0 left-0 h-full transition-all duration-100"
//                   style={{
//                     width: `${(playbackTime / recordingTime) * 100}%`,
//                     backgroundColor: primaryColor + "40", // Semi-transparent primary color
//                   }}
//                 ></div>

//                 <input
//                   type="range"
//                   min="0"
//                   max={recordingTime}
//                   value={playbackTime}
//                   onChange={handlePlaybackChange}
//                   className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
//                 />

//                 {/* AudioWaveform visualization (simulated) */}
//                 <div className="absolute inset-0 flex items-center px-2">
//                   {Array.from({ length: 100 }).map((_, i) => {
//                     // Create a semi-random but repeatable pattern
//                     const seed = (i * 17) % 50;
//                     const height = 5 + seed / 2;
//                     const isPlayed = (i / 100) * recordingTime <= playbackTime;

//                     return (
//                       <div
//                         key={i}
//                         className="w-0.5 mx-0.5 rounded-full"
//                         style={{
//                           height: `${height}px`,
//                           backgroundColor: isPlayed ? primaryColor : "#94a3b8",
//                           opacity: isPlayed ? 0.9 : 0.3,
//                         }}
//                       />
//                     );
//                   })}
//                 </div>
//               </div>

//               <div className="flex justify-center mt-4">
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   className="rounded-full h-10 w-10"
//                   onClick={togglePlayback}
//                 >
//                   {isPlaying ? (
//                     <Pause className="h-5 w-5" />
//                   ) : (
//                     <Play className="h-5 w-5" />
//                   )}
//                 </Button>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Main action buttons */}
//         <div className="flex justify-center gap-4">
//           {recordingState === "idle" && (
//             <Button
//               className="rounded-full px-6 text-white gap-2"
//               style={{ backgroundColor: primaryColor }}
//               onClick={handleStartCountdown}
//               disabled={!micEnabled}
//             >
//               <Mic className="h-4 w-4" />
//               Start Recording
//             </Button>
//           )}

//           {recordingState === "recording" && (
//             <>
//               <Button
//                 variant="outline"
//                 className="rounded-full px-4 gap-2"
//                 onClick={pauseRecording}
//               >
//                 <Pause className="h-4 w-4" />
//                 Pause
//               </Button>

//               <Button
//                 variant="destructive"
//                 className="rounded-full px-4 gap-2"
//                 onClick={stopRecording}
//               >
//                 <CheckCircle className="h-4 w-4" />
//                 Finish
//               </Button>
//             </>
//           )}

//           {recordingState === "paused" && (
//             <>
//               <Button
//                 variant="outline"
//                 className="rounded-full px-4 gap-2"
//                 onClick={resumeRecording}
//               >
//                 <Play className="h-4 w-4" />
//                 Resume
//               </Button>

//               <Button
//                 variant="destructive"
//                 className="rounded-full px-4 gap-2"
//                 onClick={stopRecording}
//               >
//                 <CheckCircle className="h-4 w-4" />
//                 Finish
//               </Button>
//             </>
//           )}

//           {recordingState === "reviewing" && (
//             <>
//               <Button
//                 variant="outline"
//                 className="rounded-full px-4 gap-2"
//                 onClick={resetRecording}
//               >
//                 <RefreshCw className="h-4 w-4" />
//                 Re-record
//               </Button>

//               <Button
//                 className="rounded-full px-4 gap-2 text-white"
//                 style={{ backgroundColor: primaryColor }}
//                 onClick={completeRecording}
//                 disabled={isRecordingTooShort}
//               >
//                 {isRecordingTooShort ? (
//                   <>
//                     <AlertOctagon className="h-4 w-4" />
//                     <span>Audio too short</span>
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle className="h-4 w-4" />
//                     <span>Use This Recording</span>
//                   </>
//                 )}
//               </Button>
//             </>
//           )}
//         </div>

//         {/* Secondary controls for idle state */}
//         {recordingState === "idle" && (
//           <div className="flex gap-3 mt-6">
//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="rounded-full"
//                     onClick={toggleMicrophone}
//                   >
//                     {micEnabled ? (
//                       <Mic className="h-5 w-5" />
//                     ) : (
//                       <MicOff className="h-5 w-5 text-destructive" />
//                     )}
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>{micEnabled ? "Disable" : "Enable"} Microphone</p>
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>

//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="rounded-full"
//                     onClick={() => setShowSettings(!showSettings)}
//                   >
//                     <Settings className="h-5 w-5" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>Audio Settings</p>
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>

//             {showAIHelp && (
//               <TooltipProvider>
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="rounded-full"
//                       onClick={() => setShowHelp(!showHelp)}
//                     >
//                       <HelpCircle className="h-5 w-5" />
//                     </Button>
//                   </TooltipTrigger>
//                   <TooltipContent>
//                     <p>Recording Tips</p>
//                   </TooltipContent>
//                 </Tooltip>
//               </TooltipProvider>
//             )}

//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     className="rounded-full"
//                     onClick={toggleFullscreen}
//                   >
//                     <Maximize className="h-5 w-5" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   <p>Fullscreen</p>
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>
//           </div>
//         )}

//         {/* AI Tips panel */}
//         <AnimatePresence>
//           {showHelp && recordingState === "idle" && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 20 }}
//               className="max-w-md mt-8 p-6 rounded-xl border"
//               style={{
//                 borderColor: `${primaryColor}30`,
//                 backgroundColor: `${primaryColor}05`,
//               }}
//             >
//               <div className="flex items-start gap-3 mb-4">
//                 <div
//                   className="p-2 rounded-full"
//                   style={{ backgroundColor: `${primaryColor}20` }}
//                 >
//                   <Sparkles
//                     className="h-5 w-5"
//                     style={{ color: primaryColor }}
//                   />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-medium">Tips for Great Audio</h3>
//                   <p className="text-muted-foreground text-sm">
//                     Follow these tips for the best quality recording
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-3 mt-4">
//                 {aiTips.map((tip, index) => (
//                   <div key={index} className="flex items-start gap-3">
//                     <div
//                       className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
//                       style={{
//                         backgroundColor: `${primaryColor}20`,
//                         color: primaryColor,
//                       }}
//                     >
//                       {index + 1}
//                     </div>
//                     <p className="text-sm">{tip}</p>
//                   </div>
//                 ))}
//               </div>

//               <div className="mt-4 pt-4 border-t flex justify-between items-center">
//                 <p className="text-xs text-muted-foreground">
//                   Always test your microphone before recording
//                 </p>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setShowHelp(false)}
//                 >
//                   Got It
//                 </Button>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* Settings panel */}
//         <AnimatePresence>
//           {showSettings && recordingState === "idle" && (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 20 }}
//               className="max-w-md w-full mt-8 p-6 rounded-xl border bg-card"
//             >
//               <div className="flex items-start justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <Sliders className="h-5 w-5 text-primary" />
//                   <h3 className="text-lg font-medium">Audio Settings</h3>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   onClick={() => setShowSettings(false)}
//                 >
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>

//               <div className="space-y-5">
//                 <div className="space-y-2">
//                   <Label htmlFor="mic-select">Microphone</Label>
//                   <Select value={selectedMic} onValueChange={setSelectedMic}>
//                     <SelectTrigger id="mic-select">
//                       <SelectValue placeholder="Select microphone" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {availableMics.map((mic) => (
//                         <SelectItem
//                           key={mic.deviceId}
//                           value={
//                             mic.deviceId || `mic-${availableMics.indexOf(mic)}`
//                           }
//                         >
//                           {mic.label ||
//                             `Microphone ${availableMics.indexOf(mic) + 1}`}
//                         </SelectItem>
//                       ))}
//                       {availableMics.length === 0 && (
//                         <SelectItem value="default-mic">
//                           Default Microphone
//                         </SelectItem>
//                       )}
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="quality-select">Audio Quality</Label>
//                   <Select
//                     value={audioQuality}
//                     onValueChange={(value: AudioQuality) =>
//                       setAudioQuality(value)
//                     }
//                   >
//                     <SelectTrigger id="quality-select">
//                       <SelectValue placeholder="Select quality" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="standard">
//                         Standard (128kbps)
//                       </SelectItem>
//                       <SelectItem value="high">High (256kbps)</SelectItem>
//                       <SelectItem value="studio">Studio (320kbps)</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-3">
//                   <Label>Audio Enhancements</Label>

//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <AudioWaveform className="h-4 w-4 text-muted-foreground" />
//                       <span className="text-sm">Noise Reduction</span>
//                     </div>
//                     <Switch
//                       checked={noiseReduction}
//                       onCheckedChange={setNoiseReduction}
//                     />
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <Mic className="h-4 w-4 text-muted-foreground" />
//                       <span className="text-sm">Echo Cancellation</span>
//                     </div>
//                     <Switch
//                       checked={echoCancellation}
//                       onCheckedChange={setEchoCancellation}
//                     />
//                   </div>

//                   <div className="space-y-2 mt-2">
//                     <div className="flex justify-between items-center">
//                       <Label>Microphone Volume</Label>
//                       <Badge variant="outline" className="text-xs">
//                         {Math.round(audioInputLevel * 100)}%
//                       </Badge>
//                     </div>
//                     <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-primary transition-all duration-75"
//                         style={{
//                           width: `${audioInputLevel * 100}%`,
//                           backgroundColor: primaryColor,
//                         }}
//                       ></div>
//                     </div>
//                     <p className="text-xs text-muted-foreground mt-1">
//                       Speak to test your microphone level
//                     </p>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label>Environment Type</Label>
//                   <div className="grid grid-cols-3 gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="justify-start text-xs"
//                     >
//                       <Headphones className="h-3.5 w-3.5 mr-1" />
//                       Quiet
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="justify-start text-xs"
//                     >
//                       <Headphones className="h-3.5 w-3.5 mr-1" />
//                       Office
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="justify-start text-xs"
//                     >
//                       <Headphones className="h-3.5 w-3.5 mr-1" />
//                       Noisy
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="pt-4 border-t flex justify-end">
//                   <Button
//                     className="text-white"
//                     style={{ backgroundColor: primaryColor }}
//                     onClick={() => setShowSettings(false)}
//                   >
//                     Apply Settings
//                   </Button>
//                 </div>
//               </div>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* Question progress */}
//       <div className="bg-card border-t py-3 px-6 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           <span className="text-muted-foreground text-sm">
//             Question {currentQuestionIndex + 1} of {totalQuestions}
//           </span>
//           <Progress
//             value={(currentQuestionIndex / (totalQuestions - 1)) * 100}
//             className="w-32 h-2"
//             style={
//               {
//                 "--progress-background": `${primaryColor}50`,
//                 "--progress-foreground": primaryColor,
//               } as React.CSSProperties
//             }
//           />
//         </div>

//         <div className="flex items-center gap-3">
//           {recordingState !== "processing" && recordingState !== "complete" && (
//             <>
//               {currentQuestionIndex > 0 && (
//                 <Button variant="ghost" size="sm" className="h-8 gap-1">
//                   <ChevronLeft className="h-4 w-4" />
//                   <span className="hidden sm:inline">Previous</span>
//                 </Button>
//               )}

//               {currentQuestionIndex < totalQuestions - 1 &&
//                 recordingState === "idle" && (
//                   <Button variant="ghost" size="sm" className="h-8 gap-1">
//                     <span className="hidden sm:inline">Skip</span>
//                     <ChevronRight className="h-4 w-4" />
//                   </Button>
//                 )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EnhancedAudioRecorder;

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Mic,
  MicOff,
  Settings,
  RefreshCw,
  CheckCircle,
  ChevronRight,
  X,
  Loader2,
  Maximize,
  ChevronLeft,
  Sparkles,
  AlertOctagon,
  HelpCircle,
  Headphones,
  AudioWaveform,
  Sliders,
  Volume2,
  VolumeX,
  Scissors,
  Download,
  Trash2,
  Edit2,
  MoreHorizontal,
  Wand2,
  SunMoon,
  ZoomIn,
  ZoomOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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

interface EnhancedAudioRecorderProps {
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
  | "complete"
  | "editing";
type AudioQuality = "standard" | "high" | "studio";
type AudioEnhancement = "default" | "voice" | "music" | "ambient";
type AudioEditMode = "none" | "trim" | "enhance";

export const EnhancedAudioRecorder: React.FC<EnhancedAudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 120,
  currentQuestion = "What problem were you trying to solve?",
  currentQuestionIndex = 0,
  totalQuestions = 4,
  companyLogo = "",
  companyName = "Your Company",
  primaryColor = "#6366F1",
  showAIHelp = true,
  forceMobileView = false,
}) => {
  const { toast } = useToast();
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // const [volume, setVolume] = useState(0.8);
  const [audioQuality, setAudioQuality] = useState<AudioQuality>("high");
  const [micEnabled, setMicEnabled] = useState(true);
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [echoCancellation, setEchoCancellation] = useState(true);
  const [audioInputLevel, setAudioInputLevel] = useState(0);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [visualizationData, setVisualizationData] = useState<number[]>([]);
  const [recordingHistory, setRecordingHistory] = useState<number[]>([]);
  const [audioEnhancement, setAudioEnhancement] =
    useState<AudioEnhancement>("default");
  const [editMode, setEditMode] = useState<AudioEditMode>("none");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [waveformZoom, setWaveformZoom] = useState(1);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [autoStopSilence, setAutoStopSilence] = useState(false);
  const [silenceThreshold] = useState(0.05);
  const [silenceDuration, setSilenceDuration] = useState(3);
  const [showReminders, setShowReminders] = useState(true);
  const [environmentType, setEnvironmentType] = useState<string>("quiet");
  const [recordingName, setRecordingName] = useState<string>("");
  const [showTrimControls, setShowTrimControls] = useState(false);
  const [, setIsAudioProcessed] = useState(false);

  // Helper refs for handling the audio
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  // const playbackTimerRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const visualizationTimerRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trimStartHandleRef = useRef<HTMLDivElement>(null);
  const trimEndHandleRef = useRef<HTMLDivElement>(null);
  const lastSilenceTimeRef = useRef<number>(0);

  // Responsive touch handling refs
  const isDraggingRef = useRef<boolean>(false);
  const activeTrimHandleRef = useRef<"start" | "end" | null>(null);
  const initialTouchRef = useRef<number>(0);
  const initialTrimValueRef = useRef<number>(0);

  // Simulated recording blob for demonstration
  const recordedAudioURL = useRef<string | null>(null);

  // Default AI tips
  const aiTips = [
    "Speak clearly and at a consistent volume",
    "Take a deep breath before starting to help reduce nervousness",
    "Share specific details about your experience",
    "Try to include measurable results if possible",
  ];

  // Check for mobile view
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

        const mics = devices.filter((device) => device.kind === "audioinput");

        setAvailableMics(mics);

        if (mics.length > 0) {
          // Ensure the deviceId is not empty
          setSelectedMic(mics[0].deviceId || `mic-0`);
        } else {
          // Fallback value if no mics are found
          setSelectedMic("default-mic");
        }

        await initializeStream();
      } catch (err) {
        console.error("Error accessing media devices:", err);
        toast({
          title: "Microphone Access Error",
          description:
            "Unable to access microphone. Please check your permissions.",
          variant: "destructive",
        });

        // Set a fallback value
        setSelectedMic("default-mic");
      }
    };

    initDevices();

    return () => {
      // Clean up stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (visualizationTimerRef.current) {
        clearInterval(visualizationTimerRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Update stream when mic selection changes
  useEffect(() => {
    if (selectedMic) {
      initializeStream();
    }
  }, [selectedMic, audioQuality, noiseReduction, echoCancellation]);

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

  // Update trimming end value when recording time changes
  useEffect(() => {
    if (recordingTime > 0) {
      setTrimEnd(recordingTime);
    }
  }, [recordingTime]);

  // Draw waveform in reviewing state
  useEffect(() => {
    if (
      recordingState === "reviewing" &&
      waveformCanvasRef.current &&
      recordingHistory.length > 0
    ) {
      drawWaveform();
    }
  }, [
    recordingState,
    recordingHistory,
    waveformZoom,
    showTrimControls,
    trimStart,
    trimEnd,
  ]);

  // Initialize audio visualization
  const setupAudioVisualization = (stream: MediaStream) => {
    if (!stream) return;

    try {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 256;
      source.connect(analyser);
      audioAnalyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Update visualization data at regular intervals
      if (visualizationTimerRef.current) {
        clearInterval(visualizationTimerRef.current);
      }

      visualizationTimerRef.current = setInterval(() => {
        if (audioAnalyserRef.current) {
          analyser.getByteFrequencyData(dataArray);

          // Calculate audio input level (0-1)
          const average =
            dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedLevel = average / 255;
          setAudioInputLevel(normalizedLevel);

          // Check for voice activity
          const isVoiceActive = normalizedLevel > silenceThreshold;
          setVoiceDetected(isVoiceActive);

          // Auto-stop on silence if enabled and recording
          if (autoStopSilence && recordingState === "recording") {
            const now = Date.now();

            if (isVoiceActive) {
              lastSilenceTimeRef.current = now;
            } else if (
              now - lastSilenceTimeRef.current >
              silenceDuration * 1000
            ) {
              // Stop after silence threshold is met
              stopRecording();
            }
          }

          // Generate visualization data (simplified for performance)
          const sampleCount = 32; // Number of bars to display
          const sampledData = Array.from({ length: sampleCount }, (_, i) => {
            const index = Math.floor(i * (bufferLength / sampleCount));
            return dataArray[index] / 255; // Normalize to 0-1
          });

          setVisualizationData(sampledData);

          // Store for history if recording
          if (recordingState === "recording") {
            setRecordingHistory((prev) => [...prev, normalizedLevel]);
          }
        }
      }, 50); // More frequent updates for smoother visualization
    } catch (err) {
      console.error("Error setting up audio visualization:", err);
    }
  };

  // Initialize media stream
  const initializeStream = async () => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Reset voice activity detection
      setVoiceDetected(false);
      lastSilenceTimeRef.current = Date.now();

      const constraints: MediaStreamConstraints = {
        audio: micEnabled
          ? {
              deviceId: selectedMic ? { exact: selectedMic } : undefined,
              echoCancellation: echoCancellation,
              noiseSuppression: noiseReduction,
              // Additional constraints based on quality
              ...(audioQuality === "studio" && {
                autoGainControl: false,
                channelCount: 2,
                sampleRate: 48000,
                sampleSize: 24,
              }),
            }
          : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Set up audio visualization
      setupAudioVisualization(stream);
    } catch (err) {
      console.error("Error initializing stream:", err);
      toast({
        title: "Microphone Error",
        description:
          "Unable to access microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };

  // Draw the waveform visualization on canvas
  const drawWaveform = () => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || recordingHistory.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Calculate the visible portion based on zoom level
    const visibleDataPoints = Math.min(
      recordingHistory.length,
      Math.floor(recordingHistory.length / waveformZoom)
    );
    const skipFactor = recordingHistory.length / visibleDataPoints;

    // Draw background
    ctx.fillStyle = "rgba(241, 245, 249, 0.1)"; // Very light background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate trim positions in pixels
    const trimStartPx = (trimStart / recordingTime) * canvasWidth;
    const trimEndPx = (trimEnd / recordingTime) * canvasWidth;

    // Draw trim selection background if in trim mode
    if (showTrimControls) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.2)"; // Dark overlay for trimmed areas
      ctx.fillRect(0, 0, trimStartPx, canvasHeight);
      ctx.fillRect(trimEndPx, 0, canvasWidth - trimEndPx, canvasHeight);

      // Draw selection area with a slight highlight
      ctx.fillStyle = "rgba(99, 102, 241, 0.1)"; // Primary color with low opacity
      ctx.fillRect(trimStartPx, 0, trimEndPx - trimStartPx, canvasHeight);
    }

    // Draw waveform bars
    const barWidth = canvasWidth / visibleDataPoints;

    for (let i = 0; i < visibleDataPoints; i++) {
      const dataIndex = Math.floor(i * skipFactor);
      const value = recordingHistory[dataIndex];

      const barHeight = Math.max(2, value * canvasHeight * 0.8); // Ensure minimum visibility
      const x = i * barWidth;
      const y = (canvasHeight - barHeight) / 2;

      // Determine if this bar is in the selected range
      const isInSelectedRange =
        showTrimControls && x >= trimStartPx && x <= trimEndPx;

      // Color bars based on selection state
      if (isInSelectedRange) {
        ctx.fillStyle = primaryColor;
      } else {
        ctx.fillStyle = showTrimControls ? "#94a3b8" : primaryColor;
      }

      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
    }

    // Draw trim handles if in trim mode
    if (showTrimControls) {
      // Start handle
      ctx.fillStyle = primaryColor;
      ctx.fillRect(trimStartPx - 2, 0, 4, canvasHeight);

      // End handle
      ctx.fillRect(trimEndPx - 2, 0, 4, canvasHeight);

      // Draw handle caps for better visibility
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(trimStartPx - 4, canvasHeight / 2 - 10, 8, 20);
      ctx.fillRect(trimEndPx - 4, canvasHeight / 2 - 10, 8, 20);
    }
  };

  // Handle trim start change
  const handleTrimStartChange = (newStart: number) => {
    // Ensure start is always less than end and >= 0
    setTrimStart(Math.max(0, Math.min(newStart, trimEnd - 1)));
  };

  // Handle trim end change
  const handleTrimEndChange = (newEnd: number) => {
    // Ensure end is always greater than start and <= recordingTime
    setTrimEnd(Math.min(recordingTime, Math.max(newEnd, trimStart + 1)));
  };

  // Start drag operation for trim handles
  const startTrimDrag = (
    handle: "start" | "end",
    e: React.MouseEvent | React.TouchEvent
  ) => {
    isDraggingRef.current = true;
    activeTrimHandleRef.current = handle;

    // Store initial position for touch events
    if ("touches" in e) {
      initialTouchRef.current = e.touches[0].clientX;
      initialTrimValueRef.current = handle === "start" ? trimStart : trimEnd;
    }

    // Add document-level event listeners
    document.addEventListener("mousemove", handleTrimDrag);
    document.addEventListener("touchmove", handleTrimDrag, { passive: false });
    document.addEventListener("mouseup", endTrimDrag);
    document.addEventListener("touchend", endTrimDrag);
  };

  // Handle drag operation
  const handleTrimDrag = (e: MouseEvent | TouchEvent) => {
    if (
      !isDraggingRef.current ||
      !activeTrimHandleRef.current ||
      !sliderRef.current
    )
      return;

    e.preventDefault();

    const sliderRect = sliderRef.current.getBoundingClientRect();
    const sliderWidth = sliderRect.width;

    let clientX: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    // Calculate relative position within the slider
    const relativeX = Math.max(
      0,
      Math.min(clientX - sliderRect.left, sliderWidth)
    );
    const percentage = relativeX / sliderWidth;
    const newValue = Math.round(percentage * recordingTime);

    if (activeTrimHandleRef.current === "start") {
      handleTrimStartChange(newValue);
    } else {
      handleTrimEndChange(newValue);
    }
  };

  // End drag operation
  const endTrimDrag = () => {
    isDraggingRef.current = false;
    activeTrimHandleRef.current = null;

    // Remove document-level event listeners
    document.removeEventListener("mousemove", handleTrimDrag);
    document.removeEventListener("touchmove", handleTrimDrag);
    document.removeEventListener("mouseup", endTrimDrag);
    document.removeEventListener("touchend", endTrimDrag);
  };

  // Handle touch-based trim handle movement
  const handleTouchMove = (handle: "start" | "end", e: React.TouchEvent) => {
    if (!sliderRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - initialTouchRef.current;
    const sliderRect = sliderRef.current.getBoundingClientRect();
    const pixelsPerSecond = sliderRect.width / recordingTime;

    const deltaSeconds = deltaX / pixelsPerSecond;
    const newValue = initialTrimValueRef.current + deltaSeconds;

    if (handle === "start") {
      handleTrimStartChange(Math.round(newValue));
    } else {
      handleTrimEndChange(Math.round(newValue));
    }
  };

  // Apply trimming to the audio
  const applyTrimming = async () => {
    if (!recordedAudioURL.current || trimStart >= trimEnd) return;

    try {
      setRecordingState("processing");

      const audioEl = new Audio(recordedAudioURL.current);

      // Wait for audio to load
      await new Promise((resolve) => {
        audioEl.addEventListener("loadedmetadata", resolve);
        audioEl.load();
      });

      // Create a new context and fetch the audio data
      const audioContext = new AudioContext();
      const response = await fetch(recordedAudioURL.current);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create a new buffer for the trimmed section
      const trimmedLength = (trimEnd - trimStart) * audioBuffer.sampleRate;
      const trimmedBuffer = audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        audioBuffer.sampleRate
      );

      // Copy the trimmed portion from the original buffer
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const trimmedData = trimmedBuffer.getChannelData(channel);

        const startSample = trimStart * audioBuffer.sampleRate;

        for (let i = 0; i < trimmedLength; i++) {
          trimmedData[i] = originalData[startSample + i];
        }
      }

      // Convert trimmed buffer to a blob
      const trimmedStream = audioContext.createMediaStreamDestination();
      const source = audioContext.createBufferSource();
      source.buffer = trimmedBuffer;
      source.connect(trimmedStream);
      source.start();

      // Record the stream
      const mediaRecorder = new MediaRecorder(trimmedStream.stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        // Create a new blob and update the recording
        const blob = new Blob(chunks, { type: "audio/webm" });

        // Clean up old URL
        if (recordedAudioURL.current) {
          URL.revokeObjectURL(recordedAudioURL.current);
        }

        // Create new URL
        recordedAudioURL.current = URL.createObjectURL(blob);

        // Update recorded chunks and recording time
        recordedChunksRef.current = [blob];
        setRecordingTime(trimEnd - trimStart);

        // Reset trim values
        setTrimStart(0);
        setTrimEnd(trimEnd - trimStart);

        // Update audio element
        if (audioRef.current) {
          audioRef.current.src = recordedAudioURL.current;
          audioRef.current.load();
        }

        // Exit trim mode
        setShowTrimControls(false);
        setRecordingState("reviewing");

        toast({
          title: "Trim Complete",
          description: "Your audio has been trimmed successfully.",
        });
      };

      // Start recording and stop when the buffer ends
      mediaRecorder.start();
      setTimeout(
        () => mediaRecorder.stop(),
        trimmedBuffer.duration * 1000 + 100
      );
    } catch (error) {
      console.error("Error trimming audio:", error);
      setRecordingState("reviewing");
      toast({
        title: "Trim Failed",
        description:
          "There was an error trimming your audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Apply enhancements to the audio
  const applyAudioEnhancement = async () => {
    if (!recordedAudioURL.current) return;

    setRecordingState("processing");

    // Simulate enhancement process
    toast({
      title: "Enhancing Audio",
      description: `Applying ${audioEnhancement} enhancement to your recording...`,
    });

    // In a real implementation, you would process the audio using a Web Audio API
    // or send it to a server for processing
    setTimeout(() => {
      setIsAudioProcessed(true);
      setRecordingState("reviewing");
      toast({
        title: "Enhancement Complete",
        description: `Your audio has been enhanced with the ${audioEnhancement} profile.`,
      });
    }, 2000);
  };

  // Start recording countdown
  const handleStartCountdown = () => {
    if (!micEnabled) {
      toast({
        title: "Microphone Disabled",
        description: "Please enable your microphone to start recording.",
        variant: "destructive",
      });
      return;
    }

    // Reset recording history
    setRecordingHistory([]);

    // Start countdown
    setCountdown(3);
    setRecordingState("countdown");

    // Set initial recording name based on question or time
    const defaultName = currentQuestion
      ? `Response to "${currentQuestion.substring(0, 30)}${currentQuestion.length > 30 ? "..." : ""}"`
      : `Recording ${new Date().toLocaleString()}`;
    setRecordingName(defaultName);
  };

  // Start recording
  const startRecording = () => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];

    // Use different mimeType options based on quality setting
    const mimeType = audioQuality === "studio" ? "audio/wav" : "audio/webm";

    const options = {
      mimeType,
      audioBitsPerSecond:
        audioQuality === "standard"
          ? 128000
          : audioQuality === "high"
            ? 256000
            : 320000,
    };

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, options);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });

        if (recordedAudioURL.current) {
          URL.revokeObjectURL(recordedAudioURL.current);
        }

        recordedAudioURL.current = URL.createObjectURL(blob);

        if (audioRef.current && recordingState !== "reviewing") {
          audioRef.current.src = recordedAudioURL.current;
          audioRef.current.load();
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;

      setRecordingState("recording");
      setRecordingTime(0);

      // Reset auto-silence detection
      lastSilenceTimeRef.current = Date.now();

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
        description: "Unable to start recording. Please try again.",
        variant: "destructive",
      });
      setRecordingState("idle");
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

      // Reset silence detection
      lastSilenceTimeRef.current = Date.now();

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
    setRecordingHistory([]);
    setIsAudioProcessed(false);
    setShowTrimControls(false);
    setTrimStart(0);
    setTrimEnd(0);
    setWaveformZoom(1);
    setEditMode("none");

    if (recordedAudioURL.current) {
      URL.revokeObjectURL(recordedAudioURL.current);
      recordedAudioURL.current = null;
    }

    initializeStream();
  };

  // Complete recording
  const completeRecording = () => {
    if (recordedChunksRef.current.length === 0) {
      toast({
        title: "No Recording Found",
        description: "There is no recording to submit.",
        variant: "destructive",
      });
      return;
    }

    setRecordingState("processing");

    setTimeout(() => {
      const blob = new Blob(recordedChunksRef.current);
      onRecordingComplete(blob);
      setRecordingState("complete");
    }, 1500);
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
    if (audioRef.current) {
      const time = parseInt(e.target.value);
      audioRef.current.currentTime = time;
      setPlaybackTime(time);
    }
  };

  // Toggle playback
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle volume change
  // const handleVolumeChange = (values: number[]) => {
  //   const newVolume = values[0];
  //   setVolume(newVolume);

  //   if (audioRef.current) {
  //     audioRef.current.volume = newVolume;
  //   }

  //   if (newVolume === 0) {
  //     setIsMuted(true);
  //   } else if (isMuted) {
  //     setIsMuted(false);
  //   }
  // };

  // Toggle microphone
  const toggleMicrophone = () => {
    setMicEnabled(!micEnabled);
  };

  // Toggle edit mode
  const toggleEditMode = (mode: AudioEditMode) => {
    if (editMode === mode) {
      // Turn off the mode if it's already active
      setEditMode("none");
      setShowTrimControls(false);
    } else {
      setEditMode(mode);
      if (mode === "trim") {
        setShowTrimControls(true);
      } else {
        setShowTrimControls(false);
      }
    }
  };

  // Download the recording
  const downloadRecording = () => {
    if (!recordedAudioURL.current) return;

    const downloadLink = document.createElement("a");
    downloadLink.href = recordedAudioURL.current;
    downloadLink.download = `${recordingName || "recording"}.webm`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Check if recording is short
  const isRecordingTooShort = recordingTime < 3;

  // Calculate voice activity color
  const getVoiceActivityColor = () => {
    if (!micEnabled) return "bg-red-500";
    if (voiceDetected) return "bg-green-500";
    return "bg-amber-500";
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full rounded-xl overflow-hidden shadow-xl transition-all",
        isFullscreen ? "fixed inset-0 z-50" : "relative",
        isMobileView ? "border border-gray-200" : "border border-gray-200"
      )}
      style={{
        backgroundColor: `${primaryColor}05`, // Very light primary color background
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden flex flex-col",
          isFullscreen ? "min-h-screen" : "",
          isMobileView ? "p-4" : "p-6"
        )}
      >
        {/* Audio element (hidden) */}
        <audio
          ref={audioRef}
          className="hidden"
          controls
          onTimeUpdate={() => {
            if (audioRef.current && recordingState === "reviewing") {
              setPlaybackTime(Math.floor(audioRef.current.currentTime));
            }
          }}
          onEnded={() => {
            if (recordingState === "reviewing") {
              setIsPlaying(false);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Header with brand and controls */}
        <div
          className={cn(
            "flex items-center justify-between",
            isMobileView ? "mb-3" : "mb-4"
          )}
        >
          {/* Brand */}
          <div className="flex items-center gap-2">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className={cn(
                  "rounded-md object-contain bg-white/80 p-1 shadow-sm",
                  isMobileView ? "h-6 w-6" : "h-8 w-8"
                )}
              />
            ) : (
              <div
                className={cn(
                  "rounded-md flex items-center justify-center text-white font-bold",
                  isMobileView ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"
                )}
                style={{ backgroundColor: primaryColor }}
              >
                {companyName.slice(0, 2).toUpperCase()}
              </div>
            )}
            {(!isMobileView || isFullscreen) && (
              <span className="text-foreground font-medium hidden md:inline-block">
                {companyName}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {recordingState === "reviewing" && (
              <>
                {/* Desktop view */}
                {!isMobileView && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 rounded-full"
                      onClick={downloadRecording}
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Download</span>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 rounded-full"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={() => toggleEditMode("trim")}
                          className={editMode === "trim" ? "bg-accent" : ""}
                        >
                          <Scissors className="h-4 w-4 mr-2" />
                          <span>Trim Audio</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleEditMode("enhance")}
                          className={editMode === "enhance" ? "bg-accent" : ""}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          <span>Enhance Audio</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setRecordingState("idle")}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Discard</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                {/* Mobile view */}
                {isMobileView && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Recording Options</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            toggleEditMode("trim");
                            document
                              .querySelector('[role="dialog"]')
                              ?.closest('[role="dialog"]')
                              ?.dispatchEvent(new CustomEvent("close"));
                          }}
                        >
                          <Scissors className="h-4 w-4" />
                          Trim Audio
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={() => {
                            toggleEditMode("enhance");
                            document
                              .querySelector('[role="dialog"]')
                              ?.closest('[role="dialog"]')
                              ?.dispatchEvent(new CustomEvent("close"));
                          }}
                        >
                          <Wand2 className="h-4 w-4" />
                          Enhance Audio
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2"
                          onClick={downloadRecording}
                        >
                          <Download className="h-4 w-4" />
                          Download Recording
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-2 text-red-500 hover:text-red-600"
                          onClick={() => {
                            resetRecording();
                            document
                              .querySelector('[role="dialog"]')
                              ?.closest('[role="dialog"]')
                              ?.dispatchEvent(new CustomEvent("close"));
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Discard Recording
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}

            {recordingState === "idle" && !isMobileView && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={toggleFullscreen}
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fullscreen</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Question display */}
        {(recordingState === "idle" ||
          recordingState === "recording" ||
          recordingState === "paused") && (
          <div
            className={cn("text-center mb-6", isMobileView ? "mb-4" : "mb-6")}
          >
            <h3
              className={cn(
                "font-medium mb-2 text-gray-900",
                isMobileView ? "text-base" : "text-xl"
              )}
            >
              {currentQuestion}
            </h3>
            {!isMobileView && (
              <p className="text-muted-foreground text-sm">
                Answer naturally in 30-60 seconds. You can re-record if needed.
              </p>
            )}
          </div>
        )}

        {/* Countdown overlay */}
        <AnimatePresence>
          {recordingState === "countdown" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-20"
            >
              <motion.div
                key={countdown}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "font-bold",
                  isMobileView ? "text-5xl" : "text-7xl"
                )}
                style={{ color: primaryColor }}
              >
                {countdown}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing overlay */}
        <AnimatePresence>
          {recordingState === "processing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm z-20"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Loader2
                  className="h-12 w-12 animate-spin mb-4"
                  style={{ color: primaryColor }}
                />
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3
                  className={cn(
                    "font-medium text-center",
                    isMobileView ? "text-lg" : "text-xl"
                  )}
                >
                  Processing your audio...
                </h3>
                <p className="text-muted-foreground text-sm mt-2 text-center">
                  This will only take a moment
                </p>
              </motion.div>
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
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/10 backdrop-blur-sm z-20"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="p-3 rounded-full mb-4"
                style={{ backgroundColor: primaryColor }}
              >
                <CheckCircle
                  className={cn(
                    "text-white",
                    isMobileView ? "h-10 w-10" : "h-12 w-12"
                  )}
                />
              </motion.div>
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center px-4"
              >
                <h3
                  className={cn(
                    "font-medium",
                    isMobileView ? "text-xl" : "text-2xl"
                  )}
                >
                  Great job!
                </h3>
                <p className="text-muted-foreground text-base mt-2 max-w-md">
                  Your audio testimonial has been successfully recorded.
                  {currentQuestionIndex < totalQuestions - 1
                    ? " Let's continue to the next question."
                    : " Thank you for sharing your experience!"}
                </p>

                {currentQuestionIndex < totalQuestions - 1 && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6"
                  >
                    <Button
                      className="gap-2 rounded-full px-5 py-2 text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col items-center">
          {/* Audio Visualization/Playback Area */}
          <div
            className={cn(
              "w-full max-w-xl rounded-xl mb-6 relative overflow-hidden shadow-sm transition-all duration-300",
              recordingState === "recording"
                ? "border-2 border-red-500/50 bg-red-500/5"
                : "border border-gray-200 bg-white/50",
              isMobileView ? "h-36" : "h-40",
              editMode === "trim" && "h-52",
              editMode === "enhance" && "h-auto"
            )}
          >
            {/* Active recording visualization */}
            {(recordingState === "idle" ||
              recordingState === "recording" ||
              recordingState === "paused") && (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full p-2 sm:p-4 flex items-center justify-center relative">
                  {/* Audio visualization bars */}
                  <div className="w-full max-w-md h-24 flex items-center justify-center gap-1">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const height =
                        recordingState === "recording"
                          ? 15 + visualizationData[i] * 80 ||
                            5 + Math.random() * 70
                          : 5 + Math.random() * 10;

                      return (
                        <motion.div
                          key={i}
                          className="w-2 rounded-full"
                          style={{
                            backgroundColor:
                              recordingState === "recording"
                                ? primaryColor
                                : "#94a3b8",
                            height: `${height}%`,
                            opacity:
                              recordingState === "recording"
                                ? 0.6 + visualizationData[i] * 0.4
                                : 0.3,
                          }}
                          animate={{
                            height: `${height}%`,
                            opacity:
                              recordingState === "recording"
                                ? 0.6 + visualizationData[i] * 0.4
                                : 0.3,
                          }}
                          transition={{
                            duration: 0.1,
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Voice Detection Indicator */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs">
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        getVoiceActivityColor()
                      )}
                    ></div>
                    <span className="text-gray-500 hidden sm:inline-block">
                      {!micEnabled
                        ? "Microphone Off"
                        : voiceDetected
                          ? "Voice Detected"
                          : "No Voice Detected"}
                    </span>
                  </div>

                  {recordingState === "recording" && (
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-2 bg-red-500/20 text-red-600 px-3 py-1.5 rounded-full text-xs sm:text-sm">
                      <div className="h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="font-medium">REC</span>
                      <span>{formatTime(recordingTime)}</span>
                    </div>
                  )}

                  {recordingState === "paused" && (
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-2 bg-amber-500/20 text-amber-600 px-3 py-1.5 rounded-full text-xs sm:text-sm">
                      <Pause className="h-3 w-3" />
                      <span className="font-medium">PAUSED</span>
                      <span>{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Audio playback visualization */}
            {recordingState === "reviewing" && editMode === "none" && (
              <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 py-4">
                <div className="text-center mb-1 sm:mb-2 flex justify-center">
                  <Badge
                    variant="outline"
                    className="mb-1 text-xs"
                    style={{
                      borderColor: `${primaryColor}50`,
                      color: primaryColor,
                    }}
                  >
                    {formatTime(playbackTime)} / {formatTime(recordingTime)}
                  </Badge>
                </div>

                <div className="relative h-8 sm:h-12 bg-slate-100 rounded-lg overflow-hidden">
                  {/* Playback progress */}
                  <div
                    className="absolute top-0 bottom-0 left-0 h-full transition-all duration-100"
                    style={{
                      width: `${(playbackTime / recordingTime) * 100}%`,
                      backgroundColor: primaryColor + "40", // Semi-transparent primary color
                    }}
                  ></div>

                  {/* Playback slider */}
                  <input
                    type="range"
                    min="0"
                    max={recordingTime}
                    value={playbackTime}
                    onChange={handlePlaybackChange}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                  />

                  {/* AudioWaveform visualization (simulated) */}
                  <div className="absolute inset-0 flex items-center px-2">
                    {Array.from({ length: 100 }).map((_, i) => {
                      // Create a semi-random but repeatable pattern
                      const seed = (i * 17) % 50;
                      const height = 5 + seed / 2;
                      const isPlayed =
                        (i / 100) * recordingTime <= playbackTime;

                      return (
                        <div
                          key={i}
                          className="w-0.5 mx-0.5 rounded-full"
                          style={{
                            height: `${height}px`,
                            backgroundColor: isPlayed
                              ? primaryColor
                              : "#94a3b8",
                            opacity: isPlayed ? 0.9 : 0.3,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-center items-center mt-3 sm:mt-4 gap-4">
                  {/* Volume control */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Play button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-10 w-10 sm:h-12 sm:w-12 border-2"
                    style={{
                      borderColor: primaryColor,
                      color: primaryColor,
                    }}
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <Play className="h-5 w-5 sm:h-6 sm:w-6" />
                    )}
                  </Button>

                  {/* Speed control (optional) */}
                  <Select defaultValue="1">
                    <SelectTrigger className="w-[70px] h-9 text-xs">
                      <SelectValue placeholder="1x" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">0.5x</SelectItem>
                      <SelectItem value="0.75">0.75x</SelectItem>
                      <SelectItem value="1">1x</SelectItem>
                      <SelectItem value="1.25">1.25x</SelectItem>
                      <SelectItem value="1.5">1.5x</SelectItem>
                      <SelectItem value="2">2x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Audio trimming interface */}
            {recordingState === "reviewing" && editMode === "trim" && (
              <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 py-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Trim Recording</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={() =>
                        setWaveformZoom(Math.max(1, waveformZoom - 0.5))
                      }
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={() =>
                        setWaveformZoom(Math.min(4, waveformZoom + 0.5))
                      }
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Canvas for waveform */}
                <div className="relative">
                  <canvas
                    ref={waveformCanvasRef}
                    width={600}
                    height={100}
                    className="w-full h-24 rounded-md bg-slate-50"
                  ></canvas>

                  {/* Trim slider */}
                  <div
                    ref={sliderRef}
                    className="absolute inset-0 flex items-center"
                  >
                    {/* Trim handles */}
                    {showTrimControls && (
                      <>
                        {/* Start handle */}
                        <div
                          ref={trimStartHandleRef}
                          className="absolute top-0 bottom-0 w-4 cursor-ew-resize touch-none z-10"
                          style={{
                            left: `${(trimStart / recordingTime) * 100}%`,
                          }}
                          onMouseDown={(e) => startTrimDrag("start", e)}
                          onTouchStart={(e) => {
                            initialTouchRef.current = e.touches[0].clientX;
                            initialTrimValueRef.current = trimStart;
                            activeTrimHandleRef.current = "start";
                          }}
                          onTouchMove={(e) => handleTouchMove("start", e)}
                          onTouchEnd={() => {
                            activeTrimHandleRef.current = null;
                          }}
                        >
                          <div
                            className="absolute left-1 top-0 bottom-0 w-0.5 bg-white border-l-2 border-r-2"
                            style={{ borderColor: primaryColor }}
                          ></div>
                        </div>

                        {/* End handle */}
                        <div
                          ref={trimEndHandleRef}
                          className="absolute top-0 bottom-0 w-4 cursor-ew-resize touch-none z-10"
                          style={{
                            left: `${(trimEnd / recordingTime) * 100}%`,
                          }}
                          onMouseDown={(e) => startTrimDrag("end", e)}
                          onTouchStart={(e) => {
                            initialTouchRef.current = e.touches[0].clientX;
                            initialTrimValueRef.current = trimEnd;
                            activeTrimHandleRef.current = "end";
                          }}
                          onTouchMove={(e) => handleTouchMove("end", e)}
                          onTouchEnd={() => {
                            activeTrimHandleRef.current = null;
                          }}
                        >
                          <div
                            className="absolute left-1 top-0 bottom-0 w-0.5 bg-white border-l-2 border-r-2"
                            style={{ borderColor: primaryColor }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Trim timing display */}
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <div>{formatTime(trimStart)}</div>
                  <div>Selection: {formatTime(trimEnd - trimStart)}</div>
                  <div>{formatTime(trimEnd)}</div>
                </div>

                {/* Trim controls */}
                <div className="flex justify-between mt-3 sm:mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => toggleEditMode("none")}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full px-4 text-white"
                    style={{ backgroundColor: primaryColor }}
                    onClick={applyTrimming}
                    disabled={trimStart >= trimEnd - 1}
                  >
                    Apply Trim
                  </Button>
                </div>
              </div>
            )}

            {/* Audio enhancement interface */}
            {recordingState === "reviewing" && editMode === "enhance" && (
              <div className="absolute inset-0 flex flex-col p-4 sm:p-6">
                <div className="text-sm font-medium mb-3">Enhance Audio</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                      audioEnhancement === "default"
                        ? "ring-2 ring-offset-2"
                        : "opacity-80 hover:opacity-100",
                      "border border-gray-200"
                    )}
                    style={{
                      outlineColor:
                        audioEnhancement === "default"
                          ? primaryColor
                          : "transparent",
                      outlineOffset:
                        audioEnhancement === "default" ? "2px" : "0",
                      outline:
                        audioEnhancement === "default"
                          ? `2px solid ${primaryColor}`
                          : "none",
                    }}
                    onClick={() => setAudioEnhancement("default")}
                  >
                    <CardContent className="p-3 flex flex-col items-center">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center mb-2 mt-2"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <Mic
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                      </div>
                      <div className="font-medium text-sm">Standard</div>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        Balanced enhancement for general use
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                      audioEnhancement === "voice"
                        ? "ring-2 ring-offset-2"
                        : "opacity-80 hover:opacity-100",
                      "border border-gray-200"
                    )}
                    style={{
                      outlineColor:
                        audioEnhancement === "voice"
                          ? primaryColor
                          : "transparent",
                      outlineOffset: audioEnhancement === "voice" ? "2px" : "0",
                      outline:
                        audioEnhancement === "voice"
                          ? `2px solid ${primaryColor}`
                          : "none",
                    }}
                    onClick={() => setAudioEnhancement("voice")}
                  >
                    <CardContent className="p-3 flex flex-col items-center">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center mb-2 mt-2"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <AudioWaveform
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                      </div>
                      <div className="font-medium text-sm">Voice Clarity</div>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        Optimized for speech and vocal clarity
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                      audioEnhancement === "ambient"
                        ? "ring-2 ring-offset-2"
                        : "opacity-80 hover:opacity-100",
                      "border border-gray-200"
                    )}
                    style={{
                      outlineColor:
                        audioEnhancement === "ambient"
                          ? primaryColor
                          : "transparent",
                      outlineOffset:
                        audioEnhancement === "ambient" ? "2px" : "0",
                      outline:
                        audioEnhancement === "ambient"
                          ? `2px solid ${primaryColor}`
                          : "none",
                    }}
                    onClick={() => setAudioEnhancement("ambient")}
                  >
                    <CardContent className="p-3 flex flex-col items-center">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center mb-2 mt-2"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <SunMoon
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                      </div>
                      <div className="font-medium text-sm">
                        Background Noise
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        Improves recordings with ambient noise
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                      audioEnhancement === "music"
                        ? "ring-2 ring-offset-2"
                        : "opacity-80 hover:opacity-100",
                      "border border-gray-200"
                    )}
                    style={{
                      outlineColor:
                        audioEnhancement === "music"
                          ? primaryColor
                          : "transparent",
                      outlineOffset: audioEnhancement === "music" ? "2px" : "0",
                      outline:
                        audioEnhancement === "music"
                          ? `2px solid ${primaryColor}`
                          : "none",
                    }}
                    onClick={() => setAudioEnhancement("music")}
                  >
                    <CardContent className="p-3 flex flex-col items-center">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center mb-2 mt-2"
                        style={{ backgroundColor: `${primaryColor}20` }}
                      >
                        <Headphones
                          className="h-4 w-4"
                          style={{ color: primaryColor }}
                        />
                      </div>
                      <div className="font-medium text-sm">Studio Quality</div>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        High-fidelity sound with rich details
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhancement controls */}
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => toggleEditMode("none")}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-full px-4 text-white gap-2"
                    style={{ backgroundColor: primaryColor }}
                    onClick={applyAudioEnhancement}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    Enhance Audio
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Main action buttons */}
          <div
            className={cn(
              "flex justify-center gap-3 sm:gap-4",
              isMobileView ? "mb-4" : "mb-6"
            )}
          >
            {recordingState === "idle" && (
              <Button
                className="rounded-full px-4 sm:px-6 text-white gap-2 relative overflow-hidden shadow-lg hover:shadow-xl border-0"
                style={{ backgroundColor: primaryColor }}
                onClick={handleStartCountdown}
                disabled={!micEnabled}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Start Recording
                </span>
                <span
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(45deg, ${primaryColor} 0%, ${adjustColor(primaryColor, 20)} 100%)`,
                  }}
                ></span>
              </Button>
            )}

            {recordingState === "recording" && (
              <>
                <Button
                  variant="outline"
                  className="rounded-full px-3 sm:px-4 gap-2 border-gray-300"
                  onClick={pauseRecording}
                >
                  <Pause className="h-4 w-4" />
                  <span className={isMobileView ? "hidden" : ""}>Pause</span>
                </Button>

                <Button
                  variant="destructive"
                  className="rounded-full px-3 sm:px-4 gap-2"
                  onClick={stopRecording}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className={isMobileView ? "hidden" : ""}>Finish</span>
                </Button>
              </>
            )}

            {recordingState === "paused" && (
              <>
                <Button
                  variant="outline"
                  className="rounded-full px-3 sm:px-4 gap-2 border-gray-300"
                  onClick={resumeRecording}
                >
                  <Play className="h-4 w-4" />
                  <span className={isMobileView ? "hidden" : ""}>Resume</span>
                </Button>

                <Button
                  variant="destructive"
                  className="rounded-full px-3 sm:px-4 gap-2"
                  onClick={stopRecording}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className={isMobileView ? "hidden" : ""}>Finish</span>
                </Button>
              </>
            )}

            {recordingState === "reviewing" && (
              <>
                <Button
                  variant="outline"
                  className="rounded-full px-3 sm:px-4 gap-2 border-gray-300"
                  onClick={resetRecording}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className={isMobileView ? "hidden" : ""}>
                    Re-record
                  </span>
                </Button>

                <Button
                  className="rounded-full px-3 sm:px-4 gap-2 text-white"
                  style={{ backgroundColor: primaryColor }}
                  onClick={completeRecording}
                  disabled={isRecordingTooShort}
                >
                  {isRecordingTooShort ? (
                    <>
                      <AlertOctagon className="h-4 w-4" />
                      <span>Too short</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {!isMobileView ? "Use This Recording" : "Use"}
                      </span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Secondary controls for idle state */}
          {recordingState === "idle" && (
            <div className="flex gap-2 sm:gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-9 w-9"
                      onClick={toggleMicrophone}
                    >
                      {micEnabled ? (
                        <Mic className="h-4 w-4" />
                      ) : (
                        <MicOff className="h-4 w-4 text-destructive" />
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
                      className="rounded-full h-9 w-9"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Audio Settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {showAIHelp && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-9 w-9"
                        onClick={() => setShowHelp(!showHelp)}
                      >
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Recording Tips</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          {/* AI Tips panel */}
          <AnimatePresence>
            {showHelp && recordingState === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={cn(
                  "max-w-md mt-6 p-6 rounded-xl border shadow-sm bg-white",
                  isMobileView ? "p-4 mt-4" : "p-6 mt-6"
                )}
                style={{
                  borderColor: `${primaryColor}30`,
                }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="p-2 rounded-full"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Sparkles
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div>
                    <h3
                      className={cn(
                        "font-medium",
                        isMobileView ? "text-base" : "text-lg"
                      )}
                    >
                      Tips for Great Audio
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm">
                      Follow these tips for the best quality recording
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  {aiTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${primaryColor}20`,
                          color: primaryColor,
                        }}
                      >
                        {index + 1}
                      </div>
                      <p className={cn(isMobileView ? "text-xs" : "text-sm")}>
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Always test your microphone before recording
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHelp(false)}
                    className="rounded-full"
                  >
                    Got It
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Settings panel */}
          <AnimatePresence>
            {showSettings && recordingState === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className={cn(
                  "max-w-md w-full mt-6 rounded-xl border shadow-sm bg-white",
                  isMobileView ? "p-4 mt-4" : "p-6 mt-6"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <h3
                      className={cn(
                        "font-medium",
                        isMobileView ? "text-base" : "text-lg"
                      )}
                    >
                      Audio Settings
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={() => setShowSettings(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tabs for mobile */}
                {isMobileView && (
                  <Tabs defaultValue="basic">
                    <TabsList className="w-full mb-4">
                      <TabsTrigger value="basic" className="flex-1">
                        Basic
                      </TabsTrigger>
                      <TabsTrigger value="advanced" className="flex-1">
                        Advanced
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mic-select">Microphone</Label>
                        <Select
                          value={selectedMic}
                          onValueChange={setSelectedMic}
                        >
                          <SelectTrigger id="mic-select">
                            <SelectValue placeholder="Select microphone" />
                          </SelectTrigger>
                          <SelectContent>
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
                        <Label htmlFor="quality-select">Audio Quality</Label>
                        <Select
                          value={audioQuality}
                          onValueChange={(value: AudioQuality) =>
                            setAudioQuality(value)
                          }
                        >
                          <SelectTrigger id="quality-select">
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">
                              Standard (128kbps)
                            </SelectItem>
                            <SelectItem value="high">High (256kbps)</SelectItem>
                            <SelectItem value="studio">
                              Studio (320kbps)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Audio Enhancements</Label>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AudioWaveform className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Noise Reduction</span>
                          </div>
                          <Switch
                            checked={noiseReduction}
                            onCheckedChange={setNoiseReduction}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Echo Cancellation</span>
                          </div>
                          <Switch
                            checked={echoCancellation}
                            onCheckedChange={setEchoCancellation}
                          />
                        </div>

                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between items-center">
                            <Label>Microphone Level</Label>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(audioInputLevel * 100)}%
                            </Badge>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-75"
                              style={{
                                width: `${audioInputLevel * 100}%`,
                                backgroundColor: primaryColor,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Speak to test your microphone level
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="advanced" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Environment Type</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={
                              environmentType === "quiet"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={cn(
                              "justify-start text-xs",
                              environmentType === "quiet"
                                ? "text-white"
                                : "text-foreground"
                            )}
                            style={
                              environmentType === "quiet"
                                ? { backgroundColor: primaryColor }
                                : {}
                            }
                            onClick={() => setEnvironmentType("quiet")}
                          >
                            <Headphones className="h-3.5 w-3.5 mr-1" />
                            Quiet
                          </Button>
                          <Button
                            variant={
                              environmentType === "office"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={cn(
                              "justify-start text-xs",
                              environmentType === "office"
                                ? "text-white"
                                : "text-foreground"
                            )}
                            style={
                              environmentType === "office"
                                ? { backgroundColor: primaryColor }
                                : {}
                            }
                            onClick={() => setEnvironmentType("office")}
                          >
                            <Headphones className="h-3.5 w-3.5 mr-1" />
                            Office
                          </Button>
                          <Button
                            variant={
                              environmentType === "noisy"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            className={cn(
                              "justify-start text-xs",
                              environmentType === "noisy"
                                ? "text-white"
                                : "text-foreground"
                            )}
                            style={
                              environmentType === "noisy"
                                ? { backgroundColor: primaryColor }
                                : {}
                            }
                            onClick={() => setEnvironmentType("noisy")}
                          >
                            <Headphones className="h-3.5 w-3.5 mr-1" />
                            Noisy
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-stop" className="cursor-pointer">
                            Auto-stop on silence
                          </Label>
                          <Switch
                            id="auto-stop"
                            checked={autoStopSilence}
                            onCheckedChange={setAutoStopSilence}
                          />
                        </div>
                        {autoStopSilence && (
                          <div className="space-y-2 mt-2">
                            <Label className="text-xs text-gray-500">
                              Stop after silence for:
                            </Label>
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  silenceDuration === 2 ? "default" : "outline"
                                }
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                style={
                                  silenceDuration === 2
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                                onClick={() => setSilenceDuration(2)}
                              >
                                2s
                              </Button>
                              <Button
                                variant={
                                  silenceDuration === 3 ? "default" : "outline"
                                }
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                style={
                                  silenceDuration === 3
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                                onClick={() => setSilenceDuration(3)}
                              >
                                3s
                              </Button>
                              <Button
                                variant={
                                  silenceDuration === 5 ? "default" : "outline"
                                }
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                style={
                                  silenceDuration === 5
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                                onClick={() => setSilenceDuration(5)}
                              >
                                5s
                              </Button>
                              <Button
                                variant={
                                  silenceDuration === 10 ? "default" : "outline"
                                }
                                size="sm"
                                className="flex-1 h-8 text-xs"
                                style={
                                  silenceDuration === 10
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                                onClick={() => setSilenceDuration(10)}
                              >
                                10s
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="show-reminders"
                          className="cursor-pointer"
                        >
                          Show recording reminders
                        </Label>
                        <Switch
                          id="show-reminders"
                          checked={showReminders}
                          onCheckedChange={setShowReminders}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recording-name">
                          Default Recording Name
                        </Label>
                        <Input
                          id="recording-name"
                          placeholder="My Recording"
                          value={recordingName}
                          onChange={(e) => setRecordingName(e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Desktop settings panel */}
                {!isMobileView && (
                  <div className="space-y-5">
                    {/* Basic settings */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="mic-select">Microphone</Label>
                        <Select
                          value={selectedMic}
                          onValueChange={setSelectedMic}
                        >
                          <SelectTrigger id="mic-select">
                            <SelectValue placeholder="Select microphone" />
                          </SelectTrigger>
                          <SelectContent>
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
                        <Label htmlFor="quality-select">Audio Quality</Label>
                        <Select
                          value={audioQuality}
                          onValueChange={(value: AudioQuality) =>
                            setAudioQuality(value)
                          }
                        >
                          <SelectTrigger id="quality-select">
                            <SelectValue placeholder="Select quality" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">
                              Standard (128kbps)
                            </SelectItem>
                            <SelectItem value="high">High (256kbps)</SelectItem>
                            <SelectItem value="studio">
                              Studio (320kbps)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Audio Enhancements</Label>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AudioWaveform className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Noise Reduction</span>
                          </div>
                          <Switch
                            checked={noiseReduction}
                            onCheckedChange={setNoiseReduction}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mic className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Echo Cancellation</span>
                          </div>
                          <Switch
                            checked={echoCancellation}
                            onCheckedChange={setEchoCancellation}
                          />
                        </div>
                      </div>

                      {/* Volume meter */}
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-center">
                          <Label>Microphone Level</Label>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(audioInputLevel * 100)}%
                          </Badge>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-75"
                            style={{
                              width: `${audioInputLevel * 100}%`,
                              backgroundColor: primaryColor,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Speak to test your microphone level
                        </p>
                      </div>

                      {/* Advanced Settings Toggle */}
                      <div className="pt-3 border-t">
                        <Button
                          variant="ghost"
                          className="w-full justify-between text-sm border border-slate-200 rounded-lg shadow-sm px-4 py-2 h-auto"
                          onClick={() =>
                            setShowAdvancedSettings(!showAdvancedSettings)
                          }
                        >
                          <span>Advanced Settings</span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              showAdvancedSettings && "rotate-180"
                            )}
                          />
                        </Button>
                      </div>

                      {/* Advanced Settings Panel */}
                      {showAdvancedSettings && (
                        <div
                          className="space-y-4 pt-4 pl-2 border-l-2"
                          style={{ borderColor: `${primaryColor}30` }}
                        >
                          <div className="space-y-2">
                            <Label>Environment Type</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant={
                                  environmentType === "quiet"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className={cn(
                                  "justify-start text-xs",
                                  environmentType === "quiet"
                                    ? "text-white"
                                    : "text-foreground"
                                )}
                                style={
                                  environmentType === "quiet"
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                                onClick={() => setEnvironmentType("quiet")}
                              >
                                <Headphones className="h-3.5 w-3.5 mr-1" />
                                Quiet
                              </Button>
                              <Button
                                variant={
                                  environmentType === "office"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className={cn(
                                  "justify-start text-xs",
                                  environmentType === "office"
                                    ? "text-white"
                                    : "text-foreground"
                                )}
                                style={
                                  environmentType === "office"
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                                onClick={() => setEnvironmentType("office")}
                              >
                                <Headphones className="h-3.5 w-3.5 mr-1" />
                                Office
                              </Button>
                              <Button
                                variant={
                                  environmentType === "noisy"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                className={cn(
                                  "justify-start text-xs",
                                  environmentType === "noisy"
                                    ? "text-white"
                                    : "text-foreground"
                                )}
                                style={
                                  environmentType === "noisy"
                                    ? { backgroundColor: primaryColor }
                                    : {}
                                }
                                onClick={() => setEnvironmentType("noisy")}
                              >
                                <Headphones className="h-3.5 w-3.5 mr-1" />
                                Noisy
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label
                                htmlFor="auto-stop-desktop"
                                className="cursor-pointer"
                              >
                                Auto-stop on silence
                              </Label>
                              <Switch
                                id="auto-stop-desktop"
                                checked={autoStopSilence}
                                onCheckedChange={setAutoStopSilence}
                              />
                            </div>
                            {autoStopSilence && (
                              <div className="space-y-2 mt-2">
                                <Label className="text-xs text-gray-500">
                                  Stop after silence for:
                                </Label>
                                <div className="flex gap-2">
                                  <Button
                                    variant={
                                      silenceDuration === 2
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    style={
                                      silenceDuration === 2
                                        ? { backgroundColor: primaryColor }
                                        : {}
                                    }
                                    onClick={() => setSilenceDuration(2)}
                                  >
                                    2s
                                  </Button>
                                  <Button
                                    variant={
                                      silenceDuration === 3
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    style={
                                      silenceDuration === 3
                                        ? { backgroundColor: primaryColor }
                                        : {}
                                    }
                                    onClick={() => setSilenceDuration(3)}
                                  >
                                    3s
                                  </Button>
                                  <Button
                                    variant={
                                      silenceDuration === 5
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    style={
                                      silenceDuration === 5
                                        ? { backgroundColor: primaryColor }
                                        : {}
                                    }
                                    onClick={() => setSilenceDuration(5)}
                                  >
                                    5s
                                  </Button>
                                  <Button
                                    variant={
                                      silenceDuration === 10
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    className="flex-1 h-8 text-xs"
                                    style={
                                      silenceDuration === 10
                                        ? { backgroundColor: primaryColor }
                                        : {}
                                    }
                                    onClick={() => setSilenceDuration(10)}
                                  >
                                    10s
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="show-reminders-desktop"
                              className="cursor-pointer"
                            >
                              Show recording reminders
                            </Label>
                            <Switch
                              id="show-reminders-desktop"
                              checked={showReminders}
                              onCheckedChange={setShowReminders}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="recording-name">
                              Default Recording Name
                            </Label>
                            <Input
                              id="recording-name"
                              placeholder="My Recording"
                              value={recordingName}
                              onChange={(e) => setRecordingName(e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => setShowSettings(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="rounded-full px-4 text-white"
                        style={{ backgroundColor: primaryColor }}
                        onClick={() => {
                          initializeStream();
                          setShowSettings(false);
                        }}
                      >
                        Apply Settings
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Question progress */}
      <div
        className={cn(
          "bg-white border-t py-3 px-6 flex items-center justify-between",
          isMobileView ? "px-4 py-2" : "px-6 py-3"
        )}
      >
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-muted-foreground",
              isMobileView ? "text-xs" : "text-sm"
            )}
          >
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <Progress
            value={(currentQuestionIndex / (totalQuestions - 1)) * 100}
            className={cn("h-2 bg-slate-100", isMobileView ? "w-20" : "w-32")}
            style={
              {
                "--progress-background": `${primaryColor}20`,
                "--progress-foreground": primaryColor,
              } as React.CSSProperties
            }
          />
        </div>

        <div className="flex items-center gap-3">
          {recordingState !== "processing" && recordingState !== "complete" && (
            <>
              {currentQuestionIndex > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1", isMobileView ? "h-7 px-2" : "h-8")}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              )}

              {currentQuestionIndex < totalQuestions - 1 &&
                recordingState === "idle" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("gap-1", isMobileView ? "h-7 px-2" : "h-8")}
                  >
                    <span className="hidden sm:inline">Skip</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedAudioRecorder;
