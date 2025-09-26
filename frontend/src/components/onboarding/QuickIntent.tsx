import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  Briefcase,
  Building2,
  ArrowRight,
  SkipForward,
} from "lucide-react";

interface QuickIntentProps {
  onNext: (intent?: string) => void;
  isLoading?: boolean;
}

interface IntentOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  examples: string[];
}

const intentOptions: IntentOption[] = [
  {
    id: "marketing",
    title: "Marketing",
    description: "Build trust and drive conversions",
    icon: <TrendingUp className="h-5 w-5" />,
    gradient: "from-blue-500/10 to-blue-600/10",
    examples: ["Website testimonials", "Landing pages", "Social proof"],
  },
  {
    id: "sales",
    title: "Sales",
    description: "Close more deals with customer stories",
    icon: <Briefcase className="h-5 w-5" />,
    gradient: "from-emerald-500/10 to-emerald-600/10",
    examples: ["Sales presentations", "Proposal support", "Demo materials"],
  },
  {
    id: "product",
    title: "Product",
    description: "Improve user experience and retention",
    icon: <Users className="h-5 w-5" />,
    gradient: "from-purple-500/10 to-purple-600/10",
    examples: ["Feature validation", "User feedback", "Product roadmap"],
  },
  {
    id: "agency",
    title: "Agency",
    description: "Deliver exceptional client results",
    icon: <Building2 className="h-5 w-5" />,
    gradient: "from-orange-500/10 to-orange-600/10",
    examples: ["Client case studies", "Portfolio pieces", "Service validation"],
  },
];

export const QuickIntent: React.FC<QuickIntentProps> = ({
  onNext,
  isLoading = false,
}) => {
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const handleContinue = () => {
    onNext(selectedIntent || undefined);
  };

  const handleSkip = () => {
    onNext();
  };

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
          <div className="px-12 pt-12 pb-10 text-center border-b border-gray-100/50">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-3">
              How will you use testimonials?
            </h1>
            <p className="text-sm text-gray-600 font-light max-w-md mx-auto leading-relaxed">
              Help us tailor your experience with relevant templates and best
              practices
            </p>
          </div>

          {/* Intent Options */}
          <div className="px-12 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {intentOptions.map((option, index) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedIntent(option.id)}
                  disabled={isLoading}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
                    ${
                      selectedIntent === option.id
                        ? "border-gray-900 bg-gray-900/5 shadow-lg"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${option.gradient} opacity-50`}
                  />

                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div
                        className={`
                        w-10 h-10 rounded-xl flex items-center justify-center mr-4
                        ${selectedIntent === option.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}
                      `}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {option.title}
                        </h3>
                        <p className="text-sm text-gray-600 font-light">
                          {option.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {option.examples.map((example, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-xs text-gray-500"
                        >
                          <div className="w-1 h-1 bg-gray-400 rounded-full mr-2" />
                          {example}
                        </div>
                      ))}
                    </div>

                    {selectedIntent === option.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 right-4 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSkip}
                disabled={isLoading}
                className="
                  px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800
                  transition-colors duration-200 flex items-center
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Skip for now
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContinue}
                disabled={isLoading}
                className="
                  bg-gray-900 hover:bg-black text-white font-semibold py-3 px-8
                  rounded-2xl transition-all duration-300 flex items-center
                  disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl
                  text-sm tracking-wide
                "
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-12 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-900 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 font-medium">
            Step 1 of 4 • Quick setup
          </p>
        </div>
      </div>
    </div>
  );
};
