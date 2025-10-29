// components/TestimonialDetail/AIFeaturesDiscovery.tsx - Redesigned

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Testimonial, TestimonialArtifact } from "@/types/testimonial";
import {
  Sparkles,
  Scissors,
  Target,
  Video,
  FileText,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { observer } from "mobx-react-lite";

interface AIFeaturesDiscoveryProps {
  testimonialType: "video" | "text";
  artifacts: TestimonialArtifact[];
  testimonial: Testimonial;
  onFeatureClick: (serviceType: string) => void;
  onViewAllFeatures: () => void;
}

// Essential services only
const SERVICES = {
  clipping: {
    icon: Scissors,
    name: "Smart Clipping",
    desc: "Extract key moments",
    videoOnly: true,
  },
  story_mode_generation: {
    icon: Video,
    name: "Story Videos",
    desc: "Create narratives",
    videoOnly: true,
  },
  platform_optimizer: {
    icon: Target,
    name: "Platform Optimizer",
    desc: "Social media ready",
    videoOnly: true,
  },
  content_generation: {
    icon: FileText,
    name: "Content Generation",
    desc: "Marketing copy",
    videoOnly: false,
  },
};

const AIFeaturesDiscovery: React.FC<AIFeaturesDiscoveryProps> = ({
  testimonialType,
  artifacts,
  onFeatureClick,
}) => {
  const isVideo = testimonialType === "video";

  // Check which services are completed
  const completedServices = new Set(
    artifacts.map((a) => a.processing_type as string)
  );

  const availableServices = Object.entries(SERVICES).filter(
    ([, config]) => !config.videoOnly || isVideo
  );

  if (availableServices.length === 0) return null;

  return (
    <Card className="border border-slate-200 bg-white overflow-hidden">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                AI Processing
              </h3>
              <p className="text-[10px] text-slate-500">
                {completedServices.size} of {availableServices.length} completed
              </p>
            </div>
          </div>
        </div>

        {/* Services - Compact vertical list */}
        <div className="space-y-2">
          {availableServices.map(([key, config]) => {
            const Icon = config.icon;
            const isCompleted = completedServices.has(key);

            return (
              <button
                key={key}
                onClick={() => onFeatureClick(key)}
                className="group relative w-full p-3 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all text-left flex items-center gap-3"
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-blue-100 flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="h-3.5 w-3.5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-900 mb-0.5">
                    {config.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 truncate">
                    {config.desc}
                  </p>
                </div>

                {/* Status */}
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

        {/* Completion Status */}
        {completedServices.size === availableServices.length && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 text-[10px] text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              <span className="font-medium">All features completed</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default observer(AIFeaturesDiscovery);
