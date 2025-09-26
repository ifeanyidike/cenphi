// components/ai-studio/service-config/TextTranslationConfig.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { Languages, X } from "lucide-react";
import ModalPortal from "@/utils/ModalPortal";
import { TRANSLATION_LANGUAGES } from "../definitions";
import { ServiceType, TextTranslationConfig } from "@/types/ai-service";
import { observer } from "mobx-react-lite";

// Target languages for translation
// const LANGUAGES = [
//   { code: "es", name: "Spanish", flag: "🇪🇸" },
//   { code: "fr", name: "French", flag: "🇫🇷" },
//   { code: "de", name: "German", flag: "🇩🇪" },
//   { code: "it", name: "Italian", flag: "🇮🇹" },
//   { code: "pt", name: "Portuguese", flag: "🇵🇹" },
//   { code: "zh", name: "Chinese", flag: "🇨🇳" },
//   { code: "ja", name: "Japanese", flag: "🇯🇵" },
//   { code: "ko", name: "Korean", flag: "🇰🇷" },
//   { code: "ru", name: "Russian", flag: "🇷🇺" },
//   { code: "ar", name: "Arabic", flag: "🇸🇦" },
//   { code: "nl", name: "Dutch", flag: "🇳🇱" },
//   { code: "sv", name: "Swedish", flag: "🇸🇪" },
// ];

const TranslationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onTranslate: (serviceId: ServiceType, config: TextTranslationConfig) => void;
  selectedTestimonials: string[];
}> = ({ isOpen, onClose, onTranslate, selectedTestimonials }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>();
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredLanguages = TRANSLATION_LANGUAGES.filter((lang) =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // const toggleLanguage = (langCode: string) => {
  //   setSelectedLanguages((prev) =>
  //     prev.includes(langCode)
  //       ? prev.filter((code) => code !== langCode)
  //       : [...prev, langCode]
  //   );
  // };

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguage((prev) => (prev === langCode ? "" : langCode));
  };

  const handleTranslate = () => {
    if (selectedLanguage) {
      onTranslate("translation", {
        target_lang: selectedLanguage,
        prompt: customPrompt.trim() || null,
      });
      onClose();
    }
  };

  const getLanguageData = (code: string) =>
    TRANSLATION_LANGUAGES.find((l) => l.code === code);

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 my-8 max-h-[calc(100vh-4rem)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <Languages className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Translate Content
                  </h2>
                  <p className="text-xs text-gray-500">
                    Translate {selectedTestimonials.length} testimonial
                    {selectedTestimonials.length > 1 ? "s" : ""} to multiple
                    languages
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
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-gray-400 text-sm placeholder:text-gray-400"
              />
            </div>

            {/* Selected Languages Summary */}
            {/* {selectedLanguages.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Selected Languages ({selectedLanguages.length}):
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLanguages.map((code) => {
                    const lang = TRANSLATION_LANGUAGES.find(
                      (l) => l.code === code
                    );
                    return (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                      >
                        <span>{lang?.flag}</span>
                        <span>{lang?.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )} */}

            {selectedLanguage && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    <span>{getLanguageData(selectedLanguage)?.flag}</span>
                    <span>{getLanguageData(selectedLanguage)?.name}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Languages Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={`p-3 text-center rounded-lg border transition-all ${
                    selectedLanguage === lang.code
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  }`}
                >
                  <div className="text-xl mb-1">{lang.flag}</div>
                  <div className="text-xs font-medium text-gray-900">
                    {lang.name}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Prompt */}
            <div className="mb-6">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">
                Translation Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add specific translation requirements, cultural adaptations, or style preferences..."
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
              onClick={handleTranslate}
              disabled={!selectedLanguage}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm font-medium"
            >
              <Languages className="h-4 w-4" />
              Translate ({selectedLanguage})
            </button>
          </div>
        </motion.div>
      </div>
    </ModalPortal>
  );
};

export default observer(TranslationModal);
