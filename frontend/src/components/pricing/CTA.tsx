import { motion } from "framer-motion";

const CTA = () => {
  return (
    <motion.div
      className="relative z-10 max-w-5xl mx-auto px-4 mb-24"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="rounded-2xl overflow-hidden p-12 bg-gradient-to-r from-indigo-600/80 via-purple-600/80 to-pink-600/80 backdrop-blur-md border border-white/10 relative">
        {/* Background glow effect */}
        <div className="absolute -inset-40 bg-indigo-500/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Transform your testimonials into your most powerful marketing
              asset
            </h2>
          </motion.div>

          <motion.p
            className="text-xl text-indigo-100/90 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of businesses leveraging AI to turn customer feedback
            into growth
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 px-8 rounded-xl font-semibold shadow-lg bg-white text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Start Your Free Trial
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 px-8 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              Schedule a Demo
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default CTA;
