import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Type, Sliders, ChevronDown, Check, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StageCustomizationProps {
  stageType: string;
  currentConfig?: Record<string, any>;
  onConfigUpdate: (config: Record<string, any>) => void;
  className?: string;
}

interface MusicConfig {
  music_theme?: string;
  music_volume?: string;
  custom_music_url?: string;
}

interface BrandingConfig {
  logo_position?: string;
  logo_size?: string;
  logo_opacity?: number;
}

interface WatermarkConfig {
  watermark_text?: string;
  watermark_position?: string;
  watermark_size?: string;
  watermark_opacity?: number;
}

interface IntroOutroConfig {
  add_intro?: boolean;
  add_outro?: boolean;
}

const MUSIC_THEMES = [
  { value: "corporate", label: "Corporate" },
  { value: "upbeat", label: "Upbeat" },
  { value: "calm", label: "Calm" },
  { value: "professional", label: "Professional" },
  { value: "energetic", label: "Energetic" },
];

const VOLUME_LEVELS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const POSITIONS = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
  { value: "center", label: "Center" },
];

const SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const StageCustomization: React.FC<StageCustomizationProps> = ({
  stageType,
  currentConfig = {},
  onConfigUpdate,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [musicConfig, setMusicConfig] = useState<MusicConfig>({
    music_theme: currentConfig.music_theme || "professional",
    music_volume: currentConfig.music_volume || "medium",
    custom_music_url: currentConfig.custom_music_url || "",
  });

  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>({
    logo_position: currentConfig.logo_position || "bottom-right",
    logo_size: currentConfig.logo_size || "medium",
    logo_opacity: currentConfig.logo_opacity || 0.8,
  });

  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    watermark_text: currentConfig.watermark_text || "",
    watermark_position: currentConfig.watermark_position || "bottom-right",
    watermark_size: currentConfig.watermark_size || "small",
    watermark_opacity: currentConfig.watermark_opacity || 0.5,
  });

  const [introOutroConfig, setIntroOutroConfig] = useState<IntroOutroConfig>({
    add_intro: currentConfig.add_intro ?? true,
    add_outro: currentConfig.add_outro ?? true,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Check if this stage supports customization
  const supportsCustomization = () => {
    return ["mix_music", "apply_branding", "add_intro_outro"].includes(stageType);
  };

  if (!supportsCustomization()) {
    return null;
  }

  const handleMusicConfigChange = (key: keyof MusicConfig, value: any) => {
    setMusicConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleBrandingConfigChange = (
    key: keyof BrandingConfig,
    value: any
  ) => {
    setBrandingConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleWatermarkConfigChange = (
    key: keyof WatermarkConfig,
    value: any
  ) => {
    setWatermarkConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleIntroOutroConfigChange = (
    key: keyof IntroOutroConfig,
    value: any
  ) => {
    setIntroOutroConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleApplyConfig = () => {
    let config = {};

    if (stageType === "mix_music") {
      config = musicConfig;
    } else if (stageType === "apply_branding") {
      config = { ...brandingConfig, ...watermarkConfig };
    } else if (stageType === "add_intro_outro") {
      config = introOutroConfig;
    }

    onConfigUpdate(config);
    setHasChanges(false);
  };

  const renderMusicCustomization = () => (
    <div className="space-y-4">
      {/* Music Theme */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700">
          Music Theme
        </Label>
        <Select
          value={musicConfig.music_theme}
          onValueChange={(value) =>
            handleMusicConfigChange("music_theme", value)
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MUSIC_THEMES.map((theme) => (
              <SelectItem
                key={theme.value}
                value={theme.value}
                className="text-xs"
              >
                {theme.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Music Volume */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700">
          Music Volume
        </Label>
        <Select
          value={musicConfig.music_volume}
          onValueChange={(value) =>
            handleMusicConfigChange("music_volume", value)
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOLUME_LEVELS.map((level) => (
              <SelectItem
                key={level.value}
                value={level.value}
                className="text-xs"
              >
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Music Upload */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-slate-700">
          Custom Music (Optional)
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter music URL or upload"
            value={musicConfig.custom_music_url}
            onChange={(e) =>
              handleMusicConfigChange("custom_music_url", e.target.value)
            }
            className="h-9 text-xs flex-1"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-3 text-xs"
            disabled
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          Leave empty to use default theme music
        </p>
      </div>
    </div>
  );

  const renderBrandingCustomization = () => (
    <div className="space-y-4">
      {/* Logo Settings */}
      <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Image className="h-4 w-4 text-slate-600" />
          <span className="text-xs font-semibold text-slate-700">
            Logo Settings
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Logo Position */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700">
              Position
            </Label>
            <Select
              value={brandingConfig.logo_position}
              onValueChange={(value) =>
                handleBrandingConfigChange("logo_position", value)
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem
                    key={pos.value}
                    value={pos.value}
                    className="text-xs"
                  >
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Logo Size */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700">Size</Label>
            <Select
              value={brandingConfig.logo_size}
              onValueChange={(value) =>
                handleBrandingConfigChange("logo_size", value)
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((size) => (
                  <SelectItem
                    key={size.value}
                    value={size.value}
                    className="text-xs"
                  >
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Logo Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-700">
              Opacity
            </Label>
            <span className="text-xs text-slate-500">
              {Math.round((brandingConfig.logo_opacity || 0.8) * 100)}%
            </span>
          </div>
          <Slider
            value={[(brandingConfig.logo_opacity || 0.8) * 100]}
            onValueChange={(values) =>
              handleBrandingConfigChange("logo_opacity", values[0] / 100)
            }
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
        </div>
      </div>

      {/* Watermark Settings */}
      <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Type className="h-4 w-4 text-slate-600" />
          <span className="text-xs font-semibold text-slate-700">
            Watermark Settings
          </span>
        </div>

        {/* Watermark Text */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-slate-700">Text</Label>
          <Input
            type="text"
            placeholder="Enter watermark text (optional)"
            value={watermarkConfig.watermark_text}
            onChange={(e) =>
              handleWatermarkConfigChange("watermark_text", e.target.value)
            }
            className="h-9 text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Watermark Position */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700">
              Position
            </Label>
            <Select
              value={watermarkConfig.watermark_position}
              onValueChange={(value) =>
                handleWatermarkConfigChange("watermark_position", value)
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSITIONS.map((pos) => (
                  <SelectItem
                    key={pos.value}
                    value={pos.value}
                    className="text-xs"
                  >
                    {pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Watermark Size */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-slate-700">Size</Label>
            <Select
              value={watermarkConfig.watermark_size}
              onValueChange={(value) =>
                handleWatermarkConfigChange("watermark_size", value)
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((size) => (
                  <SelectItem
                    key={size.value}
                    value={size.value}
                    className="text-xs"
                  >
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Watermark Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-slate-700">
              Opacity
            </Label>
            <span className="text-xs text-slate-500">
              {Math.round((watermarkConfig.watermark_opacity || 0.5) * 100)}%
            </span>
          </div>
          <Slider
            value={[(watermarkConfig.watermark_opacity || 0.5) * 100]}
            onValueChange={(values) =>
              handleWatermarkConfigChange("watermark_opacity", values[0] / 100)
            }
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );

  const renderIntroOutroCustomization = () => (
    <div className="space-y-3">
      {/* Info Note */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          Professional branded intro and outro will be added using your workspace branding
        </p>
      </div>

      {/* Intro Toggle */}
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
          introOutroConfig.add_intro
            ? "border-purple-500 bg-purple-50"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
        onClick={() => handleIntroOutroConfigChange("add_intro", !introOutroConfig.add_intro)}
      >
        <input
          type="checkbox"
          checked={introOutroConfig.add_intro}
          onChange={(e) => handleIntroOutroConfigChange("add_intro", e.target.checked)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <Label className="text-xs font-semibold text-slate-900 cursor-pointer">
            Add Intro
          </Label>
          <p className="text-xs text-slate-600 mt-0.5">
            Professional branded opening with voiceover
          </p>
        </div>
      </div>

      {/* Outro Toggle */}
      <div
        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
          introOutroConfig.add_outro
            ? "border-indigo-500 bg-indigo-50"
            : "border-slate-200 bg-white hover:border-slate-300"
        }`}
        onClick={() => handleIntroOutroConfigChange("add_outro", !introOutroConfig.add_outro)}
      >
        <input
          type="checkbox"
          checked={introOutroConfig.add_outro}
          onChange={(e) => handleIntroOutroConfigChange("add_outro", e.target.checked)}
          className="mt-0.5"
        />
        <div className="flex-1">
          <Label className="text-xs font-semibold text-slate-900 cursor-pointer">
            Add Outro
          </Label>
          <p className="text-xs text-slate-600 mt-0.5">
            Professional branded closing with voiceover
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        {/* Header */}
        <div
          className="p-3 cursor-pointer select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-900">
                Customize This Step
              </span>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0">
                Optional
              </Badge>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4 text-blue-600" />
            </motion.div>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {stageType === "mix_music"
              ? "Choose music theme, volume, or upload custom music"
              : stageType === "apply_branding"
              ? "Configure logo and watermark settings"
              : "Configure intro and outro for your video"}
          </p>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-4 border-t border-blue-200/50 pt-3">
                {/* Render appropriate customization UI */}
                {stageType === "mix_music" && renderMusicCustomization()}
                {stageType === "apply_branding" &&
                  renderBrandingCustomization()}
                {stageType === "add_intro_outro" && renderIntroOutroCustomization()}

                {/* Apply Button */}
                <div className="flex items-center justify-between pt-3 border-t border-blue-200/50">
                  <p className="text-xs text-slate-600">
                    {hasChanges
                      ? "Click apply to use your custom settings"
                      : "Using default settings"}
                  </p>
                  <Button
                    size="sm"
                    onClick={handleApplyConfig}
                    disabled={!hasChanges}
                    className="h-8 px-4 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Check className="h-3 w-3 mr-1.5" />
                    {hasChanges ? "Apply Changes" : "Applied"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default StageCustomization;
