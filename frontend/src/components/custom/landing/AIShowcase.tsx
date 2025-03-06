import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Zap,
  Activity,
  Video,
  MessageSquare,
  Image,
  VolumeX,
  Share2,
  ArrowRight,
  Sparkles,
  Divide,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AIFeature = {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  color: string;
  stats: {
    label: string;
    value: string;
  }[];
  visual: JSX.Element;
};

const AIFeatureShowcase = () => {
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Keep your existing aiFeatures array
  const aiFeatures: AIFeature[] = getAIFeatures();

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isModalOpen) {
        setActiveFeature((prev) => (prev + 1) % aiFeatures.length);
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [aiFeatures.length, isModalOpen]);

  const nextFeature = () => {
    setActiveFeature((prev) => (prev + 1) % aiFeatures.length);
  };

  const prevFeature = () => {
    setActiveFeature(
      (prev) => (prev - 1 + aiFeatures.length) % aiFeatures.length
    );
  };

  const openFeatureDetail = (index: number) => {
    setActiveFeature(index);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "auto";
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalOpen]);

  const currentFeature = aiFeatures[activeFeature];

  // Generate aurora gradient effect positions
  const generateAuroraPoints = () => {
    const points = [];
    for (let i = 0; i < 5; i++) {
      points.push({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 30 + 20}rem`,
        color: i % 2 === 0 ? "bg-blue-500" : "bg-purple-500",
        opacity: Math.random() * 0.07 + 0.03,
      });
    }
    return points;
  };

  const auroraPoints = generateAuroraPoints();

  //https://res.cloudinary.com/di6d28r5r/image/upload/v1740990576/assets/iStock-1357573240.jpg
  return (
    <section
      className={`py-16 relative overflow-hidden ${
        isDarkMode ? "bg-black" : "bg-white"
      }`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('/media/img/meeting.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Premium background effects */}
      {/* <div
        className={`absolute inset-0 ${
          isDarkMode
            ? "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900 via-black to-black"
            : "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-50 via-white to-white"
        }`}
      ></div> */}

      {isDarkMode && (
        <>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-8"></div>
          {/* Aurora effect */}
          {auroraPoints.map((point, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${point.color} blur-3xl`}
              style={{
                top: point.top,
                left: point.left,
                width: point.size,
                height: point.size,
                opacity: point.opacity,
                transform: "translate(-50%, -50%)",
              }}
            ></div>
          ))}
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-3/4 left-2/3 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </>
      )}

      {/* Theme toggle button */}
      {/* <div className="absolute top-8 right-8 z-10">
        <motion.button
          onClick={toggleTheme}
          className={`p-3 rounded-full ${
            isDarkMode
              ? "bg-white/10 hover:bg-white/20"
              : "bg-black/10 hover:bg-black/20"
          } backdrop-blur-lg border ${
            isDarkMode ? "border-white/10" : "border-black/10"
          } transition-colors duration-200`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isDarkMode ? (
            <Star
              className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
            />
          ) : (
            <Star
              className={`w-5 h-5 ${isDarkMode ? "text-white" : "text-black"}`}
            />
          )}
        </motion.button>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative">
          {/* Floating gradient line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-0 h-px w-3/4 "></div>

          <div className="text-center mb-20 relative">
            {/* Small decorative elements */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${
                  isDarkMode ? "bg-white/5" : "bg-black/5"
                } backdrop-blur-md border ${
                  isDarkMode ? "border-white/10" : "border-black/10"
                }`}
              >
                <Sparkles
                  className={`w-4 h-4 ${
                    isDarkMode ? "text-blue-400" : "text-blue-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Powered by Cutting-edge AI
                </span>
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={cn(
                "text-4xl md:text-5xl font-bold text-white uppercase"
                // isDarkMode
                //   ? "bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent"
                //   : "bg-gradient-to-r from-gray-900 via-blue-800 to-blue-900 bg-clip-text text-transparent"
              )}
            >
              AI-Powered Testimonial Management
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-2 flex justify-center"
            >
              <div className="h-1 w-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={cn(
                "mt-6 max-w-2xl mx-auto font-light text-lg",
                "text-gray-50"
                // isDarkMode ? "text-gray-300" : "text-gray-600"
              )}
            >
              Harness the power of artificial intelligence to transform how you
              collect, manage, and showcase customer testimonials for maximum
              impact.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 flex justify-center space-x-4"
            >
              <CTA />
            </motion.div>
          </div>

          <div ref={containerRef} className="relative">
            <div
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch relative ${
                isExpanded ? "lg:grid-rows-[auto_1fr]" : ""
              }`}
            >
              <div
                className={`absolute -top-10 -left-10 w-20 h-20 rounded-full ${
                  isDarkMode
                    ? "bg-gradient-to-br from-blue-500/20 to-indigo-600/20"
                    : "bg-gradient-to-br from-blue-500/10 to-indigo-600/10"
                } blur-xl z-0`}
              ></div>

              {/* Feature navigation */}
              <FeatureNavigation
                activeFeature={activeFeature}
                aiFeatures={aiFeatures}
                isDarkMode={isDarkMode}
                isExpanded={isExpanded}
                setActiveFeature={setActiveFeature}
              />

              {/* Feature visualization */}
              <FeatureVisualization
                activeFeature={activeFeature}
                aiFeatures={aiFeatures}
                currentFeature={currentFeature}
                isDarkMode={isDarkMode}
                isExpanded={isExpanded}
                nextFeature={nextFeature}
                openFeatureDetail={openFeatureDetail}
                prevFeature={prevFeature}
                toggleExpand={toggleExpand}
              />
            </div>
          </div>

          {/* Feature detail modal */}
          <AnimatePresence>
            {isModalOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                ></motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 max-w-4xl mx-auto z-50 max-h-[90vh] overflow-auto"
                >
                  <div
                    ref={modalRef}
                    className={`relative rounded-2xl ${
                      isDarkMode ? "bg-gray-900" : "bg-white"
                    } border ${
                      isDarkMode ? "border-white/10" : "border-black/10"
                    } overflow-hidden shadow-2xl`}
                  >
                    <button
                      onClick={closeModal}
                      className={`absolute top-4 right-4 p-2 rounded-full ${
                        isDarkMode
                          ? "bg-white/10 hover:bg-white/15"
                          : "bg-black/5 hover:bg-black/10"
                      } z-10`}
                    >
                      <X
                        className={`w-5 h-5 ${
                          isDarkMode ? "text-white" : "text-black"
                        }`}
                      />
                    </button>

                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <div
                            //   bg-gradient-to-r ${currentFeature.color}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-white rounded-full  bg-opacity-20 mb-3`}
                          >
                            <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                            <span className="text-xs font-medium text-white">
                              Feature Spotlight
                            </span>
                          </div>
                          {/* bg-gradient-to-r ${currentFeature.color} */}
                          <h3
                            className={`text-3xl font-bold text-white  bg-clip-text text-transparent mb-4`}
                          >
                            {currentFeature.title}
                          </h3>

                          <p
                            className={`${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            } text-lg mb-6`}
                          >
                            {currentFeature.description}
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-6">
                            {currentFeature.stats.map((stat) => (
                              <div
                                key={stat.label}
                                className={`${
                                  isDarkMode ? "bg-white/5" : "bg-black/5"
                                } backdrop-blur-xl rounded-xl p-4 border ${
                                  isDarkMode
                                    ? "border-white/10"
                                    : "border-black/10"
                                }`}
                              >
                                <p
                                  className={`text-sm ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  } mb-1`}
                                >
                                  {stat.label}
                                </p>
                                <p
                                  className={`text-2xl font-bold bg-gradient-to-r ${currentFeature.color} bg-clip-text text-transparent`}
                                >
                                  {stat.value}
                                </p>
                              </div>
                            ))}
                          </div>

                          <button
                            className={`w-full py-3 rounded-xl bg-gradient-to-r ${currentFeature.color} text-white font-medium`}
                          >
                            Try {currentFeature.title} Now
                          </button>
                        </div>

                        <div className="h-64 md:h-auto">
                          <div className="h-full rounded-xl overflow-hidden">
                            {currentFeature.visual}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default AIFeatureShowcase;

