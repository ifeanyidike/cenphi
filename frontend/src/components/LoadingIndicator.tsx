import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export interface LoadingIndicatorProps {
  title?: string;
  message?: string;
  variant?: "default" | "minimal" | "elegant";
  showProgress?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  title = "Loading",
  message = "Please wait a moment",
  variant = "elegant",
  showProgress = true,
}) => {
  const [progress, setProgress] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in animation
    const fadeIn = setTimeout(() => {
      setOpacity(1);
    }, 100);

    // Simulated progress for the loading bar
    let interval: NodeJS.Timeout;
    if (showProgress) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 300);
    }

    return () => {
      clearTimeout(fadeIn);
      if (interval) clearInterval(interval);
    };
  }, [showProgress]);

  if (variant === "minimal") {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300 z-50"
        style={{ opacity }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
          <p className="text-sm font-medium text-slate-600">{title}</p>
        </div>
      </div>
    );
  }

  if (variant === "default") {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm transition-opacity duration-500 z-50"
        style={{ opacity }}
      >
        <div className="w-full max-w-md px-6">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="text-2xl font-semibold text-slate-800">Cenphi</div>
          </div>

          {/* Loading message */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-medium text-slate-700 mb-1.5">
              {title}
            </h2>
            <p className="text-sm text-slate-500">{message}</p>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="h-0.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-slate-600 to-slate-800 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Spinner */}
          <div className="flex justify-center mt-8">
            <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  // Elegant variant (default)
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 transition-opacity duration-500 z-50"
      style={{ opacity }}
    >
      <div className="w-full max-w-lg px-6">
        {/* Elegant animated background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-slate-100/40 to-transparent rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-slate-100/30 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        {/* Logo with subtle animation */}
        <div className="flex justify-center mb-12 relative">
          <div className="text-2xl font-semibold text-slate-800 tracking-tight">
            Cenphi
          </div>
        </div>

        {/* Main content */}
        <div className="text-center mb-10 relative">
          <h2 className="text-lg font-medium text-slate-800 mb-2 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-slate-500 font-light">{message}</p>
        </div>

        {/* Sophisticated spinner */}
        <div className="flex justify-center mb-8 relative">
          <div className="relative">
            {/* Outer ring with subtle glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-200/50 to-slate-300/50 blur-sm" />

            {/* Main spinner */}
            <div className="relative w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-slate-600 animate-spin" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Progress bar - refined design */}
        {showProgress && (
          <div className="relative">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-slate-400 via-slate-600 to-slate-400 transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-center mt-3">
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        )}

        {/* Subtle animated dots */}
        <div className="flex justify-center mt-8 gap-1.5">
          {[0, 1, 2].map((dot) => (
            <div
              key={dot}
              className="w-1 h-1 rounded-full bg-slate-400"
              style={{
                animation: `pulse-dot 1.5s infinite ease-in-out`,
                animationDelay: `${dot * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframes for animations */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingIndicator;
