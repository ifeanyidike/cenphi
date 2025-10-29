// services/definitions.tsx

import {
  FileText,
  Wand2,
  Languages,
  Scissors,
  Sparkles,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AIService } from "@/types/ai-service";
export const AI_SERVICES: AIService[] = [
  {
    id: "enhancement",
    title: "Media Enhancement",
    description:
      "Transform raw testimonials into broadcast-quality content that commands attention and builds trust with prospects and stakeholders.",
    icon: Sparkles,
    category: "video",
    estimatedTime: "2-5 minutes",
    business_impact: "High-Impact Content",
    complexity_score: 8,
    features: [
      "4K Upscaling",
      "Audio Enhancement",
      "Noise Reduction",
      "Color Correction",
      "Broadcast Quality",
    ],
    gradient: "from-purple-600 to-pink-600",
    shouldQueue: true,
    supportsStreaming: false,
    endpoint: "/enhance-media",
    hasCustomConfig: true,
    defaultSettings: {
      quality: "high",
      remove_noise: true,
      color_correction: true,
      custom_enhancements: [],

      add_background_music: false,
      add_branding: false,
      include_logo: false,
      include_watermark: false,
      background_music: "corporate",

      audio_enhancement: true,
    },
  },
  {
    id: "story_mode",
    title: "Story Video",
    description:
      "Convert testimonials into compelling narrative experiences that drive emotional connection and accelerate deal velocity through strategic storytelling.",
    icon: Target,
    category: "video",
    estimatedTime: "2-5 minutes",
    business_impact: "Strategic Content",
    complexity_score: 8.5,
    features: [
      "Smart Transitions",
      "Emotional Arcs",
      "Music Integration",
      "Story Flow",
      "Conversion Focus",
    ],
    gradient: "from-blue-600 to-indigo-600",
    shouldQueue: true,
    supportsStreaming: false,
    endpoint: "/story-video",
    hasCustomConfig: true,
    defaultSettings: {
      storyStyle: "professional",
      add_background_music: false,
      add_branding: false,
      include_logo: false,
      include_watermark: false,
      background_music: "corporate",
    },
  },
  {
    id: "platform_optimizer",
    title: "Platform Optimizer",
    description:
      "Maximize engagement and reach by intelligently adapting testimonials for each social platform's algorithm and audience behavior patterns.",
    icon: Target,
    category: "video",
    estimatedTime: "2-5 minutes",
    business_impact: "Growth Accelerator",
    complexity_score: 8.5,
    features: [
      "Multi-Platform",
      "Auto-Resize",
      "Smart Captions",
      "Viral Hashtags",
      "Algorithm Optimization",
    ],
    gradient: "from-green-600 to-emerald-600",
    shouldQueue: true,
    supportsStreaming: false,
    endpoint: "/optimize-platform",
    hasCustomConfig: true,
    defaultSettings: {
      // platforms: ["instagram_reel"],
      target_platform: "instagram_reels",
      enable_captions: true,
      auto_resize: true,
      optimization_quality: "high",
      enable_audio_normalization: true,
      remove_noise: true,
      enable_media_enhancement: true,

      add_background_music: false,
      add_branding: false,
      include_logo: false,
      include_watermark: false,
      background_music: "corporate",
    },
  },
  {
    id: "clipping",
    title: "Smart Clipping",
    description:
      "Extract ROI-driving moments that convert prospects by identifying peak emotional impact, credibility signals, and purchasing triggers.",
    icon: Scissors,
    category: "video",
    estimatedTime: "1-3 minutes",
    business_impact: "Sales Enablement",
    complexity_score: 5,
    features: [
      "Impact Analysis",
      "Auto-Highlights",
      "Emotional Peaks",
      "Conversion Moments",
      "Smart Cuts",
    ],
    gradient: "from-orange-600 to-red-600",
    shouldQueue: true,
    supportsStreaming: false,
    endpoint: "/smart-clips",
    hasCustomConfig: true,
    defaultSettings: {
      clip_duration: "variable",
      highlight_type: "general",
      max_clips: 5,

      add_background_music: false,
      add_branding: false,
      include_logo: false,
      include_watermark: false,
      background_music: "corporate",
    },
  },
  {
    id: "noise_removal",
    title: "Noise Removal",
    description:
      "Ensure crystal-clear communication that maintains professionalism and eliminates distractions that could undermine credibility.",
    icon: VolumeX,
    category: "video",
    estimatedTime: "1-2 minutes",
    business_impact: "Essential Quality",
    complexity_score: 3.5,
    features: [
      "Noise Reduction",
      "Echo Removal",
      "Voice Enhancement",
      "Audio Restoration",
      "Professional Polish",
    ],
    gradient: "from-indigo-600 to-purple-600",
    shouldQueue: true,
    supportsStreaming: false,
    endpoint: "/remove-noise",
    hasCustomConfig: true,
    defaultSettings: {
      level: "low",
    },
  },
  {
    id: "narration",
    title: "AI Narration",
    description:
      "Transform written testimonials into persuasive audio content using enterprise-grade AI voices that build trust and drive engagement.",
    icon: Volume2,
    category: "content",
    estimatedTime: "45-90 seconds",
    business_impact: "Content Amplification",
    complexity_score: 4,
    features: [
      "Premium Voices",
      "Multiple Languages",
      "Emotion Control",
      "Speed Adjustment",
      "Brand Consistency",
    ],
    gradient: "from-cyan-600 to-blue-600",
    shouldQueue: true,
    supportsStreaming: false,
    endpoint: "/generate-narration",
    hasCustomConfig: true,
    defaultSettings: {
      voice_provider: "elevenlabs",
      voice_id: "echo",
      speed: "1.0",
      preferred_provider: "openai",
      gender: "male",
      style: "professional",
      language: "en",
      optimize_speech: false,
      output_format: "mp3",
      add_background_music: false,
      background_music: "corporate",
    },
  },

  // STREAMLINED SERVICES (New approach - no config pages)
  {
    id: "content_generation",
    title: "Content Generation",
    description:
      "Generate revenue-driving marketing assets from testimonials including executive-ready case studies, conversion-optimized emails, and SEO-powered blog content.",
    icon: FileText,
    category: "content",
    estimatedTime: "30-60 seconds",
    business_impact: "Revenue Generator",
    complexity_score: 4,
    features: [
      "15+ Content Types",
      "SEO Optimized",
      "Brand Voice",
      "Ready to Publish",
      "Multi-Channel Assets",
    ],
    gradient: "from-pink-600 to-rose-600",
    shouldQueue: true,
    supportsStreaming: true,
    endpoint: "/generate-content",
    // NEW: Streamlined approach - no config page
    hasCustomConfig: false,
    isStreamlined: true,
    streamlinedType: "content_selection",
    // No defaultSettings - user must select type
  },
  {
    id: "text_polishing",
    title: "Text Enhancement",
    description:
      "Refine testimonials for maximum impact while preserving authentic voice, ensuring every word drives credibility and conversion potential.",
    icon: Wand2,
    category: "content",
    estimatedTime: "15 seconds",
    business_impact: "Credibility Optimizer",
    complexity_score: 2,
    features: [
      "Grammar Enhancement",
      "Tone Optimization",
      "Clarity Improvement",
      "Authenticity Preservation",
      "Professional Polish",
    ],
    gradient: "from-violet-600 to-purple-600",
    shouldQueue: true,
    supportsStreaming: true,
    endpoint: "/polish",
    // NEW: Streamlined approach - no config page
    hasCustomConfig: false,
    isStreamlined: true,
    streamlinedType: "style_selection",
    // No defaultSettings - user must select style
  },
  {
    id: "translation",
    title: "Translation",
    description:
      "Expand market reach globally by translating testimonials with cultural intelligence and emotional authenticity that resonates across borders.",
    icon: Languages,
    category: "content",
    estimatedTime: "10-30 seconds",
    business_impact: "Global Expansion",
    complexity_score: 2,
    features: [
      "60+ Languages",
      "Tone Preservation",
      "Cultural Adaptation",
      "Native Quality",
      "International Reach",
    ],
    gradient: "from-teal-600 to-cyan-600",
    shouldQueue: true,
    supportsStreaming: true,
    endpoint: "/translate",
    // NEW: Streamlined approach - no config page
    hasCustomConfig: false,
    isStreamlined: true,
    streamlinedType: "language_selection",
    // No defaultSettings - user must select languages
  },
];
// Helper function to check if a service uses streamlined approach
export const isStreamlinedService = (serviceId: string): boolean => {
  const service = AI_SERVICES.find((s) => s.id === serviceId);
  return service?.isStreamlined === true;
};

