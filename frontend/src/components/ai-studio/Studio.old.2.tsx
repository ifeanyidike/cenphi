// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Sparkles,
//   Video,
//   Scissors,
//   VolumeX,
//   FileText,
//   Languages,
//   Wand2,
//   Play,
//   Settings,
//   CheckCircle,
//   Clock,
//   AlertCircle,
//   X,
//   Monitor,
//   Mic,
//   Search,
//   Filter,
//   MoreVertical,
//   ArrowRight,
//   Download,
//   Share2,
//   Eye,
//   Pause,
//   ChevronDown,
//   ChevronRight,
//   Target,
//   Users,
//   Workflow,
//   Layers,
//   RefreshCw,
//   Zap,
//   Star,
//   Calendar,
//   Bell,
//   ExternalLink,
//   Trash2,
//   RotateCcw,
//   CheckSquare,
//   ArrowLeft,
//   Save,
//   Edit,
//   Copy,
//   Heart,
//   Bookmark,
//   Palette,
//   BarChart3,
//   Hash,
//   Shield,
//   Image,
//   Music,
//   Activity,
//   Timer,
//   Type,
//   Brain,
//   Volume2,
//   TrendingUp,
// } from "lucide-react";
// import { Label } from "../ui/label";
// import { Input } from "../ui/input";
// import { Textarea } from "../ui/textarea";
// import { Switch } from "../ui/switch";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";

// // Types
// interface TestimonialData {
//   id: string;
//   customer_name: string;
//   company: string;
//   content_preview: string;
//   media_type: "video" | "text";
//   rating: number;
//   duration?: number;
//   created_at: string;
//   sentiment_score: number;
//   highlight_count?: number;
//   thumbnail?: string;
// }

// interface ProcessingJob {
//   id: string;
//   serviceId: string;
//   testimonialId?: string;
//   testimonialIds?: string[];
//   status:
//     | "queued"
//     | "processing"
//     | "completed"
//     | "failed"
//     | "cancelled"
//     | "streaming";
//   progress: number;
//   startTime: Date;
//   endTime?: Date;
//   error?: string;
//   result?: any;
//   isStreaming?: boolean;
//   config?: any;
// }

// interface StreamingResult {
//   content: string;
//   isComplete: boolean;
//   isStreaming: boolean;
//   type: "markdown" | "text" | "json";
// }

// interface VoiceOption {
//   id: string;
//   name: string;
//   accent: string;
//   gender: "male" | "female" | "neutral";
//   description: string;
// }

// type Segment = {
//   id: string;
//   keyPhrase?: string;
//   startTime: number;
//   endTime: number;
//   theme: string;
//   estimatedViralPotential: number;
//   text: string;
// };

// // Configuration Data
// const backgroundMusicOptions = [
//   { id: "ambient-corporate", name: "Ambient Corporate" },
//   { id: "upbeat-modern", name: "Upbeat Modern" },
//   { id: "inspiring-piano", name: "Inspiring Piano" },
//   { id: "tech-minimal", name: "Tech Minimal" },
//   { id: "emotional-strings", name: "Emotional Strings" },
// ];

// const platforms = [
//   { id: "instagram_reel", name: "Instagram Reel", aspect: "9:16", icon: "📱" },
//   { id: "instagram_feed", name: "Instagram Feed", aspect: "1:1", icon: "📷" },
//   { id: "facebook_post", name: "Facebook Post", aspect: "16:9", icon: "📘" },
//   { id: "tiktok", name: "TikTok", aspect: "9:16", icon: "🎵" },
//   { id: "youtube_short", name: "YouTube Short", aspect: "9:16", icon: "📺" },
//   { id: "linkedin_video", name: "LinkedIn Video", aspect: "16:9", icon: "💼" },
//   { id: "twitter_video", name: "Twitter Video", aspect: "16:9", icon: "🐦" },
// ];

// const voices = {
//   elevenlabs: [
//     {
//       id: "rachel",
//       name: "Rachel",
//       accent: "American",
//       gender: "female",
//       description: "Calm and professional",
//     },
//     {
//       id: "drew",
//       name: "Drew",
//       accent: "American",
//       gender: "male",
//       description: "Confident and clear",
//     },
//     {
//       id: "clyde",
//       name: "Clyde",
//       accent: "American",
//       gender: "male",
//       description: "Warm and friendly",
//     },
//     {
//       id: "paul",
//       name: "Paul",
//       accent: "American",
//       gender: "male",
//       description: "Authoritative and strong",
//     },
//     {
//       id: "domi",
//       name: "Domi",
//       accent: "American",
//       gender: "female",
//       description: "Young and vibrant",
//     },
//   ] as VoiceOption[],
//   openai: [
//     {
//       id: "alloy",
//       name: "Alloy",
//       accent: "American",
//       gender: "neutral",
//       description: "Balanced and versatile",
//     },
//     {
//       id: "echo",
//       name: "Echo",
//       accent: "American",
//       gender: "male",
//       description: "Clear and resonant",
//     },
//     {
//       id: "fable",
//       name: "Fable",
//       accent: "British",
//       gender: "female",
//       description: "Expressive and engaging",
//     },
//     {
//       id: "nova",
//       name: "Nova",
//       accent: "American",
//       gender: "female",
//       description: "Bright and energetic",
//     },
//     {
//       id: "shimmer",
//       name: "Shimmer",
//       accent: "American",
//       gender: "female",
//       description: "Soft and soothing",
//     },
//   ] as VoiceOption[],
// };

// // AI Services Configuration
// const AI_SERVICES = [
//   {
//     id: "enhancement",
//     title: "Video Enhancement",
//     description:
//       "Transform raw testimonials into professional-quality videos with AI-powered visual and audio improvements, including noise reduction, color grading, and brand integration.",
//     icon: Sparkles,
//     category: "video",
//     estimatedTime: "2-5 minutes",
//     complexity: "Beginner",
//     features: [
//       "4K Upscaling",
//       "Noise Reduction",
//       "Color Grading",
//       "Brand Integration",
//     ],
//     gradient: "from-purple-600 to-indigo-600",
//     isQueued: true,
//     supportsStreaming: false,
//     endpoint: "/enhance-media",
//     defaultSettings: {
//       quality: "Professional",
//       colorEnhancement: true,
//       stabilization: true,
//       removeNoise: true,
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//     },
//   },
//   {
//     id: "story_mode",
//     title: "Story Mode",
//     description:
//       "Intelligently combine highlight moments into compelling narrative videos with custom intro/outro and seamless transitions between key moments.",
//     icon: Video,
//     category: "video",
//     estimatedTime: "3-7 minutes",
//     complexity: "Intermediate",
//     features: [
//       "Highlight Extraction",
//       "Smart Editing",
//       "Custom Branding",
//       "Voice Over",
//     ],
//     gradient: "from-blue-600 to-cyan-600",
//     isQueued: true,
//     supportsStreaming: false,
//     endpoint: "/story-video",
//     defaultSettings: {
//       highlightType: "General",
//       addIntro: true,
//       addOutro: true,
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       transitionStyle: "Fade",
//       removeNoise: true,
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//       introImageUrl: "",
//       introVoicePrompt: "",
//       outroImageUrl: "",
//       outroVoicePrompt: "",
//     },
//   },
//   {
//     id: "clipping",
//     title: "Smart Clipping",
//     description:
//       "Generate multiple engaging clips automatically based on emotional highlights, perfect for social media distribution and marketing campaigns.",
//     icon: Scissors,
//     category: "video",
//     estimatedTime: "1-3 minutes",
//     complexity: "Beginner",
//     features: [
//       "Multi-Clip Generation",
//       "Emotional AI",
//       "Auto Branding",
//       "Social Ready",
//     ],
//     gradient: "from-emerald-600 to-teal-600",
//     isQueued: true,
//     supportsStreaming: false,
//     endpoint: "/smart-clips",
//     defaultSettings: {
//       maxClips: 5,
//       highlightFocus: "emotional",
//       clipStrategy: "best_moments",
//       addBranding: true,
//       includeSubtitles: true,
//       removeNoise: true,
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//     },
//   },
//   {
//     id: "platform_optimizer",
//     title: "Platform Optimizer",
//     description:
//       "Optimize testimonials for specific social platforms with intelligent aspect ratio adjustment, captions, and content-aware cropping.",
//     icon: Monitor,
//     category: "optimization",
//     estimatedTime: "1-2 minutes",
//     complexity: "Beginner",
//     features: [
//       "Multi-Platform",
//       "Smart Cropping",
//       "Auto Captions",
//       "Platform Rules",
//     ],
//     gradient: "from-orange-600 to-red-600",
//     isQueued: true,
//     supportsStreaming: false,
//     endpoint: "/optimize-platform",
//     defaultSettings: {
//       platforms: ["instagram_reel", "youtube_short"],
//       contentAwareCropping: true,
//       addCaptions: true,
//       addHashtags: true,
//       audioEnhancement: false,
//       noiseLevel: "medium",
//       preserveVoice: true,
//       normalizeVolume: true,
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       addLogo: false,
//       logoUrl: "",
//       logoPosition: "bottom-right",
//       addWatermark: false,
//       watermarkText: "",
//       watermarkPosition: "bottom-right",
//     },
//   },
//   {
//     id: "noise_removal",
//     title: "Audio Enhancement",
//     description:
//       "Remove background noise and enhance audio quality while preserving natural voice characteristics using advanced AI algorithms.",
//     icon: VolumeX,
//     category: "audio",
//     estimatedTime: "30 seconds",
//     complexity: "Beginner",
//     features: [
//       "Noise Removal",
//       "Voice Enhancement",
//       "Audio Clarity",
//       "Volume Normalization",
//     ],
//     gradient: "from-indigo-600 to-purple-600",
//     isQueued: true,
//     supportsStreaming: false,
//     endpoint: "/transcribe",
//     defaultSettings: {
//       intensity: "medium",
//       preserveVoice: true,
//       enhanceClarity: true,
//       normalizeVolume: true,
//       outputFormat: "mp3",
//       removeEcho: false,
//       processingQuality: "standard",
//       spectralGating: false,
//     },
//   },
//   {
//     id: "content_generator",
//     title: "Content Generator",
//     description:
//       "Generate high-impact marketing content from testimonials including email campaigns, blog posts, case studies, and social media posts.",
//     icon: FileText,
//     category: "content",
//     estimatedTime: "30-60 seconds",
//     complexity: "Beginner",
//     features: [
//       "Multiple Formats",
//       "SEO Optimized",
//       "Brand Voice",
//       "Ready to Publish",
//     ],
//     gradient: "from-pink-600 to-rose-600",
//     isQueued: false,
//     supportsStreaming: true,
//     endpoint: "/generate-content",
//     defaultSettings: {
//       contentTypes: ["Email Campaign", "Blog Post"],
//       tone: "professional",
//       contentLength: "medium",
//       targetAudience: "potential customers",
//       autoSelectPositive: true,
//       includeMetrics: true,
//       seoOptimization: false,
//       includeCTA: true,
//       brandVoice: "",
//       customRequirements: "",
//       seoKeywords: "",
//       focusKeyword: "",
//     },
//   },
//   {
//     id: "text_polishing",
//     title: "Text Enhancement",
//     description:
//       "Polish and enhance written testimonials while maintaining authenticity and original voice, improving clarity and impact.",
//     icon: Wand2,
//     category: "content",
//     estimatedTime: "15 seconds",
//     complexity: "Beginner",
//     features: [
//       "Grammar Enhancement",
//       "Tone Optimization",
//       "Clarity Improvement",
//       "Authenticity Preservation",
//     ],
//     gradient: "from-violet-600 to-purple-600",
//     isQueued: false,
//     supportsStreaming: true,
//     endpoint: "/polish",
//     defaultSettings: {
//       preserveAuthenticity: true,
//       targetStyle: "professional",
//       grammarCorrection: true,
//       lengthOptimization: "maintain",
//       tone: "neutral",
//     },
//   },
//   {
//     id: "translation",
//     title: "Translation",
//     description:
//       "Translate testimonials to multiple languages while preserving emotional tone and cultural context for global marketing reach.",
//     icon: Languages,
//     category: "content",
//     estimatedTime: "10-30 seconds",
//     complexity: "Beginner",
//     features: [
//       "60+ Languages",
//       "Tone Preservation",
//       "Cultural Adaptation",
//       "Native Quality",
//     ],
//     gradient: "from-teal-600 to-cyan-600",
//     isQueued: false,
//     supportsStreaming: true,
//     endpoint: "/translate",
//     defaultSettings: {
//       targetLanguages: ["Spanish", "French"],
//       preserveTone: true,
//       culturalAdaptation: true,
//       formalityLevel: "neutral",
//     },
//   },
//   {
//     id: "narration",
//     title: "AI Narration",
//     description:
//       "Convert text testimonials to professional audio narration using premium AI voices from ElevenLabs and OpenAI with customizable settings.",
//     icon: Mic,
//     category: "audio",
//     estimatedTime: "30-90 seconds",
//     complexity: "Intermediate",
//     features: [
//       "Premium AI Voices",
//       "Natural Speech",
//       "Custom Settings",
//       "Multiple Providers",
//     ],
//     gradient: "from-rose-600 to-pink-600",
//     isQueued: true,
//     supportsStreaming: false,
//     endpoint: "/generate-narration",
//     defaultSettings: {
//       voiceProvider: "elevenlabs",
//       selectedVoice: "rachel",
//       speed: "1.0x",
//       emotion: "professional",
//       outputFormat: "mp3",
//       backgroundMusic: false,
//       selectedMusic: "",
//       customMusicUrl: "",
//       musicVolume: 15,
//       enhanceAudio: true,
//     },
//   },
// ];

// const TESTIMONIALS_DATA: TestimonialData[] = [
//   {
//     id: "1",
//     customer_name: "Sarah Johnson",
//     company: "TechCorp Solutions",
//     content_preview:
//       "This product completely transformed our workflow and increased our team's productivity by 300%. The customer support is exceptional and the implementation was seamless.",
//     media_type: "video",
//     rating: 5,
//     duration: 120,
//     created_at: "2024-01-15",
//     sentiment_score: 0.95,
//     highlight_count: 4,
//     thumbnail:
//       "https://images.unsplash.com/photo-1494790108755-2616b612b5c5?w=100&h=100&fit=crop&crop=face",
//   },
//   {
//     id: "2",
//     customer_name: "Michael Chen",
//     company: "StartupX",
//     content_preview:
//       "Amazing results! Our conversion rates improved dramatically within the first month of using this solution. Highly recommend to any growing business.",
//     media_type: "text",
//     rating: 5,
//     created_at: "2024-01-10",
//     sentiment_score: 0.92,
//   },
//   {
//     id: "3",
//     customer_name: "Emily Davis",
//     company: "Enterprise Inc",
//     content_preview:
//       "Professional service and outstanding results. The ROI was immediate and substantial. This is exactly what we needed to scale our operations effectively.",
//     media_type: "video",
//     rating: 5,
//     duration: 180,
//     created_at: "2024-01-08",
//     sentiment_score: 0.98,
//     highlight_count: 6,
//     thumbnail:
//       "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
//   },
//   {
//     id: "4",
//     customer_name: "David Wilson",
//     company: "Global Dynamics",
//     content_preview:
//       "Game-changing technology that solved our biggest challenges. The team's expertise and support made all the difference in our success.",
//     media_type: "video",
//     rating: 4,
//     duration: 95,
//     created_at: "2024-01-05",
//     sentiment_score: 0.88,
//     highlight_count: 3,
//     thumbnail:
//       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
//   },
// ];

