"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Sparkles,
  Brain,
  Share,
  MessageSquare,
  RefreshCw,
  Zap,
  ChevronRight,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import { useInView } from "react-intersection-observer";
import PreloaderAnimation from "./PreloaderAnimation";
import HomeTestimonialCard from "./HomeTestimonialCard";
import { features, testimonials } from "./constants";
import FeatureCarousel from "./FeatureCarousel";

const TestimonialHero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.1 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const { scrollY } = useScroll();

  // Refined parallax effects
  const videoScale = useTransform(scrollY, [0, 500], [1.1, 1.2]);
  const videoOpacity = useTransform(scrollY, [0, 500], [0.7, 0.5]);
  const contentOpacity = useTransform(scrollY, [0, 300], [0.8, 0.7]);

  const categories = [
    { id: "all", label: "All Testimonials", icon: MessageSquare },
    { id: "enterprise", label: "Enterprise", icon: Brain },
    { id: "startup", label: "Startup", icon: Zap },
    { id: "saas", label: "SaaS", icon: RefreshCw },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  useEffect(() => {
    // setIsInView(true);
    const interval = setInterval(() => {
      if (isPlaying) {
        setActiveIndex(
          (prev) =>
            (prev + 1) %
            testimonials.filter(
              (t) =>
                selectedCategory === "all" || t.category === selectedCategory
            ).length
        );
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isPlaying, selectedCategory]);

  const filteredTestimonials = testimonials.filter(
    (t) => selectedCategory === "all" || t.category === selectedCategory
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {!isLoaded && <PreloaderAnimation />}
      </AnimatePresence>
      <section
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="relative bg-black overflow-hidden py-12"
      >
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{ scale: videoScale }}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full"
            style={{ filter: "brightness(0.8)" }}
          >
            <source
              src="https://mortgagehub-bucket.s3.eu-west-1.amazonaws.com/assets/iStock-1190896635.mp4"
              type="video/mp4"
            />
          </video>

          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)",
              opacity: videoOpacity,
            }}
          />
        </motion.div>

        {/* Dynamic background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,0.6))]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at ${
              mousePosition.x * 100
            }% ${
              mousePosition.y * 100
            }%, rgba(59,130,246,0.3), transparent 30%)`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:64px_64px] [transform:perspective(1000px)_rotateX(60deg)] opacity-20" />

        <motion.div
          className="relative max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 z-20"
          style={{ opacity: contentOpacity }}
        >
          {/* Premium header section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 mb-8"
            >
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">
                AI-Powered Testimonial Management
              </span>
            </motion.div>

            <h1 className="text-6xl md:text-7xl font-black text-white mb-8 tracking-tight">
              <span className="bg-gradient-to-r from-white via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Transform Customer Stories
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Into Conversion Engines
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
              Harness the power of AI to collect, curate, and optimize
              testimonials that resonate with your target audience and drive
              unprecedented growth.
            </p>

            {/* Category navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-xl transition-all duration-300 ${
                    selectedCategory === category.id
                      ? "bg-blue-500 text-white"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  <category.icon className="w-5 h-5" />
                  {category.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Enhanced testimonial display */}
          <div className="relative max-w-6xl mx-auto " ref={ref}>
            <AnimatePresence mode="sync">
              {filteredTestimonials.map(
                (testimonial, index) =>
                  index === activeIndex && (
                    <HomeTestimonialCard
                      key={testimonial.id}
                      testimonial={testimonial}
                      inView={inView}
                    />
                  )
              )}
            </AnimatePresence>

            {/* Enhanced navigation controls */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-3">
                {filteredTestimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={`group relative h-2 transition-all duration-300 ${
                      index === activeIndex
                        ? "w-16 bg-blue-500"
                        : "w-2 bg-slate-700"
                    } rounded-full overflow-hidden`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 ${
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-24 text-center"
          >
            <div className="relative inline-block">
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 blur-xl"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.2, 0.3, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
              <button className="group relative inline-flex items-center gap-3 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-500 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Your Journey Now
                </span>
                <ChevronRight className="relative w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Feature highlights */}
            {/* <div className="grid md:grid-cols-3 gap-8 mt-20">
              {[
                {
                  icon: Brain,
                  title: "AI-Powered Enhancement",
                  description:
                    "Automatically optimize testimonials for maximum impact and relevance",
                },
                {
                  icon: RefreshCw,
                  title: "Smart Curation",
                  description:
                    "Intelligently organize and display your most impactful customer stories",
                },
                {
                  icon: Share,
                  title: "Dynamic Distribution",
                  description:
                    "Share testimonials across all channels with perfect formatting",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.2 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                    <feature.icon className="w-12 h-12 text-blue-400 mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div> */}
            <AnimatePresence mode="sync">
              <FeatureCarousel features={features} autoPlayInterval={8000} />
            </AnimatePresence>
          </motion.div>
        </motion.div>

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
          animation: progress 8s linear;
        }
      `}</style>
      </section>
    </>
  );
};

export default TestimonialHero;
