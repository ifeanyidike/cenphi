import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const SalesHero = () => {
  const navigate = useNavigate();

  const metrics = [
    { value: "73%", label: "Higher close rates" },
    { value: "28%", label: "Faster deal velocity" },
    { value: "$3.2M", label: "Avg. pipeline impact" },
  ];

  const capabilities = [
    "Find perfect case studies in <5 seconds",
    "Prove ROI with real customer data",
    "Overcome objections instantly",
    "Close enterprise deals 28% faster",
  ];

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Hero Section */}
        <div className="pt-32 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl"
          >
            <div className="inline-block mb-6 px-3 py-1 border border-black rounded-full text-xs font-medium text-black">
              For Sales Teams
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black mb-8 leading-tight">
              Close deals with
              <br />
              the right proof point
            </h1>

            <p className="text-xl text-black mb-12 max-w-3xl leading-relaxed">
              Stop losing deals to "we need to think about it." Find case studies from customers like them. Prove ROI instantly.
            </p>

            <div className="flex gap-4 mb-16">
              <Button
                onClick={() => navigate("/signup")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-base rounded-none"
              >
                Start Closing Faster
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

            {/* Metrics in horizontal layout */}
            <div className="grid md:grid-cols-3 gap-8 pt-8 border-t border-black">
              {metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="text-4xl font-bold text-blue-600">
                    {metric.value}
                  </div>
                  <div className="text-sm text-black">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Capabilities Section */}
        <div className="py-20 border-t border-black">
          <div className="max-w-5xl">
            <h2 className="text-3xl font-bold text-black mb-12">
              Built for high-velocity sales
            </h2>

            <div className="space-y-4">
              {capabilities.map((capability, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-4 p-6 border-l-4 border-blue-600"
                >
                  <div className="text-2xl font-bold text-blue-600">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="text-lg text-black font-medium">
                    {capability}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SalesHero;
