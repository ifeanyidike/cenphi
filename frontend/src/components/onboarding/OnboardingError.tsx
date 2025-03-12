import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Navbar from "@/components/nav";
import Footer from "@/components/custom/footer";
import { useNavigate } from "react-router-dom";

interface OnboardingErrorProps {
  error: Error;
  resetError?: () => void;
}

const OnboardingError: React.FC<OnboardingErrorProps> = ({
  error,
  resetError,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 overflow-hidden">
      <Navbar alwaysDarkText />
      <div className="pt-24 pb-0 relative overflow-hidden min-h-screen">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/2 -left-40 w-80 h-80 bg-amber-200 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="container mx-auto px-4 pt-8 pb-16 relative z-10 flex items-center justify-center min-h-[70vh]">
          <div className="max-w-lg w-full mx-auto">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-gray-100">
              <div className="relative mb-8">
                {/* Animated error icon */}
                <div className="absolute h-24 w-24 bg-red-100 rounded-full -top-4 -left-4 animate-pulse opacity-70"></div>
                <div className="mx-auto h-20 w-20 bg-red-100 rounded-full flex items-center justify-center relative">
                  <AlertTriangle className="h-10 w-10 text-red-600" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                Onboarding Process Interrupted
              </h2>

              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      Error Details
                    </p>
                    <p className="text-sm text-red-700 mt-1 font-mono">
                      {error.message || "An unexpected error occurred"}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 mb-8 text-center">
                We encountered an issue while setting up your workspace. Our
                team has been notified and is working on a solution.
              </p>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                {resetError && (
                  <button
                    onClick={resetError}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-6 rounded-xl border border-gray-300 shadow-sm transition-all flex items-center justify-center space-x-2 group"
                  >
                    <RotateCcw className="h-5 w-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
                    <span>Try Again</span>
                  </button>
                )}
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <Home className="h-5 w-5" />
                  <span>Return Home</span>
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Need assistance? Contact our support team at{" "}
                  <a
                    href="mailto:support@cenphi.io"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    support@cenphi.io
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Global CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.3;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default OnboardingError;
