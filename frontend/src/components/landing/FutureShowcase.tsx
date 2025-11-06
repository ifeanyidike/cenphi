import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FutureShowcase = () => {
  const navigate = useNavigate();
  const [currentDemo, setCurrentDemo] = useState(0);

  const demos = [
    {
      title: "Content Generation",
      subtitle: "One testimonial → 13+ marketing pieces in 30 seconds",
      description:
        "Watch automatic extraction of key insights and generation of blog posts, social media content, email campaigns, ad copy, and case studies. Each piece optimized for engagement and conversions.",
      icon: Sparkles,
      color: "from-blue-500 to-blue-600",
      screenshot: "/landing-files/content-generation.webp",
      alt: "AI-powered content generation dashboard showing blog posts, social media content, and email campaigns created from testimonials",
      metric: "Save 15+ hours per week",
    },
    {
      title: "Video Processing",
      subtitle: "Upload once → 5 platform-perfect videos in 8 minutes",
      description:
        "Automatically transcribes, removes noise, adds captions, and optimizes for TikTok, Instagram, LinkedIn, YouTube, and Facebook. Professional quality, zero editing required.",
      icon: Play,
      color: "from-gray-500 to-gray-600",
      screenshot: "/landing-files/processing-studio.webp",
      alt: "Video processing studio with AI-powered transcription, editing, and optimization tools",
      metric: "Reach 5x more audience",
    },
    {
      title: "Revenue Analytics",
      subtitle: "Track which testimonials drive actual conversions",
      description:
        "Stop guessing. See exactly which testimonials drive revenue. Track views, engagement, conversion rates, and sentiment trends. Optimize placement for maximum ROI with real data.",
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
      screenshot: "/landing-files/sentiment-dashboard.webp",
      alt: "Analytics dashboard showing conversion rates, revenue impact, and sentiment analysis",
      metric: "+47% avg. conversion lift",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demos.length);
    }, 8000); // Reduced animation speed from 5s to 8s
    return () => clearInterval(interval);
  }, [demos.length]);

  const currentDemoData = demos[currentDemo];

  return (
    <section className="py-8 sm:py-10 bg-gray-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 px-2"
          >
            See your testimonials
            <span className="block text-blue-600">
              multiply into revenue-driving assets
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4"
          >
            Watch real transformations. One testimonial becomes dozens of platform-perfect assets—automatically.
          </motion.p>
        </div>

        {/* Demo Selector */}
        <div className="flex justify-center mb-8 sm:mb-12 px-4">
          <motion.div
            className="flex flex-wrap justify-center bg-gray-50 rounded-lg p-1 border border-gray-200 gap-1 w-full max-w-4xl"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {demos.map((demo, index) => (
              <motion.button
                key={index}
                onClick={() => setCurrentDemo(index)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                  currentDemo === index
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
                whileHover={{
                  scale: 1.05,
                  y: -2,
                  transition: { type: "spring", stiffness: 400 },
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  animate={{
                    rotate: currentDemo === index ? [0, 360] : 0,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut",
                  }}
                >
                  <demo.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </motion.div>
                <span className="font-medium text-xs sm:text-sm hidden sm:inline">
                  {demo.title}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* Live Demo Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDemo}
            initial={{ opacity: 0, x: -50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              duration: 0.6,
            }}
            className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center"
          >
            {/* Left Side - Description */}
            <div className="order-2 lg:order-1">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${currentDemoData.color} rounded-full text-white text-sm font-medium mb-4 sm:mb-6`}
              >
                <currentDemoData.icon className="h-4 w-4" />
                {currentDemoData.title}
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
                {currentDemoData.subtitle}
              </h3>

              <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-4 sm:mb-6">
                {currentDemoData.description}
              </p>

              {/* Metric Badge */}
              <div className="mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                  <span className="text-sm font-semibold text-gray-700">
                    {currentDemoData.metric}
                  </span>
                </div>
              </div>

              <motion.div
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => navigate("/studio")}
                    className={`bg-gradient-to-r ${currentDemoData.color} text-white hover:opacity-90 px-6 py-3 shadow-lg w-full sm:w-auto`}
                  >
                    Try This Feature
                    <motion.div
                      className="inline-block ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </motion.div>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="px-6 py-3 border-2 border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500 transition-colors w-full sm:w-auto"
                  >
                    Watch Full Demo
                  </Button>
                </motion.div>
              </motion.div>
            </div>

            {/* Right Side - Real Screenshot Demo */}
            <motion.div
              className="relative order-1 lg:order-2"
              initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 80,
                damping: 15,
              }}
            >
              {/* Demo Container */}
              <motion.div
                className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                whileHover={{
                  scale: 1.02,
                  y: -10,
                  rotateY: -2,
                  transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Demo Header */}
                <div
                  className={`bg-gradient-to-r ${currentDemoData.color} px-4 sm:px-6 py-3 sm:py-4 text-white`}
                >
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <currentDemoData.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="font-semibold text-sm sm:text-base">
                      See It In Action
                    </span>
                  </motion.div>
                </div>

                {/* Real Screenshot */}
                <motion.div
                  className="relative bg-gray-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <motion.img
                    src={currentDemoData.screenshot}
                    alt={currentDemoData.alt}
                    className="w-full h-auto"
                    loading="lazy"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 sm:mt-16"
        >
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
              Start multiplying your testimonial value today
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-sm sm:text-base px-2">
              Turn one testimonial into dozens of high-performing marketing assets. See results in minutes, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={() => navigate("/studio")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-lg w-full sm:w-auto"
              >
                Start Transforming Now
                <Zap className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Free 14-day trial • No credit card
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FutureShowcase;
