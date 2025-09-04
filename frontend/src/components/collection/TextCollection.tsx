import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import {
  Star,
  MessageCircle,
  User,
  Building2,
  Camera,
  Heart,
  ThumbsUp,
  Award,
  Crown,
  ArrowRight,
  CheckCircle2,
  Circle,

  XCircle,
  HelpCircle,
  MinusCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
// import TestimonialProgress from "./TestimonialProgress";
import ChangeRenderType from "./ChangeRenderType";
import { collectionStore } from "@/stores/collectionStore";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

// Type definitions
interface Option {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

interface Step {
  id: string;
  category: string;
  question: string;
  description: string;
  options: Option[];
}

interface FeedbackData {
  name: string;
  role: string;
  company: string;
  testimonial: string;
  additionalInsights: string;
  allowPhoto: boolean;
}

// Merged steps configuration
const mergedSteps: Step[] = [
  {
    id: "journey",
    category: "Background",
    question: "Your Journey With Us",
    description: "How long have you been using our product or service?",
    options: [
      {
        id: "veteran",
        title: "Long-Term Partner",
        description: "More than 2 years of continuous use",
        icon: <Crown className="w-5 h-5" />,
        highlight: "Valued Customer",
      },
      {
        id: "established",
        title: "An Established User",
        description: "Between 1 and 2 years",
        icon: <Building2 className="w-5 h-5" />,
      },
      {
        id: "recent",
        title: "New Customer",
        description: "Less than 1 year",
        icon: <Star className="w-5 h-5" />,
      },
      {
        id: "trial",
        title: "Just Getting Started",
        description: "Currently exploring the product",
        icon: <Clock className="w-5 h-5" />,
      },
    ],
  },
  {
    id: "satisfaction",
    category: "Experience",
    question: "Your Satisfaction Level",
    description: "How would you describe your overall experience with us?",
    options: [
      {
        id: "exceptional",
        title: "Exceptional",
        description: "Went above and beyond expectations",
        icon: <Award className="w-5 h-5" />,
        highlight: "Most Selected",
      },
      {
        id: "satisfied",
        title: "Very Satisfactory",
        description: "Met all your expectations",
        icon: <ThumbsUp className="w-5 h-5" />,
      },
      {
        id: "good",
        title: "Satisfied",
        description: "Generally positive experience",
        icon: <Heart className="w-5 h-5" />,
      },
      {
        id: "disappointed",
        title: "Needs Improvement",
        description: "Fell short of expectations",
        icon: <AlertTriangle className="w-5 h-5" />,
      },
    ],
  },
  {
    id: "impact",
    category: "Results",
    question: "Impact on Your Business",
    description: "What kind of results have you seen from using our solution?",
    options: [
      {
        id: "transformative",
        title: "Transformational",
        description: "Led to a major shift in how my business operates",
        icon: <Crown className="w-5 h-5" />,
        highlight: "Top Feedback",
      },
      {
        id: "significant",
        title: "Significant Impact",
        description: "Helped achieve major improvements",
        icon: <Star className="w-5 h-5" />,
      },
      {
        id: "moderate",
        title: "Moderate Impact",
        description: "Contributed noticeable improvements",
        icon: <ThumbsUp className="w-5 h-5" />,
      },
      {
        id: "minimal",
        title: "Little to No Impact",
        description: "Didn't produce noticeable results",
        icon: <MinusCircle className="w-5 h-5" />,
      },
    ],
  },
  {
    id: "recommendation",
    category: "Feedback",
    question: "Likelihood to Recommend",
    description: "How likely are you to recommend us to others?",
    
    options: [
      {
        id: "highly",
        title: "Highly Likely",
        description: "Would actively promote and refer others",
        icon: <CheckCircle2 className="w-5 h-5" />,
        highlight: "Popular Opinion",
      },
      {
        id: "likely",
        title: "Likely",
        description: "Would recommend if asked",
        icon: <Circle className="w-5 h-5" />,
      },
      {
        id: "maybe",
        title: "Maybe",
        description: "Might recommend under certain conditions",
        icon: <HelpCircle className="w-5 h-5" />,
      },
      {
        id: "unlikely",
        title: "Unlikely",
        description: "Would not recommend based on current experience",
        icon: <XCircle className="w-5 h-5" />,
      },
    ],
  },
];

// Question card component - Compact version
interface MergedQuestionCardProps {
  step: Step;
  selected: string | null;
  onSelect: (optionId: string) => void;
  isVisible: boolean;
}

const MergedQuestionCard: React.FC<MergedQuestionCardProps> = ({
  step,
  selected,
  onSelect,
  isVisible,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: isVisible ? 1 : 0.3,
      y: isVisible ? 0 : 20,
      scale: isVisible ? 1 : 0.98,
    }}
    className={`w-full max-w-6xl mx-auto ${
      isVisible ? "" : "pointer-events-none"
    }`}
  >
    <div className="bg-white rounded-xl shadow-xl p-6">
      <div className="mb-6 text-center">
        <div className="text-xs font-medium text-gray-400 mb-1">
          {step.category}
        </div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">
          {step.question}
        </h2>
        <p className="text-gray-500 text-sm">{step.description}</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {step.options.map((option) => (
          <motion.div
            key={option.id}
            className={`
              relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300
              ${
                selected === option.id ? "ring-2 ring-black" : "hover:shadow-lg"
              }
            `}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.id)}
          >
            {option.highlight && (
              <div className="absolute top-0 left-0 right-0  text-black text-xs py-1 px-2 text-center font-medium">
                {option.highlight}
              </div>
            )}
            <div className="p-4 bg-gray-50 h-full flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="text-gray-400">{option.icon}</div>
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center
                    ${
                      selected === option.id
                        ? "bg-black text-white"
                        : "border-2 border-gray-300"
                    }
                  `}
                >
                  {selected === option.id ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Circle className="w-3 h-3" />
                  )}
                </div>
              </div>
              <h3 className="text-sm font-medium mb-1">{option.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed flex-1">
                {option.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

// Detailed feedback form component - Compact version
interface DetailedFeedbackProps {
  onSubmit: (data: FeedbackData) => void;
  generatedTestimonial: string;
}

const DetailedFeedback: React.FC<DetailedFeedbackProps> = ({ onSubmit, generatedTestimonial }) => {
  const [formData, setFormData] = useState<FeedbackData & { isExpanded: boolean }>(
    {
      name: "",
      role: "",
      company: "",
      testimonial: generatedTestimonial,
      additionalInsights: "",
      allowPhoto: false,
      isExpanded: false,
    }
  );

  useEffect(() => {
    setFormData((prev) => ({ ...prev, testimonial: generatedTestimonial }));
  }, [generatedTestimonial]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-6xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="mb-4 text-center">
          <div className="text-xs font-medium text-gray-400 mb-1">
            Final Step
          </div>
          <h2 className="text-2xl font-light text-gray-900 mb-2">
            Share Your Story
          </h2>
          <p className="text-gray-500 text-sm">
            Help others understand the value of our solution through your
            experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 transition-all"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full p-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 transition-all"
                placeholder="Senior Manager"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                className="w-full p-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 transition-all"
                placeholder="Acme Corp"
              />
            </div>
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
              <Camera className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700">
                  Profile Photo
                </label>
                <p className="text-xs text-gray-500">
                  Allow us to use your profile photo
                </p>
              </div>
              <div
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    allowPhoto: !prev.allowPhoto,
                  }))
                }
                className={`
                  w-10 h-5 rounded-full cursor-pointer transition-colors
                  ${formData.allowPhoto ? "bg-black" : "bg-gray-200"}
                `}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{ x: formData.allowPhoto ? 20 : 0 }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Your Testimonial
              </label>
              <textarea
                value={formData.testimonial}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    testimonial: e.target.value,
                  }))
                }
                className="w-full p-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 transition-all h-24 resize-none"
                placeholder="Share your experience in detail..."
              />
            </div>
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional Insights
              </label>
              <motion.textarea
                value={formData.additionalInsights}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    additionalInsights: e.target.value,
                  }))
                }
                className="w-full p-2 text-sm rounded-lg bg-gray-50 border border-gray-200 focus:border-black focus:ring-0 transition-all h-20 resize-none"
                placeholder="Any additional details..."
              />
            </div>
          </div>
        </div>
        <motion.button
          onClick={() =>
            onSubmit({
              name: formData.name,
              role: formData.role,
              company: formData.company,
              testimonial: formData.testimonial,
              additionalInsights: formData.additionalInsights,
              allowPhoto: formData.allowPhoto,
            })
          }
          className="mt-4 w-full py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-all duration-300 flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <span className="text-sm">Submit Testimonial</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Main merged testimonial flow component
const TextCollection: React.FC = observer(() => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const progress = useMotionValue(0);
  const totalSteps = mergedSteps.length + 1; // including the final feedback step
  const navigate = useNavigate();

  // Generate testimonial from selected options
  const generateTestimonial = () => {
    // Template-based narrative for each step
    const parts: string[] = [];
    const journey = mergedSteps.find((s) => s.id === "journey");
    const satisfaction = mergedSteps.find((s) => s.id === "satisfaction");
    const impact = mergedSteps.find((s) => s.id === "impact");
    const recommendation = mergedSteps.find((s) => s.id === "recommendation");

    if (journey) {
      const sel = journey.options.find((o) => o.id === responses[journey.id]);
      if (sel) {
        parts.push(`I have been ${sel.title.toLowerCase()} (${sel.description.toLowerCase()}).`);
      }
    }
    if (satisfaction) {
      const sel = satisfaction.options.find((o) => o.id === responses[satisfaction.id]);
      if (sel) {
        parts.push(`My overall experience has been ${sel.title.toLowerCase()}, ${sel.description.toLowerCase()}.`);
      }
    }
    if (impact) {
      const sel = impact.options.find((o) => o.id === responses[impact.id]);
      if (sel) {
        parts.push(`The impact on my business has been ${sel.title.toLowerCase()}: ${sel.description.toLowerCase()}.`);
      }
    }
    if (recommendation) {
      const sel = recommendation.options.find((o) => o.id === responses[recommendation.id]);
      if (sel) {
        parts.push(`I am ${sel.title.toLowerCase()} to recommend this to others (${sel.description.toLowerCase()}).`);
      }
    }
    return parts.join(' ');
  };

  useEffect(() => {
    progress.set((currentStep + 1) / totalSteps);
  }, [currentStep, totalSteps, progress]);

  const handleSelect = (questionId: string, optionId: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: optionId }));
    setTimeout(() => setCurrentStep((prev) => prev + 1), 600);
  };

  const handleFeedbackSubmit = (feedbackData: FeedbackData) => {
    const finalData = { ...responses, ...feedbackData };
    console.log("Final Testimonial Data:", finalData);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    // return <SuccessView />;
    collectionStore.handleComplete();
    navigate("/collection/thank-you");
  }

  return (
    <div className="min-h-screen overflow-hidden flex flex-col">
      {/* <TestimonialProgress
        progress={progress}
        currentStep={currentStep}
        totalSteps={totalSteps}
      /> */}

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {currentStep < mergedSteps.length ? (
              mergedSteps.map((step, index) => (
                <div
                  key={step.id}
                  style={{ display: currentStep === index ? "block" : "none" }}
                >
                  <MergedQuestionCard
                    step={step}
                    selected={responses[step.id] || null}
                    onSelect={(optionId) => handleSelect(step.id, optionId)}
                    isVisible={currentStep === index}
                  />
                </div>
              ))
            ) : (
              <DetailedFeedback
                onSubmit={handleFeedbackSubmit}
                generatedTestimonial={generateTestimonial()}
              />
            )}
          </AnimatePresence>

          {/* Navigation controls - Compact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 max-w-6xl mx-auto flex justify-between items-center"
          >
            {currentStep > 0 && currentStep <= mergedSteps.length && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="text-gray-500 hover:text-black transition-colors flex items-center space-x-1"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-sm">Previous</span>
              </button>
            )}
            <div className="flex-1" />
            {currentStep < mergedSteps.length && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-2"
              >
                <div className="flex items-center space-x-1">
                  {mergedSteps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        idx === currentStep ? "bg-black w-3" : "bg-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  {currentStep + 1} of {mergedSteps.length}
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Footer info - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-4xl mx-auto text-center"
          >
            <div className="flex items-center justify-center space-x-2 mb-2">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">
                Your feedback helps us improve and helps others make informed
                decisions.
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  100% Anonymous
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Featured Reviews Program
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <ChangeRenderType type="text" />
    </div>
  );
});

export default TextCollection;
