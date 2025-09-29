// components/TestimonialDetail/AIFeaturesDiscovery.tsx

import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Scissors,
  Target,
  Video,
  Volume2,
  FileText,
  Brain,
  ArrowRight,
  Clock,
  Loader2,
  AlertCircle,
  Zap,
  CheckCircle2,
  TrendingUp,
  Award,
} from "lucide-react";

// Enhanced Service Configuration with sophisticated design system
const SERVICE_CONFIGS = {
  clipping: {
    icon: Scissors,
    title: "Smart Clipping",
    description: "Extract impactful moments automatically",
    gradient: "from-gray-500 to-gray-600",
    accentColor: "bg-gray-50/80 border-gray-200/50",
    textColor: "text-gray-700",
    hoverColor: "hover:bg-gray-50/50",
    benefits: [
      "Auto-detect highlights",
      "Engagement scoring",
      "Multiple themes",
    ],
    estimatedTime: "2-3 min",
    category: "extraction",
  },
  story_mode_generation: {
    icon: Video,
    title: "Story Videos",
    description: "Create compelling narrative videos",
    gradient: "from-gray-500 to-gray-600",
    accentColor: "bg-gray-50/80 border-gray-200/50",
    textColor: "text-gray-700",
    hoverColor: "hover:bg-gray-50/50",
    benefits: [
      "Smart transitions",
      "Music integration",
      "Professional editing",
    ],
    estimatedTime: "3-5 min",
    category: "creation",
  },
  enhancement: {
    icon: Sparkles,
    title: "AI Enhancement",
    description: "Improve video quality with AI",
    gradient: "from-gray-500 to-gray-600",
    accentColor: "bg-gray-50/80 border-gray-200/50",
    textColor: "text-gray-700",
    hoverColor: "hover:bg-gray-50/50",
    benefits: ["4K upscaling", "Noise reduction", "Color correction"],
    estimatedTime: "5-8 min",
    category: "improvement",
  },
  platform_optimizer: {
    icon: Target,
    title: "Platform Optimizer",
    description: "Optimize for social media platforms",
    gradient: "from-gray-500 to-gray-600",
    accentColor: "bg-gray-50/80 border-gray-200/50",
    textColor: "text-gray-700",
    hoverColor: "hover:bg-gray-50/50",
    benefits: ["Multi-platform sizing", "Auto captions", "Platform-specific"],
    estimatedTime: "1-2 min",
    category: "optimization",
  },
  text_polishing: {
    icon: FileText,
    title: "Content Polishing",
    description: "Enhance and refine your text",
    gradient: "from-gray-500 to-gray-600",
    accentColor: "bg-gray-50/80 border-gray-200/50",
    textColor: "text-gray-700",
    hoverColor: "hover:bg-gray-50/50",
    benefits: [
      "Grammar perfection",
      "Style enhancement",
      "Clarity improvement",
    ],
    estimatedTime: "1-2 min",
    category: "refinement",
  },
  narration: {
    icon: Volume2,
    title: "AI Narration",
    description: "Convert text to natural speech",
    gradient: "from-gray-500 to-gray-600",
    accentColor: "bg-gray-50/80 border-gray-200/50",
    textColor: "text-gray-700",
    hoverColor: "hover:bg-gray-50/50",
    benefits: ["Natural voices", "Multiple languages", "Professional quality"],
    estimatedTime: "2-4 min",
    category: "transformation",
  },
  content_generation: {
    icon: Brain,
    title: "Content Generation",
    description: "Generate marketing content",
    gradient: "from-gray-500 to-gray-600",
    accentColor: "bg-gray-50/80 border-gray-200/50",
    textColor: "text-gray-700",
    hoverColor: "hover:bg-gray-50/50",
    benefits: ["Multiple formats", "Brand-aligned", "Ready to use"],
    estimatedTime: "2-3 min",
    category: "generation",
  },
};

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  benefits: string[];
  status: "available" | "processing" | "completed";
  resultsCount?: number;
  estimatedTime?: string;
  gradient?: string;
  accentColor?: string;
  textColor?: string;
  hoverColor?: string;
  category?: string;
}

interface AIFeaturesDiscoveryProps {
  testimonialType: "video" | "text";
  artifacts: any[];
  onFeatureClick: (feature: string) => void;
  onViewAllFeatures: () => void;
}

interface FeatureCardProps {
  feature: AIFeature;
  onFeatureClick: (featureId: string) => void;
}

