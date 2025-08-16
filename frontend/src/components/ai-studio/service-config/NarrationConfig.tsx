// components/ai-studio/service-config/NarrationConfig.tsx
import { CheckCircle, Mic, Music, Volume2 } from "lucide-react";
import { backgroundMusicOptions, voices } from "../constants";

type Props = {
  updateConfig: (key: string, value: any) => void;
  config: any;
};
const NarrationConfig = ({ updateConfig, config }: Props) => {
  return (
    <div className="space-y-12">
      {/* Voice Selection */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8 border border-rose-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 flex items-center justify-center">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Voice Selection</h3>
            <p className="text-sm text-gray-600">
              Choose AI voice provider and voice type
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-base font-semibold text-gray-900 mb-3 block">
              Voice Provider
            </label>
            <select
              value={config.voiceProvider}
              onChange={(e) => updateConfig("voiceProvider", e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="elevenlabs">ElevenLabs - Premium AI Voices</option>
              <option value="openai">OpenAI - Natural Speech</option>
            </select>
          </div>

          <div>
            <label className="text-base font-semibold text-gray-900 mb-4 block">
              Available Voices
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
              {(config.voiceProvider === "elevenlabs"
                ? voices.elevenlabs
                : voices.openai
              ).map((voice) => (
                <button
                  key={voice.id}
                  className={`p-4 text-left rounded-xl border-2 transition-all ${
                    config.selectedVoice === voice.id
                      ? "border-rose-500 bg-rose-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => updateConfig("selectedVoice", voice.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {voice.name}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border">
                          {voice.gender}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border">
                          {voice.accent}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {voice.description}
                      </div>
                    </div>
                    {config.selectedVoice === voice.id && (
                      <CheckCircle className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
            <Volume2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Voice Settings</h3>
            <p className="text-sm text-gray-600">
              Configure speech parameters and audio quality
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Speech Speed
              </label>
              <select
                value={config.speed}
                onChange={(e) => updateConfig("speed", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="0.75x">0.75x - Slower</option>
                <option value="1.0x">1.0x - Normal</option>
                <option value="1.25x">1.25x - Faster</option>
                <option value="1.5x">1.5x - Much Faster</option>
              </select>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Voice Emotion
              </label>
              <select
                value={config.emotion}
                onChange={(e) => updateConfig("emotion", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="neutral">Neutral</option>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="calm">Calm</option>
              </select>
            </div>

            <div>
              <label className="text-base font-semibold text-gray-900 mb-3 block">
                Output Format
              </label>
              <select
                value={config.outputFormat}
                onChange={(e) => updateConfig("outputFormat", e.target.value)}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="mp3">MP3 - Compressed, smaller file</option>
                <option value="wav">WAV - Lossless, high quality</option>
                <option value="aac">AAC - Balanced quality and size</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
              <div>
                <label className="text-base font-semibold text-gray-900">
                  Enhance Audio Quality
                </label>
                <p className="text-sm text-gray-600">
                  Apply additional audio processing
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enhanceAudio}
                  onChange={(e) =>
                    updateConfig("enhanceAudio", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Background Music */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Background Music
            </h3>
            <p className="text-sm text-gray-600">
              Add atmospheric music to enhance narration
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
            <label className="text-base font-semibold text-gray-900">
              Enable Background Music
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.backgroundMusic}
                onChange={(e) =>
                  updateConfig("backgroundMusic", e.target.checked)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {config.backgroundMusic && (
            <div className="space-y-6">
              <div>
                <label className="text-base font-semibold text-gray-900 mb-4 block">
                  Choose Music Track
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {backgroundMusicOptions.map((music) => (
                    <button
                      key={music.id}
                      className={`p-4 text-left rounded-xl border-2 transition-all ${
                        config.selectedMusic === music.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => updateConfig("selectedMusic", music.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{music.name}</span>
                        {config.selectedMusic === music.id && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-base font-semibold text-gray-900 mb-3 block">
                  Or Use Custom Music URL
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/custom-music.mp3"
                  value={config.customMusicUrl || ""}
                  onChange={(e) =>
                    updateConfig("customMusicUrl", e.target.value)
                  }
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="text-base font-semibold text-gray-900 mb-3 block">
                  Music Volume: {config.musicVolume || 15}%
                </label>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={config.musicVolume || 15}
                  onChange={(e) =>
                    updateConfig("musicVolume", parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NarrationConfig;
