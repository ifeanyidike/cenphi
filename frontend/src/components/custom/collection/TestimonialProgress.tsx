import React from "react";
import { motion, MotionValue } from "framer-motion";
import { Quote } from "lucide-react";

const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => (
  <svg className="w-32 h-32" viewBox="0 0 100 100">
    <motion.circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#f3f4f6"
      strokeWidth="2"
    />
    <motion.circle
      cx="50"
      cy="50"
      r="45"
      fill="#f9fafb"
      stroke="#000"
      strokeWidth="2"
      strokeDasharray={2 * Math.PI * 45}
      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
      animate={{ strokeDashoffset: (1 - progress) * 2 * Math.PI * 45 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    />
    <text
      x="50"
      y="50"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-2xl font-light z-20"
    >
      {Math.round(progress * 100)}%
    </text>
  </svg>
);

type ProgressProps = {
  progress: MotionValue<number>;
  currentStep: number;
  totalSteps: number;
};

const TestimonialProgress = ({
  progress,
  currentStep,
  totalSteps,
}: ProgressProps) => {
  console.log("currentStep: " + currentStep, progress.get());
  return (
    <div>
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
        <ProgressRing progress={progress.get()} />
      </div>

      {/* Fixed linear progress bar at the top */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs md:text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-500">
              <Quote className="w-3 h-3 md:w-4 md:h-4" />
              <span>Testimonial Collection</span>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-black"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialProgress;
