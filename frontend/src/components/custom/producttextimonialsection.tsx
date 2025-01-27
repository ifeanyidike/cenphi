import React from 'react';
import { Quote } from 'lucide-react';
import ProductReviewImage from "@/assets/600by600productreviewimage.png"

const ProductTestimonial = () => {
  return (
    <div className="w-full bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-medium text-[#31E981] uppercase tracking-wider">Product Data</span>
          <h2 className="text-4xl font-bold text-[#0C0C0C] mt-4 mb-6">
            Elevating Product Insights Through Reviews.
          </h2>
          <p className="text-[#6B818C] max-w-2xl mx-auto">
            Gathering product reviews may be a simple task, but collecting accurate information and displaying it strategically to customers can make the difference between an average product page and one that genuinely converts.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Decorative Elements */}
          <div className="absolute -left-4 top-0 w-20 h-20 bg-[#31E981]/10 rounded-full blur-xl" />
          <div className="absolute -right-4 bottom-0 w-16 h-16 bg-[#FE5F55]/10 rounded-full blur-lg" />

          {/* Testimonial Card */}
          <div className="relative bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Image Side */}
              <div className="relative">
                <div className="aspect-square rounded-xl overflow-hidden bg-[#6B818C]/10">
              
                  <img 
                    src={ProductReviewImage}
                    alt="Product Review Example" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#31E981] rounded-full flex items-center justify-center">
                  <Quote className="w-8 h-8 text-white transform rotate-180" />
                </div>
              </div>

              {/* Content Side */}
              <div className="space-y-6">
                <blockquote className="text-xl font-medium text-[#0C0C0C] leading-relaxed">
                  "Cenphi.io offers a wealth of features to quickly gain and build trust for products, strategically displaying customer feedback that transforms a good product page into a converting powerhouse."
                </blockquote>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#31E981]/20 rounded-full flex items-center justify-center">
                    <span className="text-[#31E981] font-bold">DS</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#0C0C0C]">Daniel Singh</h4>
                    <p className="text-sm text-[#6B818C]">Co-Founder @ Concrete Jungle</p>
                  </div>
                </div>

                <button className="px-6 py-2 bg-[#0C0C0C] text-white rounded-full text-sm font-medium hover:bg-[#31E981] transition-colors duration-300">
                  READ CASE STUDY
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductTestimonial;