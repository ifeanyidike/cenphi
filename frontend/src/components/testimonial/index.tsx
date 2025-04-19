import React, { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useParams, useNavigate } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  LayoutGroup,
  MotionConfig,
  useScroll,
  useSpring,
} from "framer-motion";
import { workspaceHub } from "../../repo/workspace_hub";
import TestimonialViewer from "./TestimonialViewer";
import AnalysisPanel from "./AnalysisPanel";
import Badge from "./UI/Badge";
import ShareDrawer from "./ShareDrawer";
import SmartAnalyticsDashboard from "./SmartAnalyticsDashboard";
import AIRecommendationPanel from "./AIRecommendationPanel";
import Sidebar from "./Sidebar";
import { cn } from "@/lib/utils";
import PremiumWidgetDrawer from "./widgets/PremiumWidgetDrawer";

// Premium Error Page with full-screen experience
const PremiumErrorPage: React.FC<{ error: string | null; id?: string }> = ({
  error,
  id,
}) => {
  const navigate = useNavigate();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const x = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), {
    stiffness: 100,
    damping: 30,
  });
  const y = useSpring(useTransform(mouseY, [-300, 300], [-10, 10]), {
    stiffness: 100,
    damping: 30,
  });

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-gray-50" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Subtle ambient light effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[800px] h-[800px] -left-[400px] -top-[400px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at center, #3b82f6 0%, transparent 70%)",
            x,
            y,
          }}
        />
        <motion.div
          className="absolute w-[600px] h-[600px] -right-[300px] -bottom-[300px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle at center, #6366f1 0%, transparent 70%)",
            x: useTransform(mouseX, [-300, 300], [15, -15]),
            y: useTransform(mouseY, [-300, 300], [15, -15]),
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col">
        {/* Navigation bar */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-8 py-6 z-10"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="font-medium">Back to Dashboard</span>
          </button>

          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
            C
          </div>
        </motion.nav>

        {/* Content area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
            className="w-full max-w-4xl mx-auto text-center"
          >
            {/* Error illustration with floating elements */}
            <motion.div
              className="relative w-full aspect-[16/9] mb-12"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Abstract geometric shapes */}
                <motion.div
                  className="absolute w-64 h-64 border-4 border-gray-200 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute w-48 h-48 border-4 border-blue-200 rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute w-32 h-32 border-4 border-indigo-200 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Center icon */}
                <motion.div
                  className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center transform rotate-45"
                  whileHover={{ scale: 1.1, rotate: 135 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <svg
                    className="w-12 h-12 text-white transform -rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            {/* Error message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {error === "Testimonial not found"
                  ? "Testimonial Not Found"
                  : error === "No testimonial ID provided"
                    ? "Invalid Link"
                    : "Something Went Wrong"}
              </h1>

              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {error === "Testimonial not found"
                  ? `We couldn't find a testimonial with ID: ${id}. It may have been removed or the link might be invalid.`
                  : error === "No testimonial ID provided"
                    ? "The URL you've accessed doesn't contain a valid testimonial ID. Please check your link and try again."
                    : "We encountered an issue while loading the testimonial. Our team has been notified and is working on it."}
              </p>

              {/* Action buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row justify-center gap-4 mt-12"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate("/dashboard")}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium text-lg shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                >
                  Return to Dashboard
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.reload()}
                  className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-800 rounded-xl font-medium text-lg hover:border-gray-300 transition-all"
                >
                  Try Again
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Support information */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-16 p-6 bg-gray-50 rounded-2xl border border-gray-200"
            >
              <p className="text-sm text-gray-600">
                Need help? Contact our support team at{" "}
                <a
                  href="mailto:support@cenphi.io"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  support@cenphi.io
                </a>
              </p>
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="py-6 px-8 text-center text-sm text-gray-500"
        >
          <p>© {new Date().getFullYear()} Cenphi. All rights reserved.</p>
        </motion.footer>
      </div>
    </div>
  );
};

// Premium Loading Screen
const PremiumLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center">
      <div className="relative">
        {/* Animated loader */}
        <motion.div
          className="w-20 h-20 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent" />
        </motion.div>

        {/* Loading text */}
        <motion.p
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-gray-600"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Loading testimonial...
        </motion.p>
      </div>
    </div>
  );
};