// // API Configuration
// const API_BASE_URL = "http://localhost:8081/api";

// // Markdown Renderer Component
// const MarkdownRenderer: React.FC<{
//   content: string;
//   isStreaming?: boolean;
// }> = ({ content, isStreaming = false }) => {
//   const renderMarkdown = (text: string) => {
//     let html = text
//       .replace(
//         /^### (.*$)/gim,
//         '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>'
//       )
//       .replace(
//         /^## (.*$)/gim,
//         '<h2 class="text-xl font-semibold text-gray-800 mt-6 mb-3">$1</h2>'
//       )
//       .replace(
//         /^# (.*$)/gim,
//         '<h1 class="text-2xl font-bold text-gray-900 mt-6 mb-4">$1</h1>'
//       )
//       .replace(
//         /\*\*(.*?)\*\*/g,
//         '<strong class="font-semibold text-gray-900">$1</strong>'
//       )
//       .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
//       .replace(
//         /```([\s\S]*?)```/g,
//         '<pre class="bg-gray-100 rounded-lg p-3 my-3 overflow-x-auto border"><code class="text-sm font-mono text-gray-800">$1</code></pre>'
//       )
//       .replace(
//         /`(.*?)`/g,
//         '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800 border">$1</code>'
//       )
//       .replace(/^\* (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
//       .replace(/^- (.*$)/gim, '<li class="ml-4 text-gray-700">• $1</li>')
//       .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-gray-700">$1</li>')
//       .replace(
//         /\[([^\]]+)\]\(([^)]+)\)/g,
//         '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>'
//       )
//       .replace(/\n\n/g, '</p><p class="text-gray-700 leading-relaxed mb-3">')
//       .replace(/\n/g, "<br>");

//     if (
//       !html.includes("<p>") &&
//       !html.includes("<h1>") &&
//       !html.includes("<h2>")
//     ) {
//       html = `<p class="text-gray-700 leading-relaxed mb-3">${html}</p>`;
//     }

//     return html;
//   };

//   return (
//     <div className="prose prose-sm max-w-none">
//       <div
//         className="markdown-content"
//         dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
//       />
//       {isStreaming && (
//         <div className="inline-flex items-center ml-1">
//           <div className="w-2 h-4 bg-blue-500 animate-pulse rounded-sm"></div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Toast Notification Component
// const Toast: React.FC<{
//   message: string;
//   action?: string;
//   onAction?: () => void;
//   onClose: () => void;
// }> = ({ message, action, onAction, onClose }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 50, scale: 0.95 }}
//     animate={{ opacity: 1, y: 0, scale: 1 }}
//     exit={{ opacity: 0, y: 50, scale: 0.95 }}
//     className="fixed bottom-6 right-6 bg-white border shadow-lg rounded-lg p-4 max-w-md z-50"
//   >
//     <div className="flex items-start gap-3">
//       <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
//       <div className="flex-1">
//         <p className="text-sm font-medium text-gray-900">{message}</p>
//         {action && (
//           <button
//             onClick={onAction}
//             className="p-0 h-auto text-blue-600 font-medium text-sm underline mt-1"
//           >
//             {action}
//           </button>
//         )}
//       </div>
//       <button
//         onClick={onClose}
//         className="h-6 w-6 p-0 flex items-center justify-center text-gray-400 hover:text-gray-600"
//       >
//         <X className="h-4 w-4" />
//       </button>
//     </div>
//   </motion.div>
// );

// // Service Configuration Page Component
// const ServiceConfigPage: React.FC<{
//   service: any;
//   selectedTestimonials: string[];
//   onBack: () => void;
//   onProcess: (serviceId: string, config: any) => void;
//   savedPresets: any[];
//   onSavePreset: (serviceId: string, preset: any) => void;
//   onDeletePreset: (serviceId: string, presetId: string) => void;
//   onSetDefaultPreset: (serviceId: string, preset: any) => void;
//   defaultPreset: any;
// }> = ({
//   service,
//   selectedTestimonials,
//   onBack,
//   onProcess,
//   savedPresets,
//   onSavePreset,
//   onDeletePreset,
//   onSetDefaultPreset,
//   defaultPreset,
// }) => {
//   const [config, setConfig] = useState(service?.defaultSettings || {});
//   const [presetName, setPresetName] = useState("");
//   const [showSavePreset, setShowSavePreset] = useState(false);
//   const [selectedPreset, setSelectedPreset] = useState(null);

//   const [highlightPreviewModal, setHighlightPreviewModal] =
//     useState<boolean>(false);
//   const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
//   const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
//   const [segmentAnalysis, setSegmentAnalysis] = useState({});
//   const [realTimeROI, setRealTimeROI] = useState({
//     engagement: 0,
//     cost: 0,
//     revenue: 0,
//   });
//   const [collaborativeMode, setCollaborativeMode] = useState(false);
//   const [brandComplianceScore, setBrandComplianceScore] = useState(100);

//   useEffect(() => {
//     if (service && defaultPreset) {
//       setConfig(defaultPreset.config);
//     } else if (service) {
//       setConfig(service.defaultSettings || {});
//     }
//   }, [service, defaultPreset]);

//   const updateConfig = (key: string, value: any) => {
//     setConfig((prev: any) => ({ ...prev, [key]: value }));
//   };

//   const handleSavePreset = () => {
//     if (presetName.trim()) {
//       onSavePreset(service.id, {
//         id: Date.now().toString(),
//         name: presetName.trim(),
//         config: { ...config },
//         createdAt: new Date(),
//       });
//       setPresetName("");
//       setShowSavePreset(false);
//     }
//   };

//   const handleLoadPreset = (preset: any) => {
//     setConfig(preset.config);
//     setSelectedPreset(preset);
//   };

//   const handleProcess = () => {
//     onProcess(service.id, config);
//   };

//   const renderConfigOptions = () => {
//     switch (service.id) {
//       case "enhancement":
//         return (
//           <div className="space-y-12">
//             {/* Quality & Processing Section */}
//             <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
//                   <Sparkles className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Quality & Processing
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure enhancement quality and visual improvements
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Enhancement Quality
//                     </Label>
//                     <Select
//                       value={config.quality}
//                       onValueChange={(value) => updateConfig("quality", value)}
//                     >
//                       <SelectTrigger className="h-12 text-base">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="Professional">
//                           <div className="py-2">
//                             <div className="font-semibold">Professional</div>
//                             <div className="text-sm text-gray-500">
//                               Highest quality, best results
//                             </div>
//                           </div>
//                         </SelectItem>
//                         <SelectItem value="High">
//                           <div className="py-2">
//                             <div className="font-semibold">High</div>
//                             <div className="text-sm text-gray-500">
//                               Great quality, faster processing
//                             </div>
//                           </div>
//                         </SelectItem>
//                         <SelectItem value="Standard">
//                           <div className="py-2">
//                             <div className="font-semibold">Standard</div>
//                             <div className="text-sm text-gray-500">
//                               Good quality, quickest processing
//                             </div>
//                           </div>
//                         </SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "colorEnhancement",
//                       label: "Color Enhancement",
//                       desc: "Professional color grading and correction",
//                       icon: Palette,
//                     },
//                     {
//                       key: "stabilization",
//                       label: "Video Stabilization",
//                       desc: "Smooth shaky footage automatically",
//                       icon: Monitor,
//                     },
//                     {
//                       key: "removeNoise",
//                       label: "Audio Enhancement",
//                       desc: "Remove background noise and improve clarity",
//                       icon: VolumeX,
//                     },
//                   ].map((option) => {
//                     const IconComponent = option.icon;
//                     return (
//                       <div
//                         key={option.key}
//                         className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-purple-300 transition-all"
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                             <IconComponent className="h-5 w-5 text-gray-600" />
//                           </div>
//                           <div>
//                             <Label className="text-base font-semibold text-gray-900">
//                               {option.label}
//                             </Label>
//                             <p className="text-sm text-gray-600">
//                               {option.desc}
//                             </p>
//                           </div>
//                         </div>
//                         <Switch
//                           checked={config[option.key]}
//                           onCheckedChange={(checked) =>
//                             updateConfig(option.key, checked)
//                           }
//                           className="data-[state=checked]:bg-purple-600"
//                         />
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Branding Section */}
//             <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
//                   <img className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Branding & Identity
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Add your logo and watermark to enhance brand presence
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 {/* Logo Section */}
//                 <div className="space-y-6">
//                   <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                     <Label className="text-base font-semibold text-gray-900">
//                       Add Logo Overlay
//                     </Label>
//                     <Switch
//                       checked={config.addLogo}
//                       onCheckedChange={(checked) =>
//                         updateConfig("addLogo", checked)
//                       }
//                       className="data-[state=checked]:bg-blue-600"
//                     />
//                   </div>

//                   <AnimatePresence>
//                     {config.addLogo && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: "auto" }}
//                         exit={{ opacity: 0, height: 0 }}
//                         className="space-y-4"
//                       >
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Logo URL
//                           </Label>
//                           <Input
//                             placeholder="https://example.com/logo.png"
//                             value={config.logoUrl || ""}
//                             onChange={(e) =>
//                               updateConfig("logoUrl", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Logo Position
//                           </Label>
//                           <div className="grid grid-cols-2 gap-2">
//                             {[
//                               { value: "top-left", label: "Top Left" },
//                               { value: "top-right", label: "Top Right" },
//                               { value: "bottom-left", label: "Bottom Left" },
//                               { value: "bottom-right", label: "Bottom Right" },
//                             ].map((position) => (
//                               <button
//                                 key={position.value}
//                                 className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
//                                   config.logoPosition === position.value
//                                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                                     : "border-gray-200 hover:border-gray-300"
//                                 }`}
//                                 onClick={() =>
//                                   updateConfig("logoPosition", position.value)
//                                 }
//                               >
//                                 {position.label}
//                               </button>
//                             ))}
//                           </div>
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>

//                 {/* Watermark Section */}
//                 <div className="space-y-6">
//                   <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                     <Label className="text-base font-semibold text-gray-900">
//                       Add Watermark
//                     </Label>
//                     <Switch
//                       checked={config.addWatermark}
//                       onCheckedChange={(checked) =>
//                         updateConfig("addWatermark", checked)
//                       }
//                       className="data-[state=checked]:bg-blue-600"
//                     />
//                   </div>

//                   <AnimatePresence>
//                     {config.addWatermark && (
//                       <motion.div
//                         initial={{ opacity: 0, height: 0 }}
//                         animate={{ opacity: 1, height: "auto" }}
//                         exit={{ opacity: 0, height: 0 }}
//                         className="space-y-4"
//                       >
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Watermark Text
//                           </Label>
//                           <Input
//                             placeholder="Leave empty to use brand name"
//                             value={config.watermarkText || ""}
//                             onChange={(e) =>
//                               updateConfig("watermarkText", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                           <p className="text-xs text-gray-500 mt-1">
//                             Leave empty to automatically use your brand name
//                           </p>
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Watermark Position
//                           </Label>
//                           <div className="grid grid-cols-2 gap-2">
//                             {[
//                               { value: "top-left", label: "Top Left" },
//                               { value: "top-right", label: "Top Right" },
//                               { value: "bottom-left", label: "Bottom Left" },
//                               { value: "bottom-right", label: "Bottom Right" },
//                             ].map((position) => (
//                               <button
//                                 key={position.value}
//                                 className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
//                                   config.watermarkPosition === position.value
//                                     ? "border-blue-500 bg-blue-50 text-blue-700"
//                                     : "border-gray-200 hover:border-gray-300"
//                                 }`}
//                                 onClick={() =>
//                                   updateConfig(
//                                     "watermarkPosition",
//                                     position.value
//                                   )
//                                 }
//                               >
//                                 {position.label}
//                               </button>
//                             ))}
//                           </div>
//                         </div>
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case "story_mode":
//         return (
//           <div className="space-y-12">
//             {/* Story Configuration */}
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
//                   <Video className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Story Configuration
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure how your story video will be constructed
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Highlight Detection Type
//                     </Label>
//                     <Select
//                       value={config.highlightType}
//                       onValueChange={(value) =>
//                         updateConfig("highlightType", value)
//                       }
//                     >
//                       <SelectTrigger className="h-12 text-base">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {[
//                           {
//                             value: "General",
//                             label: "General Highlights",
//                             desc: "Overall compelling moments",
//                           },
//                           {
//                             value: "Emotional",
//                             label: "Emotional Highlights",
//                             desc: "Strong emotional impact moments",
//                           },
//                           {
//                             value: "Results",
//                             label: "Results & Metrics",
//                             desc: "Quantifiable outcomes",
//                           },
//                           {
//                             value: "Problem",
//                             label: "Problem/Solution",
//                             desc: "Challenge and resolution stories",
//                           },
//                           {
//                             value: "Recommendation",
//                             label: "Recommendations",
//                             desc: "Strong endorsements",
//                           },
//                         ].map((type) => (
//                           <SelectItem key={type.value} value={type.value}>
//                             <div className="py-2">
//                               <div className="font-semibold">{type.label}</div>
//                               <div className="text-sm text-gray-500">
//                                 {type.desc}
//                               </div>
//                             </div>
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Transition Style
//                     </Label>
//                     <div className="grid grid-cols-2 gap-3">
//                       {[
//                         {
//                           value: "Fade",
//                           label: "Smooth Fade",
//                           desc: "Gentle transitions",
//                         },
//                         {
//                           value: "Cut",
//                           label: "Quick Cut",
//                           desc: "Sharp cuts",
//                         },
//                         {
//                           value: "Slide",
//                           label: "Slide",
//                           desc: "Sliding motion",
//                         },
//                         {
//                           value: "Zoom",
//                           label: "Zoom Effect",
//                           desc: "Dynamic zoom",
//                         },
//                       ].map((style) => (
//                         <button
//                           key={style.value}
//                           className={`p-4 text-left rounded-xl border-2 transition-all ${
//                             config.transitionStyle === style.value
//                               ? "border-blue-500 bg-blue-50"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                           onClick={() =>
//                             updateConfig("transitionStyle", style.value)
//                           }
//                         >
//                           <div className="font-medium text-sm">
//                             {style.label}
//                           </div>
//                           <div className="text-xs text-gray-500">
//                             {style.desc}
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "addIntro",
//                       label: "Add Intro Sequence",
//                       desc: "Custom introduction with your branding",
//                       icon: Play,
//                     },
//                     {
//                       key: "addOutro",
//                       label: "Add Outro Sequence",
//                       desc: "Professional closing with call-to-action",
//                       icon: CheckSquare,
//                     },
//                     {
//                       key: "removeNoise",
//                       label: "Audio Enhancement",
//                       desc: "Clean and professional audio",
//                       icon: VolumeX,
//                     },
//                     {
//                       key: "addLogo",
//                       label: "Logo Overlay",
//                       desc: "Brand logo throughout the video",
//                       icon: Image,
//                     },
//                   ].map((option) => {
//                     const IconComponent = option.icon;
//                     return (
//                       <div
//                         key={option.key}
//                         className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                             <IconComponent className="h-5 w-5 text-gray-600" />
//                           </div>
//                           <div>
//                             <Label className="text-base font-semibold text-gray-900">
//                               {option.label}
//                             </Label>
//                             <p className="text-sm text-gray-600">
//                               {option.desc}
//                             </p>
//                           </div>
//                         </div>
//                         <Switch
//                           checked={config[option.key]}
//                           onCheckedChange={(checked) =>
//                             updateConfig(option.key, checked)
//                           }
//                           className="data-[state=checked]:bg-blue-600"
//                         />
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Intro/Outro Configuration */}
//             {(config.addIntro || config.addOutro) && (
//               <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
//                     <Wand2 className="h-5 w-5 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-bold text-gray-900">
//                       Intro & Outro Setup
//                     </h3>
//                     <p className="text-sm text-gray-600">
//                       Customize your video's opening and closing sequences
//                     </p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                   {config.addIntro && (
//                     <div className="space-y-6">
//                       <h4 className="text-lg font-semibold text-purple-900">
//                         Intro Configuration
//                       </h4>
//                       <div className="space-y-4">
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Intro Background Image
//                           </Label>
//                           <Input
//                             placeholder="https://example.com/intro-background.jpg"
//                             value={config.introImageUrl || ""}
//                             onChange={(e) =>
//                               updateConfig("introImageUrl", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Voice Over Script
//                           </Label>
//                           <Textarea
//                             placeholder="Enter the script for intro voice over..."
//                             value={config.introVoicePrompt || ""}
//                             onChange={(e) =>
//                               updateConfig("introVoicePrompt", e.target.value)
//                             }
//                             rows={3}
//                             className="resize-none"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {config.addOutro && (
//                     <div className="space-y-6">
//                       <h4 className="text-lg font-semibold text-purple-900">
//                         Outro Configuration
//                       </h4>
//                       <div className="space-y-4">
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Outro Background Image
//                           </Label>
//                           <Input
//                             placeholder="https://example.com/outro-background.jpg"
//                             value={config.outroImageUrl || ""}
//                             onChange={(e) =>
//                               updateConfig("outroImageUrl", e.target.value)
//                             }
//                             className="h-12"
//                           />
//                         </div>
//                         <div>
//                           <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                             Voice Over Script
//                           </Label>
//                           <Textarea
//                             placeholder="Enter the script for outro voice over..."
//                             value={config.outroVoicePrompt || ""}
//                             onChange={(e) =>
//                               updateConfig("outroVoicePrompt", e.target.value)
//                             }
//                             rows={3}
//                             className="resize-none"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Background Music */}
//             <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
//                   <Music className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Background Music
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Add atmospheric music to enhance your story
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                   <Label className="text-base font-semibold text-gray-900">
//                     Enable Background Music
//                   </Label>
//                   <Switch
//                     checked={config.backgroundMusic}
//                     onCheckedChange={(checked) =>
//                       updateConfig("backgroundMusic", checked)
//                     }
//                     className="data-[state=checked]:bg-green-600"
//                   />
//                 </div>

//                 <AnimatePresence>
//                   {config.backgroundMusic && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       className="space-y-6"
//                     >
//                       <div>
//                         <Label className="text-base font-semibold text-gray-900 mb-4 block">
//                           Choose Music Track
//                         </Label>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                           {backgroundMusicOptions.map((music) => (
//                             <button
//                               key={music.id}
//                               className={`p-4 text-left rounded-xl border-2 transition-all ${
//                                 config.selectedMusic === music.id
//                                   ? "border-green-500 bg-green-50"
//                                   : "border-gray-200 hover:border-gray-300"
//                               }`}
//                               onClick={() =>
//                                 updateConfig("selectedMusic", music.id)
//                               }
//                             >
//                               <div className="flex items-center justify-between">
//                                 <span className="font-medium">
//                                   {music.name}
//                                 </span>
//                                 {config.selectedMusic === music.id && (
//                                   <CheckCircle className="h-5 w-5 text-green-600" />
//                                 )}
//                               </div>
//                             </button>
//                           ))}
//                         </div>
//                       </div>

//                       <div>
//                         <Label className="text-sm font-medium text-gray-700 mb-2 block">
//                           Or Use Custom Music URL
//                         </Label>
//                         <Input
//                           placeholder="https://example.com/custom-music.mp3"
//                           value={config.customMusicUrl || ""}
//                           onChange={(e) =>
//                             updateConfig("customMusicUrl", e.target.value)
//                           }
//                           className="h-12"
//                         />
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
//               </div>
//             </div>
//           </div>
//         );

