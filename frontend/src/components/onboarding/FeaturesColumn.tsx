import { Check, Sparkles, Star } from "lucide-react";
import { benefits } from "./data";

const FeaturesColumn = () => {
  return (
    <div className="md:col-span-2 sticky top-0">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl overflow-y-auto text-white h-full">
        <div className="px-6 py-6 border-b border-white/10">
          <h2 className="text-xl font-bold flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Transform your testimonials
          </h2>
          <p className="mt-1 text-blue-100">
            Join industry leaders using Cenphi.io
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* 3D Card effect */}
          <div className="relative group perspective">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative transform transition-all duration-500 ease-out group-hover:rotate-x-12">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4">
                  <Star className="h-6 w-6 text-white" fill="white" />
                </div>
                <div className="text-lg font-semibold mb-1">
                  Enterprise-Grade Platform
                </div>
                <p className="text-blue-100 text-sm">
                  Used by Fortune 500 companies and growing startups alike to
                  build trust and drive conversions.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start space-x-4 p-3 rounded-xl hover:bg-white/5 transition-colors duration-200"
              >
                <div
                  className={`flex-shrink-0 p-2 rounded-xl ${benefit.accentColor}`}
                >
                  {benefit.icon}
                </div>
                <div>
                  <span className="block font-medium text-white mb-0.5">
                    {benefit.title}
                  </span>
                  <span className="text-sm text-blue-100">
                    {benefit.description}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-xl blur-md opacity-30 group-hover:opacity-80 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-5 border border-white/20">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="font-medium">No credit card required</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="font-medium">Full featured 14-day trial</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <Check className="h-5 w-5" />
                  </div>
                  <div className="font-medium">Premium support included</div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial card */}
          {/* <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 relative">
          <div className="absolute -top-3 -right-3">
            <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              VERIFIED
            </div>
          </div>
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
              <img
                src="/api/placeholder/40/40"
                alt="User"
                className="rounded-full"
              />
            </div>
            <div className="ml-3">
              <div className="font-medium text-white">
                Sarah Thompson
              </div>
              <div className="text-xs text-blue-100">
                Marketing Director, TechSoft
              </div>
            </div>
          </div>
          <p className="text-sm italic text-blue-100 mb-3">
            "Cenphi completely transformed how we showcase customer
            success stories. Our conversion rates increased by 27%
            within the first month of implementation. The AI-powered
            insights helped us identify which testimonials resonated
            most with specific audience segments."
          </p>
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="h-4 w-4 text-amber-400"
                fill="#F59E0B"
              />
            ))}
          </div>
        </div> */}
        </div>
      </div>
    </div>
  );
};

export default FeaturesColumn;
