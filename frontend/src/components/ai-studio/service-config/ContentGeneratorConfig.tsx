import { useState } from "react";
import { CONTENT_GENERATION_TYPES } from "../definitions";
import { motion } from "framer-motion";
import { FileText, Sparkles, X } from "lucide-react";
import ModalPortal from "@/utils/ModalPortal";
import { ContentConfig, ServiceType } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

// components/ai-studio/service-config/ContentGeneratorConfig.tsx
const ContentGenerationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (serviceId: ServiceType, config: ContentConfig) => void;
  selectedTestimonials: string[];
}> = ({ isOpen, onClose, onGenerate, selectedTestimonials }) => {
  const [selectedType, setSelectedType] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredTypes = CONTENT_GENERATION_TYPES.filter(
    (type) =>
      type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = () => {
    if (selectedType) {
      onGenerate("content_generation", {
        content_type: selectedType,
        prompt: customPrompt.trim() || null,
      });
      onClose();
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/50 flex items-center justify-center z-50 m-0 p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 my-8 max-h-[calc(100vh-4rem)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Generate Content
                  </h2>
                  <p className="text-xs text-gray-500">
                    Create marketing content from {selectedTestimonials.length}{" "}
                    testimonial{selectedTestimonials.length > 1 ? "s" : ""}
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
            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search content types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-gray-400 text-sm placeholder:text-gray-400"
              />
            </div>

            {/* Content Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {filteredTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 text-left rounded-lg border transition-all ${
                    selectedType === type.id
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="font-medium text-gray-900 text-sm mb-1">
                    {type.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Prompt */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add specific requirements or style preferences for the generated content..."
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
              onClick={handleGenerate}
              disabled={!selectedType}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Generate Content
            </button>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default observer(ContentGenerationModal);
