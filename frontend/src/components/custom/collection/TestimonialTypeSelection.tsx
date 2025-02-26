// Enhanced Data with More Metrics
// const testimonialOptions: TestimonialOption[] = [
//   {
//     id: "video",
//     icon: Camera,
//     label: "Cinematic Story",
//     description:
//       "Transform your experience into a compelling visual narrative that captivates and inspires.",
//     requirements: [
//       "HD Camera (4K supported)",
//       "Good lighting",
//       "Quiet environment",
//     ],
//     estimatedTime: "2-3 minutes",
//     benefits: [
//       "400% higher engagement rate",
//       "Smart AI-powered editing suggestions",
//       "Multi-platform optimization",
//       "Emotional connection amplification",
//     ],
//     popularity: 85,
//     impact: 92,
//     reachMetric: "Global",
//     testimonialCount: 15234,
//     averageRating: 4.8,
//   },
//   {
//     id: "audio",
//     icon: Mic,
//     label: "Sonic Experience",
//     description:
//       "Craft an immersive audio journey with studio-quality sound processing.",
//     requirements: ["Professional audio input", "Quiet space"],
//     estimatedTime: "1-2 minutes",
//     benefits: [
//       "AI noise cancellation",
//       "Voice enhancement technology",
//       "Podcast-ready format",
//       "Background soundtrack options",
//     ],
//     popularity: 75,
//     impact: 84,
//     reachMetric: "Regional",
//     testimonialCount: 12876,
//     averageRating: 4.6,
//   },
//   {
//     id: "text",
//     icon: Type,
//     label: "Written Mastery",
//     description:
//       "Create a perfectly crafted narrative with AI-powered writing assistance.",
//     requirements: [],
//     estimatedTime: "3-5 minutes",
//     benefits: [
//       "AI writing enhancement",
//       "SEO optimization",
//       "Multi-language translation",
//       "Smart formatting suggestions",
//     ],
//     popularity: 90,
//     impact: 88,
//     reachMetric: "Global",
//     testimonialCount: 18543,
//     averageRating: 4.7,
//   },
// ];
import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Mic,
  Type,
  Info,
  Star,
  Shield,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  Play,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { collectionStore } from "@/stores/collectionStore";
import { observer } from "mobx-react-lite";
import { runInAction } from "mobx";
import MediaSelectionModal from "./MediaSelectionModal";
import { useNavigate } from "react-router-dom";

// ---------- Types & Data ----------
export type TestimonialType = "video" | "audio" | "text";
export type TestimonialStatus = "pending" | "selected" | "confirmed";

export interface TestimonialOption {
  id: TestimonialType;
  icon: React.ElementType;
  label: string;
  description: string;
  requirements?: string[];
  estimatedTime: string;
  benefits: string[];
  popularity: number;
  reachMetric: string;
}

const testimonialOptions: TestimonialOption[] = [
  {
    id: "video",
    icon: Camera,
    label: "Video Review",
    description:
      "Capture your genuine experience in a short, engaging video—perfect for visual storytelling.",
    requirements: ["Camera-equipped device", "Good lighting", "Quiet space"],
    estimatedTime: "2-3 mins",
    benefits: [
      "Authentic demo",
      "Visual appeal",
      "Build trust",
      "Showcase features",
    ],
    popularity: 85,
    reachMetric: "High Trust",
  },
  {
    id: "audio",
    icon: Mic,
    label: "Voice Review",
    description:
      "Share your insights in your own voice. Ideal for deep, natural feedback.",
    requirements: ["Microphone", "Quiet space"],
    estimatedTime: "1-2 mins",
    benefits: [
      "Natural feedback",
      "In-depth insights",
      "Effortless sharing",
      "Expressive tone",
    ],
    popularity: 75,
    reachMetric: "Proven Reliability",
  },
  {
    id: "text",
    label: "Written Review",
    icon: Type,
    description:
      "Offer a concise review that highlights key benefits and memorable experiences.",
    requirements: [],
    estimatedTime: "3-5 mins",
    benefits: [
      "Clear insights",
      "Quick read",
      "Impactful tips",
      "Easy to digest",
    ],
    popularity: 90, // For text, we'll use a static label instead.
    reachMetric: "Top Rated",
  },
];