// Helper function to get streamlined services
export const getStreamlinedServices = () => {
  return AI_SERVICES.filter((service) => service.isStreamlined === true);
};

// Helper function to get traditional services
export const getTraditionalServices = () => {
  return AI_SERVICES.filter((service) => service.isStreamlined !== true);
};

// Content types for content generation (expanded list as requested)
export const CONTENT_GENERATION_TYPES = [
  {
    id: "email",
    name: "Email Campaign",
    description:
      "Professional email campaigns to engage customers and drive conversions",
    category: "marketing",
    estimatedLength: "Medium (300-500 words)",
  },
  {
    id: "blog",
    name: "Blog Post",
    description:
      "SEO-optimized blog articles that showcase customer success stories",
    category: "content",
    estimatedLength: "Long (800-1200 words)",
  },
  {
    id: "case_study",
    name: "Case Study",
    description:
      "Detailed analysis showcasing how your solution solved customer challenges",
    category: "sales",
    estimatedLength: "Long (1000-1500 words)",
  },
  {
    id: "fundraising_talking_points",
    name: "Fundraising Talking Points",
    description:
      "Compelling points for investor presentations and funding discussions",
    category: "fundraising",
    estimatedLength: "Short (200-400 words)",
  },
  {
    id: "white_paper",
    name: "White Paper",
    description:
      "In-depth technical documents that establish thought leadership",
    category: "thought_leadership",
    estimatedLength: "Very Long (2000-4000 words)",
  },
  {
    id: "sales_deck",
    name: "Sales Deck",
    description:
      "Persuasive presentation materials for sales meetings and demos",
    category: "sales",
    estimatedLength: "Medium (400-600 words)",
  },
  {
    id: "roi_analysis",
    name: "ROI Analysis",
    description:
      "Financial impact reports showing value delivered to customers",
    category: "analytics",
    estimatedLength: "Medium (500-800 words)",
  },
  {
    id: "competitive_analysis",
    name: "Competitive Analysis",
    description:
      "Market positioning content highlighting your competitive advantages",
    category: "strategy",
    estimatedLength: "Long (800-1200 words)",
  },
  {
    id: "business_proposal",
    name: "Business Proposal",
    description: "Professional proposals for new business opportunities",
    category: "sales",
    estimatedLength: "Long (1000-1500 words)",
  },
  {
    id: "thought_leadership",
    name: "Thought Leadership Article",
    description: "Industry insights and expert commentary to build authority",
    category: "thought_leadership",
    estimatedLength: "Long (800-1200 words)",
  },
  {
    id: "customer_success_story",
    name: "Customer Success Story",
    description: "Narrative-driven content showcasing customer achievements",
    category: "content",
    estimatedLength: "Medium (600-800 words)",
  },
  {
    id: "market_research_report",
    name: "Market Research Report",
    description: "Data-driven reports on industry trends and customer insights",
    category: "analytics",
    estimatedLength: "Very Long (1500-2500 words)",
  },
  {
    id: "sales_enablement_guide",
    name: "Sales Enablement Guide",
    description: "Training materials and resources for sales teams",
    category: "sales",
    estimatedLength: "Long (1000-1500 words)",
  },
  {
    id: "implementation_guide",
    name: "Implementation Guide",
    description: "Step-by-step guides for successful product implementation",
    category: "support",
    estimatedLength: "Long (800-1200 words)",
  },
  {
    id: "quarterly_business_review",
    name: "Quarterly Business Review",
    description: "Performance summaries and strategic planning documents",
    category: "analytics",
    estimatedLength: "Long (1200-1800 words)",
  },
];

