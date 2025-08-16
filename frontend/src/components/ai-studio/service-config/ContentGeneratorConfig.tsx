// components/ai-studio/service-config/ContentGeneratorConfig.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Heart, Search, Type } from "lucide-react";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};
const ContentGeneratorConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-12">
      {/* Content Types Section */}
      <div className="bg-gradient-to-r from-pink-50/60 to-rose-50/60 rounded-2xl p-8 border border-pink-50">
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Content Types</h3>
            <p className="text-sm text-gray-600">
              Select the types of content to generate
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            "Email Campaign",
            "Blog Post",
            "Case Study",
            "Social Media Posts",
            "Sales Deck",
            "Whitepaper",
            "Press Release",
            "Landing Page Copy",
            "Testimonial Wall",
          ].map((type) => (
            <button
              key={type}
              className={`p-4 text-left rounded-xl border-2 transition-all ${
                config.contentTypes?.includes(type)
                  ? "border-pink-500 bg-pink-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                const current = config.contentTypes || [];
                if (current.includes(type)) {
                  updateConfig(
                    "contentTypes",
                    current.filter((t: string) => t !== type)
                  );
                } else {
                  updateConfig("contentTypes", [...current, type]);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{type}</span>
                {config.contentTypes?.includes(type) && (
                  <CheckCircle className="h-4 w-4 text-pink-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Style & Tone Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
            <Type className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Style & Tone</h3>
            <p className="text-sm text-gray-600">
              Configure the writing style and target audience
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Tone & Style
              </label>
              <select
                value={config.tone}
                onChange={(e) => updateConfig("tone", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">
                  Professional - Formal and authoritative
                </option>
                <option value="casual">
                  Casual - Friendly and approachable
                </option>
                <option value="persuasive">
                  Persuasive - Compelling and action-oriented
                </option>
                <option value="technical">
                  Technical - Detailed and precise
                </option>
                <option value="friendly">Friendly - Warm and personal</option>
              </select>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Content Length
              </label>
              <select
                value={config.contentLength}
                onChange={(e) => updateConfig("contentLength", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="short">Short - Concise and punchy</option>
                <option value="medium">Medium - Detailed overview</option>
                <option value="long">Long - Comprehensive and thorough</option>
              </select>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g., potential customers, existing clients, industry professionals"
                value={config.targetAudience || ""}
                onChange={(e) => updateConfig("targetAudience", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "autoSelectPositive",
                label: "Auto-Select Positive Reviews",
                desc: "Automatically choose the most positive testimonials",
              },
              {
                key: "includeMetrics",
                label: "Include Metrics & Data",
                desc: "Add quantifiable results and statistics",
              },
              {
                key: "seoOptimization",
                label: "SEO Optimization",
                desc: "Optimize content for search engines",
              },
              {
                key: "includeCTA",
                label: "Include Call-to-Action",
                desc: "Add compelling calls to action",
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
                <Switch
                  checked={config[option.key]}
                  onCheckedChange={(checked) =>
                    updateConfig(option.key, checked)
                  }
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Voice Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Brand Voice & Guidelines
            </h3>
            <p className="text-sm text-gray-600">
              Define your brand's personality and communication style
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold text-gray-900 mb-3 block">
              Brand Voice & Guidelines
            </Label>
            <Textarea
              placeholder="Describe your brand's personality, communication style, and any specific guidelines..."
              value={config.brandVoice || ""}
              onChange={(e) => updateConfig("brandVoice", e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label className="text-base font-semibold text-gray-900 mb-3 block">
              Custom Requirements (Optional)
            </Label>
            <Textarea
              placeholder="Any specific requirements, keywords to include, or formatting preferences..."
              value={config.customRequirements || ""}
              onChange={(e) =>
                updateConfig("customRequirements", e.target.value)
              }
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
      </div>

      {/* SEO Configuration */}
      {config.seoOptimization && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
              <Search className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                SEO Configuration
              </h3>
              <p className="text-sm text-gray-600">
                Optimize content for search engine visibility
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Target Keywords (comma separated)
              </Label>
              <Input
                placeholder="testimonial management, customer reviews, social proof"
                value={config.seoKeywords || ""}
                onChange={(e) => updateConfig("seoKeywords", e.target.value)}
                className="h-12"
              />
            </div>
            <div>
              <Label className="text-base font-semibold text-gray-900 mb-3 block">
                Focus Keyword
              </Label>
              <Input
                placeholder="Primary keyword for content optimization"
                value={config.focusKeyword || ""}
                onChange={(e) => updateConfig("focusKeyword", e.target.value)}
                className="h-12"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentGeneratorConfig;