// ---------- Background Particles ----------
const BackgroundParticles: React.FC = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0"
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-500 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0.2,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ filter: "blur(1px)" }}
        />
      ))}
    </motion.div>
  </div>
);

// ---------- Header Section ----------
interface HeaderSectionProps {
  preferredMethod?: TestimonialType;
}
const HeaderSection: React.FC<HeaderSectionProps> = ({ preferredMethod }) => {
  const controls = useAnimation();
  useEffect(() => {
    controls.start({
      scale: [1, 1.02, 1],
      transition: { duration: 5, repeat: Infinity },
    });
  }, [controls]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative text-center mb-20 px-6"
    >
      <motion.div
        animate={controls}
        className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl -skew-y-2"
      />
      <motion.div
        className="relative z-10 py-4"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="mx-auto mb-8 relative"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <Star className="w-12 h-12 text-white" />
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -right-2 -top-2 bg-yellow-400 rounded-full p-2"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black mb-8">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Share Your Story
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-light text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
          Inspire others with your experience. Join a community of delighted
          users.
        </p>
        {preferredMethod && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 max-w-lg mx-auto"
          >
            <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-none shadow-xl">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <AlertTitle className="text-xl font-semibold">
                  Smart Pick
                </AlertTitle>
                <AlertDescription className="text-gray-600">
                  We suggest a{" "}
                  <span className="font-semibold text-blue-600">
                    {preferredMethod}
                  </span>{" "}
                  review.
                </AlertDescription>
              </div>
            </Alert>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ---------- Metrics Bar (Generic) ----------
interface MetricsBarProps {
  option: TestimonialOption;
}
const MetricsBar: React.FC<MetricsBarProps> = () => (
  <div className="flex space-x-4 mb-6">
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Premium Quality</span>
        <Award className="w-4 h-4 text-blue-600" />
      </div>
    </motion.div>
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Verified Reviews</span>
        <Users className="w-4 h-4 text-purple-600" />
      </div>
    </motion.div>
  </div>
);

// ---------- Option Card ----------
interface OptionCardProps {
  option: TestimonialOption;
  status: TestimonialStatus;
  isFocused: boolean;
  onSelect: () => void;
  onFocus: () => void;
}
const OptionCard: React.FC<OptionCardProps> = ({
  option,
  status,
  isFocused,
  onSelect,
  onFocus,
}) => {
  const Icon = option.icon;
  return (
    <motion.div
      whileHover={{ scale: 1.02, rotateY: 5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        className={`relative overflow-hidden transition-all duration-300 ${
          isFocused ? "ring-2 ring-blue-400 ring-offset-4" : ""
        } ${
          status !== "pending"
            ? "bg-gradient-to-br from-gray-50 to-gray-100"
            : ""
        } hover:shadow-2xl transform perspective-1000`}
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600 opacity-50" />
        <button
          onClick={onSelect}
          onFocus={onFocus}
          className="w-full h-full p-4 sm:p-6 lg:p-8 text-left focus:outline-none"
        >
          <div className="absolute top-4 right-4 flex items-center space-x-3">
            {option.id === "video" || option.id === "audio" ? (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium"
              >
                {option.popularity}% Popular
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="px-4 py-1 rounded-full bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium"
              >
                Top Rated
              </motion.div>
            )}
          </div>
          <div className="flex items-center mb-8  mt-6 md:mt-1">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 1 }}
              className={`p-4 rounded-2xl mr-6 ${
                status !== "pending"
                  ? "bg-gradient-to-br from-blue-600 to-purple-600"
                  : "bg-gray-100"
              }`}
            >
              <Icon
                className={`w-8 h-8 ${
                  status !== "pending" ? "text-white" : "text-gray-600"
                }`}
              />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {option.label}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                <span>{option.estimatedTime}</span>
              </div>
            </div>
          </div>
          <MetricsBar option={option} />
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            {option.description}
          </p>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-semibold text-gray-700 flex items-center">
                <Play className="w-4 h-4 mr-2 text-blue-500" /> Key Features
              </p>
              <ul className="grid grid-cols-2 gap-3">
                {option.benefits.map((benefit, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start text-sm text-gray-600"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 mt-1 text-blue-500 flex-shrink-0" />
                    <span>{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            {option.requirements && option.requirements.length > 0 && (
              <div className="pt-6 border-t border-gray-100">
                <p className="font-semibold text-gray-700 mb-3">Tech Needs</p>
                <ul className="space-y-2">
                  {option.requirements.map((req) => (
                    <li
                      key={req}
                      className="text-sm text-gray-500 flex items-center"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mr-2" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </button>
      </Card>
    </motion.div>
  );
};

// ---------- Main Component ----------
interface TestimonialTypeSelectionProps {
  preferredMethod?: TestimonialType;
}
const TestimonialTypeSelection: React.FC<TestimonialTypeSelectionProps> =
  observer(({ preferredMethod }) => {
    const [selectedType, setSelectedType] = useState<TestimonialType | null>(
      null
    );
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          setFocusedIndex((prev) => (prev + 1) % testimonialOptions.length);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          setFocusedIndex((prev) =>
            prev - 1 < 0 ? testimonialOptions.length - 1 : prev - 1
          );
        } else if (e.key === "Enter") {
          if (!isPreviewMode) {
            const id = testimonialOptions[focusedIndex].id;
            if (id === "text") {
              navigate(`/collection/text`);
            } else {
              handleOptionSelect(testimonialOptions[focusedIndex].id);
            }
          }
        } else if (e.key === "Escape") {
          setIsPreviewMode(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [focusedIndex, isPreviewMode]);

    const handleOptionSelect = (type: TestimonialType) => {
      // containerRef.current?.scrollIntoView({ behavior: "smooth" });
      setSelectedType(type);
      if (type === "text") {
        setIsPreviewMode((prev) => !prev);
      } else {
        runInAction(() => collectionStore.handleTypeSelection(type));
      }
    };

    const getOptionStatus = (type: TestimonialType): TestimonialStatus =>
      selectedType !== type
        ? "pending"
        : isPreviewMode
        ? "selected"
        : "confirmed";

    return (
      <div ref={containerRef} className="min-h-screen px-2 md:px-6 py-12">
        <BackgroundParticles />
        <div className="max-w-7xl mx-auto relative z-10">
          <HeaderSection preferredMethod={preferredMethod} />
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {testimonialOptions.map((option, idx) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  status={getOptionStatus(option.id)}
                  isFocused={focusedIndex === idx}
                  onSelect={() => handleOptionSelect(option.id)}
                  onFocus={() => setFocusedIndex(idx)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          <AnimatePresence>
            {isPreviewMode && selectedType === "text" && (
              <PreviewModal
                selectedType="text"
                onCancel={() => setIsPreviewMode(false)}
                onConfirm={() => {
                  collectionStore.handleTypeSelection("text");
                  navigate(`/collection/text`);
                }}
              />
            )}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12 text-sm text-gray-500"
          >
            Use arrow keys to navigate • Enter to select • Escape to cancel
          </motion.div>
        </div>

        <MediaSelectionModal />
      </div>
    );
  });

// ---------- Preview Modal ----------
interface PreviewModalProps {
  selectedType: TestimonialType;
  onCancel: () => void;
  onConfirm: () => void;
}
const PreviewModal: React.FC<PreviewModalProps> = ({
  selectedType,
  onCancel,
  onConfirm,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 100 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 100 }}
    className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-50/90 to-white/90 backdrop-blur-md border-t shadow-xl p-6 sm:p-10 z-50"
  >
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center space-x-6 mb-4 sm:mb-0">
        <div className="p-3 bg-blue-100 rounded-xl">
          <Info className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-1">
            Ready to Inspire?
          </h3>
          <AlertDescription className="text-gray-600">
            Your {selectedType} review motivates others.
          </AlertDescription>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
        >
          Change Format
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onConfirm}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
        >
          Start Sharing
        </motion.button>
      </div>
    </div>
  </motion.div>
);

export default TestimonialTypeSelection;
