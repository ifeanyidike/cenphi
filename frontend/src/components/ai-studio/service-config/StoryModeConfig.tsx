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
import { Textarea } from "@/components/ui/textarea";
import { AnimatePresence, motion } from "framer-motion";
import {
  Video,
  Play,
  Square,
  Type,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import BackgroundMusicSelector from "./BackgroundMusicSelector";
import BrandingSelector from "./BrandingSelector";
import { useEffect, useState } from "react";
import HighlightSegmentModal from "./HighlightSegmentModal";
import HighlightSegment from "./HighlightSegment";
import { observer } from "mobx-react-lite";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
  selectedTestimonials: string[];
};

const StoryModeConfig = ({ updateConfig, config }: Props) => {
  const [highlightPreviewModal, setHighlightPreviewModal] =
    useState<boolean>(false);
  useEffect(() => {
    console.log("config", config);
  }, [config]);

  return (
    <div className="space-y-6">
      <HighlightSegment
        setHighlightPreviewModal={setHighlightPreviewModal}
        selectedSegments={config.segments}
        clearSegments={() => updateConfig("segments", [])}
      />
      {/* Story Configuration */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Video className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Story Configuration
              </h3>
              <p className="text-xs text-gray-500">
                Configure story generation settings
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Output Format
              </Label>
              <Select
                value={config.outputFormat || "mp4"}
                onValueChange={(value) => updateConfig("outputFormat", value)}
              >
                <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-gray-400">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">
                    <div className="py-1">
                      <div className="font-medium text-sm">MP4</div>
                      <div className="text-xs text-gray-500">
                        Universal compatibility
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="mov">
                    <div className="py-1">
                      <div className="font-medium text-sm">MOV</div>
                      <div className="text-xs text-gray-500">
                        High quality for editing
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="webm">
                    <div className="py-1">
                      <div className="font-medium text-sm">WebM</div>
                      <div className="text-xs text-gray-500">Web optimized</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Story Generation Prompt
              </Label>
              <Textarea
                placeholder="Custom instructions for intro/outro generation (optional)"
                value={config.prompt || ""}
                onChange={(e) => updateConfig("prompt", e.target.value)}
                rows={3}
                className="text-sm border-gray-200 focus:border-gray-400 placeholder:text-gray-400 resize-none"
              />
              <p className="text-xs text-gray-500">
                Provide custom instructions for intro/outro generation or leave
                empty for defaults
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Intro Configuration */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Play className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Intro Setup
              </h3>
              <p className="text-xs text-gray-500">
                Configure opening sequence
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Intro Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "none", label: "None", icon: "🚫" },
                  { value: "text", label: "Text", icon: "📝" },
                  { value: "image", label: "Image", icon: "🖼️" },
                ].map((type) => (
                  <button
                    key={type.value}
                    className={`p-3 text-center rounded-lg border transition-all ${
                      config.introType === type.value
                        ? "border-gray-900 bg-gray-50 text-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                    onClick={() => updateConfig("introType", type.value)}
                  >
                    <div className="text-base mb-1">{type.icon}</div>
                    <div className="text-xs font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {config.introType === "text" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                    <Type className="h-3 w-3" />
                    Intro Text
                  </Label>
                  <Textarea
                    placeholder="Enter your intro text..."
                    value={config.introText || ""}
                    onChange={(e) => updateConfig("introText", e.target.value)}
                    rows={3}
                    className="text-sm border-gray-200 focus:border-gray-400 placeholder:text-gray-400 resize-none"
                  />
                </motion.div>
              )}

              {config.introType === "image" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Image URL
                  </Label>
                  <Input
                    placeholder="https://example.com/intro-image.jpg"
                    value={config.introImageUrl || ""}
                    onChange={(e) =>
                      updateConfig("introImageUrl", e.target.value)
                    }
                    className="h-10 text-sm border-gray-200 focus:border-gray-400 placeholder:text-gray-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Outro Configuration */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Square className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Outro Setup
              </h3>
              <p className="text-xs text-gray-500">
                Configure closing sequence
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Outro Type
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "none", label: "None", icon: "🚫" },
                  { value: "text", label: "Text", icon: "📝" },
                  { value: "image", label: "Image", icon: "🖼️" },
                ].map((type) => (
                  <button
                    key={type.value}
                    className={`p-3 text-center rounded-lg border transition-all ${
                      config.outroType === type.value
                        ? "border-gray-900 bg-gray-50 text-gray-900"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                    onClick={() => updateConfig("outroType", type.value)}
                  >
                    <div className="text-base mb-1">{type.icon}</div>
                    <div className="text-xs font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {config.outroType === "text" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                    <Type className="h-3 w-3" />
                    Outro Text
                  </Label>
                  <Textarea
                    placeholder="Enter your outro text..."
                    value={config.outroText || ""}
                    onChange={(e) => updateConfig("outroText", e.target.value)}
                    rows={3}
                    className="text-sm border-gray-200 focus:border-gray-400 placeholder:text-gray-400 resize-none"
                  />
                </motion.div>
              )}

              {config.outroType === "image" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Image URL
                  </Label>
                  <Input
                    placeholder="https://example.com/outro-image.jpg"
                    value={config.outroImageUrl || ""}
                    onChange={(e) =>
                      updateConfig("outroImageUrl", e.target.value)
                    }
                    className="h-10 text-sm border-gray-200 focus:border-gray-400 placeholder:text-gray-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Brand Identity */}
      <BrandingSelector config={config} updateConfig={updateConfig} />

      {/* Background Music */}
      <BackgroundMusicSelector config={config} updateConfig={updateConfig} />

      <HighlightSegmentModal
        isOpen={highlightPreviewModal}
        onClose={() => setHighlightPreviewModal(false)}
        highlightSegments={config.segments}
        updateConfig={updateConfig}
        minSelection={1}
      />
    </div>
  );
};

export default observer(StoryModeConfig);
