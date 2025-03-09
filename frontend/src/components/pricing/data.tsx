import { Award, Crown, Rocket, Star, Zap } from "lucide-react";

// export const plans = [
//   {
//     id: "essentials",
//     name: "Essentials",
//     description:
//       "Perfect for small businesses just getting started with testimonials",
//     icon: <Star className="w-6 h-6 text-blue-500" />,
//     monthlyPrice: 0,
//     yearlyPrice: 0,
//     features: [
//       // Collection
//       {
//         name: "Up to 25 testimonials/month",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Basic text testimonials",
//         included: true,
//         category: "collection",
//       },
//       { name: "Smart collection form", included: true, category: "collection" },
//       { name: "Email invite system", included: true, category: "collection" },
//       {
//         name: "Social import (Google, Facebook)",
//         included: true,
//         category: "collection",
//       },

//       // Analysis
//       {
//         name: "Basic sentiment analysis",
//         included: true,
//         category: "analysis",
//       },
//       {
//         name: "Simple keyword extraction",
//         included: true,
//         category: "analysis",
//       },

//       // Publishing
//       {
//         name: "3 responsive templates",
//         included: true,
//         category: "publishing",
//       },
//       {
//         name: "Basic embedding widgets",
//         included: true,
//         category: "publishing",
//       },
//       { name: "Website integration", included: true, category: "publishing" },

//       // Management
//       {
//         name: "Simple approval workflow",
//         included: true,
//         category: "management",
//       },
//       {
//         name: "Basic search & filtering",
//         included: true,
//         category: "management",
//       },
//       {
//         name: "Standard testimonial moderation",
//         included: true,
//         category: "management",
//       },

//       // Analytics
//       {
//         name: "Basic performance metrics",
//         included: true,
//         category: "analytics",
//       },
//       { name: "Monthly reports", included: true, category: "analytics" },

//       // AI Features
//       { name: "AI readability assessment", included: true, category: "ai" },
//       {
//         name: "Basic grammar & spelling correction",
//         included: true,
//         category: "ai",
//       },
//     ],
//     cta: "Get Started",
//     color: "from-blue-400 to-blue-500",
//     hoverColor: "group-hover:from-blue-500 group-hover:to-blue-600",
//     backgroundColor: "bg-blue-50",
//     borderColor: "border-blue-100",
//     textColor: "text-blue-500",
//     glowColor: "rgba(59, 130, 246, 0.15)",
//     iconBg: "bg-blue-500",
//   },
//   {
//     id: "accelerate",
//     name: "Accelerate",
//     description: "Boost your testimonial strategy with AI-powered insights",
//     icon: <Zap className="w-6 h-6 text-purple-500" />,
//     monthlyPrice: 49,
//     yearlyPrice: 39,
//     popular: true,
//     features: [
//       // Collection
//       {
//         name: "Up to 100 testimonials/month",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Text, image & audio testimonials",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Smart collection form with custom fields",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Automated invite campaigns",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Social import (All platforms)",
//         included: true,
//         category: "collection",
//       },
//       { name: "QR code collection", included: true, category: "collection" },

//       // Analysis
//       {
//         name: "Advanced sentiment & intent analysis",
//         included: true,
//         category: "analysis",
//       },
//       {
//         name: "AI content quality scoring",
//         included: true,
//         category: "analysis",
//       },
//       {
//         name: "Customer feedback themes detection",
//         included: true,
//         category: "analysis",
//       },

//       // Publishing
//       {
//         name: "10 customizable templates",
//         included: true,
//         category: "publishing",
//       },
//       {
//         name: "Interactive embedding widgets",
//         included: true,
//         category: "publishing",
//       },
//       {
//         name: "Brand customization tools",
//         included: true,
//         category: "publishing",
//       },
//       {
//         name: "Social media share cards",
//         included: true,
//         category: "publishing",
//       },

//       // AI Features
//       {
//         name: "AI content enhancement & refinement",
//         included: true,
//         category: "ai",
//       },
//       { name: "Testimonial summarization", included: true, category: "ai" },
//       {
//         name: "Basic video testimonial creation",
//         included: true,
//         category: "ai",
//       },
//       { name: "AI narrative generation", included: true, category: "ai" },
//       { name: "Smart response suggestions", included: true, category: "ai" },
//       {
//         name: "Automated testimonial categorization",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Highlight extraction automation",
//         included: true,
//         category: "ai",
//       },

