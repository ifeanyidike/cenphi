import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

const TestimonialShowcase = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager at TechCorp",
      content:
        "This product transformed how we handle customer feedback. The implementation was seamless and our team productivity increased by 40%.",
      rating: 5,
      company: "techcorp.com",
    },
    {
      name: "James Wilson",
      role: "CEO of StartupX",
      content:
        "Beyond impressed with the quality and ease of use. It's become an essential part of our customer experience strategy.",
      rating: 5,
      company: "startupx.io",
    },
    {
      name: "Maria Garcia",
      role: "Marketing Director",
      content:
        "The analytics capabilities are unmatched. We're getting insights we never had before.",
      rating: 5,
      company: "innovate.co",
    },
  ];

  const nextTestimonial = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }
  };

  const prevTestimonial = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(
        (prev) => (prev - 1 + testimonials.length) % testimonials.length
      );
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg">
        <CardContent className="p-8">
          <div className="relative">
            <div
              className={`transform transition-all duration-500 ${
                isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
              }`}
            >
              <div className="absolute -top-4 -left-2">
                <Quote size={40} className="text-purple-400 opacity-50" />
              </div>

              <div className="mb-4">
                {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="inline-block w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              <p className="text-lg md:text-xl text-gray-700 mb-6">
                {testimonials[currentIndex].content}
              </p>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {testimonials[currentIndex].name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {testimonials[currentIndex].role}
                  </p>
                  <p className="text-sm text-purple-600">
                    {testimonials[currentIndex].company}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={prevTestimonial}
                    className="p-2 rounded-full hover:bg-purple-100 transition-colors"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-6 h-6 text-purple-600" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="p-2 rounded-full hover:bg-purple-100 transition-colors"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-6 h-6 text-purple-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-center gap-2">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex ? "bg-purple-600 w-4" : "bg-purple-200"
            }`}
            aria-label={`Go to testimonial ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default TestimonialShowcase;
