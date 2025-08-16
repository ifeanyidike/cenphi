// components/ai-studio/Services.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "./constants";
import { AI_SERVICES } from "./definitions";
import {
  Heart,
  Play,
  Settings,
  Target,
  X,
  FileText,
  Languages,
  Wand2,
  Sparkles,
} from "lucide-react";

// Content types for content generation
const CONTENT_TYPES = [
  {
    id: "email",
    name: "Email Campaign",
    description:
      "Professional email campaigns to engage customers and drive conversions",
  },
  {
    id: "blog",
    name: "Blog Post",
    description:
      "SEO-optimized blog articles that showcase customer success stories",
  },
  {
    id: "case_study",
    name: "Case Study",
    description:
      "Detailed analysis showcasing how your solution solved customer challenges",
  },
  {
    id: "fundraising_talking_points",
    name: "Fundraising Talking Points",
    description:
      "Compelling points for investor presentations and funding discussions",
  },
  {
    id: "white_paper",
    name: "White Paper",
    description:
      "In-depth technical documents that establish thought leadership",
  },
  {
    id: "sales_deck",
    name: "Sales Deck",
    description:
      "Persuasive presentation materials for sales meetings and demos",
  },
  {
    id: "roi_analysis",
    name: "ROI Analysis",
    description:
      "Financial impact reports showing value delivered to customers",
  },
  {
    id: "competitive_analysis",
    name: "Competitive Analysis",
    description:
      "Market positioning content highlighting your competitive advantages",
  },
  {
    id: "business_proposal",
    name: "Business Proposal",
    description: "Professional proposals for new business opportunities",
  },
  {
    id: "thought_leadership",
    name: "Thought Leadership Article",
    description: "Industry insights and expert commentary to build authority",
  },
  {
    id: "customer_success_story",
    name: "Customer Success Story",
    description: "Narrative-driven content showcasing customer achievements",
  },
  {
    id: "market_research_report",
    name: "Market Research Report",
    description: "Data-driven reports on industry trends and customer insights",
  },
  {
    id: "sales_enablement_guide",
    name: "Sales Enablement Guide",
    description: "Training materials and resources for sales teams",
  },
  {
    id: "implementation_guide",
    name: "Implementation Guide",
    description: "Step-by-step guides for successful product implementation",
  },
  {
    id: "quarterly_business_review",
    name: "Quarterly Business Review",
    description: "Performance summaries and strategic planning documents",
  },
];

// Target languages for translation
const LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
];

// Text polishing styles
const POLISHING_STYLES = [
  {
    id: "professional",
    name: "Professional",
    description: "Formal, authoritative tone suitable for business contexts",
  },
  {
    id: "casual",
    name: "Casual",
    description: "Friendly, approachable tone for informal communications",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Persuasive, engaging tone designed to drive action",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Precise, detailed tone for technical documentation",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Concise, strategic tone for leadership communications",
  },
];

type Props = {
  handleProcessImmediate: (serviceId: string) => void;
  handleCustomizeProcess: (serviceId: string) => void;
  handleStreamingProcess?: (serviceId: string, config: any) => void; // NEW
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  defaultPresets: Record<string, any>;
  selectedTestimonials: string[];
};

