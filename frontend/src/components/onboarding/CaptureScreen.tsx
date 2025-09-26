import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  Upload,
  FileVideo,
  ArrowRight,
  SkipForward,
} from "lucide-react";
import { VideoRecorder } from "./VideoRecorder";
import { FileUpload } from "./FileUpload";

interface CaptureScreenProps {
  onTestimonialCreated: (testimonialId: string) => void;
  onError: (error: string) => void;
  onSkip: () => void;
  workspaceId: string;
  intent?: string;
}

interface CaptureOption {
  id: string;
  title: string;
  description: string;
  microcopy: string;
  icon: React.ReactNode;
  primary?: boolean;
}

type CaptureMode = "selection" | "record" | "upload";

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  onTestimonialCreated,
  onError,
  onSkip,
  workspaceId,
  intent,
}) => {
  const [currentMode, setCurrentMode] = useState<CaptureMode>("selection");

  const captureOptions: CaptureOption[] = [
    {
      id: "record",
      title: "Record New Video",
      description: "Record using your camera",
      microcopy: "30–90 seconds recommended",
      icon: <Video className="h-6 w-6" />,
      primary: true,
    },
    {
      id: "upload",
      title: "Upload Video File",
      description: "Upload an existing video",
      microcopy: "MP4, WebM, MOV (max 1GB)",
      icon: <Upload className="h-6 w-6" />,
    },
  ];

  const handleModeSelect = (mode: CaptureMode) => {
    setCurrentMode(mode);
  };

  const getIntentMessage = () => {
    const messages = {
      marketing: "Perfect for building trust and driving conversions",
      sales: "Great for closing more deals with customer stories",
      product: "Ideal for improving user experience and retention",
      agency: "Excellent for delivering exceptional client results",
    };
    return intent ? messages[intent as keyof typeof messages] : null;
  };

  // Render specific capture modes
  if (currentMode === "record") {
    return (
      <VideoRecorder
        onUploadComplete={onTestimonialCreated}
        onError={onError}
        onSkip={onSkip}
        workspaceId={workspaceId}
        maxDuration={60}
      />
    );
  }

  if (currentMode === "upload") {
    return (
      <FileUpload
        onUploadComplete={onTestimonialCreated}
        onError={onError}
        onSkip={onSkip}
        workspaceId={workspaceId}
        maxFileSize={1024 * 1024 * 1024}
        acceptedFormats={[
          "video/mp4",
          "video/webm",
          "video/quicktime",
          "video/avi",
        ]}
      />
    );
  }

  // Main selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-12 pt-12 pb-10 text-center border-b border-gray-100/50 relative">
            {/* Skip Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className="absolute top-6 right-6 flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip for now
            </motion.button>

            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <FileVideo className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
              Add your first testimonial
            </h1>
            <p className="text-sm text-gray-600 font-light max-w-lg mx-auto leading-relaxed">
              Record a new video testimonial or upload an existing file to get
              started
            </p>
            {getIntentMessage() && (
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50/80 rounded-full border border-blue-100">
                <span className="text-xs text-blue-700 font-medium">
                  {getIntentMessage()}
                </span>
              </div>
            )}
          </div>

          {/* Capture Options */}
          <div className="px-12 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {captureOptions.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  {option.primary ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleModeSelect(option.id as CaptureMode)}
                      className="w-full p-8 bg-gradient-to-br from-gray-900 to-black text-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1 bg-white/20 rounded-full">
                          <span className="text-xs font-medium">
                            Recommended
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                          {option.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          {option.title}
                        </h3>
                        <p className="text-white/80 text-sm mb-2">
                          {option.description}
                        </p>
                        <p className="text-white/60 text-xs">
                          {option.microcopy}
                        </p>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleModeSelect(option.id as CaptureMode)}
                      className="w-full p-8 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-3xl hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                          {option.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {option.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {option.description}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {option.microcopy}
                        </p>
                      </div>
                    </motion.button>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Info Section */}
            <div className="bg-gray-50/80 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                What happens next?
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>
                    Your video will be automatically transcribed using AI
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>
                    We'll extract key highlights and impactful moments
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Short clips will be generated for social sharing</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Everything will be available in your dashboard</span>
                </div>
              </div>
            </div>

            {/* Continue to Dashboard Button */}
            <div className="mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onSkip}
                className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
              >
                Continue to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-12 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Step 3 of 4 • Add testimonial (optional)
          </p>
        </div>
      </div>
    </div>
  );
};
