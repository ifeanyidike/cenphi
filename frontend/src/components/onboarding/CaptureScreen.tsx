import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Video,
  FileVideo,
  ArrowRight,
  SkipForward,
  Phone,
} from "lucide-react";
import OnboardingVideoCapture from "./OnboardingVideoCapture";
import VoiceTestimonial from "../testimonial-collection/VoiceTestimonial";
import { isFeatureEnabled } from "@/config/features";
import { authStore } from "@/stores/authStore";

interface CaptureScreenProps {
  onTestimonialCreated: (testimonialId: string) => void;
  onSkip: () => void;
  workspaceId: string;
  intent?: string;
}


type CaptureMode = "selection" | "record" | "voice";

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  onTestimonialCreated,
  onSkip,
  workspaceId,
  intent,
}) => {
  const [currentMode, setCurrentMode] = useState<CaptureMode>("selection");
  const showVoiceAI = isFeatureEnabled('VOICE_AI_TESTIMONIALS');


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
      <OnboardingVideoCapture
        onUploadComplete={onTestimonialCreated}
        onSkip={onSkip}
        workspaceId={workspaceId}
        maxDuration={90}
      />
    );
  }

  if (currentMode === "voice") {
    return (
      <VoiceTestimonial
        onBack={() => setCurrentMode("selection")}
        onComplete={() => onTestimonialCreated("voice-call-scheduled")}
        formData={{
          name: authStore.user?.displayName || "User",
          email: authStore.user?.email || "",
          company: "",
          textContent: "",
          rating: 5,
        }}
        workspaceId={workspaceId}
      />
    );
  }

  // Main selection screen
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 sm:px-12 pt-12 pb-12 text-center border-b border-gray-100">
            {/* Skip Button */}
            <button
              onClick={onSkip}
              className="absolute top-6 right-6 flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip for now
            </button>

            {/* Icon */}
            <div className="w-16 h-16 bg-gray-900 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <FileVideo className="h-8 w-8 text-white" />
            </div>

            {/* Main Headlines */}
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight mb-4">
              Add your first testimonial
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
              Record a new video testimonial or upload an existing file to get started with our platform
            </p>

            {/* Intent Badge */}
            {getIntentMessage() && (
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                <span className="text-sm text-blue-700 font-medium">
                  {getIntentMessage()}
                </span>
              </div>
            )}
          </div>

          {/* Capture Options */}
          <div className="px-8 sm:px-12 py-8">
            {/* Main CTA Section */}
            <div className={`grid ${showVoiceAI ? 'md:grid-cols-2' : 'grid-cols-1'} gap-6 max-w-4xl mx-auto mb-8`}>
              <button
                onClick={() => handleModeSelect("record")}
                className="p-6 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl transition-colors duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Video Testimonial
                  </h3>
                  <p className="text-gray-300 text-sm mb-2">
                    Record or upload your video
                  </p>
                  <p className="text-gray-400 text-xs">
                    Record live • Max 200MB
                  </p>
                </div>
              </button>

              {showVoiceAI && (
                <div className="relative">
                  <button
                    onClick={() => handleModeSelect("voice")}
                    className="w-full p-6 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl transition-colors duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                        <Phone className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Voice Testimonial
                      </h3>
                      <p className="text-purple-100 text-sm mb-2">
                        AI will call you for a chat
                      </p>
                      <p className="text-purple-200 text-xs">
                        5-minute guided call
                      </p>
                    </div>
                  </button>
                  {/* Coming Soon Badge */}
                  <div className="absolute -top-2 -right-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">
                      Coming Soon
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Features Info */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What happens next?
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span>Your video will be automatically transcribed</span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span>Key highlights and impactful moments will be extracted</span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span>Short clips will be generated for social sharing</span>
                </div>
                <div className="flex items-start space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2"></div>
                  <span>Everything will be available in your dashboard</span>
                </div>
              </div>
            </div>

            {/* Continue to Dashboard Button */}
            <div className="mt-8">
              <button
                onClick={onSkip}
                className="w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md"
              >
                Continue to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 sm:px-12 py-6 bg-gray-50 border-t border-gray-100">
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
          <p className="text-sm text-gray-500 font-medium">
            Step 3 of 4 • Add testimonial (optional)
          </p>
        </div>
      </div>
    </div>
  );
};
