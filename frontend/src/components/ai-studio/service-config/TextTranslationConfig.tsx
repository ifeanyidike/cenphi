// components/ai-studio/service-config/TextTranslationConfig.tsx
import { CheckCircle, Languages, Settings } from "lucide-react";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};
const TextTranslationConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-12">
      {/* Language Selection */}
      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center">
            <Languages className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Language Selection
            </h3>
            <p className="text-sm text-gray-600">
              Choose target languages for translation
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            "Spanish",
            "French",
            "German",
            "Italian",
            "Portuguese",
            "Chinese",
            "Japanese",
            "Korean",
            "Russian",
            "Arabic",
            "Hindi",
            "Dutch",
          ].map((lang) => (
            <button
              key={lang}
              className={`p-4 text-center rounded-xl border-2 transition-all ${
                config.targetLanguages?.includes(lang)
                  ? "border-teal-500 bg-teal-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                const current = config.targetLanguages || [];
                if (current.includes(lang)) {
                  updateConfig(
                    "targetLanguages",
                    current.filter((l: string) => l !== lang)
                  );
                } else {
                  updateConfig("targetLanguages", [...current, lang]);
                }
              }}
            >
              <div className="font-medium text-sm">{lang}</div>
              {config.targetLanguages?.includes(lang) && (
                <CheckCircle className="h-4 w-4 text-teal-600 mx-auto mt-2" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Translation Settings */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Translation Settings
            </h3>
            <p className="text-sm text-gray-600">
              Configure translation quality and style
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Formality Level
              </label>
              <select
                value={config.formalityLevel}
                onChange={(e) => updateConfig("formalityLevel", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="formal">
                  Formal - Professional and respectful
                </option>
                <option value="neutral">Neutral - Balanced approach</option>
                <option value="informal">Informal - Casual and friendly</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "preserveTone",
                label: "Preserve Tone",
                desc: "Maintain the original emotional tone",
              },
              {
                key: "culturalAdaptation",
                label: "Cultural Adaptation",
                desc: "Adapt content for cultural context",
              },
              {
                key: "includeOriginal",
                label: "Include Original",
                desc: "Show original text alongside translation",
              },
              {
                key: "localization",
                label: "Localization",
                desc: "Adapt for local markets and customs",
              },
            ].map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
              >
                <div>
                  <label className="text-base font-semibold text-gray-900">
                    {option.label}
                  </label>
                  <p className="text-sm text-gray-600">{option.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config[option.key]}
                    onChange={(e) => updateConfig(option.key, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextTranslationConfig;
