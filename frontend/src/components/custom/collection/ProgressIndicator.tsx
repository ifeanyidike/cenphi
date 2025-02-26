// components/ProgressIndicator.tsx
import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  className,
}) => {
  const progressWidth = `${(currentStep / totalSteps) * 100}%`;

  return (
    <div className={cn("w-full", className)}>
      {/* Gradient Progress Bar */}
      <div className="relative">
        <div className="overflow-hidden h-3 mb-6 rounded-full bg-gray-200 shadow-inner">
          <div
            style={{ width: progressWidth }}
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out"
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between -mt-4 relative">
          {Array.from({ length: totalSteps }, (_, i) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={i} className="relative flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-full border-4 transition-transform duration-500",
                    isCompleted
                      ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border-white shadow-lg transform scale-110"
                      : isActive
                      ? "bg-white border-indigo-500 shadow-2xl"
                      : "bg-white border-gray-300"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={cn(
                        "text-lg font-semibold",
                        isActive ? "text-indigo-500" : "text-gray-500"
                      )}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>
                {/* Step Labels (visible on larger screens) */}
                <div className="mt-2 hidden sm:block">
                  <span
                    className={cn(
                      "text-sm font-medium transition-colors duration-500",
                      isCompleted
                        ? "text-indigo-500"
                        : isActive
                        ? "text-gray-900"
                        : "text-gray-400"
                    )}
                  >
                    Step {i + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
