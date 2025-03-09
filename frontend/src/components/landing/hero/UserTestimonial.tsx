import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowRight, ArrowLeft, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  content: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  image: string;
  color: string;
}

const TestimonialSlide = ({
  testimonial,
  isActive,
  direction,
}: {
  testimonial: Testimonial;
  isActive: boolean;
  direction: number;
}) => {
  return (
    <motion.div
      className={`absolute inset-0 w-full h-full ${isActive ? "z-20" : "z-10"}`}
      initial={{ opacity: 0, x: direction > 0 ? "100%" : "-100%" }}
      animate={{
        opacity: isActive ? 1 : 0,
        x: isActive ? "0%" : direction > 0 ? "-100%" : "100%",
      }}
      exit={{ opacity: 0, x: direction > 0 ? "-100%" : "100%" }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
      }}
    >
      <div className="relative h-full bg-gradient-to-br from-gray-900 to-black">
        {/* Accent Color Gradient */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${testimonial.color}40 0%, transparent 70%)`,
          }}
        />

        <div className="relative z-10 grid lg:grid-cols-2 h-full max-w-screen-xl mx-auto">
          {/* Content Section */}
          <div className="flex flex-col justify-center p-8 lg:p-16 xl:p-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              {/* Quote Icon */}
              <Quote
                className="absolute -top-12 -left-8 w-16 h-16 text-white/10"
                strokeWidth={1}
              />

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial Content */}
              <blockquote className="text-2xl lg:text-3xl xl:text-4xl font-light mb-8 leading-relaxed text-white/90">
                {testimonial.content}
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center gap-6 mt-8">
                <div className="h-16 w-16 rounded-full overflow-hidden">
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-white">
                    {testimonial.author}
                  </h4>
                  <p className="text-white/60">
                    {testimonial.role} · {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Image Section */}
          <div className="relative w-full h-full hidden lg:block">
            <motion.div
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{
                scale: isActive ? 1 : 1.1,
                opacity: isActive ? 1 : 0,
              }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 flex justify-center items-center p-16"
            >
              <div className="relative w-full h-full max-w-[500px] max-h-[500px]">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-full h-full object-cover rounded-3xl"
                />
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: `linear-gradient(45deg, ${testimonial.color}40, transparent)`,
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PremiumHero = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials: Testimonial[] = [
    {
      id: "1",
      content:
        "The most innovative platform I've ever used. It completely transformed how we handle customer feedback.",
      author: "Alexandra Chen",
      role: "Chief Innovation Officer",
      company: "Future Corp",
      rating: 5,
      image: "/media/img/iStock-1357573240.webp",
      // color: "#FF3366",
      color: "rgba(59,130,246,0.3)",
    },
    {
      id: "2",
      content:
        "The most innovative platform I've ever used. It completely transformed how we handle customer feedback.",
      author: "Alexandra Chen",
      role: "Chief Innovation Officer",
      company: "Future Corp",
      rating: 5,
      image: "/media/img/iStock-1339459004.webp",
      color: "#333366",
    },
    {
      id: "3",
      content:
        "The most innovative platform I've ever used. It completely transformed how we handle customer feedback.",
      author: "Alexandra Chen",
      role: "Chief Innovation Officer",
      company: "Future Corp",
      rating: 5,
      image: "/media/img/iStock-1354196176.webp",
      color: "#013366",
    },
    // Add more testimonials...
  ];

  const navigate = (newDirection: number) => {
    setIsAutoPlaying(false);
    setDirection(newDirection);
    setCurrentIndex((prev) =>
      newDirection > 0
        ? prev === testimonials.length - 1
          ? 0
          : prev + 1
        : prev === 0
        ? testimonials.length - 1
        : prev - 1
    );
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      navigate(1);
    }, 5000);

    return () => clearInterval(timer);
  }, [currentIndex, isAutoPlaying]);

  return (
    <div className="h-[800px] max-h-screen bg-black text-white relative overflow-hidden">
      {/* Main Content */}
      <div className="relative h-full">
        <AnimatePresence initial={false} mode="wait">
          <TestimonialSlide
            key={testimonials[currentIndex].id}
            testimonial={testimonials[currentIndex]}
            isActive={true}
            direction={direction}
          />
        </AnimatePresence>

        {/* Navigation */}
        <div className="absolute bottom-8 right-8 z-30 flex items-center gap-4">
          {/* Slide Indicators */}
          <div className="flex gap-2 mr-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center border border-white/20 transition-colors hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(1)}
            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center border border-white/20 transition-colors hover:bg-white/20"
          >
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default PremiumHero;
