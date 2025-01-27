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
    <div className="w-full max-w-6xl mx-auto p-8">
      <div className="grid md:grid-cols-2 gap-5 bg-gradient-to-br from-[#31E981]/30 to-white rounded-lg items-start p-10">
        {/* Review Cards Column */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  ))}
                </div>
                <span className="font-medium text-[#0C0C0C]">{review.author}</span>
                {review.verified && (
                  <span className="text-xs text-blue-600">
                    ✓ Verified Buyer
                  </span>
                )}
                <span className="text-sm text-[#6B818C] ml-auto">{review.date}</span>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <p className="text-[#0C0C0C] whitespace-pre-line">{review.content}</p>
              </div>

              {/* Images */}
              <div className="flex gap-2 my-4">
                {review.images.map((img, index) => (
                  <div key={index} className="w-16 h-16 rounded-md overflow-hidden bg-[#6B818C]/10">
                    <img src={GirlwithFlower} alt={`Review ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-2">
                <button className="px-4 py-1 border border-[#6B818C]/20 rounded-full text-sm">
                  Share
                </button>
                <div className="flex items-center gap-2 text-sm text-[#6B818C]">
                  <span>Was this review helpful?</span>
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
          ))}
        </div>

        {/* Image Column */}
        <div className="relative">
          <div className="w-[600px] h-[600px] rounded-xl overflow-hidden">
            <img 
              src={GirlwithFlower} 
              alt="Plant Review" 
              className="w-full h-full object-contain transform scale-x-[-1]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewWidget;