import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const MarketingHero = () => {
  const navigate = useNavigate();

  const stats = [
    { value: "15 hrs", label: "saved per week" },
    { value: "13+", label: "assets per testimonial" },
    { value: "3x", label: "engagement increase" },
  ];

  const features = [
    {
      title: "Content Multiplication",
      desc: "Turn one testimonial into 13+ marketing pieces—blogs, social posts, emails, ads, case studies, and PDFs. Export as professional documents or share online.",
    },
    {
      title: "Professional Video Editing",
      desc: "Automatic B-roll insertion, text overlays, background music, noise removal, intro/outro, and enhancement. Studio-quality videos without editors.",
    },
    {
      title: "Multi-Platform Distribution",
      desc: "One-click publishing to Instagram, LinkedIn, Twitter, Facebook, and TikTok. Automated timing for maximum reach.",
    },
    {
      title: "Performance Analytics",
      desc: "See which content performs best. Track engagement, conversions, and ROI per testimonial. Data-driven optimization.",
    },
  ];

  return (
    <section className="pt-32 pb-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-6 px-3 py-1 border border-black rounded-full text-xs font-medium text-black">
            For Marketing Teams
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-black mb-8 leading-none">
            Turn one testimonial
            <br />
            into a month of content
          </h1>

          <p className="text-xl text-black mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop wasting 15 hours a week on content repurposing. Automatically generate everything you need—in 30 seconds.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-12 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-black">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => navigate("/signup")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base rounded-none"
            >
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/studio")}
              className="border-2 border-black text-black hover:bg-white px-8 py-6 text-base rounded-none"
            >
              View Demo
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-px bg-black border border-black">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white p-12"
            >
              <h3 className="text-xl font-bold text-black mb-4">
                {feature.title}
              </h3>
              <p className="text-black leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Proof Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-24 border-t border-black pt-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-4">
              Used by 500+ marketing teams
            </h2>
            <p className="text-black">
              Processing 50,000+ testimonials monthly
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "We went from spending 2 days per week on content to 30 minutes. Quality is better, volume is 10x higher.",
                author: "Jessica Martinez",
                role: "Content Director, Velocity Marketing",
              },
              {
                quote: "Social engagement tripled. Every testimonial becomes weeks of perfectly optimized content.",
                author: "David Chen",
                role: "Social Media Manager, BrandBoost",
              },
              {
                quote: "Content calendar is 2 months ahead. From testimonial to blog to social—all in minutes.",
                author: "Sarah Thompson",
                role: "Marketing Lead, Growth Labs",
              },
            ].map((testimonial, index) => (
              <div key={index} className="border border-black p-6">
                <p className="text-black mb-6 leading-relaxed text-sm">
                  "{testimonial.quote}"
                </p>
                <div className="text-xs">
                  <div className="font-semibold text-black">
                    {testimonial.author}
                  </div>
                  <div className="text-black">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketingHero;