// Content Generation Modal
const ContentGenerationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (serviceId: string, config: any) => void;
  selectedTestimonials: string[];
}> = ({ isOpen, onClose, onGenerate, selectedTestimonials }) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredTypes = CONTENT_TYPES.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = () => {
    if (selectedType) {
      onGenerate("content_generator", {
        contentType: selectedType,
        customPrompt: customPrompt.trim() || null,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Generate Content
                </h2>
                <p className="text-sm text-gray-600">
                  Create marketing content from {selectedTestimonials.length}{" "}
                  testimonial{selectedTestimonials.length > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search content types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Content Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-4 text-left rounded-lg border-2 transition-all hover:border-pink-300 ${
                  selectedType === type.id
                    ? "border-pink-500 bg-pink-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">
                  {type.name}
                </div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </button>
            ))}
          </div>

          {/* Custom Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific requirements or style preferences for the generated content..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedType}
            className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Content
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Translation Modal
const TranslationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onTranslate: (serviceId: string, config: any) => void;
  selectedTestimonials: string[];
}> = ({ isOpen, onClose, onTranslate, selectedTestimonials }) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredLanguages = LANGUAGES.filter((lang) =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(langCode)
        ? prev.filter((code) => code !== langCode)
        : [...prev, langCode]
    );
  };

  const handleTranslate = () => {
    if (selectedLanguages.length > 0) {
      onTranslate("translation", {
        targetLanguages: selectedLanguages,
        customPrompt: customPrompt.trim() || null,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center">
                <Languages className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Translate Content
                </h2>
                <p className="text-sm text-gray-600">
                  Translate {selectedTestimonials.length} testimonial
                  {selectedTestimonials.length > 1 ? "s" : ""} to multiple
                  languages
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Selected Languages Summary */}
          {selectedLanguages.length > 0 && (
            <div className="mb-6 p-4 bg-teal-50 rounded-lg">
              <div className="text-sm font-medium text-teal-900 mb-2">
                Selected Languages ({selectedLanguages.length}):
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedLanguages.map((code) => {
                  const lang = LANGUAGES.find((l) => l.code === code);
                  return (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm"
                    >
                      <span>{lang?.flag}</span>
                      <span>{lang?.name}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Languages Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                className={`p-3 text-center rounded-lg border-2 transition-all hover:border-teal-300 ${
                  selectedLanguages.includes(lang.code)
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="text-2xl mb-1">{lang.flag}</div>
                <div className="text-sm font-medium text-gray-900">
                  {lang.name}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Translation Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific translation requirements, cultural adaptations, or style preferences..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTranslate}
            disabled={selectedLanguages.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Languages className="h-4 w-4" />
            Translate ({selectedLanguages.length})
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Text Polishing Modal
const TextPolishingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPolish: (serviceId: string, config: any) => void;
  selectedTestimonials: string[];
}> = ({ isOpen, onClose, onPolish, selectedTestimonials }) => {
  const [targetStyle, setTargetStyle] = useState<string>("");
  const [preserveAuthenticity, setPreserveAuthenticity] =
    useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const handlePolish = () => {
    if (targetStyle) {
      onPolish("text_polishing", {
        targetStyle,
        preserveAuthenticity,
        customPrompt: customPrompt.trim() || null,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Polish Text
                </h2>
                <p className="text-sm text-gray-600">
                  Enhance {selectedTestimonials.length} testimonial
                  {selectedTestimonials.length > 1 ? "s" : ""} while preserving
                  authenticity
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Target Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Target Writing Style *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {POLISHING_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setTargetStyle(style.id)}
                  className={`p-4 text-left rounded-lg border-2 transition-all hover:border-violet-300 ${
                    targetStyle === style.id
                      ? "border-violet-500 bg-violet-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-medium text-gray-900 mb-1">
                    {style.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preserve Authenticity */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={preserveAuthenticity}
                onChange={(e) => setPreserveAuthenticity(e.target.checked)}
                className="mt-1 w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
              />
              <div>
                <div className="font-medium text-gray-900">
                  Preserve Authenticity
                </div>
                <div className="text-sm text-gray-600">
                  Maintain the original voice and personality while improving
                  clarity and grammar
                </div>
              </div>
            </label>
          </div>

          {/* Custom Prompt */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Custom Enhancement Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Add specific instructions for how you want the text to be enhanced..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePolish}
            disabled={!targetStyle}
            className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Polish Text
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const Services: React.FC<Props> = ({
  handleCustomizeProcess,
  handleProcessImmediate,
  handleStreamingProcess, // NEW
  selectedCategory,
  setSelectedCategory,
  defaultPresets,
  selectedTestimonials,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Services that use streamlined approach
  const streamlinedServices = [
    "content_generator",
    "text_polishing",
    "translation",
  ];

  const filteredServices =
    selectedCategory === "all"
      ? AI_SERVICES
      : AI_SERVICES.filter((service) => service.category === selectedCategory);

  const handleServiceAction = (
    serviceId: string,
    action: "immediate" | "customize" | "streamlined"
  ) => {
    if (streamlinedServices.includes(serviceId)) {
      setActiveModal(serviceId);
    } else {
      if (action === "immediate") {
        handleProcessImmediate(serviceId);
      } else {
        handleCustomizeProcess(serviceId);
      }
    }
  };

  const handleStreamlineProcess = (serviceId: string, config: any) => {
    if (handleStreamingProcess) {
      handleStreamingProcess(serviceId, config);
    }
    setActiveModal(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Services</h2>
        <p className="text-gray-600 mt-1 text-sm">
          Select the AI service to apply to your testimonials
        </p>
      </div>

      <nav className="flex space-x-8 overflow-x-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <span>{category.label}</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {category.count}
            </span>
          </button>
        ))}
      </nav>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service, index) => {
          const IconComponent = service.icon;
          const config =
            defaultPresets[service.id]?.config || service.defaultSettings;
          const isStreamlined = streamlinedServices.includes(service.id);

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] h-full flex flex-col">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-6 h-6 rounded-xl bg-gradient-to-r ${service.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <IconComponent className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex flex-col gap-1">
                      {!service.isQueued && (
                        <div className="px-2 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                          Instant
                        </div>
                      )}
                      {service.supportsStreaming && (
                        <div className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full">
                          Streaming
                        </div>
                      )}
                      {defaultPresets[service.id] && (
                        <div className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-current" />
                          Default
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {service.description}
                  </p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Processing time:</span>
                      <div className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
                        {service.estimatedTime}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Complexity:</span>
                      <div className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
                        {service.complexity}
                      </div>
                    </div>
                  </div>

                  {/* Current Settings Display - Only for traditional services */}
                  {!isStreamlined && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-gray-700">
                          Current Settings:
                        </h4>
                        {defaultPresets[service.id] && (
                          <span className="text-xs text-red-600 font-medium">
                            {defaultPresets[service.id].name}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {Object.entries(config || {})
                          .slice(0, 3)
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                              </span>
                              <span className="text-gray-800 truncate ml-2">
                                {Array.isArray(value)
                                  ? value.join(", ")
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Button Layout */}
                  <div className="gap-2 flex items-center">
                    {isStreamlined ? (
                      // Single button for streamlined services
                      <button
                        onClick={() =>
                          handleServiceAction(service.id, "streamlined")
                        }
                        disabled={selectedTestimonials.length === 0}
                        className="w-full h-full text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="h-3 w-3" />
                        Start Processing
                      </button>
                    ) : (
                      // Two buttons for traditional services
                      <>
                        <button
                          onClick={() =>
                            handleServiceAction(service.id, "immediate")
                          }
                          disabled={selectedTestimonials.length === 0}
                          className="w-full h-full text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="h-3 w-3" />
                          Process Immediately
                        </button>
                        <button
                          onClick={() =>
                            handleServiceAction(service.id, "customize")
                          }
                          disabled={selectedTestimonials.length === 0}
                          className="px-3 h-full py-2 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {selectedTestimonials.length === 0 && (
        <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
          <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <h3 className="font-medium text-yellow-800">
            Select testimonials first
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Choose testimonials from the previous tab to enable processing
          </p>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        <ContentGenerationModal
          isOpen={activeModal === "content_generator"}
          onClose={() => setActiveModal(null)}
          onGenerate={handleStreamlineProcess}
          selectedTestimonials={selectedTestimonials}
        />
        <TranslationModal
          isOpen={activeModal === "translation"}
          onClose={() => setActiveModal(null)}
          onTranslate={handleStreamlineProcess}
          selectedTestimonials={selectedTestimonials}
        />
        <TextPolishingModal
          isOpen={activeModal === "text_polishing"}
          onClose={() => setActiveModal(null)}
          onPolish={handleStreamlineProcess}
          selectedTestimonials={selectedTestimonials}
        />
      </AnimatePresence>
    </div>
  );
};

export default Services;
