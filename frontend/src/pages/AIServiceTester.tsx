import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  X,
  FileText,
  Video,
  BarChart3,
  Settings,
  Activity,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  EyeOff,
  Server,
  Cpu,
  Database,
  Network,
  Timer,
  TrendingUp,
  Star,
  Sparkles,
  Mic,
  MessageSquare,
  Image,
  Scissors,
  Brain,
  Target,
  Volume2,
  Copy,
  Type,
  Languages,
  Maximize2,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8081/api";

// Enhanced Type definitions matching your backend exactly
interface TestResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
  duration?: number;
  job_id?: string;
}

interface JobStatus {
  id: string;
  status:
    | "queued"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "timeout";
  progress?: number;
  created_at?: string;
  last_updated?: string;
  estimated_completion?: string;
  error?: string;
  result?: any;
  duration_ms?: number;
}

interface StreamingResult {
  content: string;
  isComplete: boolean;
  isStreaming: boolean;
  type: "markdown" | "text" | "json";
}

interface Service {
  id: string;
  name: string;
  endpoint: string;
  type: "go" | "grpc";
  description?: string;
  rateLimitGroup: "standard" | "gpu";
  complexity?: "low" | "medium" | "high";
  estimatedTime?: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: ServiceField[];
  supportsStreaming?: boolean;
}

interface ServiceField {
  name: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "number"
    | "boolean"
    | "array"
    | "object";
  label: string;
  required?: boolean;
  defaultValue?: any;
  options?: string[];
  placeholder?: string;
  description?: string;
}

interface ServiceCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "purple";
  services: Service[];
  description?: string;
}

interface ConnectionStatus {
  status: "connected" | "disconnected" | "error" | "unknown";
  lastCheck?: Date;
  latency?: number;
}

// Sample media URLs
const SAMPLE_VIDEOS = [
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
];

const SAMPLE_AUDIO = [
  "https://archive.org/download/Greatest_Speeches_of_the_20th_Century/AbdicationAddress.mp3",
  "https://archive.org/download/Greatest_Speeches_of_the_20th_Century/CheckersSpeech.mp3",
  "https://archive.org/download/Greatest_Speeches_of_the_20th_Century/DeclarationofWarAgainstJapan.mp3",
];

// Realistic ElevenLabs voice IDs matching your backend
const ELEVEN_LABS_VOICES = [
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    gender: "female",
    accent: "American",
  },
  {
    id: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    gender: "female",
    accent: "American",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    gender: "female",
    accent: "British",
  },
  {
    id: "ErXwobaYiN019PkySvjV",
    name: "Antoni",
    gender: "male",
    accent: "American",
  },
  {
    id: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    gender: "male",
    accent: "American",
  },
  {
    id: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    gender: "male",
    accent: "American",
  },
  {
    id: "yoZ06aMxZJJ28mfd3POQ",
    name: "Sam",
    gender: "male",
    accent: "American",
  },
];

const TARGET_EMOTIONS = [
  "happiness",
  "satisfaction",
  "excitement",
  "trust",
  "confidence",
  "enthusiasm",
  "gratitude",
];
const ENHANCEMENT_OPTIONS = [
  "noise_reduction",
  "color_correction",
  "stabilization",
  "upscaling",
  "audio_enhancement",
];
const PLATFORM_OPTIONS = [
  "instagram_story",
  "instagram_post",
  "linkedin_post",
  "twitter_post",
  "youtube_short",
  "tiktok",
];

// Markdown Renderer Component
const MarkdownRenderer: React.FC<{
  content: string;
  isStreaming?: boolean;
}> = ({ content, isStreaming = false }) => {
  const renderMarkdown = (text: string) => {
    // Simple markdown parser for common elements
    let html = text
      // Headers
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>'
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-xl font-semibold text-gray-800 mt-6 mb-3">$1</h2>'
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>'
      )

      // Bold and italic
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold text-gray-900">$1</strong>'
      )
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')

      // Code blocks
      .replace(
        /```([\s\S]*?)```/g,
        '<pre class="bg-gray-100 rounded-lg p-3 my-3 overflow-x-auto border"><code class="text-sm font-mono text-gray-800">$1</code></pre>'
      )
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800 border">$1</code>'
      )

      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-gray-700">$1</li>')

      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>'
      )

      // Line breaks
      .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-3">')
      .replace(/\n/g, "<br>");

    // Wrap in paragraph tags if not already wrapped
    if (
      !html.includes("<p>") &&
      !html.includes("<h1>") &&
      !html.includes("<h2>")
    ) {
      html = `<p class="text-gray-700 leading-relaxed mb-3">${html}</p>`;
    }

    return html;
  };

  return (
    <div className="prose prose-sm max-w-none">
      <div
        className="markdown-content"
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(content),
        }}
      />
      {isStreaming && (
        <div className="inline-flex items-center ml-1">
          <div className="w-2 h-4 bg-blue-500 animate-pulse rounded-sm"></div>
        </div>
      )}
    </div>
  );
};

