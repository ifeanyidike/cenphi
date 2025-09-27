import React, { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Brain,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Play,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AdvancedFeaturesSection = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      id: 0,
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Advanced machine learning analyzes testimonials for sentiment, intent, and conversion potential in real-time.",
      benefits: [
        "99.7% sentiment accuracy",
        "Real-time processing",
        "Predictive analytics",
        "Custom AI training",
      ],
      visual: (
        <div className="relative w-full h-80 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 p-6">
            <div className="bg-white rounded-xl p-4 shadow-lg mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold">AI Analysis Active</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sentiment Score</span>
                  <span className="font-semibold text-green-600">98.5%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-green-500 h-2 rounded-full"
                    animate={{ width: "98.5%" }}
                    transition={{ duration: 2, delay: 0.5 }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Intent Detection", value: "Purchase Ready" },
                { label: "Emotion", value: "Highly Positive" },
                { label: "Topics", value: "Quality, Support" },
                { label: "Confidence", value: "94%" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1 }}
                  className="bg-white p-3 rounded-lg shadow-sm"
                >
                  <div className="text-xs text-gray-600">{item.label}</div>
                  <div className="font-semibold text-sm">{item.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 1,
      icon: MessageSquare,
      title: "Omnichannel Collection",
      description: "Seamlessly collect testimonials across all touchpoints with automated workflows and smart triggers.",
      benefits: [
        "15+ collection methods",
        "Smart automation",
        "Custom workflows",
        "90% response rate",
      ],
      visual: (
        <div className="relative w-full h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 p-6">
            <div className="space-y-3">
              {[
                { channel: "Email", icon: "📧", status: "Active", count: "1.2K" },
                { channel: "SMS", icon: "💬", status: "Scheduled", count: "847" },
                { channel: "In-App", icon: "📱", status: "Active", count: "2.1K" },
                { channel: "QR Code", icon: "📱", status: "Paused", count: "356" },
              ].map((channel, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{channel.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{channel.channel}</div>
                      <div className="text-xs text-gray-600">{channel.count} collected</div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    channel.status === "Active" ? "bg-green-100 text-green-700" :
                    channel.status === "Scheduled" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {channel.status}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep insights into testimonial performance with predictive analytics and conversion tracking.",
      benefits: [
        "ROI tracking",
        "A/B testing",
        "Predictive modeling",
        "Custom reports",
      ],
      visual: (
        <div className="relative w-full h-80 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 p-6">
            <div className="bg-white rounded-xl p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-sm">Performance Overview</h4>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+47%</div>
                  <div className="text-xs text-gray-600">Conversion Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">$2.4M</div>
                  <div className="text-xs text-gray-600">Revenue Impact</div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { metric: "Video Testimonials", value: 89, color: "bg-blue-500" },
                  { metric: "Text Reviews", value: 76, color: "bg-green-500" },
                  { metric: "Star Ratings", value: 94, color: "bg-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{item.metric}</span>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <motion.div
                        className={`${item.color} h-1 rounded-full`}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1.5, delay: 1 + i * 0.3 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section ref={ref} className="py-24 bg-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
                         radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)`,
      }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-sm font-medium text-gray-700 mb-6">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Powered by Advanced AI
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Features that drive
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              real business results
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Every feature is designed to maximize the impact of your customer testimonials
            and turn them into revenue-generating assets.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Feature Navigation */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: -30 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`group cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 ${
                  activeFeature === index
                    ? "border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg"
                    : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl transition-all duration-300 ${
                    activeFeature === index
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"
                  }`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                      activeFeature === index ? "text-gray-900" : "text-gray-700"
                    }`}>
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-all duration-300 ${
                    activeFeature === index
                      ? "text-blue-500 transform rotate-90"
                      : "text-gray-400 group-hover:text-gray-600"
                  }`} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {features[activeFeature].visual}

                {/* Floating Action Indicator */}
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-gray-900">Live Demo</span>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-20"
        >
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-12 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to see these features in action?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses already using Cenphi to transform their customer testimonials into powerful growth engines.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-200 hover:border-gray-300 font-semibold px-8 py-3 rounded-xl"
              >
                <Play className="h-5 w-5 mr-2" />
                Schedule Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AdvancedFeaturesSection;