//       // Management
//       { name: "Customer segmentation", included: true, category: "management" },
//       {
//         name: "Advanced approval workflows",
//         included: true,
//         category: "management",
//       },
//       { name: "Scheduled publishing", included: true, category: "management" },

//       // Integrations
//       {
//         name: "Limited CRM integrations",
//         included: true,
//         category: "integrations",
//       },
//       {
//         name: "Email marketing tool connections",
//         included: true,
//         category: "integrations",
//       },

//       // Analytics
//       {
//         name: "Real-time analytics dashboard",
//         included: true,
//         category: "analytics",
//       },
//       { name: "Conversion tracking", included: true, category: "analytics" },
//       { name: "Custom report builder", included: true, category: "analytics" },
//     ],
//     cta: "Start Free Trial",
//     color: "from-purple-400 to-purple-500",
//     hoverColor: "group-hover:from-purple-500 group-hover:to-purple-600",
//     backgroundColor: "bg-purple-50",
//     borderColor: "border-purple-100",
//     textColor: "text-purple-500",
//     glowColor: "rgba(168, 85, 247, 0.2)",
//     iconBg: "bg-purple-500",
//   },
//   {
//     id: "transform",
//     name: "Transform",
//     description: "Complete AI-powered testimonial management solution",
//     icon: <Award className="w-6 h-6 text-amber-500" />,
//     monthlyPrice: 99,
//     yearlyPrice: 79,
//     features: [
//       // Collection
//       {
//         name: "Unlimited testimonials",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "All media formats support",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Advanced collection forms with logic",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Smart automated invite sequences",
//         included: true,
//         category: "collection",
//       },
//       {
//         name: "Omnichannel collection",
//         included: true,
//         category: "collection",
//       },

//       // Analysis
//       {
//         name: "Premium sentiment & intent analytics",
//         included: true,
//         category: "analysis",
//       },
//       {
//         name: "Deep content quality analysis",
//         included: true,
//         category: "analysis",
//       },
//       {
//         name: "Competitor testimonial insights",
//         included: true,
//         category: "analysis",
//       },
//       {
//         name: "Emotion & tone detection",
//         included: true,
//         category: "analysis",
//       },

//       // Publishing
//       {
//         name: "Unlimited template library",
//         included: true,
//         category: "publishing",
//       },
//       {
//         name: "Dynamic interactive widgets",
//         included: true,
//         category: "publishing",
//       },
//       {
//         name: "Complete branding studio",
//         included: true,
//         category: "publishing",
//       },
//       {
//         name: "Testimonial A/B testing",
//         included: true,
//         category: "publishing",
//       },

//       // AI Features
//       {
//         name: "Premium video with editing tools",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Advanced AI narrative generation",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "AI content optimization & enhancement",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Testimonial voice cloning (with permission)",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "AI-powered testimonial verification",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Persona-based content adaptation",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Testimonial-to-case-study converter",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Intelligent follow-up question generator",
//         included: true,
//         category: "ai",
//       },
//       { name: "Visual testimonial enhancer", included: true, category: "ai" },
//       {
//         name: "Multilingual testimonial translation",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Buyer journey testimonial mapping",
//         included: true,
//         category: "ai",
//       },

//       // Management
//       {
//         name: "AI-driven customer segmentation",
//         included: true,
//         category: "management",
//       },
//       {
//         name: "Advanced team collaboration tools",
//         included: true,
//         category: "management",
//       },
//       {
//         name: "Content calendar & scheduling",
//         included: true,
//         category: "management",
//       },

//       // Integrations
//       {
//         name: "Full CRM & marketing integrations",
//         included: true,
//         category: "integrations",
//       },
//       {
//         name: "Multi-platform social scheduling",
//         included: true,
//         category: "integrations",
//       },
//       {
//         name: "E-commerce platform integrations",
//         included: true,
//         category: "integrations",
//       },