// Enhanced Result Display Component
const ResultDisplay: React.FC<{
  service: Service;
  result: TestResponse;
  streamingResult?: StreamingResult;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ service, result, streamingResult, isExpanded, onToggleExpand }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResult = () => {
    const dataToDownload = streamingResult?.content || result.data;
    const blob = new Blob(
      [
        typeof dataToDownload === "string"
          ? dataToDownload
          : JSON.stringify(dataToDownload, null, 2),
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${service.id}-result.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderResultContent = () => {
    if (streamingResult) {
      if (streamingResult.type === "markdown") {
        return (
          <MarkdownRenderer
            content={streamingResult.content}
            isStreaming={streamingResult.isStreaming}
          />
        );
      } else {
        return (
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {streamingResult.content}
            {streamingResult.isStreaming && (
              <span className="inline-flex items-center ml-1">
                <div className="w-2 h-4 bg-blue-500 animate-pulse rounded-sm"></div>
              </span>
            )}
          </div>
        );
      }
    }
    console.log("result", result);
    // Handle different types of results
    const data = result?.data;
    console.log("data", data);
    if (typeof data === "string") {
      // Check if it looks like markdown
      if (
        data.includes("#") ||
        data.includes("**") ||
        data.includes("*") ||
        data.includes("```")
      ) {
        return <MarkdownRenderer content={data} />;
      }

      return (
        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed font-mono text-sm">
          {data}
        </div>
      );
    }

    if (typeof data === "object" && data !== null) {
      // Special handling for different service types
      if (service.id === "transcribe" && data.transcript) {
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Transcript</h4>
              <p className="text-gray-800 leading-relaxed">{data.transcript}</p>
            </div>
            {data.confidence && (
              <div className="text-sm text-gray-600">
                Confidence:{" "}
                <span className="font-medium">
                  {(data.confidence * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        );
      }

      if (service.id === "sentiment" && Array.isArray(data)) {
        return (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="bg-gray-50 border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Text {index + 1}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.sentiment === "positive"
                        ? "bg-green-100 text-green-800"
                        : item.sentiment === "negative"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>
                <p className="text-gray-800 text-sm mb-2">{item.text}</p>
                <div className="text-xs text-gray-600">
                  Score:{" "}
                  <span className="font-medium">{item.score?.toFixed(3)}</span>
                </div>
              </div>
            ))}
          </div>
        );
      }

      if (service.id === "highlights" && data.highlights) {
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Key Highlights</h4>
            {data.highlights.map((highlight: any, index: any) => (
              <div
                key={index}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-800">
                    Highlight {index + 1}
                  </span>
                  <span className="text-xs text-yellow-600">
                    Score: {highlight.score?.toFixed(2)}
                  </span>
                </div>
                <p className="text-gray-800">{highlight.text}</p>
                {highlight.theme && (
                  <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {highlight.theme}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      }

      // Default JSON display
      return (
        <pre className="text-xs font-mono leading-relaxed text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }

    return <div className="text-gray-600 italic">No result data available</div>;
  };
  console.log("streamingResult", streamingResult);
  console.log("result", result);
  let resultContent = streamingResult?.content || "";
  if (result?.data) {
    if (typeof result.data === "string") {
      resultContent = result.data;
    } else {
      resultContent = JSON.stringify(result.data, null, 2);
    }
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-inner relative">
      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {service.name} - Results
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(resultContent)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={downloadResult}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download result"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {renderResultContent()}
            </div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-semibold text-green-800">
              {streamingResult?.isStreaming ? "Streaming..." : "Success"}
            </span>
            {result?.duration && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200">
                {result.duration}ms
              </span>
            )}
            {streamingResult?.isStreaming && (
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
                <div
                  className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(resultContent)}
              className="text-green-600 hover:text-green-800 p-1.5 rounded-lg transition-colors hover:bg-green-100 border border-green-200"
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={downloadResult}
              className="text-green-600 hover:text-green-800 p-1.5 rounded-lg transition-colors hover:bg-green-100 border border-green-200"
              title="Download result"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(true)}
              className="text-green-600 hover:text-green-800 p-1.5 rounded-lg transition-colors hover:bg-green-100 border border-green-200"
              title="View fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleExpand}
              className="text-green-600 hover:text-green-800 p-1.5 rounded-lg transition-colors hover:bg-green-100 border border-green-200"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3">
            <div className="bg-white/90 rounded-lg p-4 max-h-96 overflow-auto border border-green-200 shadow-inner">
              {renderResultContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AITestingDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [jobs, setJobs] = useState<Record<string, JobStatus>>({});
  const [results, setResults] = useState<Record<string, TestResponse>>({});
  const [streamingResults, setStreamingResults] = useState<
    Record<string, StreamingResult>
  >({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: "unknown",
  });
  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set()
  );
  const [showSystemDetails, setShowSystemDetails] = useState(false);
  const [responseTimes, setResponseTimes] = useState<Record<string, number>>(
    {}
  );
  const [formData, setFormData] = useState<Record<string, any>>({});

  // SSE connection and streaming
  const eventSourceRef = useRef<EventSource | null>(null);
  const streamingConnectionsRef = useRef<Record<string, EventSource>>({});
  const mountedRef = useRef(true);

  // Service definitions matching your backend protocol buffers exactly
  const serviceCategories: Record<string, ServiceCategory> = {
    standard: {
      name: "Standard AI Services",
      icon: FileText,
      color: "blue",
      description: "Core AI services for content processing and analysis",
      services: [
        {
          id: "brand-context",
          name: "Brand Context Extraction",
          endpoint: "/brand-context",
          type: "go",
          description:
            "Extract comprehensive brand information from website URLs using advanced web scraping and AI analysis",
          rateLimitGroup: "standard",
          complexity: "medium",
          estimatedTime: "2-5s",
          category: "Brand Analysis",
          icon: Target,
          fields: [
            {
              name: "website_url",
              type: "text",
              label: "Website URL",
              required: true,
              placeholder: "https://example.com",
              description: "The website URL to extract brand context from",
            },
          ],
        },
        {
          id: "transcribe",
          name: "Audio Transcription",
          endpoint: "/transcribe",
          type: "go",
          description:
            "Convert audio to text with high accuracy using state-of-the-art automatic speech recognition",
          rateLimitGroup: "standard",
          complexity: "medium",
          estimatedTime: "5-15s",
          category: "Speech & Audio",
          icon: Mic,
          fields: [
            {
              name: "media_url",
              type: "text",
              label: "Media URL",
              required: true,
              placeholder: "https://example.com/audio.mp3",
              description: "URL of the audio/video file to transcribe",
            },
          ],
        },
        {
          id: "translate",
          name: "Text Translation",
          endpoint: "/translate",
          type: "go",
          description:
            "Translate text between 100+ languages with context-aware neural machine translation",
          rateLimitGroup: "standard",
          complexity: "low",
          estimatedTime: "1-3s",
          category: "Text Processing",
          icon: Languages,
          supportsStreaming: true,
          fields: [
            {
              name: "text",
              type: "textarea",
              label: "Text to Translate",
              required: true,
              placeholder: "Enter text to translate...",
              description: "The text content to translate",
            },
            {
              name: "source_lang",
              type: "select",
              label: "Source Language",
              required: true,
              defaultValue: "en",
              options: [
                "en",
                "es",
                "fr",
                "de",
                "it",
                "pt",
                "ru",
                "ja",
                "ko",
                "zh",
              ],
              description: "Source language code",
            },
            {
              name: "target_lang",
              type: "select",
              label: "Target Language",
              required: true,
              defaultValue: "es",
              options: [
                "en",
                "es",
                "fr",
                "de",
                "it",
                "pt",
                "ru",
                "ja",
                "ko",
                "zh",
              ],
              description: "Target language code",
            },
            {
              name: "prompt",
              type: "textarea",
              label: "Custom Prompt (Optional)",
              placeholder:
                "Additional context or instructions for translation...",
              description: "Optional custom instructions for the translation",
            },
          ],
        },
        {
          id: "sentiment",
          name: "Sentiment Analysis",
          endpoint: "/sentiment",
          type: "go",
          description:
            "Analyze emotional tone and sentiment with brand context integration for personalized insights",
          rateLimitGroup: "standard",
          complexity: "low",
          estimatedTime: "1-2s",
          category: "Text Analysis",
          icon: Brain,
          fields: [
            {
              name: "texts",
              type: "array",
              label: "Text Array",
              required: true,
              placeholder: "Enter texts to analyze (one per line)",
              description: "Array of texts to analyze for sentiment",
            },
            {
              name: "brand_context",
              type: "object",
              label: "Brand Context (Optional)",
              description: "Optional brand context for personalized analysis",
            },
          ],
        },
        {
          id: "highlights",
          name: "Highlight Extraction",
          endpoint: "/highlights",
          type: "go",
          description:
            "Extract key moments and highlights from content using advanced NLP and semantic analysis",
          rateLimitGroup: "standard",
          complexity: "medium",
          estimatedTime: "3-8s",
          category: "Content Analysis",
          icon: Star,
          fields: [
            {
              name: "text",
              type: "textarea",
              label: "Text Content",
              required: true,
              placeholder: "Enter content to extract highlights from...",
              description: "The text content to analyze for highlights",
            },
            {
              name: "segments",
              type: "array",
              label: "Segments (Optional)",
              placeholder: "Optional time segments",
              description: "Optional array of time segments",
            },
          ],
        },
        {
          id: "fillers",
          name: "Filler Word Detection",
          endpoint: "/fillers",
          type: "go",
          description:
            "Detect and analyze filler words for speech improvement and professional communication",
          rateLimitGroup: "standard",
          complexity: "low",
          estimatedTime: "1-2s",
          category: "Speech Analysis",
          icon: MessageSquare,
          fields: [
            {
              name: "text",
              type: "textarea",
              label: "Text Content",
              required: true,
              placeholder: "Enter text to analyze for filler words...",
              description: "The text content to analyze for filler words",
            },
          ],
        },
        {
          id: "polish",
          name: "Text Polishing",
          endpoint: "/polish",
          type: "go",
          description:
            "Improve text quality, readability, and professional tone with AI-powered editing",
          rateLimitGroup: "standard",
          complexity: "medium",
          estimatedTime: "2-5s",
          category: "Text Enhancement",
          icon: Type,
          supportsStreaming: true,
          fields: [
            {
              name: "text",
              type: "textarea",
              label: "Text to Polish",
              required: true,
              placeholder: "Enter text to improve...",
              description: "The text content to polish and improve",
            },
            {
              name: "style",
              type: "select",
              label: "Writing Style",
              defaultValue: "professional",
              options: [
                "professional",
                "casual",
                "academic",
                "creative",
                "technical",
              ],
              description: "Desired writing style",
            },
            {
              name: "tone",
              type: "select",
              label: "Tone",
              defaultValue: "neutral",
              options: [
                "neutral",
                "enthusiastic",
                "formal",
                "friendly",
                "persuasive",
              ],
              description: "Desired tone of voice",
            },
          ],
        },
        {
          id: "generate-content",
          name: "Content Generation",
          endpoint: "/generate-content",
          type: "go",
          description:
            "Generate high-quality content based on prompts with brand voice consistency",
          rateLimitGroup: "standard",
          complexity: "medium",
          estimatedTime: "3-10s",
          category: "Content Creation",
          icon: FileText,
          supportsStreaming: true,
          fields: [
            {
              name: "testimonials",
              type: "array",
              label: "Testimonials",
              required: true,
              description: "Array of testimonial objects",
            },
            {
              name: "brand_context",
              type: "object",
              label: "Brand Context",
              required: true,
              description: "Brand context information",
            },
            {
              name: "content_type",
              type: "select",
              label: "Content Type",
              required: true,
              defaultValue: "social_post",
              options: [
                "social_post",
                "email",
                "blog_post",
                "case_study",
                "press_release",
              ],
              description: "Type of content to generate",
            },
            {
              name: "custom_prompt",
              type: "textarea",
              label: "Custom Prompt",
              placeholder:
                "Enter specific instructions for content generation...",
              description: "Custom prompt for content generation",
            },
          ],
        },
      ],
    },
    gpu: {
      name: "GPU-Intensive Services",
      icon: Cpu,
      color: "purple",
      description:
        "Advanced AI services requiring GPU acceleration for compute-intensive tasks",
      services: [
        {
          id: "analyze-emotions",
          name: "Advanced Emotion Analysis",
          endpoint: "/analyze-emotions",
          type: "grpc",
          description:
            "GPU-powered emotion detection in video content with facial expression analysis",
          rateLimitGroup: "gpu",
          complexity: "high",
          estimatedTime: "30-90s",
          category: "Video Analysis",
          icon: Brain,
          fields: [
            {
              name: "media_url",
              type: "text",
              label: "Media URL",
              required: true,
              placeholder: "https://example.com/video.mp4",
              description: "URL of the media file to analyze",
            },
            {
              name: "target_emotions",
              type: "select",
              label: "Target Emotions",
              defaultValue: "happiness",
              options: TARGET_EMOTIONS,
              description: "Emotions to focus analysis on",
            },
            {
              name: "analysis_depth",
              type: "select",
              label: "Analysis Depth",
              defaultValue: "standard",
              options: ["quick", "standard", "comprehensive"],
              description: "Depth of emotion analysis",
            },
          ],
        },
        {
          id: "enhance-media",
          name: "Media Enhancement",
          endpoint: "/enhance-media",
          type: "grpc",
          description:
            "Enhance video and audio quality using AI upscaling, noise reduction, and optimization",
          rateLimitGroup: "gpu",
          complexity: "high",
          estimatedTime: "60-180s",
          category: "Media Processing",
          icon: Image,
          fields: [
            {
              name: "media_url",
              type: "text",
              label: "Media URL",
              required: true,
              placeholder: "https://example.com/video.mp4",
              description: "URL of the media file to enhance",
            },
            {
              name: "quality",
              type: "select",
              label: "Quality Level",
              defaultValue: "high",
              options: ["low", "medium", "high"],
              description: "Enhancement quality level",
            },
            {
              name: "upload_to_cloud",
              type: "boolean",
              label: "Upload to Cloud",
              defaultValue: true,
              description: "Whether to upload enhanced media to cloud storage",
            },
            {
              name: "custom_enhancements",
              type: "select",
              label: "Custom Enhancements",
              options: ENHANCEMENT_OPTIONS,
              description: "Specific enhancements to apply",
            },
          ],
        },
        {
          id: "generate-narration",
          name: "Voice Narration",
          endpoint: "/generate-narration",
          type: "grpc",
          description:
            "Generate high-quality AI voice narration with realistic ElevenLabs voice synthesis",
          rateLimitGroup: "gpu",
          complexity: "high",
          estimatedTime: "20-60s",
          category: "Audio Generation",
          icon: Volume2,
          fields: [
            {
              name: "text",
              type: "textarea",
              label: "Text to Narrate",
              required: true,
              placeholder: "Enter text for voice narration...",
              description: "The text content to convert to speech",
            },
            {
              name: "language",
              type: "select",
              label: "Language",
              defaultValue: "en",
              options: ["en", "es", "fr", "de", "it"],
              description: "Language for narration",
            },
            {
              name: "voice_id",
              type: "select",
              label: "Voice",
              defaultValue: ELEVEN_LABS_VOICES[0].id,
              options: ELEVEN_LABS_VOICES.map((v) => v.id),
              description: "ElevenLabs voice ID",
            },
            {
              name: "gender",
              type: "select",
              label: "Gender",
              defaultValue: "female",
              options: ["male", "female"],
              description: "Voice gender preference",
            },
            {
              name: "style",
              type: "text",
              label: "Voice Style (Optional)",
              placeholder: "conversational, professional, etc.",
              description: "Optional voice style specification",
            },
            {
              name: "prompt",
              type: "textarea",
              label: "Voice Prompt (Optional)",
              placeholder: "Additional instructions for voice generation...",
              description: "Optional custom instructions for voice generation",
            },
            {
              name: "background_music",
              type: "text",
              label: "Background Music (Optional)",
              placeholder: "URL to background music",
              description: "Optional background music URL",
            },
            {
              name: "music_volume",
              type: "select",
              label: "Music Volume",
              defaultValue: "low",
              options: ["low", "medium", "high"],
              description: "Background music volume level",
            },
          ],
        },
        {
          id: "smart-clips",
          name: "Smart Video Clipping",
          endpoint: "/smart-clips",
          type: "grpc",
          description:
            "Automatically create optimized video clips with intelligent scene detection and editing",
          rateLimitGroup: "gpu",
          complexity: "high",
          estimatedTime: "45-120s",
          category: "Video Processing",
          icon: Scissors,
          fields: [
            {
              name: "media_url",
              type: "text",
              label: "Media URL",
              required: true,
              placeholder: "https://example.com/video.mp4",
              description: "URL of the video to clip",
            },
            {
              name: "highlight_moments",
              type: "array",
              label: "Highlight Moments",
              description:
                "Array of highlight moment objects with start_time, end_time, text, and theme",
            },
            {
              name: "quality",
              type: "select",
              label: "Quality Level",
              defaultValue: "high",
              options: ["low", "medium", "high"],
              description: "Clipping quality level",
            },
            {
              name: "max_clips",
              type: "number",
              label: "Max Clips",
              defaultValue: 3,
              description: "Maximum number of clips to generate",
            },
          ],
        },
        {
          id: "optimize-platform",
          name: "Platform Optimization",
          endpoint: "/optimize-platform",
          type: "grpc",
          description:
            "Optimize content for different social media platforms with AI-powered recommendations",
          rateLimitGroup: "gpu",
          complexity: "high",
          estimatedTime: "30-90s",
          category: "Social Media",
          icon: Target,
          fields: [
            {
              name: "testimonial",
              type: "object",
              label: "Testimonial Data",
              required: true,
              description: "Testimonial object with metadata",
            },
            {
              name: "target_platform",
              type: "select",
              label: "Target Platform",
              required: true,
              defaultValue: "instagram_story",
              options: PLATFORM_OPTIONS,
              description: "Social media platform to optimize for",
            },
            {
              name: "brand_context",
              type: "object",
              label: "Brand Context",
              description: "Brand context for optimization",
            },
            {
              name: "optimization_quality",
              type: "select",
              label: "Optimization Quality",
              defaultValue: "high",
              options: ["low", "medium", "high"],
              description: "Quality level for optimization",
            },
          ],
        },
        {
          id: "select-thumbnail",
          name: "Thumbnail Selection",
          endpoint: "/select-thumbnail",
          type: "grpc",
          description: "AI-powered thumbnail selection for maximum engagement",
          rateLimitGroup: "gpu",
          complexity: "medium",
          estimatedTime: "15-45s",
          category: "Media Processing",
          icon: Image,
          fields: [
            {
              name: "media_url",
              type: "text",
              label: "Media URL",
              required: true,
              placeholder: "https://example.com/video.mp4",
              description: "URL of the media file",
            },
            {
              name: "max_thumbnails",
              type: "number",
              label: "Max Thumbnails",
              defaultValue: 5,
              description: "Maximum number of thumbnail options to generate",
            },
          ],
        },
        {
          id: "story-video",
          name: "Story Video Generation",
          endpoint: "/story-video",
          type: "grpc",
          description:
            "Create compelling story videos from testimonial segments",
          rateLimitGroup: "gpu",
          complexity: "high",
          estimatedTime: "90-180s",
          category: "Video Creation",
          icon: Video,
          fields: [
            {
              name: "testimonial_segments",
              type: "array",
              label: "Testimonial Segments",
              required: true,
              description: "Array of testimonial segment objects",
            },
            {
              name: "brand_context",
              type: "object",
              label: "Brand Context",
              required: true,
              description: "Brand context for story generation",
            },
            {
              name: "output_format",
              type: "select",
              label: "Output Format",
              defaultValue: "mp4",
              options: ["mp4", "mov", "webm"],
              description: "Video output format",
            },
            {
              name: "background_music",
              type: "text",
              label: "Background Music (Optional)",
              placeholder: "URL to background music",
              description: "Optional background music URL",
            },
            {
              name: "music_volume",
              type: "select",
              label: "Music Volume",
              defaultValue: "low",
              options: ["low", "medium", "high"],
              description: "Background music volume level",
            },
            {
              name: "prompt",
              type: "textarea",
              label: "Story Prompt (Optional)",
              placeholder: "Custom instructions for story creation...",
              description: "Optional custom instructions for story generation",
            },
          ],
        },
      ],
    },
  };

  // Helper functions
  const getRandomVideo = (): string =>
    SAMPLE_VIDEOS[Math.floor(Math.random() * SAMPLE_VIDEOS.length)];
  const getRandomAudio = (): string =>
    SAMPLE_AUDIO[Math.floor(Math.random() * SAMPLE_AUDIO.length)];
  const getRandomVoice = () =>
    ELEVEN_LABS_VOICES[Math.floor(Math.random() * ELEVEN_LABS_VOICES.length)];

  // Initialize SSE connection
  const initializeSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_BASE_URL}/jobs/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("✅ SSE connection established");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 SSE event received:", data);

        if (data.job_id && data.service_id) {
          handleJobStatusUpdate(data.service_id, data);
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    eventSource.addEventListener("job_completed", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("✅ Job completed:", data);
        handleJobCompletion(data.service_id, data);
      } catch (error) {
        console.error("Error parsing job completion data:", error);
      }
    });

    eventSource.addEventListener("job_failed", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("❌ Job failed:", data);
        handleJobFailure(data.service_id, data);
      } catch (error) {
        console.error("Error parsing job failure data:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (mountedRef.current) {
          initializeSSE();
        }
      }, 5000);
    };
  }, []);

  // Handle job status updates from SSE
  const handleJobStatusUpdate = useCallback((serviceId: string, data: any) => {
    if (!mountedRef.current) return;

    setJobs((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        ...data,
        last_updated: new Date().toISOString(),
      },
    }));
  }, []);

  // Handle job completion from SSE
  const handleJobCompletion = useCallback((serviceId: string, data: any) => {
    if (!mountedRef.current) return;

    setResults((prev) => ({
      ...prev,
      [serviceId]: {
        success: true,
        data: data.result || data,
        timestamp: new Date().toISOString(),
        duration: data.duration_ms,
        job_id: data.job_id,
      },
    }));

    // Clear job from active jobs after a delay
    setTimeout(() => {
      setJobs((prev) => {
        const rest = Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== serviceId)
        );
        return rest;
      });
    }, 3000);
  }, []);

  // Handle job failure from SSE
  const handleJobFailure = useCallback((serviceId: string, data: any) => {
    if (!mountedRef.current) return;

    setErrors((prev) => ({
      ...prev,
      [serviceId]: data.error || "Job failed",
    }));

    // Clear job from active jobs
    setTimeout(() => {
      setJobs((prev) => {
        const rest = Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== serviceId)
        );
        return rest;
      });
    }, 2000);
  }, []);

  // Enhanced health check
  const checkHealth = useCallback(async (): Promise<any> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const latency = Date.now() - startTime;
      const healthData = await response.text();

      if (response.ok) {
        setConnectionStatus({
          status: "connected",
          lastCheck: new Date(),
          latency,
        });
      } else {
        setConnectionStatus({
          status: "error",
          lastCheck: new Date(),
          latency,
        });
      }
      return healthData;
    } catch (error) {
      const latency = Date.now() - startTime;
      setConnectionStatus({
        status: "disconnected",
        lastCheck: new Date(),
        latency,
      });
      console.error("Health check failed:", error);
      return null;
    }
  }, []);

  // Enhanced API call function with streaming support
  // const callAPI = useCallback(
  //   async (service: Service, customData?: any): Promise<void> => {
  //     const serviceId = service.id;
  //     const startTime = Date.now();

  //     console.log(`🚀 Starting API call for ${serviceId} (${service.type})`);

  //     setLoading((prev) => ({ ...prev, [serviceId]: true }));
  //     setErrors((prev) => ({ ...prev, [serviceId]: "" }));

  //     // Clear any existing results for this service
  //     setResults((prev) => {
  //       const { [serviceId]: removed, ...rest } = prev;
  //       return rest;
  //     });

  //     setStreamingResults((prev) => {
  //       const { [serviceId]: removed, ...rest } = prev;
  //       return rest;
  //     });

  //     try {
  //       const testData = customData || getTestData(service);
  //       console.log(
  //         `📤 Sending request to ${service.endpoint} with data:`,
  //         testData
  //       );

  //       // For streaming services, set up streaming connection first
  //       if (service.supportsStreaming) {
  //         setStreamingResults((prev) => ({
  //           ...prev,
  //           [serviceId]: {
  //             content: "",
  //             isComplete: false,
  //             isStreaming: true,
  //             type: service.id === "generate-content" ? "markdown" : "text",
  //           },
  //         }));

  //         // initializeStreamingConnection(serviceId);
  //       }

  //       const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(testData),
  //       });

  //       const responseTime = Date.now() - startTime;
  //       setResponseTimes((prev) => ({ ...prev, [serviceId]: responseTime }));

  //       if (!response.ok) {
  //         const errorData = await response.json().catch(() => ({
  //           error: `HTTP ${response.status}: ${response.statusText}`,
  //         }));
  //         throw new Error(
  //           errorData.error || `HTTP ${response.status}: ${response.statusText}`
  //         );
  //       }

  //       const result: TestResponse = await response.json();
  //       console.log(`📥 Received response for ${serviceId}:`, result);

  //       // Check if this is a queued job (gRPC services return job_id)
  //       const isQueuedJob =
  //         service.type === "grpc" || result.job_id || result.data?.job_id;

  //       if (isQueuedJob) {
  //         const jobId =
  //           result.job_id ||
  //           result.data?.job_id ||
  //           `job_${Date.now()}_${serviceId}`;

  //         console.log(
  //           `📋 Job queued for ${serviceId} with ID: ${jobId} (gRPC: ${service.type === "grpc"})`
  //         );

  //         setJobs((prev) => ({
  //           ...prev,
  //           [serviceId]: {
  //             id: jobId,
  //             status: "queued",
  //             progress: 0,
  //             created_at: new Date().toISOString(),
  //           },
  //         }));
  //       } else if (!service.supportsStreaming) {
  //         // Immediate response (Go services without streaming)
  //         console.log(`✅ Immediate response for ${serviceId} (Go service)`);
  //         setResults((prev) => ({ ...prev, [serviceId]: result }));
  //       }
  //       // For streaming services, the result will be handled via SSE
  //     } catch (error) {
  //       const responseTime = Date.now() - startTime;
  //       setResponseTimes((prev) => ({ ...prev, [serviceId]: responseTime }));

  //       console.error(`❌ API call failed for ${serviceId}:`, error);
  //       setErrors((prev) => ({
  //         ...prev,
  //         [serviceId]: error instanceof Error ? error.message : "Unknown error",
  //       }));

  //       // Clear streaming state on error
  //       if (service.supportsStreaming) {
  //         setStreamingResults((prev) => ({
  //           ...prev,
  //           [serviceId]: {
  //             ...prev[serviceId],
  //             isComplete: true,
  //             isStreaming: false,
  //           },
  //         }));
  //       }
  //     } finally {
  //       setLoading((prev) => ({ ...prev, [serviceId]: false }));
  //     }
  //   },
  //   [initializeStreamingConnection]
  // );

  // Get test data for services
  const getTestData = useCallback(
    (service: Service): Record<string, any> => {
      const serviceFormData = formData[service.id] || {};

      // If form data exists, use it; otherwise use default test data
      if (Object.keys(serviceFormData).length > 0) {
        return serviceFormData;
      }

      const testData: Record<string, any> = {
        "brand-context": {
          website_url: "https://openai.com",
        },
        transcribe: {
          media_url: getRandomAudio(),
        },
        translate: {
          text: "Our revolutionary AI platform has exceeded all expectations and delivered transformative results for our customers across the globe.",
          source_lang: "en",
          target_lang: "es",
        },
        sentiment: {
          texts: [
            "This product is absolutely revolutionary! Best investment I have made this year - exceeded all my expectations.",
            "The service was adequate, nothing particularly special but it functioned as advertised.",
            "I am very disappointed with the quality and performance. Would not recommend to others.",
          ],
          brand_context: {
            industry: "software",
            tone: "professional",
            values: ["innovation", "reliability", "customer-first"],
          },
        },
        highlights: {
          testimonial_id: "991052c0-4646-470b-93d4-a76123363c33",
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
          highlight_type: "before_after",
          // text: "I have been using this revolutionary AI software for eight months now and I can honestly say it has completely transformed how our entire team collaborates and operates. The interface is incredibly intuitive, the features are remarkably robust, and the customer support is absolutely exceptional.",
          // segments: [],
        },
        fillers: {
          text: "Um, so, like, this AI product is really, uh, amazing and, you know, I think, um, everyone should, like, definitely try it out for themselves, you know?",
        },
        polish: {
          text: "this ai product is really good and i like it alot becuse it works good for me and my team thinks its great to use everyday and it helps us be more productive",
          style: "professional",
          tone: "enthusiastic",
        },
        "generate-content": {
          testimonials: [
            {
              text: "This AI platform completely transformed our workflow and saved us countless hours every week while improving quality.",
              author: "Sarah Johnson",
              company: "TechFlow Inc.",
              title: "Chief Operations Officer",
              rating: 4.9,
            },
          ],
          brand_context: {
            industry: "Artificial Intelligence & SaaS",
            tone: "professional",
            values: ["innovation", "customer-centric", "efficiency"],
          },
          content_type: "social_post",
          custom_prompt:
            "Generate a compelling LinkedIn post highlighting how our AI platform revolutionizes team productivity.",
        },
        "analyze-emotions": {
          // media_url: getRandomVideo(),
          // target_emotions: ["happiness", "satisfaction", "excitement", "trust"],
          // analysis_depth: "comprehensive",
          testimonial_id: "991052c0-4646-470b-93d4-a76123363c33",
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
        },
        "enhance-media": {
          // media_url: getRandomVideo(),
          // quality: "high",
          // upload_to_cloud: true,
          // custom_enhancements: [
          //   "noise_reduction",
          //   "color_correction",
          //   "stabilization",
          // ],
          testimonial_id: "991052c0-4646-470b-93d4-a76123363c33",
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
          watermark_text: "To the stars!",
          add_branding: true,
          upload_to_cloud: true,
        },
        "generate-narration": {
          // text: "Welcome to our comprehensive AI platform demonstration. Today we will showcase how our innovative artificial intelligence solution can transform your business processes.",
          language: "en",
          testimonial_id: "991052c0-4646-470b-93d4-a76123363c33",
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
          // voice_id: randomVoice.id,
          // gender: randomVoice.gender,
          voice_id: "echo",
          style: "professional",
          add_background_music: true,
          optimize_speech: false,
        },
        "smart-clips": {
          testimonial_id: "991052c0-4646-470b-93d4-a76123363c33",
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",

          // media_url: getRandomVideo(),
          // highlight_moments: [
          //   {
          //     start_time: 5.0,
          //     end_time: 15.0,
          //     text: "efficiency gains are absolutely remarkable",
          //     theme: "productivity",
          //     include_logo: true,
          //     include_subtitle: true,
          //     include_watermark: true,
          //   },
          // ],
          // branding: {
          //   logo_url:
          //     "https://res.cloudinary.com/di6d28r5r/image/upload/v1752584332/Fynance_Hub_logos_approved_white_text_1_ndmxhe.png",
          //   brand_color: "#f17291",
          // },
          // quality: "high",
          // max_clips: 3,
        },
        "optimize-platform": {
          testimonial_id: "991052c0-4646-470b-93d4-a76123363c33",
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
          watermark_text: "To Sagitarius!",
          enable_media_enhancement: true,
          enable_captions: true,
          is_text_only: false,
          enable_transitions: true,
          target_platform: "instagram_reels",
          add_background_music: true,
          // testimonial: {
          //   metadata: {
          //     media_url: getRandomVideo(),
          //   },
          // },
          // target_platform: "instagram_story",
          // brand_context: {
          //   industry: "technology",
          //   brand_colors: ["#007bff", "#28a745"],
          //   tone: "friendly",
          // },
          // optimization_quality: "high",
        },
        "select-thumbnail": {
          testimonial_id: "991052c0-4646-470b-93d4-a76123363c33",
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
        },
        "story-video": {
          testimonial_segments: [
            { testimonial_id: "991052c0-4646-470b-93d4-a76123363c33" },
          ],
          workspace_id: "677a46c2-c15d-4e72-bd8d-4d4cf93a0c13",
          prompt: "make it short but with a strong business drive and value.",
          // testimonial_segments: [
          //   {
          //     media_url:
          //       "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          //     highlights: [
          //       {
          //         start_time: 0.1,
          //         end_time: 10.0,
          //         text: "Amazing results with our new platform",
          //         theme: "success",
          //       },
          //       {
          //         start_time: 15.0,
          //         end_time: 25.0,
          //         text: "Integration was seamless and fast",
          //         theme: "onboarding",
          //       },
          //     ],
          //   },
          //   {
          //     media_url:
          //       "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
          //     highlights: [
          //       {
          //         start_time: 440.0,
          //         end_time: 470.0,
          //         text: "We were blown away by the support and results",
          //         theme: "customer_experience",
          //       },
          //       {
          //         start_time: 680.0,
          //         end_time: 710.0,
          //         text: "Achieved a 50% increase in engagement",
          //         theme: "growth",
          //       },
          //     ],
          //   },
          //   {
          //     media_url:
          //       "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
          //     highlights: [
          //       {
          //         start_time: 0.1,
          //         end_time: 5.0,
          //         text: "Our productivity doubled in just a few weeks",
          //         theme: "productivity",
          //       },
          //     ],
          //   },
          // ],
          // brand_context: {
          //   industry: "technology",
          //   tone: "inspiring",
          //   brand_name: "Cenphi",
          //   brand_colors: ["#FFFFFF", "#F0F0F0"],
          // },
          output_format: "mp4",
        },
      };

      return testData[service.id] || {};
    },
    [formData]
  );

  const callAPI = useCallback(
    async (service: Service, customData?: any): Promise<void> => {
      const serviceId = service.id;

      setLoading((prev) => ({ ...prev, [serviceId]: true }));
      setErrors((prev) => ({ ...prev, [serviceId]: "" }));

      // Clear existing results
      setResults((prev) => {
        const rest = Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== serviceId)
        );
        return rest;
      });

      setStreamingResults((prev) => {
        const rest = Object.fromEntries(
          Object.entries(prev).filter(([key]) => key !== serviceId)
        );
        return rest;
      });

      try {
        const testData = customData || getTestData(service);

        if (service.supportsStreaming) {
          setStreamingResults((prev) => ({
            ...prev,
            [serviceId]: {
              content: "",
              isComplete: false,
              isStreaming: true,
              type: service.id === "generate-content" ? "markdown" : "text",
            },
          }));
        }

        const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Handle streaming response
        if (service.supportsStreaming && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            setStreamingResults((prev) => ({
              ...prev,
              [serviceId]: {
                ...prev[serviceId],
                content: (prev[serviceId]?.content || "") + chunk,
              },
            }));
          }

          // Mark as complete
          setStreamingResults((prev) => ({
            ...prev,
            [serviceId]: {
              ...prev[serviceId],
              isComplete: true,
              isStreaming: false,
            },
          }));
        } else {
          // Non-streaming response
          const result = await response.json();

          const isQueuedJob = service.type === "grpc" || result.job_id;

          if (isQueuedJob) {
            setJobs((prev) => ({
              ...prev,
              [serviceId]: {
                id: result.job_id || `job_${Date.now()}_${serviceId}`,
                status: "queued",
                progress: 0,
                created_at: new Date().toISOString(),
              },
            }));
          } else {
            setResults((prev) => ({ ...prev, [serviceId]: result }));
          }
        }
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          [serviceId]: error instanceof Error ? error.message : "Unknown error",
        }));
      } finally {
        setLoading((prev) => ({ ...prev, [serviceId]: false }));
      }
    },
    [getTestData]
  );

  // Job cancellation
  const cancelJob = useCallback(
    async (jobId: string, serviceId: string): Promise<void> => {
      try {
        console.log(`🛑 Cancelling job ${jobId} for service ${serviceId}`);

        const response = await fetch(`${API_BASE_URL}/jobs/cancel/${jobId}`, {
          method: "GET",
        });

        if (response.ok) {
          setJobs((prev) => ({
            ...prev,
            [serviceId]: {
              ...prev[serviceId],
              status: "cancelled",
              last_updated: new Date().toISOString(),
            },
          }));

          setTimeout(() => {
            setJobs((prev) => {
              const rest = Object.fromEntries(
                Object.entries(prev).filter(([key]) => key !== serviceId)
              );
              return rest;
            });
          }, 2000);

          console.log(`✅ Successfully cancelled job ${jobId}`);
        } else {
          throw new Error(`Failed to cancel job: HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error cancelling job ${jobId}:`, error);
        setErrors((prev) => ({
          ...prev,
          [serviceId]: `Failed to cancel job: ${error instanceof Error ? error.message : "Unknown error"}`,
        }));
      }
    },
    []
  );

  // Clear all results
  const clearAllResults = useCallback((): void => {
    console.log("🧹 Clearing all results and jobs");
    setResults({});
    setStreamingResults({});
    setErrors({});
    setJobs({});
    setResponseTimes({});
    setFormData({});

    // Close all streaming connections
    Object.values(streamingConnectionsRef.current).forEach((connection) => {
      connection.close();
    });
    streamingConnectionsRef.current = {};
  }, []);

  // Status indicator
  const getStatusIndicator = useCallback(
    (serviceId: string): JSX.Element | null => {
      if (loading[serviceId]) {
        return <Clock className="w-4 h-4 text-amber-500 animate-spin" />;
      }

      if (streamingResults[serviceId]?.isStreaming) {
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
      }

      if (jobs[serviceId]) {
        const status = jobs[serviceId].status;
        if (status === "processing") {
          return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />;
        }
        if (status === "queued") {
          return <Clock className="w-4 h-4 text-yellow-500" />;
        }
        if (status === "completed") {
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        }
        if (status === "failed" || status === "cancelled") {
          return <AlertCircle className="w-4 h-4 text-red-500" />;
        }
      }
      if (errors[serviceId]) {
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      }
      if (results[serviceId] || streamingResults[serviceId]?.isComplete) {
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      }
      return null;
    },
    [loading, errors, results, jobs, streamingResults]
  );

  // Color schemes
  const getColorScheme = useCallback((color: ServiceCategory["color"]) => {
    const schemes = {
      blue: {
        bg: "bg-gradient-to-br from-blue-50 to-blue-100",
        border: "border-blue-200",
        text: "text-blue-900",
        button: "bg-blue-600 hover:bg-blue-700",
        accent: "text-blue-600",
      },
      purple: {
        bg: "bg-gradient-to-br from-purple-50 to-purple-100",
        border: "border-purple-200",
        text: "text-purple-900",
        button: "bg-purple-600 hover:bg-purple-700",
        accent: "text-purple-600",
      },
    };
    return schemes[color];
  }, []);

  // Overview stats
  const getOverviewStats = useCallback(() => {
    const totalServices = Object.values(serviceCategories).reduce(
      (acc, cat) => acc + cat.services.length,
      0
    );
    const testedServices =
      Object.keys(results).length +
      Object.keys(errors).length +
      Object.keys(streamingResults).length;
    const successfulTests =
      Object.keys(results).length +
      Object.keys(streamingResults).filter(
        (id) => streamingResults[id].isComplete
      ).length;
    const failedTests = Object.keys(errors).length;
    const activeJobs =
      Object.keys(jobs).length +
      Object.keys(streamingResults).filter(
        (id) => streamingResults[id].isStreaming
      ).length;
    const avgResponseTime =
      Object.values(responseTimes).length > 0
        ? Math.round(
            Object.values(responseTimes).reduce((a, b) => a + b, 0) /
              Object.values(responseTimes).length
          )
        : 0;

    return {
      totalServices,
      testedServices,
      successfulTests,
      failedTests,
      activeJobs,
      avgResponseTime,
      uptime: 99.8,
    };
  }, [
    results,
    errors,
    serviceCategories,
    jobs,
    responseTimes,
    streamingResults,
  ]);

  // Bulk operations
  const testAllInCategory = useCallback(
    (categoryKey: string) => {
      const category = serviceCategories[categoryKey];
      if (!category) return;

      category.services.forEach((service, index) => {
        setTimeout(() => callAPI(service), index * 500);
      });
    },
    [callAPI, serviceCategories]
  );

  // Form handling with smart defaults
  const updateFormData = useCallback(
    (serviceId: string, field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          [field]: value,
        },
      }));
    },
    []
  );

  // Get smart default values for form fields
  const getSmartDefault = useCallback(
    (service: Service, field: ServiceField) => {
      // If form data exists, use it
      if (formData[service.id]?.[field.name] !== undefined) {
        return formData[service.id][field.name];
      }

      // If field has a default value, use it
      if (field.defaultValue !== undefined) {
        return field.defaultValue;
      }

      // Smart defaults based on field name and type
      const fieldName = field.name.toLowerCase();

      if (fieldName.includes("media_url") || fieldName.includes("mediaurl")) {
        if (
          service.category === "Audio Generation" ||
          fieldName.includes("audio")
        ) {
          return getRandomAudio();
        }
        return getRandomVideo();
      }

      if (fieldName.includes("website_url")) {
        return "https://openai.com";
      }

      if (fieldName === "text" && field.type === "textarea") {
        if (service.id === "translate") {
          return "Our revolutionary AI platform has exceeded all expectations and delivered transformative results for our customers across the globe.";
        }
        if (service.id === "polish") {
          return "this ai product is really good and i like it alot becuse it works good for me and my team thinks its great to use everyday and it helps us be more productive";
        }
        if (service.id === "fillers") {
          return "Um, so, like, this AI product is really, uh, amazing and, you know, I think, um, everyone should, like, definitely try it out for themselves, you know?";
        }
        if (service.id === "highlights") {
          return "I have been using this revolutionary AI software for eight months now and I can honestly say it has completely transformed how our entire team collaborates and operates. The interface is incredibly intuitive, the features are remarkably robust, and the customer support is absolutely exceptional. What impressed me most was how quickly we could onboard our entire 50-person team without any technical issues whatsoever.";
        }
        if (service.id === "generate-narration") {
          return "Welcome to our comprehensive AI platform demonstration. Today we will showcase how our innovative artificial intelligence solution can transform your business processes and drive exceptional results for your organization.";
        }
        if (service.id === "smart-clips") {
          return "This AI platform has completely revolutionized how we work. The efficiency gains are absolutely remarkable and our team productivity has increased by 60%. I would definitely recommend this to other companies in our industry.";
        }
        if (fieldName.includes("prompt")) {
          return "Generate professional, engaging content that highlights key benefits and maintains brand consistency.";
        }
      }

      if (fieldName === "texts" && field.type === "array") {
        return "This product is absolutely revolutionary! Best investment I have made this year.\nThe service was adequate, nothing particularly special but it functioned as advertised.\nI am very disappointed with the quality and performance. Would not recommend.";
      }

      if (fieldName === "testimonials" && field.type === "array") {
        return `{
  "text": "This AI platform completely transformed our workflow and saved us countless hours every week while improving quality.",
  "author": "Sarah Johnson",
  "company": "TechFlow Inc.",
  "title": "Chief Operations Officer",
  "rating": 4.9
}`;
      }

      if (fieldName === "brand_context" && field.type === "object") {
        return `{
  "industry": "Artificial Intelligence & SaaS",
  "tone": "professional",
  "values": ["innovation", "customer-centric", "efficiency"],
  "target_audience": "Technology companies and startups"
}`;
      }

      if (fieldName === "testimonial" && field.type === "object") {
        return `{
  "metadata": {
    "media_url": "${getRandomVideo()}"
  }
}`;
      }

      if (fieldName === "testimonial_segments" && field.type === "array") {
        return `{
  "media_url": "${getRandomVideo()}",
  "highlights": [{
    "start_time": 10.0,
    "end_time": 20.0,
    "text": "amazing results with our new platform",
    "theme": "success"
  }]
}`;
      }

      if (fieldName === "highlight_moments" && field.type === "array") {
        return `{
  "start_time": 5.0,
  "end_time": 15.0,
  "text": "efficiency gains are absolutely remarkable",
  "theme": "productivity"
}
{
  "start_time": 20.0,
  "end_time": 30.0,
  "text": "would definitely recommend this solution",
  "theme": "recommendation"
}`;
      }

      if (fieldName === "custom_prompt" || fieldName.includes("prompt")) {
        if (service.id === "translate") {
          return "Maintain professional tone while adapting cultural context appropriately.";
        }
        if (service.id === "generate-narration") {
          return "Use an engaging, confident tone suitable for executive presentations.";
        }
        if (service.id === "story-video") {
          return "Create an inspiring story that showcases customer success and business transformation.";
        }
        return "Ensure the output is professional, engaging, and maintains brand consistency.";
      }

      if (fieldName === "background_music") {
        return "https://www.soundjay.com/misc/sounds/corporate-background-music.mp3";
      }

      if (fieldName === "voice_id") {
        return getRandomVoice().id;
      }

      if (
        fieldName === "target_emotions" &&
        field.type === "select" &&
        field.options
      ) {
        return field.options[0]; // Return first emotion option
      }

      if (
        field.type === "select" &&
        field.options &&
        field.options.length > 0
      ) {
        return field.options[0]; // Return first option as default
      }

      if (field.type === "boolean") {
        return true; // Default boolean fields to true for testing
      }

      if (field.type === "number") {
        if (fieldName.includes("max_thumbnails")) return 5;
        if (fieldName.includes("max_clips")) return 3;
        return 1;
      }

      return "";
    },
    [formData, getRandomVideo, getRandomAudio, getRandomVoice]
  );

  const renderFormField = useCallback(
    (service: Service, field: ServiceField) => {
      const value = getSmartDefault(service, field);
      const fieldId = `${service.id}-${field.name}`;

      const handleChange = (newValue: any) => {
        updateFormData(service.id, field.name, newValue);
      };

      switch (field.type) {
        case "text":
          return (
            <div key={fieldId} className="space-y-2">
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                id={fieldId}
                type="text"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required={field.required}
              />
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          );

        case "textarea":
          return (
            <div key={fieldId} className="space-y-2">
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                id={fieldId}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
                required={field.required}
              />
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          );

        case "select":
          return (
            <div key={fieldId} className="space-y-2">
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <select
                id={fieldId}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required={field.required}
              >
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          );

        case "number":
          return (
            <div key={fieldId} className="space-y-2">
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <input
                id={fieldId}
                type="number"
                value={value}
                onChange={(e) => handleChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required={field.required}
              />
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          );

        case "boolean":
          return (
            <div key={fieldId} className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors"
                />
                <span className="text-sm font-medium text-gray-700">
                  {field.label}
                </span>
              </label>
              {field.description && (
                <p className="text-xs text-gray-500 ml-6">
                  {field.description}
                </p>
              )}
            </div>
          );

        case "array":
          return (
            <div key={fieldId} className="space-y-2">
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-gray-700"
              >
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <textarea
                id={fieldId}
                value={Array.isArray(value) ? value.join("\n") : value}
                onChange={(e) =>
                  handleChange(
                    e.target.value.split("\n").filter((line) => line.trim())
                  )
                }
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-y"
                required={field.required}
              />
              {field.description && (
                <p className="text-xs text-gray-500">{field.description}</p>
              )}
            </div>
          );

        default:
          return (
            <div key={fieldId} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label} (Complex Object)
              </label>
              <p className="text-xs text-gray-500">
                This field uses default test data
              </p>
            </div>
          );
      }
    },
    [getSmartDefault, updateFormData]
  );

  // Toggle result expansion
  const toggleResultExpansion = (serviceId: string) => {
    setExpandedResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  // Initialize SSE and health checks
  useEffect(() => {
    mountedRef.current = true;
    initializeSSE();
    checkHealth();

    const healthInterval = setInterval(checkHealth, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(healthInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Close all streaming connections
      Object.values(streamingConnectionsRef.current).forEach((connection) => {
        connection.close();
      });
    };
  }, [initializeSSE, checkHealth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Professional Header */}
      <div className="bg-white/95 backdrop-blur-xl shadow-2xl border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl ring-4 ring-white/50">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    AI Services Testing Platform
                  </h1>
                  <p className="text-xs text-gray-500 -mt-0.5">
                    Enterprise-grade AI service monitoring with real-time
                    streaming
                  </p>
                </div>
              </div>

              {/* Enhanced Connection Status */}
              <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 bg-gray-50/80 rounded-lg border border-gray-200/60 backdrop-blur-sm">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    connectionStatus.status === "connected"
                      ? "bg-green-400 animate-pulse shadow-lg"
                      : connectionStatus.status === "disconnected"
                        ? "bg-red-400"
                        : connectionStatus.status === "error"
                          ? "bg-yellow-400"
                          : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-xs font-medium text-gray-700">
                  {connectionStatus.status === "connected"
                    ? "Connected"
                    : connectionStatus.status === "disconnected"
                      ? "Disconnected"
                      : connectionStatus.status === "error"
                        ? "Error"
                        : "Unknown"}
                </span>
                {connectionStatus.latency && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {connectionStatus.latency}ms
                  </span>
                )}
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSystemDetails(!showSystemDetails)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-all duration-200 border border-gray-200/60 backdrop-blur-sm"
                title="System Details"
              >
                {showSystemDetails ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={checkHealth}
                className="px-3 py-1.5 text-sm bg-gray-100/80 hover:bg-gray-200/80 rounded-lg transition-all duration-200 flex items-center space-x-1 border border-gray-200/60 backdrop-blur-sm"
                title="Check Backend Health"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Health Check</span>
              </button>

              <button
                onClick={clearAllResults}
                className="px-3 py-1.5 text-sm bg-red-100/80 text-red-700 hover:bg-red-200/80 rounded-lg transition-all duration-200 flex items-center space-x-1 border border-red-200/60 backdrop-blur-sm"
                title="Clear All Results"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All</span>
              </button>

              <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50/80 px-3 py-1.5 rounded-lg border border-gray-200/60 backdrop-blur-sm">
                <Activity className="w-4 h-4" />
                <span>
                  {Object.keys(loading).filter((k) => loading[k]).length +
                    Object.keys(streamingResults).filter(
                      (k) => streamingResults[k].isStreaming
                    ).length}{" "}
                  active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced System Details Panel */}
      {showSystemDetails && (
        <div className="bg-gray-900 text-white py-4 shadow-inner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="flex items-center space-x-3">
                <Server className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-gray-400 text-xs">Backend</div>
                  <div className="font-mono">{API_BASE_URL}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-gray-400 text-xs">Active Jobs</div>
                  <div className="font-semibold">
                    {Object.keys(jobs).length +
                      Object.keys(streamingResults).filter(
                        (k) => streamingResults[k].isStreaming
                      ).length}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Network className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-gray-400 text-xs">Latency</div>
                  <div className="font-semibold">
                    {connectionStatus.latency || 0}ms
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Timer className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-gray-400 text-xs">SSE Status</div>
                  <div className="font-semibold">
                    {eventSourceRef.current?.readyState === 1
                      ? "Connected"
                      : "Disconnected"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-4 ring-blue-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm border border-gray-200/60"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </button>

          {Object.entries(serviceCategories).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === key
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-4 ring-blue-100"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm border border-gray-200/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
                <span className="px-2 py-0.5 text-xs bg-black/10 rounded-full">
                  {category.services.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Enhanced Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {(() => {
                const stats = getOverviewStats();
                const statCards = [
                  {
                    label: "Total Services",
                    value: stats.totalServices,
                    icon: Settings,
                    color: "text-gray-600",
                  },
                  {
                    label: "Tested",
                    value: stats.testedServices,
                    icon: Play,
                    color: "text-blue-600",
                  },
                  {
                    label: "Successful",
                    value: stats.successfulTests,
                    icon: CheckCircle,
                    color: "text-green-600",
                  },
                  {
                    label: "Failed",
                    value: stats.failedTests,
                    icon: AlertCircle,
                    color: "text-red-600",
                  },
                  {
                    label: "Active Jobs",
                    value: stats.activeJobs,
                    icon: Clock,
                    color: "text-yellow-600",
                  },
                  {
                    label: "Avg Response",
                    value: `${stats.avgResponseTime}ms`,
                    icon: Timer,
                    color: "text-purple-600",
                  },
                  {
                    label: "Uptime",
                    value: `${stats.uptime}%`,
                    icon: TrendingUp,
                    color: "text-emerald-600",
                  },
                ];

                return statCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 border border-gray-200/50 hover:shadow-xl transition-all duration-200 hover:scale-105"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2.5 rounded-xl bg-gray-50 ${stat.color} border shadow-sm`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {stat.label}
                          </p>
                          <p className="text-xl font-bold text-gray-900">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Enhanced Service Categories Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Object.entries(serviceCategories).map(([key, category]) => {
                const Icon = category.icon;
                const colors = getColorScheme(category.color);
                const categoryStats = {
                  total: category.services.length,
                  tested: category.services.filter(
                    (s) =>
                      results[s.id] || errors[s.id] || streamingResults[s.id]
                  ).length,
                  successful: category.services.filter(
                    (s) => results[s.id] || streamingResults[s.id]?.isComplete
                  ).length,
                  failed: category.services.filter((s) => errors[s.id]).length,
                  active: category.services.filter(
                    (s) => jobs[s.id] || streamingResults[s.id]?.isStreaming
                  ).length,
                };

                return (
                  <div
                    key={key}
                    className={`${colors.bg} ${colors.border} border-2 rounded-2xl p-6 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`p-3 rounded-xl bg-white/90 ${colors.text} border shadow-lg`}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${colors.text}`}>
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 max-w-xs">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => testAllInCategory(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium text-white ${colors.button} transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 border border-white/20`}
                      >
                        Test All
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div className="bg-white/70 rounded-lg p-3 text-center border shadow-sm">
                        <p className="text-gray-600 font-medium">Services</p>
                        <p className={`text-xl font-bold ${colors.text}`}>
                          {categoryStats.total}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 text-center border shadow-sm">
                        <p className="text-gray-600 font-medium">Tested</p>
                        <p className={`text-xl font-bold ${colors.text}`}>
                          {categoryStats.tested}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 text-center border shadow-sm">
                        <p className="text-gray-600 font-medium">Success</p>
                        <p className="text-xl font-bold text-green-600">
                          {categoryStats.successful}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 text-center border shadow-sm">
                        <p className="text-gray-600 font-medium">Failed</p>
                        <p className="text-xl font-bold text-red-600">
                          {categoryStats.failed}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg p-3 text-center border shadow-sm">
                        <p className="text-gray-600 font-medium">Active</p>
                        <p className="text-xl font-bold text-yellow-600">
                          {categoryStats.active}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Service Category Tabs */}
        {activeTab !== "overview" && serviceCategories[activeTab] && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                {(() => {
                  const Icon = serviceCategories[activeTab].icon;
                  const colors = getColorScheme(
                    serviceCategories[activeTab].color
                  );
                  return (
                    <>
                      <div
                        className={`p-4 rounded-xl bg-white shadow-xl ${colors.text} border-2 ring-4 ring-white/50`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                          {serviceCategories[activeTab].name}
                        </h2>
                        <p className="text-gray-600 text-lg">
                          {serviceCategories[activeTab].description}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span
                            className={`px-3 py-1 text-sm rounded-full font-medium ${
                              serviceCategories[activeTab].services[0]
                                .rateLimitGroup === "gpu"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            Rate Limit:{" "}
                            {serviceCategories[activeTab].services[0]
                              .rateLimitGroup === "gpu"
                              ? "10/hour per user"
                              : "Standard"}
                          </span>
                          <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full border">
                            {serviceCategories[activeTab].services.length}{" "}
                            services
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <button
                onClick={() => testAllInCategory(activeTab)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-xl hover:shadow-2xl flex items-center space-x-2 border border-white/20 hover:scale-105"
              >
                <Play className="w-5 h-5" />
                <span>Test All Services</span>
              </button>
            </div>

            {/* Enhanced Service Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {serviceCategories[activeTab].services.map((service) => {
                const isExpanded = expandedResults.has(service.id);
                const ServiceIcon = service.icon;
                const hasStreamingResult = streamingResults[service.id];
                const hasResult = results[service.id];
                const hasError = errors[service.id];

                return (
                  <div
                    key={service.id}
                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 hover:shadow-2xl transition-all duration-200 hover:scale-[1.02]"
                  >
                    <div className="p-6">
                      {/* Enhanced Service Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2.5 rounded-lg border-2 ${
                              service.type === "grpc"
                                ? "bg-purple-100 text-purple-600 border-purple-200"
                                : "bg-blue-100 text-blue-600 border-blue-200"
                            }`}
                          >
                            <ServiceIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                              <span>{service.name}</span>
                              {getStatusIndicator(service.id)}
                              {service.supportsStreaming && (
                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full border border-green-200">
                                  Streaming
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium border ${
                                  service.type === "grpc"
                                    ? "bg-purple-100 text-purple-800 border-purple-200"
                                    : "bg-blue-100 text-blue-800 border-blue-200"
                                }`}
                              >
                                {service.type.toUpperCase()}
                              </span>
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border">
                                {service.category}
                              </span>
                              {service.complexity && (
                                <span
                                  className={`px-2 py-1 text-xs rounded-full font-medium border ${
                                    service.complexity === "high"
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : service.complexity === "medium"
                                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                        : "bg-green-100 text-green-800 border-green-200"
                                  }`}
                                >
                                  {service.complexity} complexity
                                </span>
                              )}
                              {service.estimatedTime && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border">
                                  ~{service.estimatedTime}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              callAPI(service, formData[service.id])
                            }
                            disabled={
                              loading[service.id] ||
                              !!jobs[service.id] ||
                              hasStreamingResult?.isStreaming
                            }
                            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 border ${
                              loading[service.id] ||
                              jobs[service.id] ||
                              hasStreamingResult?.isStreaming
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
                                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl hover:scale-105 border-white/20"
                            }`}
                          >
                            {loading[service.id] ? (
                              <Clock className="w-4 h-4 animate-spin" />
                            ) : hasStreamingResult?.isStreaming ? (
                              <Activity className="w-4 h-4 animate-pulse" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span>
                              {hasStreamingResult?.isStreaming
                                ? "Streaming..."
                                : "Test"}
                            </span>
                          </button>

                          {/* Cancel Button */}
                          {(jobs[service.id] &&
                            (jobs[service.id].status === "processing" ||
                              jobs[service.id].status === "queued")) ||
                            (hasStreamingResult?.isStreaming && (
                              <button
                                onClick={() => {
                                  if (jobs[service.id]) {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to cancel the ${service.name} job?`
                                      )
                                    ) {
                                      cancelJob(
                                        jobs[service.id].id,
                                        service.id
                                      );
                                    }
                                  } else if (hasStreamingResult?.isStreaming) {
                                    // Cancel streaming connection
                                    if (
                                      streamingConnectionsRef.current[
                                        service.id
                                      ]
                                    ) {
                                      streamingConnectionsRef.current[
                                        service.id
                                      ].close();
                                      setStreamingResults((prev) => ({
                                        ...prev,
                                        [service.id]: {
                                          ...prev[service.id],
                                          isStreaming: false,
                                          isComplete: true,
                                        },
                                      }));
                                    }
                                  }
                                }}
                                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:scale-105 border border-red-400 flex items-center space-x-2"
                                title="Cancel Job"
                              >
                                <X className="w-4 h-4" />
                                <span>Cancel</span>
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Enhanced Service Details */}
                      <div className="space-y-4">
                        <div className="text-sm text-gray-600">
                          <p className="mb-3 leading-relaxed">
                            {service.description}
                          </p>
                          <div className="flex items-center space-x-4">
                            <span>
                              <strong>Endpoint:</strong>
                              <code className="ml-1 bg-gray-100 px-2 py-1 rounded text-xs border">
                                {service.endpoint}
                              </code>
                            </span>
                            {responseTimes[service.id] && (
                              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                Last: {responseTimes[service.id]}ms
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Service Form Fields */}
                        <div className="bg-gray-50/80 rounded-lg p-4 border border-gray-200/60 backdrop-blur-sm">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">
                            Service Parameters
                          </h4>
                          <div className="grid grid-cols-1 gap-4">
                            {service.fields.map((field) =>
                              renderFormField(service, field)
                            )}
                          </div>
                        </div>

                        {/* Enhanced Job Status Display */}
                        {jobs[service.id] && (
                          <div
                            className={`border-2 rounded-xl p-4 shadow-inner ${
                              jobs[service.id].status === "completed"
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                                : "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                                    jobs[service.id].status === "processing"
                                      ? "bg-blue-500 animate-pulse"
                                      : jobs[service.id].status === "queued"
                                        ? "bg-yellow-500"
                                        : jobs[service.id].status ===
                                            "completed"
                                          ? "bg-green-500 animate-bounce"
                                          : jobs[service.id].status === "failed"
                                            ? "bg-red-500"
                                            : jobs[service.id].status ===
                                                "cancelled"
                                              ? "bg-gray-500"
                                              : "bg-gray-500"
                                  }`}
                                ></div>
                                <span
                                  className={`text-sm font-semibold ${
                                    jobs[service.id].status === "completed"
                                      ? "text-green-800"
                                      : "text-gray-800"
                                  }`}
                                >
                                  Status:{" "}
                                  {jobs[service.id].status
                                    .charAt(0)
                                    .toUpperCase() +
                                    jobs[service.id].status.slice(1)}
                                  {jobs[service.id].status === "completed" && (
                                    <span className="ml-2">✅</span>
                                  )}
                                </span>
                                {jobs[service.id].progress !== undefined && (
                                  <span
                                    className={`text-sm font-medium px-2 py-1 rounded border ${
                                      jobs[service.id].status === "completed"
                                        ? "text-green-600 bg-green-100 border-green-200"
                                        : "text-blue-600 bg-blue-100 border-blue-200"
                                    }`}
                                  >
                                    {jobs[service.id].progress}%
                                  </span>
                                )}
                              </div>
                              {(jobs[service.id].status === "processing" ||
                                jobs[service.id].status === "queued") && (
                                <button
                                  onClick={() =>
                                    cancelJob(jobs[service.id].id, service.id)
                                  }
                                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition-colors hover:bg-red-50 border border-red-200"
                                  title="Cancel Job"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            {/* Enhanced Progress Bar */}
                            {jobs[service.id].progress !== undefined && (
                              <div
                                className={`w-full rounded-full h-3 mb-3 overflow-hidden border ${
                                  jobs[service.id].status === "completed"
                                    ? "bg-green-200 border-green-300"
                                    : "bg-blue-200 border-blue-300"
                                }`}
                              >
                                <div
                                  className={`h-3 rounded-full transition-all duration-500 ease-out shadow-inner ${
                                    jobs[service.id].status === "completed"
                                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                      : "bg-gradient-to-r from-blue-500 to-purple-500"
                                  }`}
                                  style={{
                                    width: `${jobs[service.id].progress}%`,
                                  }}
                                ></div>
                              </div>
                            )}

                            {/* Enhanced Job Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {jobs[service.id].id && (
                                <div className="bg-white/80 rounded-lg p-2 border shadow-sm">
                                  <span className="font-medium text-gray-600">
                                    Job ID:
                                  </span>
                                  <div className="font-mono text-gray-800 truncate">
                                    {jobs[service.id].id}
                                  </div>
                                </div>
                              )}
                              {jobs[service.id].created_at && (
                                <div className="bg-white/80 rounded-lg p-2 border shadow-sm">
                                  <span className="font-medium text-gray-600">
                                    Started:
                                  </span>
                                  <div className="text-gray-800">
                                    {new Date(
                                      jobs[service.id].created_at!
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              )}
                              {jobs[service.id].estimated_completion && (
                                <div className="bg-white/80 rounded-lg p-2 border shadow-sm">
                                  <span className="font-medium text-gray-600">
                                    ETA:
                                  </span>
                                  <div className="text-gray-800">
                                    {new Date(
                                      jobs[service.id].estimated_completion!
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              )}
                              {jobs[service.id].last_updated && (
                                <div className="bg-white/80 rounded-lg p-2 border shadow-sm">
                                  <span className="font-medium text-gray-600">
                                    Updated:
                                  </span>
                                  <div className="text-gray-800">
                                    {new Date(
                                      jobs[service.id].last_updated!
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Enhanced Job Error */}
                            {jobs[service.id].error && (
                              <div className="mt-3 text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 shadow-inner">
                                <strong>Job Error:</strong>{" "}
                                {jobs[service.id].error}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Enhanced Error Display */}
                        {hasError && (
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 shadow-inner">
                            <div className="flex items-start space-x-3">
                              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-red-800 mb-1">
                                  Service Error
                                </div>
                                <div className="text-sm text-red-600 leading-relaxed">
                                  {hasError}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Results Display */}
                        {(hasResult || hasStreamingResult) && (
                          <ResultDisplay
                            service={service}
                            result={hasResult}
                            streamingResult={hasStreamingResult}
                            isExpanded={isExpanded}
                            onToggleExpand={() =>
                              toggleResultExpansion(service.id)
                            }
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITestingDashboard;
