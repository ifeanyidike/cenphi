import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ProductHero = () => {
  const navigate = useNavigate();

  const metrics = [
    { value: "47%", label: "conversion lift" },
    { value: "2.3x", label: "user activation" },
    { value: "89%", label: "retention boost" },
  ];

  const features = [
    {
      title: "Smart Placement",
      desc: "Data-driven testimonial positioning across your product journey. Show the right proof at the right moment.",
    },
    {
      title: "Real-Time Testing",
      desc: "A/B test testimonial variations automatically. Optimize for conversions without manual work.",
    },
    {
      title: "Conversion Analytics",
      desc: "Track which testimonials drive signups, upgrades, and retention. See ROI per customer story.",
    },
    {
      title: "Seamless Integration",
      desc: "Works with your existing stack. Embed testimonials anywhere—landing pages, onboarding, or in-app.",
    },
  ];

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero Section - Two Column Layout */}
        <div className="pt-32 pb-24 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block mb-6 px-3 py-1 border border-black rounded-full text-xs font-medium text-black">
              For Product Teams
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-black mb-6 leading-tight">
              Convert more users
              <br />
              with social proof
            </h1>

            <p className="text-lg text-black mb-8 leading-relaxed">
              Stop losing users to doubt. Place testimonials where they matter most. Increase conversions by 47% on average.
            </p>

            <div className="flex gap-4 mb-12">
              <Button
                onClick={() => navigate("/signup")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base rounded-none"
              >
                Start Optimizing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/studio")}
                className="border-2 border-black text-black hover:bg-white px-8 py-6 text-base rounded-none"
              >
                See Case Studies
              </Button>
            </div>
          </motion.div>

          {/* Metrics Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
          >
            {metrics.map((metric, index) => (
              <div key={index} className="border-l-4 border-blue-600 pl-6">
                <div className="text-5xl font-bold text-black mb-2">
                  {metric.value}
                </div>
                <div className="text-sm uppercase tracking-wide text-black">
                  {metric.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Features Grid - Full Width Cards */}
        <div className="py-20 border-t border-black">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">
              Optimize every touchpoint
            </h2>
            <p className="text-black">
              From homepage to upgrade flow, deliver social proof that converts
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="border-2 border-black p-8 hover:bg-blue-600 hover:text-white transition-all duration-300 group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">
                      {feature.title}
                    </h3>
                    <p className="leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                  <div className="text-5xl font-bold text-blue-600 group-hover:text-white">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default ProductHero;
