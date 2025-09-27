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
      title: "AI Content Generation",
      subtitle: "Watch testimonials transform into marketing gold",
      description:
        "See how our AI analyzes testimonial sentiment and automatically generates compelling blog posts, social media content, and email campaigns.",
      icon: Sparkles,
      color: "from-blue-500 to-cyan-500",
      preview: {
        input:
          "Amazing product! It increased our sales by 40% in just 2 months. The support team is incredible.",
        outputs: [
          {
            type: "Blog Post",
            content:
              "How [Company] Achieved 40% Sales Growth: A Customer Success Story",
          },
          {
            type: "Social Media",
            content:
              "🚀 40% sales increase in 2 months? Here's how our customer did it...",
          },
          {
            type: "Email Campaign",
            content:
              "Subject: See how [Company] boosted sales 40% with our solution",
          },
        ],
      },
    },
    {
      title: "Smart Video Processing",
      subtitle: "Transform raw videos into professional testimonials",
      description:
        "Our AI automatically transcribes, edits, and optimizes video testimonials for maximum impact across all platforms.",
      icon: Play,
      color: "from-purple-500 to-pink-500",
      preview: {
        input: "Raw customer video testimonial",
        outputs: [
          {
            type: "Transcription",
            content: "Full text with 99.8% accuracy + timestamps",
          },
          {
            type: "Highlights",
            content: "Key moments automatically extracted",
          },
          {
            type: "Platform Optimized",
            content: "LinkedIn, Instagram, TikTok versions created",
          },
        ],
      },
    },
    {
      title: "Performance Analytics",
      subtitle: "See the revenue impact of every testimonial",
      description:
        "Track how testimonials drive conversions, attribute revenue, and optimize placement for maximum ROI.",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
      preview: {
        input: "Testimonial performance data",
        outputs: [
          {
            type: "Conversion Impact",
            content: "+47% increase in page conversion rate",
          },
          {
            type: "Revenue Attribution",
            content: "$2.4M directly attributed revenue",
          },
          {
            type: "Optimization",
            content: "A/B test shows 23% improvement in placement",
          },
        ],
      },
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [demos.length]);

  const currentDemoData = demos[currentDemo];

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-6"
          >
            Experience the future of
            <span className="block text-blue-600">
              testimonial intelligence
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Watch our AI transform your testimonials into powerful marketing
            assets in real-time.
          </motion.p>
        </div>

        {/* Demo Selector */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
            {demos.map((demo, index) => (
              <button
                key={index}
                onClick={() => setCurrentDemo(index)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentDemo === index
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white"
                }`}
              >
                <demo.icon className="h-4 w-4" />
                <span className="font-medium text-sm">{demo.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Demo Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDemo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Side - Description */}
            <div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${currentDemoData.color} rounded-full text-white text-sm font-medium mb-6`}
              >
                <currentDemoData.icon className="h-4 w-4" />
                {currentDemoData.title}
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {currentDemoData.subtitle}
              </h3>

              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {currentDemoData.description}
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={() => navigate("/studio")}
                  className={`bg-gradient-to-r ${currentDemoData.color} text-white hover:opacity-90 px-6 py-3 shadow-lg`}
                >
                  Try This Feature
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="px-6 py-3 border-2 border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500 transition-colors"
                >
                  Watch Full Demo
                </Button>
              </div>
            </div>

            {/* Right Side - Interactive Demo */}
            <div className="relative">
              {/* Demo Container */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Demo Header */}
                <div
                  className={`bg-gradient-to-r ${currentDemoData.color} px-6 py-4 text-white`}
                >
                  <div className="flex items-center gap-2">
                    <currentDemoData.icon className="h-5 w-5" />
                    <span className="font-semibold">Live Demo</span>
                  </div>
                </div>

                {/* Demo Content */}
                <div className="p-6">
                  {/* Input */}
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Input:
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="text-sm text-gray-800">
                        {currentDemoData.preview.input}
                      </div>
                    </div>
                  </div>

                  {/* Processing Animation */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: 0,
                        }}
                        className={`w-2 h-2 bg-gradient-to-r ${currentDemoData.color} rounded-full`}
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: 0.2,
                        }}
                        className={`w-2 h-2 bg-gradient-to-r ${currentDemoData.color} rounded-full`}
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: 0.4,
                        }}
                        className={`w-2 h-2 bg-gradient-to-r ${currentDemoData.color} rounded-full`}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      AI Processing...
                    </span>
                  </div>

                  {/* Outputs */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-3">
                      Generated Results:
                    </div>
                    <div className="space-y-3">
                      {currentDemoData.preview.outputs.map((output, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.2 }}
                          className="bg-green-50 border border-green-200 p-3 rounded-lg"
                        >
                          <div className="text-xs font-semibold text-green-700 mb-1">
                            {output.type}
                          </div>
                          <div className="text-sm text-gray-800">
                            {output.content}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Experience the future today
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join the AI revolution and transform your testimonials into
              revenue-driving marketing machines.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/studio")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-semibold border-0 rounded-lg"
              >
                Start Your AI Journey
                <Zap className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="px-6 py-2.5 font-semibold border-2 border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500 rounded-lg transition-colors"
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FutureShowcase;