//       // Analytics
//       {
//         name: "Predictive analytics & forecasting",
//         included: true,
//         category: "analytics",
//       },
//       {
//         name: "ROI calculator & attribution",
//         included: true,
//         category: "analytics",
//       },
//       {
//         name: "Competitive benchmarking",
//         included: true,
//         category: "analytics",
//       },
//       {
//         name: "AI-driven conversion prediction",
//         included: true,
//         category: "analytics",
//       },

//       // Advanced
//       {
//         name: "White labeling & customization",
//         included: true,
//         category: "advanced",
//       },
//       { name: "Basic API access", included: true, category: "advanced" },
//       { name: "Priority support", included: true, category: "advanced" },
//     ],
//     cta: "Start Free Trial",
//     color: "from-amber-400 to-amber-500",
//     hoverColor: "group-hover:from-amber-500 group-hover:to-amber-600",
//     backgroundColor: "bg-amber-50",
//     borderColor: "border-amber-100",
//     textColor: "text-amber-500",
//     glowColor: "rgba(245, 158, 11, 0.15)",
//     iconBg: "bg-amber-500",
//   },
//   {
//     id: "enterprise",
//     name: "Enterprise",
//     description: "Custom solutions for large organizations with specific needs",
//     icon: <Crown className="w-6 h-6 text-slate-700" />,
//     customPrice: true,
//     features: [
//       // Core features
//       {
//         name: "Everything in Transform plan",
//         included: true,
//         category: "core",
//       },

//       // Enterprise specific
//       {
//         name: "Dedicated account manager",
//         included: true,
//         category: "enterprise",
//       },
//       {
//         name: "Custom AI model training",
//         included: true,
//         category: "enterprise",
//       },
//       {
//         name: "On-premise deployment options",
//         included: true,
//         category: "enterprise",
//       },
//       {
//         name: "Enterprise-grade security & compliance",
//         included: true,
//         category: "enterprise",
//       },
//       { name: "SLA guarantees", included: true, category: "enterprise" },

//       // AI Features
//       {
//         name: "Industry-specific AI analysis models",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Custom sentiment analysis training",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "AI-powered competitive intelligence",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Product feedback extraction & routing",
//         included: true,
//         category: "ai",
//       },
//       { name: "Neural content generation", included: true, category: "ai" },
//       {
//         name: "AI spokesperson video generation",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Real-time testimonial fraud detection",
//         included: true,
//         category: "ai",
//       },
//       {
//         name: "Comprehensive voice & tone analysis",
//         included: true,
//         category: "ai",
//       },

//       // Advanced features
//       {
//         name: "Multi-brand testimonial management",
//         included: true,
//         category: "advanced",
//       },
//       {
//         name: "Global content distribution network",
//         included: true,
//         category: "advanced",
//       },
//       {
//         name: "Custom widget development",
//         included: true,
//         category: "advanced",
//       },
//       {
//         name: "Full API access & webhooks",
//         included: true,
//         category: "advanced",
//       },

//       // Analytics & Management
//       {
//         name: "Enterprise analytics suite",
//         included: true,
//         category: "analytics",
//       },
//       {
//         name: "Advanced ROI & attribution dashboards",
//         included: true,
//         category: "analytics",
//       },
//       {
//         name: "Custom AI insights development",
//         included: true,
//         category: "analytics",
//       },
//       {
//         name: "AI-powered market trend analysis",
//         included: true,
//         category: "analytics",
//       },
//       {
//         name: "Multi-level user permissions",
//         included: true,
//         category: "management",
//       },
//       {
//         name: "Automated compliance workflows",
//         included: true,
//         category: "management",
//       },

//       // Support
//       { name: "Premium 24/7 support", included: true, category: "support" },
//       {
//         name: "Quarterly business reviews",
//         included: true,
//         category: "support",
//       },
//       { name: "Dedicated Slack channel", included: true, category: "support" },
//     ],
//     cta: "Contact Sales",
//     color: "from-slate-700 to-slate-800",
//     hoverColor: "group-hover:from-slate-800 group-hover:to-slate-900",
//     backgroundColor: "bg-slate-50",
//     borderColor: "border-slate-200",
//     textColor: "text-slate-700",
//     glowColor: "rgba(51, 65, 85, 0.15)",
//     iconBg: "bg-slate-700",
//   },
// ];