const TestimonialPage: React.FC = observer(() => {
  const { testimonialManager, uiManager, analysisManager } = workspaceHub;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isFullscreen, currentView, showShareDrawer, sidebarMinimized } =
    uiManager;
  const { testimonial } = testimonialManager;

  const [showWidgetGallery, setShowWidgetGallery] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // References for tutorial steps
  const headerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Scroll animations
  const { scrollY } = useScroll();
  const scrollProgress = useTransform(scrollY, [0, 100], [0, 1]);
  const headerOpacity = useTransform(scrollProgress, [0, 0.5], [1, 0]);
  const headerBlur = useTransform(scrollProgress, [0, 0.5], [0, 10]);

  // Fetch testimonial based on URL ID
  useEffect(() => {
    const fetchTestimonial = async () => {
      if (!id) {
        setError("No testimonial ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await testimonialManager.fetchTestimonial(id);

        if (!testimonialManager.testimonial) {
          setError("Testimonial not found");
        }
      } catch (err) {
        setError("Failed to load testimonial");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonial();
  }, [id, testimonialManager]);

  // Tutorial steps
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
      <div className="fixed inset-0 bg-black/20 z-50 backdrop-blur-sm pointer-events-none">
        <div
          className="absolute bg-transparent pointer-events-none"
          style={{
            top: rect.top - 10,
            left: rect.left - 10,
            width: rect.width + 20,
            height: rect.height + 20,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.3)",
            borderRadius: "12px",
          }}
        >
          <div
            className={`absolute pointer-events-auto bg-white text-slate-800 p-6 rounded-xl shadow-2xl w-72 ${
              step.placement === "bottom"
                ? "top-full mt-4 left-1/2 -translate-x-1/2"
                : step.placement === "right"
                  ? "left-full ml-4 top-1/2 -translate-y-1/2"
                  : "right-full mr-4 top-1/2 -translate-y-1/2"
            }`}
          >
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{step.description}</p>
            <div className="flex justify-between">
              <button
                className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowTutorial(false)}
              >
                Skip
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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

  // Show loading state
  if (loading) {
    return <PremiumLoadingScreen />;
  }

  // Show error state
  if (error || !testimonial) {
    return <PremiumErrorPage error={error} id={id} />;
  }

  // Main content
  return (
    <MotionConfig transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>
      <div className="min-h-screen bg-gray-50">
        {/* Fixed background patterns */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* Header */}
        <motion.header
          className="fixed top-0 left-0 right-0 z-40 border-b border-gray-200"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            backdropFilter: `blur(${headerBlur}px)`,
            opacity: headerOpacity,
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span className="font-medium">Dashboard</span>
              </button>

              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowWidgetGallery(true)}
                  className="h-10 px-4 rounded-lg flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:border-gray-300 transition-all font-medium shadow-sm"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => workspaceHub.uiManager.toggleShareDrawer()}
                  className="h-10 px-6 rounded-lg flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-500/25"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="relative pt-24 pb-16">
          <div
            className={`container mx-auto px-4 sm:px-6 lg:px-8 ${isFullscreen ? "max-w-full" : "max-w-7xl"}`}
          >
            {/* Testimonial meta information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                  {/* <div
                    className={`w-3 h-3 rounded-full bg-gradient-to-r ${getTypeColor(testimonial.format).bg}`}
                  /> */}
                  <span className="font-medium text-gray-900">
                    {testimonial.format.charAt(0).toUpperCase() +
                      testimonial.format.slice(1)}{" "}
                    Testimonial
                  </span>
                  {testimonial.id && (
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {testimonial.id.substring(0, 8)}...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
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
                  <span className="text-gray-900 font-medium">Active</span>
                </div>

                {testimonial.rating && (
                  <div className="flex items-center gap-1 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating! ? "text-yellow-400" : "text-gray-300"}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 font-medium text-gray-900">
                      {testimonial.rating}/5
                    </span>
                  </div>
                )}

                {testimonial.tags && testimonial.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {testimonial.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" size="sm" shape="pill">
                        {tag}
                      </Badge>
                    ))}
                    {testimonial.tags.length > 3 && (
                      <Badge variant="dot" size="sm" shape="pill" color="info">
                        +{testimonial.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            <LayoutGroup>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <motion.div
                  layout
                  className={cn(
                    sidebarMinimized ? "lg:col-span-10" : "lg:col-span-8",
                    "space-y-8"
                  )}
                  ref={viewerRef}
                >
                  {/* Testimonial Viewer */}
                  <motion.div
                    layout
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <TestimonialViewer />
                  </motion.div>

                  {/* AI Recommendations */}
                  <motion.div
                    layout
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <AIRecommendationPanel testimonial={testimonial} />
                  </motion.div>

                  {/* Smart Analytics */}
                  <motion.div
                    layout
                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                  >
                    <SmartAnalyticsDashboard testimonial={testimonial} />
                  </motion.div>

                  <AnimatePresence>
                    {currentView === "analyze" &&
                      analysisManager.activeAnalysis && (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                        >
                          <AnalysisPanel />
                        </motion.div>
                      )}
                  </AnimatePresence>
                </motion.div>

                {/* Sidebar */}
                <motion.div
                  layout
                  className={cn(
                    sidebarMinimized ? "lg:col-span-2" : "lg:col-span-4"
                  )}
                >
                  <div className="sticky top-24">
                    <Sidebar actionsRef={actionsRef} />
                  </div>
                </motion.div>
              </div>
            </LayoutGroup>
          </div>
        </main>

        {/* Floating tutorial button */}
        <motion.button
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg shadow-blue-500/25 hover:bg-blue-700 transition-colors z-30 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowTutorial(true)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </motion.button>
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
        )}
      </AnimatePresence>

      {/* Tutorial overlay */}
      <AnimatePresence>{showTutorial && renderTutorialStep()}</AnimatePresence>
    </MotionConfig>
  );
});

export default TestimonialPage;
