import { motion } from "framer-motion";
import { Star } from "lucide-react";

const SimpleProof = () => {
  const testimonials = [
    {
      content:
        "Cenphi increased our testimonial collection rate by 300% and our conversion rate by 47%. The AI insights are game-changing.",
      author: "Sarah Chen",
      role: "VP Growth, TechFlow",
      company: "TechFlow",
      results: "+47% conversion rate",
    },
    {
      content:
        "We went from manually managing 20 testimonials to automatically processing 800+ per month. ROI was immediate.",
      author: "Marcus Rodriguez",
      role: "Marketing Director, GrowthLabs",
      company: "GrowthLabs",
      results: "40x more testimonials",
    },
    {
      content:
        "The automated content generation saves us 15 hours per week while creating better performing marketing materials.",
      author: "Emily Watson",
      role: "Founder, ScaleUp",
      company: "ScaleUp",
      results: "15 hours saved/week",
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Results */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Real results from real customers
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { metric: "156%", label: "Increase in testimonial collection" },
              { metric: "73%", label: "Improvement in conversion rates" },
              { metric: "$2.4M", label: "Revenue generated this year" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center bg-white p-6 rounded-xl border border-gray-200"
              >
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.metric}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3 w-3 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              <blockquote className="text-gray-900 text-sm mb-4 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-blue-600">
                      {testimonial.results}
                    </div>
                    <div className="text-xs text-gray-500">Result</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Single CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-12"
        >
          <div className="bg-blue-600 rounded-lg p-8 text-white">
            <h3 className="text-lg font-semibold mb-3">
              Get these results for your business
            </h3>
            <p className="text-blue-100 text-sm mb-6 max-w-xl mx-auto">
              Join companies using Cenphi to transform their customer
              testimonials into revenue engines.
            </p>
            <button
              className="bg-white text-blue-600 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors"
              onClick={() => (window.location.href = "/signup")}
            >
              Start free trial
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SimpleProof;
