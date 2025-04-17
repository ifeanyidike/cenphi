import React, { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  LayoutGroup,
  MotionConfig,
} from "framer-motion";
import { workspaceHub } from "../../repo/workspace_hub";
import TestimonialViewer from "./TestimonialViewer";
import AnalysisPanel from "./AnalysisPanel";
import Badge from "./UI/Badge";
import ShareDrawer from "./ShareDrawer";
import SmartAnalyticsDashboard from "./SmartAnalyticsDashboard";
import AIRecommendationPanel from "./AIRecommendationPanel";
import {
  getTypeColor,
  itemVariants,
  pageVariants,
  pulseAnimation,
} from "../../utils/mock";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import PremiumWidgetDrawer from "./widgets/PremiumWidgetDrawer";

const TestimonialPage: React.FC = observer(() => {
  const { testimonialManager, uiManager, analysisManager } = workspaceHub;
  const {
    isDarkMode,
    isFullscreen,
    currentView,
    showShareDrawer,
    sidebarMinimized,
  } = uiManager;
  const { testimonial } = testimonialManager;
  const [showWidgetGallery, setShowWidgetGallery] = useState(false);

  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // References for tutorial steps
  const headerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Motion values for parallax effects
  const scrollY = useMotionValue(0);
  const opacity = useTransform(scrollY, [0, 100], [1, 0.8]);
  const scale = useTransform(scrollY, [0, 100], [1, 0.98]);

  // Track scroll position for parallax effects
  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollY]);

  useEffect(() => {
    // In a real app, we'd get the ID from the URL params
    const testimonialId = `testimonial-${uiManager.activeTestimonialType}-1`;
    testimonialManager.fetchTestimonial(testimonialId);
  }, [testimonialManager, uiManager.activeTestimonialType]);

  const toggleWidgetGallery = () => {
    setShowWidgetGallery(!showWidgetGallery);
  };

  // Tutorial steps for new users
  const tutorialSteps = [
    {
      target: headerRef,
      title: "Welcome to Testimonial Studio",
      description:
        "This premium dashboard helps you analyze, enhance, and share your customer testimonials.",
      placement: "bottom",
    },
    {
      target: viewerRef,
      title: "Testimonial Viewer",
      description:
        "View and interact with your testimonials in different formats.",
      placement: "right",
    },
    {
      target: actionsRef,
      title: "Action Tools",
      description:
        "Use these tools to analyze, enhance, convert, and share your testimonials.",
      placement: "left",
    },
  ];

  // Helper for tutorial
  const renderTutorialStep = () => {
    if (!showTutorial || currentStep >= tutorialSteps.length) return null;

    const step = tutorialSteps[currentStep];
    const targetElement = step.target.current;

    if (!targetElement) return null;

    const rect = targetElement.getBoundingClientRect();

    return (
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm pointer-events-none">
        <div
          className="absolute bg-transparent pointer-events-none"
          style={{
            top: rect.top - 10,
            left: rect.left - 10,
            width: rect.width + 20,
            height: rect.height + 20,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
          }}
        >
          <div
            className={`absolute pointer-events-auto bg-white text-slate-800 p-4 rounded-lg shadow-xl w-64 ${
              step.placement === "bottom"
                ? "top-full mt-4 left-1/2 -translate-x-1/2"
                : step.placement === "right"
                  ? "left-full ml-4 top-1/2 -translate-y-1/2"
                  : "right-full mr-4 top-1/2 -translate-y-1/2"
            }`}
          >
            <h3 className="font-bold text-lg mb-2">{step.title}</h3>
            <p className="text-sm text-slate-600 mb-4">{step.description}</p>
            <div className="flex justify-between">
              <button
                className="text-sm font-medium text-slate-600 hover:text-slate-800"
                onClick={() => setShowTutorial(false)}
              >
                Skip
              </button>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium"
                onClick={() => {
                  if (currentStep < tutorialSteps.length - 1) {
                    setCurrentStep(currentStep + 1);
                  } else {
                    setShowTutorial(false);
                  }
                }}
              >
                {currentStep < tutorialSteps.length - 1 ? "Next" : "Finish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MotionConfig transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}>
      <div
        className="min-h-screen relative transition-colors duration-500"
        style={{
          background: isDarkMode
            ? "radial-gradient(circle at 20% 10%, rgba(58, 134, 255, 0.03), transparent 40%), radial-gradient(circle at 80% 90%, rgba(123, 45, 255, 0.05), transparent 30%), linear-gradient(180deg, #0f172a 0%, #0f1c36 100%)"
            : "radial-gradient(circle at 20% 10%, rgba(219, 234, 254, 0.3), transparent 30%), radial-gradient(circle at 80% 90%, rgba(224, 231, 255, 0.4), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
        }}
      >
        {/* Fixed background elements */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Colored gradient orbs */}
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full filter blur-3xl opacity-50 transform -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-400/10 to-pink-500/10 rounded-full filter blur-3xl opacity-50 transform translate-y-1/3 -translate-x-1/4"></div>

          {/* Animated orbs */}
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-blue-400/5 to-indigo-600/5 blur-3xl"
            animate={{
              x: ["0%", "5%", "0%"],
              y: ["0%", "8%", "0%"],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 20,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              top: "20%",
              right: "15%",
            }}
          />

          <motion.div
            className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-purple-400/5 to-pink-600/5 blur-3xl"
            animate={{
              x: ["0%", "-5%", "0%"],
              y: ["0%", "-8%", "0%"],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 25,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1,
            }}
            style={{
              bottom: "10%",
              left: "10%",
            }}
          />
        </div>

        {/* Main Content */}
        <motion.main
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className={`relative container mx-auto py-8 px-2 sm:px-6 lg:px-3 z-10 ${isFullscreen ? "max-w-full" : ""}`}
        >
          <motion.div
            variants={itemVariants}
            style={{ opacity, scale }}
            className="flex justify-between mb-8"
          >
            {/* Type & status indicators */}
            {testimonial && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 flex flex-wrap items-center gap-3"
              >
                <motion.div
                  whileHover="pulse"
                  variants={pulseAnimation}
                  className={`flex items-center gap-3 px-4 py-2 rounded-xl ${
                    isDarkMode
                      ? "bg-slate-800"
                      : "bg-white shadow-sm border border-slate-200"
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                      getTypeColor(testimonial.format).bg
                    }`}
                  ></div>
                  <span
                    className={`font-medium ${isDarkMode ? "text-white" : "text-slate-700"}`}
                  >
                    {testimonial.format.charAt(0).toUpperCase() +
                      testimonial.format.slice(1)}{" "}
                    Testimonial
                  </span>
                  {testimonial.id && (
                    <span
                      className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                    >
                      ID: {testimonial.id.substring(0, 8)}...
                    </span>
                  )}
                </motion.div>

                <motion.div
                  whileHover="pulse"
                  variants={pulseAnimation}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    isDarkMode
                      ? "bg-slate-800"
                      : "bg-white shadow-sm border border-slate-200"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-emerald-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span
                    className={`${isDarkMode ? "text-white" : "text-slate-700"}`}
                  >
                    Active
                  </span>
                </motion.div>

                {testimonial.rating && (
                  <motion.div
                    whileHover="pulse"
                    variants={pulseAnimation}
                    className={`flex items-center gap-1 px-4 py-2 rounded-xl ${
                      isDarkMode
                        ? "bg-slate-800"
                        : "bg-white shadow-sm border border-slate-200"
                    }`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating! ? "text-yellow-400" : isDarkMode ? "text-slate-700" : "text-slate-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span
                      className={`ml-1 font-medium ${isDarkMode ? "text-white" : "text-slate-700"}`}
                    >
                      {testimonial.rating}/5
                    </span>
                  </motion.div>
                )}

                {testimonial.tags && testimonial.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {testimonial.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag}
                        variant={isDarkMode ? "soft" : "outline"}
                        size="sm"
                        shape="pill"
                      >
                        {tag}
                      </Badge>
                    ))}
                    {testimonial.tags.length > 3 && (
                      <Badge variant="dot" size="sm" shape="pill" color="info">
                        +{testimonial.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleWidgetGallery}
                className={`h-11 px-4 rounded-xl flex items-center gap-2 font-medium transition-colors ${
                  isDarkMode
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
                Widgets
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => workspaceHub.uiManager.toggleShareDrawer()}
                className="h-11 px-4 rounded-xl flex items-center gap-2 font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md shadow-blue-500/20"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </motion.button>
            </div>
          </motion.div>

          <LayoutGroup>
            <div className="grid grid-cols-1 lg:grid-cols-11 gap-6">
              {/* Main Content Area */}
              <motion.div
                variants={itemVariants}
                layout
                className={cn(
                  sidebarMinimized ? "lg:col-span-10" : "lg:col-span-8",
                  "space-y-6"
                )}
                ref={viewerRef}
              >
                {/* Testimonial Viewer */}
                <div
                  className={`relative overflow-hidden transition-all duration-500`}
                >
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br opacity-5 ${
                        testimonial
                          ? `${getTypeColor(testimonial.format).bg}`
                          : "from-blue-500 via-purple-500 to-pink-500"
                      }`}
                    ></div>
                  </div>

                  <div className="relative">
                    <TestimonialViewer />
                    <AIRecommendationPanel testimonial={testimonial} />
                    <SmartAnalyticsDashboard testimonial={testimonial} />
                  </div>
                </div>

                <AnimatePresence>
                  {currentView === "analyze" &&
                    analysisManager.activeAnalysis && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      >
                        <AnalysisPanel />
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>

              <div
                className={cn(
                  sidebarMinimized ? "lg:col-span-1" : "lg:col-span-3"
                )}
              >
                <Sidebar actionsRef={actionsRef} />
              </div>
            </div>
          </LayoutGroup>

          {/* Floating quick action button */}
          <motion.div
            className="fixed z-30 bottom-6 right-6"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: "spring" }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg ${
                isDarkMode ? "shadow-indigo-500/30" : "shadow-indigo-500/20"
              }`}
              onClick={() => setShowTutorial(true)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </motion.button>
          </motion.div>
        </motion.main>
      </div>

      {/* Share Drawer */}
      <AnimatePresence>
        {showShareDrawer && (
          <ShareDrawer
            onClose={() => workspaceHub.uiManager.toggleShareDrawer(false)}
            testimonial={testimonial}
          />
        )}
      </AnimatePresence>

      {/* Widget Gallery Drawer */}
      <AnimatePresence>
        {showWidgetGallery && testimonial && (
          <PremiumWidgetDrawer
            testimonial={testimonial}
            onClose={() => setShowWidgetGallery(false)}
          />
          // <WidgetGallery
          //   onClose={() => setShowWidgetGallery(false)}
          //   testimonial={testimonial}
          // />
          // <WidgetShowcase />
          // <WidgetDrawer
          //   testimonial={testimonial}
          //   onClose={() => setShowWidgetGallery(false)}
          // />
        )}
      </AnimatePresence>

      {/* Tutorial overlay */}
      <AnimatePresence>{showTutorial && renderTutorialStep()}</AnimatePresence>
    </MotionConfig>
  );
});

export default TestimonialPage;
