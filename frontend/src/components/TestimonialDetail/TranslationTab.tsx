// components/TestimonialDetail/TranslationTab.tsx
import {
  Languages,
  Copy,
  Check,
  Edit3,
  Save,
  X,
  Globe2,
  Volume2,
  Download,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TranslationData {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  confidence_score: number;
  word_count: number;
  created_at: string;
  translation_method: string;
}

interface TranslationArtifact {
  id: string;
  data: TranslationData;
  created_at: string;
}

interface TranslationTabProps {
  artifacts: TranslationArtifact[];
  onGenerateTranslation: () => void;
  onCopyToClipboard: (text: string, id: string) => void;
  onSaveTranslation: (id: string, content: string) => void;
  copiedItems: Set<string>;
}

// Language configurations with proper names and flags
const LANGUAGE_CONFIGS = {
  en: { name: "English", flag: "🇺🇸" },
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
  de: { name: "German", flag: "🇩🇪" },
  it: { name: "Italian", flag: "🇮🇹" },
  pt: { name: "Portuguese", flag: "🇵🇹" },
  ru: { name: "Russian", flag: "🇷🇺" },
  ja: { name: "Japanese", flag: "🇯🇵" },
  ko: { name: "Korean", flag: "🇰🇷" },
  zh: { name: "Chinese", flag: "🇨🇳" },
  ar: { name: "Arabic", flag: "🇸🇦" },
  hi: { name: "Hindi", flag: "🇮🇳" },
  tr: { name: "Turkish", flag: "🇹🇷" },
  pl: { name: "Polish", flag: "🇵🇱" },
  nl: { name: "Dutch", flag: "🇳🇱" },
  sv: { name: "Swedish", flag: "🇸🇪" },
  da: { name: "Danish", flag: "🇩🇰" },
  no: { name: "Norwegian", flag: "🇳🇴" },
  fi: { name: "Finnish", flag: "🇫🇮" },
  cs: { name: "Czech", flag: "🇨🇿" },
} as const;

// Get language configuration
const getLanguageConfig = (langCode: string) => {
  return (
    LANGUAGE_CONFIGS[langCode as keyof typeof LANGUAGE_CONFIGS] || {
      name: langCode.toUpperCase(),
      flag: "🌍",
    }
  );
};

// Get confidence color
const getConfidenceColor = (score: number) => {
  if (score >= 0.9) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 0.8) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (score >= 0.7) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-red-100 text-red-800 border-red-200";
};

// Individual translation card
const TranslationCard = ({
  artifact,
  onCopyToClipboard,
  onSaveTranslation,
  copiedItems,
}: {
  artifact: TranslationArtifact;
  onCopyToClipboard: (text: string, id: string) => void;
  onSaveTranslation: (id: string, content: string) => void;
  copiedItems: Set<string>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(
    artifact.data.translated_text
  );

  const { data } = artifact;
  const sourceConfig = getLanguageConfig(data.source_language);
  const targetConfig = getLanguageConfig(data.target_language);

  const handleSave = () => {
    onSaveTranslation(artifact.id, editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(data.translated_text);
    setIsEditing(false);
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{sourceConfig.flag}</span>
              <span className="text-sm text-gray-600">{sourceConfig.name}</span>
              <span className="text-gray-400">→</span>
              <span className="text-lg">{targetConfig.flag}</span>
              <span className="text-sm font-medium text-gray-900">
                {targetConfig.name}
              </span>
            </div>
            <Badge
              className={`text-xs border ${getConfidenceColor(data.confidence_score)}`}
              variant="outline"
            >
              {Math.round(data.confidence_score * 100)}% confidence
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                onCopyToClipboard(
                  data.translated_text,
                  `translation-${artifact.id}`
                )
              }
            >
              {copiedItems.has(`translation-${artifact.id}`) ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Original Text */}
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">
            Original ({sourceConfig.name})
          </label>
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm text-gray-700 leading-relaxed">
              {data.original_text}
            </p>
          </div>
        </div>

        {/* Translated Text */}
        <div>
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wide block mb-2">
            Translation ({targetConfig.name})
          </label>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Edit translation..."
            />
          ) : (
            <div className="p-3 bg-white rounded-lg border">
              <p className="text-sm text-gray-900 leading-relaxed">
                {data.translated_text}
              </p>
            </div>
          )}
        </div>

        {/* Translation Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <div className="flex items-center gap-4">
            <span>{data.word_count} words</span>
            <span>Method: {data.translation_method}</span>
            <span>{new Date(data.created_at).toLocaleDateString()}</span>
          </div>

          {/* Audio/Download buttons for future features */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Generate Audio"
            >
              <Volume2 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Download"
            >
              <Download className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main Translation Tab Component
const TranslationTab = ({
  artifacts,
  onGenerateTranslation,
  onCopyToClipboard,
  onSaveTranslation,
  copiedItems,
}: TranslationTabProps) => {
  if (artifacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Languages className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Translations Available
          </h3>
          <p className="text-gray-600 mb-4">
            Translate this testimonial into different languages to reach global
            audiences and expand your market reach.
          </p>
          <Button
            onClick={onGenerateTranslation}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Languages className="h-4 w-4 mr-2" />
            Generate Translations
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group translations by target language
  const groupedTranslations = artifacts.reduce(
    (acc, artifact) => {
      const lang = artifact.data.target_language;
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(artifact);
      return acc;
    },
    {} as Record<string, TranslationArtifact[]>
  );

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Available Translations ({artifacts.length})
          </h3>
          <p className="text-sm text-gray-600">
            {Object.keys(groupedTranslations).length} languages available
          </p>
        </div>
        <Button
          onClick={onGenerateTranslation}
          variant="outline"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
        >
          <Languages className="h-4 w-4 mr-2" />
          Add More Languages
        </Button>
      </div>

      {/* Language Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe2 className="h-4 w-4" />
            Available Languages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(groupedTranslations).map((langCode) => {
              const config = getLanguageConfig(langCode);
              const count = groupedTranslations[langCode].length;
              return (
                <Badge key={langCode} variant="secondary" className="text-sm">
                  {config.flag} {config.name}
                  {count > 1 && <span className="ml-1">({count})</span>}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Translation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {artifacts.map((artifact) => (
          <TranslationCard
            key={artifact.id}
            artifact={artifact}
            onCopyToClipboard={onCopyToClipboard}
            onSaveTranslation={onSaveTranslation}
            copiedItems={copiedItems}
          />
        ))}
      </div>
    </div>
  );
};

export default TranslationTab;
