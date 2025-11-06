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
    title: "Intelligent Automation",
    solutions: [
      {
        icon: CheckCircle,
        text: "Auto-publish to LinkedIn, Twitter, Facebook, Instagram",
        time: "One-click distribution",
      },
      {
        icon: CheckCircle,
        text: "Analyzes audience behavior for optimal timing",
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
    <section className="py-8 sm:py-12 bg-slate-100/80 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-gray-900 px-2"
          >
            From 8 hours a week to
            <span className="block text-blue-600">20 minutes of smart automation</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4"
          >
            Stop manually posting across platforms. Automatically publish at optimal times, manage approvals, and organize everything—while you focus on growth.
          </motion.p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex justify-center mb-6 sm:mb-8 px-4">
          <motion.div
            className="bg-white rounded-xl p-1 border border-gray-200 shadow-sm w-full max-w-md"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              onClick={() => setActiveTab("before")}
              className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 w-1/2 ${
                activeTab === "before"
                  ? "bg-gray-50 text-gray-700 border border-gray-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Manual Chaos
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("after")}
              className={`px-4 sm:px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-300 w-1/2 ${
                activeTab === "after"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
Intelligent Automation
            </motion.button>
          </motion.div>
        </div>

        {/* Comparison Content */}
        <div className="relative min-h-[500px] rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200">
          {/* Background Image */}
          <div className="absolute inset-0 overflow-hidden rounded-xl z-0">
            <img
              src="/landing-files/scheduling-posting.webp"
              alt="AI-powered scheduling and posting automation dashboard"
              className="w-full h-full object-cover opacity-20"
              loading="lazy"
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{
                opacity: 0,
                x: activeTab === "before" ? -50 : 50,
                scale: 0.95,
              }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{
                opacity: 0,
                x: activeTab === "before" ? 50 : -50,
                scale: 0.95,
              }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                duration: 0.5,
              }}
              className="relative z-10 p-6"
            >
              {activeTab === "before" ? (
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                  {/* Left Side - Problems */}
                  <div className="order-2 lg:order-1">
                    <motion.h3
                      className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {beforeScenario.title}
                    </motion.h3>
                    <motion.div
                      className="space-y-3 sm:space-y-4"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1,
                            delayChildren: 0.2,
                          },
                        },
                      }}
                    >
                      {beforeScenario.problems.map((problem, index) => (
                        <motion.div
                          key={index}
                          variants={{
                            hidden: { opacity: 0, x: -40, scale: 0.9 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              scale: 1,
                              transition: {
                                type: "spring",
                                stiffness: 150,
                                damping: 15,
                              },
                            },
                          }}
                          whileHover={{
                            scale: 1.02,
                            x: 5,
                            transition: { type: "spring", stiffness: 400 },
                          }}
                          className="flex items-start gap-3 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <problem.icon className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="text-gray-900 font-medium text-sm">
                              {problem.text}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              {problem.time}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Right Side - Stats */}
                  <motion.div
                    className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm order-1 lg:order-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <h4 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                      Current Metrics
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-gray-600 mb-1">
                          {beforeScenario.stats.organized}
                        </div>
                        <div className="text-xs text-gray-600">
                          Properly Organized
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-gray-600 mb-1">
                          {beforeScenario.stats.efficiency}
                        </div>
                        <div className="text-xs text-gray-600">
                          Workflow Efficiency
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-gray-600 mb-1">
                          {beforeScenario.stats.time}
                        </div>
                        <div className="text-xs text-gray-600">
                          Daily Management
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-gray-600 mb-1">
                          {beforeScenario.stats.usage}
                        </div>
                        <div className="text-xs text-gray-600">
                          Testimonials Used
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
                  {/* Left Side - Solutions */}
                  <div className="order-2 lg:order-1">
                    <motion.h3
                      className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6"
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {afterScenario.title}
                    </motion.h3>
                    <motion.div
                      className="space-y-3 sm:space-y-4"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.1,
                            delayChildren: 0.2,
                          },
                        },
                      }}
                    >
                      {afterScenario.solutions.map((solution, index) => (
                        <motion.div
                          key={index}
                          variants={{
                            hidden: { opacity: 0, x: -40, scale: 0.9 },
                            visible: {
                              opacity: 1,
                              x: 0,
                              scale: 1,
                              transition: {
                                type: "spring",
                                stiffness: 150,
                                damping: 15,
                              },
                            },
                          }}
                          whileHover={{
                            scale: 1.02,
                            x: 5,
                            transition: { type: "spring", stiffness: 400 },
                          }}
                          className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg"
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
                    </motion.div>
                  </div>

                  {/* Right Side - Stats */}
                  <motion.div
                    className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm order-1 lg:order-2"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <h4 className="text-base font-semibold text-gray-900 mb-3 sm:mb-4">
                      Smart Results
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.organized}
                        </div>
                        <div className="text-xs text-gray-600">
                          Properly Organized
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.efficiency}
                        </div>
                        <div className="text-xs text-gray-600">
                          Workflow Efficiency
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.time}
                        </div>
                        <div className="text-xs text-gray-600">
                          Daily Management
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                          {afterScenario.stats.usage}
                        </div>
                        <div className="text-xs text-gray-600">
                          Testimonials Used
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
          className="text-center mt-8 sm:mt-12"
        >
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 sm:p-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
              Reclaim 8 hours per week starting today
            </h3>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto text-sm px-2">
              Let automation handle the tedious work while you focus on what matters. Smart systems that actually deliver results.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                onClick={() => navigate("/studio")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-lg w-full sm:w-auto"
              >
                Start Saving Time Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                Setup in 5 minutes • No credit card
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default RevolutionizeCollection;
