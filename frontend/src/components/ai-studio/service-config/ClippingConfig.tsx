// components/ai-studio/service-config/ClippingConfig.tsx
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileText, Scissors, VolumeX, Target } from "lucide-react";
import { useState } from "react";
import HighlightSegment from "./HighlightSegment";
import HighlightSegmentModal from "./HighlightSegmentModal";
import BackgroundMusicSelector from "./BackgroundMusicSelector";
import BrandingSelector from "./BrandingSelector";
import { observer } from "mobx-react-lite";
import { SmartClippingConfig } from "@/types/ai-service";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: SmartClippingConfig;
  selectedTestimonials: string[];
};

const ClippingConfig = ({ updateConfig, config }: Props) => {
  const [highlightPreviewModal, setHighlightPreviewModal] =
    useState<boolean>(false);

  return (
    <>
      <div className="space-y-6">
        {/* Smart Segment Selection */}

        <HighlightSegment
          setHighlightPreviewModal={setHighlightPreviewModal}
          selectedSegments={config.segments}
          clearSegments={() => updateConfig("segments", [])}
        />

        {/* Highlight Detection Strategy */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Detection Strategy
                </h3>
                <p className="text-xs text-gray-500">
                  Configure highlight detection and focus
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Highlight Type
                </Label>
                <Select
                  value={config.highlight_type || "general"}
                  onValueChange={(value) =>
                    updateConfig("highlightType", value)
                  }
                >
                  <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-gray-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      {
                        value: "general",
                        label: "General Highlights",
                        desc: "Overall compelling moments",
                      },
                      {
                        value: "emotional",
                        label: "Emotional Highlights",
                        desc: "Strong emotional impact",
                      },
                      {
                        value: "results",
                        label: "Results & Metrics",
                        desc: "Quantifiable outcomes",
                      },
                      {
                        value: "problem",
                        label: "Problem/Solution",
                        desc: "Challenge resolution",
                      },
                      {
                        value: "recommendation",
                        label: "Recommendations",
                        desc: "Strong endorsements",
                      },
                      {
                        value: "metrics",
                        label: "Metrics",
                        desc: "Numbers and statistics",
                      },
                      {
                        value: "before_after",
                        label: "Transformation",
                        desc: "Before and after",
                      },
                      {
                        value: "solution",
                        label: "Solution Discovery",
                        desc: "How they found solution",
                      },
                    ].map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="py-1">
                          <div className="font-medium text-sm">
                            {type.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {type.desc}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Max Clips
                </Label>
                <Select
                  value={config.max_clips?.toString() || "5"}
                  onValueChange={(value) =>
                    updateConfig("maxMoments", parseInt(value))
                  }
                >
                  <SelectTrigger className="h-10 text-sm border-gray-200 focus:border-gray-400 max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 clips</SelectItem>
                    <SelectItem value="5">5 clips</SelectItem>
                    <SelectItem value="8">8 clips</SelectItem>
                    <SelectItem value="10">10 clips</SelectItem>
                    <SelectItem value="15">15 clips</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}
            </div>
          </div>
        </div>

        {/* Clip Processing Options */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                <Scissors className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Processing Options
                </h3>
                <p className="text-xs text-gray-500">
                  Configure clip enhancements
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                {
                  key: "enable_captions",
                  label: "Auto Subtitles",
                  desc: "Generate captions for accessibility",
                  icon: FileText,
                  comingSoon: true,
                },
                {
                  key: "remove_noise",
                  label: "Remove noise",
                  desc: "Clean and professional audio",
                  icon: VolumeX,
                  comingSoon: false,
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
                            option.comingSoon
                              ? "text-gray-500"
                              : "text-gray-600"
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
                            option.comingSoon
                              ? "text-gray-400"
                              : "text-gray-500"
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
                          : !!config[option.key as keyof SmartClippingConfig] ||
                            false
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

        {/* Brand Identity */}
        <BrandingSelector config={config} updateConfig={updateConfig} />

        {/* Background Music */}
        <BackgroundMusicSelector config={config} updateConfig={updateConfig} />
      </div>

      <HighlightSegmentModal
        isOpen={highlightPreviewModal}
        onClose={() => setHighlightPreviewModal(false)}
        highlightSegments={config.segments}
        updateConfig={updateConfig}
        minSelection={1}
      />
    </>
  );
};

export default observer(ClippingConfig);