export const plans = [
  {
    id: "essentials",
    name: "Essentials",
    description:
      "Perfect for small businesses just getting started with testimonials",
    icon: <Star className="w-6 h-6 text-blue-500" />,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      // Collection
      {
        name: "Up to 25 testimonials/month",
        included: true,
        category: "collection",
      },
      {
        name: "Basic text testimonials",
        included: true,
        category: "collection",
      },
      { name: "Smart collection form", included: true, category: "collection" },
      { name: "Email invite system", included: true, category: "collection" },
      {
        name: "Social import (Google, Facebook)",
        included: true,
        category: "collection",
      },

      // Analysis
      {
        name: "Basic sentiment analysis",
        included: true,
        category: "analysis",
      },
      {
        name: "Simple keyword extraction",
        included: true,
        category: "analysis",
      },

      // Publishing
      {
        name: "3 responsive templates",
        included: true,
        category: "publishing",
      },
      {
        name: "Basic embedding widgets",
        included: true,
        category: "publishing",
      },
      { name: "Website integration", included: true, category: "publishing" },

      // Management
      {
        name: "Simple approval workflow",
        included: true,
        category: "management",
      },
      {
        name: "Basic search & filtering",
        included: true,
        category: "management",
      },
      {
        name: "Standard testimonial moderation",
        included: true,
        category: "management",
      },

      // Analytics
      {
        name: "Basic performance metrics",
        included: true,
        category: "analytics",
      },
      { name: "Monthly reports", included: true, category: "analytics" },

      // AI Features
      { name: "AI readability assessment", included: true, category: "ai" },
      {
        name: "Basic grammar & spelling correction",
        included: true,
        category: "ai",
      },
    ],
    cta: "Get Started Free",
    color: "from-blue-400 to-blue-500",
    hoverColor: "group-hover:from-blue-500 group-hover:to-blue-600",
    backgroundColor: "bg-blue-50",
    borderColor: "border-blue-100",
    textColor: "text-blue-500",
    glowColor: "rgba(59, 130, 246, 0.15)",
    iconBg: "bg-blue-500",
  },
  {
    id: "growth",
    name: "Growth",
    description:
      "Affordable toolkit for growing businesses ready to scale testimonials",
    icon: <Rocket className="w-6 h-6 text-indigo-500" />,
    monthlyPrice: 29,
    yearlyPrice: 24,
    featured: true,
    features: [
      // Collection
      {
        name: "Up to 75 testimonials/month",
        included: true,
        category: "collection",
        Highlight: true,
      },
      {
        name: "Text & image testimonials",
        included: true,
        category: "collection",
      },
      {
        name: "Enhanced collection forms",
        included: true,
        category: "collection",
      },
      {
        name: "Automated invite campaigns",
        included: true,
        category: "collection",
      },
      {
        name: "Social import (All platforms)",
        included: true,
        category: "collection",
      },

      // Analysis
      {
        name: "Enhanced sentiment analysis",
        included: true,
        category: "analysis",
      },
      {
        name: "Theme detection & tagging",
        included: true,
        category: "analysis",
      },

      // Publishing
      {
        name: "6 customizable templates",
        included: true,
        category: "publishing",
      },
      {
        name: "Responsive embedding widgets",
        included: true,
        category: "publishing",
      },
      {
        name: "Basic brand customization",
        included: true,
        category: "publishing",
      },
      {
        name: "Social media share cards",
        included: true,
        category: "publishing",
      },

      // AI Features
      { name: "AI content enhancement", included: true, category: "ai" },
      { name: "Testimonial summarization", included: true, category: "ai" },
      {
        name: "Highlight extraction (5/month)",
        included: true,
        category: "ai",
      },
      { name: "Automated categorization", included: true, category: "ai" },

      // Management
      {
        name: "Basic customer segmentation",
        included: true,
        category: "management",
      },
      {
        name: "Flexible approval workflows",
        included: true,
        category: "management",
      },
      { name: "Basic scheduling", included: true, category: "management" },

      // Integrations
      {
        name: "Email marketing integrations",
        included: true,
        category: "integrations",
      },

      // Analytics
      {
        name: "Enhanced analytics dashboard",
        included: true,
        category: "analytics",
      },
      { name: "Conversion tracking", included: true, category: "analytics" },
    ],
    cta: "Start 7-Day Trial",
    color: "from-indigo-400 to-indigo-500",
    hoverColor: "group-hover:from-indigo-500 group-hover:to-indigo-600",
    backgroundColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
    textColor: "text-indigo-500",
    glowColor: "rgba(34, 197, 94, 0.15)",
    iconBg: "bg-indigo-500",
  },
  {
    id: "accelerate",
    name: "Accelerate",
    description: "Boost your testimonial strategy with AI-powered insights",
    icon: <Zap className="w-6 h-6 text-purple-500" />,
    monthlyPrice: 59,
    yearlyPrice: 47,
    popular: true,
    featured: true,
    features: [
      // Collection
      {
        name: "Up to 150 testimonials/month",
        included: true,
        category: "collection",
      },
      {
        name: "Text, image & audio testimonials",
        included: true,
        category: "collection",
      },
      {
        name: "Smart collection form with custom fields",
        included: true,
        category: "collection",
      },
      {
        name: "Advanced invite campaigns",
        included: true,
        category: "collection",
      },
      {
        name: "Social import with monitoring",
        included: true,
        category: "collection",
      },
      { name: "QR code collection", included: true, category: "collection" },

      // Analysis
      {
        name: "Advanced sentiment & intent analysis",
        included: true,
        category: "analysis",
      },
      {
        name: "AI content quality scoring",
        included: true,
        category: "analysis",
      },
      {
        name: "Customer feedback themes detection",
        included: true,
        category: "analysis",
      },

      // Publishing
      {
        name: "10 customizable templates",
        included: true,
        category: "publishing",
      },
      {
        name: "Interactive embedding widgets",
        included: true,
        category: "publishing",
      },
      {
        name: "Brand customization tools",
        included: true,
        category: "publishing",
      },
      {
        name: "Dynamic social media cards",
        included: true,
        category: "publishing",
      },

      // AI Features
      {
        name: "AI content enhancement & refinement",
        included: true,
        category: "ai",
      },
      {
        name: "Advanced testimonial summarization",
        included: true,
        category: "ai",
      },
      {
        name: "Basic video testimonial creation (10/month)",
        included: true,
        category: "ai",
      },
      {
        name: "AI narrative generation (20/month)",
        included: true,
        category: "ai",
      },
      { name: "Smart response suggestions", included: true, category: "ai" },
      {
        name: "Automated testimonial categorization",
        included: true,
        category: "ai",
      },
      {
        name: "Highlight extraction automation",
        included: true,
        category: "ai",
      },

      // Management
      {
        name: "Advanced customer segmentation",
        included: true,
        category: "management",
      },
      {
        name: "Team collaboration tools",
        included: true,
        category: "management",
      },
      { name: "Scheduled publishing", included: true, category: "management" },

      // Integrations
      { name: "CRM integrations", included: true, category: "integrations" },
      {
        name: "Email marketing tool connections",
        included: true,
        category: "integrations",
      },
      {
        name: "Basic e-commerce integrations",
        included: true,
        category: "integrations",
      },

      // Analytics
      {
        name: "Real-time analytics dashboard",
        included: true,
        category: "analytics",
      },
      { name: "Conversion tracking", included: true, category: "analytics" },
      { name: "Custom report builder", included: true, category: "analytics" },
    ],
    cta: "Start 7-Day Trial",
    color: "from-purple-400 to-purple-500",
    hoverColor: "group-hover:from-purple-500 group-hover:to-purple-600",
    backgroundColor: "bg-purple-50",
    borderColor: "border-purple-100",
    textColor: "text-purple-500",
    glowColor: "rgba(168, 85, 247, 0.2)",
    iconBg: "bg-purple-500",
  },
  {
    id: "transform",
    name: "Transform",
    description: "Complete AI-powered testimonial management solution",
    icon: <Award className="w-6 h-6 text-fuchsia-500" />,
    monthlyPrice: 129,
    yearlyPrice: 99,
    features: [
      // Collection
      {
        name: "Up to 500 testimonials/month",
        included: true,
        category: "collection",
      },
      {
        name: "All media formats support",
        included: true,
        category: "collection",
      },
      {
        name: "Advanced collection forms with logic",
        included: true,
        category: "collection",
      },
      {
        name: "Smart automated invite sequences",
        included: true,
        category: "collection",
      },
      {
        name: "Omnichannel collection",
        included: true,
        category: "collection",
      },

      // Analysis
      {
        name: "Premium sentiment & intent analytics",
        included: true,
        category: "analysis",
      },
      {
        name: "Deep content quality analysis",
        included: true,
        category: "analysis",
      },
      {
        name: "Competitor testimonial insights",
        included: true,
        category: "analysis",
      },
      {
        name: "Emotion & tone detection",
        included: true,
        category: "analysis",
      },

      // Publishing
      {
        name: "Unlimited template library",
        included: true,
        category: "publishing",
      },
      {
        name: "Dynamic interactive widgets",
        included: true,
        category: "publishing",
      },
      {
        name: "Complete branding studio",
        included: true,
        category: "publishing",
      },
      {
        name: "Testimonial A/B testing",
        included: true,
        category: "publishing",
      },

      // AI Features
      {
        name: "Premium video creation (50/month)",
        included: true,
        category: "ai",
      },
      {
        name: "Advanced AI narrative generation",
        included: true,
        category: "ai",
      },
      {
        name: "AI content optimization & enhancement",
        included: true,
        category: "ai",
      },
      {
        name: "Testimonial voice cloning (25/month)",
        included: true,
        category: "ai",
      },
      {
        name: "AI-powered testimonial verification",
        included: true,
        category: "ai",
      },
      {
        name: "Persona-based content adaptation",
        included: true,
        category: "ai",
      },
      {
        name: "Testimonial-to-case-study (10/month)",
        included: true,
        category: "ai",
      },
      {
        name: "Intelligent follow-up question generator",
        included: true,
        category: "ai",
      },
      { name: "Visual testimonial enhancer", included: true, category: "ai" },
      {
        name: "Multilingual translation (20 languages)",
        included: true,
        category: "ai",
      },
      {
        name: "Buyer journey testimonial mapping",
        included: true,
        category: "ai",
      },

      // Management
      {
        name: "AI-driven customer segmentation",
        included: true,
        category: "management",
      },
      {
        name: "Advanced team collaboration tools",
        included: true,
        category: "management",
      },
      {
        name: "Content calendar & scheduling",
        included: true,
        category: "management",
      },

      // Integrations
      {
        name: "Full CRM & marketing integrations",
        included: true,
        category: "integrations",
      },
      {
        name: "Multi-platform social scheduling",
        included: true,
        category: "integrations",
      },
      {
        name: "Advanced e-commerce integrations",
        included: true,
        category: "integrations",
      },

      // Analytics
      {
        name: "Predictive analytics & forecasting",
        included: true,
        category: "analytics",
      },
      {
        name: "ROI calculator & attribution",
        included: true,
        category: "analytics",
      },
      {
        name: "Competitive benchmarking",
        included: true,
        category: "analytics",
      },
      {
        name: "AI-driven conversion prediction",
        included: true,
        category: "analytics",
      },

      // Advanced
      {
        name: "White labeling & customization",
        included: true,
        category: "advanced",
      },
      { name: "Basic API access", included: true, category: "advanced" },
      { name: "Priority support", included: true, category: "advanced" },
    ],
    cta: "Start 7-Day Trial",
    color: "from-fuchsia-400 to-fuchsia-500",
    hoverColor: "group-hover:from-fuchsia-500 group-hover:to-fuchsia-600",
    backgroundColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-100",
    textColor: "text-fuchsia-500",
    glowColor: "rgba(245, 158, 11, 0.15)",
    iconBg: "bg-fuchsia-500",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solutions for large organizations with specific needs",
    icon: <Crown className="w-6 h-6 text-slate-700" />,
    customPrice: true,
    addendum: "Starting at $499/month",
    features: [
      // Core features
      { name: "Unlimited testimonials", included: true, category: "core" },
      {
        name: "Everything in Transform plan",
        included: true,
        category: "core",
      },

      // Enterprise specific
      {
        name: "Dedicated account manager",
        included: true,
        category: "enterprise",
      },
      {
        name: "Custom AI model training",
        included: true,
        category: "enterprise",
      },
      {
        name: "On-premise deployment options",
        included: true,
        category: "enterprise",
      },
      {
        name: "Enterprise-grade security & compliance",
        included: true,
        category: "enterprise",
      },
      { name: "SLA guarantees", included: true, category: "enterprise" },

      // AI Features
      {
        name: "Industry-specific AI analysis models",
        included: true,
        category: "ai",
      },
      {
        name: "Custom sentiment analysis training",
        included: true,
        category: "ai",
      },
      {
        name: "AI-powered competitive intelligence",
        included: true,
        category: "ai",
      },
      {
        name: "Product feedback extraction & routing",
        included: true,
        category: "ai",
      },
      { name: "Neural content generation", included: true, category: "ai" },
      {
        name: "AI spokesperson video generation",
        included: true,
        category: "ai",
      },
      {
        name: "Real-time testimonial fraud detection",
        included: true,
        category: "ai",
      },
      {
        name: "Comprehensive voice & tone analysis",
        included: true,
        category: "ai",
      },
      { name: "Unlimited AI-powered features", included: true, category: "ai" },

      // Advanced features
      {
        name: "Multi-brand testimonial management",
        included: true,
        category: "advanced",
      },
      {
        name: "Global content distribution network",
        included: true,
        category: "advanced",
      },
      {
        name: "Custom widget development",
        included: true,
        category: "advanced",
      },
      {
        name: "Full API access & webhooks",
        included: true,
        category: "advanced",
      },

      // Analytics & Management
      {
        name: "Enterprise analytics suite",
        included: true,
        category: "analytics",
      },
      {
        name: "Advanced ROI & attribution dashboards",
        included: true,
        category: "analytics",
      },
      {
        name: "Custom AI insights development",
        included: true,
        category: "analytics",
      },
      {
        name: "AI-powered market trend analysis",
        included: true,
        category: "analytics",
      },
      {
        name: "Multi-level user permissions",
        included: true,
        category: "management",
      },
      {
        name: "Automated compliance workflows",
        included: true,
        category: "management",
      },

      // Support
      { name: "Premium 24/7 support", included: true, category: "support" },
      {
        name: "Quarterly business reviews",
        included: true,
        category: "support",
      },
      { name: "Dedicated Slack channel", included: true, category: "support" },
    ],
    cta: "Contact Sales",
    color: "from-slate-700 to-slate-800",
    hoverColor: "group-hover:from-slate-800 group-hover:to-slate-900",
    backgroundColor: "bg-slate-50",
    borderColor: "border-slate-200",
    textColor: "text-slate-700",
    glowColor: "rgba(51, 65, 85, 0.15)",
    iconBg: "bg-slate-700",
  },
];

// Animation variants
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const glowVariants = {
  initial: { opacity: 0.2, scale: 0.8 },
  animate: {
    opacity: [0.2, 0.3, 0.2],
    scale: [0.8, 1.1, 0.8],
    transition: {
      repeat: Infinity,
      duration: 3,
      ease: "easeInOut",
    },
  },
};

// export const featureVariants = {
//   hidden: { opacity: 0, x: -20 },
//   visible: {
//     opacity: 1,
//     x: 0,
//     transition: { type: "spring", stiffness: 100, damping: 20 },
//   },
// };

export const planVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { type: "spring", delay: i * 0.05, stiffness: 80, damping: 15 },
  }),
};

export const cardVariants = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      type: "spring",
      stiffness: 100,
    },
  },
  hover: {
    y: -5,
    transition: {
      duration: 0.3,
      type: "spring",
      stiffness: 200,
    },
  },
  tap: { scale: 0.98, transition: { duration: 0.1 } },
};

export const featureVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export const getGlowPosition = (planId: string) => {
  if (planId === "accelerate") {
    return { top: 10, right: 10 };
  }
  return { top: 20, right: 20 };
};
