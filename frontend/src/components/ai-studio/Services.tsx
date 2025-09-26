// components/ai-studio/Services.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AI_SERVICES } from "./definitions";
import {
  Heart,
  Play,
  Settings,
  Target,
  Clock,
  ArrowRight,
  Brain,
} from "lucide-react";
import TranslationModal from "./service-config/TextTranslationConfig";
import ContentGenerationModal from "./service-config/ContentGeneratorConfig";
import TextPolishingModal from "./service-config/TextPolishingConfig";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";
import { preset_manager } from "@/repo/managers/preset_manager";
import { ServiceType } from "@/types/ai-service";

type Props = {
  handleProcessImmediate: (serviceId: ServiceType) => void;
  handleCustomizeProcess: (serviceId: ServiceType) => void;
  handleStreamingProcess?: (serviceId: ServiceType, config: any) => void;
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  // defaultPresets: Record<string, any>;
  selectedTestimonials: string[];
  selectedArtifacts?: string[];
  artifactMode?: boolean;
};

const Services: React.FC<Props> = ({
  handleCustomizeProcess,
  handleProcessImmediate,
  handleStreamingProcess,
  selectedCategory,
  setSelectedCategory,
  // defaultPresets,
  selectedTestimonials,
  selectedArtifacts = [],
  artifactMode = false,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const allTestimonials = workspaceHub.testimonialManager.testimonials;
  const testimonials =
    allTestimonials?.filter((t) => selectedTestimonials.includes(t.id)) || [];
  const unique_types = new Set(testimonials.map((t) => t.type));

  let matching_services = AI_SERVICES;
  if (
    (unique_types.has("text") && unique_types.has("video")) ||
    unique_types.has("text")
  ) {
    matching_services = AI_SERVICES.filter((c) => c.category !== "video");
  }

  if (testimonials.length > 1) {
    matching_services = matching_services.filter(
      (s) => s.id !== "story_mode" && s.id !== "clipping"
    );
  }

  const categories = [
    { id: "all", label: "All", count: matching_services.length },
    {
      id: "video",
      label: "Video",
      count: matching_services.filter((s) => s.category === "video").length,
    },
    {
      id: "content",
      label: "Content",
      count: matching_services.filter((s) => s.category === "content").length,
    },
  ];

  const streamlinedServices = [
    "content_generation",
    "text_polishing",
    "translation",
  ];

  const filteredServices =
    selectedCategory === "all"
      ? matching_services
      : matching_services.filter(
          (service) => service.category === selectedCategory
        );

  const handleServiceAction = (
    serviceId: ServiceType,
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

  const handleStreamlineProcess = (serviceId: ServiceType, config: any) => {
    if (handleStreamingProcess) {
      handleStreamingProcess(serviceId, config);
    }
    setActiveModal(null);
  };

  const getComplexityColor = (complexity_score: number) => {
    if (complexity_score > 6) {
      return "text-rose-600 bg-rose-50";
    } else if (complexity_score > 3.5) {
      return "text-amber-600 bg-amber-50";
    } else if (complexity_score > 1) {
      return "text-emerald-600 bg-emerald-50";
    }
    return "text-gray-600 bg-gray-50";
  };

  const hasSelection =
    selectedTestimonials.length > 0 || selectedArtifacts.length > 0;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30 rounded-lg -m-4"></div>
        <div className="relative p-4">
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            AI Services
          </h2>
          <p className="text-gray-600 mt-1 text-sm">
            Transform your testimonials with intelligent processing
          </p>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex items-center gap-6">
        <div className="flex space-x-1 bg-gray-100/60 p-1 rounded-lg">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                selectedCategory === category.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {category.label}
              <span className="ml-1.5 text-xs opacity-60">
                ({category.count})
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
      </div>

      {/* Selection prompt */}
      {!hasSelection && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {artifactMode
              ? "Select Content to Process"
              : "Select Testimonials to Begin"}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {artifactMode
              ? "Choose clips or videos above to process with AI services."
              : "Choose one or more testimonials above to unlock AI services and start processing your content."}
          </p>
        </div>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredServices.map((service, index) => {
          const IconComponent = service.icon;
          const config =
            preset_manager.defaultPresets[service.id]?.config ||
            service.defaultSettings;
          const isStreamlined = streamlinedServices.includes(service.id);
          const isHovered = hoveredCard === service.id;

          return (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onHoverStart={() => setHoveredCard(service.id)}
              onHoverEnd={() => setHoveredCard(null)}
              className="group cursor-pointer"
            >
              <div className="relative bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-300 h-full flex flex-col overflow-hidden">
                {/* Subtle gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500`}
                ></div>

                {/* Header Section */}
                <div className="relative p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-sm`}
                      >
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        {service.title}
                      </h3>
                    </div>

                    {/* Status indicators */}
                    <div className="flex items-center gap-2">
                      {service.supportsStreaming && (
                        <div className="w-2 h-2 bg-emerald-400 rounded-full pulse"></div>
                      )}
                      {preset_manager.defaultPresets[service.id] && (
                        <Heart className="h-4 w-4 text-rose-500 fill-current" />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                {/* Content Section */}
                <div className="relative flex-1 p-5">
                  {/* Features as inline pills */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {service.features.slice(0, 4).map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-50 rounded-md border"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metrics bar */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4 py-2 px-3 bg-gray-50/50 rounded-md">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{service.estimatedTime}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-300"></div>
                    <div
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getComplexityColor(service.complexity_score)}`}
                    >
                      {service.business_impact}
                    </div>
                  </div>

                  {/* Configuration preview for non-streamlined */}
                  {!isStreamlined && config && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Settings className="h-3 w-3" />
                        Configuration
                        {preset_manager.defaultPresets[service.id] && (
                          <span className="text-rose-600 font-medium">
                            ({preset_manager.defaultPresets[service.id].name})
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {Object.entries(config)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-gray-600 capitalize">
                                {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                              </span>
                              <span className="text-gray-800 font-medium max-w-16 truncate">
                                {Array.isArray(value)
                                  ? value.join(", ")
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Section */}
                <div className="relative p-5 pt-0">
                  {isStreamlined ? (
                    <button
                      onClick={() =>
                        handleServiceAction(service.id, "streamlined")
                      }
                      disabled={
                        artifactMode
                          ? selectedArtifacts.length === 0
                          : selectedTestimonials.length === 0
                      }
                      className="w-full h-9 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium group"
                    >
                      <span>Start Processing</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleServiceAction(service.id, "immediate")
                        }
                        disabled={
                          artifactMode
                            ? selectedArtifacts.length === 0
                            : selectedTestimonials.length === 0
                        }
                        className="flex-1 h-9 px-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-all duration-200 flex items-center justify-center gap-1.5 text-sm font-medium"
                      >
                        <Play className="h-3 w-3" />
                        Process
                      </button>
                      <button
                        onClick={() =>
                          handleServiceAction(service.id, "customize")
                        }
                        disabled={
                          artifactMode
                            ? selectedArtifacts.length === 0
                            : selectedTestimonials.length === 0
                        }
                        className="px-3 h-9 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 rounded-md transition-all duration-200 flex items-center justify-center"
                      >
                        <Settings className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Hover indicator */}
                <div
                  className={`absolute left-0 top-0 w-0.5 h-full bg-gradient-to-b ${service.gradient} transition-opacity duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
                ></div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {(artifactMode
        ? selectedArtifacts.length === 0
        : selectedTestimonials.length === 0) && (
        <div className="text-center py-12 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 to-blue-50/30 rounded-lg"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Target className="w-7 h-7 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {artifactMode
                ? "Select Content First"
                : "Select Testimonials First"}
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto text-sm leading-relaxed">
              {artifactMode
                ? "Choose clips or artifacts to unlock AI processing services."
                : "Choose testimonials to unlock AI processing services."}
            </p>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        <ContentGenerationModal
          isOpen={activeModal === "content_generation"}
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

      <style>{`
        .pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default observer(Services);
