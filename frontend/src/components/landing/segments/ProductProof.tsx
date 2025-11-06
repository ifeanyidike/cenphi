import { motion } from "framer-motion";
import { Star, Percent, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const ProductProof = () => {
  const navigate = useNavigate();

  const testimonials = [
    {
      content:
        "We added testimonials to our pricing page and signup flow. Conversion rate jumped from 2.8% to 4.1% overnight. The analytics showed us exactly which testimonials drove the most signups. Absolute game-changer.",
      author: "Alex Rivera",
      role: "Head of Growth",
      company: "CloudSync",
      results: "+47% conversion",
      metric: "4.1% signup rate",
    },
    {
      content:
        "Our trial-to-paid conversion was stuck at 18%. We started showing success stories during onboarding and it jumped to 41%. The impact on MRR was immediate and measurable.",
      author: "Priya Patel",
      role: "VP Product",
      company: "DataFlow",
      results: "2.3x activation",
      metric: "41% trial-to-paid",
    },
    {
      content:
        "Finally, a way to prove which testimonials actually matter. We optimized placement based on conversion data and saw a 67% increase in paid signups. ROI was immediate.",
      author: "Tom Anderson",
      role: "Co-founder & CPO",
      company: "BuildKit",
      results: "+67% paid signups",
      metric: "Positive ROI Week 1",
    },
  ];

  const metrics = [
    {
      icon: Percent,
      value: "47%",
      label: "Average conversion rate increase",
      color: "text-purple-600",
    },
    {
      icon: Users,
      value: "2.3x",
      label: "Trial-to-paid conversion",
      color: "text-purple-600",
    },
    {
      icon: TrendingUp,
      value: "89%",
      label: "Trust & credibility increase",
      color: "text-purple-600",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Metrics */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12"
            >
            Trusted by product teams driving growth
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-12">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <metric.icon className={`h-8 w-8 ${metric.color} mx-auto mb-4`} />
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-600">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-purple-600 fill-current"
                  />
                ))}
              </div>

              <blockquote className="text-gray-700 text-sm mb-4 leading-relaxed">
                "{testimonial.content}"
              </blockquote>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-gray-600">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-gray-500">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 text-center px-3 py-2 bg-purple-50 rounded-lg">
                    <div className="text-xs font-semibold text-purple-700">
                      {testimonial.results}
                    </div>
                  </div>
                  <div className="flex-1 text-center px-3 py-2 bg-purple-50 rounded-lg">
                    <div className="text-xs font-semibold text-purple-700">
                      {testimonial.metric}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-purple-600 rounded-2xl p-12 text-white shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Start converting 47% more users with social proof
            </h3>
            <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
              Join product teams using data-driven testimonial placement to accelerate growth. Setup takes 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/signup")}
                className="bg-white text-purple-600 hover:bg-gray-50 px-8 py-6 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Free Trial
                <span className="ml-2">→</span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-purple-100">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                14-day trial • No credit card • Cancel anytime
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductProof;
