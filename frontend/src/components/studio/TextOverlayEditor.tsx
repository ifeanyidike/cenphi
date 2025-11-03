import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  User,
  Briefcase,
  MapPin,
  Palette,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { workspaceHub } from "@/repo/workspace_hub";
import { observer } from "mobx-react-lite";

interface TextOverlayConfig {
  // Intro settings
  enable_intro: boolean;
  workspace_name: string;
  speaker_name: string;
  role: string;
  location: string;
  intro_duration: number;

  // Outro settings
  enable_outro: boolean;
  tagline: string;
  outro_duration: number;

  // Styling
  brand_color: string;
  animation_style: "elegant" | "slide" | "fade" | "pop";
  font_family: string;
}

interface TextOverlayEditorProps {
  config: TextOverlayConfig;
  onConfigChange: (config: TextOverlayConfig) => void;
  videoUrl?: string;
  videoDuration?: number;
}

const ANIMATION_STYLES = [
  {
    id: "elegant" as const,
    name: "Elegant",
    description: "Smooth slide-in with gentle fade",
    icon: "✨",
  },
  {
    id: "slide" as const,
    name: "Slide",
    description: "Fast slide-in from left",
    icon: "→",
  },
  {
    id: "fade" as const,
    name: "Fade",
    description: "Pure fade-in effects",
    icon: "◐",
  },
  {
    id: "pop" as const,
    name: "Pop",
    description: "Scale-up with bounce",
    icon: "⚡",
  },
];

