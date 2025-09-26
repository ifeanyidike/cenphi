// components/ai-studio/service-config/PlatformOptimizerConfig.tsx
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Target,
  FileText,
  VolumeX,
  Crop,
  Hash,
  Scissors,
  Volume2,
  Sparkles,
} from "lucide-react";
import BackgroundMusicSelector from "./BackgroundMusicSelector";
import BrandingSelector from "./BrandingSelector";
import { PlatformOptimizerConfig as OptimizerConfig } from "@/types/ai-service";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: OptimizerConfig;
};

const PlatformOptimizerConfig = ({ updateConfig, config }: Props) => {
  const platforms = [
    {
      value: "instagram_story",
      label: "Instagram Story",
      aspectRatio: "9:16",
      icon: "📱",
      category: "Instagram",
    },
    {
      value: "instagram_reels",
      label: "Instagram Reels",
      aspectRatio: "9:16",
      icon: "🎬",
      category: "Instagram",
    },
    {
      value: "instagram_feed",
      label: "Instagram Feed",
      aspectRatio: "1:1 / 4:5",
      icon: "📷",
      category: "Instagram",
    },
    {
      value: "instagram",
      label: "Instagram General",
      aspectRatio: "1:1",
      icon: "📸",
      category: "Instagram",
    },
    {
      value: "tiktok",
      label: "TikTok",
      aspectRatio: "9:16",
      icon: "🎵",
      category: "TikTok",
    },
    {
      value: "youtube_shorts",
      label: "YouTube Shorts",
      aspectRatio: "9:16",
      icon: "📺",
      category: "YouTube",
    },
    {
      value: "youtube_standard",
      label: "YouTube Standard",
      aspectRatio: "16:9",
      icon: "🎥",
      category: "YouTube",
    },
    {
      value: "linkedin",
      label: "LinkedIn",
      aspectRatio: "16:9",
      icon: "💼",
      category: "Professional",
    },
    {
      value: "twitter",
      label: "Twitter",
      aspectRatio: "16:9",
      icon: "🐦",
      category: "Social",
    },
    {
      value: "facebook",
      label: "Facebook",
      aspectRatio: "16:9",
      icon: "👥",
      category: "Social",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Selection */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Platform Selection
              </h3>
              <p className="text-xs text-gray-500">
                Choose target platform for optimization
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Target Platform
                </Label>
                <Select
                  value={config.target_platform || ""}
                  onValueChange={(value) =>
                    updateConfig("target_platform", value)
                  }
                >
                  <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-gray-400">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{platform.icon}</span>
                            <div>
                              <div className="font-medium text-sm">
                                {platform.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {platform.category}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 ml-4">
                            {platform.aspectRatio}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Optimization Quality
                </Label>
                <Select
                  value={config.optimization_quality || "high"}
                  onValueChange={(value) =>
                    updateConfig("optimization_quality", value)
                  }
                >
                  <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-gray-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="py-1">
                        <div className="font-medium text-sm">High Quality</div>
                        <div className="text-xs text-gray-500">
                          Best results, slower processing
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="py-1">
                        <div className="font-medium text-sm">
                          Medium Quality
                        </div>
                        <div className="text-xs text-gray-500">
                          Balanced quality and speed
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="py-1">
                        <div className="font-medium text-sm">
                          Standard Quality
                        </div>
                        <div className="text-xs text-gray-500">
                          Fastest processing
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {config.target_platform && (
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    Platform:{" "}
                    {
                      platforms.find((p) => p.value === config.target_platform)
                        ?.label
                    }
                  </span>
                  <span className="text-gray-400">
                    Aspect:{" "}
                    {
                      platforms.find((p) => p.value === config.target_platform)
                        ?.aspectRatio
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Features */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Scissors className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Content Features
              </h3>
              <p className="text-xs text-gray-500">
                Configure content processing options
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                key: "enable_captions",
                label: "Auto Captions",
                desc: "Generate platform-optimized captions",
                icon: FileText,
                comingSoon: false,
              },
              {
                key: "enable_media_enhancement",
                label: "Media Enhancement",
                desc: "Apply visual and audio improvements",
                icon: Sparkles,
                comingSoon: false,
              },
              {
                key: "smart_hashtags",
                label: "Smart Hashtags",
                desc: "AI-generated platform-specific hashtags",
                icon: Hash,
                comingSoon: true,
              },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.key}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    option.comingSoon
                      ? "border-gray-100 bg-gray-50/30"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        option.comingSoon ? "bg-gray-300" : "bg-gray-100"
                      }`}
                    >
                      <IconComponent
                        className={`h-4 w-4 ${
                          option.comingSoon ? "text-gray-500" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Label
                          className={`text-sm font-medium ${
                            option.comingSoon
                              ? "text-gray-500"
                              : "text-gray-900"
                          }`}
                        >
                          {option.label}
                        </Label>
                        {option.comingSoon && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs ${
                          option.comingSoon ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {option.desc}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={
                      option.comingSoon
                        ? false
                        : !!config[option.key as keyof OptimizerConfig] || false
                    }
                    onCheckedChange={
                      option.comingSoon
                        ? undefined
                        : (checked) => updateConfig(option.key, checked)
                    }
                    disabled={option.comingSoon}
                    className="data-[state=checked]:bg-gray-900"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audio Processing */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Audio Processing
              </h3>
              <p className="text-xs text-gray-500">
                Configure audio enhancement options
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                key: "enable_audio_normalization",
                label: "Audio Normalization",
                desc: "Consistent audio levels across platforms",
                icon: Volume2,
              },
              {
                key: "remove_noise",
                label: "Noise Removal",
                desc: "Remove background noise and artifacts",
                icon: VolumeX,
              },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-900">
                        {option.label}
                      </Label>
                      <p className="text-xs text-gray-500">{option.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={
                      config[option.key as keyof OptimizerConfig] ? true : false
                    }
                    onCheckedChange={(checked) =>
                      updateConfig(option.key, checked)
                    }
                    className="data-[state=checked]:bg-gray-900"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smart Cropping */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Crop className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Content-Aware Cropping
              </h3>
              <p className="text-xs text-gray-500">
                Intelligent aspect ratio optimization
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-300 flex items-center justify-center">
                <Crop className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-500">
                    Smart Cropping
                  </Label>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                    Always Active
                  </span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                    Coming Soon: Manual Override
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Automatically crop content to optimal aspect ratio for
                  selected platform
                </p>
              </div>
            </div>
            <Switch
              checked={true}
              disabled={true}
              className="data-[state=checked]:bg-gray-500 opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Brand Identity */}
      <BrandingSelector config={config} updateConfig={updateConfig} />

      {/* Background Music */}
      <BackgroundMusicSelector config={config} updateConfig={updateConfig} />
    </div>
  );
};

export default PlatformOptimizerConfig;
