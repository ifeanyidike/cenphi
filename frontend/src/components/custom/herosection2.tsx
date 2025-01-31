import React, { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, Award } from 'lucide-react';
import Sucessfulbusinessman from "@/assets/successfulbusinessman.png";

const MyHeroSection = () => {
  const [activeWidget, setActiveWidget] = useState<number | null>(null);

  const floatingReviews = [
    {
      id: 1,
      icon: <Star className="text-[#C14953]" />,
      label: "5.0",
      bgColor: "bg-white"
    },
    {
      id: 2,
      icon: <ThumbsUp className="text-[#C14953]" />,
      label: "98%",
      bgColor: "bg-white"
    },
    {
      id: 3,
      icon: <MessageCircle className="text-[#C14953]" />,
      label: "2.5k",
      bgColor: "bg-white"
    },
    {
      id: 4,
      icon: <Award className="text-[#C14953]" />,
      label: "Top",
      bgColor: "bg-white"
    }
  ];

  const reviewWidgets = [
    {
      id: 1,
      title: "Customer Satisfaction",
      content: "Excellent service! The team was very responsive.",
      author: "William Smith",
      rating: 5,
      position: { top: '15%', left: '45%' },
      category: "Verified Purchase"
    },
    {
      id: 2,
      title: "Product Quality",
      content: "Amazing quality and fast delivery.",
      author: "Thomas Wise",
      rating: 5,
      position: { top: '45%', left: '75%' },
      category: "Top Reviewer"
    },
    {
      id: 3,
      title: "User Experience",
      content: "Intuitive interface and great features!",
      author: "Karen Smith",
      rating: 5,
      position: { top: '70%', left: '35%' },
      category: "Verified Purchase"
    }
  ];

  return (
    <div className="w-full max-w-7xl bg-white p-4 sm:p-6 md:p-8 rounded-lg mx-auto mt-12 sm:mt-16 md:mt-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-4 md:space-y-6 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight text-[#2D2D2A]">
              Unlock Trust with the Right Review Collection Tools
            </h1>
            <p className="text-base md:text-lg text-[#848FA5]">
              The all-in-one platform to collect, manage, and showcase testimonials that drive conversions and build trust with your audience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 bg-[#2D2D2A] text-white font-semibold rounded-full hover:bg-[#C14953] transition-colors duration-300">
                Join for free
              </button>
              <button className="w-full sm:w-auto px-6 md:px-8 py-3 border-2 border-[#C14953] text-[#C14953] font-semibold rounded-full hover:border-[#2D2D2A] hover:text-[#2D2D2A] transition-colors duration-300">
                View Demo
              </button>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="relative h-[400px] md:h-[480px] bg-[#2D2D2A] rounded-2xl overflow-hidden mt-6 md:mt-0">
            {/* Decorative elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-[#C14953] opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-48 md:w-60 h-48 md:h-60 bg-[#848FA5] opacity-10 rounded-full transform -translate-x-16 translate-y-16"></div>
            </div>

            {/* Main Image Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2D2D2A]/30 to-[#2D2D2A]/70"></div>
              <img 
                src={Sucessfulbusinessman} 
                alt="successful business man" 
                className="object-cover h-full w-full z-10"
              />
            </div>

            {/* Floating Review Widgets - Hidden on mobile */}
            <div className="absolute inset-0 z-20 hidden md:block">
              {reviewWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`absolute w-48 md:w-56 bg-white rounded-lg shadow-lg p-3 md:p-4 transition-all duration-500 cursor-pointer
                    ${activeWidget === widget.id ? 'scale-110 z-30' : 'scale-100 z-20'}
                    hover:shadow-xl`}
                  style={{
                    top: widget.position.top,
                    left: widget.position.left,
                    transform: `translate(-0%, -0%) ${activeWidget === widget.id ? 'scale(1.1)' : 'scale(1)'}`,
                  }}
                  onMouseEnter={() => setActiveWidget(widget.id)}
                  onMouseLeave={() => setActiveWidget(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 md:w-8 h-6 md:h-8 rounded-full bg-[#E5DCC5] flex items-center justify-center">
                        <Star className="w-3 md:w-4 h-3 md:h-4 text-[#9b252f]" />
                      </div>
                      <span className="font-medium text-xs md:text-sm text-[#2D2D2A]">{widget.title}</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-[#848FA5] mb-2 line-clamp-2">{widget.content}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#4C4C47]">{widget.author}</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(widget.rating)].map((_, i) => (
                        <Star key={i} className="w-2 md:w-3 h-2 md:h-3 text-[#C14953]" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Metrics */}
            <div className="absolute bottom-6 md:bottom-40 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3 z-20">
              {floatingReviews.map((review) => (
                <div
                  key={review.id}
                  className={`w-12 md:w-14 h-12 md:h-14 rounded-full ${review.bgColor} shadow-lg flex flex-col items-center justify-center backdrop-blur-sm bg-white/90`}
                >
                  {review.icon}
                  <span className="text-[10px] md:text-xs font-semibold mt-1 text-[#2D2D2A]">{review.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyHeroSection;