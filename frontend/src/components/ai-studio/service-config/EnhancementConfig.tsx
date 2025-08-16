// components/ai-studio/service-config/EnhancementConfig.tsx
import { Input } from "@/components/ui/input";
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
import { Monitor, Palette, VolumeX } from "lucide-react";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};
const EnhancementConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-6">
      {/* Quality & Processing Section */}
      <div className="bg-gradient-to-r from-purple-50/80 to-indigo-50/80 rounded-2xl p-8 border border-purple-50">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="font-bold text-gray-900">Quality & Processing</h3>
            <p className="text-sm text-gray-600">
              Configure enhancement quality and visual improvements
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Enhancement Quality
              </Label>
              <Select
                value={config.quality}
                onValueChange={(value) => updateConfig("quality", value)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Professional">
                    <div className="py-1">
                      <div className="font-semibold">Professional</div>
                      <div className="text-sm text-gray-500">
                        Highest quality, best results
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="High">
                    <div className="py-1">
                      <div className="font-semibold">High</div>
                      <div className="text-sm text-gray-500">
                        Great quality, faster processing
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Standard">
                    <div className="py-1">
                      <div className="font-semibold">Standard</div>
                      <div className="text-sm text-gray-500">
                        Good quality, quickest processing
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            {[
              {
                key: "colorEnhancement",
                label: "Color Enhancement",
                desc: "Professional color grading and correction",
                icon: Palette,
              },
              {
                key: "stabilization",
                label: "Video Stabilization",
                desc: "Smooth shaky footage automatically",
                icon: Monitor,
              },
              {
                key: "removeNoise",
                label: "Audio Enhancement",
                desc: "Remove background noise and improve clarity",
                icon: VolumeX,
              },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-gray-600" />
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
                    className="data-[state=checked]:bg-purple-600"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Branding Section */}
      <div className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 rounded-2xl p-8 border border-blue-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
            <img className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Branding & Identity</h3>
            <p className="text-sm text-gray-600">
              Add your logo and watermark to enhance brand presence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logo Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
              <Label className="font-semibold text-gray-900">
                Add Logo Overlay
              </Label>
              <Switch
                checked={config.addLogo}
                onCheckedChange={(checked) => updateConfig("addLogo", checked)}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            <AnimatePresence>
              {config.addLogo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Logo URL
                    </Label>
                    <Input
                      placeholder="https://example.com/logo.png"
                      value={config.logoUrl || ""}
                      onChange={(e) => updateConfig("logoUrl", e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Logo Position
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "top-left", label: "Top Left" },
                        { value: "top-right", label: "Top Right" },
                        { value: "bottom-left", label: "Bottom Left" },
                        { value: "bottom-right", label: "Bottom Right" },
                      ].map((position) => (
                        <button
                          key={position.value}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                            config.logoPosition === position.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            updateConfig("logoPosition", position.value)
                          }
                        >
                          {position.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Watermark Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
              <Label className="font-semibold text-gray-900">
                Add Watermark
              </Label>
              <Switch
                checked={config.addWatermark}
                onCheckedChange={(checked) =>
                  updateConfig("addWatermark", checked)
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            <AnimatePresence>
              {config.addWatermark && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Watermark Text
                    </Label>
                    <Input
                      placeholder="Leave empty to use brand name"
                      value={config.watermarkText || ""}
                      onChange={(e) =>
                        updateConfig("watermarkText", e.target.value)
                      }
                      className="h-12"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to automatically use your brand name
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Watermark Position
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "top-left", label: "Top Left" },
                        { value: "top-right", label: "Top Right" },
                        { value: "bottom-left", label: "Bottom Left" },
                        { value: "bottom-right", label: "Bottom Right" },
                      ].map((position) => (
                        <button
                          key={position.value}
                          className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                            config.watermarkPosition === position.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() =>
                            updateConfig("watermarkPosition", position.value)
                          }
                        >
                          {position.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancementConfig;
