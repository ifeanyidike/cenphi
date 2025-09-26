// components/ai-studio/service-config/EnhancementConfig.tsx
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
  Monitor,
  Palette,
  VolumeX,
  Sparkles,
  Video,
  Users,
  Share2,
  Star,
  Target,
} from "lucide-react";
import BrandingSelector from "./BrandingSelector";
import { MediaEnhancementConfig } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: MediaEnhancementConfig;
};

const EnhancementConfig = ({ updateConfig, config }: Props) => {
  const updateCustomEnhancements = (
    enhancementName: string,
    enabled: boolean
  ) => {
    const currentEnhancements = config.custom_enhancements || [];

    if (enabled) {
      if (!currentEnhancements.includes(enhancementName)) {
        updateConfig("custom_enhancements", [
          ...currentEnhancements,
          enhancementName,
        ]);
      }
    } else {
      updateConfig(
        "custom_enhancements",
        currentEnhancements.filter((e: string) => e !== enhancementName)
      );
    }
  };

  const isEnhancementEnabled = (enhancementName: string): boolean => {
    return (config.custom_enhancements || []).includes(enhancementName);
  };

  return (
    <div className="space-y-6">
      {/* Quality & Processing Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Star className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Quality & Processing
              </h3>
              <p className="text-xs text-gray-500">
                Configure enhancement quality and settings
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Enhancement Quality
              </Label>
              <Select
                value={config.quality || "high"}
                onValueChange={(value) => updateConfig("quality", value)}
              >
                <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-gray-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="py-1">
                      <div className="font-medium text-sm">Professional</div>
                      <div className="text-xs text-gray-500">
                        Highest quality, best results
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="High">
                    <div className="py-1">
                      <div className="font-medium text-sm">High</div>
                      <div className="text-xs text-gray-500">
                        Great quality, faster processing
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Standard">
                    <div className="py-1">
                      <div className="font-medium text-sm">Standard</div>
                      <div className="text-xs text-gray-500">
                        Good quality, quickest processing
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <VolumeX className="h-4 w-4 text-gray-600" />
                  <div>
                    <Label className="text-sm font-medium text-gray-900">
                      AI Noise Removal
                    </Label>
                    <p className="text-xs text-gray-500">
                      Remove background noise and improve clarity
                    </p>
                  </div>
                </div>
                <Switch
                  checked={config.remove_noise || false}
                  onCheckedChange={(checked) => {
                    console.log("updating", checked);
                    console.log("before", config.remove_noise);
                    updateConfig("remove_noise", checked);
                  }}
                  className="data-[state=checked]:bg-gray-900"
                />
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Target Platform
              </Label>
              <Select
                value={config.targetPlatform || "general"}
                disabled
                onValueChange={(value) => updateConfig("targetPlatform", value)}
              >
                <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-gray-400">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="py-1">
                      <div className="font-medium text-sm">General</div>
                      <div className="text-xs text-gray-500">
                        Universal optimization
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="social_media">
                    <div className="py-1">
                      <div className="font-medium text-sm">Social Media</div>
                      <div className="text-xs text-gray-500">
                        Instagram, TikTok, etc.
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="youtube">
                    <div className="py-1">
                      <div className="font-medium text-sm">YouTube</div>
                      <div className="text-xs text-gray-500">
                        Long-form content
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="testimonial">
                    <div className="py-1">
                      <div className="font-medium text-sm">Testimonial</div>
                      <div className="text-xs text-gray-500">
                        Face and voice focus
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>
        </div>
      </div>

      {/* Video Enhancements */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Video Enhancements
              </h3>
              <p className="text-xs text-gray-500">
                Professional video processing options
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                key: "cinematic_color",
                label: "Cinematic Color Grading",
                desc: "Professional color grading with enhanced contrast",
                icon: Palette,
              },
              {
                key: "ultra_sharpen",
                label: "Ultra Sharpening",
                desc: "Advanced detail enhancement for crisp visuals",
                icon: Sparkles,
              },
              {
                key: "professional_stabilization",
                label: "Professional Stabilization",
                desc: "Smooth shaky footage with advanced algorithms",
                icon: Monitor,
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
                    checked={isEnhancementEnabled(option.key)}
                    onCheckedChange={(checked) =>
                      updateCustomEnhancements(option.key, checked)
                    }
                    className="data-[state=checked]:bg-gray-900"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Audio Enhancements */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <VolumeX className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Audio Enhancements
              </h3>
              <p className="text-xs text-gray-500">
                Professional audio processing options
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                key: "voice_clarity_boost",
                label: "Voice Clarity Boost",
                desc: "Enhance voice frequencies for better speech clarity",
                icon: Users,
              },
              {
                key: "noise_gate",
                label: "Noise Gate",
                desc: "Remove background noise during quiet moments",
                icon: VolumeX,
              },
              {
                key: "professional_eq",
                label: "Professional EQ",
                desc: "Audio equalization for testimonials and interviews",
                icon: Sparkles,
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
                    checked={isEnhancementEnabled(option.key)}
                    onCheckedChange={(checked) =>
                      updateCustomEnhancements(option.key, checked)
                    }
                    className="data-[state=checked]:bg-gray-900"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Enhancement Packages */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Enhancement Packages
              </h3>
              <p className="text-xs text-gray-500">
                Pre-configured enhancement bundles
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                key: "testimonial_optimization",
                label: "Testimonial Optimization",
                desc: "Complete package: face enhancement, voice clarity, background optimization",
                icon: Users,
              },
              {
                key: "social_media_optimization",
                label: "Social Media Optimization",
                desc: "High contrast, vibrant colors, mobile-optimized for social platforms",
                icon: Share2,
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
                    checked={isEnhancementEnabled(option.key)}
                    onCheckedChange={(checked) =>
                      updateCustomEnhancements(option.key, checked)
                    }
                    className="data-[state=checked]:bg-gray-900"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand Identity */}
      <BrandingSelector config={config} updateConfig={updateConfig} />
    </div>
  );
};

export default observer(EnhancementConfig);
