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

  const services = [
    {
      icon: Sparkles,
      name: "AI Content Generation",
      desc: "Transform testimonials into blog posts, social media content, and marketing copy",
      color: "bg-blue-50 text-blue-600 border-blue-100",
      demo: "Blog • Social • Email • Ads",
    },
    {
      icon: Video,
      name: "Video Processing",
      desc: "Collect, transcribe, and enhance video testimonials with AI editing",
      color: "bg-purple-50 text-purple-600 border-purple-100",
      demo: "Record • Transcribe • Edit • Optimize",
    },
    {
      icon: BarChart3,
      name: "Performance Analytics",
      desc: "Track conversion rates, ROI, and revenue impact across channels",
      color: "bg-green-50 text-green-600 border-green-100",
      demo: "Track • Measure • Optimize • Report",
    },
    {
      icon: Zap,
      name: "Smart Automation",
      desc: "Automate testimonial collection with intelligent timing and workflows",
      color: "bg-orange-50 text-orange-600 border-orange-100",
      demo: "Trigger • Collect • Follow-up • Organize",
    },
  ];

  return (
    <section className="pt-24 pb-20 bg-white text-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Content */}
        <div className="text-center mb-16">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold leading-tight mb-4 max-w-4xl mx-auto text-gray-900"
          >
            Transform customer testimonials into
            <span className="block text-blue-600">
              revenue-driving marketing content
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8"
          >
            AI-powered platform that collects, analyzes, and converts
            testimonials into high-converting content across all marketing
            channels.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
          >
            <Button
              onClick={() => navigate("/signup")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-semibold rounded-lg shadow-sm transition-colors duration-200"
            >
              Start free trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/studio")}
              className="px-6 py-2.5 font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Try services
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 text-sm text-gray-500"
          >
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              Free 14-day trial
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
              Setup in 5 minutes
            </span>
          </motion.div>
        </div>

        {/* Services Preview Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white p-5 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => navigate("/studio")}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-50 transition-colors duration-200">
                  <service.icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                </div>
                <h3 className="font-semibold text-sm text-gray-900">
                  {service.name}
                </h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">
                {service.desc}
              </p>
              <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                {service.demo}
              </div>
              <div className="mt-3 flex items-center text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Try now <ChevronRight className="ml-1 h-3 w-3" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Live Demo Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative"
        >
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            {/* Browser Bar */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
              </div>
              <div className="ml-4 text-xs text-gray-600">
                app.cenphi.com/dashboard
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 bg-white">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    Testimonial Dashboard
                  </h3>
                  <p className="text-sm text-gray-600">
                    247 testimonials • 94% positive sentiment
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                    Generate Content
                  </button>
                  <button className="border border-gray-300 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Analytics
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Conversion Rate", value: "+47%" },
                  { label: "Revenue Impact", value: "$2.4M" },
                  { label: "Collection Rate", value: "89%" },
                  { label: "AI Score", value: "98/100" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-100"
                  >
                    <div className="text-xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Recent AI Processing
                </h4>
                <div className="space-y-3">
                  {[
                    {
                      author: "Sarah Chen",
                      company: "TechFlow",
                      type: "Video → Blog",
                      time: "2 min ago",
                      status: "completed",
                    },
                    {
                      author: "Marcus Rodriguez",
                      company: "GrowthLab",
                      type: "Text → Social",
                      time: "5 min ago",
                      status: "processing",
                    },
                    {
                      author: "Emily Watson",
                      company: "ScaleUp",
                      type: "Audio → Email",
                      time: "12 min ago",
                      status: "completed",
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded hover:bg-white transition-colors"
                    >
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {item.author[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {item.author}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.company} • {item.type}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${item.status === "completed" ? "bg-gray-400" : "bg-gray-400"}`}
                        ></div>
                        <div className="text-xs text-gray-500">{item.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Floating AI Indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute -top-3 -right-3 bg-blue-600 rounded-lg shadow-lg p-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-white">AI Active</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HomeLandingHero;
