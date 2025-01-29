// import React, { useState } from 'react';
// import { Star, ThumbsUp, MessageCircle, Award } from 'lucide-react';
// import Sucessfulbusinessman from "@/assets/successfulbusinessman.png";

// const MyHeroSection = () => {
//   const [activeWidget, setActiveWidget] = useState<number | null>(null);

//   const floatingReviews = [
//     {
//       id: 1,
//       icon: <Star className="text-yellow-400" />,
//       label: "5.0",
//       bgColor: "bg-white"
//     },
//     {
//       id: 2,
//       icon: <ThumbsUp className="text-green-500" />,
//       label: "98%",
//       bgColor: "bg-white"
//     },
//     {
//       id: 3,
//       icon: <MessageCircle className="text-purple-500" />,
//       label: "2.5k",
//       bgColor: "bg-white"
//     },
//     {
//       id: 4,
//       icon: <Award className="text-orange-500" />,
//       label: "Top",
//       bgColor: "bg-white"
//     }
//   ];

//   const reviewWidgets = [
//     {
//       id: 1,
//       title: "Customer Satisfaction",
//       content: "Excellent service! The team was very responsive.",
//       author: "William Smith",
//       rating: 5,
//       position: { top: '15%', left: '45%' },
//       category: "Verified Purchase"
//     },
//     {
//       id: 2,
//       title: "Product Quality",
//       content: "Amazing quality and fast delivery.",
//       author: "Thomas Wise",
//       rating: 5,
//       position: { top: '45%', left: '75%' },
//       category: "Top Reviewer"
//     },
//     {
//       id: 3,
//       title: "User Experience",
//       content: "Intuitive interface and great features!",
//       author: "Karen Smith",
//       rating: 5,
//       position: { top: '70%', left: '35%' },
//       category: "Verified Purchase"
//     }
//   ];

//   return (
//     <div className="w-full max-w-7xl bg-[#FFFFFF] p-8 rounded-lg mt-24 overflow-hidden">
//       <div className="max-w-6xl mx-auto">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
//           {/* Left Column */}
//           <div className="space-y-6">
//             <h1 className="text-4xl font-bold leading-tight text-[#0C0C0C]">
//               Unlock Trust with the Right Review Collection Tools
//             </h1>
//             <p className="text-[#6B818C] text-lg">
//               The all-in-one platform to collect, manage, and showcase testimonials that drive conversions and build trust with your audience.
//             </p>
//             <div className="flex gap-4">
//               <button className="px-8 py-3 bg-[#31E981] text-[#0C0C0C] font-semibold rounded-full hover:bg-[#FE5F55] transition-colors">
//                 Join for free
//               </button>
//               <button className="px-8 py-3 border-2 border-[#FE5F55] text-[#FE5F55] font-semibold rounded-full hover:bg-[#FE5F55] hover:text-white transition-colors">
//                 View Demo
//               </button>
//             </div>
//           </div>
          
//           {/* Right Column */}
//           <div className="relative h-[480px] bg-[#31E981] rounded-lg overflow-hidden">
//             {/* Main Image Container - Now on top */}
//             <div className="absolute inset-0 flex items-center justify-center">
//               <img 
//                 src={Sucessfulbusinessman} 
//                 alt="successful business man" 
//                 className="object-cover h-full w-full z-10"
//               />
//             </div>

