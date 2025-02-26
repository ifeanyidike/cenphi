import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import {
  Star,
  MessageCircle,
  Quote,
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
  Plus,
} from "lucide-react";

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
    description: "How long have you been using our solution?",
    options: [
      {
        id: "veteran",
        title: "Long-term Partner",
        description: "Over 2 years of collaboration",
        icon: <Crown className="w-6 h-6" />,
        highlight: "Valued Customer",
      },
      {
        id: "established",
        title: "Established User",
        description: "1-2 years of experience",
        icon: <Building2 className="w-6 h-6" />,
      },
      {
        id: "recent",
        title: "Recent Adopter",
        description: "Less than a year",
        icon: <Star className="w-6 h-6" />,
      },
    ],
  },
  {
    id: "satisfaction",
    category: "Experience",
    question: "Overall Satisfaction",
    description: "How would you rate your experience with our solution?",
    options: [
      {
        id: "exceptional",
        title: "Exceptional",
        description: "Exceeded all expectations",
        icon: <Award className="w-6 h-6" />,
        highlight: "Most Common",
      },
      {
        id: "satisfied",
        title: "Very Satisfied",
        description: "Met all requirements effectively",
        icon: <ThumbsUp className="w-6 h-6" />,
      },
      {
        id: "good",
        title: "Satisfied",
        description: "Good overall experience",
        icon: <Heart className="w-6 h-6" />,
      },
    ],
  },
  {
    id: "impact",
    category: "Results",
    question: "Business Impact",
    description: "What impact has our solution had on your business?",
    options: [
      {
        id: "transformative",
        title: "Transformative",
        description: "Complete business transformation",
        icon: <Crown className="w-6 h-6" />,
        highlight: "Featured",
      },
      {
        id: "significant",
        title: "Significant",
        description: "Major positive changes",
        icon: <Star className="w-6 h-6" />,
      },
      {
        id: "moderate",
        title: "Moderate",
        description: "Notable improvements",
        icon: <ThumbsUp className="w-6 h-6" />,
      },
    ],
  },
  {
    id: "recommendation",
    category: "Feedback",
    question: "Recommendation Level",
    description: "How likely are you to recommend our solution?",
    options: [
      {
        id: "highly",
        title: "Highly Likely",
        description: "Would actively promote",
        icon: <CheckCircle2 className="w-6 h-6" />,
      },
      {
        id: "likely",
        title: "Likely",
        description: "Would recommend if asked",
        icon: <Circle className="w-6 h-6" />,
      },
      {
        id: "maybe",
        title: "Potentially",
        description: "Might recommend",
        icon: <Circle className="w-6 h-6" />,
      },
    ],
  },
];

