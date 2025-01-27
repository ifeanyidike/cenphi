import React, { useState } from 'react';
import { Star, ThumbsUp, MessageCircle, Award } from 'lucide-react';
import Sucessfulbusinessman from "@/assets/successfulbusinessman.png";

const MyHeroSection = () => {
  const [activeWidget, setActiveWidget] = useState<number | null>(null);

  const floatingReviews = [
    {
      id: 1,
      icon: <Star className="text-yellow-400" />,
      label: "5.0",
      bgColor: "bg-blue-50"
    },
    {
      id: 2,
      icon: <ThumbsUp className="text-green-500" />,
      label: "98%",
      bgColor: "bg-green-50"
    },
    {
      id: 3,
      icon: <MessageCircle className="text-purple-500" />,
      label: "2.5k",
      bgColor: "bg-purple-50"
    },
    {
      id: 4,
      icon: <Award className="text-orange-500" />,
      label: "Top",
      bgColor: "bg-orange-50"
    }
  ];

  const reviewWidgets = [
    {
      id: 1,
      title: "Customer Satisfaction",
      content: "Excellent service! The team was very responsive.",
      author: "William Smith",
      rating: 5,
      position: { top: '15%', left: '25%' },
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
    <div className="w-full bg-[#FFFFFF] p-8 rounded-lg mt-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-[#0C0C0C]">
              Unlock Trust with the Right Review Collection Tools
            </h1>
            <p className="text-[#6B818C] text-lg">
              The all-in-one platform to collect, manage, and showcase testimonials that drive conversions and build trust with your audience.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-[#31E981] text-[#0C0C0C] font-semibold rounded-full hover:bg-[#FE5F55] transition-colors">
                Join for free
              </button>
              <button className="px-8 py-3 bg-white text-[#0C0C0C] font-semibold rounded-full border border-[#6B818C]/20 hover:border-[#31E981] transition-colors">
                Login
              </button>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="relative h-[480px] bg-gradient-to-br from-[#31E981]/10 to-white rounded-lg">
            {/* Main Image Container */}
            <div className="absolute inset-0 flex items-center justify-center">
              <img 
                src={Sucessfulbusinessman} 
                alt="successful business man" 
                className="object-cover h-full w-full"
              />
            </div>

            {/* Floating Review Widgets */}
            <div className="absolute inset-0">
              {reviewWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`absolute w-56 bg-white rounded-lg shadow-lg p-4 transition-all duration-500 cursor-pointer
                    ${activeWidget === widget.id ? 'scale-110 z-20' : 'scale-100 z-10'}
                    hover:shadow-xl`}
                  style={{
                    top: widget.position.top,
                    left: widget.position.left,
                    transform: `translate(-50%, -50%) ${activeWidget === widget.id ? 'scale(1.1)' : 'scale(1)'}`,
                    animation: `float ${3 + widget.id}s ease-in-out infinite alternate`
                  }}
                  onMouseEnter={() => setActiveWidget(widget.id)}
                  onMouseLeave={() => setActiveWidget(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-[#31E981]/20 flex items-center justify-center">
                        <Star className="w-4 h-4 text-[#31E981]" />
                      </div>
                      <span className="font-medium text-sm">{widget.title}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B818C] mb-2 line-clamp-2">{widget.content}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6B818C]">{widget.author}</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(widget.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Metrics */}
            <div className="absolute bottom-15 left-1/2 transform -translate-x-1/2 flex space-x-3 z-10">
              {floatingReviews.map((review, index) => (
                <div
                  key={review.id}
                  className={`w-14 h-14 rounded-full ${review.bgColor} shadow-lg flex flex-col items-center justify-center`}
                  style={{
                    animation: `float ${2 + index * 0.5}s ease-in-out infinite alternate`
                  }}
                >
                  {review.icon}
                  <span className="text-xs font-semibold mt-1">{review.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-10px) rotate(2deg); }
        }
      `}</style>
    </div>
  );
};

export default MyHeroSection;