type FeaturesList = {
  aiFeatures: AIFeature[];
  activeFeature: number;
  setActiveFeature: (index: number) => void;
  isExpanded: boolean;
  isDarkMode: boolean;
};

function FeatureList({
  aiFeatures,
  activeFeature,
  setActiveFeature,
  isExpanded,
  isDarkMode,
}: FeaturesList) {
  // Create a ref to store all card elements
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    // Check if the active card ref exists and scroll it into view
    if (cardsRef.current[activeFeature]) {
      cardsRef.current[activeFeature].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [activeFeature]);

  return (
    <div
      className={cn(
        "space-y-4 relative z-10",
        isExpanded &&
          " overflow-auto space-y-0 flex justify-start items-center gap-4",
        "max-h-96 overflow-auto"
      )}
    >
      {aiFeatures.map((feature, index) => (
        <motion.button
          key={feature.id}
          ref={(el) => (cardsRef.current[index] = el)}
          onClick={() => setActiveFeature(index)}
          className={cn(
            "w-full text-left p-4 rounded-2xl flex items-start transition-all duration-300 group ",
            // bg-gradient-to-r ${feature.color}
            index === activeFeature
              ? `bg-gray-800 border border-gray-50/20 shadow-lg shadow-${
                  feature.color.split(" ")[1]
                }/25`
              : `${
                  isDarkMode
                    ? "bg-white/5 hover:bg-white/10 "
                    : "bg-black/5 hover:bg-black/10"
                } border ${isDarkMode ? "border-white/5" : "border-black/5"}`,
            isExpanded ? "min-w-56 h-32 flex flex-col gap-5" : " ",
            isExpanded && index === activeFeature && "h-48 min-w-96"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div
            className={cn(
              index === activeFeature &&
                isExpanded &&
                "flex justify-between items-center w-full"
            )}
          >
            <div
              className={cn(
                // bg-gradient-to-r ${feature.color}
                "rounded-xl p-3 mr-4",
                index === activeFeature
                  ? "bg-white/20"
                  : `bg-gray-300 bg-opacity-20 ${
                      isDarkMode ? "bg-opacity-10" : "bg-opacity-20"
                    }`
              )}
            >
              {feature.icon}
            </div>
            {index === activeFeature && isExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`ml-2 flex items-center justify-center h-8 w-8 rounded-full bg-white/20`}
              >
                <ArrowRight className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </div>
          <div className="flex-1">
            <h4
              className={cn(
                "font-semibold",
                index === activeFeature
                  ? "text-white"
                  : isDarkMode
                  ? "text-white"
                  : "text-gray-800"
              )}
            >
              {feature.title}
            </h4>
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{
                opacity: index === activeFeature ? 1 : 0,
                height: index === activeFeature ? "auto" : 0,
              }}
              className={`text-sm ${
                index === activeFeature
                  ? "text-white/90 mt-2"
                  : "text-transparent"
              }`}
            >
              {feature.description}
            </motion.p>
          </div>
          {index === activeFeature && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`ml-2 flex items-center justify-center h-6 w-6 rounded-full bg-white/20`}
            >
              <ArrowRight className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

function FeatureNavigation({
  aiFeatures,
  activeFeature,
  setActiveFeature,
  isExpanded,
  isDarkMode,
}: FeaturesList) {
  return (
    <div
      className={`  ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 to-slate-800 shadow-[0_0_100px_rgba(59,130,246,0.15)] border border-white/10"
          : "bg-black/5"
      } backdrop-blur-xl rounded-3xl p-8 border ${
        isDarkMode ? "border-white/10" : "border-black/10"
      } relative overflow-hidden  ${
        isExpanded ? "lg:col-span-12" : "lg:row-span-2 lg:col-span-4"
      }`}
    >
      {/* Glass effect reflections */}
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-white/5 to-transparent"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-br from-white/5 to-transparent"></div>

      <div className="mb-8 relative">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
            isDarkMode ? "bg-blue-500/10" : "bg-blue-500/5"
          } mb-3`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              isDarkMode ? "bg-blue-400" : "bg-blue-500"
            } animate-pulse`}
          ></div>
          <span
            className={`text-xs font-medium ${
              isDarkMode ? "text-blue-400" : "text-blue-500"
            }`}
          >
            Intelligent Features
          </span>
        </div>
        <h3
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          } mb-2`}
        >
          AI Capabilities
        </h3>
        <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Discover how our AI transforms testimonial management with these
          powerful tools
        </p>
      </div>

      <FeatureList
        activeFeature={activeFeature}
        aiFeatures={aiFeatures}
        isDarkMode={isDarkMode}
        isExpanded={isExpanded}
        setActiveFeature={setActiveFeature}
      />

      {/* Extra information section */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <div
          className={`flex items-center justify-between ${
            isDarkMode ? "text-gray-400" : "text-gray-500"
          } mb-4`}
        >
          <span className="text-sm font-medium">Performance Overview</span>
          <span
            className={`text-xs px-2 py-1 rounded-md ${
              isDarkMode
                ? "bg-green-500/20 text-green-400"
                : "bg-green-500/10 text-green-600"
            }`}
          >
            97% Accurate
          </span>
        </div>
        <div className="space-y-2">
          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full"
              style={{ width: "92%" }}
            ></div>
          </div>
          <div className="flex justify-between text-xs">
            <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>
              Response Time
            </span>
            <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
              {"<"} 1.2s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureVisualization({
  aiFeatures,
  activeFeature,
  isDarkMode,
  isExpanded,
  toggleExpand,
  currentFeature,
  openFeatureDetail,
  prevFeature,
  nextFeature,
}: {
  aiFeatures: AIFeature[];
  activeFeature: number;
  isDarkMode: boolean;
  isExpanded: boolean;
  toggleExpand: () => void;
  currentFeature: AIFeature;
  openFeatureDetail: (index: number) => void;
  prevFeature: () => void;
  nextFeature: () => void;
}) {
  return (
    <div
      className={` ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 to-slate-800 shadow-[0_0_100px_rgba(59,130,246,0.15)] border border-white/10"
          : "bg-black/5"
      } backdrop-blur-xl rounded-3xl border ${
        isDarkMode ? "border-white/10" : "border-black/10"
      } p-8 overflow-hidden relative ${
        isExpanded ? "lg:row-start-1 lg:col-span-12" : "lg:col-span-8"
      }`}
    >
      {/* Glass reflections */}
      <div className="absolute top-0 right-0 w-1/2 h-px bg-gradient-to-r from-transparent to-white/20"></div>
      <div className="absolute top-0 right-0 h-1/2 w-px bg-gradient-to-b from-white/20 to-transparent"></div>

      {/* Expand/collapse toggle */}
      <button
        onClick={toggleExpand}
        className={`absolute top-4 right-4 p-2 rounded-lg ${
          isDarkMode
            ? "bg-white/10 hover:bg-white/15"
            : "bg-black/5 hover:bg-black/10"
        } backdrop-blur-lg z-20`}
      >
        {isExpanded ? (
          <Divide
            className={`w-4 h-4 ${isDarkMode ? "text-white" : "text-black"}`}
          />
        ) : (
          <Plus
            className={`w-4 h-4 ${isDarkMode ? "text-white" : "text-black"}`}
          />
        )}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full relative z-10">
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  isDarkMode ? "bg-white/10" : "bg-black/5"
                } mb-3`}
              >
                <div
                  className={`h-2 w-2 rounded-full bg-gradient-to-r ${currentFeature.color} animate-pulse`}
                ></div>
                {/* bg-gradient-to-r ${currentFeature.color}  */}
                <span
                  className={`text-xs font-medium text-white bg-clip-text text-transparent`}
                >
                  Feature {activeFeature + 1}/{aiFeatures.length}
                </span>
              </div>

              <h3
                className={`text-3xl font-bold text-white bg-clip-text text-transparent mb-3`}
              >
                {currentFeature.title}
              </h3>
              <p
                className={`${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                } text-lg`}
              >
                {currentFeature.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex-1 grid grid-cols-2 gap-4">
            {currentFeature.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2 + index * 0.1,
                }}
                className={`${
                  isDarkMode ? "bg-white/5" : "bg-black/5"
                } backdrop-blur-xl rounded-2xl p-5 border ${
                  isDarkMode ? "border-white/10" : "border-black/10"
                } relative overflow-hidden`}
              >
                {/* Subtle accent */}
                {/* bg-gradient-to-b ${currentFeature.color} */}
                <div
                  className={`absolute top-0 left-0 h-full w-1 text-white opacity-50 rounded-l-2xl`}
                ></div>

                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  } mb-1`}
                >
                  {stat.label}
                </p>
                {/* bg-gradient-to-r ${currentFeature.color} */}
                <p className={`text-2xl font-bold  bg-clip-text text-white`}>
                  {stat.value}
                </p>

                {/* View detail button */}
                <button
                  onClick={() => openFeatureDetail(activeFeature)}
                  className={`absolute bottom-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    isDarkMode
                      ? "bg-white/10 hover:bg-white/15"
                      : "bg-black/5 hover:bg-black/10"
                  }`}
                >
                  <ArrowRight
                    className={`w-3 h-3 ${
                      isDarkMode ? "text-white/70" : "text-black/70"
                    }`}
                  />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Additional action button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={() => openFeatureDetail(activeFeature)}
            className={`mt-6 py-3 px-6 rounded-xl bg-gradient-to-r ${
              currentFeature.color
            } text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-${
              currentFeature.color.split(" ")[1]
            }/20 transition-all duration-300 hover:shadow-xl hover:shadow-${
              currentFeature.color.split(" ")[1]
            }/30`}
          >
            <span>Learn More About {currentFeature.title}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="relative h-72 md:h-full">
          {/* Floating dots decoration */}
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 blur-sm"></div>
          <div className="absolute top-1/3 -right-1 w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 blur-sm"></div>

          {/* Framed visual display */}
          <div
            className={`absolute inset-0 backdrop-blur-xl rounded-2xl border ${
              isDarkMode ? "border-white/10" : "border-black/10"
            } overflow-hidden`}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="h-full"
              >
                {currentFeature.visual}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation controls */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevFeature}
              className={`p-3 rounded-full ${
                isDarkMode
                  ? "bg-white/10 hover:bg-white/15"
                  : "bg-black/5 hover:bg-black/10"
              } backdrop-blur-lg shadow-lg border ${
                isDarkMode ? "border-white/10" : "border-black/10"
              }`}
            >
              <ChevronLeft
                className={`w-5 h-5 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextFeature}
              className={`p-3 rounded-full ${
                isDarkMode
                  ? "bg-white/10 hover:bg-white/15"
                  : "bg-black/5 hover:bg-black/10"
              } backdrop-blur-lg shadow-lg border ${
                isDarkMode ? "border-white/10" : "border-black/10"
              }`}
            >
              <ChevronRight
                className={`w-5 h-5 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAIFeatures() {
  return [
    {
      id: "sentiment-analysis",
      title: "Sentiment Analysis",
      description:
        "Automatically detect customer emotions and feelings in testimonials to understand brand perception",
      icon: <Activity className="w-8 h-8 text-white" />,
      color: "from-blue-400 to-blue-600",
      stats: [
        { label: "Accuracy", value: "97%" },
        { label: "Processing Time", value: "< 2s" },
      ],
      visual: (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-indigo-900/30 backdrop-blur-sm"></div>
          <div className="absolute left-4 top-4 right-4 bottom-4">
            <div className="h-full flex flex-col space-y-3">
              <div className="h-2/3 bg-white/10 rounded-lg p-3 backdrop-blur-md">
                <div className="flex items-center mb-3">
                  <div className="h-4 w-4 rounded-full bg-green-400 mr-2"></div>
                  <div className="h-2 w-24 bg-white/40 rounded-full"></div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-1/3 bg-white/30 rounded-full"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-1/2 bg-white/30 rounded-full"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-2/5 bg-white/30 rounded-full"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-2 w-3/5 bg-white/30 rounded-full"></div>
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg backdrop-blur-md flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">85%</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg backdrop-blur-md p-2">
                  <div className="h-full bg-gradient-to-t from-green-400/40 to-transparent rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "video-intelligence",
      title: "Video Intelligence",
      description:
        "Extract insights from video testimonials including facial expressions, tone of voice, and key talking points",
      icon: <Video className="w-8 h-8 text-white" />,
      color: "from-purple-400/80 to-purple-600/80",
      stats: [
        { label: "Expression Detection", value: "99%" },
        { label: "Talking Points", value: "Auto-generated" },
      ],
      visual: (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/30 backdrop-blur-sm"></div>
          <div className="absolute left-4 top-4 right-4 bottom-4">
            <div className="h-full flex flex-col space-y-3">
              <div className="h-1/2 bg-white/10 rounded-lg p-2 backdrop-blur-md relative">
                <div className="absolute inset-2 rounded-md bg-gradient-to-br from-purple-500/30 to-pink-600/30 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="h-8 w-8 rounded-full bg-white/60"></div>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-gradient-to-r from-purple-400 to-pink-500"></div>
                </div>
              </div>
              <div className="flex-1 bg-white/10 rounded-lg p-3 backdrop-blur-md">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-purple-400 mr-2"></div>
                    <div className="h-2 w-1/2 bg-white/30 rounded-full"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-pink-400 mr-2"></div>
                    <div className="h-2 w-3/4 bg-white/30 rounded-full"></div>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-purple-400 mr-2"></div>
                    <div className="h-2 w-2/5 bg-white/30 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "testimonial-enhancement",
      title: "Testimonial Enhancement",
      description:
        "AI-powered tools to enhance clarity, grammar, and impact of testimonials while preserving authenticity",
      icon: <MessageSquare className="w-8 h-8 text-white" />,
      color: "from-violet-600/80 via-gray-600 to-indigo-600/80",
      stats: [
        { label: "Readability Improvement", value: "35%" },
        { label: "Authenticity Preserved", value: "100%" },
      ],
      visual: (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-red-900/30 backdrop-blur-sm"></div>
          <div className="absolute left-4 top-4 right-4 bottom-4">
            <div className="h-full flex flex-col space-y-3">
              <div className="h-1/3 bg-white/10 rounded-lg p-3 backdrop-blur-md">
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                  <div className="h-1.5 w-3/4 bg-white/20 rounded-full"></div>
                  <div className="h-1.5 w-5/6 bg-white/20 rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 bg-white/10 rounded-lg backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-1/2 h-px w-full bg-white/10"></div>
                <div className="absolute inset-3 grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                    <div className="h-1.5 w-5/6 bg-white/20 rounded-full"></div>
                    <div className="h-1.5 w-4/5 bg-white/20 rounded-full"></div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-gradient-to-r from-violet-600/80 via-gray-600 to-indigo-600/80 rounded-full"></div>
                    <div className="h-1.5 w-5/6 bg-gradient-to-r from-violet-600/80 via-gray-600 to-indigo-600/80 rounded-full"></div>
                    <div className="h-1.5 w-4/5 bg-gradient-to-r from-violet-600/80 via-gray-600 to-indigo-600/80 rounded-full"></div>
                    <div className="h-1.5 w-full bg-gradient-to-r from-violet-600/80 via-gray-600 to-indigo-600/80 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="h-8 w-16 rounded-lg bg-gradient-to-r from-violet-600/80 via-gray-600 to-indigo-600/80 mx-auto flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "voice-intelligence",
      title: "Voice Intelligence",
      description:
        "Analyze tone, inflection, and emotional patterns in audio testimonials for deeper insight",
      icon: <VolumeX className="w-8 h-8 text-white" />,
      color: "from-cyan-400 to-fushia-400",
      stats: [
        { label: "Emotion Detection", value: "92%" },
        { label: "Transcription Accuracy", value: "99.7%" },
      ],
      visual: (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-teal-900/30 backdrop-blur-sm"></div>
          <div className="absolute left-4 top-4 right-4 bottom-4">
            <div className="h-full flex flex-col space-y-3">
              <div className="h-2/5 bg-white/10 rounded-lg backdrop-blur-md flex items-center justify-center p-3">
                <div className="w-full h-12 flex space-x-1 items-end">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-green-400 to-teal-500"
                      style={{
                        height: `${Math.sin(i / 3) * 40 + 50}%`,
                        opacity: 0.7 + Math.sin(i / 5) * 0.3,
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg backdrop-blur-md p-3">
                  <div className="h-full flex flex-col space-y-1.5">
                    <div className="h-2 w-1/2 bg-white/40 rounded-full"></div>
                    <div className="flex-1 grid grid-cols-2 gap-1.5">
                      <div className="bg-green-400/30 rounded-md flex items-center justify-center">
                        <span className="text-xs font-medium text-white/80">
                          42%
                        </span>
                      </div>
                      <div className="bg-yellow-400/30 rounded-md flex items-center justify-center">
                        <span className="text-xs font-medium text-white/80">
                          38%
                        </span>
                      </div>
                      <div className="bg-red-400/30 rounded-md flex items-center justify-center">
                        <span className="text-xs font-medium text-white/80">
                          12%
                        </span>
                      </div>
                      <div className="bg-blue-400/30 rounded-md flex items-center justify-center">
                        <span className="text-xs font-medium text-white/80">
                          8%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg backdrop-blur-md p-2">
                  <div className="h-full flex flex-col justify-between space-y-1">
                    <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                    <div className="h-1.5 w-full bg-green-400/60 rounded-full"></div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full"></div>
                    <div className="h-1.5 w-full bg-green-400/60 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "image-processing",
      title: "Image Processing",
      description:
        "Analyze and enhance visual testimonials with automatic background removal, color correction, and branding",
      icon: <Image className="w-8 h-8 text-white" />,
      color: "from-cyan-500 to-blue-600",
      stats: [
        { label: "Processing Time", value: "< 3s" },
        { label: "Enhancement Types", value: "10+" },
      ],
      visual: (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-blue-900/30 backdrop-blur-sm"></div>
          <div className="absolute left-4 top-4 right-4 bottom-4">
            <div className="h-full flex flex-col space-y-3">
              <div className="h-2/3 grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-lg backdrop-blur-md overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 border-4 border-dashed border-white/30 rounded-lg"></div>
                </div>
                <div className="bg-white/10 rounded-lg backdrop-blur-md overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/80"></div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/40 to-blue-500/40"></div>
                </div>
              </div>
              <div className="flex-1 bg-white/10 rounded-lg backdrop-blur-md p-3">
                <div className="grid grid-cols-5 gap-1.5 h-full">
                  <div className="col-span-1 bg-gradient-to-b from-cyan-400/30 to-blue-500/30 rounded-md"></div>
                  <div className="col-span-1 bg-gradient-to-b from-cyan-400/50 to-blue-500/50 rounded-md"></div>
                  <div className="col-span-1 bg-gradient-to-b from-cyan-400/70 to-blue-500/70 rounded-md"></div>
                  <div className="col-span-1 bg-gradient-to-b from-cyan-400/90 to-blue-500/90 rounded-md"></div>
                  <div className="col-span-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "smart-distribution",
      title: "Smart Distribution",
      description:
        "Intelligently distribute testimonials across channels with AI-powered targeting and optimization",
      icon: <Share2 className="w-8 h-8 text-white" />,
      color: "from-violet-500 to-indigo-600",
      stats: [
        { label: "Engagement Increase", value: "158%" },
        { label: "Conversion Impact", value: "+24%" },
      ],
      visual: (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-indigo-900/30 backdrop-blur-sm"></div>
          <div className="absolute left-4 top-4 right-4 bottom-4">
            <div className="h-full flex flex-col space-y-3">
              <div className="h-1/2 bg-white/10 rounded-lg backdrop-blur-md relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-20 h-20">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-violet-400 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-violet-600"></div>
                    </div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
                    </div>
                    <div className="absolute top-1/2 right-0 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                    </div>
                    <div className="absolute bottom-0 left-1/4 w-6 h-6 rounded-full bg-purple-400 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                    </div>
                    <div className="absolute bottom-0 right-1/4 w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-indigo-600"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="bg-white/10 rounded-lg backdrop-blur-md p-2">
                  <div className="h-full flex flex-col justify-between">
                    <div className="h-1 w-full bg-gradient-to-r from-violet-400 to-indigo-500"></div>
                    <div className="h-1 w-full bg-gradient-to-r from-violet-400 to-indigo-500"></div>
                    <div className="h-1 w-full bg-gradient-to-r from-violet-400 to-indigo-500"></div>
                  </div>
                </div>
                <div className="col-span-2 bg-white/10 rounded-lg backdrop-blur-md p-2">
                  <div className="h-full w-full bg-gradient-to-br from-violet-400/10 to-indigo-500/10 rounded-md relative">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-400 to-indigo-500"></div>
                    <div className="absolute bottom-0 left-0 w-1 h-full bg-gradient-to-t from-violet-400 to-indigo-500"></div>
                    <div className="absolute inset-2">
                      <div className="h-full w-full flex items-end">
                        <div className="h-1/3 w-1/5 bg-violet-400/40 rounded-sm mx-0.5"></div>
                        <div className="h-2/3 w-1/5 bg-indigo-400/40 rounded-sm mx-0.5"></div>
                        <div className="h-full w-1/5 bg-violet-400/40 rounded-sm mx-0.5"></div>
                        <div className="h-1/2 w-1/5 bg-indigo-400/40 rounded-sm mx-0.5"></div>
                        <div className="h-3/4 w-1/5 bg-violet-400/40 rounded-sm mx-0.5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    // Your other aiFeatures remain here...
    // Just adding one new feature as an example
    {
      id: "predictive-insights",
      title: "Predictive Insights",
      description:
        "Forecast future customer sentiment and identify emerging trends based on testimonial analysis",
      icon: <Sparkles className="w-8 h-8 text-white" />,
      color: "from-amber-400 to-orange-600",
      stats: [
        { label: "Prediction Accuracy", value: "91%" },
        { label: "Trend Detection", value: "T+14 days" },
      ],
      visual: (
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 to-orange-900/30 backdrop-blur-sm"></div>
          <div className="absolute left-4 top-4 right-4 bottom-4">
            <div className="h-full flex flex-col space-y-3">
              <div className="h-2/3 bg-white/10 rounded-lg p-3 backdrop-blur-md">
                <div className="flex items-center mb-3">
                  <div className="h-4 w-4 rounded-full bg-amber-400 mr-2"></div>
                  <div className="h-2 w-24 bg-white/40 rounded-full"></div>
                </div>
                <div className="flex items-end h-2/3 space-x-2">
                  <div className="h-1/3 w-1/6 bg-white/20 rounded-t-md"></div>
                  <div className="h-2/3 w-1/6 bg-white/20 rounded-t-md"></div>
                  <div className="h-1/2 w-1/6 bg-white/20 rounded-t-md"></div>
                  <div className="h-3/4 w-1/6 bg-amber-400/50 rounded-t-md"></div>
                  <div className="h-5/6 w-1/6 bg-amber-400/70 rounded-t-md"></div>
                  <div className="h-full w-1/6 bg-orange-500/90 rounded-t-md"></div>
                </div>
              </div>
              <div className="flex-1 bg-white/10 rounded-lg backdrop-blur-md p-2 flex items-center justify-center">
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="h-px w-full bg-white/30"></div>
                  </div>
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/70 to-orange-500/70"
                      style={{ transform: "rotate(-5deg)" }}
                    ></div>
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded-full bg-orange-500"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];
}

function CTA() {
  return (
    <div className="relative group">
      {/* Dynamic background effect */}
      <motion.div
        className="absolute -inset-3 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-400 rounded-2xl opacity-30 blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      <button className="group relative w-64 h-16 flex items-center justify-between px-6 py-4 font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300">
        {/* Particle effect on hover */}
        <div className="absolute inset-0 w-full h-full">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-0"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * -80],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                repeatDelay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Button content */}
        <span className="relative flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <span className="text-base">Start Your Journey</span>
        </span>
        <span className="relative flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-full">
          <ArrowRight className="w-4 h-4 text-white transform group-hover:translate-x-1 transition-transform" />
        </span>
      </button>
    </div>
  );
}
