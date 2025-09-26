// components/TestimonialDetail/FeatureHint.tsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, X, Lightbulb } from "lucide-react";

interface FeatureHintProps {
  onExploreFeatures: () => void;
}

const FeatureHint: React.FC<FeatureHintProps> = ({ onExploreFeatures }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Check if user has seen this hint before
    const hasSeenHint = localStorage.getItem("cenphi-feature-hint-seen");

    if (!hasSeenHint && !hasBeenShown) {
      // Show hint after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
        setHasBeenShown(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [hasBeenShown]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("cenphi-feature-hint-seen", "true");
  };

  const handleExplore = () => {
    onExploreFeatures();
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-50"></div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Content */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Pro Tip!</h3>
                  <p className="text-xs text-gray-600">
                    Discover hidden features
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                Your testimonial can be transformed with powerful AI tools -
                create clips, enhance quality, optimize for social media, and
                much more!
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleExplore}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Explore AI Features
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismiss}
                  className="text-gray-600"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeatureHint;
