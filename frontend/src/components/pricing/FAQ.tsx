import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";

const FAQ = () => {
  return (
    <motion.div
      className="relative z-10 max-w-4xl mx-auto px-4 mb-32"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="text-center mb-16">
        <h2 className="text-3xl font-bold inline-block bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-indigo-800/70 max-w-2xl mx-auto">
          Everything you need to know about Testament's plans and features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          {
            question: "How does AI enhance my testimonials?",
            answer:
              "Our AI analyzes sentiment, identifies key themes, optimizes content for maximum impact, and generates narrative frameworks that highlight your product's strengths based on real customer feedback.",
          },
          {
            question: "Can I try Testament before committing?",
            answer:
              "Yes! We offer a 14-day free trial on our Accelerate and Transform plans with full access to all features. No credit card required to start your trial.",
          },
          {
            question: "What happens if I exceed my monthly testimonial limit?",
            answer:
              "You'll receive a notification when you reach 80% of your limit. If you exceed it, you can either upgrade your plan or pay a small fee per additional testimonial.",
          },
          {
            question: "How difficult is it to implement on my website?",
            answer:
              "Implementation is seamless with our embed widgets. Just copy and paste a single line of code. We also provide WordPress plugins and CMS integrations for popular platforms.",
          },
          {
            question: "Can I migrate existing testimonials to Testament?",
            answer:
              "Absolutely! Our onboarding team can help import testimonials from other platforms or formats. We also offer a bulk import tool for self-service migration.",
          },
          {
            question: "What makes Testament different from competitors?",
            answer:
              "Testament is the only platform combining advanced AI analysis with comprehensive testimonial management. Our predictive tools and narrative generation capabilities are unmatched in the industry.",
          },
        ].map((faq, idx) => (
          <motion.div
            key={idx}
            className="rounded-xl overflow-hidden backdrop-blur-sm border border-blue-400/10 p-6 bg-gradient-to-b from-purple-400/5 to-indigo-400/10"
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <h3 className="text-lg font-semibold text-gray-600 mb-3 flex items-start gap-2">
              <ChevronRight className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              {faq.question}
            </h3>
            <p className="text-indigo-800/80 pl-7">{faq.answer}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        viewport={{ once: true }}
      >
        <p className="text-indigo-800/70 mb-4">Still have questions?</p>
        <a
          href="#contact"
          className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-black/10 hover:bg-black/20 text-black font-medium transition-colors"
        >
          Contact our support team <ArrowRight className="w-4 h-4" />
        </a>
      </motion.div>
    </motion.div>
  );
};

export default FAQ;
