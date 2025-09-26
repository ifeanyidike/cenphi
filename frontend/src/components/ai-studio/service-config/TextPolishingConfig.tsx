// components/ai-studio/service-config/TextPolishingModal.tsx
import { motion } from "framer-motion";
import { Wand2, X } from "lucide-react";
import { useState } from "react";
import { TEXT_POLISHING_STYLES } from "../definitions";
import ModalPortal from "@/utils/ModalPortal";
import { ServiceType, TextPolishingConfig } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

const TextPolishingModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onPolish: (serviceId: ServiceType, config: TextPolishingConfig) => void;
  selectedTestimonials: string[];
}> = ({ isOpen, onClose, onPolish, selectedTestimonials }) => {
  const [targetStyle, setTargetStyle] = useState<string>("");
  const [preserveAuthenticity, setPreserveAuthenticity] =
    useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const handlePolish = () => {
    if (targetStyle) {
      onPolish("text_polishing", {
        target_style: targetStyle,
        preserve_authenticity: preserveAuthenticity,
        prompt: customPrompt.trim() || null,
      });
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8 max-h-[calc(100vh-4rem)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <Wand2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Polish Text
                  </h2>
                  <p className="text-xs text-gray-500">
                    Enhance {selectedTestimonials.length} testimonial
                    {selectedTestimonials.length > 1 ? "s" : ""} while
                    preserving authenticity
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {/* Target Style */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-3">
                Target Writing Style *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TEXT_POLISHING_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setTargetStyle(style.id)}
                    className={`p-4 text-left rounded-lg border transition-all ${
                      targetStyle === style.id
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {style.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {style.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preserve Authenticity */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preserveAuthenticity}
                  onChange={(e) => setPreserveAuthenticity(e.target.checked)}
                  className="mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500"
                />
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    Preserve Authenticity
                  </div>
                  <div className="text-xs text-gray-500">
                    Maintain the original voice and personality while improving
                    clarity and grammar
                  </div>
                </div>
              </label>
            </div>

            {/* Custom Prompt */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">
                Custom Enhancement Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add specific instructions for how you want the text to be enhanced..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-gray-400 text-sm placeholder:text-gray-400 resize-none"
              />
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePolish}
              disabled={!targetStyle}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Wand2 className="h-4 w-4" />
              Polish Text
            </button>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default observer(TextPolishingModal);