// Circular progress ring component
const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => (
  <svg className="w-32 h-32" viewBox="0 0 100 100">
    <motion.circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#f3f4f6"
      strokeWidth="2"
    />
    <motion.circle
      cx="50"
      cy="50"
      r="45"
      fill="none"
      stroke="#000"
      strokeWidth="2"
      strokeDasharray={2 * Math.PI * 45}
      initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
      animate={{ strokeDashoffset: (1 - progress) * 2 * Math.PI * 45 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    />
    <text
      x="50"
      y="50"
      textAnchor="middle"
      dominantBaseline="middle"
      className="text-2xl font-light"
    >
      {Math.round(progress * 100)}%
    </text>
  </svg>
);

// Question card component
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
    initial={{ opacity: 0, y: 40 }}
    animate={{
      opacity: isVisible ? 1 : 0.3,
      y: isVisible ? 0 : 40,
      scale: isVisible ? 1 : 0.98,
    }}
    className={`w-full max-w-5xl mx-auto ${
      isVisible ? "" : "pointer-events-none"
    }`}
  >
    <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
      <div className="mb-8">
        <div className="text-sm font-medium text-gray-400 mb-2">
          {step.category}
        </div>
        <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
          {step.question}
        </h2>
        <p className="text-gray-500 text-base md:text-lg">{step.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {step.options.map((option) => (
          <motion.div
            key={option.id}
            className={`
              relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
              ${
                selected === option.id ? "ring-2 ring-black" : "hover:shadow-xl"
              }
            `}
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(option.id)}
          >
            {option.highlight && (
              <div className="absolute top-0 left-0 right-0 bg-black text-white text-xs py-1 px-3 text-center font-medium">
                {option.highlight}
              </div>
            )}
            <div className="p-6 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div className="text-gray-400">{option.icon}</div>
                <div
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${
                      selected === option.id
                        ? "bg-black text-white"
                        : "border-2 border-gray-300"
                    }
                  `}
                >
                  {selected === option.id ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
              </div>
              <h3 className="text-xl font-medium mb-1">{option.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {option.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.div>
);

// Detailed feedback form component
interface DetailedFeedbackProps {
  onSubmit: (data: FeedbackData) => void;
}

const DetailedFeedback: React.FC<DetailedFeedbackProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<
    FeedbackData & { isExpanded: boolean }
  >({
    name: "",
    role: "",
    company: "",
    testimonial: "",
    additionalInsights: "",
    allowPhoto: false,
    isExpanded: false,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-5xl mx-auto px-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-12">
        <div className="mb-6">
          <div className="text-sm font-medium text-gray-400 mb-2">
            Final Step
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-4">
            Share Your Story
          </h2>
          <p className="text-gray-500 text-base md:text-lg">
            Help others understand the value of our solution through your
            experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-black focus:ring-0 transition-all"
                placeholder="John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full p-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-black focus:ring-0 transition-all"
                placeholder="Senior Manager"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, company: e.target.value }))
                }
                className="w-full p-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-black focus:ring-0 transition-all"
                placeholder="Acme Corp"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full p-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-black focus:ring-0 transition-all h-40 resize-none"
                placeholder="Share your experience in detail..."
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                initial={{ height: formData.isExpanded ? "auto" : "100px" }}
                animate={{ height: formData.isExpanded ? "auto" : "100px" }}
                className="w-full p-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-black focus:ring-0 transition-all resize-none"
                placeholder="Any additional details..."
              />
              <button
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    isExpanded: !prev.isExpanded,
                  }))
                }
                className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-black transition-colors"
                type="button"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center space-x-4 p-3 rounded-xl bg-gray-50">
              <Camera className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Profile Photo
                </label>
                <p className="text-sm text-gray-500">
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
                  w-12 h-6 rounded-full cursor-pointer transition-colors
                  ${formData.allowPhoto ? "bg-black" : "bg-gray-200"}
                `}
              >
                <motion.div
                  className="w-6 h-6 rounded-full bg-white shadow-sm"
                  animate={{ x: formData.allowPhoto ? 24 : 0 }}
                />
              </div>
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
          className="mt-6 w-full py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-all duration-300 flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-base md:text-lg">Submit Testimonial</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

// Thank-you screen component
const SuccessView: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center max-w-2xl mx-auto py-16 px-4"
  >
    <motion.div
      className="relative w-24 h-24 md:w-32 md:h-32 mx-auto mb-8"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-black opacity-20"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <Star className="w-12 h-12 md:w-16 md:h-16 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
    </motion.div>
    <h2 className="text-3xl md:text-5xl font-light mb-4">Thank You</h2>
    <p className="text-base md:text-xl text-gray-500 leading-relaxed">
      Your testimonial helps others understand the value of our solution. We
      appreciate your feedback!
    </p>
  </motion.div>
);

// Main merged testimonial flow component
const TestimonialFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const progress = useMotionValue(0);
  const totalSteps = mergedSteps.length + 1; // including the final feedback step

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
    return <SuccessView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-16">
      {/* Fixed circular progress indicator */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50">
        <ProgressRing progress={progress.get()} />
      </div>

      {/* Fixed linear progress bar at the top */}
      <div className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-xs md:text-sm font-medium text-gray-500">
              Step {currentStep + 1} of {totalSteps}
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-500">
              <Quote className="w-3 h-3 md:w-4 md:h-4" />
              <span>Testimonial Collection</span>
            </div>
          </div>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-black"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto pt-28 px-4">
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
            <DetailedFeedback onSubmit={handleFeedbackSubmit} />
          )}
        </AnimatePresence>

        {/* Navigation controls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 md:mt-12 max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center"
        >
          {currentStep > 0 && currentStep <= mergedSteps.length && (
            <button
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="text-gray-500 hover:text-black transition-colors flex items-center space-x-1 md:space-x-2 mb-4 md:mb-0"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span className="text-xs md:text-sm">Previous Step</span>
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
              <div className="text-xs md:text-sm text-gray-500">
                {currentStep + 1} of {mergedSteps.length}
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 md:mt-16 max-w-2xl mx-auto text-center px-2"
        >
          <div className="flex items-center justify-center space-x-2">
            <MessageCircle className="w-4 h-4 text-gray-400" />
            <p className="text-xs md:text-sm text-gray-500">
              Your feedback helps us improve and helps others make informed
              decisions.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-xs md:text-sm text-gray-500">
                100% Anonymous
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-gray-400" />
              <span className="text-xs md:text-sm text-gray-500">
                Featured Reviews Program
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white/80 to-transparent h-16 pointer-events-none" />
    </div>
  );
};

export default TestimonialFlow;
