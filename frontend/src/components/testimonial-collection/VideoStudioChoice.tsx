import React from "react";
import { motion } from "framer-motion";
import {
  Video,
  Upload,
  Clock,
  CheckCircle,
  Camera,
  CloudUpload,
} from "lucide-react";

interface VideoStudioChoiceProps {
  onChoose: (choice: "record" | "upload") => void;
}

/**
 * VideoStudioChoice - Clean, minimalist pre-selection screen
 *
 * Professional studio aesthetic with:
 * - Minimal colors (mostly grayscale with subtle accents)
 * - Clean, focused design
 * - Subtle animations
 */
const VideoStudioChoice: React.FC<VideoStudioChoiceProps> = ({ onChoose }) => {
  return (
    <div className="relative w-full h-full min-h-screen md:min-h-0 md:max-w-4xl md:mx-auto px-4 md:px-0 py-8 md:py-0">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8 md:mb-10"
      >
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
          Choose Your Method
        </h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-xl mx-auto px-4">
          Select how you'd like to share your testimonial
        </p>
      </motion.div>

      {/* Choice Cards */}
      <div className="grid sm:grid-cols-2 gap-4 md:gap-5">
        {/* Record Option */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChoose("record")}
          className="group relative bg-white p-5 md:p-6 rounded-lg border-2 border-slate-200 hover:border-slate-400 hover:shadow-md transition-all text-left touch-manipulation"
        >
          <div className="relative">
            {/* Icon */}
            <div className="mb-5">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Video className="h-6 w-6 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Record Live
            </h3>

            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Use your camera to record directly. Professional studio environment with guided prompts.
            </p>

            {/* Features */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Camera className="h-3.5 w-3.5" />
                <span>Professional recording</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                <span>2 minutes max</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Guided questions</span>
              </div>
            </div>

            {/* Label */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-medium text-slate-500">Recommended for authentic stories</span>
            </div>
          </div>
        </motion.button>

        {/* Upload Option */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChoose("upload")}
          className="group relative bg-white p-5 md:p-6 rounded-lg border-2 border-slate-200 hover:border-slate-400 hover:shadow-md transition-all text-left touch-manipulation"
        >
          <div className="relative">
            {/* Icon */}
            <div className="mb-5">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-900 transition-colors">
                <Upload className="h-6 w-6 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Upload File
            </h3>

            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Upload a pre-recorded video. Ideal for edited or polished videos from professional equipment.
            </p>

            {/* Features */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CloudUpload className="h-3.5 w-3.5" />
                <span>Drag & drop or browse</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Clock className="h-3.5 w-3.5" />
                <span>Max 250MB</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>MP4, MOV, WebM</span>
              </div>
            </div>

            {/* Label */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-medium text-slate-500">Best for edited videos</span>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Bottom Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-center mt-6 md:mt-8"
      >
        <div className="inline-flex flex-wrap items-center justify-center gap-3 md:gap-5 px-4 md:px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Secure</span>
          </div>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5" />
            <span>Fast</span>
          </div>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>AI-Optimized</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default VideoStudioChoice;
