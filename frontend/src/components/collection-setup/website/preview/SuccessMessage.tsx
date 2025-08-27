import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Share2 } from "lucide-react";

interface SuccessMessageProps {
  onClose?: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-6"
    >
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-gray-900">
          Thank You!
        </h2>
        <p className="text-gray-600 max-w-sm mx-auto">
          Your testimonial has been submitted successfully. We appreciate you taking the time to share your experience with us.
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>We love feedback</span>
        </div>
        <div className="flex items-center gap-1">
          <Share2 className="h-4 w-4" />
          <span>Share with others</span>
        </div>
      </div>

      {onClose && (
        <Button
          onClick={onClose}
          className="mt-4"
          variant="outline"
        >
          Close
        </Button>
      )}
    </motion.div>
  );
};

export default SuccessMessage;
