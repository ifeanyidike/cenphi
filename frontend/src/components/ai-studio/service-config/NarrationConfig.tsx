// components/ai-studio/service-config/NarrationConfig.tsx
import React, { useState } from "react";
import { Mic, Timer, FileText, Globe, Users, Zap, Volume2 } from "lucide-react";
import { voices } from "../constants";
import BackgroundMusicSelector from "./BackgroundMusicSelector";
import { NarrationConfig as NarratorConfig } from "@/types/ai-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: NarratorConfig;
};

// Enhanced voice options with more metadata
const enhancedVoices = {
  elevenlabs: voices.elevenlabs.map((voice) => ({
    ...voice,
    category: voice.description.includes("professional")
      ? "professional"
      : voice.description.includes("energetic")
        ? "energetic"
        : voice.description.includes("calm")
          ? "calm"
          : "casual",
  })),
  openai: voices.openai.map((voice) => ({
    ...voice,
    category: voice.description.includes("professional")
      ? "professional"
      : voice.description.includes("energetic")
        ? "energetic"
        : voice.description.includes("clear")
          ? "professional"
          : "casual",
  })),
};

const styleOptions = [
  { value: "professional", label: "Professional", icon: "💼" },
  { value: "friendly", label: "Friendly", icon: "😊" },
  { value: "enthusiastic", label: "Enthusiastic", icon: "🎉" },
  { value: "calm", label: "Calm", icon: "🧘" },
  { value: "authoritative", label: "Authoritative", icon: "👔" },
  { value: "conversational", label: "Conversational", icon: "💬" },
  { value: "energetic", label: "Energetic", icon: "⚡" },
  { value: "warm", label: "Warm", icon: "🔥" },
];

const languageOptions = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "fr", label: "French", flag: "🇫🇷" },
  { value: "de", label: "German", flag: "🇩🇪" },
  { value: "it", label: "Italian", flag: "🇮🇹" },
  { value: "pt", label: "Portuguese", flag: "🇵🇹" },
  { value: "ja", label: "Japanese", flag: "🇯🇵" },
  { value: "ko", label: "Korean", flag: "🇰🇷" },
];