// Text polishing styles
export const TEXT_POLISHING_STYLES = [
  {
    id: "professional",
    name: "Professional",
    description: "Formal, authoritative tone suitable for business contexts",
    useCase: "Corporate communications, official documents",
  },
  {
    id: "casual",
    name: "Casual",
    description: "Friendly, approachable tone for informal communications",
    useCase: "Social media, blog posts, newsletters",
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Persuasive, engaging tone designed to drive action",
    useCase: "Sales materials, promotional content",
  },
  {
    id: "technical",
    name: "Technical",
    description: "Precise, detailed tone for technical documentation",
    useCase: "User guides, technical specifications",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Concise, strategic tone for leadership communications",
    useCase: "Executive summaries, board presentations",
  },
];

// Translation languages (expanded list)
export const TRANSLATION_LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸", region: "Europe/Americas" },
  { code: "fr", name: "French", flag: "🇫🇷", region: "Europe/Africa" },
  { code: "de", name: "German", flag: "🇩🇪", region: "Europe" },
  { code: "it", name: "Italian", flag: "🇮🇹", region: "Europe" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", region: "Europe/Americas" },
  { code: "zh", name: "Chinese (Simplified)", flag: "🇨🇳", region: "Asia" },
  { code: "zh-tw", name: "Chinese (Traditional)", flag: "🇹🇼", region: "Asia" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", region: "Asia" },
  { code: "ko", name: "Korean", flag: "🇰🇷", region: "Asia" },
  { code: "ru", name: "Russian", flag: "🇷🇺", region: "Europe/Asia" },
  { code: "ar", name: "Arabic", flag: "🇸🇦", region: "Middle East/Africa" },
  { code: "nl", name: "Dutch", flag: "🇳🇱", region: "Europe" },
  { code: "sv", name: "Swedish", flag: "🇸🇪", region: "Europe" },
  { code: "no", name: "Norwegian", flag: "🇳🇴", region: "Europe" },
  { code: "da", name: "Danish", flag: "🇩🇰", region: "Europe" },
  { code: "fi", name: "Finnish", flag: "🇫🇮", region: "Europe" },
  { code: "pl", name: "Polish", flag: "🇵🇱", region: "Europe" },
  { code: "cs", name: "Czech", flag: "🇨🇿", region: "Europe" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺", region: "Europe" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", region: "Europe/Asia" },
  { code: "he", name: "Hebrew", flag: "🇮🇱", region: "Middle East" },
  { code: "hi", name: "Hindi", flag: "🇮🇳", region: "Asia" },
  { code: "th", name: "Thai", flag: "🇹🇭", region: "Asia" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳", region: "Asia" },
];
