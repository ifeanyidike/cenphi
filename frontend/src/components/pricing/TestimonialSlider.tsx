import { motion } from "framer-motion";
import { Star } from "lucide-react";
const TestimonialSlider = () => {
  return (
    <motion.div
      className="relative z-10 max-w-6xl mx-auto px-4 mb-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 via-purple-800 to-blue-800 mb-4">
          Why customers choose Testament
        </h2>
        <p className="text-indigo-800 max-w-2xl mx-auto">
          Join thousands of businesses transforming their customer feedback into
          powerful growth engines
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            quote:
              "Testament has revolutionized how we collect and leverage customer stories. The AI-powered insights are a game-changer for our marketing team.",
            author: "Sarah Johnson",
            role: "CMO at TechVision",
            color: "from-blue-500/20 to-blue-600/20",
          },
          {
            quote:
              "The sentiment analysis and predictive tools helped us increase conversion rates by 34% in just two months. Best investment we've made this year.",
            author: "Michael Chen",
            role: "Growth Lead at Elevate SaaS",
            color: "from-purple-500/20 to-purple-600/20",
          },
          {
            quote:
              "Testament's automated narrative generation saves our team hours each week while producing better results than we could manually.",
            author: "Emma Rodriguez",
            role: "Customer Success Director at FlowCRM",
            color: "from-amber-500/20 to-amber-600/20",
          },
        ].map((testimonial, idx) => (
          <motion.div
            key={idx}
            className="rounded-2xl overflow-hidden backdrop-blur-sm border border-white/10 p-6 bg-gradient-to-b from-white/5 to-white/10 relative"
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div
              className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r opacity-20 blur-md -z-10"
              style={{
                background: `linear-gradient(45deg, ${testimonial.color})`,
              }}
            ></div>
            <div className="mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="inline-block w-5 h-5 text-amber-400 fill-amber-400"
                />
              ))}
            </div>
            <p className="text-indigo-800 mb-6 italic leading-relaxed">
              {testimonial.quote}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                {testimonial.author.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  {testimonial.author}
                </p>
                <p className="text-sm text-indigo-800/70">{testimonial.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TestimonialSlider;
