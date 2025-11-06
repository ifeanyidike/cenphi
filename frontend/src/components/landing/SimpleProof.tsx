import { motion } from "framer-motion";
import { Sparkles, Zap, TrendingUp } from "lucide-react";

const SimpleProof = () => {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Automation",
      description: "Transform testimonials into marketing assets in seconds with advanced AI",
    },
    {
      icon: Zap,
      title: "Multi-Platform Ready",
      description: "Create content optimized for Instagram, LinkedIn, TikTok, and more",
    },
    {
      icon: TrendingUp,
      title: "Data-Driven Insights",
      description: "Track performance and optimize your social proof strategy",
    },
  ];

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Built For Teams Like Yours */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 px-2">
            Built for modern marketing and sales teams
          </h2>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto mb-8 px-4">
            Join early adopters transforming how they leverage customer testimonials for growth
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center bg-white p-6 rounded-xl border border-gray-200"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-blue-50 rounded-lg">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Single CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8 sm:mt-12"
        >
          <div className="bg-blue-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
            <h3 className="text-base sm:text-lg font-bold mb-2">
              Ready to transform your testimonial strategy?
            </h3>
            <p className="text-blue-100 text-sm mb-6 max-w-xl mx-auto px-2">
              Get started with Cenphi today and see how AI-powered testimonial management can accelerate your growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                className="bg-white text-blue-600 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto"
                onClick={() => (window.location.href = "/signup")}
              >
                Start Your Free Trial
                <span className="inline-block ml-2">→</span>
              </button>
              <div className="flex items-center gap-2 text-xs text-blue-100">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                14 days free • No credit card required
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SimpleProof;
