import { BrandGuide, BrandPreset } from "@/types/setup";

// Testimonial style presets
export const testimonialStyles = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, simple presentation with focus on content",
  },
  {
    id: "card",
    name: "Card",
    description: "Structured cards with shadows and distinct borders",
  },
  {
    id: "quote",
    name: "Quote",
    description: "Emphasis on quotation marks and attribution",
  },
  {
    id: "bubble",
    name: "Bubble",
    description: "Speech bubble style for a conversational feel",
  },
  {
    id: "highlight",
    name: "Highlight",
    description:
      "Key parts of testimonials are emphasized with your brand color",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with subtle gradients and animations",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless design with elegant typography and spacing",
  },
];

// Default brand data
export const defaultBrandData: BrandGuide = {
  id: crypto.randomUUID().toString(),
  workspace_id: "",

  name: "",
  tagline: "",
  description: "",
  logo: {
    main: null,
    alt: null,
    favicon: null,
    darkMode: null,
  },
  colors: {
    primary: "#3b82f6",
    secondary: "#6366f1",
    accent: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    background: "#ffffff",
    foreground: "#111827",
    muted: "#f3f4f6",
    surface: "#f9fafb",
  },
  typography: {
    headingFont: "inter",
    bodyFont: "inter",
    baseSize: 16,
    ratio: 1.25,
    weights: {
      heading: 700,
      body: 400,
    },
    letterSpacing: 0,
    lineHeight: 1.5,
  },
  testimonials: {
    style: "card",
    shape: "rounded",
    layout: "grid",
    showRating: true,
    showAvatar: true,
    showDate: true,
    showCompany: true,
    animation: true,
    shadow: "md",
    border: true,
    ratingStyle: "stars",
  },
  voice: {
    tone: "professional",
    values: ["Trustworthy", "Helpful", "Expert"],
    ctas: ["Share your experience", "Leave a review", "Tell us what you think"],
    examples: [],
    channels: {
      email: {
        requestTemplate:
          "Hi {{name}},\n\nWe hope you're enjoying your experience with {{brand}}! We would love to hear your thoughts. Would you mind taking a moment to share your feedback?\n\nBest,\n{{brand}} Team",
        thankYouTemplate:
          "Thank you for your feedback, {{name}}! We appreciate your input and look forward to serving you better.",
        sender: {
          name: "{{brand}} Team",
          email: "feedback@{{brand}}.com",
        },
        signature: {
          templateId: "minimal",
          text: "Best,\n{{brand}} Team",
        },
      },
      social: {
        platforms: {
          facebook: {
            requestTemplate:
              "Hey {{name}}, we value your opinion! Share your experience with us using #{{brandHashtag}} or tag us @{{brandHandle}}.",
            thankYouTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
            followupTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
          },
          linkedin: {
            requestTemplate:
              "Hey {{name}}, we value your opinion! Share your experience with us using #{{brandHashtag}} or tag us @{{brandHandle}}.",
            thankYouTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
            followupTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
          },
          instagram: {
            requestTemplate:
              "Hey {{name}}, we value your opinion! Share your experience with us using #{{brandHashtag}} or tag us @{{brandHandle}}.",
            thankYouTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
            followupTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
          },
          tiktok: {
            requestTemplate:
              "Hey {{name}}, we value your opinion! Share your experience with us using #{{brandHashtag}} or tag us @{{brandHandle}}.",
            thankYouTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
            followupTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
          },
          twitter: {
            requestTemplate:
              "Hey {{name}}, we value your opinion! Share your experience with us using #{{brandHashtag}} or tag us @{{brandHandle}}.",
            thankYouTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
            followupTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
          },
          youtube: {
            requestTemplate:
              "Hey {{name}}, we value your opinion! Share your experience with us using #{{brandHashtag}} or tag us @{{brandHandle}}.",
            thankYouTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
            followupTemplate:
              "Thanks for sharing your experience, @{{name}}! We appreciate your support. #CustomerAppreciation",
          },
        },
      },
      website: {
        requestTemplate:
          "We'd love to hear from you! Please share your thoughts about {{brand}}.",
        thankYouTemplate:
          "Thank you for your testimonial! Your feedback helps us improve our services.",
      },
    },
  },
  ui: {
    radius: 8,
    animation: true,
    density: "default",
    darkMode: false,
  },
  created_at: new Date(),
  updated_at: new Date(),
};

