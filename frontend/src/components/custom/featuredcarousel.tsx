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
      icon: <LineChart className="w-6 h-6" />,
      review: "Our team has never been more efficient. The powerful dashboard helped us organize and categorize thousands of customer testimonials. It saves hours every week, and filtering is seamless."
    },
    {
      id: 2,
      title: "Auto-Transcription",
      description: "Automatically transcribe your video reviews into text, making them easy to digest and organize by product or feedback.",
      icon: <FileText className="w-6 h-6" />,
      review: "The auto-transcription tool is a game-changer. It simplifies the process of converting video reviews to text, which makes sorting and sharing reviews on social media a breeze."
    },
    {
      id: 3,
      title: "Advanced Search",
      description: "Find the perfect testimonial with powerful filters and advanced search capabilities.",
      icon: <Search className="w-6 h-6" />,
      review: "Advanced Search has made finding specific testimonials incredibly fast. Whether searching by customer name or keywords, it ensures the perfect feedback is always within reach."
    },
    {
      id: 4,
      title: "HD Video Downloads",
      description: "Download video testimonials in high-quality format for your marketing needs.",
      icon: <Video className="w-6 h-6" />,
      review: "The ability to download HD video testimonials has elevated our marketing campaigns. The quality is superb, and it allows us to repurpose videos across multiple platforms."
    }
  ];

  const testimonials = [
    {
      id: 1,
      quote: 
        "The intuitive auto-transcription feature has been an absolute game-changer for my team. Before using this tool, we spent hours manually transcribing customer video reviews, which was both time-consuming and inefficient. Now, the process is entirely automated, and the transcripts are highly accurate, saving us hours of labor. It’s also easy to organize the testimonials by categories or products, making it simple to showcase specific feedback to potential customers. Since we started using this tool, engagement on our landing pages has increased significantly, and our conversion rate is up by 30%. I recommend this tool to anyone looking to enhance their customer feedback system.",
      author: "Sophie O'Neal",
      position: "CRO @ Show Me More",
      image: ReviewImage2
    },
    {
      id: 2,
      quote: 
        "The dashboard has been a revelation for our team. Its user-friendly design allows us to organize and analyze hundreds of testimonials effortlessly. The ability to filter feedback by specific keywords, products, or even customer sentiment has made it so much easier to find the most impactful reviews to share with our stakeholders. We’ve saved countless hours that would have been spent digging through scattered data, and our marketing campaigns have become more targeted as a result. Additionally, the powerful visualization tools help us track trends and uncover areas for improvement. This platform has truly transformed how we collect and utilize customer feedback in our organization.",
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
    <div className="w-full max-w-7xl bg-white mx-auto py-16 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Testimonial Section */}
          <div className="relative">
            <div className="bg-[#2D2D2A] rounded-3xl p-8 relative overflow-hidden h-full flex items-center">
              {/* Decorative quote mark */}
              <div className="absolute top-4 left-4 p-4 rounded-full">
                <Quote className="w-12 h-12 text-[#E5DCC5]" />
              </div>
              
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`transition-opacity duration-300 ${
                    index === activeSlide ? 'opacity-100' : 'opacity-0 absolute'
                  }`}
                >
                  <blockquote className="text-[#E5DCC5] text-2xl font-lg text-justified mb-6 relative z-10">
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
            <h3 className="text-sm font-bold text-[#2D2D2A] uppercase itallic bold tracking-wider mb-2">
              Testimonial Management
            </h3>
            <h2 className="text-3xl font-bold text-[#2D2D2A] mb-8">
              Organize & find the perfect testimonial every time
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.id}
                  className="p-6 rounded-xl bg-white border border-[#2D2D2A]/20 hover:border-[#2D2D2A] transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E5DCC5] flex items-center justify-center mb-4 group-hover:bg-[#2D2D2A] transition-colors">
                    <div className="text-[#C14953] group-hover:text-white transition-colors">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-[#2D2D2A] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#848FA5]">
                    {feature.description}
                  </p>
                  <p className="text-xs text-[#2D2D2A] mt-2">
                    <strong>Review:</strong> {feature.review}
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