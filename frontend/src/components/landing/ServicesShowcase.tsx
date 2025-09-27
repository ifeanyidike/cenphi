import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Video, BarChart3, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ServicesShowcase = () => {
  const [activeService, setActiveService] = useState(0);
  const navigate = useNavigate();

  const services = [
    {
      id: "ai-content",
      title: "AI Content Generation",
      subtitle: "Transform testimonials into marketing content",
      description:
        "Our AI analyzes your testimonials and automatically generates blog posts, social media content, email campaigns, and landing page copy that converts.",
      icon: Sparkles,
      color: "blue",
      demo: <ContentGenerationDemo />,
      features: [
        "Blog posts and articles",
        "Social media content",
        "Email marketing copy",
        "Landing page content",
      ],
      cta: "Generate Content",
      metric: "5x faster content creation",
    },
    {
      id: "video-processing",
      title: "Video Processing",
      subtitle: "Collect and enhance video testimonials",
      description:
        "Capture powerful video testimonials with our smart collection tools, then enhance them with AI-powered editing, transcription, and optimization.",
      icon: Video,
      color: "purple",
      demo: <VideoProcessingDemo />,
      features: [
        "Smart video collection",
        "Automated transcription",
        "AI-powered editing",
        "Platform optimization",
      ],
      cta: "Process Videos",
      metric: "89% completion rate",
    },
    {
      id: "analytics",
      title: "Performance Analytics",
      subtitle: "Track ROI and conversion impact",
      description:
        "Get deep insights into how your testimonials perform across channels, track conversion rates, and measure the revenue impact of social proof.",
      icon: BarChart3,
      color: "green",
      demo: <AnalyticsDemo />,
      features: [
        "Conversion tracking",
        "Revenue attribution",
        "A/B testing insights",
        "Channel performance",
      ],
      cta: "View Analytics",
      metric: "+47% average conversion lift",
    },
    {
      id: "automation",
      title: "Smart Automation",
      subtitle: "Automate testimonial collection and management",
      description:
        "Set up intelligent workflows that automatically request, collect, and organize testimonials from your customers at the perfect moments.",
      icon: Zap,
      color: "orange",
      demo: <AutomationDemo />,
      features: [
        "Automated requests",
        "Smart timing triggers",
        "Follow-up sequences",
        "Multi-channel collection",
      ],
      cta: "Setup Automation",
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
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      border: "border-green-200",
      button: "bg-green-600 hover:bg-green-700",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200",
      button: "bg-orange-600 hover:bg-orange-700",
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
            Four powerful services that drive results
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Each service works independently or together to maximize the impact
            of your customer testimonials.
          </p>
        </div>

        {/* Service Navigation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-8 sm:mb-12">
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
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
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

                <p className="text-sm text-gray-600 leading-relaxed mb-4 sm:mb-6">
                  {currentService.description}
                </p>

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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 sm:mb-6">
                  {currentService.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div
                        className={`w-1 h-1 rounded-full ${currentColors.text.replace("text-", "bg-")}`}
                      ></div>
                      <span className="text-gray-700 text-xs">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className={`${currentColors.button} text-white px-5 py-2 text-sm w-full sm:w-auto`}
                    onClick={() => navigate("/studio")}
                  >
                    {currentService.cta}
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    className="px-5 py-2 text-sm border-gray-300 w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Demo */}
              <div
                className={`${currentColors.bg} p-4 sm:p-6 lg:p-8 flex items-center justify-center`}
              >
                {currentService.demo}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom CTA */}
        <div className="text-center mt-8 sm:mt-12">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 bg-gray-50">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
              Choose your power tools
            </h3>
            <p className="text-gray-600 text-sm mb-4 sm:mb-6 max-w-xl mx-auto px-2">
              Start with any service and scale as you grow. All services work
              together to maximize your testimonial ROI.
            </p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm font-semibold border-0 rounded-lg w-full sm:w-auto"
              onClick={() => navigate("/studio")}
            >
              Try All Services
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

// Service Demo Components
const ContentGenerationDemo = () => (
  <div className="w-full max-w-md">
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-blue-600 text-white p-4">
        <h4 className="font-semibold">AI Content Generator</h4>
      </div>
      <div className="p-6 space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-xs text-gray-600 mb-1">
            Input: 3 testimonials selected
          </div>
          <div className="text-sm text-gray-800">
            "Amazing results, great support, highly recommend..."
          </div>
        </div>

        <div className="text-center py-2">
          <div className="inline-flex items-center gap-2 text-blue-600">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Generating content...</span>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { type: "Blog Post", status: "✓ Ready", bg: "bg-green-50" },
            { type: "Social Media", status: "✓ Generated", bg: "bg-green-50" },
            { type: "Email Copy", status: "✓ Ready", bg: "bg-green-50" },
            { type: "Ad Copy", status: "⏳ Processing", bg: "bg-yellow-50" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className={`${item.bg} p-3 rounded border flex justify-between items-center`}
            >
              <span className="text-sm font-medium">{item.type}</span>
              <span className="text-xs">{item.status}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const VideoProcessingDemo = () => (
  <div className="w-full max-w-md">
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-purple-600 text-white p-4">
        <h4 className="font-semibold">Video Processing</h4>
      </div>
      <div className="p-6">
        <div className="aspect-video bg-gray-900 rounded-lg mb-4 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Video className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-black bg-opacity-50 text-white text-xs p-2 rounded">
              "This product completely transformed our business..."
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
            ● Processing
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Transcription</span>
            <span className="text-green-600">Complete</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Enhancement</span>
            <span className="text-yellow-600">Processing</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Optimization</span>
            <span className="text-gray-400">Pending</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsDemo = () => (
  <div className="w-full max-w-md">
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-green-600 text-white p-4">
        <h4 className="font-semibold">Performance Analytics</h4>
      </div>
      <div className="p-6">
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

        <div className="space-y-3">
          {[
            { metric: "Video Testimonials", value: 89, color: "bg-blue-500" },
            { metric: "Text Reviews", value: 76, color: "bg-green-500" },
            { metric: "Star Ratings", value: 94, color: "bg-purple-500" },
          ].map((item, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.metric}</span>
                <span className="font-semibold">{item.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className={`${item.color} h-2 rounded-full`}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 1, delay: i * 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AutomationDemo = () => (
  <div className="w-full max-w-md">
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-orange-600 text-white p-4">
        <h4 className="font-semibold">Smart Automation</h4>
      </div>
      <div className="p-6 space-y-3">
        {[
          {
            trigger: "Purchase Complete",
            action: "Send testimonial request",
            status: "Active",
            icon: "🛍️",
          },
          {
            trigger: "7 days post-delivery",
            action: "Follow-up email",
            status: "Scheduled",
            icon: "📧",
          },
          {
            trigger: "High satisfaction score",
            action: "Video request",
            status: "Active",
            icon: "🎥",
          },
          {
            trigger: "Support ticket resolved",
            action: "Feedback collection",
            status: "Active",
            icon: "🎫",
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{item.trigger}</div>
              <div className="text-xs text-gray-600">{item.action}</div>
            </div>
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${
                item.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}
            >
              {item.status}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default ServicesShowcase;