const NarrationConfig = ({ updateConfig, config }: Props) => {
  const [selectedGender, setSelectedGender] = useState(
    config.gender || "female"
  );

  const currentVoices =
    config.preferred_provider === "elevenlabs"
      ? enhancedVoices.elevenlabs
      : enhancedVoices.openai;

  // Filter voices by selected gender
  const filteredVoices = currentVoices.filter((voice) => {
    if (selectedGender === "neutral") {
      return voice.gender === "neutral";
    }
    return voice.gender === selectedGender || voice.gender === "neutral";
  });

  // Auto-select default voice when provider or gender changes
  React.useEffect(() => {
    if (filteredVoices.length > 0) {
      // If current voice_id is not in filtered voices, auto-select first available
      const currentVoiceExists = filteredVoices.some(
        (voice) => voice.id === config.voice_id
      );
      if (!currentVoiceExists) {
        updateConfig("voice_id", filteredVoices[0].id);
      }
    } else {
      // No voices available for this combination, clear voice_id
      if (config.voice_id) {
        updateConfig("voice_id", "");
      }
    }
  }, [config.preferred_provider, selectedGender, filteredVoices.length]);

  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender as "male" | "female" | "neutral");
    updateConfig("gender", gender);
  };

  const handleProviderChange = (provider: string) => {
    updateConfig("preferred_provider", provider);
  };

  return (
    <div className="space-y-6">
      {/* Voice Provider & Gender Selection */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Mic className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Voice Configuration
              </h3>
              <p className="text-xs text-gray-500">
                Provider, gender, and voice selection
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Provider */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Voice Provider
              </Label>
              <Select
                value={config.preferred_provider || "openai"}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elevenlabs">
                    ElevenLabs - Premium AI Voices
                  </SelectItem>
                  <SelectItem value="openai">
                    OpenAI - Natural Speech
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Gender Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <Users className="h-3 w-3" />
                Gender Preference
              </Label>
              <div className="flex gap-2">
                {["female", "male", "neutral"].map((gender) => (
                  <button
                    key={gender}
                    className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-all ${
                      selectedGender === gender
                        ? "border-gray-900 bg-gray-50 text-gray-900 font-medium"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                    onClick={() => handleGenderChange(gender)}
                  >
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="mt-6 space-y-3">
            <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Voice Selection
            </Label>
            {filteredVoices.length > 0 ? (
              <>
                <Select
                  value={config.voice_id || ""}
                  onValueChange={(value) => updateConfig("voice_id", value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a voice">
                      {config.voice_id && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {
                              filteredVoices.find(
                                (v) => v.id === config.voice_id
                              )?.name
                            }
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                            {
                              filteredVoices.find(
                                (v) => v.id === config.voice_id
                              )?.gender
                            }
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {filteredVoices.map((voice) => (
                      <SelectItem
                        key={voice.id}
                        value={voice.id}
                        className="py-3"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {voice.name}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-600">
                                {voice.gender}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {voice.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {voice.accent}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {filteredVoices.length} voices available for {selectedGender}{" "}
                  preference
                </p>
              </>
            ) : (
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 text-orange-800">
                  <Mic className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    No voices available
                  </span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  No {selectedGender} voices are available for{" "}
                  {config.preferred_provider === "elevenlabs"
                    ? "ElevenLabs"
                    : "OpenAI"}
                  . Please select a different gender or provider.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Style & Language Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Style & Language
              </h3>
              <p className="text-xs text-gray-500">
                Voice characteristics and language settings
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Style */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Voice Style
              </Label>
              <Select
                value={config.style || "professional"}
                onValueChange={(value) => updateConfig("style", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div className="flex items-center gap-2">
                        <span>{style.icon}</span>
                        <span>{style.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Language
              </Label>
              <Select
                value={config.language || "en"}
                onValueChange={(value) => updateConfig("language", value)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <Timer className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Advanced Settings
              </h3>
              <p className="text-xs text-gray-500">
                Fine-tune speech parameters
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Speech Speed */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <Timer className="h-3 w-3" />
                Speech Speed
              </Label>
              <div className="relative">
                <Select
                  value={config.speed}
                  onValueChange={(value) =>
                    updateConfig("speed", parseFloat(value))
                  }
                  disabled={true}
                >
                  <SelectTrigger className="h-10 opacity-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.75">0.75x - Slower</SelectItem>
                    <SelectItem value="1.0">1.0x - Normal</SelectItem>
                    <SelectItem value="1.25">1.25x - Faster</SelectItem>
                    <SelectItem value="1.5">1.5x - Much Faster</SelectItem>
                  </SelectContent>
                </Select>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium absolute -top-2 -right-2">
                  Coming Soon
                </span>
              </div>
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-600 uppercase tracking-wide flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Output Format
              </Label>
              <div className="relative">
                <Select
                  value={config.output_format || "mp3"}
                  onValueChange={(value) =>
                    updateConfig("output_format", value)
                  }
                  disabled={true}
                >
                  <SelectTrigger className="h-10 opacity-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">
                      MP3 - Compressed, smaller file
                    </SelectItem>
                    <SelectItem value="wav">
                      WAV - Lossless, high quality
                    </SelectItem>
                    <SelectItem value="aac">
                      AAC - Balanced quality and size
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium absolute -top-2 -right-2">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          {/* Optimize for Speech Toggle */}
          <div className="mt-6">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-900 cursor-pointer">
                    Optimize for Speech
                  </Label>
                  <p className="text-xs text-gray-500">
                    AI-enhance text structure for better narration flow
                  </p>
                </div>
              </div>
              <Switch
                checked={config.optimize_speech || false}
                onCheckedChange={(checked) =>
                  updateConfig("optimize_speech", checked)
                }
                className="data-[state=checked]:bg-indigo-600"
              />
            </div>
          </div>

          {/* Audio Enhancement Toggle */}
          <div className="mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-300 flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium text-gray-500">
                      Enhance Audio Quality
                    </Label>
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full font-medium">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Apply additional audio processing and enhancement
                  </p>
                </div>
              </div>
              <Switch checked={false} disabled={true} className="opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* Background Music */}
      <BackgroundMusicSelector config={config} updateConfig={updateConfig} />
    </div>
  );
};

export default NarrationConfig;
