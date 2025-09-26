// components/ai-studio/service-config/BrandingSelector.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BrandingConfig } from "@/types/ai-service";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, MapPin, Type, Image } from "lucide-react";
import { observer } from "mobx-react-lite";

type Props = {
  config: BrandingConfig;
  updateConfig: (key: string, value: any) => void;
};

const BrandingSelector = ({ config, updateConfig }: Props) => {
  const enableLogoKey = "include_logo";
  const logoUrlKey = "logo_url";
  const enableWatermarkKey = "include_watermark";
  const logoPositionKey = "logo_position";
  const watermarkTextKey = "watermark_text";
  const watermarkPositionKey = "watermark_position";

  const logoEnabled = config[enableLogoKey] || false;
  const watermarkEnabled = config[enableWatermarkKey] || false;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Brand Identity
            </h3>
            <p className="text-xs text-gray-500">Apply your brand elements</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Logo Overlay */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <Image className="h-4 w-4 text-gray-600" />
              <div>
                <Label className="text-sm font-medium text-gray-900">
                  Logo Overlay
                </Label>
                <p className="text-xs text-gray-500">Add your brand logo</p>
              </div>
            </div>
            <Switch
              checked={logoEnabled}
              onCheckedChange={(checked) => {
                updateConfig(enableLogoKey, checked);
                const hasBranding = checked || config.include_watermark;
                updateConfig("addBranding", hasBranding);
              }}
              className="data-[state=checked]:bg-gray-900"
            />
          </div>

          <AnimatePresence>
            {logoEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pl-4"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Logo Url
                  </Label>
                  <Input
                    placeholder="Enter Logo Url"
                    value={config[logoUrlKey] || ""}
                    onChange={(e) => updateConfig(logoUrlKey, e.target.value)}
                    className="h-10 text-sm border-gray-200 focus:border-gray-400 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to use company logo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Position
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
                        className={`p-2 text-xs font-medium rounded-lg border transition-all ${
                          config[logoPositionKey] === position.value
                            ? "border-gray-900 bg-gray-50 text-gray-900"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                        onClick={() =>
                          updateConfig(logoPositionKey, position.value)
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

        {/* Watermark */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100">
            <div className="flex items-center gap-3">
              <Type className="h-4 w-4 text-gray-600" />
              <div>
                <Label className="text-sm font-medium text-gray-900">
                  Watermark
                </Label>
                <p className="text-xs text-gray-500">
                  Text-based brand protection
                </p>
              </div>
            </div>
            <Switch
              checked={watermarkEnabled}
              onCheckedChange={(checked) => {
                updateConfig(enableWatermarkKey, checked);
                const hasBranding = checked || config.include_logo;
                updateConfig("addBranding", hasBranding);
              }}
              className="data-[state=checked]:bg-gray-900"
            />
          </div>

          <AnimatePresence>
            {watermarkEnabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pl-4"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Text
                  </Label>
                  <Input
                    placeholder="Enter watermark text"
                    value={config[watermarkTextKey] || ""}
                    onChange={(e) =>
                      updateConfig(watermarkTextKey, e.target.value)
                    }
                    className="h-10 text-sm border-gray-200 focus:border-gray-400 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to use company name
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Position
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "top-left", label: "Top Left" },
                      { value: "top-right", label: "Top Right" },
                      { value: "bottom-left", label: "Bottom Left" },
                      { value: "bottom-right", label: "Bottom Right" },
                      { value: "center", label: "Center" },
                    ].map((position) => (
                      <button
                        key={position.value}
                        className={`p-2 text-xs font-medium rounded-lg border transition-all ${
                          config[watermarkPositionKey] === position.value
                            ? "border-gray-900 bg-gray-50 text-gray-900"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50/50"
                        }`}
                        onClick={() =>
                          updateConfig(watermarkPositionKey, position.value)
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

        {/* Status */}
        {(logoEnabled || watermarkEnabled) && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {[
                  logoEnabled &&
                    `Logo: ${config[logoPositionKey] || "bottom-right"}`,
                  watermarkEnabled &&
                    `Watermark: ${config[watermarkPositionKey] || "bottom-right"}`,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" />
                <span className="text-gray-400">Active</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default observer(BrandingSelector);
