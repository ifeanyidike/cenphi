import { useState, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { ArrowRight, CheckCircle2, Circle, Star, Plus } from "lucide-react";
// Innovative scroll-based progress indicator
const ProgressRing = ({ progress }: { progress: number }) => (
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

// const questions = [
//   {
//     id: "impact",
//     question: "Impact Level",
//     description: "How has our solution elevated your workflow?",
//     options: [
//       {
//         id: "transformative",
//         title: "Transformative",
//         description: "Complete paradigm shift in operations",
//         highlight: "Recommended",
//       },
//       {
//         id: "substantial",
//         title: "Substantial",
//         description: "Major improvements across processes",
//         highlight: "Popular",
//       },
//       {
//         id: "notable",
//         title: "Notable",
//         description: "Clear positive changes observed",
//         highlight: null,
//       },
//     ],
//   },
//   // ... other questions similar to before but with highlight property ...
// ];

const questions = [
  {
    id: "impact",
    question: "Impact on Your Work",
    description: "How has our solution transformed your workflow?",
    options: [
      {
        id: "revolutionary",
        title: "Revolutionary Change",
        description: "Complete transformation of processes",
        highlight: "Recommended",
      },
      {
        id: "significant",
        text: "Significant Improvement",
        description: "Notable enhancement in efficiency",
      },
      {
        id: "moderate",
        text: "Moderate Impact",
        description: "Useful improvements in select areas",
      },
    ],
  },
  {
    id: "value",
    question: "Value Proposition",
    description: "What aspect delivers the most value to you?",
    options: [
      {
        id: "efficiency",
        title: "Efficiency Gains",
        description: "Streamlined processes & time savings",
      },
      {
        id: "quality",
        title: "Quality Improvement",
        description: "Enhanced output & better results",
      },
      {
        id: "innovation",
        title: "Innovative Features",
        description: "Access to cutting-edge capabilities",
      },
    ],
  },
  {
    id: "recommendation",
    question: "Recommendation Level",
    description: "How likely are you to recommend our solution?",
    options: [
      {
        id: "highly",
        title: "Highly Likely",
        description: "Would actively promote",
      },
      {
        id: "likely",
        title: "Likely",
        description: "Would recommend if asked",
      },
      {
        id: "maybe",
        title: "Potentially",
        description: "Would consider recommending",
      },
    ],
  },
];

const QuestionCard = ({
  question,
  selectedOption,
  onSelect,
  isVisible,
}: {
  question: (typeof questions)[0];
  selectedOption: string | null;
  onSelect: (id: string) => void;
  isVisible: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isVisible ? 1 : 0.3,
        scale: isVisible ? 1 : 0.95,
        y: isVisible ? 0 : 20,
      }}
      transition={{ duration: 0.5 }}
      className={`
        w-full max-w-4xl mx-auto bg-white rounded-2xl
        ${isVisible ? "shadow-2xl" : "shadow-none pointer-events-none"}
      `}
    >
      <div className="p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-4xl font-light mb-4">{question.question}</h2>
          <p className="text-gray-500">{question.description}</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {question.options.map((option) => (
            <motion.div
              key={option.id}
              className={`
                relative rounded-xl overflow-hidden cursor-pointer
                border-2 transition-all duration-300
                ${
                  selectedOption === option.id
                    ? "border-black"
                    : "border-transparent hover:border-gray-200"
                }
              `}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.id)}
            >
              {(option as any).highlight && (
                <div
                  className="absolute top-0 left-0 right-0 bg-black text-white
                             text-xs py-1 px-3 text-center"
                >
                  {(option as any).highlight}
                </div>
              )}

              <div className="p-8 bg-gray-50">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-medium">{option.title}</h3>
                  <div
                    className={`
                    w-6 h-6 rounded-full border-2
                    flex items-center justify-center
                    ${
                      selectedOption === option.id
                        ? "border-black bg-black text-white"
                        : "border-gray-300"
                    }
                  `}
                  >
                    {selectedOption === option.id ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </div>
                </div>
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
};

const FinalStep = ({ onSubmit }: { onSubmit: (text: string) => void }) => {
  const [text, setText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-12">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: isExpanded ? "auto" : "200px" }}
          className="overflow-hidden"
        >
          <h2 className="text-4xl font-light mb-4">Additional Insights</h2>
          <p className="text-gray-500 mb-8">
            Share specific experiences that made our solution stand out.
          </p>

          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Your thoughts..."
              className="w-full p-6 rounded-xl bg-gray-50 border-2 border-gray-100
                       focus:border-black focus:ring-0 transition-all duration-300
                       text-lg min-h-[200px] resize-none"
            />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute bottom-4 right-4 p-2 text-gray-400
                       hover:text-black transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        <motion.button
          onClick={() => onSubmit(text)}
          className="mt-8 w-full py-4 bg-black text-white rounded-xl
                   hover:bg-gray-900 transition-all duration-300
                   flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-lg">Submit Feedback</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
};

const SuccessScreen = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center max-w-2xl mx-auto py-20"
  >
    <motion.div
      className="relative w-32 h-32 mx-auto mb-12"
      animate={{
        rotate: [0, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-black opacity-20"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
      <Star
        className="w-16 h-16 absolute top-1/2 left-1/2
                    transform -translate-x-1/2 -translate-y-1/2"
      />
    </motion.div>

    <h2 className="text-5xl font-light mb-6">Thank You</h2>
    <p className="text-xl text-gray-500 leading-relaxed">
      Your insights are invaluable in shaping the future of our solution.
    </p>
  </motion.div>
);

const TestimonialFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const progress = useMotionValue(0);

  useEffect(() => {
    progress.set(currentStep / (questions.length + 1));
  }, [currentStep]);

  const handleSelect = (questionId: string, optionId: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: optionId }));
    setTimeout(() => setCurrentStep((prev) => prev + 1), 600);
  };

  const handleSubmit = (additionalText: string) => {
    setResponses((prev) => ({ ...prev, additionalText }));
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="fixed top-8 right-8 z-50">
        <ProgressRing progress={progress.get()} />
      </div>

      <div className="container mx-auto py-20 px-4">
        <div className="space-y-8">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              selectedOption={responses[question.id]}
              onSelect={(optionId) => handleSelect(question.id, optionId)}
              isVisible={currentStep === index}
            />
          ))}

          {currentStep === questions.length && (
            <FinalStep onSubmit={handleSubmit} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TestimonialFlow;
