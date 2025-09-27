import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RevolutionizeCollection = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("before");

  const beforeScenario = {
    title: "Manual Management Chaos",
    problems: [
      {
        icon: XCircle,
        text: "Testimonials buried in email threads and scattered platforms",
        time: "Lost opportunities daily",
      },
      {
        icon: XCircle,
        text: "Manual posting across 5+ social channels",
        time: "8 hours weekly waste",
      },
      {
        icon: XCircle,
        text: "Random posting times with poor engagement",
        time: "60% reach potential lost",
      },
      {
        icon: XCircle,
        text: "No approval workflows or team coordination",
        time: "Missed deadlines",
      },
    ],
    stats: {
      organized: "23%",
      efficiency: "Low",
      time: "8 hrs/week",
      usage: "12%",
    },
  };

  const afterScenario = {
    title: "AI-Powered Smart Management",
    solutions: [
      {
        icon: CheckCircle,
        text: "Auto-publish to LinkedIn, Twitter, Facebook, Instagram",
        time: "One-click distribution",
      },
      {
        icon: CheckCircle,
        text: "AI analyzes audience behavior for optimal timing",
        time: "3x higher engagement",
      },
      {
        icon: CheckCircle,
        text: "Smart approval workflows with team notifications",
        time: "Never miss deadlines",
      },
      {
        icon: CheckCircle,
        text: "Auto-categorize by sentiment, industry, use case",
        time: "Find perfect testimonials instantly",
      },
    ],
    stats: {
      organized: "98%",
      efficiency: "High",
      time: "20 min/week",
      usage: "89%",
    },
  };

  return (
    <section className="py-12 bg-slate-50 relative">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold mb-4 text-gray-900"
          >
            Revolutionize how you manage testimonials
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Transform from chaotic manual processes to AI-powered automation
            with smart posting, optimal timing suggestions, and intelligent
            workflow management.
          </motion.p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
            <button
              onClick={() => setActiveTab("before")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === "before"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Manual Chaos
            </button>
            <button
              onClick={() => setActiveTab("after")}
              className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 ${
                activeTab === "after"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              AI-Powered Management
            </button>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="relative">
          {/* Background Image */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15">
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&crop=center&auto=format&q=80"
              alt="Professional team collaboration"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              {activeTab === "before" ? (
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  {/* Left Side - Problems */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      {beforeScenario.title}
                    </h3>
                    <div className="space-y-4">
                      {beforeScenario.problems.map((problem, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
                        >
                          <problem.icon className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-gray-900 font-medium text-sm">
                              {problem.text}
                            </div>
                            <div className="text-red-600 text-xs mt-1">
                              {problem.time}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side - Stats */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">
                      Current Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {beforeScenario.stats.organized}
                        </div>
                        <div className="text-xs text-gray-600">
                          Properly Organized
                        </div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {beforeScenario.stats.efficiency}
                        </div>
                        <div className="text-xs text-gray-600">
                          Workflow Efficiency
                        </div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {beforeScenario.stats.time}
                        </div>
                        <div className="text-xs text-gray-600">
                          Daily Management
                        </div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600 mb-1">
                          {beforeScenario.stats.usage}
                        </div>
                        <div className="text-xs text-gray-600">
                          Testimonials Used
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  {/* Left Side - Solutions */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      {afterScenario.title}
                    </h3>
                    <div className="space-y-4">
                      {afterScenario.solutions.map((solution, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <solution.icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-gray-900 font-medium text-sm">
                              {solution.text}
                            </div>
                            <div className="text-blue-600 text-xs mt-1">
                              {solution.time}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Right Side - Stats */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h4 className="text-base font-semibold text-gray-900 mb-4">
                      AI-Powered Results
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.organized}
                        </div>
                        <div className="text-xs text-gray-600">
                          Properly Organized
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.efficiency}
                        </div>
                        <div className="text-xs text-gray-600">
                          Workflow Efficiency
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.time}
                        </div>
                        <div className="text-xs text-gray-600">
                          Daily Management
                        </div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.usage}
                        </div>
                        <div className="text-xs text-gray-600">
                          Testimonials Used
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Transform your management today
            </h3>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto text-sm">
              Join thousands of companies who've revolutionized their
              testimonial management with intelligent AI organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => navigate("/studio")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-medium shadow-sm transition-colors duration-200"
              >
                Start Intelligent Management
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-400 text-gray-700 hover:bg-gray-50 hover:border-gray-500 px-6 py-2.5 text-sm font-medium transition-colors duration-200"
              >
                See Live Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RevolutionizeCollection;
