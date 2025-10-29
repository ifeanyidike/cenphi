import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Users,
  Zap,
  Shield,
  ArrowRight,
  FileText,
  Video,
  Globe,
  MessageSquare,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import Footer from "@/components/custom/footer";
import Navbar from "@/components/landing/Navbar";
import SEO from "@/components/SEO";
import { pageSEO } from "@/config/seo";

interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  features: {
    testimonials: string;
    aiCredits: string;
    team: string;
    integrations: string[];
    aiFeatures: string[];
    support: string;
  };
  cta: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    description:
      "Perfect for small teams getting started with testimonial collection",
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: {
      testimonials: "50 testimonials/month",
      aiCredits: "100 AI processing credits",
      team: "Up to 3 team members",
      integrations: [
        "Email collection campaigns",
        "Embeddable widgets",
        "Basic performance analytics",
      ],
      aiFeatures: [
        "Text enhancement & grammar polish",
        "Basic content generation",
        "Sentiment analysis",
      ],
      support: "Email support",
    },
    cta: "Start Free Trial",
  },
  {
    id: "professional",
    name: "Professional",
    description:
      "Complete testimonial management with advanced AI processing capabilities",
    monthlyPrice: 99,
    yearlyPrice: 990,
    popular: true,
    features: {
      testimonials: "200 testimonials/month",
      aiCredits: "500 AI processing credits",
      team: "Up to 10 team members",
      integrations: [
        "All collection methods",
        "Google Drive sync",
        "Advanced analytics dashboard",
        "Zapier integration",
      ],
      aiFeatures: [
        "4K video upscaling & enhancement",
        "15+ content types generation",
        "Multi-language translation",
        "Voice narration synthesis",
      ],
      support: "Priority email + live chat support",
    },
    cta: "Start Free Trial",
  },
  {
    id: "scale",
    name: "Scale",
    description:
      "Enterprise-grade platform for high-volume testimonial operations",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    features: {
      testimonials: "Unlimited testimonials",
      aiCredits: "2,000 AI processing credits",
      team: "Up to 25 team members",
      integrations: [
        "Full API access",
        "Custom workflow automation",
        "CRM integrations",
        "Social media publishing",
      ],
      aiFeatures: [
        "Broadcast-quality video processing",
        "Custom AI model training",
        "Advanced content personalization",
        "Priority processing queue",
      ],
      support: "Phone + email + dedicated account manager",
    },
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description:
      "Tailored solutions with dedicated infrastructure and custom integrations",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      testimonials: "Unlimited testimonials",
      aiCredits: "Unlimited AI processing",
      team: "Unlimited team members",
      integrations: [
        "Custom integrations",
        "SSO & SAML",
        "On-premise deployment",
        "White-label solutions",
      ],
      aiFeatures: [
        "Custom AI models",
        "Dedicated processing infrastructure",
        "Advanced security compliance",
        "Custom feature development",
      ],
      support: "24/7 dedicated customer success team",
    },
    cta: "Contact Sales",
  },
];

const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do AI processing credits work?",
      answer:
        "Each AI operation consumes credits based on complexity. Text enhancement uses 1 credit, content generation uses 2-5 credits, and video processing uses 10-20 credits depending on duration and quality settings.",
    },
    {
      question: "Can I upgrade or downgrade my plan anytime?",
      answer:
        "Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades occur at your next billing cycle with no penalties.",
    },
    {
      question: "What happens during the free trial?",
      answer:
        "All paid plans include a 14-day free trial with full access to features. No credit card required to start. You'll only be charged after your trial period ends.",
    },
    {
      question: "What integrations are available?",
      answer:
        "We support Google Drive, email collection widgets, social media platforms, Zapier, CRM systems, and provide full API access for custom integrations.",
    },
    {
      question: "How secure is my testimonial data?",
      answer:
        "We use enterprise-grade 256-bit SSL encryption, SOC 2 Type II compliance, and GDPR-compliant data handling. Your data is backed up daily and stored securely.",
    },
    {
      question: "Do you offer custom enterprise solutions?",
      answer:
        "Yes, our Enterprise plan includes custom integrations, on-premise deployment, dedicated infrastructure, and tailored AI model training for your specific needs.",
    },
  ];

  return (
    <>
      <SEO
        title={pageSEO.pricing.title}
        description={pageSEO.pricing.description}
        keywords={pageSEO.pricing.keywords}
        url={pageSEO.pricing.url}
        structuredData={pageSEO.pricing.structuredData}
      />
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        {/* Header Section */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-8 sm:pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-medium text-gray-900 mb-4">
              Choose the right plan for your business
            </h1>
            <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
              Transform customer testimonials into revenue-driving content with
              AI-powered tools. Start with a 14-day free trial, no credit card
              required.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center p-1 bg-white border border-gray-200 rounded-lg shadow-sm mb-8 sm:mb-12">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
                  !isAnnual
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md ${
                  isAnnual
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annual
              </button>
              {isAnnual && (
                <span className="ml-3 px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md">
                  Save 17%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-white rounded-lg border transition-all duration-300 hover:shadow-md ${
                  tier.popular ? "border-gray-900 shadow-sm" : "border-gray-200"
                }`}
              >
                {tier.popular && (
                  <div className="bg-gray-900 text-white text-center py-2 text-xs font-medium rounded-t-lg">
                    Most Popular
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {tier.description}
                  </p>

                  <div className="mb-6">
                    {tier.id === "enterprise" ? (
                      <div>
                        <span className="text-xl font-medium text-gray-900">
                          Custom
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          Contact for pricing
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-medium text-gray-900">
                            $
                            {isAnnual
                              ? Math.floor(tier.yearlyPrice / 12)
                              : tier.monthlyPrice}
                          </span>
                          <span className="text-gray-600 ml-1">/month</span>
                        </div>
                        {isAnnual && (
                          <p className="text-xs text-gray-500 mt-1">
                            ${tier.yearlyPrice} billed annually
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-full py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-200 mb-6 ${
                      tier.popular
                        ? "bg-gray-900 hover:bg-black text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tier.cta}
                  </button>

                  {/* Key Features */}
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">
                        {tier.features.testimonials}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <Zap className="w-4 h-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">
                        {tier.features.aiCredits}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <Users className="w-4 h-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">
                        {tier.features.team}
                      </span>
                    </div>

                    <div className="flex items-start">
                      <Shield className="w-4 h-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">
                        {tier.features.support}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        Key Capabilities
                      </p>
                      <div className="space-y-2">
                        {tier.features.aiFeatures
                          .slice(0, 3)
                          .map((feature, i) => (
                            <div key={i} className="flex items-start">
                              <Check className="w-3 h-3 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                              <span className="text-xs text-gray-600">
                                {feature}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-3">
                        Integrations
                      </p>
                      <div className="space-y-2">
                        {tier.features.integrations
                          .slice(0, 3)
                          .map((integration, i) => (
                            <div key={i} className="flex items-start">
                              <Check className="w-3 h-3 text-gray-400 mt-1 mr-2 flex-shrink-0" />
                              <span className="text-xs text-gray-600">
                                {integration}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Features Section */}
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                AI-powered testimonial processing
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Transform raw customer feedback into professional marketing
                assets with our comprehensive AI suite
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Video,
                  title: "Video Enhancement",
                  description:
                    "4K upscaling, noise reduction, color correction, and professional polish for broadcast-quality results",
                },
                {
                  icon: FileText,
                  title: "Content Generation",
                  description:
                    "Automatically create case studies, email campaigns, blog posts, and social media content from testimonials",
                },
                {
                  icon: Sparkles,
                  title: "Text Polishing",
                  description:
                    "Enhance clarity and impact while preserving authentic customer voice and emotional resonance",
                },
                {
                  icon: Globe,
                  title: "Translation Services",
                  description:
                    "Multi-language support with cultural adaptation to expand your global reach and impact",
                },
              ].map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center mb-12">
              <h2 className="text-xl font-medium text-gray-900 mb-4">
                Frequently asked questions
              </h2>
              <p className="text-gray-600">
                Everything you need to know about our plans and features
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-gray-200"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200 rounded-lg"
                  >
                    <span className="font-medium text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <p className="text-gray-600 pt-3">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 text-white">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <h2 className="text-xl font-medium mb-4">
              Ready to transform your testimonials?
            </h2>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of businesses using AI to turn customer feedback
              into revenue-driving marketing assets. Start your free trial
              today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors duration-200 inline-flex items-center justify-center">
                Start Your Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
              <button className="border border-gray-600 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors duration-200">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default PricingPage;
