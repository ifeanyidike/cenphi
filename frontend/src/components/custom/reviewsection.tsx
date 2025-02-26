import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

const ReviewSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#2D2D2A]/5 to-white">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#C14953]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-[#848FA5]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
        <div className="relative text-center max-w-4xl mx-auto space-y-8 sm:space-y-12">
          {/* Pill badge */}
          <div className="inline-block px-4 py-2 bg-[#C14953]/10 rounded-full mb-4 sm:mb-8">
            <span className="text-[#C14953] font-medium text-sm sm:text-base">
              Customer Reviews Platform
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#2D2D2A] leading-tight">
            Drive Sales & Reduce Marketing{" "}
            <span className="relative">
              Spending
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 100 8"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,5 Q50,8 100,5"
                  stroke="#C14953"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </span>{" "}
            with Reviews.
          </h1>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 sm:mt-12">
            <Button className="bg-[#C14953] hover:bg-[#C14953]/90 text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg rounded-xl">
              GET STARTED
            </Button>

            <Button
              variant="outline"
              className="border-[#2D2D2A] text-[#2D2D2A] hover:bg-[#2D2D2A] hover:text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg rounded-xl flex items-center gap-2"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              SEE IT WORKING
            </Button>
          </div>

          {/* Optional: Stats or social proof */}
          <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-12 mt-12 sm:mt-16 text-[#848FA5]">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2A]">
                2.5M+
              </div>
              <div className="text-sm sm:text-base">Reviews Collected</div>
            </div>
            <div className="hidden sm:block h-12 w-px bg-[#848FA5]/20" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2A]">
                98%
              </div>
              <div className="text-sm sm:text-base">Customer Satisfaction</div>
            </div>
            <div className="hidden sm:block h-12 w-px bg-[#848FA5]/20" />
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#2D2D2A]">
                50K+
              </div>
              <div className="text-sm sm:text-base">Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;
