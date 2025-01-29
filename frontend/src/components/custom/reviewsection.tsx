import React from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

const ReviewSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#2D2D2A]/5 to-white">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#C14953]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-20 w-96 h-96 bg-[#848FA5]/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-32">
        <div className="relative text-center max-w-4xl mx-auto space-y-12">
          {/* Pill badge */}
          <div className="inline-block px-4 py-2 bg-[#C14953]/10 rounded-full mb-8">
            <span className="text-[#C14953] font-medium">Customer Reviews Platform</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-[#2D2D2A] leading-tight">
            Drive Sales & Reduce Marketing{' '}
            <span className="relative">
              Spending
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" preserveAspectRatio="none">
                <path d="M0,5 Q50,8 100,5" stroke="#C14953" strokeWidth="2" fill="none"/>
              </svg>
            </span>{' '}
            with Reviews.
          </h1>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
            <Button 
              className="bg-[#C14953] hover:bg-[#C14953]/90 text-white px-8 py-6 text-lg rounded-xl"
            >
              GET STARTED
            </Button>
            
            <Button 
              variant="outline"
              className="border-[#2D2D2A] text-[#2D2D2A] hover:bg-[#2D2D2A] hover:text-white px-8 py-6 text-lg rounded-xl flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              SEE IT WORKING
            </Button>
          </div>

          {/* Optional: Stats or social proof */}
          <div className="flex justify-center gap-12 mt-16 text-[#848FA5]">
            <div>
              <div className="text-3xl font-bold text-[#2D2D2A]">2.5M+</div>
              <div>Reviews Collected</div>
            </div>
            <div className="h-12 w-px bg-[#848FA5]/20" />
            <div>
              <div className="text-3xl font-bold text-[#2D2D2A]">98%</div>
              <div>Customer Satisfaction</div>
            </div>
            <div className="h-12 w-px bg-[#848FA5]/20" />
            <div>
              <div className="text-3xl font-bold text-[#2D2D2A]">50K+</div>
              <div>Active Users</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewSection;