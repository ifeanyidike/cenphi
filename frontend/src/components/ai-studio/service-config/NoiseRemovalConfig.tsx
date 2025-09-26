// components/ai-studio/service-config/NoiseRemovalConfig.tsx
import { Label } from "@/components/ui/label";
import { VolumeX } from "lucide-react";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};

const NoiseRemovalConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-6">
      {/* Audio Processing Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <VolumeX className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Audio Processing
              </h3>
              <p className="text-xs text-gray-500">
                Configure noise removal and audio enhancement settings
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Noise Reduction Intensity
                </Label>
                <div className="space-y-2">
                  {[
                    {
                      value: "light",
                      label: "Light",
                      desc: "Gentle noise reduction",
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      desc: "Balanced cleaning (Recommended)",
                    },
                    {
                      value: "aggressive",
                      label: "Aggressive",
                      desc: "Maximum noise removal",
                    },
                  ].map((intensity) => (
                    <button
                      key={intensity.value}
                      className={`w-full p-3 text-left rounded-lg border transition-all ${
                        config.intensity === intensity.value
                          ? "border-gray-900 bg-gray-50 text-gray-900"
                          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                      onClick={() => updateConfig("intensity", intensity.value)}
                    >
                      <div className="font-medium text-sm">
                        {intensity.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {intensity.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoiseRemovalConfig;
