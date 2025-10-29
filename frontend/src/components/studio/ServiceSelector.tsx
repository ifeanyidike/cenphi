import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crop,
  Scissors,
  Sparkles,
  ArrowLeft,
  Instagram,
  Youtube,
  Linkedin,
  FileText,
  Workflow,
  CheckCircle2,
  Info,
  Zap,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudioContext, ServiceType } from "@/pages/Studio";
import { workspaceHub } from "@/repo/workspace_hub";
import { ContentType } from "@/types/testimonial";

interface ServiceSelectorProps {
  context: StudioContext;
  onServiceSelect: (service: ServiceType) => void;
  onCancel: () => void;
}

interface ServiceOption {
  id: ServiceType;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  features: string[];
  recommended?: boolean;
  requiredContentTypes: ContentType[];
  supportedContexts: StudioContext["type"][];
  priority: number;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  estimatedTime: string;
}

const SERVICES: ServiceOption[] = [
  {
    id: "platform_optimization",
    title: "Platform Optimization",
    description:
      "Transform videos for social media with smart cropping, captions, and platform-specific enhancements",
    icon: <Crop className="h-5 w-5" />,
    gradient: "from-blue-500 to-cyan-500",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    estimatedTime: "8-10 min",
    features: [
      "Smart aspect ratio cropping",
      "Auto-burn captions",
      "Noise removal & music mixing",
      "Logo & watermark overlay",
      "Video enhancement",
    ],
    recommended: true,
    requiredContentTypes: ["video"],
    supportedContexts: ["testimonial", "clip", "default"],
    priority: 1,
  },
  {
    id: "clipping",
    title: "Smart Clipping",
    description:
      "Extract the most impactful moments from testimonials with AI-powered highlight detection",
    icon: <Scissors className="h-5 w-5" />,
    gradient: "from-purple-500 to-pink-500",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    estimatedTime: "2-3 min",
    features: [
      "AI highlight detection",
      "Multiple clip types",
      "Configurable clip length",
      "Sentiment-based extraction",
    ],
    requiredContentTypes: ["video"],
    supportedContexts: ["testimonial", "default"],
    priority: 2,
  },
  {
    id: "story_video",
    title: "Story Video",
    description:
      "Combine multiple testimonials into a compelling narrative with AI-powered sequencing",
    icon: <Sparkles className="h-5 w-5" />,
    gradient: "from-orange-500 to-red-500",
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    estimatedTime: "10-15 min",
    features: [
      "Multi-testimonial assembly",
      "AI-powered clip ordering",
      "Custom intro/outro",
      "Music & branding integration",
    ],
    requiredContentTypes: ["video"],
    supportedContexts: [
      "testimonial",
      "multi-testimonial",
      "selected-clips",
      "best-moments",
      "default",
    ],
    priority: 3,
  },
  {
    id: "content_generation",
    title: "Content Generation",
    description:
      "Generate professional marketing content from testimonials with AI-powered writing",
    icon: <FileText className="h-5 w-5" />,
    gradient: "from-green-500 to-emerald-500",
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    estimatedTime: "30-60 sec",
    features: [
      "13+ content formats",
      "Real-time streaming",
      "Professional templates",
      "Instant download",
    ],
    requiredContentTypes: ["video", "text", "voice"],
    supportedContexts: ["testimonial", "multi-testimonial", "default"],
    priority: 4,
  },
  {
    id: "custom_pipeline",
    title: "Custom Pipeline",
    description:
      "Build your own processing workflow with drag-and-drop step customization",
    icon: <Workflow className="h-5 w-5" />,
    gradient: "from-indigo-500 to-violet-500",
    iconColor: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    estimatedTime: "Variable",
    features: [
      "Drag & drop steps",
      "Custom step ordering",
      "Save custom presets",
      "Advanced fine-tuning",
    ],
    requiredContentTypes: ["video"],
    supportedContexts: ["testimonial", "clip", "selected-clips", "default"],
    priority: 5,
  },
];

