// components/ai-studio/service-config/TextPolishingConfig.tsx
import { Edit, Wand2 } from "lucide-react";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};
const TextPolishingConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-12">
      {/* Style Configuration */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Style Configuration
            </h3>
            <p className="text-sm text-gray-600">
              Configure how text should be enhanced and polished
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Target Writing Style
              </label>
              <select
                value={config.targetStyle}
                onChange={(e) => updateConfig("targetStyle", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="professional">
                  Professional - Formal and authoritative
                </option>
                <option value="casual">
                  Casual - Friendly and approachable
                </option>
                <option value="marketing">
                  Marketing - Persuasive and engaging
                </option>
                <option value="technical">
                  Technical - Detailed and precise
                </option>
                <option value="conversational">
                  Conversational - Natural and relaxed
                </option>
              </select>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Tone Adjustment
              </label>
              <select
                value={config.tone}
                onChange={(e) => updateConfig("tone", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="neutral">
                  Neutral - Maintain original tone
                </option>
                <option value="enthusiastic">
                  Enthusiastic - More energetic
                </option>
                <option value="formal">Formal - More professional</option>
                <option value="friendly">Friendly - More approachable</option>
                <option value="persuasive">Persuasive - More convincing</option>
              </select>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Length Optimization
              </label>
              <select
                value={config.lengthOptimization}
                onChange={(e) =>
                  updateConfig("lengthOptimization", e.target.value)
                }
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="maintain">
                  Maintain - Keep original length
                </option>
                <option value="expand">Expand - Add more detail</option>
                <option value="condense">Condense - Make more concise</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "preserveAuthenticity",
                label: "Preserve Authenticity",
                desc: "Maintain the original voice and personality",
              },
              {
                key: "grammarCorrection",
                label: "Grammar Correction",
                desc: "Fix grammatical errors and typos",
              },
              {
                key: "toneAdjustment",
                label: "Advanced Tone Adjustment",
                desc: "Apply sophisticated tone modifications",
              },
              {
                key: "industryTerminology",
                label: "Industry Terminology",
                desc: "Use appropriate industry-specific terms",
              },
            ].map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-violet-300 transition-all"
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
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Instructions */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
            <Edit className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Custom Instructions
            </h3>
            <p className="text-sm text-gray-600">
              Provide specific instructions for text enhancement
            </p>
          </div>
        </div>

        <div>
          <label className="text-base font-semibold text-gray-900 mb-3 block">
            Custom Enhancement Prompt
          </label>
          <textarea
            placeholder="Enter specific instructions for how you want the text to be enhanced..."
            value={config.customPrompt || ""}
            onChange={(e) => updateConfig("customPrompt", e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <p className="text-sm text-gray-500 mt-2">
            Example: "Make the text more compelling for enterprise sales,
            emphasize ROI and business value"
          </p>
        </div>
      </div>
    </div>
  );
};

export default TextPolishingConfig;
