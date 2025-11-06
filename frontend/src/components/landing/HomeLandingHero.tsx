import {
  ArrowRight,
  Sparkles,
  Video,
  BarChart3,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HomeLandingHero = () => {
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const outcomes = [
    {
      icon: Sparkles,
      name: "Create a Month of Content in 30 Seconds",
      problem: "Marketing teams spend days repurposing testimonials",
      outcome:
        "Get 13+ content pieces instantly: blogs, social posts, emails, ads, PDFs",
      result: "5x faster content creation",
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
    {
      icon: Video,
      name: "Studio-Quality Video Production",
      problem: "Video editing takes hours and requires expensive tools",
      outcome:
        "Auto B-roll, text overlays, music, noise removal, intro/outro in minutes",
      result: "10x faster production",
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
    {
      icon: BarChart3,
      name: "Drive 47% More Conversions",
      problem: "Can't prove which testimonials actually drive revenue",
      outcome:
        "Track every view, engagement, and conversion back to specific testimonials",
      result: "+47% avg. lift",
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
    {
      icon: Zap,
      name: "Extract 10+ Clips Per Video",
      problem: "Long testimonials need manual editing for social media",
      outcome:
        "AI finds emotional peaks and creates engagement-optimized clips automatically",
      result: "Weeks of social content",
      color: "bg-gray-50 text-gray-700 border-gray-200",
    },
  ];

  return (
    <section className="pt-20 sm:pt-28 pb-16 sm:pb-24 bg-white text-gray-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12 sm:mb-20"
        >
          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 max-w-4xl mx-auto text-gray-900 px-2"
          >
            Turn one testimonial into
            <motion.span
              className="block text-blue-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 80 }}
            >
              10+ revenue-driving assets
            </motion.span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8 px-4"
          >
            Stop letting testimonials sit unused. Automatically create
            platform-perfect videos, marketing content, and shareable clips—in
            minutes, not days.
          </motion.p>

          {/* Key Metrics */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-8 sm:mb-10 px-4"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
              <Sparkles className="h-4 w-4" />
              5x faster content
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
              <BarChart3 className="h-4 w-4" />
              +47% conversions
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
              <Video className="h-4 w-4" />
              10+ clips per video
            </span>
          </motion.div>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-10 sm:mb-12 px-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => navigate("/signup")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 sm:py-3 font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto text-sm"
              >
                Start Transforming Testimonials
                <motion.div
                  className="inline-block ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                onClick={() => navigate("/studio")}
                className="px-8 py-3 sm:py-3 font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-lg transition-all duration-200 w-full sm:w-auto text-sm"
              >
                See Live Demo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center gap-5 sm:gap-7 text-xs text-gray-500 px-4"
          >
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              Free 14-day trial
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              No credit card
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>5 min
              setup
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              Cancel anytime
            </span>
          </motion.div>
        </motion.div>

        {/* Outcome Cards Grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.6,
              },
            },
          }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-16 sm:mb-20"
        >
          {outcomes.map((outcome, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.9 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 100,
                    damping: 12,
                  },
                },
              }}
              whileHover={{
                scale: 1.03,
                y: -4,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }}
              whileTap={{ scale: 0.98 }}
              className={`${outcome.color} p-6 rounded-xl border-2 hover:shadow-lg transition-all duration-200 cursor-pointer group`}
              onClick={() => navigate("/studio")}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-white/60 group-hover:bg-white transition-colors duration-200">
                  <outcome.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold bg-white/60 group-hover:bg-white px-2 py-1 rounded-full transition-colors duration-200">
                  {outcome.result}
                </span>
              </div>
              <h3 className="font-bold text-sm text-gray-900 mb-3 leading-tight">
                {outcome.name}
              </h3>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-gray-400 mt-0.5">✗</span>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {outcome.problem}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-blue-600 mt-0.5">✓</span>
                  <p className="text-xs text-gray-700 font-medium leading-relaxed">
                    {outcome.outcome}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Try now <ChevronRight className="ml-1 h-3 w-3" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Live Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 1,
            type: "spring",
            stiffness: 60,
            damping: 20,
          }}
          className="relative"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Browser Bar */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <div className="flex gap-1.5">
                <motion.div
                  className="w-2.5 h-2.5 bg-red-500 rounded-full"
                  whileHover={{ scale: 1.3 }}
                ></motion.div>
                <motion.div
                  className="w-2.5 h-2.5 bg-yellow-500 rounded-full"
                  whileHover={{ scale: 1.3 }}
                ></motion.div>
                <motion.div
                  className="w-2.5 h-2.5 bg-green-500 rounded-full"
                  whileHover={{ scale: 1.3 }}
                ></motion.div>
              </div>
              <div className="ml-4 text-xs text-gray-600 font-medium">
                app.cenphi.io/dashboard
              </div>
            </div>

            {/* Real Dashboard Screenshot */}
            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
            >
              <img
                src="/landing-files/dashboard-home.webp"
                alt="Cenphi Dashboard - AI-powered testimonial management platform"
                className="w-full h-auto"
                loading="eager"
              />
              {/* Subtle overlay for better text visibility if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HomeLandingHero;