const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  context,
  onServiceSelect,
  onCancel,
}) => {
  // Get testimonial data for smart recommendations
  const contextTestimonial = useMemo(() => {
    if (context.type === "testimonial") {
      return workspaceHub.testimonialManager.testimonials?.find(
        (t) => t.id === context.testimonialId
      );
    }
    return null;
  }, [context]);

  // Determine testimonial type
  const testimonialType: ContentType | null = contextTestimonial?.type || null;

  // Smart service filtering based on context and content type
  const { recommendedServices, otherServices } = useMemo(() => {
    const recommended: ServiceOption[] = [];
    const other: ServiceOption[] = [];

    SERVICES.forEach((service) => {
      // Check if service supports current context
      const supportsContext = service.supportedContexts.includes(context.type);

      // Check if service supports testimonial type
      const supportsContentType =
        !testimonialType ||
        service.requiredContentTypes.includes(testimonialType);

      if (!supportsContext || !supportsContentType) {
        return;
      }

      // Smart recommendations based on context and testimonial state
      let isRecommended = false;

      if (context.type === "testimonial" && contextTestimonial) {
        const hasClips = contextTestimonial.artifacts?.some(
          (a) => a.processing_type === "clipping"
        );
        const hasPlatformOptimization = contextTestimonial.artifacts?.some(
          (a) => a.processing_type === "video_platform_optimization"
        );
        const hasStoryVideo = contextTestimonial.artifacts?.some(
          (a) =>
            a.processing_type === "story_mode_generation" ||
            a.processing_type === "best_story_moments"
        );

        // For text testimonials, only recommend content generation
        if (testimonialType === "text") {
          if (service.id === "content_generation") {
            isRecommended = true;
          }
        } else if (testimonialType === "video") {
          // Recommend based on what hasn't been done yet
          if (service.id === "clipping" && !hasClips) {
            isRecommended = true;
          } else if (
            service.id === "platform_optimization" &&
            !hasPlatformOptimization
          ) {
            isRecommended = true;
          } else if (service.id === "content_generation") {
            isRecommended = true; // Always useful
          } else if (
            service.id === "story_video" &&
            hasClips &&
            !hasStoryVideo
          ) {
            isRecommended = true; // Recommend if clips exist
          }
        } else {
          // Voice or other types - recommend content generation
          if (service.id === "content_generation") {
            isRecommended = true;
          }
        }
      } else if (context.type === "multi-testimonial") {
        // For multi-testimonial, recommend story video and content generation
        if (
          service.id === "story_video" ||
          service.id === "content_generation"
        ) {
          isRecommended = true;
        }
      } else if (context.type === "selected-clips") {
        // For selected clips, recommend story video or custom pipeline
        if (service.id === "story_video" || service.id === "custom_pipeline") {
          isRecommended = true;
        }
      } else if (context.type === "best-moments") {
        // For best moments, recommend story video
        if (service.id === "story_video") {
          isRecommended = true;
        }
      } else if (context.type === "default") {
        // No context - recommend based on default priority
        if (service.priority <= 2) {
          isRecommended = true;
        }
      }

      if (isRecommended) {
        recommended.push(service);
      } else {
        other.push(service);
      }
    });

    return {
      recommendedServices: recommended.sort((a, b) => a.priority - b.priority),
      otherServices: other.sort((a, b) => a.priority - b.priority),
    };
  }, [context, contextTestimonial, testimonialType]);

  const getContextMessage = () => {
    switch (context.type) {
      case "testimonial":
        return `Processing ${testimonialType || "single"} testimonial`;
      case "clip":
        return "Processing single clip";
      case "multi-testimonial":
        return `Processing ${context.testimonialIds.length} testimonials`;
      case "selected-clips":
        return `Processing ${context.clipIds.length} selected clips`;
      case "best-moments":
        return "Auto-selecting best testimonials";
      default:
        return "Select a service to begin";
    }
  };

  // Check if a service has been previously processed
  const hasBeenProcessed = (serviceId: ServiceType): boolean => {
    if (context.type !== "testimonial" || !contextTestimonial) return false;

    switch (serviceId) {
      case "clipping":
        return (
          contextTestimonial.artifacts?.some(
            (a) => a.processing_type === "clipping"
          ) || false
        );
      case "platform_optimization":
        return (
          contextTestimonial.artifacts?.some(
            (a) => a.processing_type === "video_platform_optimization"
          ) || false
        );
      case "story_video":
        return (
          contextTestimonial.artifacts?.some(
            (a) =>
              a.processing_type === "story_mode_generation" ||
              a.processing_type === "best_story_moments"
          ) || false
        );
      default:
        return false;
    }
  };

  const renderServiceCard = (
    service: ServiceOption,
    isRecommended: boolean
  ) => {
    const isProcessed = hasBeenProcessed(service.id);

    return (
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card
          className={`group relative overflow-hidden border-2 transition-all duration-300 cursor-pointer h-full ${
            isRecommended
              ? "border-amber-200 bg-gradient-to-br from-white to-amber-50/30"
              : "border-slate-200 bg-white hover:border-slate-300"
          } hover:shadow-xl`}
          onClick={() => onServiceSelect(service.id)}
        >
          {/* Status Badges */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {isRecommended && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] px-2.5 py-1 font-semibold">
                <Zap className="h-3 w-3 mr-1" />
                Top Pick
              </Badge>
            )}
            {isProcessed && (
              <Badge className="bg-green-50 text-green-700 border border-green-200 text-[10px] px-2.5 py-1 font-medium">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Done
              </Badge>
            )}
          </div>

          {/* Header Section */}
          <div className={`p-6 pb-4 border-b ${service.borderColor}`}>
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl ${service.bgColor} ${service.borderColor} border flex items-center justify-center ${service.iconColor} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
              >
                {service.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {service.title}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  <span>{service.estimatedTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 pt-4">
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              {service.description}
            </p>

            {/* Features */}
            <div className="space-y-2.5 mb-6">
              {service.features.slice(0, 4).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${service.bgColor} ${service.borderColor} border mt-1.5 flex-shrink-0`}
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm h-10 font-medium group-hover:bg-slate-800 transition-all"
              size="sm"
            >
              <span>Start Processing</span>
              <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="mb-8 text-slate-600 hover:text-slate-900 hover:bg-slate-100 -ml-2 h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-start justify-between gap-6 flex-wrap mb-6">
            <div className="flex-1 max-w-3xl">
              <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                AI Processing Studio
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                Transform your testimonials with intelligent AI services
              </p>
            </div>

            {context.type !== "default" && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-4 py-2 font-medium"
              >
                <Info className="h-3.5 w-3.5 mr-2" />
                {getContextMessage()}
              </Badge>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Recommended Services Section */}
          {recommendedServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                  <h2 className="text-xl font-bold text-slate-900">
                    Recommended for You
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    {renderServiceCard(service, true)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Other Services Section */}
          {otherServices.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="mb-12"
            >
              {recommendedServices.length > 0 && (
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300" />
                    <h2 className="text-xl font-bold text-slate-900">
                      More Services
                    </h2>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherServices.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: recommendedServices.length * 0.1 + index * 0.1,
                      duration: 0.3,
                    }}
                  >
                    {renderServiceCard(service, false)}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context Help */}
        {context.type === "default" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Info className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  Get Personalized Recommendations
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Select a testimonial from the dashboard to see smart
                  recommendations based on content type and processing history.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Platform Icons Reference */}
        {context.type !== "default" &&
          testimonialType === "video" &&
          (recommendedServices.some((s) => s.id === "platform_optimization") ||
            otherServices.some((s) => s.id === "platform_optimization")) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-16 pt-10 border-t border-slate-200"
            >
              <div className="text-center mb-8">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-6">
                  Supported Platforms
                </p>
                <div className="flex items-center justify-center gap-12">
                  <div className="flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 flex items-center justify-center">
                      <Instagram className="h-7 w-7 text-pink-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      Instagram
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 flex items-center justify-center">
                      <Youtube className="h-7 w-7 text-red-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      YouTube
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 flex items-center justify-center">
                      <Linkedin className="h-7 w-7 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">
                      LinkedIn
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
      </div>
    </div>
  );
};

export default ServiceSelector;
