import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Sparkles,
  Brain,
  MessageSquare,
  RefreshCw,
  Zap,
  ArrowRight,
  Calendar,
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
import { testimonials } from "./constants";

const TestimonialHero = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mousePosition] = useState({ x: 0, y: 0 });
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
        className="relative bg-black overflow-hidden py-12 pt-20"
      >
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{ scale: videoScale }}
        >
          {/* <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full"
            style={{ filter: "brightness(0.8)" }}
          >
            <source
              src="https://res.cloudinary.com/di6d28r5r/video/upload/v1740990576/assets/iStock-1190896635.mp4"
              type="video/mp4"
            />
          </video> */}

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-14"
          >
            {/* <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-2 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 mb-4"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 font-medium text-xs">
                AI-Powered Testimonial Management
              </span>
            </motion.div> */}

            <h1 className="text-4xl md:text-6xl font-black text-white mb-10 tracking-tight">
              <span className="bg-gradient-to-r from-white via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Transform Customer Stories
              </span>
              <br />
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Into Conversion Engines
              </span>
            </h1>

            <p className="text-base text-slate-50 max-w-3xl mx-auto mb-10 leading-relaxed">
              Harness the power of AI to collect, curate, and optimize
              testimonials that resonate with your target audience and drive
              unprecedented growth.
            </p>

            {/* Category navigation */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm backdrop-blur-xl transition-all duration-300 ${
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
            <AnimatePresence mode="wait">
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
              <div className="flex gap-2">
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
            className="mt-6 text-center"
          >
            <CTA />

            {/* <FeatureCarousel features={features} autoPlayInterval={8000} /> */}
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

const CTA = () => {
  return (
    <div className="relative flex flex-col md:flex-row gap-8 md:gap-12 justify-center items-center">
      {/* Journey Button - Bold, adventurous with action-oriented design */}
      <div className="relative group">
        {/* Dynamic background effect */}
        <motion.div
          className="absolute -inset-3 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 rounded-2xl opacity-30 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        <button className="group relative w-64 h-16 flex items-center justify-between px-6 py-4 font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
          {/* Particle effect on hover */}
          <div className="absolute inset-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-0"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                  x: [0, Math.random() * 100 - 50],
                  y: [0, Math.random() * -80],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  repeatDelay: Math.random() * 2,
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Button content */}
          <span className="relative flex items-center gap-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-base">Start Your Journey</span>
          </span>
          <span className="relative flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full">
            <ArrowRight className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform" />
          </span>
        </button>
      </div>

      {/* Demo Button - Professional, video-focused with enterprise feel */}
      <div className="relative group">
        {/* Dynamic background effect */}
        <motion.div
          className="absolute -inset-3 bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-400 rounded-2xl opacity-30 blur-xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        <button className="group relative w-64 h-16 flex items-center justify-between px-6 py-4 font-bold text-white bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300">
          {/* Video play pulse effect */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <motion.div
              className="absolute w-16 h-16 rounded-full bg-white bg-opacity-10"
              animate={{
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
          </div>

          {/* Button content */}
          <span className="relative flex items-center gap-3">
            <div className="relative flex items-center justify-center w-6 h-6 bg-white rounded-full">
              <Play className="w-3 h-3 text-purple-600 ml-0.5" />
            </div>
            <span className="text-base">Book a Demo</span>
          </span>
          <span className="relative flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full">
            <Calendar className="w-4 h-4 text-white" />
          </span>
        </button>
      </div>
    </div>
  );
};
