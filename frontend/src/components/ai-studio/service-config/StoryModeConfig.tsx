// components/ai-studio/service-config/StoryModeConfig.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  CheckSquare,
  Image,
  Music,
  Play,
  Video,
  VolumeX,
  Wand2,
} from "lucide-react";
import { backgroundMusicOptions } from "../constants";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};

const StoryModeConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-12">
      {/* Story Configuration */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className=" font-bold text-gray-900">Story Configuration</h3>
            <p className="text-sm text-gray-600">
              Configure how your story video will be constructed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Highlight Detection Type
              </Label>
              <Select
                value={config.highlightType}
                onValueChange={(value) => updateConfig("highlightType", value)}
              >
                <SelectTrigger className="h-10 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    {
                      value: "General",
                      label: "General Highlights",
                      desc: "Overall compelling moments",
                    },
                    {
                      value: "Emotional",
                      label: "Emotional Highlights",
                      desc: "Strong emotional impact moments",
                    },
                    {
                      value: "Results",
                      label: "Results & Metrics",
                      desc: "Quantifiable outcomes",
                    },
                    {
                      value: "Problem",
                      label: "Problem/Solution",
                      desc: "Challenge and resolution stories",
                    },
                    {
                      value: "Recommendation",
                      label: "Recommendations",
                      desc: "Strong endorsements",
                    },
                  ].map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="py-1">
                        <div className="font-semibold">{type.label}</div>
                        <div className="text-sm text-gray-500">{type.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold text-gray-900 mb-1 block">
                Transition Style
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    value: "Fade",
                    label: "Smooth Fade",
                    desc: "Gentle transitions",
                  },
                  {
                    value: "Cut",
                    label: "Quick Cut",
                    desc: "Sharp cuts",
                  },
                  {
                    value: "Slide",
                    label: "Slide",
                    desc: "Sliding motion",
                  },
                  {
                    value: "Zoom",
                    label: "Zoom Effect",
                    desc: "Dynamic zoom",
                  },
                ].map((style) => (
                  <button
                    key={style.value}
                    className={`p-3 text-left rounded-xl border-2 transition-all ${
                      config.transitionStyle === style.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateConfig("transitionStyle", style.value)}
                  >
                    <div className="font-medium text-sm">{style.label}</div>
                    <div className="text-xs text-gray-500">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "addIntro",
                label: "Add Intro Sequence",
                desc: "Custom introduction with your branding",
                icon: Play,
              },
              {
                key: "addOutro",
                label: "Add Outro Sequence",
                desc: "Professional closing with call-to-action",
                icon: CheckSquare,
              },
              {
                key: "removeNoise",
                label: "Audio Enhancement",
                desc: "Clean and professional audio",
                icon: VolumeX,
              },
              {
                key: "addLogo",
                label: "Logo Overlay",
                desc: "Brand logo throughout the video",
                icon: Image,
              },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </Label>
                      <p className="text-xs text-gray-600">{option.desc}</p>
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
        </div>
      </div>

      {/* Intro/Outro Configuration */}
      {(config.addIntro || config.addOutro) && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className=" font-bold text-gray-900">Intro & Outro Setup</h3>
              <p className="text-sm text-gray-600">
                Customize your video's opening and closing sequences
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {config.addIntro && (
              <div className="space-y-6">
                <h4 className="text-sm font-semibold text-purple-900">
                  Intro Configuration
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Intro Background Image
                    </Label>
                    <Input
                      placeholder="https://example.com/intro-background.jpg"
                      value={config.introImageUrl || ""}
                      onChange={(e) =>
                        updateConfig("introImageUrl", e.target.value)
                      }
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Voice Over Script
                    </Label>
                    <Textarea
                      placeholder="Enter the script for intro voice over..."
                      value={config.introVoicePrompt || ""}
                      onChange={(e) =>
                        updateConfig("introVoicePrompt", e.target.value)
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {config.addOutro && (
              <div className="space-y-6">
                <h4 className="text-sm font-semibold text-purple-900">
                  Outro Configuration
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Outro Background Image
                    </Label>
                    <Input
                      placeholder="https://example.com/outro-background.jpg"
                      value={config.outroImageUrl || ""}
                      onChange={(e) =>
                        updateConfig("outroImageUrl", e.target.value)
                      }
                      className="h-12"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Voice Over Script
                    </Label>
                    <Textarea
                      placeholder="Enter the script for outro voice over..."
                      value={config.outroVoicePrompt || ""}
                      onChange={(e) =>
                        updateConfig("outroVoicePrompt", e.target.value)
                      }
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background Music */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Background Music</h3>
            <p className="text-sm text-gray-600">
              Add atmospheric music to enhance your story
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200">
            <Label className="text-sm font-semibold text-gray-900">
              Enable Background Music
            </Label>
            <Switch
              checked={config.backgroundMusic}
              onCheckedChange={(checked) =>
                updateConfig("backgroundMusic", checked)
              }
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <AnimatePresence>
            {config.backgroundMusic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">
                    Choose Music Track
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {backgroundMusicOptions.map((music) => (
                      <button
                        key={music.id}
                        className={`p-4 text-left rounded-xl border-2 transition-all ${
                          config.selectedMusic === music.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => updateConfig("selectedMusic", music.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {music.name}
                          </span>
                          {config.selectedMusic === music.id && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Or Use Custom Music URL
                  </Label>
                  <Input
                    placeholder="https://example.com/custom-music.mp3"
                    value={config.customMusicUrl || ""}
                    onChange={(e) =>
                      updateConfig("customMusicUrl", e.target.value)
                    }
                    className="h-12"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default StoryModeConfig;
