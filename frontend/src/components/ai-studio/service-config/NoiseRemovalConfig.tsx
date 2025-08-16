// components/ai-studio/service-config/NoiseRemovalConfig.tsx
import { Label } from "@/components/ui/label";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};
const NoiseRemovalConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-12">
      {/* Audio Processing Settings */}
      <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-2xl p-8 border border-indigo-50">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Audio Processing
            </h3>
            <p className="text-sm text-gray-600">
              Configure noise removal and audio enhancement settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Noise Reduction Intensity
              </Label>
              <div className="space-y-3">
                {[
                  {
                    value: "light",
                    label: "Light",
                    desc: "Gentle noise reduction",
                    color: "from-green-500 to-emerald-500",
                  },
                  {
                    value: "medium",
                    label: "Medium",
                    desc: "Balanced cleaning (Recommended)",
                    color: "from-blue-500 to-indigo-500",
                  },
                  {
                    value: "aggressive",
                    label: "Aggressive",
                    desc: "Maximum noise removal",
                    color: "from-red-500 to-pink-500",
                  },
                ].map((intensity) => (
                  <button
                    key={intensity.value}
                    className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                      config.intensity === intensity.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => updateConfig("intensity", intensity.value)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-lg bg-gradient-to-r ${intensity.color}`}
                      />
                      <div>
                        <div className="font-semibold">{intensity.label}</div>
                        <div className="text-sm text-gray-600">
                          {intensity.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoiseRemovalConfig;
