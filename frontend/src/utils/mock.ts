import { TestimonialFormat } from "@/types/setup";
import { ContentFormat, Testimonial } from "@/types/testimonial";

// Typing animation for testimonial stats
export const pulseAnimation = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.5 },
  },
};

// Helper function to get type-specific colors
export const getTypeColor = (type: ContentFormat) => {
  const colors = {
    video: {
      light: {
        bg: "from-violet-500 to-purple-600",
        text: "text-violet-700",
        accent: "bg-violet-100",
      },
      dark: {
        bg: "from-violet-600 to-purple-700",
        text: "text-violet-400",
        accent: "bg-violet-900/30",
      },
    },
    audio: {
      light: {
        bg: "from-blue-500 to-sky-600",
        text: "text-blue-700",
        accent: "bg-blue-100",
      },
      dark: {
        bg: "from-blue-600 to-sky-700",
        text: "text-blue-400",
        accent: "bg-blue-900/30",
      },
    },
    text: {
      light: {
        bg: "from-emerald-500 to-teal-600",
        text: "text-emerald-700",
        accent: "bg-emerald-100",
      },
      dark: {
        bg: "from-emerald-600 to-teal-700",
        text: "text-emerald-400",
        accent: "bg-emerald-900/30",
      },
    },
    image: {
      light: {
        bg: "from-amber-500 to-orange-600",
        text: "text-amber-700",
        accent: "bg-amber-100",
      },
      dark: {
        bg: "from-amber-600 to-orange-700",
        text: "text-amber-400",
        accent: "bg-amber-900/30",
      },
    },
  };

  // return isDarkMode ? colors[type].dark : colors[type].light;
  return colors[type as TestimonialFormat].light;
};

// Animation variants
export const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const itemVariants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export const mockTestimonials: Testimonial[] = [
  // VIDEO TESTIMONIAL
  {
    id: "testimonial-video-1",
    workspace_id: "ws_123",
    testimonial_type: "influencer",
    format: "video",
    status: "approved",
    language: "en",
    title: "Revolutionizing My Workflow with Arbor AI",
    summary:
      "A quick overview of how Arbor AI transformed content repurposing.",
    content: undefined,
    transcript:
      "“Hey everyone, I'm Sarah—since integrating Arbor AI's video tools, my daily editing time has dropped by 60%…”",
    media_url: "/media/vids/test_video.mp4",
    // thumbnail_url: "https://sample-videos.com/img/Sample-jpg-image-300kb.jpg",
    thumbnail_url: "",
    media_urls: ["/media/vids/test_video.mp4"],
    media_duration: 5, // in seconds
    rating: 5,
    tags: ["ai", "video-editing", "productivity"],
    categories: ["case_study"],
    collection_method: "embed_form",
    verification_method: "social_login",
    verification_status: "verified",
    published: true,
    published_at: new Date("2025-04-05T14:30:00Z"),
    scheduled_publish_at: undefined,
    product_context: { plan: "Pro" },
    view_count: 3420,
    share_count: 120,
    conversion_count: 45,
    engagement_metrics: { likes: 290, comments: 34 },
    created_at: new Date("2025-04-01T10:00:00Z"),
    updated_at: new Date("2025-04-04T09:15:00Z"),
  },

  // AUDIO TESTIMONIAL
  {
    id: "testimonial-audio-1",
    workspace_id: "ws_123",
    testimonial_type: "expert",
    format: "audio",
    status: "approved",
    language: "en",
    title: "The Sound of Success: Audio Testimonial",
    summary: "An expert's take on our new audio repurposing feature.",
    content: undefined,
    transcript:
      "“I've been in podcast production for over a decade, and Arbor's audio enhancements are next-level…”",
    media_url: "/media/audio/audio-example-2.mp3",
    media_urls: ["/media/audio/audio-example-2.mp3"],
    media_duration: 90, // in seconds
    rating: 4,
    tags: ["audio", "podcasting", "enhancement"],
    categories: ["partner"],
    collection_method: "embed_form",
    verification_method: "order_verification",
    verification_status: "verified",
    published: true,
    published_at: new Date("2025-04-07T08:20:00Z"),
    scheduled_publish_at: undefined,
    purchase_context: { product: "AudioPro Plan" },
    view_count: 1580,
    share_count: 67,
    conversion_count: 22,
    engagement_metrics: { downloads: 410 },
    created_at: new Date("2025-04-02T11:45:00Z"),
    updated_at: new Date("2025-04-06T13:10:00Z"),
  },

  // IMAGE TESTIMONIAL
  {
    id: "testimonial-image-1",
    workspace_id: "ws_123",
    testimonial_type: "partner",
    format: "image",
    status: "approved",
    language: "en",
    title: "Visual Impact with One Click",
    summary: "How quick social graphics boosted campaign engagement.",
    content:
      "“Our campaign engagement soared by 80% when we started using Arbor's image templates.”",
    media_url:
      "https://images.unsplash.com/photo-1739909139794-e4f36d1838f8?q=80&w=4138&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    media_urls: [
      "https://images.unsplash.com/photo-1739909139794-e4f36d1838f8?q=80&w=4138&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ],
    additional_media: [],
    thumbnail_url: undefined,
    media_duration: undefined,
    rating: 5,
    tags: ["image", "social_media", "design"],
    categories: ["customer"],
    collection_method: "social_import",
    verification_method: "domain_verification",
    verification_status: "verified",
    published: true,
    published_at: new Date("2025-04-10T16:00:00Z"),
    scheduled_publish_at: undefined,
    experience_context: { campaign: "Spring Launch 2025" },
    view_count: 2890,
    share_count: 310,
    conversion_count: 75,
    engagement_metrics: { likes: 1120, comments: 89 },
    created_at: new Date("2025-04-03T09:30:00Z"),
    updated_at: new Date("2025-04-08T12:00:00Z"),
  },

  // TEXT TESTIMONIAL
  {
    id: "testimonial-text-1",
    workspace_id: "ws_123",
    testimonial_type: "customer",
    format: "text",
    status: "approved",
    language: "en",
    title: "From Hours to Minutes: A Text Testimonial",
    summary: "How our text-to-video automation saved me hours each week.",
    content:
      "“I used to spend 3-4 hours crafting weekly summaries. With Arbor's text-to-video feature, I can now generate polished clips in under 10 minutes.”",
    transcript: undefined,
    media_urls: [],
    media_url: undefined,
    media_duration: undefined,
    thumbnail_url: undefined,
    rating: 4,
    tags: ["text", "automation", "efficiency"],
    categories: ["customer"],
    collection_method: "email_request",
    verification_method: "email",
    verification_status: "verified",
    published: true,
    published_at: new Date("2025-04-12T13:45:00Z"),
    scheduled_publish_at: undefined,
    product_context: { feature: "Text-to-Video" },
    view_count: 2140,
    share_count: 98,
    conversion_count: 30,
    engagement_metrics: { reactions: 500 },
    created_at: new Date("2025-04-04T15:20:00Z"),
    updated_at: new Date("2025-04-11T10:05:00Z"),
  },
];
