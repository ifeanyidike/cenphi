// components/ai-studio/service-config/SavedPresets.tsx
import { preset_manager } from "@/repo/managers/preset_manager";
import { AIService, Preset } from "@/types/ai-service";
import { Bookmark, Heart, Trash2 } from "lucide-react";
import { observer } from "mobx-react-lite";

type Props = {
  selectedPreset: Preset | null;
  handleLoadPreset: (preset: Preset) => void;
  service: AIService;
};
const SavedPresets = ({ selectedPreset, service, handleLoadPreset }: Props) => {
  const savedPresets = preset_manager.savedPresets[service.id] || [];
  const defaultPreset = preset_manager.defaultPresets[service.id];

  return (
    <div className="lg:col-span-1 order-2 lg:order-1">
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
            <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
            Saved Presets
          </h3>
        </div>
        <div className="p-4">
          {savedPresets?.length === 0 ? (
            <div className="text-center py-4 sm:py-6 text-gray-500">
              <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs sm:text-sm">No saved presets</p>
            </div>
          ) : (
            <div className="space-y-2">
              {savedPresets?.map((preset: any) => (
                <div
                  key={preset.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedPreset?.id === preset.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleLoadPreset(preset)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {preset.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {new Date(preset.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {defaultPreset?.id === preset.id && (
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 fill-current flex-shrink-0" />
                    )}
                  </div>

                  <div className="flex gap-1 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        preset_manager.setDefaultPreset(service.id, preset);
                        // onSetDefaultPreset(service.id, preset);
                      }}
                      className="flex-1 text-xs px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                    >
                      <span className="hidden sm:inline">Make Default</span>
                      <span className="sm:hidden">Default</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        preset_manager.deletePreset(service.id, preset.id);
                        // onDeletePreset(service.id, preset.id);
                      }}
                      className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default observer(SavedPresets);
