import { Star } from "lucide-react";
import { Quote } from "lucide-react";

const ProductDataCard = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 overflow-hidden">
      <div className="bg-[#2D2D2A] rounded-xl sm:rounded-2xl text-[#E5DCC5] p-4 sm:p-6 md:p-8 min-h-[400px]">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Product Data
          </h1>
          <h2 className="text-xl sm:text-2xl mb-4 sm:mb-8 text-[#848FA5]">
            Elevating Product Insights Through Reviews
          </h2>

          {/* Main Text */}
          <p className="text-base sm:text-lg mb-6 sm:mb-12 max-w-3xl">
            Gathering product reviews may be a simple task, but collecting
            accurate information and displaying it strategically to customers
            can make the difference between an average product page and one that
            genuinely converts.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-12">
            {/* Rating Card */}
            <div className="bg-[#4C4C47] p-4 sm:p-6 rounded-lg">
              <div className="flex items-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500 fill-yellow-500"
                  />
                ))}
              </div>
              <div className="text-2xl sm:text-3xl font-bold mb-1">4.9/5.0</div>
              <div className="text-sm sm:text-base text-[#848FA5]">
                Average Customer Rating
              </div>
            </div>

            {/* Satisfaction Card */}
            <div className="bg-[#4C4C47] p-4 sm:p-6 rounded-lg">
              <div className="text-2xl sm:text-3xl font-bold mb-1">98%</div>
              <div className="text-sm sm:text-base text-[#848FA5]">
                Customer Satisfaction
              </div>
              <div className="text-xs sm:text-sm mt-1">
                Based on 1000+ reviews
              </div>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="bg-[#E5DCC5] text-[#2D2D2A] p-4 sm:p-6 md:p-8 rounded-lg">
            <div className="hidden lg:flex mb-4">
              <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-[#C14953] transform -scale-x-100" />
            </div>
            <p className="text-base sm:text-lg mb-4 sm:mb-6">
              Cenphi.io offers a wealth of features to quickly gain and build
              trust for products, strategically displaying customer feedback
              that transforms a good product page into a converting powerhouse.
            </p>

            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#C14953] flex items-center justify-center text-[#E5DCC5] font-bold mr-3 sm:mr-4">
                DS
              </div>
              <div>
                <div className="font-bold text-sm sm:text-base">
                  Daniel Singh
                </div>
                <div className="text-[#4C4C47] text-xs sm:text-sm">
                  Co-Founder @ Concrete Jungle
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full sm:w-auto mt-6 sm:mt-8 bg-[#C14953] text-[#E5DCC5] px-4 sm:px-6 py-3 rounded-lg hover:bg-opacity-90 transition-opacity flex items-center justify-center sm:justify-start">
            READ CASE STUDY
            <svg
              className="w-4 h-4 ml-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDataCard;
