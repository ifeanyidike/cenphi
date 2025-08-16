// components/ai-studio/service-config/SavePresetModal.tsx
import React, { Dispatch, SetStateAction } from "react";

type Props = {
  presetName: string;
  setPresetName: Dispatch<SetStateAction<string>>;
  handleSavePreset: () => void;
  setShowSavePreset: (value: React.SetStateAction<boolean>) => void;
};
const SavePresetModal = ({
  presetName,
  setPresetName,
  handleSavePreset,
  setShowSavePreset,
}: Props) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          Save Configuration Preset
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              Preset Name
            </label>
            <input
              type="text"
              placeholder="Enter preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSavePreset(false);
                setPresetName("");
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Preset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavePresetModal;
