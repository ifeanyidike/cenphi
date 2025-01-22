import React from 'react';
import { CheckCircle, ArrowRight, Star } from 'lucide-react';
import { Button } from "@/components/ui/button";

const HeroSection = () => {
    return (
      <div className="relative min-h-screen bg-gray-300 rounded-bl-[100px] rounded-br-[100px] overflow-hidden pt-16 md:pt-20">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-teal-200 rounded-full opacity-40 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-200 rounded-full opacity-40 blur-3xl" />
      </div>

      {/* Content container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 w-[90%]">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Text content */}
          <div className="space-y-8 bg-gradient-to-br from-teal-100 via-teal-200 to-rose-100 backdrop-blur-sm rounded-3xl p-8 shadow-lg">
            {/* Social proof badge */}
            <div className="inline-flex items-center gap-2 bg-white/40 backdrop-blur-sm rounded-full px-4 py-2 text-gray-700">
              <Star className="h-4 w-4 fill-current text-yellow-500" />
              <span className="text-sm">Trusted by 20,000+ happy customers</span>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 leading-tight">
              Unlock Trust with the Right <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-rose-500">Review Collection Tools</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-gray-600 max-w-xl">
              The all-in-one platform to collect, manage, and showcase testimonials that drive conversions and build trust with your audience.
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                'Import testimonials from 30+ platforms automatically',
                'Collect video & text testimonials with one-click',
                'Display social proof anywhere with embedded widgets'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-teal-500" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-teal-200 hover:bg-teal-600 text-white px-8">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-teal-500 text-teal-500 hover:bg-teal-50">
                Book a demo
              </Button>
            </div>

            {/* Review stats */}
            <div className="flex items-center gap-4 mt-8">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-teal-400 to-rose-400" />
                ))}
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-600">4.9/5 from 2000+ reviews</span>
            </div>
          </div>

          {/* Right column - Application preview */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-teal-100 via-teal-200 to-rose-100 backdrop-blur-sm   rounded-3xl p-4 shadow-xl">
              <div className="aspect-[4/3] rounded-2xl bg-white/50 overflow-hidden">
                <img 
                  src="/api/placeholder/800/600" 
                  alt="Application preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-6 -left-6 bg-white rounded-lg shadow-lg p-4 transform -rotate-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-rose-400" />
                  <div>
                    <div className="font-medium">Amazing product!</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-current text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 transform rotate-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-teal-500" />
                  <span className="font-medium">Verified Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
};

export default HeroSection;