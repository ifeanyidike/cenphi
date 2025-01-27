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
      description: "Keep all your testimonials organized and safe, and have easy filtering tools that make finding them simple.",
      icon: <LineChart className="w-6 h-6" />
    },
    {
      id: 2,
      title: "Auto-Transcription",
      description: "Send auto-transcribe your video reviews into text, making them easy to digest and organize them by product or feedback.",
      icon: <FileText className="w-6 h-6" />
    },
    {
      id: 3,
      title: "Advanced Search",
      description: "Find the perfect testimonial with powerful filters and the ability to search.",
      icon: <Search className="w-6 h-6" />
    },
    {
      id: 4,
      title: "HD Video Downloads",
      description: "Download video testimonials in high-quality format for your marketing needs.",
      icon: <Video className="w-6 h-6" />
    }
  ];

  const testimonials = [
    {
      id: 1,
      quote: "The intuitive auto-transcription option make it easy for me to share my reviews on any forms straight to my landing page a visitor hits, and they look great with so little work. It's so much easier than asking for 'thoughts and feedback' in an email chain where it's gonna go to die!",
      author: "Sophie O'Neal",
      position: "CRO @ Show Me More",
      image: ReviewImage2
    },
    {
        id: 2,
        quote: "The dashboard is powerful making collection of customer feedback a breeze. The implementation was seamless and our team productivity increased by 40%.",
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
    <div className="w-full bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Testimonial Section */}
          <div className="relative">
            <div className="bg-[#31E981] rounded-3xl p-8 relative overflow-hidden">
              {/* Decorative quote mark */}
              <div className="absolute top-4 left-4">
                <Quote className="w-12 h-12 text-white/20" />
              </div>
              
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`transition-opacity duration-300 ${
                    index === activeSlide ? 'opacity-100' : 'opacity-0 absolute'
                  }`}
                >
                  <blockquote className="text-white text-lg font-medium mb-6 relative z-10">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-white font-semibold">{testimonial.author}</h4>
                      <p className="text-white/80 text-sm">{testimonial.position}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Navigation buttons */}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <button
                  onClick={prevSlide}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div>
            <h3 className="text-sm font-medium text-[#31E981] uppercase tracking-wider mb-2">
              Testimonial Management
            </h3>
            <h2 className="text-3xl font-bold text-[#0C0C0C] mb-8">
              Organize & find the perfect testimonial every time
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-6 rounded-xl bg-white border border-[#6B818C]/10 hover:border-[#31E981] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#31E981]/10 flex items-center justify-center mb-4 group-hover:bg-[#31E981] transition-colors">
                    <div className="text-[#31E981] group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#0C0C0C] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#6B818C]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCarousel;