import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const SuccessView: React.FC = () => {
  return (
    <div className="max-w-xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl border border-gray-200 p-8 shadow-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="h-8 w-8 text-green-600" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">Thank You!</h2>
        <p className="text-base text-gray-600 mb-6 leading-relaxed">
          Your testimonial has been submitted successfully. We appreciate you
          taking the time to share your experience.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-base font-bold text-blue-900 mb-2">
            What's next?
          </h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Review within 24 hours</p>
            <p>• Notification when published</p>
            <p>• Share link provided</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuccessView;