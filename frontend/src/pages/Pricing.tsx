import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Video,
  Scissors,
  FileText,
  Share2,
  BarChart3,
  Sparkles,
  ChevronDown,
  Globe,
  Folder,
  Calendar,
  MessageSquare,
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
    testimonials: string;
    storage: string;
    teamMembers: string;
  };
  cta: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For individual marketers",
    description:
      "Perfect for testing the platform and processing your first testimonials into marketing content.",
    monthlyPrice: 49,
    yearlyPrice: 490,
    limits: {
      testimonials: "20 testimonials/month",
      storage: "10 GB storage",
      teamMembers: "1 user",
    },
    features: {
      core: [
        { text: "Testimonial collection forms", included: true },
        { text: "Video & text testimonials", included: true },
        { text: "Public sharing pages", included: true },
        { text: "Basic analytics", included: true },
      ],
      videoProcessing: [
        { text: "AI video clipping (10+ clips per video)", included: true },
        { text: "Story video generation", included: true },
        { text: "Professional audio enhancement", included: true },
        { text: "Platform optimization", included: true },
        { text: "B-roll overlay", included: false },
        { text: "Custom intro/outro", included: false },
      ],
      contentManagement: [
        { text: "Content generation (13+ formats)", included: true },
        { text: "AI moment detection", included: true },
        { text: "Content folders & organization", included: true },
        { text: "Approval workflows", included: false },
      ],
      analytics: [
        { text: "Share performance tracking", included: true },
        { text: "View & engagement metrics", included: true },
        { text: "Basic sentiment analysis", included: true },
        { text: "Advanced analytics dashboard", included: false },
      ],
      teamCollaboration: [
        { text: "Email support", included: true },
        { text: "Team members", included: false },
        { text: "Role-based permissions", included: false },
        { text: "Priority support", included: false },
      ],
    },
    cta: "Start Free Trial",
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "For growing teams",
    description:
      "Complete content operations platform with team collaboration and advanced AI features.",
    monthlyPrice: 149,
    yearlyPrice: 1490,
    popular: true,
    limits: {
      testimonials: "100 testimonials/month",
      storage: "50 GB storage",
      teamMembers: "Up to 10 team members",
    },
    features: {
      core: [
        { text: "Everything in Starter, plus:", included: true },
        { text: "Custom collection widgets", included: true },
        { text: "Advanced SEO & Open Graph", included: true },
        { text: "Bulk operations", included: true },
      ],
      videoProcessing: [
        { text: "All video AI features", included: true },
        { text: "B-roll overlay with AI placement", included: true },
        { text: "Custom intro/outro generation", included: true },
        { text: "Multi-platform optimization", included: true },
        { text: "Background music mixing", included: true },
        { text: "Noise removal & enhancement", included: true },
      ],
      contentManagement: [
        { text: "Advanced content categorization", included: true },
        { text: "Approval workflows", included: true },
        { text: "Content calendar", included: true },
        { text: "Natural language search", included: true },
      ],
      analytics: [
        { text: "Advanced analytics dashboard", included: true },
        { text: "Social media performance", included: true },
        { text: "Conversion tracking", included: true },
        { text: "Sentiment & emotion analysis", included: true },
      ],
      teamCollaboration: [
        { text: "Social media scheduling & posting", included: true },
        { text: "Multi-platform auto-publish", included: true },
        { text: "Role-based permissions", included: true },
        { text: "Priority email + chat support", included: true },
      ],
    },
    cta: "Start Free Trial",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For agencies & enterprises",
    description:
      "Unlimited processing with white-label options, API access, and dedicated support.",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    limits: {
      testimonials: "Unlimited testimonials",
      storage: "200 GB storage",
      teamMembers: "Unlimited team members",
    },
    features: {
      core: [
        { text: "Everything in Growth, plus:", included: true },
        { text: "White-label options", included: true },
        { text: "Custom branding", included: true },
        { text: "Remove Cenphi branding", included: true },
      ],
      videoProcessing: [
        { text: "Priority processing queue", included: true },
        { text: "Batch processing", included: true },
        { text: "Advanced video customization", included: true },
        { text: "Custom platform profiles", included: true },
        { text: "Webhook integrations", included: true },
      ],
      contentManagement: [
        { text: "Multi-workspace support", included: true },
        { text: "Advanced automation rules", included: true },
        { text: "Custom content templates", included: true },
        { text: "Bulk content generation", included: true },
      ],
      analytics: [
        { text: "Custom reports & dashboards", included: true },
        { text: "Revenue attribution", included: true },
        { text: "Export to CSV/PDF", included: true },
        { text: "API analytics access", included: true },
      ],
      teamCollaboration: [
        { text: "Full API access", included: true },
        { text: "CRM integrations (Zapier)", included: true },
        { text: "Dedicated account manager", included: true },
        { text: "Phone + email + chat support", included: true },
      ],
    },
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom solutions",
    description:
      "Tailored infrastructure, custom integrations, SLA guarantees, and dedicated support.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: {
      testimonials: "Custom limits",
      storage: "Custom storage",
      teamMembers: "Unlimited",
    },
    features: {
      core: [
        { text: "Everything in Pro, plus:", included: true },
        { text: "Custom integrations", included: true },
        { text: "SSO & SAML", included: true },
        { text: "99.9% uptime SLA", included: true },
      ],
      videoProcessing: [
        { text: "Dedicated processing infrastructure", included: true },
        { text: "Custom video pipelines", included: true },
        { text: "Advanced security & compliance", included: true },
      ],
      contentManagement: [
        { text: "Custom feature development", included: true },
        { text: "Advanced workflow automation", included: true },
        { text: "Multi-region deployment", included: true },
      ],
      analytics: [
        { text: "Custom analytics integrations", included: true },
        { text: "Data residency options", included: true },
        { text: "Advanced security audits", included: true },
      ],
      teamCollaboration: [
        { text: "24/7 dedicated customer success", included: true },
        { text: "Onboarding & training", included: true },
        { text: "Quarterly business reviews", included: true },
        { text: "Custom SLA agreements", included: true },
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
      question: "What counts as a 'testimonial processed' per month?",
      answer:
        "Each unique testimonial video or text submission that you upload and process counts as one testimonial. Re-processing the same testimonial (e.g., creating new clips or formats) doesn't count as additional usage. The limit resets monthly.",
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer:
        "Yes! You can change your plan at any time. Upgrades take effect immediately and you'll be charged a prorated amount. Downgrades take effect at your next billing cycle with no penalties. All your data and content remain accessible.",
    },
    {
      question: "What happens during the 14-day free trial?",
      answer:
        "You get full access to all features of your chosen plan for 14 days. No credit card required to start. Process testimonials, create content, test all AI features. You'll only be charged after your trial ends if you decide to continue.",
    },
    {
      question: "What video AI features are included?",
      answer:
        "All plans include: AI video clipping (extracts 10+ shareable moments), story video generation (sequences clips with transitions), professional audio enhancement (8-stage processing), platform optimization (auto-resize for each social platform), and sentiment-based moment detection. Growth+ plans add B-roll overlay, custom intro/outro, and background music mixing.",
    },
    {
      question: "How does content generation work?",
      answer:
        "Our AI analyzes your testimonial and automatically generates 13+ content formats: blog posts, social media posts (LinkedIn, Twitter, Instagram), email campaigns, case studies, ad copy, and more. Each piece is customized for the platform and maintains the authentic voice of your customer.",
    },
    {
      question: "Can I use this for multiple clients/brands?",
      answer:
        "Yes! The Pro plan includes multi-workspace support, perfect for agencies managing multiple clients. Each workspace has separate branding, content, and team members. You can also white-label the platform to match your agency branding.",
    },
    {
      question: "What social media platforms are supported?",
      answer:
        "We support LinkedIn, Twitter, Facebook, Instagram, TikTok, and YouTube. Our platform optimization automatically resizes, crops, and formats your content for each platform's requirements. Growth+ plans include social media scheduling and auto-posting.",
    },
    {
      question: "Is there an API for custom integrations?",
      answer:
        "Yes! Pro and Enterprise plans include full API access. You can integrate with your existing tools, automate workflows, and build custom solutions on top of our platform. We provide comprehensive API documentation and webhooks for real-time updates.",
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
        description="Transform testimonials into 10+ marketing assets automatically. Plans start at $99/mo with 14-day free trial. No credit card required."
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
                Turn testimonials into revenue-driving content
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Choose the plan that fits your needs. All plans include AI video
                processing, content generation, and analytics. Start with a
                14-day free trial.
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-xl ${
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

                  {/* Limits */}
                  <div className="mb-5 pb-5 border-b border-gray-100">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">
                          {tier.limits.testimonials}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Folder className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">
                          {tier.limits.storage}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-700">
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

                    {/* Show More Button */}
                    {showAllFeatures !== tier.id && (
                      <button
                        onClick={() => setShowAllFeatures(tier.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-3"
                      >
                        View all features
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Expanded Features */}
                    {showAllFeatures === tier.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-3 pt-3 border-t border-gray-100"
                      >
                        {/* Content Management */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            <FileText className="w-3 h-3 inline mr-1" />
                            Content Management
                          </p>
                          <div className="space-y-2">
                            {tier.features.contentManagement.map(
                              (feature, i) => (
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
                              )
                            )}
                          </div>
                        </div>

                        {/* Analytics */}
                        <div>
                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            <BarChart3 className="w-3 h-3 inline mr-1" />
                            Analytics
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

                        {/* Team & Support */}
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            <Shield className="w-3 h-3 inline mr-1" />
                            Team & Support
                          </p>
                          <div className="space-y-2.5">
                            {tier.features.teamCollaboration.map(
                              (feature, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  {feature.included ? (
                                    <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  )}
                                  <span
                                    className={`text-sm ${
                                      feature.included
                                        ? "text-gray-700"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {feature.text}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setShowAllFeatures(null)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 mt-4"
                        >
                          Show less
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                      </motion.div>
                    )}
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
