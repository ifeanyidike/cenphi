import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Users,
  ArrowRight,
  Video,
  FileText,
  Share2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Globe,
  Folder,
  Crown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/custom/footer";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import { pageSEO } from "@/config/seo";

interface PricingFeature {
  text: string;
  included: boolean;
  tooltip?: string;
}

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: {
    core: PricingFeature[];
    videoProcessing: PricingFeature[];
    contentManagement: PricingFeature[];
    analytics: PricingFeature[];
    teamCollaboration: PricingFeature[];
  };
  limits: {
    testimonials?: string;
    storage?: string;
    teamMembers?: string;
    videoProcessing?: string;
    aiClips?: string;
    platformOptimization?: string;
    contentGeneration?: string;
    talkToData?: string;
    shares?: string;
    apiCalls?: string;
    linkedInPosts?: string;
  };
  cta: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For individual marketers",
    description:
      "Perfect for small businesses testing testimonial video marketing with core AI features.",
    monthlyPrice: 22,
    yearlyPrice: 220,
    limits: {
      testimonials: "15 videos/month",
      videoProcessing: "15 processing operations/month",
      aiClips: "150 AI clips total/month (10 per video)",
      platformOptimization: "45 platform posts/month (3 per video)",
      contentGeneration: "75 AI content pieces/month (5 per video)",
      talkToData: "30 AI analytics queries/month",
      shares: "Unlimited shares",
      storage: "10 GB",
      teamMembers: "1 user",
    },
    features: {
      core: [
        { text: "Testimonial collection widget & forms", included: true },
        { text: "Video, text & voice testimonials", included: true },
        { text: "SEO-optimized public sharing pages", included: true },
        { text: "Basic analytics & view tracking", included: true },
        { text: "Standard processing (24h)", included: true },
      ],
      videoProcessing: [
        {
          text: "AI highlight extraction (9 types)",
          included: true,
          tooltip:
            "General, emotional, problem, solution, results, metrics, recommendation, before/after, thematic",
        },
        {
          text: "AI video clipping (10 clips/video max)",
          included: true,
        },
        { text: "Story video generation with AI", included: true },
        {
          text: "Platform optimization (LinkedIn, Twitter, FB, IG, TikTok, YouTube)",
          included: true,
        },
        { text: "Automatic transcription", included: true },
        { text: "B-roll overlay & custom branding", included: false },
      ],
      contentManagement: [
        {
          text: "AI content generation (LinkedIn, Twitter, email, blog)",
          included: true,
        },
        { text: "13+ content format templates", included: true },
        { text: "AI moment detection & sentiment", included: true },
        { text: "Content folders & tagging", included: true },
        { text: "Approval workflows & team roles", included: false },
      ],
      analytics: [
        { text: "Share performance tracking", included: true },
        { text: "View & engagement metrics", included: true },
        { text: "Basic sentiment analysis", included: true },
        { text: "Talk to Your Data (30 queries/month)", included: true },
        { text: "Advanced analytics dashboard", included: false },
        { text: "LinkedIn post analytics", included: false },
      ],
      teamCollaboration: [
        { text: "Email support (72h response)", included: true },
        { text: "Export content (MP4, PDF, text)", included: true },
        { text: "Embeddable widgets", included: true },
        { text: "LinkedIn auto-posting", included: false },
      ],
    },
    cta: "Start Free Trial",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For serious marketers",
    description:
      "Scale your testimonial marketing with LinkedIn automation, advanced AI, and premium features.",
    monthlyPrice: 59,
    yearlyPrice: 590,
    popular: true,
    limits: {
      testimonials: "60 videos/month",
      videoProcessing: "60 processing operations/month",
      aiClips: "600 AI clips total/month (10 per video)",
      platformOptimization: "180 platform posts/month (3 per video)",
      contentGeneration: "300 AI content pieces/month (5 per video)",
      talkToData: "150 AI analytics queries/month",
      linkedInPosts: "Unlimited LinkedIn posts",
      shares: "Unlimited shares",
      storage: "50 GB",
      teamMembers: "3 users",
    },
    features: {
      core: [
        { text: "Everything in Starter, plus:", included: true },
        { text: "Custom-branded collection widgets", included: true },
        { text: "Advanced SEO & Open Graph meta", included: true },
        { text: "Bulk upload & batch processing", included: true },
        { text: "Priority processing (12h turnaround)", included: true },
        { text: "3 team member seats", included: true },
      ],
      videoProcessing: [
        { text: "All AI video features from Starter", included: true },
        { text: "B-roll overlay with AI placement", included: true },
        { text: "Custom intro/outro generation", included: true },
        { text: "Advanced captions & subtitles", included: true },
        { text: "Background music integration", included: true },
        { text: "HD video export (1080p)", included: true },
      ],
      contentManagement: [
        { text: "Approval workflows & team roles", included: true },
        { text: "Content calendar with scheduling", included: true },
        { text: "Natural language content search", included: true },
        { text: "Advanced content tagging & filters", included: true },
        { text: "Custom content templates", included: true },
      ],
      analytics: [
        { text: "Advanced analytics dashboard", included: true },
        { text: "Talk to Your Data (150 queries/month)", included: true },
        { text: "LinkedIn post performance tracking", included: true },
        { text: "Share conversion tracking", included: true },
        { text: "Sentiment & emotion analysis with insights", included: true },
        { text: "Export reports (CSV, PDF)", included: true },
      ],
      teamCollaboration: [
        { text: "LinkedIn auto-posting & scheduling", included: true },
        { text: "Multi-platform content sharing", included: true },
        { text: "Advanced export options (all formats)", included: true },
        { text: "Email support (48h response)", included: true },
        { text: "Team collaboration & comments", included: true },
      ],
    },
    cta: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For agencies & teams",
    description:
      "Unlimited AI processing, white-label branding, API access, and multi-user collaboration.",
    monthlyPrice: 119,
    yearlyPrice: 1190,
    limits: {
      testimonials: "Unlimited videos",
      videoProcessing: "Unlimited processing",
      aiClips: "Unlimited AI clips",
      platformOptimization: "Unlimited platform posts",
      contentGeneration: "Unlimited AI content",
      talkToData: "Unlimited AI queries",
      linkedInPosts: "Unlimited LinkedIn posts",
      shares: "Unlimited shares",
      apiCalls: "10,000 API calls/month",
      storage: "200 GB",
      teamMembers: "10 users",
    },
    features: {
      core: [
        { text: "Everything in Growth, plus:", included: true },
        {
          text: "White-label platform (remove Cenphi branding)",
          included: true,
        },
        { text: "Custom domain & branding", included: true },
        { text: "10 team member seats", included: true },
        { text: "Role-based permissions", included: true },
        { text: "Express processing (6h turnaround)", included: true },
      ],
      videoProcessing: [
        { text: "Unlimited AI video processing", included: true },
        { text: "Batch processing (unlimited videos)", included: true },
        { text: "4K video export", included: true },
        { text: "Custom platform video profiles", included: true },
        { text: "Advanced video customization", included: true },
        { text: "Premium video enhancement", included: true },
      ],
      contentManagement: [
        { text: "Multi-workspace support (3 workspaces)", included: true },
        { text: "Advanced automation rules & triggers", included: true },
        { text: "Custom content templates library", included: true },
        { text: "Bulk AI content generation", included: true },
        { text: "Content versioning & history", included: true },
      ],
      analytics: [
        { text: "Custom reports & dashboards", included: true },
        { text: "Talk to Your Data (unlimited queries)", included: true },
        { text: "Revenue attribution tracking", included: true },
        { text: "Advanced export (CSV, PDF, JSON)", included: true },
        { text: "API analytics access", included: true },
        { text: "Custom data retention", included: true },
      ],
      teamCollaboration: [
        { text: "REST API access (10k calls/month)", included: true },
        { text: "Webhook integrations", included: true },
        { text: "Priority email support (24h)", included: true },
        { text: "Dedicated onboarding & training", included: true },
        { text: "Monthly strategy consultation", included: true },
      ],
    },
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom solutions",
    description:
      "Dedicated infrastructure, custom integrations, SLA guarantees, and 24/7 support for large teams.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      testimonials: "Custom limits",
      videoProcessing: "Custom limits",
      aiClips: "Custom limits",
      platformOptimization: "Custom limits",
      contentGeneration: "Custom limits",
      talkToData: "Custom limits",
      linkedInPosts: "Unlimited",
      shares: "Unlimited",
      apiCalls: "Custom API limits",
      storage: "Custom storage",
      teamMembers: "Unlimited users",
    },
    features: {
      core: [
        { text: "Everything in Pro, plus:", included: true },
        { text: "Custom integrations & development", included: true },
        { text: "SSO & SAML authentication", included: true },
        { text: "99.9% uptime SLA guarantee", included: true },
        { text: "Unlimited team members", included: true },
        { text: "Instant processing (priority queue)", included: true },
      ],
      videoProcessing: [
        { text: "Dedicated processing infrastructure", included: true },
        { text: "Custom video AI pipelines", included: true },
        {
          text: "Advanced security & compliance (SOC 2, GDPR)",
          included: true,
        },
        { text: "Custom video quality settings", included: true },
        { text: "Reserved processing capacity", included: true },
      ],
      contentManagement: [
        { text: "Custom feature development", included: true },
        { text: "Advanced workflow automation & AI", included: true },
        { text: "Multi-region deployment options", included: true },
        { text: "Unlimited workspaces", included: true },
        {
          text: "Custom integrations (Salesforce, HubSpot, etc.)",
          included: true,
        },
      ],
      analytics: [
        { text: "Custom analytics integrations", included: true },
        { text: "Data residency & sovereignty options", included: true },
        { text: "Advanced security audits & compliance", included: true },
        { text: "Custom reporting & BI integrations", included: true },
        { text: "Real-time data exports", included: true },
      ],
      teamCollaboration: [
        { text: "24/7 dedicated customer success manager", included: true },
        { text: "Unlimited REST API calls", included: true },
        { text: "Custom onboarding & training program", included: true },
        { text: "Quarterly business reviews", included: true },
        { text: "Custom SLA & performance guarantees", included: true },
        { text: "Priority feature requests", included: true },
      ],
    },
    cta: "Contact Sales",
  },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState<string | null>(null);

  const faqs = [
    {
      question: "How do the monthly limits work?",
      answer:
        "Each plan has specific monthly limits. For example, Starter includes 15 videos/month with 150 AI clips total (10 clips per video), 75 AI content pieces (5 per video), and 45 platform posts (3 per video). All limits reset on your billing date. Growth scales to 60 videos with proportionally higher limits, while Pro offers unlimited processing.",
    },
    {
      question: "What counts as one 'video processing operation'?",
      answer:
        "Each time you upload and process a new testimonial video, it counts as one operation. This includes transcription, AI analysis, and initial clip generation. Re-processing the same video (like creating additional clips or regenerating content) doesn't count against your limit.",
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer:
        "Yes! You can change your plan at any time. Upgrades take effect immediately with prorated billing. Downgrades take effect at your next billing cycle with no penalties. All your existing content and data remain accessible.",
    },
    {
      question: "What happens during the 14-day free trial?",
      answer:
        "You get full access to all features of your chosen plan for 14 days. No credit card required to start. Process testimonials, create AI clips, test all features. You'll only be charged after your trial ends if you decide to continue.",
    },
    {
      question: "What AI features are included in each plan?",
      answer:
        "All plans include: AI highlight extraction (9 types), video clipping (10 clips/video on Starter), story video generation, automatic transcription, platform optimization for 6+ social platforms, sentiment analysis, and AI content generation. Growth adds B-roll, custom branding, and team collaboration. Pro unlocks unlimited processing and white-label options.",
    },
    {
      question: "How does AI content generation work?",
      answer:
        "Our AI analyzes your testimonial and generates content in 13+ formats: LinkedIn posts, Twitter threads, email campaigns, blog posts, case studies, ad copy, and more. Each piece is platform-optimized and maintains your customer's authentic voice. Starter gets 5 pieces per video, Growth gets more, and Pro has unlimited generation.",
    },
    {
      question: "Can I use this for multiple clients or brands?",
      answer:
        "Yes! The Pro plan includes 3 workspaces, perfect for agencies managing multiple clients. Enterprise offers unlimited workspaces. Each workspace has separate branding, content, team members, and white-label options for Pro/Enterprise plans.",
    },
    {
      question: "What social platforms can I post to?",
      answer:
        "We support LinkedIn, Twitter, Facebook, Instagram, TikTok, and YouTube. Platform optimization auto-formats your content for each network. Growth and Pro plans include LinkedIn auto-posting and scheduling. You can export content for manual posting to any platform.",
    },
    {
      question: "Is there an API for custom integrations?",
      answer:
        "Yes! Pro plans include 10,000 API calls/month with full REST API access and webhook support. Enterprise plans offer unlimited API calls, custom integrations (Salesforce, HubSpot, etc.), and dedicated technical support for building on our platform.",
    },
  ];

  const allFeatures = [
    {
      category: "Video Processing & AI",
      icon: Video,
      features: [
        "AI video clipping (10+ clips per video)",
        "Emotional peak detection",
        "Story video generation with AI sequencing",
        "B-roll overlay with semantic placement",
        "Custom intro/outro with voiceover",
        "8-stage professional audio enhancement",
        "Background music mixing with ducking",
        "Noise removal & cleanup",
        "Platform optimization (6+ platforms)",
        "Semantic crossfading for smooth transitions",
      ],
    },
    {
      category: "Content Generation",
      icon: FileText,
      features: [
        "13+ content format generation",
        "Blog posts & case studies",
        "Social media posts (all platforms)",
        "Email campaigns",
        "Ad copy & landing page content",
        "Twitter threads",
        "LinkedIn posts",
        "Instagram captions",
        "Meta descriptions & SEO content",
        "Carousel content",
      ],
    },
    {
      category: "Content Management",
      icon: Folder,
      features: [
        "Smart content categorization",
        "Folder organization system",
        "Bulk operations & multi-select",
        "Approval workflows",
        "Content calendar",
        "Natural language search",
        "Tags & custom metadata",
        "Version history",
        "Content duplication detection",
      ],
    },
    {
      category: "Analytics & Insights",
      icon: BarChart3,
      features: [
        "Public share analytics (views, engagement)",
        "Social post performance tracking",
        "Conversion tracking & attribution",
        "Sentiment & emotion analysis",
        "Engagement rate metrics",
        "Time-series trending (7/30/90 days)",
        "Platform distribution analytics",
        "Unique visitor tracking",
        "Download tracking",
      ],
    },
    {
      category: "Social Media Automation",
      icon: Share2,
      features: [
        "Multi-platform scheduling",
        "Auto-posting to LinkedIn, Twitter, Facebook",
        "Optimal timing analysis",
        "Engagement tracking per post",
        "Content rescheduling",
        "Platform-specific formatting",
        "Hashtag suggestions",
        "Post preview for all platforms",
      ],
    },
    {
      category: "Sharing & Distribution",
      icon: Globe,
      features: [
        "Beautiful public showcase pages",
        "SEO-optimized sharing",
        "Open Graph integration",
        "Custom share URLs",
        "Password protection option",
        "Download tracking",
        "Embed codes for websites",
        "Mobile-responsive pages",
      ],
    },
  ];

  return (
    <>
      <SEO
        title="Pricing - Testimonial Content Operations Platform | Cenphi"
        description="Transform testimonials into AI-powered marketing content. Plans from $22/mo: 15-60 videos/month with AI clipping, content generation & LinkedIn automation. 14-day free trial."
        keywords="testimonial software pricing, video testimonial platform cost, AI content generation pricing, social media automation pricing"
        url={pageSEO.pricing.url}
      />
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        {/* Header Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Simple, transparent pricing for every team size
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                All plans include AI video clipping, content generation,
                platform optimization, and analytics. Start with 15 videos/month
                or scale to unlimited. 14-day free trial, no credit card
                required.
              </p>
            </motion.div>

            {/* Billing Toggle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center p-1 bg-white border border-gray-200 rounded-lg shadow-sm mb-12"
            >
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-md ${
                  !isAnnual
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2.5 text-sm font-medium transition-all duration-200 rounded-md ${
                  isAnnual
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annual
              </button>
              {isAnnual && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="ml-3 px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200"
                >
                  Save 17%
                </motion.span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-xl self-start ${
                  tier.popular
                    ? "border-blue-500 shadow-lg relative"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <Crown className="w-3 h-3" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {tier.name}
                    </h3>
                    <p className="text-xs text-blue-600 font-medium mb-2">
                      {tier.tagline}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {tier.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="mb-5">
                    {tier.id === "enterprise" ? (
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          Custom
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Contact us for pricing
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-gray-900">
                            $
                            {isAnnual
                              ? Math.floor(tier.yearlyPrice / 12)
                              : tier.monthlyPrice}
                          </span>
                          <span className="text-sm text-gray-600">/month</span>
                        </div>
                        {isAnnual && (
                          <p className="text-[10px] text-gray-500 mt-1">
                            ${tier.yearlyPrice} billed annually
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() =>
                      tier.id === "enterprise"
                        ? window.open("mailto:sales@cenphi.io")
                        : navigate("/signup")
                    }
                    className={`w-full py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-200 mb-6 ${
                      tier.popular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                        : "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                    }`}
                  >
                    {tier.cta}
                    {tier.id !== "enterprise" && (
                      <ArrowRight className="inline-block ml-2 w-4 h-4" />
                    )}
                  </button>

                  {/* Limits - Comprehensive View */}
                  <div className="mb-5 pb-5 border-b border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Monthly Limits
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2">
                        <Video className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-gray-700 font-medium block">
                            {tier.limits.testimonials}
                          </span>
                          {tier.limits.videoProcessing && (
                            <span className="text-[10px] text-gray-500">
                              {tier.limits.videoProcessing}
                            </span>
                          )}
                        </div>
                      </div>

                      {tier.limits.aiClips && (
                        <div className="flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-gray-700 font-medium block">
                              {tier.limits.aiClips}
                            </span>
                          </div>
                        </div>
                      )}

                      {tier.limits.contentGeneration && (
                        <div className="flex items-start gap-2">
                          <Share2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="text-gray-700 font-medium block">
                              {tier.limits.contentGeneration}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                        <Folder className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600">
                          {tier.limits.storage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600">
                          {tier.limits.teamMembers}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Features */}
                  <div className="space-y-3">
                    {/* Core Features */}
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Core Features
                      </p>
                      <div className="space-y-2">
                        {tier.features.core.slice(0, 4).map((feature, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            {feature.included ? (
                              <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            )}
                            <span
                              className={`text-xs ${
                                feature.included
                                  ? "text-gray-700"
                                  : "text-gray-400"
                              }`}
                            >
                              {feature.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Video Processing */}
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <Video className="w-3 h-3 inline mr-1" />
                        Video AI
                      </p>
                      <div className="space-y-2">
                        {tier.features.videoProcessing
                          .slice(0, 4)
                          .map((feature, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              {feature.included ? (
                                <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                              )}
                              <span
                                className={`text-xs ${
                                  feature.included
                                    ? "text-gray-700"
                                    : "text-gray-400"
                                }`}
                              >
                                {feature.text}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Expanded Features */}
                    {showAllFeatures === tier.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-3 border-t border-gray-100"
                      >
                        {/* Remaining Video Processing Features */}
                        {tier.features.videoProcessing.length > 4 && (
                          <div>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                              More Video AI
                            </p>
                            <div className="space-y-2">
                              {tier.features.videoProcessing
                                .slice(4)
                                .map((feature, i) => (
                                  <div
                                    key={i}
                                    className="flex items-start gap-1.5"
                                  >
                                    {feature.included ? (
                                      <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                    )}
                                    <span
                                      className={`text-xs ${feature.included ? "text-gray-700" : "text-gray-400"}`}
                                    >
                                      {feature.text}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Content Management */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Content & Distribution
                          </p>
                          <div className="space-y-2">
                            {tier.features.contentManagement.map(
                              (feature, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-1.5"
                                >
                                  {feature.included ? (
                                    <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs ${feature.included ? "text-gray-700" : "text-gray-400"}`}
                                  >
                                    {feature.text}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Analytics */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Analytics & Insights
                          </p>
                          <div className="space-y-2">
                            {tier.features.analytics.map((feature, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                {feature.included ? (
                                  <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                )}
                                <span
                                  className={`text-xs ${feature.included ? "text-gray-700" : "text-gray-400"}`}
                                >
                                  {feature.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Team Collaboration */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Team & Support
                          </p>
                          <div className="space-y-2">
                            {tier.features.teamCollaboration.map(
                              (feature, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-1.5"
                                >
                                  {feature.included ? (
                                    <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span
                                    className={`text-xs ${feature.included ? "text-gray-700" : "text-gray-400"}`}
                                  >
                                    {feature.text}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* See More/Less Button */}
                    <button
                      onClick={() =>
                        setShowAllFeatures(
                          showAllFeatures === tier.id ? null : tier.id
                        )
                      }
                      className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 mt-4 py-2 border-t border-gray-100"
                    >
                      {showAllFeatures === tier.id ? (
                        <>
                          See Less <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          See All Features{" "}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Complete Feature List */}
        <div className="bg-white border-y border-gray-200 py-16">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Everything you need to maximize testimonial ROI
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                All plans include our complete suite of AI-powered video
                processing, content generation, and analytics tools
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allFeatures.map((category, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-50 rounded-lg p-6 border border-gray-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">
                      {category.category}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {category.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Frequently asked questions
              </h2>
              <p className="text-gray-600">
                Everything you need to know about plans and features
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  >
                    <span className="font-semibold text-gray-900 pr-4 text-sm">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 border-t border-gray-100"
                    >
                      <p className="text-gray-600 pt-4 text-sm leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to 10x your testimonial ROI?
            </h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
              Join growing teams using Cenphi to turn testimonials into
              revenue-driving content. Start your free trial today—no credit
              card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/signup")}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center shadow-lg"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => navigate("/studio")}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors duration-200"
              >
                View Live Demo
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-6">
              14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default PricingPage;
