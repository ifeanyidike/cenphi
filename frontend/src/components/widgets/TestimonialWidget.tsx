import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import icons
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Camera,
  Mic,
  FileText,
  Upload,
  Video,
  Image,
  Check,
  Gift,
  Send,
  Lightbulb,
  Info,
} from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import { IncentiveConfig, WidgetCustomization } from "@/types/setup";

// Define prop types
interface TestimonialWidgetProps {
  onClose: () => void;
  onSubmit: (data: TestimonialData) => void;
  customization: WidgetCustomization;
  incentives: IncentiveConfig;
  initialStep?: number;
  isEmbedded?: boolean;
}

// Define testimonial data type
interface TestimonialData {
  rating: number;
  feedback: string;
  format: "text" | "video" | "audio" | "image";
  mediaUrl?: string;
  permission: "public" | "anonymous" | "private";
  questions?: Record<string, string>;
  metadata?: Record<string, any>;
}

// Main testimonial widget component
export const TestimonialWidget: React.FC<TestimonialWidgetProps> = ({
  onClose,
  onSubmit,
  customization,
  incentives,
  initialStep = 0,
}) => {
  // State
  const [step, setStep] = useState(initialStep);
  const [testimonialData, setTestimonialData] = useState<TestimonialData>({
    rating: 0,
    feedback: "",
    format: "text",
    permission: "public",
    questions: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setIsSubmitted] = useState(false);
  const [showIncentive, setShowIncentive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<number | null>(null);
  // Default questions if none provided
  const questions = customization.questions || [
    "What problem were you trying to solve?",
    "How did our product help you solve it?",
    "What specific feature did you like most?",
    "Would you recommend our product to others?",
  ];

  // Animation variants

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  // Handle component cleanup
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  // Method to handle rating selection
  const handleRatingChange = (value: number) => {
    setTestimonialData((prev) => ({
      ...prev,
      rating: value,
    }));
  };

  // Method to handle format selection
  const handleFormatChange = (format: "text" | "video" | "audio" | "image") => {
    setTestimonialData((prev) => ({
      ...prev,
      format,
    }));
    setStep((prev) => prev + 1);
  };

  // Method to handle permission selection
  const handlePermissionChange = (
    permission: "public" | "anonymous" | "private"
  ) => {
    setTestimonialData((prev) => ({
      ...prev,
      permission,
    }));
  };

  // Method to handle feedback text change
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTestimonialData((prev) => ({
      ...prev,
      feedback: e.target.value,
    }));
  };

  // Method to handle question answers
  const handleQuestionAnswer = (questionIndex: number, answer: string) => {
    setTestimonialData((prev) => ({
      ...prev,
      questions: {
        ...(prev.questions || {}),
        [questionIndex]: answer,
      },
    }));
  };

  // Method to handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview URL
    const preview = URL.createObjectURL(file);
    setMediaPreview(preview);

    // Store file metadata
    setTestimonialData((prev) => ({
      ...prev,
      mediaUrl: preview,
      metadata: {
        ...(prev.metadata || {}),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    }));
  };

  // Method to trigger file upload dialog
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Method to start recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);

    // Start a timer to track recording duration
    recordingTimerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // In a real implementation, this would initialize the browser's recording API
    // For this demo, we'll simulate a recording
  };

  // Method to stop recording
  const stopRecording = () => {
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // In a real implementation, this would stop the recording and get the resulting media
    // For this demo, we'll simulate a recording result

    // Simulate a delay to process the recording
    setTimeout(() => {
      // Create a fake media URL
      setMediaPreview(
        testimonialData.format === "video"
          ? "video-recording-preview.mp4"
          : "audio-recording-preview.mp3"
      );

      // Update testimonial data
      setTestimonialData((prev) => ({
        ...prev,
        mediaUrl:
          testimonialData.format === "video"
            ? "video-recording.mp4"
            : "audio-recording.mp3",
        metadata: {
          ...(prev.metadata || {}),
          recordingDuration: recordingTime,
          recordingDate: new Date().toISOString(),
        },
      }));
    }, 1000);
  };

  // Method to go to next step
  const nextStep = () => {
    if (step === 3 && currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  // Method to go to previous step
  const prevStep = () => {
    if (step === 3 && currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    } else if (step > 0) {
      setStep((prev) => prev - 1);
    } else {
      onClose();
    }
  };

  // Method to check if can proceed to next step
  const canProceed = () => {
    switch (step) {
      case 0: // Intro
        return true;
      case 1: // Rating
        return testimonialData.rating > 0;
      case 2: // Format
        return (testimonialData.format as any) !== ""; // Format is selected when clicking
      case 3: // Questions/Content
        if (testimonialData.format === "text") {
          const answer = testimonialData.questions?.[currentQuestion] || "";
          return answer.trim().length >= 10;
        } else {
          return !!mediaPreview;
        }
      case 4: // Permissions
        return !!testimonialData.permission;
      case 5: // Review
        return true;
      default:
        return true;
    }
  };

  // Method to handle final submission
  const handleSubmit = () => {
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      // If incentives are enabled, show them
      if (incentives.enabled) {
        setShowIncentive(true);
      }

      // Send data to parent component
      onSubmit(testimonialData);

      // In a real implementation, close the widget after some time
      setTimeout(() => {
        onClose();
      }, 5000);
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

  // Get the primary color with a fallback
  const primaryColor = customization.primaryColor || "#4F46E5";

  // Render the appropriate content based on current step
  const renderStepContent = () => {
    switch (step) {
      case 0: // Intro step
        return (
          <motion.div
            key="intro"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                {customization.widgetTitle || "Share Your Experience"}
              </h3>
              <p className="text-gray-600">
                {customization.widgetDescription ||
                  "We'd love to hear what you think about our product!"}
              </p>
            </div>

            {incentives?.enabled && (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-start gap-3">
                  <Gift className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800">
                      Exclusive Reward
                    </h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Share your feedback and receive {incentives?.value} as our
                      thanks!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-4 rounded-lg border border-blue-100 bg-blue-50">
              <Lightbulb className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                This will only take 1-2 minutes of your time. Your feedback
                helps us improve.
              </p>
            </div>
          </motion.div>
        );

      case 1: // Rating step
        return (
          <motion.div
            key="rating"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                How would you rate your experience?
              </h3>
              <p className="text-gray-600">
                Please select a rating that reflects your overall satisfaction
              </p>
            </div>

            <div className="flex justify-center py-4">
              <div className="flex gap-1 md:gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className="p-1.5 focus:outline-none rounded transition-transform hover:scale-110"
                    onClick={() => handleRatingChange(value)}
                  >
                    <Star
                      className={`h-10 w-10 md:h-12 md:w-12 transition-colors ${
                        value <= testimonialData.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {testimonialData.rating > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <span className="block font-medium text-lg">
                  {testimonialData.rating <= 2
                    ? "We're sorry to hear that"
                    : testimonialData.rating === 3
                      ? "Thank you for your feedback"
                      : "That's great to hear!"}
                </span>
                <span className="text-gray-600 text-sm block mt-1">
                  {testimonialData.rating <= 3
                    ? "Please let us know how we can improve"
                    : "We'd love to hear more about your experience"}
                </span>
              </motion.div>
            )}
          </motion.div>
        );

      case 2: // Format selection step
        return (
          <motion.div
            key="format"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                How would you like to share?
              </h3>
              <p className="text-gray-600">
                Choose your preferred format for sharing your experience
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <motion.button
                className="p-6 border rounded-lg text-center hover:border-blue-300 hover:bg-blue-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFormatChange("text")}
              >
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-blue-100 mb-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="font-medium block mb-1">Text</span>
                  <span className="text-sm text-gray-500">
                    Write your feedback
                  </span>
                </div>
              </motion.button>

              <motion.button
                className="p-6 border rounded-lg text-center hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFormatChange("video")}
              >
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-indigo-100 mb-3">
                    <Video className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="font-medium block mb-1">Video</span>
                  <span className="text-sm text-gray-500">
                    Record a video testimonial
                  </span>
                </div>
              </motion.button>

              <motion.button
                className="p-6 border rounded-lg text-center hover:border-green-300 hover:bg-green-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFormatChange("audio")}
              >
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-green-100 mb-3">
                    <Mic className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="font-medium block mb-1">Audio</span>
                  <span className="text-sm text-gray-500">
                    Record a voice testimonial
                  </span>
                </div>
              </motion.button>

              <motion.button
                className="p-6 border rounded-lg text-center hover:border-amber-300 hover:bg-amber-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleFormatChange("image")}
              >
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-amber-100 mb-3">
                    <Image className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="font-medium block mb-1">Photo</span>
                  <span className="text-sm text-gray-500">
                    Upload a photo with text
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>
        );

      case 3: // Content step (questions or media recording)
        return (
          <motion.div
            key={`content-${currentQuestion}`}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="space-y-6"
          >
            {testimonialData.format === "text" ? (
              // Text testimonial questions
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {questions[currentQuestion]}
                  </h3>
                  <Badge>
                    Question {currentQuestion + 1}/{questions.length}
                  </Badge>
                </div>

                <Textarea
                  value={testimonialData.questions?.[currentQuestion] || ""}
                  onChange={(e) =>
                    handleQuestionAnswer(currentQuestion, e.target.value)
                  }
                  placeholder="Share your thoughts here..."
                  className="min-h-[150px]"
                />

                <div className="text-right text-sm text-gray-500">
                  {testimonialData.questions?.[currentQuestion]?.length || 0}{" "}
                  characters
                  {(testimonialData.questions?.[currentQuestion]?.length || 0) <
                    10 && (
                    <span className="text-red-500 ml-1">(minimum 10)</span>
                  )}
                </div>
              </div>
            ) : testimonialData.format === "video" ? (
              // Video recording interface
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Record a video testimonial
                </h3>

                {mediaPreview ? (
                  <div className="border rounded-lg p-4">
                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center mb-3">
                      <video
                        src={mediaPreview}
                        controls
                        className="max-h-full max-w-full rounded"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMediaPreview(null);
                          setTestimonialData((prev) => ({
                            ...prev,
                            mediaUrl: undefined,
                            metadata: {
                              ...(prev.metadata || {}),
                              recordingDuration: undefined,
                              recordingDate: undefined,
                            },
                          }));
                        }}
                      >
                        Re-record
                      </Button>
                      <Badge variant="outline">
                        {formatTime(
                          testimonialData.metadata?.recordingDuration || 0
                        )}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 flex flex-col items-center">
                    {isRecording ? (
                      <div className="space-y-4 w-full">
                        <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
                          <div className="absolute top-4 right-4">
                            <Badge
                              variant="destructive"
                              className="animate-pulse"
                            >
                              REC {formatTime(recordingTime)}
                            </Badge>
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Camera className="h-12 w-12 text-white opacity-70" />
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Button variant="destructive" onClick={stopRecording}>
                            Stop Recording
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="p-4 rounded-full bg-indigo-100 mb-4 inline-flex">
                          <Video className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h4 className="text-lg font-medium mb-2">
                          Ready to record?
                        </h4>
                        <p className="text-gray-500 mb-4 max-w-md">
                          Share your experience in a short video. Just look at
                          the camera and speak naturally. You can re-record if
                          needed.
                        </p>
                        <Button
                          onClick={startRecording}
                          style={{ backgroundColor: primaryColor }}
                        >
                          Start Recording
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!isRecording && !mediaPreview && (
                  <div className="p-4 border border-dashed rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      Prefer to upload a video instead?
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerFileUpload}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Video
                    </Button>
                  </div>
                )}
              </div>
            ) : testimonialData.format === "audio" ? (
              // Audio recording interface
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Record an audio testimonial
                </h3>

                {mediaPreview ? (
                  <div className="border rounded-lg p-4">
                    <div className="p-4 bg-gray-100 rounded-lg mb-3">
                      <audio src={mediaPreview} controls className="w-full">
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMediaPreview(null);
                          setTestimonialData((prev) => ({
                            ...prev,
                            mediaUrl: undefined,
                            metadata: {
                              ...(prev.metadata || {}),
                              recordingDuration: undefined,
                              recordingDate: undefined,
                            },
                          }));
                        }}
                      >
                        Re-record
                      </Button>
                      <Badge variant="outline">
                        {formatTime(
                          testimonialData.metadata?.recordingDuration || 0
                        )}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 flex flex-col items-center">
                    {isRecording ? (
                      <div className="space-y-4 w-full">
                        <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center relative">
                          <div className="absolute top-4 right-4">
                            <Badge
                              variant="destructive"
                              className="animate-pulse"
                            >
                              REC {formatTime(recordingTime)}
                            </Badge>
                          </div>

                          {/* Audio waveform visualization */}
                          <div className="flex items-center gap-1 px-4">
                            {Array.from({ length: 30 }).map((_, i) => {
                              const height = 10 + Math.random() * 50;
                              return (
                                <div
                                  key={i}
                                  className="w-1.5 bg-green-500 rounded-full animate-pulse"
                                  style={{
                                    height: `${height}px`,
                                    animationDelay: `${i * 30}ms`,
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <Button variant="destructive" onClick={stopRecording}>
                            Stop Recording
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="p-4 rounded-full bg-green-100 mb-4 inline-flex">
                          <Mic className="h-8 w-8 text-green-600" />
                        </div>
                        <h4 className="text-lg font-medium mb-2">
                          Ready to record?
                        </h4>
                        <p className="text-gray-500 mb-4 max-w-md">
                          Share your experience in a voice recording. Speak
                          clearly and at a natural pace. You can re-record if
                          needed.
                        </p>
                        <Button
                          onClick={startRecording}
                          style={{ backgroundColor: primaryColor }}
                        >
                          Start Recording
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {!isRecording && !mediaPreview && (
                  <div className="p-4 border border-dashed rounded-lg text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      Prefer to upload an audio file instead?
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerFileUpload}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Audio
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              // Image upload interface
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Upload a photo with your testimonial
                </h3>

                {mediaPreview ? (
                  <div className="border rounded-lg p-4">
                    // Continuing from the image upload interface section at{" "}
                    <div className="mb-3">
                      <div className="mb-3">
                        <img
                          src={mediaPreview}
                          alt="Uploaded"
                          className="max-h-64 max-w-full mx-auto rounded-lg"
                        />
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setMediaPreview(null);
                            setTestimonialData((prev) => ({
                              ...prev,
                              mediaUrl: undefined,
                              metadata: {
                                ...(prev.metadata || {}),
                                fileName: undefined,
                                fileType: undefined,
                                fileSize: undefined,
                              },
                            }));
                          }}
                        >
                          Upload Different Image
                        </Button>
                        <Badge variant="outline">
                          {testimonialData.metadata?.fileName?.slice(0, 15)}
                          {testimonialData.metadata?.fileName?.length > 15
                            ? "..."
                            : ""}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-6 flex flex-col items-center">
                    <div className="text-center">
                      <div className="p-4 rounded-full bg-amber-100 mb-4 inline-flex">
                        <Image className="h-8 w-8 text-amber-600" />
                      </div>
                      <h4 className="text-lg font-medium mb-2">
                        Upload a photo
                      </h4>
                      <p className="text-gray-500 mb-4 max-w-md">
                        Share a photo along with your written testimonial. This
                        could be a product photo, screenshot, or any image
                        related to your experience.
                      </p>
                      <Button
                        onClick={triggerFileUpload}
                        style={{ backgroundColor: primaryColor }}
                      >
                        Select Image
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                )}

                {!mediaPreview && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">
                      Your written testimonial
                    </h4>
                    <Textarea
                      value={testimonialData.feedback}
                      onChange={handleFeedbackChange}
                      placeholder="Share your experience with our product..."
                      className="min-h-[100px]"
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );

      case 4: // Permissions step
        return (
          <motion.div
            key="permissions"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                Share your testimonial
              </h3>
              <p className="text-gray-600">
                Please let us know how you'd like us to use your feedback
              </p>
            </div>

            <RadioGroup
              value={testimonialData.permission}
              onValueChange={handlePermissionChange}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex-1 cursor-pointer">
                    <div>
                      <span className="font-medium">Public testimonial</span>
                      <p className="text-sm text-gray-500 mt-1">
                        We can share your testimonial with your name on our
                        website and marketing materials.
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="anonymous" id="anonymous" />
                  <Label htmlFor="anonymous" className="flex-1 cursor-pointer">
                    <div>
                      <span className="font-medium">Anonymous testimonial</span>
                      <p className="text-sm text-gray-500 mt-1">
                        We can share your testimonial, but without using your
                        name or identifying information.
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 rounded-lg border p-4 hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex-1 cursor-pointer">
                    <div>
                      <span className="font-medium">Private feedback only</span>
                      <p className="text-sm text-gray-500 mt-1">
                        Keep my feedback private and only use it for internal
                        improvements.
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Your privacy matters to us. We will never share your contact
                  information or any personal details beyond what you explicitly
                  permit.
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 5: // Review step
        return (
          <motion.div
            key="review"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">
                Review your testimonial
              </h3>
              <p className="text-gray-600">
                Please review your testimonial before submitting
              </p>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-500 mb-2">
                  Rating
                </h4>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      className={`h-5 w-5 ${
                        value <= testimonialData.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-500 mb-2">
                  Format
                </h4>
                <Badge variant="outline" className="capitalize">
                  {testimonialData.format}
                </Badge>
              </div>

              {testimonialData.format === "text" && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">
                    Your Responses
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(testimonialData.questions || {}).map(
                      ([qIndex, answer]) => (
                        <div key={qIndex} className="space-y-1">
                          <p className="text-sm font-medium">
                            {questions[parseInt(qIndex)]}
                          </p>
                          <p className="text-sm p-2 bg-gray-50 rounded border">
                            {answer}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {testimonialData.mediaUrl && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-sm text-gray-500 mb-2">
                    {testimonialData.format === "image"
                      ? "Uploaded Image"
                      : testimonialData.format === "video"
                        ? "Video Recording"
                        : "Audio Recording"}
                  </h4>

                  {testimonialData.format === "image" && (
                    <img
                      src={testimonialData.mediaUrl}
                      alt="Testimonial"
                      className="max-h-40 max-w-full rounded border"
                    />
                  )}

                  {testimonialData.format === "video" && (
                    <div className="bg-gray-100 rounded p-3 flex items-center gap-2">
                      <Video className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">
                        Video recording (
                        {formatTime(
                          testimonialData.metadata?.recordingDuration || 0
                        )}
                        )
                      </span>
                    </div>
                  )}

                  {testimonialData.format === "audio" && (
                    <div className="bg-gray-100 rounded p-3 flex items-center gap-2">
                      <Mic className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">
                        Audio recording (
                        {formatTime(
                          testimonialData.metadata?.recordingDuration || 0
                        )}
                        )
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-sm text-gray-500 mb-2">
                  Sharing Permission
                </h4>
                <Badge
                  className={`
                  ${
                    testimonialData.permission === "public"
                      ? "bg-green-100 text-green-800"
                      : testimonialData.permission === "anonymous"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                  }
                `}
                >
                  {testimonialData.permission === "public"
                    ? "Public Testimonial"
                    : testimonialData.permission === "anonymous"
                      ? "Anonymous Testimonial"
                      : "Private Feedback"}
                </Badge>
              </div>
            </div>
          </motion.div>
        );

      case 6: // Success step
        return (
          <motion.div
            key="success"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
            className="text-center space-y-6"
          >
            {isSubmitting ? (
              <div className="py-8 flex flex-col items-center">
                <div className="w-16 h-16 relative mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold">
                  Submitting your testimonial
                </h3>
                <p className="text-gray-600 mt-2">
                  Please wait while we process your submission...
                </p>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold">
                  Thank you for your feedback!
                </h3>
                <p className="text-gray-600 mt-2">
                  Your testimonial has been submitted successfully.
                </p>

                {showIncentive && incentives?.enabled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-6 border rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 max-w-xs"
                  >
                    <div className="text-center">
                      <Gift className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                      <h4 className="font-medium text-amber-800 text-lg mb-2">
                        Here's your reward!
                      </h4>
                      <div className="bg-white border border-amber-200 p-3 rounded font-mono text-lg font-semibold text-amber-800 tracking-wider mb-3">
                        {incentives?.code || "THANKYOU10"}
                      </div>
                      <p className="text-sm text-amber-700">
                        Use this code for {incentives?.value} on your next
                        purchase
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        );
    }
  };

  // Footer actions
  const renderFooterActions = () => {
    return (
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={prevStep} size="sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 0 ? "Close" : "Back"}
        </Button>

        {step < 6 ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            size="sm"
            style={canProceed() ? { backgroundColor: primaryColor } : {}}
          >
            {step === 5 ? "Submit" : "Continue"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="sm"
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
            <Send className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    );
  };

  // Progress indicator
  const renderProgressSteps = () => {
    const totalSteps = 6; // Excluding success step
    const progress = (step / totalSteps) * 100;

    return (
      <div className="px-4 py-2">
        <Progress
          value={progress}
          className="h-1.5"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <div
            className="h-full transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progress}%`, backgroundColor: primaryColor }}
          />
        </Progress>
      </div>
    );
  };

  return (
    <>
      {/* This is the main widget content area */}
      <div className="flex flex-col h-full">
        {step > 0 && renderProgressSteps()}

        <div className="p-6 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </div>

        <div className="p-4 border-t">{renderFooterActions()}</div>
      </div>
    </>
  );
};
