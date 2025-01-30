import React from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import GirlwithFlower from "@/assets/girlwithflower.png";

const ReviewWidget = () => {
  const reviews = [
    {
      id: 1,
      author: "John Doe",
      verified: true,
      date: "01/23/2024",
      rating: 5,
      content: "Tell us about your experience\n\nGreenGroove exceeded my expectations! Plants arrived safely packed and even more beautiful than expected. Outstanding customer service too. Will definitely reorder!",
      images: ["/api/placeholder/80/80", "/api/placeholder/80/80"],
      helpfulCount: 12,
      notHelpfulCount: 0
    },
    {
      id: 2,
      author: "Kevin Smith",
      verified: true,
      date: "01/22/2024",
      rating: 5,
      content: "Tell us about your experience\n\nGreenGroove never disappoints! Excellent selection, top-quality plants, and user-friendly website. Highly recommended for all plant lovers!",
      images: ["/api/placeholder/80/80", "/api/placeholder/80/80", "/api/placeholder/80/80"],
      helpfulCount: 8,
      notHelpfulCount: 1
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 overflow-hidden">
      <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8 bg-[#2D2D2A] rounded-lg md:rounded-2xl items-start p-4 md:p-10">
        {/* Image Column - Moved to top on mobile */}
        <div className="relative order-1 md:order-2 w-full">
          <div className="w-full aspect-square md:w-[600px] md:h-[600px] bg-[#E5DCC5]/10 rounded-full overflow-hidden mx-auto">
            <img 
              src={GirlwithFlower} 
              alt="Plant Review" 
              className="w-full h-full object-contain transform scale-x-[-1]"
            />
          </div>
        </div>

        {/* Review Cards Column */}
        <div className="space-y-4 order-2 md:order-1 w-full">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="flex">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <span className="font-medium text-[#0C0C0C] text-sm md:text-base">
                  {review.author}
                </span>
                {review.verified && (
                  <span className="text-xs text-blue-600 whitespace-nowrap">
                    ✓ Verified Buyer
                  </span>
                )}
                <span className="text-xs md:text-sm text-[#6B818C] ml-auto">
                  {review.date}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <p className="text-[#0C0C0C] text-sm md:text-base whitespace-pre-line">
                  {review.content}
                </p>
              </div>

              {/* Images */}
              <div className="flex flex-wrap gap-2 my-3 md:my-4">
                {review.images.map((img, index) => (
                  <div 
                    key={index} 
                    className="w-14 h-14 md:w-16 md:h-16 rounded-md overflow-hidden bg-[#6B818C]/10"
                  >
                    <img 
                      src={GirlwithFlower} 
                      alt={`Review ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 mt-3 md:mt-2">
                <button className="px-4 py-1 border border-[#6B818C]/20 rounded-full text-sm">
                  Share
                </button>
                <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-[#6B818C]">
                  <span>Was this review helpful?</span>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 text-blue-600">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{review.helpfulCount}</span>
                    </button>
                    <button className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4" />
                      <span>{review.notHelpfulCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewWidget;