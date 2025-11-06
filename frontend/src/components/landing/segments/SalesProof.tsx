import { motion } from "framer-motion";
import { Star, DollarSign, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const SalesProof = () => {
  const navigate = useNavigate();

  const testimonials = [
    {
      content:
        "I can find the perfect case study for any prospect in seconds. Our close rate jumped from 42% to 73% after we started showing prospects customers exactly like them. This tool pays for itself every single day.",
      author: "Michael Torres",
      role: "VP Sales",
      company: "CloudScale Inc",
      results: "+73% close rate",
      metric: "$3.8M added pipeline",
    },
    {
      content:
        "We used to lose deals because we couldn't prove ROI fast enough. Now I pull up real data showing revenue impact from similar customers. Deal velocity improved 28% and avg. contract value is up 34%.",
      author: "Jennifer Kim",
      role: "Enterprise Sales Director",
      company: "TechFlow Solutions",
      results: "28% faster deals",
      metric: "+34% contract value",
    },
    {
      content:
        "Game-changer for enterprise sales. When a prospect says 'we need more proof,' I instantly show them 3 case studies from their industry with measurable ROI. Objections disappear. Deals close faster.",
      author: "Robert Martinez",
      role: "Head of Revenue",
      company: "SaaS Ventures",
      results: "2.3x deal velocity",
      metric: "87% win rate on demos",
    },
  ];

  const metrics = [
    {
      icon: Target,
      value: "73%",
      label: "Average close rate increase",
      color: "text-green-600",
    },
    {
      icon: TrendingUp,
      value: "28%",
      label: "Faster deal velocity",
      color: "text-green-600",
    },
    {
      icon: DollarSign,
      value: "$3.2M",
      label: "Avg. pipeline impact per team",
      color: "text-green-600",
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
            Trusted by high-performing sales teams
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
                    className="h-4 w-4 text-green-600 fill-current"
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
                  <div className="flex-1 text-center px-3 py-2 bg-green-50 rounded-lg">
                    <div className="text-xs font-semibold text-green-700">
                      {testimonial.results}
                    </div>
                  </div>
                  <div className="flex-1 text-center px-3 py-2 bg-green-50 rounded-lg">
                    <div className="text-xs font-semibold text-green-700">
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
          <div className="bg-green-600 rounded-2xl p-12 text-white shadow-xl">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Start closing deals 73% faster with the right proof
            </h3>
            <p className="text-green-100 text-lg mb-8 max-w-2xl mx-auto">
              Join 300+ sales teams using testimonials to overcome objections and accelerate deal velocity. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => navigate("/signup")}
                className="bg-white text-green-600 hover:bg-gray-50 px-8 py-6 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Start Free Trial
                <span className="ml-2">→</span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-green-100">
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

export default SalesProof;
