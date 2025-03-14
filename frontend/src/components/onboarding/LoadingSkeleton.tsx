import { Loader2 } from "lucide-react";
import Navbar from "@/components/nav";
import Footer from "@/components/custom/footer";

const OnboardingSkeleton = () => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 overflow-hidden">
      <Navbar alwaysDarkText />
      <div className="pt-24 pb-0 relative overflow-hidden min-h-screen">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute -bottom-40 right-1/3 w-80 h-80 bg-amber-200 rounded-full opacity-20 blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="container mx-auto px-4 pt-8 pb-16 relative z-10">
          <div className="max-w-screen-xl mx-auto grid md:grid-cols-6 gap-8">
            {/* Left column with form skeleton */}
            <div className="md:col-span-4">
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-gray-100 animate-pulse-subtle">
                {/* Progress bar skeleton */}
                <div className="px-8 py-8 border-b border-gray-100">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200"></div>
                    <div className="h-8 w-64 bg-gray-200 rounded-md"></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between mb-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full w-1/4 shimmer"></div>
                    </div>
                    {/* Progress steps skeleton */}
                    <div className="flex justify-between mt-2">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex flex-col items-center">
                          <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded mt-1"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form skeleton */}
                <div className="p-8">
                  <div className="space-y-6">
                    <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
                    <div className="h-12 w-full bg-gray-200 rounded-lg"></div>
                    <div className="flex space-x-4 pt-6">
                      <div className="h-12 w-32 bg-gray-200 rounded-lg"></div>
                      <div className="h-12 w-32 bg-gray-200 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column skeleton */}
            <div className="md:col-span-2 hidden md:block">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl md:rounded-3xl shadow-xl h-full p-8 text-white">
                <div className="h-8 w-36 bg-white/20 rounded mb-6"></div>
                {[1, 2, 3].map((item) => (
                  <div key={item} className="mb-6">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 rounded-full bg-white/20 mr-3"></div>
                      <div className="h-5 w-32 bg-white/20 rounded"></div>
                    </div>
                    <div className="h-4 w-full bg-white/20 rounded mb-1"></div>
                    <div className="h-4 w-5/6 bg-white/20 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Loading indicator overlay */}
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Loading Your Workspace
              </h2>
              <p className="text-gray-600">
                We're preparing your onboarding experience. This won't take
                long.
              </p>
              <div className="mt-8 w-full bg-gray-200 h-1 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      {/* Global CSS for animations */}
      <style>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulseSubtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }

        .shimmer {
          background: linear-gradient(90deg, 
            rgba(255,255,255,0) 0%, 
            rgba(255,255,255,0.5) 50%, 
            rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .animate-pulse-subtle {
          animation: pulseSubtle 2s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default OnboardingSkeleton;