// Premium Feature Card Component
const FeatureCard: React.FC<FeatureCardProps> = ({
  feature,
  onFeatureClick,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const IconComponent = feature.icon;
  const config = SERVICE_CONFIGS[feature.id as keyof typeof SERVICE_CONFIGS];

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer group ${
          feature.status === "completed"
            ? `${config?.accentColor || "bg-green-50/80 border-green-200/50"} shadow-lg shadow-green-100/50`
            : "border-gray-200/80 hover:border-gray-300/80 hover:shadow-xl hover:shadow-gray-100/50 bg-white"
        }`}
        onClick={() => onFeatureClick(feature.id)}
      >
        {/* Subtle Top Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config?.gradient || "from-gray-400 to-gray-500"} opacity-60`}
        />

        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-start gap-3">
              <motion.div
                className={`p-3 rounded-xl bg-gradient-to-br ${config?.gradient || "from-gray-400 to-gray-500"} text-white shadow-sm ring-1 ring-black/5`}
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <IconComponent className="h-5 w-5" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              {feature.status === "completed" ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {feature.resultsCount && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-medium px-2 py-0.5">
                      {feature.resultsCount}{" "}
                      {feature.resultsCount === 1 ? "result" : "results"}
                    </Badge>
                  )}
                </div>
              ) : feature.status === "processing" ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                    Processing
                  </Badge>
                </div>
              ) : (
                <Zap className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {feature.benefits.slice(0, 3).map((benefit, idx) => (
                <motion.span
                  key={idx}
                  className="text-xs bg-gray-100/70 text-gray-700 px-3 py-1.5 rounded-lg font-medium border border-gray-200/50"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.1 }}
                >
                  {benefit}
                </motion.span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">
                  {feature.estimatedTime}
                </span>
              </div>
              <motion.div
                className="flex items-center gap-2"
                animate={{ x: isHovered ? 4 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <span
                  className={`text-sm font-medium ${
                    feature.status === "completed"
                      ? "text-emerald-700"
                      : "text-blue-700"
                  }`}
                >
                  {feature.status === "completed"
                    ? "View Results"
                    : "Start Processing"}
                </span>
                <ArrowRight
                  className={`h-4 w-4 ${
                    feature.status === "completed"
                      ? "text-emerald-600"
                      : "text-blue-600"
                  }`}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${config?.gradient || "from-gray-400 to-gray-500"} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
        />
      </div>
    </motion.div>
  );
};

interface FeatureStatsProps {
  features: AIFeature[];
  testimonialType: "video" | "text";
}

// Enhanced Stats Summary Component
const FeatureStats: React.FC<FeatureStatsProps> = ({ features }) => {
  const completedCount = features.filter(
    (f) => f.status === "completed"
  ).length;
  const totalFeatures = features.length;
  const progressPercentage = (completedCount / totalFeatures) * 100;

  return (
    <div className="bg-gradient-to-br from-slate-50/80 to-white border border-gray-200/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-semibold text-gray-900">
            Processing Overview
          </h4>
          <p className="text-sm text-gray-600">
            Track your AI transformation progress
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {completedCount}/{totalFeatures}
          </div>
          <div className="text-xs text-gray-500">Features Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gray-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white/80 rounded-lg p-3 border border-gray-100/80">
          <div className="text-sm font-bold text-gray-900">
            {features.filter((f) => f.status === "available").length}
          </div>
          <div className="text-xs text-gray-500">Available</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 border border-gray-100/80">
          <div className="text-sm font-bold text-gray-900">
            {features.filter((f) => f.status === "processing").length}
          </div>
          <div className="text-xs text-gray-500">Processing</div>
        </div>
        <div className="bg-white/80 rounded-lg p-3 border border-gray-100/80">
          <div className="text-sm font-bold text-gray-900">
            {completedCount}
          </div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>
    </div>
  );
};

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  benefits: string[];
  status: "available" | "processing" | "completed";
  resultsCount?: number;
  estimatedTime?: string;
}

interface AIFeaturesDiscoveryProps {
  testimonialType: "video" | "text";
  artifacts: any[];
  onFeatureClick: (feature: string) => void;
  onViewAllFeatures: () => void;
}

// Main Enhanced AI Features Discovery Component (Clean Focus)
const AIFeaturesDiscovery = observer(
  ({
    testimonialType,
    artifacts,
    onFeatureClick,
    onViewAllFeatures,
  }: AIFeaturesDiscoveryProps) => {
    const [error, setError] = useState(null);

    const getFeatureStatus = (
      featureId: string
    ): "available" | "processing" | "completed" => {
      const relatedArtifacts = artifacts.filter(
        (artifact) =>
          artifact.processing_type?.includes(featureId) ||
          featureId.includes(artifact.processing_type?.split("_")[0] || "")
      );
      return relatedArtifacts.length > 0 ? "completed" : "available";
    };

    const getResultsCount = (featureId: string): number => {
      return artifacts.filter(
        (artifact) =>
          artifact.processing_type?.includes(featureId) ||
          featureId.includes(artifact.processing_type?.split("_")[0] || "")
      ).length;
    };

    const videoFeatures = [
      {
        id: "clipping",
        ...SERVICE_CONFIGS.clipping,
        status: getFeatureStatus("clipping"),
        resultsCount: getResultsCount("clipping"),
      },
      {
        id: "story_mode_generation",
        ...SERVICE_CONFIGS.story_mode_generation,
        status: getFeatureStatus("story_mode"),
        resultsCount: getResultsCount("story_mode"),
      },
      {
        id: "enhancement",
        ...SERVICE_CONFIGS.enhancement,
        status: getFeatureStatus("enhancement"),
        resultsCount: getResultsCount("enhancement"),
      },
      {
        id: "platform_optimizer",
        ...SERVICE_CONFIGS.platform_optimizer,
        status: getFeatureStatus("platform"),
        resultsCount: getResultsCount("platform"),
      },
    ];

    const textFeatures = [
      {
        id: "text_polishing",
        ...SERVICE_CONFIGS.text_polishing,
        status: getFeatureStatus("text_polishing"),
        resultsCount: getResultsCount("text_polishing"),
      },
      {
        id: "narration",
        ...SERVICE_CONFIGS.narration,
        status: getFeatureStatus("narration"),
        resultsCount: getResultsCount("narration"),
      },
      {
        id: "content_generation",
        ...SERVICE_CONFIGS.content_generation,
        status: getFeatureStatus("content_generation"),
        resultsCount: getResultsCount("content_generation"),
      },
    ];

    const features = testimonialType === "video" ? videoFeatures : textFeatures;
    const hasCompletedFeatures = features.some((f) => f.status === "completed");

    if (error) {
      return (
        <Card className="border border-red-200/50 shadow-lg shadow-red-100/50 bg-gradient-to-br from-white to-red-50/20">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-red-900 mb-2">
              Unable to Load Features
            </h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <Button size="sm" variant="outline" onClick={() => setError(null)}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Main AI Features Card - Ultra Premium Design */}
        <Card className="border border-gray-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center"
                  whileHover={{ scale: 1.05, rotate: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sparkles className="h-5 w-5 text-white" />
                </motion.div>
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-1">
                    AI-Powered Features
                  </CardTitle>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Transform your {testimonialType} testimonial with
                    intelligent processing
                  </p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-900 border-blue-200/50 text-xs">
                  {features.filter((f) => f.status === "completed").length} of{" "}
                  {features.length} completed
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Feature Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <FeatureCard
                    feature={feature}
                    onFeatureClick={onFeatureClick}
                  />
                </motion.div>
              ))}
            </div>

            {/* Stats Summary */}
            <FeatureStats
              features={features}
              testimonialType={testimonialType}
            />

            {/* Action Section */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={onViewAllFeatures}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Brain className="h-4 w-4 mr-2" />
                Explore Advanced Features
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              {hasCompletedFeatures && (
                <Button
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 text-gray-700"
                  onClick={() => onFeatureClick("view_results")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View All Results
                </Button>
              )}
            </div>

            {/* Achievement Badge for Completed Features */}
            {hasCompletedFeatures && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-900">
                      Processing Complete!
                    </h4>
                    <p className="text-xs text-emerald-700">
                      Your content has been enhanced with AI. View results in
                      the Artifacts tab.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="ml-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={onViewAllFeatures}
                  >
                    View Results
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights Card */}
        {artifacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border border-gray-200/50 bg-gradient-to-br from-white to-slate-50/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">
                        {artifacts.length} artifacts generated
                      </h4>
                      <p className="text-sm text-gray-600">
                        Ready for download and further processing
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewAllFeatures}
                    className="text-blue-700 hover:bg-blue-50"
                  >
                    Manage Content
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }
);

export default AIFeaturesDiscovery;
