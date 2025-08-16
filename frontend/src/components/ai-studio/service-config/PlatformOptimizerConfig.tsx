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
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, FileText, Hash, Target, VolumeX } from "lucide-react";
import { platforms } from "../constants";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};

const PlatformOptimizerConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-12">
      {/* Platform Selection */}
      <div className="bg-gradient-to-r from-orange-50/70 to-red-50/70 rounded-2xl p-4 border border-orange-50">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Platform Selection
            </h3>
            <p className="text-sm text-gray-600">
              Choose target platforms for optimization
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {platforms.map((platform) => (
            <motion.div
              key={platform.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  config.platforms?.includes(platform.id)
                    ? "border-orange-500 bg-orange-100 shadow-lg"
                    : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-md"
                }`}
                onClick={() => {
                  const currentPlatforms = config.platforms || [];
                  if (currentPlatforms.includes(platform.id)) {
                    updateConfig(
                      "platforms",
                      currentPlatforms.filter((p: any) => p !== platform.id)
                    );
                  } else {
                    updateConfig("platforms", [
                      ...currentPlatforms,
                      platform.id,
                    ]);
                  }
                }}
              >
                <div className="text-center space-y-3">
                  <div className="text-3xl">{platform.icon}</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {platform.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      {platform.aspect} aspect ratio
                    </div>
                  </div>
                  {config.platforms?.includes(platform.id) && (
                    <CheckCircle className="h-5 w-5 text-orange-600 mx-auto" />
                  )}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Optimization Settings */}
      <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-2xl p-8 border border-blue-50">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Optimization Features
            </h3>
            <p className="text-sm text-gray-600">
              Configure platform-specific enhancements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            {
              key: "contentAwareCropping",
              label: "Content-Aware Cropping",
              desc: "Smart subject detection and framing",
              icon: Target,
            },
            {
              key: "addCaptions",
              label: "Auto Captions",
              desc: "Platform-optimized subtitles",
              icon: FileText,
            },
            {
              key: "addHashtags",
              label: "Smart Hashtags",
              desc: "Platform-specific trending tags",
              icon: Hash,
            },
            {
              key: "audioEnhancement",
              label: "Audio Enhancement",
              desc: "Professional audio processing",
              icon: VolumeX,
            },
          ].map((option) => {
            const IconComponent = option.icon;
            return (
              <div
                key={option.key}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                    <IconComponent className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <Label className="text-base font-semibold text-gray-900">
                      {option.label}
                    </Label>
                    <p className="text-sm text-gray-600">{option.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={config[option.key]}
                  onCheckedChange={(checked) =>
                    updateConfig(option.key, checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            );
          })}
        </div>

        <AnimatePresence>
          {config.audioEnhancement && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 p-6 bg-indigo-100 rounded-xl"
            >
              <h4 className="text-lg font-semibold text-indigo-900 mb-4">
                Audio Enhancement Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-indigo-800 mb-2 block">
                    Noise Reduction Level
                  </Label>
                  <Select
                    value={config.noiseLevel}
                    onValueChange={(value) => updateConfig("noiseLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">
                        Medium (Recommended)
                      </SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <Label className="text-sm font-medium text-gray-900">
                    Preserve Voice
                  </Label>
                  <Switch
                    checked={config.preserveVoice}
                    onCheckedChange={(checked) =>
                      updateConfig("preserveVoice", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <Label className="text-sm font-medium text-gray-900">
                    Normalize Volume
                  </Label>
                  <Switch
                    checked={config.normalizeVolume}
                    onCheckedChange={(checked) =>
                      updateConfig("normalizeVolume", checked)
                    }
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PlatformOptimizerConfig;
