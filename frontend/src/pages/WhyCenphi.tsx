import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  TrendingUp,
  Video,
  ArrowRight,
  Check,
  Scissors,
  FileText,
  Layers,
  MessageSquare,
  Wand2,
  PlayCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/custom/footer";
import SEO from "@/components/SEO";
import { pageSEO } from "@/config/seo";

const WhyCenphi = () => {
  const navigate = useNavigate();

  // Value-driven outcomes
  const outcomes = [
    {
      icon: Zap,
      title: "10x Your Testimonial ROI",
      description:
        "Stop letting testimonials sit unused. Transform each one into dozens of high-performing marketing assets across every channel.",
      result: "10+ assets per testimonial",
      color: "blue",
    },
    {
      icon: TrendingUp,
      title: "Drive 47% More Conversions",
      description:
        "Our AI identifies the most impactful moments and creates content that resonates. Track exactly which testimonials drive revenue.",
      result: "47% avg. conversion lift",
      color: "emerald",
    },
    {
      icon: Video,
      title: "Scale Video Without Editing",
      description:
        "Get platform-perfect videos for Instagram, TikTok, LinkedIn, YouTube—no video editing skills required. Takes 8 minutes, not 8 hours.",
      result: "5+ platforms instantly",
      color: "purple",
    },
    {
      icon: FileText,
      title: "Create a Month of Content in Minutes",
      description:
        "Generate blogs, social posts, emails, ads, and case studies from one testimonial. What used to take your team days now takes 30 seconds.",
      result: "13+ content types",
      color: "amber",
    },
  ];

  // Result-focused transformation stories
  const transformations = [
    {
      icon: Video,
      title: "One Testimonial → 5 Platform-Perfect Videos",
      problem:
        "You have a great testimonial but need it reformatted for Instagram, TikTok, LinkedIn, YouTube, and Facebook.",
      solution:
        "Upload once. Get 5 perfectly optimized videos with auto-captions, logo overlays, and platform-specific enhancements. No editing required.",
      outcome: "Save 6 hours per testimonial. Reach 5x more audience.",
      stats: ["8 min process", "5+ platforms", "Auto captions"],
      screenshot: "/landing-files/optimization-config.webp",
      color: "blue",
    },
    {
      icon: Scissors,
      title: "Extract 10+ Shareable Moments Automatically",
      problem:
        "Long testimonials are great, but you need bite-sized clips for social media and different channels.",
      solution:
        "Our AI identifies emotional peaks, key quotes, and impactful moments. Automatically creates 10+ clips optimized for engagement.",
      outcome: "Turn 1 testimonial into weeks of social content.",
      stats: ["10+ clips", "2 min process", "Sentiment-based"],
      screenshot: "/landing-files/clipping-studio.webp",
      color: "purple",
    },
    {
      icon: FileText,
      title: "Generate a Month of Marketing Content in 30 Seconds",
      problem:
        "Your marketing team spends days turning testimonials into blogs, emails, and social posts.",
      solution:
        "Input one testimonial. Get 13+ professional content pieces: blog posts, LinkedIn posts, Twitter threads, email campaigns, ad copy, case studies, and more.",
      outcome: "5x faster content creation. Never run out of material.",
      stats: ["13+ formats", "30 sec", "Professional quality"],
      screenshot: "/landing-files/content-generation.webp",
      color: "amber",
    },
    {
      icon: PlayCircle,
      title: "Create Story Videos That Convert 3x Better",
      problem:
        "Single testimonials are good, but narrative stories from multiple customers are more compelling.",
      solution:
        "Select multiple testimonials. AI automatically sequences the best moments into a professional story video with music, transitions, and branding.",
      outcome: "3x higher engagement than single testimonials.",
      stats: ["Multi-source", "Auto edit", "Pro quality"],
      screenshot: "/landing-files/story-video-config.webp",
      color: "emerald",
    },
  ];

  // Competitive advantages - Why Cenphi vs others
  const whyUs = [
    {
      icon: Wand2,
      title: "Complete End-to-End Platform",
      them: "Others: Just collection or just distribution",
      us: "Cenphi: Collect → Transform → Distribute → Analyze. Everything in one place.",
      impact: "No tool switching. No exports. No manual work.",
      color: "blue",
    },
    {
      icon: Video,
      title: "Actually Built for Video",
      them: "Others: Text-first with basic video support",
      us: "Cenphi: Professional video processing, clipping, optimization, and story generation built-in.",
      impact: "Turn video testimonials into your #1 marketing asset.",
      color: "purple",
    },
    {
      icon: MessageSquare,
      title: "Ask Your Data Anything",
      them: "Others: Static dashboards and filters",
      us: 'Cenphi: Natural language AI queries. "Which testimonials mention ROI?" "Show positive healthcare reviews."',
      impact: "Find insights instantly without complex filtering.",
      color: "emerald",
    },
    {
      icon: TrendingUp,
      title: "Prove Revenue Impact",
      them: "Others: Basic view counts",
      us: "Cenphi: Full revenue attribution. See which testimonials drive conversions and how much revenue they generate.",
      impact: "Justify your testimonial investment with hard data.",
      color: "amber",
    },
    {
      icon: Calendar,
      title: "AI Scheduling That Actually Works",
      them: "Others: Manual scheduling",
      us: "Cenphi: AI analyzes your audience behavior and auto-publishes at optimal times across all platforms.",
      impact: "3x higher engagement without lifting a finger.",
      color: "rose",
    },
    {
      icon: Layers,
      title: "Built for Scale",
      them: "Others: Breaks with 100+ testimonials",
      us: "Cenphi: Process thousands. Handle team workflows. Enterprise-grade performance.",
      impact: "Grow without platform limitations.",
      color: "indigo",
    },
  ];

  const metrics = [
    { value: "5x", label: "Faster Content", icon: Sparkles, color: "blue" },
    { value: "10+", label: "Clips Per Video", icon: Scissors, color: "purple" },
    {
      value: "+47%",
      label: "Conversion Lift",
      icon: TrendingUp,
      color: "emerald",
    },
    { value: "13+", label: "Content Formats", icon: FileText, color: "amber" },
  ];

  const colorConfig: Record<
    string,
    { bg: string; icon: string; border: string; text: string }
  > = {
    blue: {
      bg: "bg-blue-50",
      icon: "text-blue-600",
      border: "border-blue-200",
      text: "text-blue-700",
    },
    purple: {
      bg: "bg-purple-50",
      icon: "text-purple-600",
      border: "border-purple-200",
      text: "text-purple-700",
    },
    emerald: {
      bg: "bg-emerald-50",
      icon: "text-emerald-600",
      border: "border-emerald-200",
      text: "text-emerald-700",
    },
    amber: {
      bg: "bg-amber-50",
      icon: "text-amber-600",
      border: "border-amber-200",
      text: "text-amber-700",
    },
    indigo: {
      bg: "bg-indigo-50",
      icon: "text-indigo-600",
      border: "border-indigo-200",
      text: "text-indigo-700",
    },
    rose: {
      bg: "bg-rose-50",
      icon: "text-rose-600",
      border: "border-rose-200",
      text: "text-rose-700",
    },
    orange: {
      bg: "bg-orange-50",
      icon: "text-orange-600",
      border: "border-orange-200",
      text: "text-orange-700",
    },
  };

  return (
    <>
      <SEO
        title={pageSEO.whyCenphi.title}
        description={pageSEO.whyCenphi.description}
        keywords={pageSEO.whyCenphi.keywords}
        url={pageSEO.whyCenphi.url}
        structuredData={pageSEO.whyCenphi.structuredData}
      />
      <div className="min-h-screen bg-white">
        <Navbar />

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 relative overflow-hidden">
          {/* Subtle gradient orb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-blue-100/40 via-purple-100/20 to-transparent rounded-full blur-3xl -z-10"></div>

          <div className="max-w-5xl mx-auto relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
                Turn every testimonial into <br />
                dozens of revenue-driving assets
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Stop letting testimonials sit unused. Our AI transforms each one
                into platform-perfect videos, marketing content, and shareable
                moments—automatically.
              </p>
            </motion.div>

            {/* Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
            >
              {metrics.map((metric, index) => {
                const colors = colorConfig[metric.color];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className={`text-center p-6 border ${colors.border} rounded-xl ${colors.bg} transition-all duration-200`}
                  >
                    <div className="flex justify-center mb-3">
                      <metric.icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>
                    <div className="text-2xl font-semibold text-gray-900 mb-1">
                      {metric.value}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {metric.label}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Value Outcomes Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Stop wasting your testimonials
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Most companies use less than 10% of their testimonials'
                potential. Here's what changes with Cenphi
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {outcomes.map((outcome, index) => {
                const colors = colorConfig[outcome.color];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{
                      y: -4,
                      boxShadow:
                        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    }}
                    className="group bg-white border border-gray-200 rounded-xl p-8 hover:border-gray-300 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <outcome.icon className={`h-7 w-7 ${colors.icon}`} />
                      </div>
                      <span
                        className={`text-xs font-bold ${colors.text} ${colors.bg} px-3 py-1.5 rounded-full`}
                      >
                        {outcome.result}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {outcome.title}
                    </h3>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {outcome.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Transformation Stories Section */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                How we transform your testimonials
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Real problems solved. Real time saved. Real revenue driven.
              </p>
            </div>

            <div className="space-y-20">
              {transformations.map((transform, index) => {
                const colors = colorConfig[transform.color];
                const isEven = index % 2 === 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className={`grid md:grid-cols-2 gap-8 lg:gap-16 items-center`}
                  >
                    {/* Content */}
                    <div className={isEven ? "" : "md:order-2"}>
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 ${colors.bg} border ${colors.border} rounded-full mb-4`}
                      >
                        <transform.icon className={`h-4 w-4 ${colors.icon}`} />
                        <span
                          className={`text-xs font-semibold ${colors.text} uppercase tracking-wide`}
                        >
                          Transformation {index + 1}
                        </span>
                      </div>

                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                        {transform.title}
                      </h3>

                      <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-red-600 text-sm font-bold">
                              ✗
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              The Problem
                            </p>
                            <p className="text-sm text-gray-600">
                              {transform.problem}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div
                            className={`w-6 h-6 rounded-full ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}
                          >
                            <Check className={`h-4 w-4 ${colors.icon}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              The Solution
                            </p>
                            <p className="text-sm text-gray-600">
                              {transform.solution}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`${colors.bg} border ${colors.border} rounded-lg p-4`}
                        >
                          <p className="text-sm font-semibold text-gray-900 mb-1">
                            The Outcome
                          </p>
                          <p className={`text-sm ${colors.text} font-medium`}>
                            {transform.outcome}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {transform.stats.map((stat, i) => (
                          <span
                            key={i}
                            className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
                          >
                            {stat}
                          </span>
                        ))}
                      </div>

                      <Button
                        onClick={() => navigate("/studio")}
                        className={`${colors.bg} ${colors.text} hover:opacity-90 border-0`}
                      >
                        Try This Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>

                    {/* Screenshot */}
                    <motion.div
                      className={isEven ? "" : "md:order-1"}
                      whileHover={{ scale: 1.02, y: -4 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div
                        className={`relative rounded-xl overflow-hidden border-2 ${colors.border} shadow-2xl bg-white`}
                      >
                        <img
                          src={transform.screenshot}
                          alt={transform.title}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Why Choose Cenphi - Competitive Differentiation */}
        <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Why companies choose Cenphi
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We're not just better—we're built completely differently
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {whyUs.map((reason, index) => {
                const colors = colorConfig[reason.color];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.5 }}
                    whileHover={{
                      y: -4,
                      boxShadow:
                        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    }}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all duration-300"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`w-11 h-11 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <reason.icon className={`h-5 w-5 ${colors.icon}`} />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight pt-1">
                        {reason.title}
                      </h3>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400 text-xs font-bold mt-0.5">
                          ⊘
                        </span>
                        <p className="text-xs text-gray-500">{reason.them}</p>
                      </div>

                      <div className="flex items-start gap-2">
                        <Check
                          className={`h-4 w-4 ${colors.icon} mt-0.5 flex-shrink-0`}
                        />
                        <p className="text-sm text-gray-900 font-medium">
                          {reason.us}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`${colors.bg} border ${colors.border} rounded-lg p-3`}
                    >
                      <p className={`text-sm ${colors.text} font-semibold`}>
                        {reason.impact}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Visual Showcase with Analytics */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Real-time insights and analytics
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Track performance, revenue impact, and engagement across all
                channels
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative rounded-xl overflow-hidden border-2 border-emerald-200 shadow-xl bg-white"
              >
                <img
                  src="/landing-files/sentiment-dashboard.webp"
                  alt="Sentiment analysis dashboard"
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent p-6">
                  <h3 className="text-white font-semibold mb-1">
                    Sentiment Analysis
                  </h3>
                  <p className="text-gray-200 text-sm">
                    Track emotional trends over time
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="relative rounded-xl overflow-hidden border-2 border-purple-200 shadow-xl bg-white"
              >
                <img
                  src="/landing-files/data-intelligence.webp"
                  alt="AI data intelligence"
                  className="w-full h-auto"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent p-6">
                  <h3 className="text-white font-semibold mb-1">
                    Talk to Your Data
                  </h3>
                  <p className="text-gray-200 text-sm">
                    Ask questions in natural language
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.01, y: -4 }}
              className="relative rounded-xl overflow-hidden border-2 border-amber-200 shadow-xl bg-white"
            >
              <img
                src="/landing-files/scheduling-posting.webp"
                alt="Social media scheduling and posting"
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/80 to-transparent p-6">
                <h3 className="text-white font-semibold mb-1">
                  Smart Scheduling
                </h3>
                <p className="text-gray-200 text-sm">
                  Auto-publish with optimal timing across all platforms
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden border border-gray-200 rounded-2xl p-12 text-center bg-gradient-to-br from-blue-50 via-purple-50/30 to-white"
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 -z-10"></div>

              <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                Stop wasting 90% of your testimonials
              </h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                See how Cenphi turns each testimonial into 10+ marketing assets,
                drives 47% more conversions, and saves your team hours of
                work—automatically.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/studio")}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-2.5 font-medium rounded-lg transition-all"
                >
                  Explore AI Studio
                </Button>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                Free 14-day trial · No credit card required · Setup in 5 minutes
              </p>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default WhyCenphi;
