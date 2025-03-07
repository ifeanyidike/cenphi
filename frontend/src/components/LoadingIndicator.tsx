import React, { useEffect, useState } from "react";

const LoadingIndicator: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in animation
    const fadeIn = setTimeout(() => {
      setOpacity(1);
    }, 150);

    // Simulated progress for the loading bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 10;
      });
    }, 300);

    return () => {
      clearTimeout(fadeIn);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm transition-opacity duration-500 z-50"
      style={{ opacity }}
    >
      <div className="w-full max-w-md px-6">
        {/* Logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="text-3xl font-bold text-gray-800">Cenphi</div>
        </div>

        {/* Loading message */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-gray-700 mb-2">
            Preparing your testimonials
          </h2>
          <p className="text-gray-500">
            Just a moment while we set things up for you
          </p>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Animated dots */}
        <div className="flex justify-center mt-8 space-x-2">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className="w-2 h-2 rounded-full bg-indigo-600"
              style={{
                animation: `bounce 1.4s infinite ease-in-out both`,
                animationDelay: `${dot * 0.16}s`,
              }}
            />
          ))}
        </div>

        {/* Pulse ring */}
        <div className="mt-12 flex justify-center relative">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full bg-indigo-500 opacity-50 animate-ping" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Global style for the bounce animation */}
      <style>{`
        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingIndicator;