//             {/* Floating Review Widgets */}
//             <div className="absolute inset-0 z-20">
//               {reviewWidgets.map((widget) => (
//                 <div
//                   key={widget.id}
//                   className={`absolute w-56 bg-white rounded-lg shadow-lg p-4 transition-all duration-500 cursor-pointer
//                     ${activeWidget === widget.id ? 'scale-110 z-30' : 'scale-100 z-20'}
//                     hover:shadow-xl`}
//                   style={{
//                     top: widget.position.top,
//                     left: widget.position.left,
//                     transform: `translate(-0%, -0%) ${activeWidget === widget.id ? 'scale(1.1)' : 'scale(1)'}`,
//                     // animation: `float ${3 + widget.id}s ease-in-out infinite alternate`
//                   }}
//                   onMouseEnter={() => setActiveWidget(widget.id)}
//                   onMouseLeave={() => setActiveWidget(null)}
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       <div className="w-8 h-8 rounded-full bg-[#31E981] flex items-center justify-center">
//                         <Star className="w-4 h-4 text-[#0C0C0C]" />
//                       </div>
//                       <span className="font-medium text-sm">{widget.title}</span>
//                     </div>
//                   </div>
//                   <p className="text-sm text-[#6B818C] mb-2 line-clamp-2">{widget.content}</p>
//                   <div className="flex items-center justify-between text-xs">
//                     <span className="text-[#6B818C]">{widget.author}</span>
//                     <div className="flex items-center space-x-1">
//                       {[...Array(widget.rating)].map((_, i) => (
//                         <Star key={i} className="w-3 h-3 text-[#31E981]" fill="currentColor" />
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Floating Metrics */}
//             <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
//               {floatingReviews.map((review, index) => (
//                 <div
//                   key={review.id}
//                   className={`w-14 h-14 rounded-full ${review.bgColor} shadow-lg flex flex-col items-center justify-center backdrop-blur-sm bg-white/80`}
//                   // style={{
//                   //   animation: `float ${200 + index * 0.5}s ease-in-out infinite alternate`
//                   // }}
//                 >
//                   {review.icon}
//                   <span className="text-xs font-semibold mt-1 text-[#0C0C0C]">{review.label}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       <style>{`
//         @keyframes float {
//           0% { transform: translateY(0px) rotate(0deg); }
//           100% { transform: translateY(-10px) rotate(2deg); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default MyHeroSection;

// import React, { useState } from 'react';
// import { Star, ThumbsUp, MessageCircle, Award } from 'lucide-react';
// import Sucessfulbusinessman from "@/assets/successfulbusinessman.png";

// const MyHeroSection = () => {
//   const [activeWidget, setActiveWidget] = useState<number | null>(null);

//   const floatingReviews = [
//     {
//       id: 1,
//       icon: <Star className="text-[#C14953]" />,
//       label: "5.0",
//       bgColor: "bg-[#E5DCC5]"
//     },
//     {
//       id: 2,
//       icon: <ThumbsUp className="text-[#C14953]" />,
//       label: "98%",
//       bgColor: "bg-[#E5DCC5]"
//     },
//     {
//       id: 3,
//       icon: <MessageCircle className="text-[#C14953]" />,
//       label: "2.5k",
//       bgColor: "bg-[#E5DCC5]"
//     },
//     {
//       id: 4,
//       icon: <Award className="text-[#C14953]" />,
//       label: "Top",
//       bgColor: "bg-[#E5DCC5]"
//     }
//   ];

//   const reviewWidgets = [
//     {
//       id: 1,
//       title: "Customer Satisfaction",
//       content: "Excellent service! The team was very responsive.",
//       author: "William Smith",
//       rating: 5,
//       position: { top: '15%', left: '45%' },
//       category: "Verified Purchase"
//     },
//     {
//       id: 2,
//       title: "Product Quality",
//       content: "Amazing quality and fast delivery.",
//       author: "Thomas Wise",
//       rating: 5,
//       position: { top: '45%', left: '75%' },
//       category: "Top Reviewer"
//     },
//     {
//       id: 3,
//       title: "User Experience",
//       content: "Intuitive interface and great features!",
//       author: "Karen Smith",
//       rating: 5,
//       position: { top: '70%', left: '35%' },
//       category: "Verified Purchase"
//     }
//   ];

//   return (
//     <div className="w-full max-w-7xl bg-[#2D2D2A] p-8 rounded-lg mt-24 overflow-hidden">
//       <div className="max-w-6xl mx-auto">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
//           {/* Left Column */}
//           <div className="space-y-6">
//             <h1 className="text-4xl font-bold leading-tight text-[#E5DCC5]">
//               Unlock Trust with the Right Review Collection Tools
//             </h1>
//             <p className="text-[#848FA5] text-lg">
//               The all-in-one platform to collect, manage, and showcase testimonials that drive conversions and build trust with your audience.
//             </p>
//             <div className="flex gap-4">
//               <button className="px-8 py-3 bg-[#C14953] text-[#E5DCC5] font-semibold rounded-full hover:bg-[#848FA5] transition-colors">
//                 Join for free
//               </button>
//               <button className="px-8 py-3 border-2 border-[#848FA5] text-[#848FA5] font-semibold rounded-full hover:bg-[#848FA5] hover:text-[#E5DCC5] transition-colors">
//                 View Demo
//               </button>
//             </div>
//           </div>
          
//           {/* Right Column */}
//           <div className="relative h-[480px] bg-[#4C4C47] rounded-lg overflow-hidden">
//             {/* Main Image Container */}
//             <div className="absolute inset-0 flex items-center justify-center">
//               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#2D2D2A] opacity-50" />
//               <img 
//                 src={Sucessfulbusinessman} 
//                 alt="successful business man" 
//                 className="object-cover h-full w-full z-10"
//               />
//             </div>

