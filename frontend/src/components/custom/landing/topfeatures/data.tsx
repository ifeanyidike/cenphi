import {
  Award,
  Clipboard,
  Sparkles,
  Share2,
  Smile,
  Key,
  Mic,
  Video,
  MessageSquare,
  Code,
  Layers,
  Calendar,
  Mail,
} from "lucide-react";

export const features = [
  {
    id: 1,
    title: "Powerful Analytics",
    description:
      "Gain deep insights into your testimonial performance, engagement, and sentiment with real-time dashboards.",
    icon: <Award className="w-6 h-6" />,
    bgGradient: "from-violet-950 to-indigo-900",
    accentColor: "bg-violet-200",
    accentText: "text-violet-900",
    borderColor: "border-violet-300",
    chartColor: "bg-violet-500/30",
    benefits: [
      "Real-time dashboards",
      "Customizable metrics",
      "Trend & sentiment analysis",
      "Engagement insights",
    ],
  },
  // {
  //   id: 2,
  //   title: "AI Transcription",
  //   description:
  //     "Convert testimonial videos into accurate, searchable text with advanced AI that preserves tone and context.",
  //   icon: <Clipboard className="w-6 h-6" />,
  //   bgGradient: "from-blue-950 to-cyan-900",
  //   accentColor: "bg-blue-200",
  //   accentText: "text-blue-900",
  //   borderColor: "border-blue-300",
  //   chartColor: "bg-blue-500/30",
  //   benefits: [
  //     "Accurate speech-to-text",
  //     "Multi-language support",
  //     "Speaker differentiation",
  //     "Context-aware punctuation",
  //   ],
  // },
  // {
  //   id: 3,
  //   title: "Semantic Search",
  //   description:
  //     "Quickly find the perfect testimonial using AI-powered semantic search and sentiment filtering.",
  //   icon: <Sparkles className="w-6 h-6" />,
  //   bgGradient: "from-orange-950 to-amber-900",
  //   accentColor: "bg-amber-200",
  //   accentText: "text-amber-900",
  //   borderColor: "border-amber-300",
  //   chartColor: "bg-amber-500/30",
  //   benefits: [
  //     "Context-aware queries",
  //     "Advanced sentiment filters",
  //     "Intelligent ranking",
  //     "Accurate keyword matching",
  //   ],
  // },
  {
    id: 4,
    title: "Testimonial Video Suite",
    description:
      "Manage, edit, and brand your testimonial videos with premium tools that make your content shine.",
    icon: <Share2 className="w-6 h-6" />,
    bgGradient: "from-emerald-950 to-teal-900",
    accentColor: "bg-emerald-200",
    accentText: "text-emerald-900",
    borderColor: "border-emerald-300",
    chartColor: "bg-emerald-500/30",
    benefits: [
      "High-quality editing",
      "Custom branding overlays",
      "Seamless uploads",
      "Optimized playback",
    ],
  },
  {
    id: 5,
    title: "AI Studio",
    description:
      "Leverage advanced AI services to enhance testimonial insights and craft engaging content.",
    icon: <Sparkles className="w-6 h-6" />,
    bgGradient: "from-purple-950 to-pink-900",
    accentColor: "bg-purple-200",
    accentText: "text-purple-900",
    borderColor: "border-purple-300",
    chartColor: "bg-purple-500/30",
    subFeatures: [
      {
        title: "Sentiment Analysis",
        description:
          "Analyze emotional tones to gauge customer satisfaction and brand sentiment.",
        icon: <Smile className="w-5 h-5" />,
        benefits: [
          "Detects positive and negative sentiment",
          "Granular scoring",
          "Actionable insights",
        ],
      },
      {
        title: "Keyword Extraction",
        description:
          "Identify core themes and trends from customer feedback for actionable insights.",
        icon: <Key className="w-5 h-5" />,
        benefits: [
          "Highlights trending keywords",
          "Filters out noise",
          "Supports multiple languages",
        ],
      },
      {
        title: "Voice Synthesis",
        description:
          "Generate engaging audio narratives directly from text testimonials.",
        icon: <Mic className="w-5 h-5" />,
        benefits: [
          "High-quality voice output",
          "Multiple voice options",
          "Customizable tone and pace",
        ],
      },
      {
        title: "Video Summarization",
        description:
          "Condense lengthy testimonial videos into impactful highlights.",
        icon: <Video className="w-5 h-5" />,
        benefits: [
          "Extracts key moments",
          "Creates short impactful summaries",
          "Preserves essential context",
        ],
      },
    ],
  },
  {
    id: 6,
    title: "Testimonial Sharing",
    description:
      "Easily share your best testimonials across social networks and embed them on your website.",
    icon: <Share2 className="w-6 h-6" />,
    bgGradient: "from-green-950 to-teal-900",
    accentColor: "bg-green-200",
    accentText: "text-green-900",
    borderColor: "border-green-300",
    chartColor: "bg-green-500/30",
    subFeatures: [
      {
        title: "Social Media Widgets",
        description:
          "Embed interactive widgets to showcase testimonials on your social profiles.",
        icon: <MessageSquare className="w-5 h-5" />,
        benefits: [
          "Responsive design",
          "Easy customization",
          "Real-time updates",
        ],
      },
      {
        title: "Custom Embed Codes",
        description:
          "Generate tailor‑made embed codes for seamless website integration.",
        icon: <Code className="w-5 h-5" />,
        benefits: [
          "Flexible integration",
          "Customizable styles",
          "Secure and fast",
        ],
      },
      {
        title: "Multi-channel Distribution",
        description:
          "Automatically share content across multiple platforms at once.",
        icon: <Layers className="w-5 h-5" />,
        benefits: [
          "Broad platform reach",
          "Scheduled sharing",
          "Consistent branding",
        ],
      },
      {
        title: "Automated Scheduling",
        description:
          "Plan and schedule posts to maximize testimonial engagement.",
        icon: <Calendar className="w-5 h-5" />,
        benefits: [
          "Optimal posting times",
          "Automated workflows",
          "Calendar integration",
        ],
      },
    ],
  },
  {
    id: 7,
    title: "Testimonial Collection",
    description:
      "Capture testimonials from multiple channels—web forms, emails, social media, and more.",
    icon: <Clipboard className="w-6 h-6" />,
    bgGradient: "from-red-950 to-orange-900",
    accentColor: "bg-red-200",
    accentText: "text-red-900",
    borderColor: "border-red-300",
    chartColor: "bg-red-500/30",
    subFeatures: [
      {
        title: "Custom Web Forms",
        description:
          "Design and deploy beautiful forms to collect testimonials directly on your site.",
        icon: <MessageSquare className="w-5 h-5" />,
        benefits: [
          "User-friendly design",
          "Customizable fields",
          "Seamless integration",
        ],
      },
      {
        title: "Email Integration",
        description:
          "Seamlessly incorporate email campaigns to gather feedback effortlessly.",
        icon: <Mail className="w-5 h-5" />,
        benefits: [
          "Automated follow-ups",
          "Template customization",
          "Robust tracking",
        ],
      },
      {
        title: "Social Media Aggregation",
        description:
          "Automatically pull in testimonials from your social channels.",
        icon: <Share2 className="w-5 h-5" />,
        benefits: [
          "Real-time import",
          "Unified management",
          "Cross-platform support",
        ],
      },
      {
        title: "Third-Party Sync",
        description:
          "Integrate with popular testimonial platforms for unified management.",
        icon: <Layers className="w-5 h-5" />,
        benefits: [
          "Seamless data sync",
          "Centralized dashboard",
          "API integration",
        ],
      },
    ],
  },
];
