"use client";
import React, { useState, useEffect, useRef } from "react";
import { Star, ArrowRight, Quote, Play, Pause } from "lucide-react";

const UltraPremiumHero = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Premium testimonial data with enhanced content
  const testimonials = [
    {
      text: "Revolutionary approach that transformed our entire digital ecosystem. The impact on our metrics has been nothing short of extraordinary.",
      author: "Alexandra Chen",
      role: "Chief Innovation Officer",
      company: "Nexus Global",
      rating: 5,
      metrics: {
        growth: "+187%",
        satisfaction: "98%",
        roi: "12.4x",
      },
      image: "/assets/images/ai-guy.png",
    },
    {
      text: "Unprecedented results that redefined our expectations. This solution stands leagues apart from anything else in the market.",
      author: "Marcus Torres",
      role: "Director of Operations",
      company: "Elite Ventures",
      rating: 5,
      metrics: {
        growth: "+205%",
        satisfaction: "99%",
        roi: "15.2x",
      },
      image: "/api/placeholder/120/120",
    },
  ];

  // Handle mouse movement for dynamic effects
  const handleMouseMove = (e: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  // Initialize animations and auto-rotation
  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      if (isPlaying) {
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen bg-black overflow-hidden"
    >
      {/* Dynamic background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at ${
            mousePosition.x * 100
          }% ${mousePosition.y * 100}%, rgba(59,130,246,0.3), transparent 25%)`,
        }}
      />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:48px_48px] [transform:perspective(500px)_rotateX(60deg)] opacity-20" />

      {/* Main content container */}
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Premium header section */}
        <div
          className={`text-center transform transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-lg mb-8">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-blue-400 font-medium">
              Trusted by Global Leaders
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-blue-500">
            Excellence Recognized
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-16 leading-relaxed">
            Join visionary companies leveraging our groundbreaking solutions to
            achieve unprecedented growth.
          </p>
        </div>

        {/* Enhanced testimonial display */}
        <div className="relative max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`transition-all duration-1000 absolute w-full ${
                index === activeIndex
                  ? "opacity-100 translate-x-0 rotate-0 scale-100"
                  : "opacity-0 translate-x-full rotate-3 scale-95"
              }`}
              style={{ display: index === activeIndex ? "block" : "none" }}
            >
              {/* Premium testimonial card */}
              <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 md:p-16 shadow-[0_0_50px_rgba(59,130,246,0.1)] border border-white/10">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />

                {/* Content grid */}
                <div className="relative grid md:grid-cols-[1fr_auto] gap-12">
                  <div>
                    {/* Quote and text */}
                    <Quote className="w-16 h-16 text-blue-500/80 mb-8" />
                    <p className="text-3xl md:text-4xl text-white font-light leading-relaxed mb-12">
                      "{testimonial.text}"
                    </p>

                    {/* Author info */}
                    <div className="flex items-center gap-6">
                      <img
                        src={testimonial.image}
                        alt={testimonial.author}
                        className="w-16 h-16 rounded-full ring-2 ring-white/10"
                      />
                      <div>
                        <h3 className="text-xl text-white font-semibold mb-1">
                          {testimonial.author}
                        </h3>
                        <p className="text-slate-400">
                          {testimonial.role} at {testimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics display */}
                  <div className="flex flex-col gap-6">
                    {Object.entries(testimonial.metrics).map(([key, value]) => (
                      <div
                        key={key}
                        className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 text-center"
                      >
                        <div className="text-3xl font-bold text-white mb-2">
                          {value}
                        </div>
                        <div className="text-sm text-slate-400 uppercase tracking-wider">
                          {key}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Navigation and controls */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`group relative h-2 transition-all duration-300 ${
                    index === activeIndex
                      ? "w-12 bg-blue-500"
                      : "w-2 bg-slate-700"
                  } rounded-full overflow-hidden`}
                >
                  <div
                    className={`absolute inset-0 bg-blue-400 ${
                      isPlaying && index === activeIndex
                        ? "animate-progress"
                        : ""
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-slate-400" />
              ) : (
                <Play className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Enhanced CTA section */}
        <div
          className={`mt-20 text-center transform transition-all duration-1000 delay-500 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <button className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-400 rounded-full overflow-hidden hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black">
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative">Schedule a Consultation</span>
            <ArrowRight className="relative w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Add custom styles for animations */}
      <style>{`
        @keyframes progress {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-progress {
          animation: progress 6s linear;
        }
      `}</style>
    </section>
  );
};

export default UltraPremiumHero;