export const brandPresets: BrandPreset[] = [
  {
    id: "modern",
    name: "Modern & Minimal",
    description: "Clean, contemporary design with a professional feel",
    colors: {
      primary: "#3b82f6",
      secondary: "#6366f1",
      accent: "#8b5cf6",
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      background: "#ffffff",
      foreground: "#111827",
      muted: "#f3f4f6",
      surface: "#f9fafb",
    },
    typography: {
      headingFont: "inter",
      bodyFont: "inter",
    },
    testimonials: {
      style: "card",
    },
  },
  {
    id: "bold",
    name: "Bold & Vibrant",
    description: "Striking colors and strong presence for maximum impact",
    colors: {
      primary: "#7c3aed",
      secondary: "#ec4899",
      accent: "#f43f5e",
      success: "#059669",
      warning: "#fbbf24",
      error: "#dc2626",
      background: "#ffffff",
      foreground: "#1f2937",
      muted: "#f5f3ff",
      surface: "#f9fafb",
    },
    typography: {
      headingFont: "montserrat",
      bodyFont: "inter",
    },
    testimonials: {
      style: "bubble",
    },
  },
  {
    id: "elegant",
    name: "Elegant & Refined",
    description: "Sophisticated and timeless design for luxury brands",
    colors: {
      primary: "#334155",
      secondary: "#64748b",
      accent: "#94a3b8",
      success: "#047857",
      warning: "#b45309",
      error: "#b91c1c",
      background: "#ffffff",
      foreground: "#0f172a",
      muted: "#f1f5f9",
      surface: "#f8fafc",
    },
    typography: {
      headingFont: "playfairDisplay",
      bodyFont: "lora",
    },
    testimonials: {
      style: "quote",
    },
  },
  {
    id: "playful",
    name: "Playful & Creative",
    description: "Fun, vibrant aesthetic for creative brands",
    colors: {
      primary: "#8b5cf6",
      secondary: "#ec4899",
      accent: "#f43f5e",
      success: "#10b981",
      warning: "#fbbf24",
      error: "#ef4444",
      background: "#ffffff",
      foreground: "#18181b",
      muted: "#f5f3ff",
      surface: "#faf5ff",
    },
    typography: {
      headingFont: "poppins",
      bodyFont: "poppins",
    },
    testimonials: {
      style: "modern",
    },
  },
  {
    id: "corporate",
    name: "Corporate Professional",
    description: "Polished and trustworthy for established brands",
    colors: {
      primary: "#1a56db",
      secondary: "#7c3aed",
      accent: "#2563eb",
      success: "#047857",
      warning: "#b45309",
      error: "#b91c1c",
      background: "#ffffff",
      foreground: "#1e293b",
      muted: "#f1f5f9",
      surface: "#f8fafc",
    },
    typography: {
      headingFont: "sourcesans",
      bodyFont: "sourcesans",
    },
    testimonials: {
      style: "classic",
    },
  },
];

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const cardTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// Get contrast color for text on a background
export const getContrastColor = (hexColor: string): string => {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// Signature templates
export const signatureTemplates: Record<string, string> = {
  simple: `Best regards,
{{senderName}}
{{position}}
{{companyName}}
{{contactEmail}} | {{contactPhone}}`,

  professional: `Sincerely,

{{senderName}}
{{position}} | {{companyName}}
Email: {{contactEmail}}
Phone: {{contactPhone}}
Website: {{websiteUrl}}`,

  detailed: `Thank you for your business,

{{senderName}}
{{position}}

{{companyName}}
{{streetAddress}}
{{city}}, {{state}} {{zipCode}}
{{contactPhone}} | {{contactEmail}}
{{websiteUrl}}`,

  marketing: `Best,

{{senderName}}
{{position}} | {{companyName}}

Follow us:
{{socialLinks}}

{{tagline}}
`,
};
