import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  SkipForward,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import VideoCapture from "../testimonial-collection/VideoCapture";
import { authStore } from "@/stores/authStore";

interface OnboardingVideoCaptureProps {
  onUploadComplete: (testimonialId: string) => void;
  onSkip: () => void;
  workspaceId: string;
  maxDuration?: number;
}

export const OnboardingVideoCapture: React.FC<OnboardingVideoCaptureProps> = ({
  onUploadComplete,
  onSkip,
  workspaceId,
  maxDuration = 120,
}) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: authStore.user?.displayName || "User",
    email: authStore.user?.email || "",
    company: "",
    textContent: "",
    rating: 5,
  });

  const handleSubmitSuccess = (testimonialId?: string) => {
    setIsCompleted(true);
    if (testimonialId) {
      onUploadComplete(testimonialId);
    }
    setTimeout(() => {
      onSkip();
    }, 2000);
  };




  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden text-center p-8 sm:p-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </motion.div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Testimonial recorded successfully!
            </h3>
            <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto">
              Your video testimonial has been submitted and is being processed.
              You'll be able to see it in your dashboard momentarily.
            </p>

            <div className="space-y-4">
              <div className="inline-flex items-center px-6 py-3 bg-green-50 border border-green-200 rounded-2xl text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Processing started automatically
              </div>

              <div className="pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSkip}
                  className="px-8 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl transition-colors shadow-lg"
                >
                  Continue to Dashboard
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Step 3 of 4 • Record testimonial completed
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden text-center p-8 sm:p-12"
          >
            <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Recording failed
            </h3>
            <p className="text-sm text-red-600 mb-8 max-w-md mx-auto">
              {error}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-gray-900 hover:bg-black text-white font-semibold rounded-2xl transition-colors shadow-lg"
              >
                Try again
              </motion.button>
              <button
                onClick={onSkip}
                className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-2xl transition-colors"
              >
                Skip for now
              </button>
            </div>
          </motion.div>

          {/* Progress Indicator */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Step 3 of 4 • Record testimonial (optional)
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => window.history.back()}
              className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>

            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 tracking-tight mb-1">
                Record Your First Testimonial
              </h1>
              <p className="text-sm text-gray-600 font-light">
                Share your experience in up to {Math.floor(maxDuration / 60)}{" "}
                minutes
              </p>
            </div>

            <button
              onClick={onSkip}
              className="flex items-center px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Skip for now</span>
              <span className="sm:hidden">Skip</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video Capture Component */}
      <div className="px-4 sm:px-6 pb-8">
        <VideoCapture
          formData={formData}
          setFormData={setFormData}
          onSubmitSuccess={handleSubmitSuccess}
          workspaceId={workspaceId}
        />
      </div>

      {/* Progress Indicator */}
      <div className="pb-8 text-center">
        <p className="text-xs text-gray-500 font-medium">
          Step 3 of 4 • Record testimonial (optional)
        </p>
      </div>
    </div>
  );
};

export default OnboardingVideoCapture;
