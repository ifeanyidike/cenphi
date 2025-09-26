import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  ArrowRight,
  BarChart3,
  Users,
  Globe,
  Sparkles,
  Video,
  Palette,
  Building2,
} from "lucide-react";

interface DashboardHandoffProps {
  onGoToDashboard: () => void;
  userName?: string;
  testimonialCount?: number;
  brandContext?: {
    name?: string;
    logo?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
    industry?: string;
  };
}

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "available" | "coming-soon";
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export const DashboardHandoff: React.FC<DashboardHandoffProps> = ({
  onGoToDashboard,
  userName = "there",
  testimonialCount = 1,
  brandContext,
}) => {
  const [showBrandExtraction, setShowBrandExtraction] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);

  const achievements: Achievement[] = [
    {
      id: "account-created",
      title: "Account created",
      description: "Welcome to the platform",
      icon: <CheckCircle className="h-4 w-4" />,
      completed: true,
    },
    {
      id: "first-testimonial",
      title: "First testimonial processed",
      description: "Your content is ready to use",
      icon: <Video className="h-4 w-4" />,
      completed: true,
    },
    {
      id: "brand-extracted",
      title: "Brand context analyzed",
      description: brandContext?.name
        ? `Found: ${brandContext.name}`
        : "Personalizing your experience",
      icon: <Palette className="h-4 w-4" />,
      completed: !!brandContext?.name,
    },
  ];

  const features: Feature[] = [
    {
      id: "dashboard",
      title: "Testimonial Dashboard",
      description: "Manage and organize all your testimonials",
      icon: <BarChart3 className="h-4 w-4" />,
      status: "available",
    },
    {
      id: "ai-studio",
      title: "AI Enhancement Studio",
      description: "Transform testimonials with AI-powered tools",
      icon: <Sparkles className="h-4 w-4" />,
      status: "available",
    },
    {
      id: "brand-guide",
      title: "Brand Guide",
      description: "Customize your testimonial presentation",
      icon: <Palette className="h-4 w-4" />,
      status: "available",
    },
    {
      id: "team",
      title: "Team Collaboration",
      description: "Invite team members and manage permissions",
      icon: <Users className="h-4 w-4" />,
      status: "available",
    },
    {
      id: "publishing",
      title: "Publishing Tools",
      description: "Share testimonials across platforms",
      icon: <Globe className="h-4 w-4" />,
      status: "available",
    },
    {
      id: "analytics",
      title: "Analytics & Insights",
      description: "Track performance and engagement",
      icon: <BarChart3 className="h-4 w-4" />,
      status: "coming-soon",
    },
  ];

  // Show brand extraction notification if context is available
  useEffect(() => {
    if (brandContext?.name) {
      const timer = setTimeout(() => {
        setShowBrandExtraction(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [brandContext]);

  // Animate through features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeatureIndex((prev) => (prev + 1) % features.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-12 pt-12 pb-8 text-center border-b border-gray-100/50">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center mb-6"
            >
              <CheckCircle className="h-10 w-10 text-white" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-2xl font-semibold text-gray-900 tracking-tight mb-3"
            >
              Welcome to your workspace, {userName}!
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-gray-600 font-light max-w-md mx-auto leading-relaxed"
            >
              Your onboarding is complete. You've processed {testimonialCount}{" "}
              testimonial{testimonialCount !== 1 ? "s" : ""} and everything is
              ready to go.
            </motion.p>
          </div>

          {/* Achievements */}
          <div className="px-12 py-8 border-b border-gray-100/50">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              Setup Complete
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    achievement.completed
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        achievement.completed
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {achievement.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {achievement.title}
                      </h3>
                      <p className="text-xs text-gray-600 font-light">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Brand Context Notification */}
          {showBrandExtraction && brandContext?.name && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="px-12 py-6 bg-blue-50/50 border-b border-blue-100/50"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  {brandContext.logo ? (
                    <img
                      src={brandContext.logo}
                      alt="Brand logo"
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Building2 className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Brand context analyzed
                  </h3>
                  <p className="text-xs text-gray-600 font-light">
                    We've analyzed {brandContext.name} and personalized your
                    experience for the {brandContext.industry || "business"}{" "}
                    industry.
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </motion.div>
          )}

          {/* What's Next */}
          <div className="px-12 py-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              What's available in your dashboard
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                  className={`p-4 rounded-2xl border transition-all ${
                    currentFeatureIndex === index
                      ? "border-gray-300 bg-gray-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        feature.status === "available"
                          ? "bg-blue-100 text-blue-600"
                          : feature.status === "completed"
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {feature.title}
                        </h3>
                        {feature.status === "coming-soon" && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-light leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions Preview */}
            <div className="bg-gray-50/80 rounded-2xl p-6 mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Quick actions you can take next:
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Process another testimonial for better insights</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>
                    Customize your brand guide and testimonial appearance
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-700">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Share your processed testimonial on social media</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoToDashboard}
              className="
                w-full bg-gray-900 hover:bg-black text-white font-semibold py-4 px-6
                rounded-2xl transition-all duration-300 flex items-center justify-center
                shadow-lg hover:shadow-xl text-sm tracking-wide
              "
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.button>
          </div>

          {/* Footer */}
          <div className="px-12 py-6 bg-gray-50/50 border-t border-gray-100/50">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600 font-medium">
                  Onboarding completed successfully
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Final Success Message */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-50/80 rounded-full border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-green-700 font-medium">
              Ready to manage your testimonials
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
