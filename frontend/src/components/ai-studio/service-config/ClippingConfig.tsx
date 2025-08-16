// components/ai-studio/service-config/ClippingConfig.tsx
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  FileText,
  Image,
  Scissors,
  Shield,
  Sparkles,
  VolumeX,
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import HighlightSegment from "./HighlightSegment";
import HighlightSegmentModal from "./HighlightSegmentModal";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
  selectedSegments: string[];
  setSelectedSegments: Dispatch<SetStateAction<string[]>>;
  selectedTestimonials: string[];
  videoPreviewUrl: string;
};

const ClippingConfig = ({
  updateConfig,
  config,
  setSelectedSegments,
  selectedSegments,
  selectedTestimonials,
  videoPreviewUrl,
}: Props) => {
  const [highlightPreviewModal, setHighlightPreviewModal] =
    useState<boolean>(false);
  return (
    <>
      <div className="space-y-12">
        {/* Smart Segment Selection */}
        <HighlightSegment
          setHighlightPreviewModal={setHighlightPreviewModal}
          selectedSegments={selectedSegments}
          setSelectedSegments={setSelectedSegments}
        />
        {/* Clip Configuration */}
        <div className="bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-2xl p-4 border border-emerald-50">
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Clip Settings</h3>
              <p className="text-sm text-gray-600">
                Configure how clips will be generated and formatted
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Clip Strategy
              </Label>
              <div className="space-y-2">
                {[
                  {
                    value: "best_moments",
                    desc: "Top-rated highlights only",
                    score: "95%+",
                  },
                  {
                    value: "story_arc",
                    desc: "Problem → Solution flow",
                    score: "Narrative",
                  },
                  {
                    value: "social_ready",
                    desc: "Optimized for sharing",
                    score: "Viral",
                  },
                  {
                    value: "comprehensive",
                    desc: "Cover all key points",
                    score: "Complete",
                  },
                ].map((strategy) => (
                  <button
                    key={strategy.value}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      config.clipStrategy === strategy.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateConfig("clipStrategy", strategy.value)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{strategy.desc}</div>
                        <div className="text-xs text-gray-500">
                          Strategy: {strategy.value.replace("_", " ")}
                        </div>
                      </div>
                      <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        {strategy.score}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Highlight Focus
              </Label>
              <div className="space-y-2">
                {[
                  {
                    value: "emotional",
                    desc: "High emotion moments",
                    icon: "💝",
                  },
                  {
                    value: "results",
                    desc: "Results & outcomes",
                    icon: "📈",
                  },
                  {
                    value: "transformation",
                    desc: "Before & after stories",
                    icon: "",
                  },
                  {
                    value: "problem",
                    desc: "Pain points addressed",
                    icon: "🎯",
                  },
                  {
                    value: "recommendation",
                    desc: "Recommendation moments",
                    icon: "⭐",
                  },
                  {
                    value: "metrics",
                    desc: "Numbers & statistics",
                    icon: "📊",
                  },
                ].map((focus) => (
                  <button
                    key={focus.value}
                    className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                      config.highlightFocus === focus.value
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateConfig("highlightFocus", focus.value)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{focus.icon}</span>
                      <div>
                        <div className="font-medium capitalize">
                          {focus.value}
                        </div>
                        <div className="text-xs text-gray-500">
                          {focus.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Enhancement Options */}
        <div className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-2xl p-4 border border-blue-50">
          <div className="flex items-center gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Enhancement Options
              </h3>
              <p className="text-sm text-gray-600">
                Add professional touches to your clips
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              {
                key: "includeSubtitles",
                label: "Auto Subtitles",
                desc: "Generate captions for accessibility",
                icon: FileText,
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
                desc: "Brand logo on each clip",
                icon: Image,
              },
              {
                key: "addWatermark",
                label: "Watermark",
                desc: "Brand watermark protection",
                icon: Shield,
              },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                      <IconComponent className="h-6 w-6 text-gray-600" />
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
        </div>
      </div>
      <HighlightSegmentModal
        isOpen={highlightPreviewModal}
        onClose={() => setHighlightPreviewModal(false)}
        // testimonials={TESTIMONIALS_DATA.filter((t) =>
        //   selectedTestimonials.includes(t.id)
        // )}
        testimonials={[]}
        videoPreviewUrl={videoPreviewUrl}
        onSegmentsSelected={setSelectedSegments}
      />
    </>
  );
};

export default ClippingConfig;