const TextOverlayEditor: React.FC<TextOverlayEditorProps> = ({
  config,
  onConfigChange,
  videoDuration = 60,
}) => {
  // Ensure config has all required defaults
  const [localConfig, setLocalConfig] = useState<TextOverlayConfig>({
    ...config,
    intro_duration: config.intro_duration ?? 4.0,
    outro_duration: config.outro_duration ?? 6.0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  // Keep a stable reference to onConfigChange
  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  // Auto-fill workspace name and brand color from workspace context (only once on mount)
  useEffect(() => {
    const workspace = workspaceHub.workspace;
    const brandContext = workspace?.brand_context;
    if (workspace && !hasInitialized) {
      const updates: Partial<TextOverlayConfig> = {};

      if (!localConfig.workspace_name) {
        updates.workspace_name = workspace.name || "";
      }
      if (!localConfig.brand_color && brandContext?.primary_color) {
        updates.brand_color = brandContext.primary_color;
      }

      if (Object.keys(updates).length > 0) {
        setLocalConfig((prev) => ({ ...prev, ...updates }));
      }
      setHasInitialized(true);
    }
  }, [hasInitialized, localConfig.workspace_name, localConfig.brand_color]);

  // Debounced config change - only depends on localConfig, not onConfigChange
  useEffect(() => {
    // Don't send initial config on mount
    if (!hasInitialized) return;

    const timer = setTimeout(() => {
      onConfigChangeRef.current(localConfig);
    }, 500);
    return () => clearTimeout(timer);
  }, [localConfig, hasInitialized]);

  const handleInputChange = (field: keyof TextOverlayConfig, value: any) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));

    // Validate duration constraints (max 30% of video)
    if (field === "intro_duration" || field === "outro_duration") {
      const maxDuration = videoDuration * 0.3;
      if (value > maxDuration) {
        setErrors((prev) => ({
          ...prev,
          [field]: `Duration exceeds 30% of video (max: ${maxDuration.toFixed(1)}s)`,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }

    // Validate text length
    if (typeof value === "string" && value.length > 500) {
      setErrors((prev) => ({
        ...prev,
        [field]: "Text exceeds 500 characters",
      }));
    }
  };

  const maxIntroDuration = Math.min(videoDuration * 0.3, 10);
  const maxOutroDuration = Math.min(videoDuration * 0.3, 10);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
          <Type className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Text Overlay Configuration
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Add animated brand intro and outro to your video
          </p>
        </div>
      </div>

      {/* Intro Section */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-4 space-y-4">
          {/* Intro Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              <Label className="text-[11px] font-medium">Brand Intro</Label>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                0-{localConfig.intro_duration}s
              </Badge>
            </div>
            <Switch
              checked={localConfig.enable_intro}
              onCheckedChange={(checked) =>
                handleInputChange("enable_intro", checked)
              }
            />
          </div>

          <AnimatePresence>
            {localConfig.enable_intro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                {/* Workspace Name */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Type className="h-3 w-3" />
                    Workspace Name
                  </Label>
                  <Input
                    value={localConfig.workspace_name}
                    onChange={(e) =>
                      handleInputChange("workspace_name", e.target.value)
                    }
                    placeholder="Your Brand Name"
                    className="h-8 text-[11px]"
                  />
                  {errors.workspace_name && (
                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.workspace_name}
                    </p>
                  )}
                </div>

                {/* Speaker Name */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    Speaker Name
                  </Label>
                  <Input
                    value={localConfig.speaker_name}
                    onChange={(e) =>
                      handleInputChange("speaker_name", e.target.value)
                    }
                    placeholder="John Doe"
                    className="h-8 text-[11px]"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3" />
                    Role / Title
                  </Label>
                  <Input
                    value={localConfig.role}
                    onChange={(e) => handleInputChange("role", e.target.value)}
                    placeholder="CEO"
                    className="h-8 text-[11px]"
                  />
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    Location
                  </Label>
                  <Input
                    value={localConfig.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="San Francisco"
                    className="h-8 text-[11px]"
                  />
                </div>

                {/* Intro Duration */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Intro Duration: {localConfig.intro_duration.toFixed(1)}s
                  </Label>
                  <Slider
                    value={[localConfig.intro_duration]}
                    onValueChange={([value]) =>
                      handleInputChange("intro_duration", value)
                    }
                    min={1}
                    max={maxIntroDuration}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-[10px] text-gray-500">
                    Max: {maxIntroDuration.toFixed(1)}s (30% of video)
                  </p>
                  {errors.intro_duration && (
                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.intro_duration}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Outro Section */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-4 space-y-4">
          {/* Outro Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-pink-500" />
              <Label className="text-[11px] font-medium">Brand Outro</Label>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                Last {localConfig.outro_duration}s
              </Badge>
            </div>
            <Switch
              checked={localConfig.enable_outro}
              onCheckedChange={(checked) =>
                handleInputChange("enable_outro", checked)
              }
            />
          </div>

          <AnimatePresence>
            {localConfig.enable_outro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800"
              >
                {/* Tagline */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Type className="h-3 w-3" />
                    Tagline / Call-to-Action
                  </Label>
                  <Input
                    value={localConfig.tagline}
                    onChange={(e) =>
                      handleInputChange("tagline", e.target.value)
                    }
                    placeholder="Share your story with the world"
                    className="h-8 text-[11px]"
                  />
                  {errors.tagline && (
                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.tagline}
                    </p>
                  )}
                </div>

                {/* Outro Duration */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    Outro Duration: {localConfig.outro_duration.toFixed(1)}s
                  </Label>
                  <Slider
                    value={[localConfig.outro_duration]}
                    onValueChange={([value]) =>
                      handleInputChange("outro_duration", value)
                    }
                    min={1}
                    max={maxOutroDuration}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-[10px] text-gray-500">
                    Max: {maxOutroDuration.toFixed(1)}s (30% of video)
                  </p>
                  {errors.outro_duration && (
                    <p className="text-[10px] text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.outro_duration}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Styling Section */}
      <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="h-3.5 w-3.5 text-blue-500" />
            <Label className="text-[11px] font-medium">Style Settings</Label>
          </div>

          {/* Animation Style */}
          <div className="space-y-2">
            <Label className="text-[11px] text-gray-600 dark:text-gray-400">
              Animation Style
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleInputChange("animation_style", style.id)}
                  className={`
                    relative p-3 rounded-lg border-2 text-left transition-all
                    ${
                      localConfig.animation_style === style.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{style.icon}</span>
                        <span className="text-[11px] font-medium">
                          {style.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">
                        {style.description}
                      </p>
                    </div>
                    {localConfig.animation_style === style.id && (
                      <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg
                          className="h-2.5 w-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Color */}
          <div className="space-y-1.5">
            <Label className="text-[11px] text-gray-600 dark:text-gray-400">
              Brand Color
            </Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={localConfig.brand_color || "#3B82F6"}
                onChange={(e) =>
                  handleInputChange("brand_color", e.target.value)
                }
                className="h-8 w-16 p-1 cursor-pointer"
              />
              <Input
                type="text"
                value={localConfig.brand_color || "#3B82F6"}
                onChange={(e) =>
                  handleInputChange("brand_color", e.target.value)
                }
                placeholder="#3B82F6"
                className="h-8 text-[11px] flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary */}
      {(localConfig.enable_intro || localConfig.enable_outro) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-blue-900 dark:text-blue-100">
                Text Overlay Summary
              </p>
              <ul className="text-[10px] text-blue-700 dark:text-blue-300 space-y-0.5">
                {localConfig.enable_intro && (
                  <li>
                    • Intro: {localConfig.intro_duration}s with{" "}
                    {localConfig.animation_style} animation
                  </li>
                )}
                {localConfig.enable_outro && (
                  <li>• Outro: {localConfig.outro_duration}s with tagline</li>
                )}
                {Object.keys(errors).length > 0 && (
                  <li className="text-red-600 dark:text-red-400">
                    ⚠️ {Object.keys(errors).length} validation error(s)
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default observer(TextOverlayEditor);
