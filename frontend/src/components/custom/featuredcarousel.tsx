import React, { useState } from 'react';
import { 
  Search, 
  LineChart, 
  Video, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Quote
} from 'lucide-react';
import ReviewerImage from "@/assets/myheroimage.png";
import ReviewImage2 from "@/assets/successfulbusinessman.png";

const FeatureCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  
  const features = [
    {
      id: 1,
      title: "Powerful Dashboard",
      description: "Keep all your testimonials organized with smart filtering tools.",
      icon: <LineChart className="w-6 h-6" />
    },
    {
      id: 2,
      title: "Auto-Transcription",
      description: "Convert video reviews to text automatically for easy organization.",
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 3,
      title: "Advanced Search",
      description: "Find the perfect testimonial instantly with powerful filters.",
      icon: <Search className="w-6 h-6" />
    },
    {
      id: 4,
      title: "HD Video Downloads",
      description: "Download high-quality videos ready for your marketing needs.",
      icon: <Video className="w-6 h-6" />
    }
  ];

  const testimonials = [
    {
      id: 1,
      quote: 
        "The auto-transcription feature has been an absolute game-changer. We've saved countless hours on manual transcription ,and our landing page conversion rate is up by 30%. My team and I now experience the benefits of social proof with the help of the widget offered to us by cenphi.io. It's the perfect tool for managing customer testimonials.",
      author: "Sophie O'Neal",
      position: "CRO @ Show Me More",
      image: ReviewImage2
    },
    {
      id: 2,
      quote: 
        "This platform transformed how we handle customer feedback. The powerful dashboard and filtering tools make it incredibly easy to find and share the most impactful reviews with our stakeholders.",
      author: "Sarah Chen",
      position: "Product Manager at TechCorp",
      image: ReviewerImage
    }
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="w-full max-w-7xl bg-white mx-auto py-8 md:py-16 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Features Section */}
          <div className="order-1 md:order-2">
            <h3 className="text-base md:text-lg font-bold text-[#2D2D2A] uppercase italic tracking-wider mb-3">
              Testimonial Management
            </h3>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D2D2A] mb-8 md:mb-10 leading-tight">
              Find the perfect testimonial every time
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-6 md:p-8 rounded-xl bg-white border border-[#2D2D2A]/20 hover:border-[#2D2D2A] transition-colors group"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#E5DCC5] flex items-center justify-center mb-4 md:mb-5 group-hover:bg-[#2D2D2A] transition-colors">
                    <div className="text-[#C14953] group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-[#2D2D2A] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-base md:text-lg text-[#848FA5] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial Section */}
          <div className="relative order-2 md:order-1">
            <div className="bg-[#2D2D2A] rounded-2xl md:rounded-3xl p-8 md:p-10 relative overflow-hidden h-full flex items-center">
              {/* Decorative quote mark */}
              <div className="absolute top-6 left-6 p-2 md:p-4 rounded-full">
                <Quote className="w-10 h-10 md:w-14 md:h-14 text-[#E5DCC5]" />
              </div>
              
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`transition-opacity duration-300 ${
                    index === activeSlide ? 'opacity-100' : 'opacity-0 absolute'
                  }`}
                >
                  <blockquote className="text-[#E5DCC5] text-xl md:text-3xl font-medium leading-relaxed mb-8 relative z-10 mt-12 md:mt-8">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg md:text-xl font-semibold text-white">
                        {testimonial.author}
                      </h4>
                      <p className="text-base md:text-lg text-white/80">
                        {testimonial.position}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Navigation buttons */}
              <div className="absolute bottom-6 right-6 flex space-x-3">
                <button
                  onClick={prevSlide}
                  className="p-2 md:p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 md:p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCarousel;