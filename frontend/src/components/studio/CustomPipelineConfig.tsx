import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Music,
  Volume2,
  Image as ImageIcon,
  Sparkles,
  Type,
  GripVertical,
  Plus,
  X,
  Zap,
  Settings2,
  CheckCircle2,
  Crop,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudioContext } from "@/pages/Studio";
import { studioAPI } from "@/services/studioAPI";
import { workspaceHub } from "@/repo/workspace_hub";
import { backgroundMusicOptions } from "@/components/studio/constants";
import {
  AspectRatioSelector,
  PlatformSelector,
  DEFAULT_PLATFORMS,
  type AspectRatio,
} from "@/components/common/platform-selection";
import ErrorModal from "./ErrorModal";

interface CustomPipelineConfigProps {
  context: StudioContext;
  onBack: () => void;
  onStartProcessing: (jobId: string) => void;
}

interface PipelineStep {
  id: string;
  type:
    | "music_mix"
    | "noise_removal"
    | "branding"
    | "audio_normalization"
    | "captions"
    | "crop_resize"
    | "enhancement";
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  gradient: string;
  requiresConfig?: boolean;
  configExpanded?: boolean;
}

const AVAILABLE_STEPS: Omit<PipelineStep, "enabled" | "configExpanded">[] = [
  {
    id: "crop_resize",
    type: "crop_resize",
    name: "Crop & Resize",
    description: "Adjust video aspect ratio for platform",
    icon: <Crop className="h-4 w-4" />,
    gradient: "from-cyan-500 to-blue-500",
    requiresConfig: true,
  },
  {
    id: "music_mix",
    type: "music_mix",
    name: "Mix Background Music",
    description: "Add background music to your video",
    icon: <Music className="h-4 w-4" />,
    gradient: "from-pink-500 to-rose-500",
    requiresConfig: true,
  },
  {
    id: "noise_removal",
    type: "noise_removal",
    name: "Remove Noise",
    description: "Clean up audio by removing background noise",
    icon: <Volume2 className="h-4 w-4" />,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "branding",
    type: "branding",
    name: "Add Branding",
    description: "Apply logo and watermark",
    icon: <ImageIcon className="h-4 w-4" />,
    gradient: "from-purple-500 to-indigo-500",
    requiresConfig: true,
  },
  {
    id: "audio_normalization",
    type: "audio_normalization",
    name: "Normalize Audio",
    description: "Balance audio levels for consistent volume",
    icon: <Zap className="h-4 w-4" />,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "captions",
    type: "captions",
    name: "Burn Captions",
    description: "Add hardcoded subtitles to video",
    icon: <Type className="h-4 w-4" />,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "enhancement",
    type: "enhancement",
    name: "Enhance Quality",
    description: "AI-powered video enhancement",
    icon: <Sparkles className="h-4 w-4" />,
    gradient: "from-violet-500 to-purple-500",
  },
];

const CustomPipelineConfig: React.FC<CustomPipelineConfigProps> = observer(({
  context,
  onBack,
  onStartProcessing,
}) => {
  const [selectedSteps, setSelectedSteps] = useState<PipelineStep[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: "" });

  // Music configuration
  const [musicConfig, setMusicConfig] = useState({
    background_music: "corporate",
    music_volume: "medium" as "low" | "medium" | "high",
    custom_music_url: "",
  });

  // Crop configuration with aspect ratio state
  const [cropConfig, setCropConfig] = useState({
    aspectRatio: "9:16" as AspectRatio,
    target_platform: "tiktok", // Default to TikTok for 9:16
  });

  const handleCropAspectRatioChange = (ratio: AspectRatio) => {
    setCropConfig({
      aspectRatio: ratio,
      target_platform: DEFAULT_PLATFORMS[ratio],
    });
  };

  // Branding configuration
  const [brandingConfig, setBrandingConfig] = useState({
    logo_url: "",
    watermark_text: "",
    logo_position: "top-right" as
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right",
    watermark_position: "bottom-right" as
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center",
  });

  // Load brand context defaults
  useEffect(() => {
    const brandContext = workspaceHub.workspace?.brand_context;
    if (brandContext?.logo_url) {
      setBrandingConfig((prev) => ({
        ...prev,
        logo_url: brandContext.logo_url || "",
        watermark_text:
          brandContext.company_name || workspaceHub.workspace?.name || "",
      }));
    }
  }, []);

  const addStep = (step: (typeof AVAILABLE_STEPS)[0]) => {
    if (selectedSteps.find((s) => s.id === step.id)) return;
    setSelectedSteps([
      ...selectedSteps,
      { ...step, enabled: true, configExpanded: step.requiresConfig },
    ]);
  };

  const removeStep = (stepId: string) => {
    setSelectedSteps(selectedSteps.filter((s) => s.id !== stepId));
  };

  const toggleStep = (stepId: string) => {
    setSelectedSteps(
      selectedSteps.map((s) =>
        s.id === stepId ? { ...s, enabled: !s.enabled } : s
      )
    );
  };

  const toggleConfig = (stepId: string) => {
    setSelectedSteps(
      selectedSteps.map((s) =>
        s.id === stepId ? { ...s, configExpanded: !s.configExpanded } : s
      )
    );
  };

  const handleStart = async () => {
    if (selectedSteps.filter((s) => s.enabled).length === 0) {
      setErrorModal({
        isOpen: true,
        message: "Please select at least one processing step",
      });
      return;
    }

    try {
      setIsStarting(true);

      const workspaceId = workspaceHub.workspace?.id;
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }

      let testimonialId: string | undefined;
      let clipId: string | undefined;
      let clipIds: string[] | undefined;

      if (context.type === "testimonial") {
        testimonialId = context.testimonialId;
      } else if (context.type === "clip") {
        testimonialId = context.testimonialId;
        clipId = context.clipId;
      } else if (context.type === "selected-clips") {
        testimonialId = context.testimonialId;
        clipIds = context.clipIds;
      }

      if (!testimonialId) {
        throw new Error("Please select a testimonial or clip to process");
      }

      // Build config with music, branding, and crop settings
      const hasMusicStep = selectedSteps.some(
        (s) => s.enabled && s.type === "music_mix"
      );
      const hasBrandingStep = selectedSteps.some(
        (s) => s.enabled && s.type === "branding"
      );
      const hasCropStep = selectedSteps.some(
        (s) => s.enabled && s.type === "crop_resize"
      );

      const config: any = {
        clip_id: clipId,
        clip_ids: clipIds,
        source_type: clipId ? "clip" : clipIds ? "clips" : "testimonial",
        custom_steps: selectedSteps
          .filter((s) => s.enabled)
          .map((s, idx) => ({
            id: s.id,
            type: s.type,
            order: idx,
            config: {},
          })),
      };

      // Add crop config if crop step is enabled
      if (hasCropStep) {
        config.target_platform = cropConfig.target_platform;
      }

      // Add music config if music step is enabled
      if (hasMusicStep) {
        config.add_background_music = true;
        config.background_music = musicConfig.background_music;
        config.music_volume = musicConfig.music_volume;
        if (musicConfig.custom_music_url) {
          config.custom_music_url = musicConfig.custom_music_url;
        }
      }

      // Add branding config if branding step is enabled
      if (hasBrandingStep) {
        config.add_branding = true;
        config.include_logo = !!brandingConfig.logo_url;
        config.include_watermark = !!brandingConfig.watermark_text;
        config.logo_url = brandingConfig.logo_url;
        config.watermark_text = brandingConfig.watermark_text;
        config.logo_position = brandingConfig.logo_position;
        config.watermark_position = brandingConfig.watermark_position;
      }

      // Create session for custom pipeline
      const session = await studioAPI.createSession({
        testimonial_id: testimonialId,
        workspace_id: workspaceId,
        pipeline_type: "custom_pipeline",
        selected_stages: selectedSteps
          .filter((s) => s.enabled)
          .map((s) => s.type),
        auto_proceed: true, // Custom pipeline runs all steps
        config,
      });

      onStartProcessing(session.session_id);
    } catch (error: any) {
      console.error("Failed to start custom pipeline:", error);
      setErrorModal({
        isOpen: true,
        message: error.message || "Failed to create session. Please try again.",
      });
      setIsStarting(false);
    }
  };

  const getSourceInfo = () => {
    if (context.type === "clip") return "Single Clip";
    if (context.type === "selected-clips")
      return `${context.clipIds.length} Clips`;
    if (context.type === "testimonial") return "Testimonial";
    return "Unknown";
  };

  const renderStepConfig = (step: PipelineStep) => {
    if (step.type === "crop_resize") {
      return (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
            {/* Step 1: Aspect Ratio */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Choose Aspect Ratio
              </Label>
              <AspectRatioSelector
                selected={cropConfig.aspectRatio}
                onChange={handleCropAspectRatioChange}
              />
            </div>

            {/* Step 2: Platform */}
            {cropConfig.aspectRatio && (
              <div>
                <PlatformSelector
                  aspectRatio={cropConfig.aspectRatio}
                  selected={cropConfig.target_platform}
                  onChange={(platformId) =>
                    setCropConfig((prev) => ({
                      ...prev,
                      target_platform: platformId,
                    }))
                  }
                />
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    if (step.type === "music_mix") {
      return (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
            {/* Music Theme Selection */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Music Theme
              </Label>
              <Select
                value={musicConfig.background_music}
                onValueChange={(value) =>
                  setMusicConfig((prev) => ({
                    ...prev,
                    background_music: value,
                  }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {backgroundMusicOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{option.name}</span>
                        {option.mood && (
                          <span className="text-xs text-slate-500">
                            • {option.mood}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Volume Level */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Volume Level
              </Label>
              <Select
                value={musicConfig.music_volume}
                onValueChange={(value: "low" | "medium" | "high") =>
                  setMusicConfig((prev) => ({
                    ...prev,
                    music_volume: value,
                  }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-3 w-3" />
                      <span>Low</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5" />
                      <span>High</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Music URL */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Custom Music URL (Optional)
              </Label>
              <Input
                type="url"
                placeholder="https://example.com/music.mp3"
                value={musicConfig.custom_music_url}
                onChange={(e) =>
                  setMusicConfig((prev) => ({
                    ...prev,
                    custom_music_url: e.target.value,
                  }))
                }
                className="h-9 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Provide a direct link to your own music file
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

    if (step.type === "branding") {
      return (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
            {/* Logo URL */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Logo URL
              </Label>
              <Input
                type="url"
                placeholder="https://example.com/logo.png"
                value={brandingConfig.logo_url}
                onChange={(e) =>
                  setBrandingConfig((prev) => ({
                    ...prev,
                    logo_url: e.target.value,
                  }))
                }
                className="h-9 text-sm"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Direct link to your logo (PNG, SVG recommended)
              </p>
            </div>

            {/* Logo Position */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Logo Position
              </Label>
              <Select
                value={brandingConfig.logo_position}
                onValueChange={(
                  value:
                    | "top-left"
                    | "top-right"
                    | "bottom-left"
                    | "bottom-right"
                ) =>
                  setBrandingConfig((prev) => ({
                    ...prev,
                    logo_position: value,
                  }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Watermark Text */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Watermark Text
              </Label>
              <Input
                type="text"
                placeholder="Your Company Name"
                value={brandingConfig.watermark_text}
                onChange={(e) =>
                  setBrandingConfig((prev) => ({
                    ...prev,
                    watermark_text: e.target.value,
                  }))
                }
                className="h-9 text-sm"
              />
            </div>

            {/* Watermark Position */}
            <div>
              <Label className="text-xs font-medium text-slate-700 mb-2 block">
                Watermark Position
              </Label>
              <Select
                value={brandingConfig.watermark_position}
                onValueChange={(
                  value:
                    | "top-left"
                    | "top-right"
                    | "bottom-left"
                    | "bottom-right"
                    | "center"
                ) =>
                  setBrandingConfig((prev) => ({
                    ...prev,
                    watermark_position: value,
                  }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={onBack}
          size="sm"
          className="mb-4 text-slate-600 hover:text-slate-900 -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
              Custom Pipeline Builder
            </h1>
            <p className="text-sm text-slate-600">
              Create your own processing workflow · Source: {getSourceInfo()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-3 py-1"
            >
              {selectedSteps.filter((s) => s.enabled).length} steps active
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Available Steps - Sidebar */}
        <div className="lg:col-span-4">
          <Card className="p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                Available Steps
              </h2>
            </div>
            <p className="text-xs text-slate-600 mb-5">
              Click to add processing steps to your pipeline
            </p>

            <div className="space-y-2">
              {AVAILABLE_STEPS.map((step) => {
                const isAdded = selectedSteps.find((s) => s.id === step.id);
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => addStep(step)}
                    disabled={!!isAdded}
                    whileHover={!isAdded ? { scale: 1.02, x: 4 } : {}}
                    whileTap={!isAdded ? { scale: 0.98 } : {}}
                    className={`w-full p-3 rounded-lg border transition-all text-left group ${
                      isAdded
                        ? "border-slate-200 bg-slate-50/50 opacity-50 cursor-not-allowed"
                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
                      >
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 mb-0.5">
                          {step.name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {step.description}
                        </p>
                      </div>
                      {isAdded ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <Plus className="h-4 w-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Pipeline Builder - Main Content */}
        <div className="lg:col-span-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-base font-semibold text-slate-900">
                  Your Pipeline
                </h2>
              </div>
              {selectedSteps.length > 0 && (
                <p className="text-xs text-slate-600">
                  Drag to reorder · Toggle to enable/disable
                </p>
              )}
            </div>

            {selectedSteps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
                  <Zap className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  No steps added yet
                </h3>
                <p className="text-xs text-slate-600 max-w-xs">
                  Select processing steps from the left sidebar to build your
                  custom pipeline
                </p>
              </div>
            ) : (
              <>
                <Reorder.Group
                  axis="y"
                  values={selectedSteps}
                  onReorder={setSelectedSteps}
                  className="space-y-3 mb-6"
                >
                  {selectedSteps.map((step, index) => (
                    <Reorder.Item key={step.id} value={step}>
                      <Card
                        className={`overflow-hidden transition-all ${
                          step.enabled
                            ? "border-slate-200 shadow-sm"
                            : "border-slate-200 bg-slate-50 opacity-60"
                        }`}
                      >
                        {/* Step Header */}
                        <div className="p-4">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-slate-400 cursor-move flex-shrink-0" />
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-semibold flex-shrink-0">
                              {index + 1}
                            </div>
                            <div
                              className={`w-9 h-9 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center text-white shadow-sm flex-shrink-0`}
                            >
                              {step.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-slate-900">
                                {step.name}
                              </h3>
                              <p className="text-xs text-slate-600">
                                {step.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {step.requiresConfig && step.enabled && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleConfig(step.id)}
                                  className="h-8 w-8 p-0 hover:bg-slate-100"
                                >
                                  <Settings2
                                    className={`h-4 w-4 transition-transform ${
                                      step.configExpanded
                                        ? "text-blue-600 rotate-90"
                                        : "text-slate-600"
                                    }`}
                                  />
                                </Button>
                              )}
                              <Checkbox
                                checked={step.enabled}
                                onCheckedChange={() => toggleStep(step.id)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeStep(step.id)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Inline Config Section */}
                          <AnimatePresence>
                            {step.requiresConfig &&
                              step.enabled &&
                              step.configExpanded &&
                              renderStepConfig(step)}
                          </AnimatePresence>
                        </div>
                      </Card>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                {/* Start Button */}
                <div className="pt-5 border-t border-slate-200">
                  <Button
                    onClick={handleStart}
                    disabled={
                      isStarting ||
                      selectedSteps.filter((s) => s.enabled).length === 0
                    }
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/25"
                  >
                    {isStarting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Starting Pipeline...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Processing (
                        {selectedSteps.filter((s) => s.enabled).length} steps)
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <ErrorModal
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: "" })}
      />
    </div>
  );
});

export default CustomPipelineConfig;