//       case "platform_optimizer":
//         return (
//           <div className="space-y-12">
//             {/* Platform Selection */}
//             <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center">
//                   <Monitor className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Platform Selection
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Choose target platforms for optimization
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                 {platforms.map((platform) => (
//                   <motion.div
//                     key={platform.id}
//                     whileHover={{ scale: 1.02 }}
//                     whileTap={{ scale: 0.98 }}
//                   >
//                     <button
//                       className={`w-full p-6 rounded-2xl border-2 transition-all ${
//                         config.platforms?.includes(platform.id)
//                           ? "border-orange-500 bg-orange-100 shadow-lg"
//                           : "border-gray-200 hover:border-orange-300 bg-white hover:shadow-md"
//                       }`}
//                       onClick={() => {
//                         const currentPlatforms = config.platforms || [];
//                         if (currentPlatforms.includes(platform.id)) {
//                           updateConfig(
//                             "platforms",
//                             currentPlatforms.filter((p) => p !== platform.id)
//                           );
//                         } else {
//                           updateConfig("platforms", [
//                             ...currentPlatforms,
//                             platform.id,
//                           ]);
//                         }
//                       }}
//                     >
//                       <div className="text-center space-y-3">
//                         <div className="text-3xl">{platform.icon}</div>
//                         <div>
//                           <div className="font-semibold text-sm text-gray-900">
//                             {platform.name}
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             {platform.aspect} aspect ratio
//                           </div>
//                         </div>
//                         {config.platforms?.includes(platform.id) && (
//                           <CheckCircle className="h-5 w-5 text-orange-600 mx-auto" />
//                         )}
//                       </div>
//                     </button>
//                   </motion.div>
//                 ))}
//               </div>
//             </div>

//             {/* Optimization Settings */}
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
//                   <Settings className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Optimization Features
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure platform-specific enhancements
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {[
//                   {
//                     key: "contentAwareCropping",
//                     label: "Content-Aware Cropping",
//                     desc: "Smart subject detection and framing",
//                     icon: Target,
//                   },
//                   {
//                     key: "addCaptions",
//                     label: "Auto Captions",
//                     desc: "Platform-optimized subtitles",
//                     icon: FileText,
//                   },
//                   {
//                     key: "addHashtags",
//                     label: "Smart Hashtags",
//                     desc: "Platform-specific trending tags",
//                     icon: Hash,
//                   },
//                   {
//                     key: "audioEnhancement",
//                     label: "Audio Enhancement",
//                     desc: "Professional audio processing",
//                     icon: VolumeX,
//                   },
//                 ].map((option) => {
//                   const IconComponent = option.icon;
//                   return (
//                     <div
//                       key={option.key}
//                       className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                           <IconComponent className="h-6 w-6 text-gray-600" />
//                         </div>
//                         <div>
//                           <Label className="text-base font-semibold text-gray-900">
//                             {option.label}
//                           </Label>
//                           <p className="text-sm text-gray-600">{option.desc}</p>
//                         </div>
//                       </div>
//                       <Switch
//                         checked={config[option.key]}
//                         onCheckedChange={(checked) =>
//                           updateConfig(option.key, checked)
//                         }
//                         className="data-[state=checked]:bg-blue-600"
//                       />
//                     </div>
//                   );
//                 })}
//               </div>

//               <AnimatePresence>
//                 {config.audioEnhancement && (
//                   <motion.div
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     className="mt-8 p-6 bg-indigo-100 rounded-xl"
//                   >
//                     <h4 className="text-lg font-semibold text-indigo-900 mb-4">
//                       Audio Enhancement Settings
//                     </h4>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                       <div>
//                         <Label className="text-sm font-medium text-indigo-800 mb-2 block">
//                           Noise Reduction Level
//                         </Label>
//                         <Select
//                           value={config.noiseLevel}
//                           onValueChange={(value) =>
//                             updateConfig("noiseLevel", value)
//                           }
//                         >
//                           <SelectTrigger>
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="light">Light</SelectItem>
//                             <SelectItem value="medium">
//                               Medium (Recommended)
//                             </SelectItem>
//                             <SelectItem value="aggressive">
//                               Aggressive
//                             </SelectItem>
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div className="flex items-center justify-between p-3 bg-white rounded-lg">
//                         <Label className="text-sm font-medium text-gray-900">
//                           Preserve Voice
//                         </Label>
//                         <Switch
//                           checked={config.preserveVoice}
//                           onCheckedChange={(checked) =>
//                             updateConfig("preserveVoice", checked)
//                           }
//                         />
//                       </div>
//                       <div className="flex items-center justify-between p-3 bg-white rounded-lg">
//                         <Label className="text-sm font-medium text-gray-900">
//                           Normalize Volume
//                         </Label>
//                         <Switch
//                           checked={config.normalizeVolume}
//                           onCheckedChange={(checked) =>
//                             updateConfig("normalizeVolume", checked)
//                           }
//                         />
//                       </div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         );

//       case "clipping":
//         return (
//           <div className="space-y-12">
//             {/* Smart Segment Selection */}
//             {selectedTestimonials.length > 0 && (
//               <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 mb-8">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
//                       <Brain className="h-5 w-5 text-white" />
//                     </div>
//                     <div>
//                       <h3 className="text-xl font-bold text-gray-900">
//                         AI-Powered Segment Selection
//                       </h3>
//                       <p className="text-sm text-gray-600">
//                         Preview and select the most impactful moments from your
//                         testimonials
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => setHighlightPreviewModal(true)}
//                     className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
//                   >
//                     <Eye className="h-5 w-5" />
//                     Preview & Select Segments
//                   </button>
//                 </div>

//                 {selectedSegments.length > 0 && (
//                   <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-200">
//                     <div className="flex items-center justify-between">
//                       <div className="text-sm text-gray-600">
//                         <span className="font-medium text-indigo-600">
//                           {selectedSegments.length} segments
//                         </span>{" "}
//                         selected for processing
//                       </div>
//                       <button
//                         onClick={() => setSelectedSegments([])}
//                         className="text-indigo-600 hover:text-indigo-800 text-sm"
//                       >
//                         Clear Selection
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Clip Configuration */}
//             <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 flex items-center justify-center">
//                   <Scissors className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Clip Settings
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure how clips will be generated and formatted
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Number of Clips
//                   </Label>
//                   <div className="grid grid-cols-2 gap-2">
//                     {[3, 5, 8, 10].map((num) => (
//                       <button
//                         key={num}
//                         className={`p-4 text-center rounded-xl border-2 transition-all ${
//                           config.maxClips === num
//                             ? "border-emerald-500 bg-emerald-50 text-emerald-700"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => updateConfig("maxClips", num)}
//                       >
//                         <div className="text-xl font-bold">{num}</div>
//                         <div className="text-xs">clips</div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 {/* <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Clip Duration
//                   </Label>
//                   <div className="space-y-2">
//                     {[
//                       "10 seconds",
//                       "15 seconds",
//                       "30 seconds",
//                       "45 seconds",
//                       "60 seconds",
//                     ].map((duration) => (
//                       <button
//                         key={duration}
//                         className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
//                           config.clipDuration === duration
//                             ? "border-emerald-500 bg-emerald-50 text-emerald-700"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => updateConfig("clipDuration", duration)}
//                       >
//                         {duration}
//                       </button>
//                     ))}
//                   </div>
//                 </div> */}

//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Clip Strategy
//                   </Label>
//                   <div className="space-y-2">
//                     {[
//                       {
//                         value: "best_moments",
//                         desc: "Top-rated highlights only",
//                         score: "95%+",
//                       },
//                       {
//                         value: "story_arc",
//                         desc: "Problem → Solution flow",
//                         score: "Narrative",
//                       },
//                       {
//                         value: "social_ready",
//                         desc: "Optimized for sharing",
//                         score: "Viral",
//                       },
//                       {
//                         value: "comprehensive",
//                         desc: "Cover all key points",
//                         score: "Complete",
//                       },
//                     ].map((strategy) => (
//                       <button
//                         key={strategy.value}
//                         className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
//                           config.clipStrategy === strategy.value
//                             ? "border-emerald-500 bg-emerald-50 text-emerald-700"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() =>
//                           updateConfig("clipStrategy", strategy.value)
//                         }
//                       >
//                         <div className="flex justify-between items-center">
//                           <div>
//                             <div className="font-medium">{strategy.desc}</div>
//                             <div className="text-xs text-gray-500">
//                               Strategy: {strategy.value.replace("_", " ")}
//                             </div>
//                           </div>
//                           <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
//                             {strategy.score}
//                           </div>
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Highlight Focus
//                   </Label>
//                   <div className="space-y-2">
//                     {[
//                       {
//                         value: "emotional",
//                         desc: "High emotion moments",
//                         icon: "💝",
//                       },
//                       {
//                         value: "results",
//                         desc: "Results & outcomes",
//                         icon: "📈",
//                       },
//                       {
//                         value: "transformation",
//                         desc: "Before & after stories",
//                         icon: "",
//                       },
//                       {
//                         value: "problem",
//                         desc: "Pain points addressed",
//                         icon: "🎯",
//                       },
//                       {
//                         value: "recommendation",
//                         desc: "Recommendation moments",
//                         icon: "⭐",
//                       },
//                       {
//                         value: "metrics",
//                         desc: "Numbers & statistics",
//                         icon: "📊",
//                       },
//                     ].map((focus) => (
//                       <button
//                         key={focus.value}
//                         className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
//                           config.highlightFocus === focus.value
//                             ? "border-emerald-500 bg-emerald-50 text-emerald-700"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() =>
//                           updateConfig("highlightFocus", focus.value)
//                         }
//                       >
//                         <div className="flex items-center gap-2">
//                           <span>{focus.icon}</span>
//                           <div>
//                             <div className="font-medium capitalize">
//                               {focus.value}
//                             </div>
//                             <div className="text-xs text-gray-500">
//                               {focus.desc}
//                             </div>
//                           </div>
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Enhancement Options */}
//             <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
//                   <Sparkles className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Enhancement Options
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Add professional touches to your clips
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {[
//                   {
//                     key: "includeSubtitles",
//                     label: "Auto Subtitles",
//                     desc: "Generate captions for accessibility",
//                     icon: FileText,
//                   },
//                   {
//                     key: "removeNoise",
//                     label: "Audio Enhancement",
//                     desc: "Clean and professional audio",
//                     icon: VolumeX,
//                   },
//                   {
//                     key: "addLogo",
//                     label: "Logo Overlay",
//                     desc: "Brand logo on each clip",
//                     icon: Image,
//                   },
//                   {
//                     key: "addWatermark",
//                     label: "Watermark",
//                     desc: "Brand watermark protection",
//                     icon: Shield,
//                   },
//                 ].map((option) => {
//                   const IconComponent = option.icon;
//                   return (
//                     <div
//                       key={option.key}
//                       className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                     >
//                       <div className="flex items-center gap-4">
//                         <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                           <IconComponent className="h-6 w-6 text-gray-600" />
//                         </div>
//                         <div>
//                           <Label className="text-base font-semibold text-gray-900">
//                             {option.label}
//                           </Label>
//                           <p className="text-sm text-gray-600">{option.desc}</p>
//                         </div>
//                       </div>
//                       <Switch
//                         checked={config[option.key]}
//                         onCheckedChange={(checked) =>
//                           updateConfig(option.key, checked)
//                         }
//                         className="data-[state=checked]:bg-blue-600"
//                       />
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>

//             {/* Real-Time ROI Predictor */}

//           </div>
//         );

//       case "noise_removal":
//         return (
//           <div className="space-y-12">
//             {/* Audio Processing Settings */}
//             <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center">
//                   <VolumeX className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Audio Processing
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure noise removal and audio enhancement settings
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Noise Reduction Intensity
//                     </Label>
//                     <div className="space-y-3">
//                       {[
//                         {
//                           value: "light",
//                           label: "Light",
//                           desc: "Gentle noise reduction",
//                           color: "from-green-500 to-emerald-500",
//                         },
//                         {
//                           value: "medium",
//                           label: "Medium",
//                           desc: "Balanced cleaning (Recommended)",
//                           color: "from-blue-500 to-indigo-500",
//                         },
//                         {
//                           value: "aggressive",
//                           label: "Aggressive",
//                           desc: "Maximum noise removal",
//                           color: "from-red-500 to-pink-500",
//                         },
//                       ].map((intensity) => (
//                         <button
//                           key={intensity.value}
//                           className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
//                             config.intensity === intensity.value
//                               ? "border-indigo-500 bg-indigo-50"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                           onClick={() =>
//                             updateConfig("intensity", intensity.value)
//                           }
//                         >
//                           <div className="flex items-center gap-4">
//                             <div
//                               className={`w-8 h-8 rounded-lg bg-gradient-to-r ${intensity.color}`}
//                             />
//                             <div>
//                               <div className="font-semibold">
//                                 {intensity.label}
//                               </div>
//                               <div className="text-sm text-gray-600">
//                                 {intensity.desc}
//                               </div>
//                             </div>
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Output Format
//                     </Label>
//                     <div className="grid grid-cols-3 gap-3">
//                       {[
//                         { value: "mp3", label: "MP3", desc: "Compressed" },
//                         { value: "wav", label: "WAV", desc: "Lossless" },
//                         { value: "aac", label: "AAC", desc: "Balanced" },
//                       ].map((format) => (
//                         <button
//                           key={format.value}
//                           className={`p-4 text-center rounded-xl border-2 transition-all ${
//                             config.outputFormat === format.value
//                               ? "border-indigo-500 bg-indigo-50"
//                               : "border-gray-200 hover:border-gray-300"
//                           }`}
//                           onClick={() =>
//                             updateConfig("outputFormat", format.value)
//                           }
//                         >
//                           <div className="font-semibold">{format.label}</div>
//                           <div className="text-xs text-gray-500">
//                             {format.desc}
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "preserveVoice",
//                       label: "Preserve Voice Quality",
//                       desc: "Protect vocal clarity during processing",
//                       icon: Mic,
//                     },
//                     {
//                       key: "removeEcho",
//                       label: "Remove Echo",
//                       desc: "Eliminate reverb and echo effects",
//                       icon: RefreshCw,
//                     },
//                     {
//                       key: "enhanceClarity",
//                       label: "Enhance Speech Clarity",
//                       desc: "Improve voice intelligibility",
//                       icon: Sparkles,
//                     },
//                     {
//                       key: "normalizeVolume",
//                       label: "Normalize Volume",
//                       desc: "Consistent audio levels",
//                       icon: BarChart3,
//                     },
//                   ].map((option) => {
//                     const IconComponent = option.icon;
//                     return (
//                       <div
//                         key={option.key}
//                         className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all"
//                       >
//                         <div className="flex items-center gap-4">
//                           <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
//                             <IconComponent className="h-6 w-6 text-gray-600" />
//                           </div>
//                           <div>
//                             <Label className="text-base font-semibold text-gray-900">
//                               {option.label}
//                             </Label>
//                             <p className="text-sm text-gray-600">
//                               {option.desc}
//                             </p>
//                           </div>
//                         </div>
//                         <Switch
//                           checked={config[option.key]}
//                           onCheckedChange={(checked) =>
//                             updateConfig(option.key, checked)
//                           }
//                           className="data-[state=checked]:bg-indigo-600"
//                         />
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Advanced Processing */}
//             <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
//                   <Settings className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Advanced Processing
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Fine-tune audio processing algorithms
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Processing Quality
//                   </Label>
//                   <div className="space-y-2">
//                     {[
//                       {
//                         value: "standard",
//                         label: "Standard",
//                         desc: "Good quality, faster processing",
//                       },
//                       {
//                         value: "high",
//                         label: "High",
//                         desc: "Better quality, moderate speed",
//                       },
//                       {
//                         value: "professional",
//                         label: "Professional",
//                         desc: "Best quality, slower processing",
//                       },
//                     ].map((quality) => (
//                       <button
//                         key={quality.value}
//                         className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
//                           config.processingQuality === quality.value
//                             ? "border-purple-500 bg-purple-50"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() =>
//                           updateConfig("processingQuality", quality.value)
//                         }
//                       >
//                         <div className="font-semibold">{quality.label}</div>
//                         <div className="text-sm text-gray-600">
//                           {quality.desc}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between p-6 bg-white rounded-xl border border-gray-200">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900">
//                       Spectral Gating
//                     </Label>
//                     <p className="text-sm text-gray-600">
//                       Advanced frequency-based noise reduction
//                     </p>
//                   </div>
//                   <Switch
//                     checked={config.spectralGating}
//                     onCheckedChange={(checked) =>
//                       updateConfig("spectralGating", checked)
//                     }
//                     className="data-[state=checked]:bg-purple-600"
//                   />
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       case "content_generator":
//         return (
//           <div className="space-y-12">
//             {/* Content Types Section */}
//             <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 flex items-center justify-center">
//                   <FileText className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Content Types
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Select the types of content to generate
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                 {[
//                   "Email Campaign",
//                   "Blog Post",
//                   "Case Study",
//                   "Social Media Posts",
//                   "Sales Deck",
//                   "Whitepaper",
//                   "Press Release",
//                   "Landing Page Copy",
//                   "Testimonial Wall",
//                 ].map((type) => (
//                   <button
//                     key={type}
//                     className={`p-4 text-left rounded-xl border-2 transition-all ${
//                       config.contentTypes?.includes(type)
//                         ? "border-pink-500 bg-pink-50"
//                         : "border-gray-200 hover:border-gray-300"
//                     }`}
//                     onClick={() => {
//                       const current = config.contentTypes || [];
//                       if (current.includes(type)) {
//                         updateConfig(
//                           "contentTypes",
//                           current.filter((t: string) => t !== type)
//                         );
//                       } else {
//                         updateConfig("contentTypes", [...current, type]);
//                       }
//                     }}
//                   >
//                     <div className="flex items-center justify-between">
//                       <span className="font-medium text-sm">{type}</span>
//                       {config.contentTypes?.includes(type) && (
//                         <CheckCircle className="h-4 w-4 text-pink-600" />
//                       )}
//                     </div>
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Style & Tone Section */}
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
//                   <Type className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Style & Tone
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure the writing style and target audience
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Tone & Style
//                     </label>
//                     <select
//                       value={config.tone}
//                       onChange={(e) => updateConfig("tone", e.target.value)}
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     >
//                       <option value="professional">
//                         Professional - Formal and authoritative
//                       </option>
//                       <option value="casual">
//                         Casual - Friendly and approachable
//                       </option>
//                       <option value="persuasive">
//                         Persuasive - Compelling and action-oriented
//                       </option>
//                       <option value="technical">
//                         Technical - Detailed and precise
//                       </option>
//                       <option value="friendly">
//                         Friendly - Warm and personal
//                       </option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Content Length
//                     </label>
//                     <select
//                       value={config.contentLength}
//                       onChange={(e) =>
//                         updateConfig("contentLength", e.target.value)
//                       }
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     >
//                       <option value="short">Short - Concise and punchy</option>
//                       <option value="medium">Medium - Detailed overview</option>
//                       <option value="long">
//                         Long - Comprehensive and thorough
//                       </option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Target Audience
//                     </label>
//                     <input
//                       type="text"
//                       placeholder="e.g., potential customers, existing clients, industry professionals"
//                       value={config.targetAudience || ""}
//                       onChange={(e) =>
//                         updateConfig("targetAudience", e.target.value)
//                       }
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "autoSelectPositive",
//                       label: "Auto-Select Positive Reviews",
//                       desc: "Automatically choose the most positive testimonials",
//                     },
//                     {
//                       key: "includeMetrics",
//                       label: "Include Metrics & Data",
//                       desc: "Add quantifiable results and statistics",
//                     },
//                     {
//                       key: "seoOptimization",
//                       label: "SEO Optimization",
//                       desc: "Optimize content for search engines",
//                     },
//                     {
//                       key: "includeCTA",
//                       label: "Include Call-to-Action",
//                       desc: "Add compelling calls to action",
//                     },
//                   ].map((option) => (
//                     <div
//                       key={option.key}
//                       className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                     >
//                       <div>
//                         <label className="text-base font-semibold text-gray-900">
//                           {option.label}
//                         </label>
//                         <p className="text-sm text-gray-600">{option.desc}</p>
//                       </div>
//                       <Switch
//                         checked={config[option.key]}
//                         onCheckedChange={(checked) =>
//                           updateConfig(option.key, checked)
//                         }
//                         className="data-[state=checked]:bg-blue-600"
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Brand Voice Section */}
//             <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
//                   <Heart className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Brand Voice & Guidelines
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Define your brand's personality and communication style
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Brand Voice & Guidelines
//                   </Label>
//                   <Textarea
//                     placeholder="Describe your brand's personality, communication style, and any specific guidelines..."
//                     value={config.brandVoice || ""}
//                     onChange={(e) => updateConfig("brandVoice", e.target.value)}
//                     rows={4}
//                     className="resize-none"
//                   />
//                 </div>

//                 <div>
//                   <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Custom Requirements (Optional)
//                   </Label>
//                   <Textarea
//                     placeholder="Any specific requirements, keywords to include, or formatting preferences..."
//                     value={config.customRequirements || ""}
//                     onChange={(e) =>
//                       updateConfig("customRequirements", e.target.value)
//                     }
//                     rows={4}
//                     className="resize-none"
//                   />
//                 </div>
//               </div>
//             </div>

//             {/* SEO Configuration */}
//             {config.seoOptimization && (
//               <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
//                 <div className="flex items-center gap-3 mb-6">
//                   <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
//                     <Search className="h-5 w-5 text-white" />
//                   </div>
//                   <div>
//                     <h3 className="text-xl font-bold text-gray-900">
//                       SEO Configuration
//                     </h3>
//                     <p className="text-sm text-gray-600">
//                       Optimize content for search engine visibility
//                     </p>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Target Keywords (comma separated)
//                     </Label>
//                     <Input
//                       placeholder="testimonial management, customer reviews, social proof"
//                       value={config.seoKeywords || ""}
//                       onChange={(e) =>
//                         updateConfig("seoKeywords", e.target.value)
//                       }
//                       className="h-12"
//                     />
//                   </div>
//                   <div>
//                     <Label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Focus Keyword
//                     </Label>
//                     <Input
//                       placeholder="Primary keyword for content optimization"
//                       value={config.focusKeyword || ""}
//                       onChange={(e) =>
//                         updateConfig("focusKeyword", e.target.value)
//                       }
//                       className="h-12"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         );

//       case "text_polishing":
//         return (
//           <div className="space-y-12">
//             {/* Style Configuration */}
//             <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 flex items-center justify-center">
//                   <Wand2 className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Style Configuration
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure how text should be enhanced and polished
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Target Writing Style
//                     </label>
//                     <select
//                       value={config.targetStyle}
//                       onChange={(e) =>
//                         updateConfig("targetStyle", e.target.value)
//                       }
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
//                     >
//                       <option value="professional">
//                         Professional - Formal and authoritative
//                       </option>
//                       <option value="casual">
//                         Casual - Friendly and approachable
//                       </option>
//                       <option value="marketing">
//                         Marketing - Persuasive and engaging
//                       </option>
//                       <option value="technical">
//                         Technical - Detailed and precise
//                       </option>
//                       <option value="conversational">
//                         Conversational - Natural and relaxed
//                       </option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Tone Adjustment
//                     </label>
//                     <select
//                       value={config.tone}
//                       onChange={(e) => updateConfig("tone", e.target.value)}
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
//                     >
//                       <option value="neutral">
//                         Neutral - Maintain original tone
//                       </option>
//                       <option value="enthusiastic">
//                         Enthusiastic - More energetic
//                       </option>
//                       <option value="formal">Formal - More professional</option>
//                       <option value="friendly">
//                         Friendly - More approachable
//                       </option>
//                       <option value="persuasive">
//                         Persuasive - More convincing
//                       </option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Length Optimization
//                     </label>
//                     <select
//                       value={config.lengthOptimization}
//                       onChange={(e) =>
//                         updateConfig("lengthOptimization", e.target.value)
//                       }
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
//                     >
//                       <option value="maintain">
//                         Maintain - Keep original length
//                       </option>
//                       <option value="expand">Expand - Add more detail</option>
//                       <option value="condense">
//                         Condense - Make more concise
//                       </option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "preserveAuthenticity",
//                       label: "Preserve Authenticity",
//                       desc: "Maintain the original voice and personality",
//                     },
//                     {
//                       key: "grammarCorrection",
//                       label: "Grammar Correction",
//                       desc: "Fix grammatical errors and typos",
//                     },
//                     {
//                       key: "toneAdjustment",
//                       label: "Advanced Tone Adjustment",
//                       desc: "Apply sophisticated tone modifications",
//                     },
//                     {
//                       key: "industryTerminology",
//                       label: "Industry Terminology",
//                       desc: "Use appropriate industry-specific terms",
//                     },
//                   ].map((option) => (
//                     <div
//                       key={option.key}
//                       className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-violet-300 transition-all"
//                     >
//                       <div>
//                         <label className="text-base font-semibold text-gray-900">
//                           {option.label}
//                         </label>
//                         <p className="text-sm text-gray-600">{option.desc}</p>
//                       </div>
//                       <label className="relative inline-flex items-center cursor-pointer">
//                         <input
//                           type="checkbox"
//                           checked={config[option.key]}
//                           onChange={(e) =>
//                             updateConfig(option.key, e.target.checked)
//                           }
//                           className="sr-only peer"
//                         />
//                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
//                       </label>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>

//             {/* Custom Instructions */}
//             <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center">
//                   <Edit className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Custom Instructions
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Provide specific instructions for text enhancement
//                   </p>
//                 </div>
//               </div>

//               <div>
//                 <label className="text-base font-semibold text-gray-900 mb-3 block">
//                   Custom Enhancement Prompt
//                 </label>
//                 <textarea
//                   placeholder="Enter specific instructions for how you want the text to be enhanced..."
//                   value={config.customPrompt || ""}
//                   onChange={(e) => updateConfig("customPrompt", e.target.value)}
//                   rows={4}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
//                 />
//                 <p className="text-sm text-gray-500 mt-2">
//                   Example: "Make the text more compelling for enterprise sales,
//                   emphasize ROI and business value"
//                 </p>
//               </div>
//             </div>
//           </div>
//         );

//       case "translation":
//         return (
//           <div className="space-y-12">
//             {/* Language Selection */}
//             <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 flex items-center justify-center">
//                   <Languages className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Language Selection
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Choose target languages for translation
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                 {[
//                   "Spanish",
//                   "French",
//                   "German",
//                   "Italian",
//                   "Portuguese",
//                   "Chinese",
//                   "Japanese",
//                   "Korean",
//                   "Russian",
//                   "Arabic",
//                   "Hindi",
//                   "Dutch",
//                 ].map((lang) => (
//                   <button
//                     key={lang}
//                     className={`p-4 text-center rounded-xl border-2 transition-all ${
//                       config.targetLanguages?.includes(lang)
//                         ? "border-teal-500 bg-teal-50"
//                         : "border-gray-200 hover:border-gray-300"
//                     }`}
//                     onClick={() => {
//                       const current = config.targetLanguages || [];
//                       if (current.includes(lang)) {
//                         updateConfig(
//                           "targetLanguages",
//                           current.filter((l: string) => l !== lang)
//                         );
//                       } else {
//                         updateConfig("targetLanguages", [...current, lang]);
//                       }
//                     }}
//                   >
//                     <div className="font-medium text-sm">{lang}</div>
//                     {config.targetLanguages?.includes(lang) && (
//                       <CheckCircle className="h-4 w-4 text-teal-600 mx-auto mt-2" />
//                     )}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             {/* Translation Settings */}
//             <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
//                   <Settings className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Translation Settings
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure translation quality and style
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Formality Level
//                     </label>
//                     <select
//                       value={config.formalityLevel}
//                       onChange={(e) =>
//                         updateConfig("formalityLevel", e.target.value)
//                       }
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     >
//                       <option value="formal">
//                         Formal - Professional and respectful
//                       </option>
//                       <option value="neutral">
//                         Neutral - Balanced approach
//                       </option>
//                       <option value="informal">
//                         Informal - Casual and friendly
//                       </option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   {[
//                     {
//                       key: "preserveTone",
//                       label: "Preserve Tone",
//                       desc: "Maintain the original emotional tone",
//                     },
//                     {
//                       key: "culturalAdaptation",
//                       label: "Cultural Adaptation",
//                       desc: "Adapt content for cultural context",
//                     },
//                     {
//                       key: "includeOriginal",
//                       label: "Include Original",
//                       desc: "Show original text alongside translation",
//                     },
//                     {
//                       key: "localization",
//                       label: "Localization",
//                       desc: "Adapt for local markets and customs",
//                     },
//                   ].map((option) => (
//                     <div
//                       key={option.key}
//                       className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
//                     >
//                       <div>
//                         <label className="text-base font-semibold text-gray-900">
//                           {option.label}
//                         </label>
//                         <p className="text-sm text-gray-600">{option.desc}</p>
//                       </div>
//                       <label className="relative inline-flex items-center cursor-pointer">
//                         <input
//                           type="checkbox"
//                           checked={config[option.key]}
//                           onChange={(e) =>
//                             updateConfig(option.key, e.target.checked)
//                           }
//                           className="sr-only peer"
//                         />
//                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
//                       </label>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         );

//       case "narration":
//         return (
//           <div className="space-y-12">
//             {/* Voice Selection */}
//             <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8 border border-rose-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 flex items-center justify-center">
//                   <Mic className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Voice Selection
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Choose AI voice provider and voice type
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div>
//                   <label className="text-base font-semibold text-gray-900 mb-3 block">
//                     Voice Provider
//                   </label>
//                   <select
//                     value={config.voiceProvider}
//                     onChange={(e) =>
//                       updateConfig("voiceProvider", e.target.value)
//                     }
//                     className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
//                   >
//                     <option value="elevenlabs">
//                       ElevenLabs - Premium AI Voices
//                     </option>
//                     <option value="openai">OpenAI - Natural Speech</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="text-base font-semibold text-gray-900 mb-4 block">
//                     Available Voices
//                   </label>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
//                     {(config.voiceProvider === "elevenlabs"
//                       ? voices.elevenlabs
//                       : voices.openai
//                     ).map((voice) => (
//                       <button
//                         key={voice.id}
//                         className={`p-4 text-left rounded-xl border-2 transition-all ${
//                           config.selectedVoice === voice.id
//                             ? "border-rose-500 bg-rose-50"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => updateConfig("selectedVoice", voice.id)}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-2 mb-1">
//                               <span className="font-medium text-sm">
//                                 {voice.name}
//                               </span>
//                               <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border">
//                                 {voice.gender}
//                               </span>
//                               <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full border">
//                                 {voice.accent}
//                               </span>
//                             </div>
//                             <div className="text-xs text-gray-500">
//                               {voice.description}
//                             </div>
//                           </div>
//                           {config.selectedVoice === voice.id && (
//                             <CheckCircle className="h-4 w-4 text-rose-600" />
//                           )}
//                         </div>
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Voice Settings */}
//             <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-8 border border-purple-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center">
//                   <Volume2 className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Voice Settings
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Configure speech parameters and audio quality
//                   </p>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-6">
//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Speech Speed
//                     </label>
//                     <select
//                       value={config.speed}
//                       onChange={(e) => updateConfig("speed", e.target.value)}
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     >
//                       <option value="0.75x">0.75x - Slower</option>
//                       <option value="1.0x">1.0x - Normal</option>
//                       <option value="1.25x">1.25x - Faster</option>
//                       <option value="1.5x">1.5x - Much Faster</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Voice Emotion
//                     </label>
//                     <select
//                       value={config.emotion}
//                       onChange={(e) => updateConfig("emotion", e.target.value)}
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     >
//                       <option value="neutral">Neutral</option>
//                       <option value="professional">Professional</option>
//                       <option value="friendly">Friendly</option>
//                       <option value="enthusiastic">Enthusiastic</option>
//                       <option value="calm">Calm</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="text-base font-semibold text-gray-900 mb-3 block">
//                       Output Format
//                     </label>
//                     <select
//                       value={config.outputFormat}
//                       onChange={(e) =>
//                         updateConfig("outputFormat", e.target.value)
//                       }
//                       className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
//                     >
//                       <option value="mp3">
//                         MP3 - Compressed, smaller file
//                       </option>
//                       <option value="wav">WAV - Lossless, high quality</option>
//                       <option value="aac">
//                         AAC - Balanced quality and size
//                       </option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                     <div>
//                       <label className="text-base font-semibold text-gray-900">
//                         Enhance Audio Quality
//                       </label>
//                       <p className="text-sm text-gray-600">
//                         Apply additional audio processing
//                       </p>
//                     </div>
//                     <label className="relative inline-flex items-center cursor-pointer">
//                       <input
//                         type="checkbox"
//                         checked={config.enhanceAudio}
//                         onChange={(e) =>
//                           updateConfig("enhanceAudio", e.target.checked)
//                         }
//                         className="sr-only peer"
//                       />
//                       <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
//                     </label>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Background Music */}
//             <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
//               <div className="flex items-center gap-3 mb-6">
//                 <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
//                   <Music className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">
//                     Background Music
//                   </h3>
//                   <p className="text-sm text-gray-600">
//                     Add atmospheric music to enhance narration
//                   </p>
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200">
//                   <label className="text-base font-semibold text-gray-900">
//                     Enable Background Music
//                   </label>
//                   <label className="relative inline-flex items-center cursor-pointer">
//                     <input
//                       type="checkbox"
//                       checked={config.backgroundMusic}
//                       onChange={(e) =>
//                         updateConfig("backgroundMusic", e.target.checked)
//                       }
//                       className="sr-only peer"
//                     />
//                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
//                   </label>
//                 </div>

//                 {config.backgroundMusic && (
//                   <div className="space-y-6">
//                     <div>
//                       <label className="text-base font-semibold text-gray-900 mb-4 block">
//                         Choose Music Track
//                       </label>
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                         {backgroundMusicOptions.map((music) => (
//                           <button
//                             key={music.id}
//                             className={`p-4 text-left rounded-xl border-2 transition-all ${
//                               config.selectedMusic === music.id
//                                 ? "border-green-500 bg-green-50"
//                                 : "border-gray-200 hover:border-gray-300"
//                             }`}
//                             onClick={() =>
//                               updateConfig("selectedMusic", music.id)
//                             }
//                           >
//                             <div className="flex items-center justify-between">
//                               <span className="font-medium">{music.name}</span>
//                               {config.selectedMusic === music.id && (
//                                 <CheckCircle className="h-5 w-5 text-green-600" />
//                               )}
//                             </div>
//                           </button>
//                         ))}
//                       </div>
//                     </div>

//                     <div>
//                       <label className="text-base font-semibold text-gray-900 mb-3 block">
//                         Or Use Custom Music URL
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="https://example.com/custom-music.mp3"
//                         value={config.customMusicUrl || ""}
//                         onChange={(e) =>
//                           updateConfig("customMusicUrl", e.target.value)
//                         }
//                         className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
//                       />
//                     </div>

//                     <div>
//                       <label className="text-base font-semibold text-gray-900 mb-3 block">
//                         Music Volume: {config.musicVolume || 15}%
//                       </label>
//                       <input
//                         type="range"
//                         min="5"
//                         max="50"
//                         step="5"
//                         value={config.musicVolume || 15}
//                         onChange={(e) =>
//                           updateConfig("musicVolume", parseInt(e.target.value))
//                         }
//                         className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
//                       />
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         );

//       // Keep all other existing cases (enhancement, story_mode, etc.)
//       default:
//         return (
//           <div className="text-center py-12">
//             <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">
//               Configuration Available
//             </h3>
//             <p className="text-gray-600">
//               Custom settings for {service.title} will be displayed here.
//             </p>
//           </div>
//         );
//     }
//   };

//   if (!service) return null;

//   const IconComponent = service.icon;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
//       {/* Header */}
//       <div className="bg-white border-b">
//         <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={onBack}
//                 className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
//               >
//                 <ArrowLeft className="h-4 w-4" />
//                 <span className="hidden sm:inline">Back to Studio</span>
//               </button>
//               <div className="h-6 w-px bg-gray-300 hidden sm:block" />
//               <div className="flex items-center gap-3">
//                 <div
//                   className={`w-10 h-10 rounded-lg bg-gradient-to-r ${service.gradient} flex items-center justify-center`}
//                 >
//                   <IconComponent className="h-5 w-5 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
//                     {service.title} Configuration
//                   </h1>
//                   <p className="text-sm text-gray-600">
//                     Customize settings for {selectedTestimonials.length}{" "}
//                     testimonial{selectedTestimonials.length > 1 ? "s" : ""}
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setShowSavePreset(true)}
//                 className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 <Save className="h-4 w-4" />
//                 Save Preset
//               </button>
//               <button
//                 onClick={handleProcess}
//                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
//               >
//                 <Play className="h-4 w-4" />
//                 <span className="hidden sm:inline">Start Processing</span>
//                 <span className="sm:hidden">Start</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//       <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
//           {/* Saved Presets Sidebar */}
//           <div className="lg:col-span-1 order-2 lg:order-1">
//             <div className="bg-white rounded-lg border shadow-sm">
//               <div className="p-4 border-b">
//                 <h3 className="font-semibold text-gray-900 flex items-center gap-2">
//                   <Bookmark className="h-5 w-5" />
//                   Saved Presets
//                 </h3>
//               </div>
//               <div className="p-4">
//                 {savedPresets.length === 0 ? (
//                   <div className="text-center py-6 text-gray-500">
//                     <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-30" />
//                     <p className="text-sm">No saved presets</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-2">
//                     {savedPresets.map((preset: any) => (
//                       <div
//                         key={preset.id}
//                         className={`p-3 border rounded-lg cursor-pointer transition-all ${
//                           selectedPreset?.id === preset.id
//                             ? "border-blue-500 bg-blue-50"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => handleLoadPreset(preset)}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex-1 min-w-0">
//                             <h4 className="font-medium text-sm truncate">
//                               {preset.name}
//                             </h4>
//                             <p className="text-xs text-gray-500">
//                               {new Date(preset.createdAt).toLocaleDateString()}
//                             </p>
//                           </div>
//                           {defaultPreset?.id === preset.id && (
//                             <Heart className="h-4 w-4 text-red-500 fill-current" />
//                           )}
//                         </div>

//                         <div className="flex gap-1 mt-2">
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               onSetDefaultPreset(service.id, preset);
//                             }}
//                             className="flex-1 text-xs px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
//                           >
//                             Make Default
//                           </button>
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               onDeletePreset(service.id, preset.id);
//                             }}
//                             className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
//                           >
//                             <Trash2 className="h-3 w-3" />
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Configuration Content */}
//           <div className="lg:col-span-3 order-1 lg:order-2">
//             <div className="bg-white rounded-lg border shadow-sm">
//               <div className="p-4 sm:p-6 border-b">
//                 <h2 className="text-lg font-semibold text-gray-900">
//                   Configuration Settings
//                 </h2>
//                 <p className="text-sm text-gray-600 mt-1">
//                   {service.description}
//                 </p>
//               </div>
//               <div className="p-4 sm:p-6">{renderConfigOptions()}</div>
//             </div>
//           </div>
//         </div>
//       </div>
//       {/* Save Preset Modal */}
//       {showSavePreset && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
//             <h3 className="text-lg font-semibold mb-4">
//               Save Configuration Preset
//             </h3>
//             <div className="space-y-4">
//               <div>
//                 <label className="text-sm font-medium block mb-2">
//                   Preset Name
//                 </label>
//                 <input
//                   type="text"
//                   placeholder="Enter preset name..."
//                   value={presetName}
//                   onChange={(e) => setPresetName(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => {
//                     setShowSavePreset(false);
//                     setPresetName("");
//                   }}
//                   className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSavePreset}
//                   disabled={!presetName.trim()}
//                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Save Preset
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       <HighlightSegmentModal
//         isOpen={highlightPreviewModal}
//         onClose={() => setHighlightPreviewModal(false)}
//         testimonials={TESTIMONIALS_DATA.filter((t) =>
//           selectedTestimonials.includes(t.id)
//         )}
//         videoPreviewUrl={videoPreviewUrl}
//         onSegmentsSelected={setSelectedSegments}
//       />
//     </div>
//   );
// };

// // Main AI Studio Component
// const AIStudio: React.FC = () => {
//   const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(
//     []
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [activeTab, setActiveTab] = useState("testimonials");
//   const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
//   const [streamingResults, setStreamingResults] = useState<
//     Record<string, StreamingResult>
//   >({});
//   const [showFilters, setShowFilters] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("all");
//   const [toast, setToast] = useState<any>(null);
//   const [currentConfigService, setCurrentConfigService] = useState<any>(null);
//   const [savedPresets, setSavedPresets] = useState<Record<string, any[]>>({});
//   const [defaultPresets, setDefaultPresets] = useState<Record<string, any>>({});

//   const [highlightPreviewModal, setHighlightPreviewModal] =
//     useState<boolean>(false);
//   const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
//   const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
//   const [segmentAnalysis, setSegmentAnalysis] = useState({});
//   const [realTimeROI, setRealTimeROI] = useState({
//     engagement: 0,
//     cost: 0,
//     revenue: 0,
//   });
//   const [collaborativeMode, setCollaborativeMode] = useState(false);
//   const [brandComplianceScore, setBrandComplianceScore] = useState(100);

//   // SSE and WebSocket connections
//   const eventSourceRef = useRef<EventSource | null>(null);
//   const streamingConnectionsRef = useRef<Record<string, EventSource>>({});
//   const mountedRef = useRef(true);

//   // Filter testimonials
//   const filteredTestimonials = TESTIMONIALS_DATA.filter((testimonial) => {
//     const matchesSearch =
//       !searchTerm ||
//       testimonial.customer_name
//         ?.toLowerCase()
//         .includes(searchTerm.toLowerCase()) ||
//       testimonial.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       testimonial.content_preview
//         ?.toLowerCase()
//         .includes(searchTerm.toLowerCase());

//     const matchesFilter =
//       filterType === "all" ||
//       (filterType === "video" && testimonial.media_type === "video") ||
//       (filterType === "text" && testimonial.media_type === "text") ||
//       (filterType === "high_rating" && testimonial.rating >= 4) ||
//       (filterType === "high_sentiment" && testimonial.sentiment_score >= 0.9);

//     return matchesSearch && matchesFilter;
//   });

//   // Filter services
//   const filteredServices =
//     selectedCategory === "all"
//       ? AI_SERVICES
//       : AI_SERVICES.filter((service) => service.category === selectedCategory);

//   // Handle testimonial selection
//   const toggleTestimonialSelection = (testimonialId: string) => {
//     setSelectedTestimonials((prev) => {
//       if (prev.includes(testimonialId)) {
//         return prev.filter((id) => id !== testimonialId);
//       } else {
//         return [...prev, testimonialId];
//       }
//     });
//   };

//   const selectAllTestimonials = () => {
//     setSelectedTestimonials(filteredTestimonials.map((t) => t.id));
//   };

//   const clearSelection = () => {
//     setSelectedTestimonials([]);
//   };

//   // Initialize SSE connection
//   const initializeSSE = useCallback(() => {
//     if (eventSourceRef.current) {
//       eventSourceRef.current.close();
//     }

//     const eventSource = new EventSource(`${API_BASE_URL}/jobs/stream`);
//     eventSourceRef.current = eventSource;

//     eventSource.onopen = () => {
//       console.log("✅ SSE connection established");
//     };

//     eventSource.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("📨 SSE event received:", data);

//         if (data.job_id && data.service_id) {
//           handleJobStatusUpdate(data.service_id, data);
//         }
//       } catch (error) {
//         console.error("Error parsing SSE data:", error);
//       }
//     };

//     eventSource.addEventListener("job_completed", (event) => {
//       try {
//         const data = JSON.parse((event as any).data);
//         console.log("✅ Job completed:", data);
//         handleJobCompletion(data.service_id, data);
//       } catch (error) {
//         console.error("Error parsing job completion data:", error);
//       }
//     });

//     eventSource.addEventListener("job_failed", (event) => {
//       try {
//         const data = JSON.parse((event as any).data);
//         console.log("❌ Job failed:", data);
//         handleJobFailure(data.service_id, data);
//       } catch (error) {
//         console.error("Error parsing job failure data:", error);
//       }
//     });

//     eventSource.onerror = (error) => {
//       console.error("❌ SSE connection error:", error);
//       setTimeout(() => {
//         if (mountedRef.current) {
//           initializeSSE();
//         }
//       }, 5000);
//     };
//   }, []);

//   // Handle job status updates from SSE
//   const handleJobStatusUpdate = useCallback((serviceId: string, data: any) => {
//     if (!mountedRef.current) return;

//     setProcessingJobs((prev) =>
//       prev.map((job) =>
//         job.serviceId === serviceId
//           ? { ...job, ...data, status: data.status || job.status }
//           : job
//       )
//     );
//   }, []);

//   // Handle job completion from SSE
//   const handleJobCompletion = useCallback((serviceId: string, data: any) => {
//     if (!mountedRef.current) return;

//     setProcessingJobs((prev) =>
//       prev.map((job) =>
//         job.serviceId === serviceId
//           ? {
//               ...job,
//               status: "completed",
//               progress: 100,
//               result: data.result || data,
//               endTime: new Date(),
//             }
//           : job
//       )
//     );
//   }, []);

//   // Handle job failure from SSE
//   const handleJobFailure = useCallback((serviceId: string, data: any) => {
//     if (!mountedRef.current) return;

//     setProcessingJobs((prev) =>
//       prev.map((job) =>
//         job.serviceId === serviceId
//           ? {
//               ...job,
//               status: "failed",
//               error: data.error || "Job failed",
//               endTime: new Date(),
//             }
//           : job
//       )
//     );
//   }, []);

//   // Initialize streaming connection for a specific service
//   const initializeStreamingConnection = useCallback((serviceId: string) => {
//     if (streamingConnectionsRef.current[serviceId]) {
//       streamingConnectionsRef.current[serviceId].close();
//     }

//     const streamingEventSource = new EventSource(
//       `${API_BASE_URL}${AI_SERVICES.find((s) => s.id === serviceId)?.endpoint}/stream`
//     );
//     streamingConnectionsRef.current[serviceId] = streamingEventSource;

//     streamingEventSource.onopen = () => {
//       console.log(`✅ Streaming connection established for ${serviceId}`);
//     };

//     streamingEventSource.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log(`📨 Streaming data received for ${serviceId}:`, data);

//         if (data.type === "chunk") {
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               content: (prev[serviceId]?.content || "") + data.content,
//               isComplete: false,
//               isStreaming: true,
//               type: data.content_type || "text",
//             },
//           }));
//         } else if (data.type === "complete") {
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               ...prev[serviceId],
//               isComplete: true,
//               isStreaming: false,
//             },
//           }));
//         } else if (data.type === "error") {
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               ...prev[serviceId],
//               isComplete: true,
//               isStreaming: false,
//             },
//           }));
//         }
//       } catch (error) {
//         console.error(`Error parsing streaming data for ${serviceId}:`, error);
//       }
//     };

//     streamingEventSource.onerror = (error) => {
//       console.error(`❌ Streaming connection error for ${serviceId}:`, error);
//       setStreamingResults((prev) => ({
//         ...prev,
//         [serviceId]: {
//           ...prev[serviceId],
//           isComplete: true,
//           isStreaming: false,
//         },
//       }));
//     };

//     return streamingEventSource;
//   }, []);

//   // Handle processing
//   const handleProcessImmediate = (serviceId: string) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     const config =
//       defaultPresets[serviceId]?.config || service?.defaultSettings;
//     processService(serviceId, config);
//   };

//   const handleCustomizeProcess = (serviceId: string) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     setCurrentConfigService(service);
//   };

//   const processService = async (serviceId: string, config: any) => {
//     const service = AI_SERVICES.find((s) => s.id === serviceId);
//     if (!service) return;

//     const startTime = Date.now();

//     // Create job
//     const newJob: ProcessingJob = {
//       id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//       serviceId,
//       testimonialIds: selectedTestimonials,
//       status: service.supportsStreaming
//         ? "streaming"
//         : service.isQueued
//           ? "queued"
//           : "processing",
//       progress: 0,
//       startTime: new Date(),
//       config,
//     };

//     setProcessingJobs((prev) => [...prev, newJob]);
//     setCurrentConfigService(null);
//     setActiveTab("processing");

//     // Show toast notification
//     setToast({
//       message: `Processing started for ${service.title}. Estimated time: ${service.estimatedTime}`,
//       action: "View Progress",
//       onAction: () => {
//         setActiveTab("processing");
//         setToast(null);
//       },
//       onClose: () => setToast(null),
//     });

//     try {
//       // Prepare request payload
//       const payload = {
//         testimonial_ids: selectedTestimonials,
//         workspace_id: "test-workspace-id", // Replace with actual workspace ID
//         ...config,
//       };

//       if (service.supportsStreaming) {
//         // Set up streaming
//         setStreamingResults((prev) => ({
//           ...prev,
//           [serviceId]: {
//             content: "",
//             isComplete: false,
//             isStreaming: true,
//             type: service.id === "content_generator" ? "markdown" : "text",
//           },
//         }));

//         // For streaming services, we'll use fetch with streaming response
//         const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }

//         // Handle streaming response
//         if (response.body) {
//           const reader = response.body.getReader();
//           const decoder = new TextDecoder();

//           while (true) {
//             const { done, value } = await reader.read();
//             if (done) break;

//             const chunk = decoder.decode(value, { stream: true });
//             setStreamingResults((prev) => ({
//               ...prev,
//               [serviceId]: {
//                 ...prev[serviceId],
//                 content: (prev[serviceId]?.content || "") + chunk,
//               },
//             }));
//           }

//           // Mark as complete
//           setStreamingResults((prev) => ({
//             ...prev,
//             [serviceId]: {
//               ...prev[serviceId],
//               isComplete: true,
//               isStreaming: false,
//             },
//           }));

//           // Update job status
//           setProcessingJobs((prev) =>
//             prev.map((job) =>
//               job.id === newJob.id
//                 ? {
//                     ...job,
//                     status: "completed",
//                     progress: 100,
//                     endTime: new Date(),
//                   }
//                 : job
//             )
//           );
//         }
//       } else {
//         // Non-streaming service
//         const response = await fetch(`${API_BASE_URL}${service.endpoint}`, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(payload),
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }

//         const result = await response.json();

//         if (service.isQueued) {
//           // Queued job - will be handled by SSE
//           setProcessingJobs((prev) =>
//             prev.map((job) =>
//               job.id === newJob.id
//                 ? { ...job, id: result.job_id || job.id, status: "queued" }
//                 : job
//             )
//           );
//         } else {
//           // Immediate result
//           setProcessingJobs((prev) =>
//             prev.map((job) =>
//               job.id === newJob.id
//                 ? {
//                     ...job,
//                     status: "completed",
//                     progress: 100,
//                     result,
//                     endTime: new Date(),
//                   }
//                 : job
//             )
//           );
//         }
//       }

//       // Simulate progress for queued jobs
//       if (service.isQueued && !service.supportsStreaming) {
//         const progressInterval = setInterval(() => {
//           setProcessingJobs((prev) =>
//             prev.map((job) => {
//               if (
//                 job.id === newJob.id &&
//                 job.status === "processing" &&
//                 job.progress < 90
//               ) {
//                 return {
//                   ...job,
//                   progress: Math.min(job.progress + Math.random() * 15, 90),
//                 };
//               }
//               return job;
//             })
//           );
//         }, 1000);

//         // Clean up interval after job completion
//         setTimeout(() => {
//           clearInterval(progressInterval);
//         }, 30000);
//       }
//     } catch (error) {
//       console.error(`❌ API call failed for ${serviceId}:`, error);
//       setProcessingJobs((prev) =>
//         prev.map((job) =>
//           job.id === newJob.id
//             ? {
//                 ...job,
//                 status: "failed",
//                 error: error instanceof Error ? error.message : "Unknown error",
//                 endTime: new Date(),
//               }
//             : job
//         )
//       );
//     }
//   };

//   // Preset management
//   const handleSavePreset = (serviceId: string, preset: any) => {
//     setSavedPresets((prev) => ({
//       ...prev,
//       [serviceId]: [...(prev[serviceId] || []), preset],
//     }));
//   };

//   const handleDeletePreset = (serviceId: string, presetId: string) => {
//     setSavedPresets((prev) => ({
//       ...prev,
//       [serviceId]: (prev[serviceId] || []).filter((p) => p.id !== presetId),
//     }));
//   };

//   const handleSetDefaultPreset = (serviceId: string, preset: any) => {
//     setDefaultPresets((prev) => ({
//       ...prev,
//       [serviceId]: preset,
//     }));
//   };

//   const deleteJob = (jobId: string) => {
//     setProcessingJobs((prev) => prev.filter((job) => job.id !== jobId));
//   };

//   const retryJob = (jobId: string) => {
//     const job = processingJobs.find((j) => j.id === jobId);
//     if (job) {
//       processService(job.serviceId, job.config);
//       deleteJob(jobId);
//     }
//   };

//   const categories = [
//     { id: "all", label: "All Services" },
//     { id: "video", label: "Video" },
//     { id: "audio", label: "Audio" },
//     { id: "content", label: "Content" },
//     { id: "optimization", label: "Optimization" },
//   ];

//   // Initialize SSE connection
//   useEffect(() => {
//     mountedRef.current = true;
//     initializeSSE();

//     return () => {
//       mountedRef.current = false;
//       if (eventSourceRef.current) {
//         eventSourceRef.current.close();
//       }

//       // Close all streaming connections
//       Object.values(streamingConnectionsRef.current).forEach((connection) => {
//         connection.close();
//       });
//     };
//   }, [initializeSSE]);

//   // If in configuration mode, show the config page
//   if (currentConfigService) {
//     return (
//       <ServiceConfigPage
//         service={currentConfigService}
//         selectedTestimonials={selectedTestimonials}
//         onBack={() => setCurrentConfigService(null)}
//         onProcess={processService}
//         savedPresets={savedPresets[currentConfigService.id] || []}
//         onSavePreset={handleSavePreset}
//         onDeletePreset={handleDeletePreset}
//         onSetDefaultPreset={handleSetDefaultPreset}
//         defaultPreset={defaultPresets[currentConfigService.id]}
//       />
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
//       {/* Header */}
//       <div className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex items-center justify-between h-16">
//             <div className="flex items-center gap-4">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
//                 <Sparkles className="h-6 w-6 text-white" />
//               </div>
//               <div>
//                 <h1 className="text-xl font-bold text-gray-900">AI Studio</h1>
//                 <p className="text-sm text-gray-600">
//                   Transform testimonials with AI
//                 </p>
//               </div>
//             </div>

//             <div className="flex items-center gap-4">
//               {selectedTestimonials.length > 0 && (
//                 <div className="hidden sm:flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
//                   {selectedTestimonials.length} selected
//                 </div>
//               )}
//               {processingJobs.filter(
//                 (j) => j.status === "processing" || j.status === "streaming"
//               ).length > 0 && (
//                 <div className="hidden sm:flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
//                   {
//                     processingJobs.filter(
//                       (j) =>
//                         j.status === "processing" || j.status === "streaming"
//                     ).length
//                   }{" "}
//                   processing
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
//         {/* Navigation Tabs */}
//         <div className="flex flex-wrap gap-3 mb-8">
//           <button
//             onClick={() => setActiveTab("testimonials")}
//             className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
//               activeTab === "testimonials"
//                 ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-4 ring-blue-100"
//                 : "text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm border border-gray-200/60"
//             }`}
//           >
//             <Users className="w-4 h-4" />
//             <span>Select Testimonials</span>
//             {selectedTestimonials.length > 0 && (
//               <span className="px-2 py-0.5 text-xs bg-black/10 rounded-full">
//                 {selectedTestimonials.length}
//               </span>
//             )}
//           </button>

//           <button
//             onClick={() => setActiveTab("services")}
//             className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
//               activeTab === "services"
//                 ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-4 ring-blue-100"
//                 : "text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm border border-gray-200/60"
//             }`}
//           >
//             <Workflow className="w-4 h-4" />
//             <span>AI Services</span>
//           </button>

//           <button
//             onClick={() => setActiveTab("processing")}
//             className={`px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
//               activeTab === "processing"
//                 ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105 ring-4 ring-blue-100"
//                 : "text-gray-600 hover:text-gray-900 hover:bg-white/70 backdrop-blur-sm border border-gray-200/60"
//             }`}
//           >
//             <Target className="w-4 h-4" />
//             <span>Processing Monitor</span>
//             {processingJobs.filter(
//               (j) => j.status === "processing" || j.status === "streaming"
//             ).length > 0 && (
//               <span className="px-2 py-0.5 text-xs bg-black/10 rounded-full">
//                 {
//                   processingJobs.filter(
//                     (j) => j.status === "processing" || j.status === "streaming"
//                   ).length
//                 }
//               </span>
//             )}
//           </button>
//         </div>

//         {/* Tab Content */}
//         {activeTab === "testimonials" && (
//           <div className="space-y-6">
//             {/* Header */}
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">
//                   Select Testimonials
//                 </h2>
//                 <p className="text-gray-600 mt-1">
//                   Choose testimonials to process with AI services
//                 </p>
//               </div>
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={selectAllTestimonials}
//                   disabled={filteredTestimonials.length === 0}
//                   className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Select All
//                 </button>
//                 <button
//                   onClick={clearSelection}
//                   disabled={selectedTestimonials.length === 0}
//                   className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Clear All
//                 </button>
//               </div>
//             </div>

//             {/* Search and Filters */}
//             <div className="space-y-4">
//               <div className="flex gap-4">
//                 <div className="relative flex-1">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                   <input
//                     type="text"
//                     placeholder="Search testimonials..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   />
//                 </div>
//                 <button
//                   onClick={() => setShowFilters(!showFilters)}
//                   className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                 >
//                   <Filter className="h-4 w-4" />
//                   Filters
//                   {showFilters ? (
//                     <ChevronDown className="h-4 w-4" />
//                   ) : (
//                     <ChevronRight className="h-4 w-4" />
//                   )}
//                 </button>
//               </div>

//               <AnimatePresence>
//                 {showFilters && (
//                   <motion.div
//                     initial={{ opacity: 0, height: 0 }}
//                     animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     className="bg-white border rounded-lg p-4"
//                   >
//                     <select
//                       value={filterType}
//                       onChange={(e) => setFilterType(e.target.value)}
//                       className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     >
//                       <option value="all">All Types</option>
//                       <option value="video">Video Only</option>
//                       <option value="text">Text Only</option>
//                       <option value="high_rating">High Rating (4+)</option>
//                       <option value="high_sentiment">
//                         High Sentiment (90%+)
//                       </option>
//                     </select>
//                   </motion.div>
//                 )}
//               </AnimatePresence>
//             </div>

//             {/* Testimonials Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filteredTestimonials.map((testimonial, index) => (
//                 <motion.div
//                   key={testimonial.id}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: index * 0.1 }}
//                 >
//                   <div
//                     className={`cursor-pointer transition-all duration-200 hover:shadow-lg bg-white rounded-lg border p-6 ${
//                       selectedTestimonials.includes(testimonial.id)
//                         ? "ring-2 ring-blue-500 bg-blue-50"
//                         : "hover:shadow-md"
//                     }`}
//                     onClick={() => toggleTestimonialSelection(testimonial.id)}
//                   >
//                     <div className="flex items-start justify-between mb-4">
//                       <div className="flex items-center gap-3">
//                         {testimonial.thumbnail && (
//                           <img
//                             src={testimonial.thumbnail}
//                             alt={testimonial.customer_name}
//                             className="w-10 h-10 rounded-full object-cover"
//                           />
//                         )}
//                         <div>
//                           <h3 className="font-semibold text-gray-900">
//                             {testimonial.customer_name}
//                           </h3>
//                           <p className="text-sm text-gray-600">
//                             {testimonial.company}
//                           </p>
//                         </div>
//                       </div>
//                       {selectedTestimonials.includes(testimonial.id) && (
//                         <CheckCircle className="h-5 w-5 text-blue-600" />
//                       )}
//                     </div>

//                     <p className="text-sm text-gray-700 mb-4 line-clamp-3">
//                       {testimonial.content_preview}
//                     </p>

//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center gap-4">
//                         {testimonial.media_type === "video" ? (
//                           <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
//                             <Video className="h-3 w-3" />
//                             Video
//                           </div>
//                         ) : (
//                           <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
//                             <FileText className="h-3 w-3" />
//                             Text
//                           </div>
//                         )}
//                         <div className="flex items-center gap-1">
//                           <Star className="h-4 w-4 text-yellow-500 fill-current" />
//                           <span className="text-sm font-medium">
//                             {testimonial.rating}
//                           </span>
//                         </div>
//                       </div>
//                       {testimonial.duration && (
//                         <span className="text-xs text-gray-500">
//                           {Math.round(testimonial.duration / 60)}m
//                         </span>
//                       )}
//                     </div>

//                     {testimonial.highlight_count && (
//                       <div className="mt-3 pt-3 border-t">
//                         <div className="flex items-center justify-between text-sm">
//                           <span className="text-gray-600">
//                             {testimonial.highlight_count} highlights detected
//                           </span>
//                           <span className="text-gray-600">
//                             {Math.round(testimonial.sentiment_score * 100)}%
//                             positive
//                           </span>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </motion.div>
//               ))}
//             </div>

//             {filteredTestimonials.length === 0 && (
//               <div className="text-center py-12">
//                 <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">
//                   No testimonials found
//                 </h3>
//                 <p className="text-gray-600">
//                   Try adjusting your search or filter criteria
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "services" && (
//           <div className="space-y-6">
//             {/* Header */}
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">AI Services</h2>
//               <p className="text-gray-600 mt-1">
//                 Select the AI service to apply to your testimonials
//               </p>
//             </div>

//             {/* Category Filter */}
//             <div className="flex gap-2 overflow-x-auto">
//               {categories.map((category) => (
//                 <button
//                   key={category.id}
//                   onClick={() => setSelectedCategory(category.id)}
//                   className={`whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors ${
//                     selectedCategory === category.id
//                       ? "bg-blue-600 text-white hover:bg-blue-700"
//                       : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
//                   }`}
//                 >
//                   {category.label}
//                 </button>
//               ))}
//             </div>

//             {/* Services Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {filteredServices.map((service, index) => {
//                 const IconComponent = service.icon;
//                 const config =
//                   defaultPresets[service.id]?.config || service.defaultSettings;

//                 return (
//                   <motion.div
//                     key={service.id}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                   >
//                     <div className="bg-white rounded-lg border shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02] h-full flex flex-col">
//                       <div className="p-6 flex-1 flex flex-col">
//                         <div className="flex items-start justify-between mb-4">
//                           <div
//                             className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.gradient} flex items-center justify-center shadow-lg`}
//                           >
//                             <IconComponent className="h-6 w-6 text-white" />
//                           </div>
//                           <div className="flex flex-col gap-1">
//                             {!service.isQueued && (
//                               <div className="px-2 py-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
//                                 Instant
//                               </div>
//                             )}
//                             {service.supportsStreaming && (
//                               <div className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded-full">
//                                 Streaming
//                               </div>
//                             )}
//                             {defaultPresets[service.id] && (
//                               <div className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center gap-1">
//                                 <Heart className="h-3 w-3 fill-current" />
//                                 Default
//                               </div>
//                             )}
//                           </div>
//                         </div>

//                         <h3 className="text-lg font-bold text-gray-900 mb-2">
//                           {service.title}
//                         </h3>
//                         <p className="text-sm text-gray-600 mb-4 flex-1">
//                           {service.description}
//                         </p>

//                         <div className="space-y-3 mb-4">
//                           <div className="flex items-center justify-between text-sm">
//                             <span className="text-gray-500">
//                               Processing time:
//                             </span>
//                             <div className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
//                               {service.estimatedTime}
//                             </div>
//                           </div>
//                           <div className="flex items-center justify-between text-sm">
//                             <span className="text-gray-500">Complexity:</span>
//                             <div className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded border">
//                               {service.complexity}
//                             </div>
//                           </div>
//                         </div>

//                         {/* Current Settings Display */}
//                         <div className="mb-4 p-3 bg-gray-50 rounded-lg">
//                           <div className="flex items-center justify-between mb-2">
//                             <h4 className="text-xs font-medium text-gray-700">
//                               Current Settings:
//                             </h4>
//                             {defaultPresets[service.id] && (
//                               <span className="text-xs text-red-600 font-medium">
//                                 {defaultPresets[service.id].name}
//                               </span>
//                             )}
//                           </div>
//                           <div className="space-y-1">
//                             {Object.entries(config || {})
//                               .slice(0, 3)
//                               .map(([key, value]) => (
//                                 <div
//                                   key={key}
//                                   className="flex justify-between text-xs"
//                                 >
//                                   <span className="text-gray-600 capitalize">
//                                     {key
//                                       .replace(/([A-Z])/g, " $1")
//                                       .toLowerCase()}
//                                     :
//                                   </span>
//                                   <span className="text-gray-800 truncate ml-2">
//                                     {Array.isArray(value)
//                                       ? value.join(", ")
//                                       : String(value)}
//                                   </span>
//                                 </div>
//                               ))}
//                           </div>
//                         </div>

//                         <div className="space-y-2">
//                           <button
//                             onClick={() => handleProcessImmediate(service.id)}
//                             disabled={selectedTestimonials.length === 0}
//                             className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
//                           >
//                             <Play className="h-4 w-4" />
//                             Process Immediately
//                           </button>
//                           <button
//                             onClick={() => handleCustomizeProcess(service.id)}
//                             disabled={selectedTestimonials.length === 0}
//                             className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
//                           >
//                             <Settings className="h-4 w-4" />
//                             Customize Processing
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   </motion.div>
//                 );
//               })}
//             </div>

//             {selectedTestimonials.length === 0 && (
//               <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
//                 <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
//                 <h3 className="font-medium text-yellow-800">
//                   Select testimonials first
//                 </h3>
//                 <p className="text-sm text-yellow-700 mt-1">
//                   Choose testimonials from the previous tab to enable processing
//                 </p>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === "processing" && (
//           <div className="space-y-6">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">
//                 Processing Monitor
//               </h2>
//               <p className="text-gray-600 mt-1">
//                 Track your AI processing jobs and download results
//               </p>
//             </div>

//             {processingJobs.length === 0 ? (
//               <div className="bg-white rounded-lg border shadow-sm">
//                 <div className="text-center py-12">
//                   <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 mb-2">
//                     No processing jobs
//                   </h3>
//                   <p className="text-gray-600">
//                     Start processing to see your jobs here
//                   </p>
//                 </div>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {processingJobs.map((job) => {
//                   const service = AI_SERVICES.find(
//                     (s) => s.id === job.serviceId
//                   );
//                   const hasStreamingResult = streamingResults[job.serviceId];

//                   return (
//                     <div
//                       key={job.id}
//                       className="bg-white rounded-lg border shadow-sm"
//                     >
//                       <div className="p-6">
//                         <div className="flex items-center justify-between mb-4">
//                           <div className="flex items-center gap-3">
//                             <div
//                               className={`w-3 h-3 rounded-full ${
//                                 job.status === "completed"
//                                   ? "bg-green-500"
//                                   : job.status === "processing" ||
//                                       job.status === "streaming"
//                                     ? "bg-blue-500 animate-pulse"
//                                     : job.status === "queued"
//                                       ? "bg-yellow-500"
//                                       : job.status === "failed"
//                                         ? "bg-red-500"
//                                         : "bg-gray-400"
//                               }`}
//                             />
//                             <div>
//                               <h3 className="font-semibold text-gray-900">
//                                 {service?.title}
//                                 {job.testimonialIds &&
//                                   ` - ${job.testimonialIds.length} testimonials`}
//                               </h3>
//                               <p className="text-sm text-gray-600">
//                                 Started {job.startTime.toLocaleTimeString()}
//                                 {job.status === "streaming" && (
//                                   <span className="ml-2 text-orange-600">
//                                     • Streaming
//                                   </span>
//                                 )}
//                               </p>
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-2">
//                             <div
//                               className={`px-3 py-1 text-xs font-medium rounded-full ${
//                                 job.status === "completed"
//                                   ? "bg-green-100 text-green-800"
//                                   : job.status === "processing" ||
//                                       job.status === "streaming"
//                                     ? "bg-blue-100 text-blue-800"
//                                     : job.status === "queued"
//                                       ? "bg-yellow-100 text-yellow-800"
//                                       : job.status === "failed"
//                                         ? "bg-red-100 text-red-800"
//                                         : "bg-gray-100 text-gray-800"
//                               }`}
//                             >
//                               {job.status}
//                             </div>

//                             <button
//                               onClick={() => deleteJob(job.id)}
//                               className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </div>

//                         {(job.status === "processing" ||
//                           job.status === "streaming") && (
//                           <div className="space-y-2 mb-4">
//                             <div className="w-full bg-gray-200 rounded-full h-2">
//                               <div
//                                 className="bg-blue-600 h-2 rounded-full transition-all duration-500"
//                                 style={{ width: `${job.progress}%` }}
//                               />
//                             </div>
//                             <div className="flex justify-between text-sm text-gray-600">
//                               <span>{Math.round(job.progress)}% complete</span>
//                               <span>
//                                 Est.{" "}
//                                 {Math.max(
//                                   1,
//                                   Math.round((100 - job.progress) / 20)
//                                 )}{" "}
//                                 min remaining
//                               </span>
//                             </div>
//                           </div>
//                         )}

//                         {/* Streaming Results Display */}
//                         {hasStreamingResult && (
//                           <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
//                             <div className="flex items-center justify-between mb-2">
//                               <h4 className="font-medium text-green-800">
//                                 {hasStreamingResult.isStreaming
//                                   ? "Streaming Results..."
//                                   : "Results"}
//                               </h4>
//                               {hasStreamingResult.isStreaming && (
//                                 <div className="flex items-center space-x-1">
//                                   <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" />
//                                   <div
//                                     className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
//                                     style={{ animationDelay: "0.1s" }}
//                                   />
//                                   <div
//                                     className="w-1 h-1 bg-green-500 rounded-full animate-bounce"
//                                     style={{ animationDelay: "0.2s" }}
//                                   />
//                                 </div>
//                               )}
//                             </div>
//                             <div className="max-h-64 overflow-y-auto">
//                               {hasStreamingResult.type === "markdown" ? (
//                                 <MarkdownRenderer
//                                   content={hasStreamingResult.content}
//                                   isStreaming={hasStreamingResult.isStreaming}
//                                 />
//                               ) : (
//                                 <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
//                                   {hasStreamingResult.content}
//                                   {hasStreamingResult.isStreaming && (
//                                     <span className="inline-flex items-center ml-1">
//                                       <div className="w-2 h-4 bg-blue-500 animate-pulse rounded-sm" />
//                                     </span>
//                                   )}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         )}

//                         {/* Job Results Display */}
//                         {job.status === "completed" &&
//                           job.result &&
//                           !hasStreamingResult && (
//                             <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
//                               <h4 className="font-medium text-green-800 mb-2">
//                                 Results
//                               </h4>
//                               <div className="max-h-64 overflow-y-auto">
//                                 <pre className="text-sm text-gray-800 whitespace-pre-wrap">
//                                   {typeof job.result === "string"
//                                     ? job.result
//                                     : JSON.stringify(job.result, null, 2)}
//                                 </pre>
//                               </div>
//                             </div>
//                           )}

//                         {job.status === "failed" && (
//                           <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
//                             <div className="flex items-start space-x-3">
//                               <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
//                               <div className="flex-1">
//                                 <div className="text-sm font-semibold text-red-800 mb-1">
//                                   Processing Failed
//                                 </div>
//                                 <div className="text-sm text-red-600">
//                                   {job.error}
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         )}

//                         {(job.status === "completed" ||
//                           job.status === "failed") && (
//                           <div className="flex gap-3 flex-wrap">
//                             {job.status === "completed" && (
//                               <>
//                                 <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                                   <Download className="h-4 w-4" />
//                                   Download
//                                 </button>
//                                 <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                                   <Eye className="h-4 w-4" />
//                                   Preview
//                                 </button>
//                                 <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
//                                   <Share2 className="h-4 w-4" />
//                                   Share
//                                 </button>
//                               </>
//                             )}
//                             <button
//                               onClick={() => retryJob(job.id)}
//                               className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
//                             >
//                               <RotateCcw className="h-4 w-4" />
//                               Retry
//                             </button>
//                           </div>
//                         )}

//                         {job.status === "queued" && (
//                           <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg flex items-center gap-2">
//                             <Clock className="h-4 w-4" />
//                             Waiting in queue...
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Toast Notifications */}
//       <AnimatePresence>
//         {toast && (
//           <Toast
//             message={toast.message}
//             action={toast.action}
//             onAction={toast.onAction}
//             onClose={toast.onClose}
//           />
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default AIStudio;

// // Add this modal component before the main return statement
// const HighlightSegmentModal = ({
//   isOpen,
//   onClose,
//   testimonials,
//   onSegmentsSelected,
//   videoPreviewUrl,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   testimonials: TestimonialData[];
//   onSegmentsSelected: (segment: Segment) => any;
//   videoPreviewUrl: string;
// }) => {
//   const [segments, setSegments] = useState<Segment[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [selectedSegments, setSelectedSegments] = useState<Segment[]>([]);
//   const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
//   const [currentPreview, setCurrentPreview] = useState(null);
//   const [analysisMode, setAnalysisMode] = useState("emotion"); // emotion, engagement, business_value

//   useEffect(() => {
//     if (isOpen && testimonials.length > 0) {
//       fetchSegments();
//     }
//   }, [isOpen, testimonials]);

//   const fetchSegments = async () => {
//     setLoading(true);
//     try {
//       // Simulate API call to get highlight segments with confidence scores
//       const mockSegments = testimonials.flatMap((testimonial) =>
//         testimonial.media_type === "video"
//           ? [
//               {
//                 id: `${testimonial.id}_1`,
//                 testimonialId: testimonial.id,
//                 text: "This solution completely transformed our entire workflow process and increased our team's productivity by over 300%",
//                 startTime: 15.2,
//                 endTime: 23.8,
//                 emotion: "excitement",
//                 confidence: 0.95,
//                 businessValue: 0.92,
//                 engagementScore: 0.88,
//                 theme: "transformation",
//                 keyPhrase: "300% productivity increase",
//                 estimatedViralPotential: 0.85,
//                 customerInfo: {
//                   name: testimonial.customer_name,
//                   company: testimonial.company,
//                   avatar: testimonial.thumbnail,
//                 },
//               },
//               {
//                 id: `${testimonial.id}_2`,
//                 text: "The ROI was immediate - we saw results within the first week and saved over $50,000 in the first quarter alone",
//                 startTime: 45.1,
//                 endTime: 52.3,
//                 emotion: "satisfaction",
//                 confidence: 0.89,
//                 businessValue: 0.96,
//                 engagementScore: 0.91,
//                 theme: "metrics",
//                 keyPhrase: "$50,000 savings",
//                 estimatedViralPotential: 0.78,
//                 customerInfo: {
//                   name: testimonial.customer_name,
//                   company: testimonial.company,
//                   avatar: testimonial.thumbnail,
//                 },
//               },
//               {
//                 id: `${testimonial.id}_3`,
//                 text: "I would absolutely recommend this to any business facing similar challenges - it's a game changer",
//                 startTime: 78.5,
//                 endTime: 85.2,
//                 emotion: "trust",
//                 confidence: 0.92,
//                 businessValue: 0.87,
//                 engagementScore: 0.94,
//                 theme: "recommendation",
//                 keyPhrase: "absolutely recommend",
//                 estimatedViralPotential: 0.82,
//                 customerInfo: {
//                   name: testimonial.customer_name,
//                   company: testimonial.company,
//                   avatar: testimonial.thumbnail,
//                 },
//               },
//             ]
//           : []
//       );
//       setSegments(mockSegments);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const previewSegment = (segment: Segment) => {
//     setCurrentPreview(segment);
//     if (videoRef) {
//       videoRef.currentTime = segment.startTime;
//       videoRef.play();

//       // Auto-pause at end time
//       const checkTime = () => {
//         if (videoRef.currentTime >= segment.endTime) {
//           videoRef.pause();
//         } else {
//           requestAnimationFrame(checkTime);
//         }
//       };
//       requestAnimationFrame(checkTime);
//     }
//   };

//   const toggleSegment = (segmentId: string) => {
//     setSelectedSegments((prev) =>
//       prev.includes(segmentId)
//         ? prev.filter((id) => id !== segmentId)
//         : [...prev, segmentId]
//     );
//   };

//   const getScoreColor = (score: number) => {
//     if (score >= 0.9) return "text-green-600 bg-green-100";
//     if (score >= 0.8) return "text-yellow-600 bg-yellow-100";
//     return "text-gray-600 bg-gray-100";
//   };

//   const getAnalysisScore = (segment: any) => {
//     switch (analysisMode) {
//       case "emotion":
//         return segment.confidence;
//       case "engagement":
//         return segment.engagementScore;
//       case "business_value":
//         return segment.businessValue;
//       default:
//         return segment.confidence;
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
//         <div className="p-6 border-b border-gray-200">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">
//                 AI-Powered Segment Selection
//               </h2>
//               <p className="text-gray-600 mt-1">
//                 Choose the most impactful moments for your content
//               </p>
//             </div>
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-2 text-sm">
//                 <span className="text-gray-600">Analysis Mode:</span>
//                 <select
//                   value={analysisMode}
//                   onChange={(e) => setAnalysisMode(e.target.value)}
//                   className="border border-gray-300 rounded-lg px-3 py-1"
//                 >
//                   <option value="emotion">Emotional Impact</option>
//                   <option value="engagement">Viral Potential</option>
//                   <option value="business_value">Business Value</option>
//                 </select>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="h-6 w-6" />
//               </button>
//             </div>
//           </div>
//         </div>

//         {loading ? (
//           <div className="p-12 text-center">
//             <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
//             <p className="text-gray-600">Analyzing video segments with AI...</p>
//           </div>
//         ) : (
//           <div className="flex h-[70vh]">
//             {/* Video Preview Panel */}
//             <div className="w-1/2 p-6 border-r border-gray-200">
//               <div className="bg-black rounded-xl overflow-hidden mb-4">
//                 <video
//                   ref={setVideoRef}
//                   className="w-full h-64 object-cover"
//                   controls
//                   src={
//                     videoPreviewUrl ||
//                     testimonials[0]?.media_url ||
//                     "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
//                   }
//                 />
//               </div>

//               {currentPreview && (
//                 <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
//                   <div className="flex items-center gap-3 mb-3">
//                     <img
//                       src={currentPreview.customerInfo.avatar}
//                       alt={currentPreview.customerInfo.name}
//                       className="w-8 h-8 rounded-full"
//                     />
//                     <div>
//                       <h4 className="font-medium text-gray-900">
//                         {currentPreview.customerInfo.name}
//                       </h4>
//                       <p className="text-sm text-gray-600">
//                         {currentPreview.customerInfo.company}
//                       </p>
//                     </div>
//                   </div>
//                   <p className="text-gray-800 mb-3">"{currentPreview.text}"</p>
//                   <div className="flex items-center gap-4 text-sm">
//                     <span className="text-blue-600 font-medium">
//                       {Math.floor(currentPreview.startTime)}s -{" "}
//                       {Math.floor(currentPreview.endTime)}s
//                     </span>
//                     <span
//                       className={`px-2 py-1 rounded-full text-xs ${getScoreColor(getAnalysisScore(currentPreview))}`}
//                     >
//                       {Math.round(getAnalysisScore(currentPreview) * 100)}%{" "}
//                       {analysisMode.replace("_", " ")}
//                     </span>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* Segments List */}
//             <div className="w-1/2 overflow-y-auto">
//               <div className="p-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-lg font-semibold text-gray-900">
//                     Available Segments ({segments.length})
//                   </h3>
//                   <div className="text-sm text-gray-600">
//                     {selectedSegments.length} selected
//                   </div>
//                 </div>

//                 <div className="space-y-3">
//                   {segments
//                     .sort((a, b) => getAnalysisScore(b) - getAnalysisScore(a))
//                     .map((segment) => (
//                       <motion.div
//                         key={segment.id}
//                         whileHover={{ scale: 1.02 }}
//                         className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
//                           selectedSegments.includes(segment.id)
//                             ? "border-blue-500 bg-blue-50"
//                             : "border-gray-200 hover:border-blue-300"
//                         }`}
//                       >
//                         <div className="flex items-start justify-between">
//                           <div
//                             className="flex-1 mr-3"
//                             onClick={() => previewSegment(segment)}
//                           >
//                             <div className="flex items-center gap-2 mb-2">
//                               <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
//                                 {Math.floor(segment.startTime)}s-
//                                 {Math.floor(segment.endTime)}s
//                               </span>
//                               <span
//                                 className={`text-xs px-2 py-1 rounded-full ${
//                                   segment.theme === "transformation"
//                                     ? "bg-purple-100 text-purple-800"
//                                     : segment.theme === "metrics"
//                                       ? "bg-green-100 text-green-800"
//                                       : "bg-blue-100 text-blue-800"
//                                 }`}
//                               >
//                                 {segment.theme}
//                               </span>
//                               <span
//                                 className={`text-xs px-2 py-1 rounded-full font-medium ${getScoreColor(getAnalysisScore(segment))}`}
//                               >
//                                 {Math.round(getAnalysisScore(segment) * 100)}%
//                               </span>
//                             </div>
//                             <p className="text-gray-900 text-sm line-clamp-2 mb-2">
//                               "{segment.text}"
//                             </p>
//                             <div className="flex items-center gap-3 text-xs text-gray-600">
//                               <span className="flex items-center gap-1">
//                                 <Brain className="h-3 w-3" />
//                                 {segment.keyPhrase}
//                               </span>
//                               <span className="flex items-center gap-1">
//                                 <TrendingUp className="h-3 w-3" />
//                                 {Math.round(
//                                   segment.estimatedViralPotential * 100
//                                 )}
//                                 % viral potential
//                               </span>
//                             </div>
//                           </div>

//                           <div className="flex flex-col items-center gap-2">
//                             <button
//                               onClick={() => toggleSegment(segment.id)}
//                               className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
//                                 selectedSegments.includes(segment.id)
//                                   ? "border-blue-500 bg-blue-500"
//                                   : "border-gray-300"
//                               }`}
//                             >
//                               {selectedSegments.includes(segment.id) && (
//                                 <CheckCircle className="h-4 w-4 text-white" />
//                               )}
//                             </button>
//                             <button
//                               onClick={() => previewSegment(segment)}
//                               className="text-blue-600 hover:text-blue-800"
//                             >
//                               <Play className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </div>
//                       </motion.div>
//                     ))}
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Actions */}
//         <div className="p-6 border-t border-gray-200 bg-gray-50">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <button
//                 onClick={() => setSelectedSegments(segments.map((s) => s.id))}
//                 className="text-blue-600 hover:text-blue-800 font-medium"
//               >
//                 Select All High-Value (
//                 {segments.filter((s) => getAnalysisScore(s) > 0.8).length})
//               </button>
//               <button
//                 onClick={() => setSelectedSegments([])}
//                 className="text-gray-600 hover:text-gray-800"
//               >
//                 Clear Selection
//               </button>
//             </div>

//             <div className="flex items-center gap-3">
//               <div className="text-sm text-gray-600">
//                 <span className="font-medium">{selectedSegments.length}</span>{" "}
//                 segments selected
//                 <span className="ml-2 text-xs">
//                   Est. {Math.round(selectedSegments.length * 25)}s total content
//                 </span>
//               </div>
//               <button
//                 onClick={() => {
//                   onSegmentsSelected(selectedSegments);
//                   onClose();
//                 }}
//                 disabled={selectedSegments.length === 0}
//                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
//               >
//                 Use Selected Segments
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
