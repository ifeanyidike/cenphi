import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Video,
  BarChart3,
  Zap,
  MessageSquare,
  Scissors,
  Film,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ServicesShowcase = () => {
  const [activeService, setActiveService] = useState(0);
  const navigate = useNavigate();

  const services = [
    {
      id: "content-hub",
      title: "Create a Month of Content in 30 Seconds",
      subtitle: "Stop spending days repurposing testimonials",
      description:
        "Upload one testimonial. Get 13+ ready-to-publish pieces: blog posts, social media content, email campaigns, ad copy, case studies, and professional PDFs. Download or publish directly.",
      icon: Sparkles,
      color: "gray",
      screenshot: "/landing-files/content-generation.webp",
      outcome: "Save 15+ hours per week while creating higher-performing content",
      features: [
        "Blog posts and articles",
        "Social media content",
        "Email campaigns & ad copy",
        "PDF exports & documents",
      ],
      cta: "Start Creating Content",
      metric: "5x faster content creation",
    },
    {
      id: "talk-to-data",
      title: "Get Instant Insights from Your Testimonials",
      subtitle: "No more manually analyzing feedback",
      description:
        "Ask questions in plain English. Get instant answers about sentiment trends, top pain points, feature requests, and customer patterns. It's like having a data analyst on demand.",
      icon: MessageSquare,
      color: "gray",
      screenshot: "/landing-files/data-intelligence.webp",
      outcome: "Discover hidden patterns and make data-driven decisions instantly",
      features: [
        "Natural language queries",
        "Instant sentiment analysis",
        "Trend identification",
        "Smart recommendations",
      ],
      cta: "Talk to Your Data",
      metric: "Get insights in seconds",
    },
    {
      id: "clipping",
      title: "Extract 10+ Shareable Clips Automatically",
      subtitle: "Long testimonials need editing for social media",
      description:
        "Automatically finds the emotional peaks and powerful moments. Get 10+ engagement-optimized clips with auto-captions, perfect for Instagram, TikTok, LinkedIn, and ads. Zero editing required.",
      icon: Scissors,
      color: "gray",
      screenshot: "/landing-files/clips-library.webp",
      outcome: "Turn one long video into weeks of social media content",
      features: [
        "Smart highlight detection",
        "Auto-clip generation",
        "Multiple aspect ratios",
        "Caption overlay",
      ],
      cta: "Start Clipping",
      metric: "10+ clips per testimonial",
    },
    {
      id: "story-video",
      title: "Create Emotional Story Videos That Convert",
      subtitle: "Combine testimonials into compelling narratives",
      description:
        "Automatically weaves multiple testimonials into powerful story videos. Selects the best moments, arranges them for emotional impact, and adds professional transitions. Perfect for campaigns.",
      icon: Film,
      color: "gray",
      screenshot: "/landing-files/story-video-config.webp",
      outcome: "Drive 3x higher engagement with narrative-driven content",
      features: [
        "Multi-testimonial stories",
        "Smart sequencing",
        "Professional transitions",
        "Brand customization",
      ],
      cta: "Create Story Videos",
      metric: "3x higher engagement",
    },
    {
      id: "platform-optimization",
      title: "One Upload → 5 Platform-Perfect Videos",
      subtitle: "Need videos for Instagram, TikTok, LinkedIn, YouTube",
      description:
        "Upload once. Get 5 perfectly optimized videos with platform-specific aspect ratios, auto-captions, logo overlays, B-roll, music, and engagement hooks. Each one fine-tuned for where it'll be posted.",
      icon: Share2,
      color: "gray",
      screenshot: "/landing-files/optimization-config.webp",
      outcome: "Save 6 hours per video while reaching 5x more audience",
      features: [
        "Multi-platform formats",
        "Auto captions & B-roll",
        "Music & logo overlays",
        "Platform-optimized encoding",
      ],
      cta: "Optimize for Platforms",
      metric: "Reach 5+ platforms instantly",
    },
    {
      id: "analytics",
      title: "Prove Which Testimonials Drive Revenue",
      subtitle: "Stop guessing which testimonials actually convert",
      description:
        "Track every view, engagement, and conversion back to specific testimonials. See sentiment trends, measure revenue impact, and optimize placement for maximum ROI. Know exactly what's working.",
      icon: BarChart3,
      color: "gray",
      screenshot: "/landing-files/sentiment-dashboard.webp",
      outcome: "Drive 47% more conversions with data-backed optimization",
      features: [
        "Sentiment timeline",
        "Keyword analysis",
        "Period comparison",
        "Custom segments",
      ],
      cta: "See Analytics",
      metric: "+47% average conversion lift",
    },
    {
      id: "video-processing",
      title: "Studio-Quality Video Pipeline",
      subtitle: "Professional video editing without the editors",
      description:
        "Complete video production pipeline: automatically adds B-roll, text overlays, background music, removes noise, adds intro/outro, and enhances quality. Studio-grade output in minutes.",
      icon: Video,
      color: "gray",
      screenshot: "/landing-files/processing-studio.webp",
      outcome: "Create professional marketing videos 10x faster than manual editing",
      features: [
        "B-roll insertion & overlays",
        "Text & caption overlay",
        "Music & noise removal",
        "Intro/outro & enhancement",
      ],
      cta: "Start Creating Videos",
      metric: "10x faster production",
    },
    {
      id: "automation",
      title: "Collect 10x More Testimonials on Autopilot",
      subtitle: "Manually requesting testimonials wastes time and gets ignored",
      description:
        "Set triggers for perfect timing (after purchase, milestone, support win). Automatically requests, follows up, and organizes responses. Never miss a testimonial opportunity again.",
      icon: Zap,
      color: "gray",
      screenshot: "/landing-files/scheduling-posting.webp",
      outcome: "Build a constant stream of fresh social proof automatically",
      features: [
        "Automated requests",
        "Smart timing triggers",
        "Follow-up sequences",
        "Multi-channel collection",
      ],
      cta: "Automate Collection",
      metric: "10x more testimonials collected",
    },
  ];

  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      button: "bg-blue-600 hover:bg-blue-700",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
      button: "bg-purple-600 hover:bg-purple-700",
    },
    gray: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      border: "border-gray-200",
      button: "bg-gray-600 hover:bg-gray-700",
    },
  };

  const currentService = services[activeService];
  const currentColors =
    colorClasses[currentService.color as keyof typeof colorClasses];

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 px-2">
            Eight ways to turn testimonials into
            <span className="block text-blue-600">revenue-driving assets</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Each service delivers measurable results. Use them individually or combine them to maximize your testimonial ROI.
          </p>
        </div>

        {/* Service Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-8 sm:mb-12">
          {services.map((service, index) => {
            const colors =
              colorClasses[service.color as keyof typeof colorClasses];
            const isActive = activeService === index;

            return (
              <motion.button
                key={service.id}
                onClick={() => setActiveService(index)}
                className={`p-3 sm:p-4 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? `${colors.bg} ${colors.border} shadow-lg border-2`
                    : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                }`}
                whileHover={{
                  scale: 1.05,
                  y: -4,
                  transition: { type: "spring", stiffness: 400, damping: 20 },
                }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring" }}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${isActive ? colors.bg : "bg-gray-100"} flex items-center justify-center mb-2 sm:mb-3`}
                >
                  <service.icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${isActive ? colors.text : "text-gray-600"}`}
                  />
                </div>
                <h3
                  className={`font-semibold text-xs sm:text-sm mb-1 ${isActive ? "text-gray-900" : "text-gray-800"}`}
                >
                  {service.title}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed mb-2 hidden sm:block">
                  {service.subtitle}
                </p>
                <div
                  className={`text-xs font-medium ${isActive ? colors.text : "text-gray-500"}`}
                >
                  {service.metric}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Active Service Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeService}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              duration: 0.5,
            }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
          >
            <div className="grid lg:grid-cols-2">
              {/* Content */}
              <div className="p-4 sm:p-6 lg:p-8">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${currentColors.bg} ${currentColors.text} text-xs font-medium mb-4`}
                >
                  <currentService.icon className="h-3 w-3" />
                  {currentService.title}
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                  {currentService.subtitle}
                </h3>

                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {currentService.description}
                </p>

                {/* Outcome */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-blue-600 mt-0.5 font-bold">✓</span>
                    <p className="text-sm text-gray-900 font-medium leading-relaxed">
                      {currentService.outcome}
                    </p>
                  </div>
                </div>

                {/* Metric */}
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg ${currentColors.bg} ${currentColors.text} text-xs font-semibold mb-6`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${currentColors.text.replace("text-", "bg-")}`}
                  ></div>
                  {currentService.metric}
                </div>

                {/* Features */}
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 sm:mb-6"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: 0.2,
                      },
                    },
                  }}
                >
                  {currentService.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      variants={{
                        hidden: { opacity: 0, x: -20, scale: 0.9 },
                        visible: {
                          opacity: 1,
                          x: 0,
                          scale: 1,
                          transition: {
                            type: "spring",
                            stiffness: 200,
                            damping: 20,
                          },
                        },
                      }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        className={`w-1 h-1 rounded-full ${currentColors.text.replace("text-", "bg-")}`}
                        animate={{
                          scale: [1, 1.5, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: index * 0.2,
                        }}
                      ></motion.div>
                      <span className="text-gray-700 text-xs">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  className="flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, type: "spring" }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      className={`${currentColors.button} text-white px-5 py-2 text-sm w-full sm:w-auto`}
                      onClick={() => navigate("/studio")}
                    >
                      {currentService.cta}
                      <motion.div
                        className="inline-block ml-2"
                        animate={{ x: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <ArrowRight className="h-3 w-3" />
                      </motion.div>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="px-5 py-2 text-sm border-gray-300 w-full sm:w-auto"
                    >
                      Learn More
                    </Button>
                  </motion.div>
                </motion.div>
              </div>

              {/* Demo - Real Screenshot */}
              <div className={`${currentColors.bg} p-4 sm:p-6 lg:p-8`}>
                <motion.div
                  className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{
                    delay: 0.3,
                    type: "spring",
                    stiffness: 80,
                    damping: 15,
                  }}
                  whileHover={{
                    scale: 1.02,
                    transition: { type: "spring", stiffness: 300 },
                  }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <motion.img
                    src={currentService.screenshot}
                    alt={`${currentService.title} - Real product screenshot`}
                    className="w-full h-auto"
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <div className="text-center mt-8 sm:mt-12">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Ready to transform your testimonials into revenue?
            </h3>
            <p className="text-gray-600 text-sm mb-6 max-w-xl mx-auto px-2">
              Start with one service or use them all. Every feature is designed to drive measurable business results.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-lg w-full sm:w-auto"
                onClick={() => navigate("/studio")}
              >
                Start Transforming Testimonials
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Free 14-day trial • No credit card required
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServicesShowcase;
