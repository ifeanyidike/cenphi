import { motion, MotionValue, useTransform } from "framer-motion";
import { useRef } from "react";
import { glowVariants } from "./data";
import { Check, X } from "lucide-react";

type Props = {
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  annual: boolean;
  setAnnual: (e: boolean) => void;
};
const Header = ({ smoothMouseX, smoothMouseY, annual, setAnnual }: Props) => {
  const headerRef = useRef(null);
  return (
    <header ref={headerRef} className="py-20 text-center relative">
      <motion.div
        className="absolute top-0 left-0 right-0 h-full flex items-center justify-center pointer-events-none z-0"
        style={{
          x: useTransform(smoothMouseX, [0, window.innerWidth], [50, -50]),
          y: useTransform(smoothMouseY, [0, window.innerHeight], [30, -30]),
        }}
      >
        <div className="w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-3xl opacity-30"></div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <h1 className="text-6xl font-extrabold tracking-tight mb-4 relative group-hover:text-indigo-200 transition-colors">
          <span className="inline-block bg-clip-text text-gray-800">
            Elevate Your Testimonials
          </span>
          <span className="absolute -top-16 -left-12 text-8xl text-purple-500/10 font-black tracking-tighter leading-none">
            CENPHI
          </span>
        </h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p className="text-xl text-indigo-800 max-w-2xl mx-auto mb-12 leading-relaxed">
            Select the perfect plan to transform ordinary feedback into
            powerful, AI-enhanced testimonials that drive growth
          </p>

          {/* Period toggle */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <span
              className={`text-sm ${
                !annual ? "text-black font-semibold" : "text-indigo-800"
              }`}
            >
              Monthly
            </span>
            <div className="relative">
              <motion.div
                className="absolute -inset-4 rounded-full opacity-30 blur-md"
                style={{
                  background:
                    "linear-gradient(45deg, rgba(79, 70, 229, 0.4) 0%, rgba(236, 72, 153, 0.4) 100%)",
                }}
                variants={glowVariants}
                initial="initial"
                animate="animate"
              />
              <button
                onClick={() => setAnnual(!annual)}
                className="relative h-8 w-16 rounded-full overflow-hidden p-1 backdrop-blur-sm bg-gradient-to-r from-indigo-500/80 to-purple-500/80 border border-white/20"
              >
                <span className="sr-only">Toggle billing period</span>
                <motion.span
                  layout
                  className="absolute inset-1 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center"
                  animate={{ x: annual ? 26 : 2 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                >
                  {annual ? (
                    <Check className="h-3 w-3 text-indigo-600" />
                  ) : (
                    <X className="h-3 w-3 text-indigo-600" />
                  )}
                </motion.span>
              </button>
            </div>
            <div
              className={`text-sm ${
                annual ? "text-black font-semibold" : "text-indigo-800"
              } flex items-center gap-2`}
            >
              <span>Annual</span>
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: annual ? 1 : 0, x: annual ? 0 : -10 }}
                className="text-xs py-1 px-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 font-semibold text-white shadow-lg"
              >
                Save 20%
              </motion.span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </header>
  );
};

export default Header;
