// components/ai-studio/service-config/index.tsx
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Play, Save, Settings } from "lucide-react";
import EnhancementConfig from "./EnhancementConfig";
import StoryModeConfig from "./StoryModeConfig";
import PlatformOptimizerConfig from "./PlatformOptimizerConfig";
import ClippingConfig from "./ClippingConfig";
import NoiseRemovalConfig from "./NoiseRemovalConfig";
import NarrationConfig from "./NarrationConfig";
import SavedPresets from "./SavedPresets";
import SavePresetModal from "./SavePresetModal";
import {
  AIService,
  DefaultSettings,
  MediaEnhancementConfig,
  NarrationConfig as NarratorConfig,
  Preset,
  ServiceType,
  SmartClippingConfig,
  SourceInfo,
} from "@/types/ai-service";
import { PlatformOptimizerConfig as OptimizerConfig } from "@/types/ai-service";
import { observer } from "mobx-react-lite";
import { preset_manager } from "@/repo/managers/preset_manager";

// Service Configuration Page Component
const ServiceConfigPage: React.FC<{
  service: AIService;
  selectedTestimonials: string[];
  onBack: () => void;
  onProcess: (serviceId: string, config: DefaultSettings) => void;
  sourceInfo?: SourceInfo;
}> = ({ service, selectedTestimonials, onBack, onProcess, sourceInfo }) => {
  const serviceValidation = useMemo(() => {
    if (!sourceInfo) return { canApply: true };

    const appliedServices = sourceInfo.appliedServices || [];
    if (appliedServices.includes(service.id as ServiceType)) {
      return {
        canApply: false,
        reason: `${service.title} has already been applied to this content`,
      };
    }

    return { canApply: true };
  }, [service, sourceInfo]);

  const [presetName, setPresetName] = useState<string>("");
  const [showSavePreset, setShowSavePreset] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);

  useEffect(() => {
    preset_manager.getConfig(service.id);
  }, [service.id]);

  const config = preset_manager.serviceConfig;

  const updateConfig = (key: string, value: DefaultSettings) => {
    preset_manager.updateConfig(key, value);
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      preset_manager.savePreset(service.id, presetName);
      setPresetName("");
      setShowSavePreset(false);
    }
  };

  const handleLoadPreset = (preset: Preset) => {
    preset_manager.setConfig(preset);
    setSelectedPreset(preset);
  };

  const handleProcess = () => {
    if (!serviceValidation.canApply) {
      // Show error message
      return;
    }

    const processConfig = {
      ...config,
      // Add artifact context for backend processing
      sourceInfo,
    };

    console.log("process config", processConfig);
    onProcess(service.id, processConfig as DefaultSettings);
  };

  const renderConfigOptions = () => {
    switch (service.id) {
      case "enhancement":
        return (
          <EnhancementConfig
            config={config as MediaEnhancementConfig}
            updateConfig={updateConfig}
          />
        );

      case "story_mode":
        return (
          <StoryModeConfig
            config={config}
            updateConfig={updateConfig}
            selectedTestimonials={selectedTestimonials}
          />
        );

      case "platform_optimizer":
        return (
          <PlatformOptimizerConfig
            config={config as OptimizerConfig}
            updateConfig={updateConfig}
          />
        );

      case "clipping":
        return (
          <ClippingConfig
            config={config as SmartClippingConfig}
            updateConfig={updateConfig}
            selectedTestimonials={selectedTestimonials}
          />
        );

      case "noise_removal":
        return (
          <NoiseRemovalConfig config={config} updateConfig={updateConfig} />
        );
      // case "content_generation":
      //   return (
      //     <ContentGeneratorConfig config={config} updateConfig={updateConfig} />
      //   );

      // case "text_polishing":
      //   return (
      //     <TextPolishingConfig config={config} updateConfig={updateConfig} />
      //   );

      // case "translation":
      //   return (
      //     <TextTranslationConfig config={config} updateConfig={updateConfig} />
      //   );

      case "narration":
        return (
          <NarrationConfig
            config={config as NarratorConfig}
            updateConfig={updateConfig}
          />
        );

      // Keep all other existing cases (enhancement, story_mode, etc.)
      default:
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Configuration Available
            </h3>
            <p className="text-gray-600">
              Custom settings for {service.title} will be displayed here.
            </p>
          </div>
        );
    }
  };

  if (!service) return null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-screen-xl mx-auto px-2 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0 sm:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors self-start"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">
                  <span className="hidden sm:inline">Back to Studio Home</span>
                  <span className="sm:hidden">Back</span>
                </span>
              </button>
              <div className="h-6 w-px bg-gray-300 hidden sm:block" />
              <div className="flex flex-col gap-3">
                {!serviceValidation.canApply && (
                  <div className="p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                      <span className="font-medium text-yellow-800 text-sm">
                        Service Cannot Be Applied
                      </span>
                    </div>
                    <p className="text-yellow-700 mt-1 text-sm">
                      {serviceValidation.reason}
                    </p>
                  </div>
                )}
                <div>
                  <h1 className="font-semibold text-gray-900 text-base sm:text-lg">
                    {service.title} Configuration
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 order-first sm:order-last">
              <button
                onClick={() => setShowSavePreset(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Save className="h-3 w-3" />
                <span className="hidden sm:inline">Save Preset</span>
                <span className="sm:hidden">Save</span>
              </button>
              <button
                onClick={handleProcess}
                className="flex text-sm items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Play className="h-3 w-3" />
                <span className="hidden sm:inline">Start Processing</span>
                <span className="sm:hidden">Start</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Configuration Content - Show first on mobile */}
          <div className="lg:col-span-3 order-2 lg:order-2">
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 sm:p-6 border-b">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Configuration Settings
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {service.description}
                </p>
              </div>
              <div className="p-4 sm:p-6">{renderConfigOptions()}</div>
            </div>
          </div>

          {/* Saved Presets Sidebar - Show second on mobile */}
          <div className="order-1 lg:order-1">
            <SavedPresets
              handleLoadPreset={handleLoadPreset}
              selectedPreset={selectedPreset}
              service={service}
            />
          </div>
        </div>
      </div>
      {/* Save Preset Modal */}
      {showSavePreset && (
        <SavePresetModal
          handleSavePreset={handleSavePreset}
          presetName={presetName}
          setPresetName={setPresetName}
          setShowSavePreset={setShowSavePreset}
        />
      )}
    </div>
  );
};

export default observer(ServiceConfigPage);