//             {/* Floating Review Widgets */}
//             <div className="absolute inset-0 z-20">
//               {reviewWidgets.map((widget) => (
//                 <div
//                   key={widget.id}
//                   className={`absolute w-56 bg-[#E5DCC5] rounded-lg shadow-lg p-4 transition-all duration-500 cursor-pointer
//                     ${activeWidget === widget.id ? 'scale-110 z-30' : 'scale-100 z-20'}
//                     hover:shadow-xl`}
//                   style={{
//                     top: widget.position.top,
//                     left: widget.position.left,
//                     transform: `translate(-0%, -0%) ${activeWidget === widget.id ? 'scale(1.1)' : 'scale(1)'}`,
//                   }}
//                   onMouseEnter={() => setActiveWidget(widget.id)}
//                   onMouseLeave={() => setActiveWidget(null)}
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center space-x-2">
//                       <div className="w-8 h-8 rounded-full bg-[#848FA5] flex items-center justify-center">
//                         <Star className="w-4 h-4 text-[#E5DCC5]" />
//                       </div>
//                       <span className="font-medium text-sm text-[#2D2D2A]">{widget.title}</span>
//                     </div>
//                   </div>
//                   <p className="text-sm text-[#4C4C47] mb-2 line-clamp-2">{widget.content}</p>
//                   <div className="flex items-center justify-between text-xs">
//                     <span className="text-[#4C4C47]">{widget.author}</span>
//                     <div className="flex items-center space-x-1">
//                       {[...Array(widget.rating)].map((_, i) => (
//                         <Star key={i} className="w-3 h-3 text-[#C14953]" fill="currentColor" />
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Floating Metrics */}
//             <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
//               {floatingReviews.map((review) => (
//                 <div
//                   key={review.id}
//                   className={`w-14 h-14 rounded-full ${review.bgColor} shadow-lg flex flex-col items-center justify-center backdrop-blur-sm bg-opacity-90`}
//                 >
//                   {review.icon}
//                   <span className="text-xs font-semibold mt-1 text-[#2D2D2A]">{review.label}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MyHeroSection;

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
    <div className="w-full max-w-7xl bg-white p-8 rounded-lg mx-auto mt-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight text-[#2D2D2A]">
              Unlock Trust with the Right Review Collection Tools
            </h1>
            <p className="text-[#848FA5] text-lg">
              The all-in-one platform to collect, manage, and showcase testimonials that drive conversions and build trust with your audience.
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-3 bg-[#2D2D2A] text-white font-semibold rounded-full hover:bg-[#C14953] transition-colors duration-300">
                Join for free
              </button>
              <button className="px-8 py-3 border-2 border-[#C14953] text-[#C14953] font-semibold rounded-full hover:border-[#2D2D2A] hover:text-[#2D2D2A] transition-colors duration-300">
                View Demo
              </button>
            </div>
          </div>
          
          {/* Right Column */}
          <div className="relative h-[480px] bg-[#2D2D2A] rounded-2xl overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#C14953] opacity-10 rounded-full transform translate-x-20 -translate-y-20"></div>
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#848FA5] opacity-10 rounded-full transform -translate-x-20 translate-y-20"></div>
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

            {/* Floating Review Widgets */}
            <div className="absolute inset-0 z-20">
              {reviewWidgets.map((widget) => (
                <div
                  key={widget.id}
                  className={`absolute w-56 bg-white rounded-lg shadow-lg p-4 transition-all duration-500 cursor-pointer
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
                      <div className="w-8 h-8 rounded-full bg-[#E5DCC5] flex items-center justify-center">
                        <Star className="w-4 h-4 text-[#C14953]" />
                      </div>
                      <span className="font-medium text-sm text-[#2D2D2A]">{widget.title}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[#848FA5] mb-2 line-clamp-2">{widget.content}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#4C4C47]">{widget.author}</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(widget.rating)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-[#C14953]" fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Metrics */}
            <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
              {floatingReviews.map((review) => (
                <div
                  key={review.id}
                  className={`w-14 h-14 rounded-full ${review.bgColor} shadow-lg flex flex-col items-center justify-center backdrop-blur-sm bg-white/90`}
                >
                  {review.icon}
                  <span className="text-xs font-semibold mt-1 text-[#2D2D2A]">{review.label}</span>
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