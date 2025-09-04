import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Circle, 
  Camera, 
  Mic, 
  MicOff, 
  CameraOff,
  Settings,

  ChevronRight,
  ChevronLeft,
  RotateCcw,
 
  Maximize,
  
  Timer,
  Lightbulb,
  Target,
  Smile,
  Clock
} from 'lucide-react';

const EnhancedVideoRecorder = () => {
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showFaceGuide, setShowFaceGuide] = useState(true);
  

const videoRef = useRef<HTMLVideoElement | null>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const timerRef = useRef<number | null>(null);



  
  // Sample questions and tips
  const questions = [
    {
      id: 1,
      question: "Could you describe a time that our product helped you?",
      tips: [
        "Pick a quiet and well-lit place",
        "Relax & be yourself – it doesn't have to be perfect",
        "You can redo your recording if you're not happy with it"
      ]
    },
    {
      id: 2,
      question: "What specific features do you find most valuable?",
      tips: [
        "Be specific about the features you mention",
        "Share concrete examples if possible",
        "Focus on the benefits these features provide"
      ]
    },
    {
      id: 3,
      question: "How has our product impacted your daily workflow?",
      tips: [
        "Describe the before and after scenario",
        "Mention time savings or efficiency gains",
        "Be authentic in your response"
      ]
    },
    {
      id: 4,
      question: "Would you recommend our product to others?",
      tips: [
        "Explain why you would or wouldn't recommend it",
        "Think about who would benefit most",
        "Share your honest perspective"
      ]
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const maxRecordingTime = 300; // 5 minutes

  // Fixed useEffect hooks
useEffect(() => {
  initializeCamera();
  return () => {
    if (stream) {
      (stream as MediaStream).getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
  };
}, []);

useEffect(() => {
  if (isRecording && !isPaused) {
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxRecordingTime) {
          stopRecording();
          return maxRecordingTime;
        }
        return prev + 1;
      });
    }, 1000);
  } else {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }
  
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, [isRecording, isPaused]);

  // Fixed functions
const initializeCamera = async (): Promise<void> => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: true
    });
    
    setStream(mediaStream);
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
  }
};
const startCountdown = (): void => {
  setCountdown(3);
  const countdownInterval = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        clearInterval(countdownInterval);
        startRecording();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
  const startRecording = (): void => {
  if (stream) {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    mediaRecorder.start();
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setShowFaceGuide(false);
  }
};

  const pauseRecording = (): void => {
  if (mediaRecorderRef.current && isRecording) {
    mediaRecorderRef.current.pause();
    setIsPaused(true);
  }
};

  const resumeRecording = (): void => {
  if (mediaRecorderRef.current && isPaused) {
    mediaRecorderRef.current.resume();
    setIsPaused(false);
  }
};

 const stopRecording = (): void => {
  if (mediaRecorderRef.current) {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setIsPaused(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }
};

  const resetRecording = (): void => {
  setRecordingTime(0);
  setIsRecording(false);
  setIsPaused(false);
  setShowFaceGuide(true);
  if (timerRef.current) {
    clearInterval(timerRef.current);
  }
};
  const nextQuestion = (): void => {
  if (currentQuestionIndex < totalQuestions - 1) {
    setCurrentQuestionIndex(prev => prev + 1);
    resetRecording();
  }
};
  const prevQuestion = (): void => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(prev => prev - 1);
    resetRecording();
  }
}

  const toggleCamera = (): void => {
  setIsCameraEnabled(!isCameraEnabled);
  if (stream) {
    (stream as MediaStream).getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !isCameraEnabled;
    });
  }
};

  const toggleMic = (): void => {
  setIsMicEnabled(!isMicEnabled);
  if (stream) {
    (stream as MediaStream).getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !isMicEnabled;
    });
  }
};

  const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
  const getProgressPercentage = () => {
    return Math.min((recordingTime / maxRecordingTime) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 p-6 flex flex-col">
        {/* Question Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-300">
              Step {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs text-slate-500">
              {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Question */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 leading-tight">
            {currentQuestion.question}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-slate-300 font-medium">Tips:</span>
            </div>
            
            {currentQuestion.tips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 text-sm text-slate-400">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full mt-2 flex-shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recording Guidelines */}
        <div className="bg-slate-700/30 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            Recording Guidelines
          </h3>
          <div className="space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Keep answers 30-60 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <Smile className="w-3 h-3" />
              <span>Be natural and authentic</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="w-3 h-3" />
              <span>Max recording time: 5 minutes</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-auto">
          <div className="flex gap-2">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Video Testimonial</h1>
                <p className="text-sm text-slate-400">Record your experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
            {/* Video Element */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />

            {/* Face Guide Overlay */}
            {showFaceGuide && !isRecording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-80 border-2 border-white/30 rounded-3xl flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-white/50 rounded-full flex items-center justify-center">
                      <div className="text-white/70 text-center">
                        <div className="w-16 h-16 border-2 border-white/60 rounded-full mx-auto mb-4" />
                        <p className="text-sm">Position your face here</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-white/60 rounded-tl-lg" />
                  <div className="absolute -top-4 -right-4 w-8 h-8 border-r-2 border-t-2 border-white/60 rounded-tr-lg" />
                  <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-2 border-b-2 border-white/60 rounded-bl-lg" />
                  <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-white/60 rounded-br-lg" />
                </div>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown > 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-6xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">REC</span>
                <span className="text-sm">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Paused Indicator */}
            {isPaused && (
              <div className="absolute top-4 left-4 bg-yellow-600 text-white px-3 py-2 rounded-full">
                <span className="text-sm font-medium">PAUSED</span>
              </div>
            )}

            {/* Progress Bar */}
            {isRecording && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            )}

            {/* Camera/Mic Status */}
            {(!isCameraEnabled || !isMicEnabled) && (
              <div className="absolute top-4 left-4 flex gap-2">
                {!isCameraEnabled && (
                  <div className="bg-red-600 text-white p-2 rounded-full">
                    <CameraOff className="w-4 h-4" />
                  </div>
                )}
                {!isMicEnabled && (
                  <div className="bg-red-600 text-white p-2 rounded-full">
                    <MicOff className="w-4 h-4" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Control Bar */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50 p-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full transition-colors ${
                  isCameraEnabled 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isCameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
              </button>
              
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full transition-colors ${
                  isMicEnabled 
                    ? 'bg-slate-700 text-white hover:bg-slate-600' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </div>

            {/* Center Controls */}
            <div className="flex items-center gap-4">
              {!isRecording && !isPaused && (
                <button
                  onClick={startCountdown}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full hover:from-red-700 hover:to-red-800 transition-all"
                >
                  <Circle className="w-5 h-5 fill-current" />
                  Start Recording
                </button>
              )}

              {isRecording && !isPaused && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={pauseRecording}
                    className="p-3 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 transition-colors"
                  >
                    <Pause className="w-5 h-5" />
                  </button>
                  <button
                    onClick={stopRecording}
                    className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                </div>
              )}

              {isPaused && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={resumeRecording}
                    className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                  <button
                    onClick={stopRecording}
                    className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4">
              {(isRecording || isPaused) && (
                <button
                  onClick={resetRecording}
                  className="p-3 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
              
              <span className="text-slate-400 text-sm font-mono">
                {formatTime(recordingTime)} / {formatTime(maxRecordingTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoRecorder;