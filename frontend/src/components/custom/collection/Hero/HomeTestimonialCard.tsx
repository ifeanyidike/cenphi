import React, { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Testimonial } from "./types";
import { Brain, Quote, RefreshCw, Share, Star, Zap } from "lucide-react";

const HomeTestimonialCard = ({
  testimonial,
}: {
  testimonial: Testimonial;
  inView: boolean;
}) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [windowWidth, setWindowWidth] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), {
    stiffness: 150,
    damping: 10,
    mass: 0.5,
  });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), {
    stiffness: 150,
    damping: 10,
    mass: 0.5,
  });
  // const [isInView, setIsInView] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (windowWidth > 768) {
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate position relative to card center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate distance from center as percentage
        const deltaX = (e.clientX - centerX) / (rect.width / 2);
        const deltaY = (e.clientY - centerY) / (rect.height / 2);

        // Apply non-linear transformation to create more stable edges
        const boundX = Math.sign(deltaX) * Math.min(Math.abs(deltaX), 1) * 200;
        const boundY = Math.sign(deltaY) * Math.min(Math.abs(deltaY), 1) * 200;

        mouseX.set(boundX);
        mouseY.set(boundY);
      }
      setIsHovered(true);
    }
  };

  const handleCardMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };
  return (
    <motion.div
      key={testimonial.id}
      initial={{ opacity: 0, x: 100 }}
      animate={{
        opacity: 1,
        // opacity: inView ? 1 : 0,
        x: 0,
        // y: inView ? 0 : 50,
      }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        perspective: 2000,
        transformStyle: "preserve-3d",
        transform: "translateZ(0)",
      }}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave}
      className="relative"
    >
      <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 xl:p-16 shadow-[0_0_100px_rgba(59,130,246,0.15)] border border-white/10">
        {/* AI-enhanced badge */}
        <div className="absolute -top-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full px-6 py-2 text-sm font-medium text-white flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI-Enhanced Content
        </div>

        <motion.div
          className="grid md:grid-cols-[1fr_auto] gap-12"
          style={{
            rotateX: isHovered ? rotateX : 0,
            rotateY: isHovered ? rotateY : 0,
            transformStyle: "preserve-3d",
          }}
        >
          <div>
            {/* Keywords */}
            <div className="flex flex-wrap gap-3 mb-8">
              {testimonial.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>

            {/* Quote */}
            <Quote className="w-16 h-16 text-blue-500/80 mb-8" />
            <p className="text-xl md:text-2xl text-white font-light leading-relaxed mb-12">
              {testimonial.text}
            </p>

            {/* Author info with verification */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-16 h-16 rounded-full ring-2 ring-white/10"
                />
                {testimonial.verification.verified && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl text-white font-semibold mb-1">
                  {testimonial.author}
                </h3>
                <p className="text-slate-400">
                  {testimonial.role} at {testimonial.company}
                </p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <span>Verified on {testimonial.verification.platform}</span>•
                  <span>{testimonial.verification.date}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics display */}
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <MetricCard
              label="Conversion Lift"
              value={testimonial.metrics.conversionLift}
              icon={Zap}
            />
            <MetricCard
              label="Engagement"
              value={testimonial.metrics.testimonialEngagement}
              icon={Share}
            />
            <MetricCard
              label="Brand Trust"
              value={testimonial.metrics.brandTrust}
              icon={Star}
            />
            <MetricCard
              label="ROI"
              value={testimonial.metrics.roi}
              icon={RefreshCw}
            />
            <MetricCard
              label="Customer Satisfaction"
              value={testimonial.metrics.customerSatisfaction}
              icon={Star}
            />
            <MetricCard
              label="Referral Rate"
              value={testimonial.metrics.referralRate}
              icon={RefreshCw}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default HomeTestimonialCard;

const MetricCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string | null;
  value: string;
  icon: React.FC<any>;
}) => {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-3  md:p-6 backdrop-blur-xl border border-white/10"
      onMouseEnter={() => setHoveredMetric(label)}
      onMouseLeave={() => setHoveredMetric(null)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <Icon className="w-6 h-6 text-blue-400 mb-3" />
      <div className="text-3xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-sm text-slate-400 mt-2 uppercase tracking-wider">
        {label}
      </div>
      {hoveredMetric === label && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-sm rounded-lg px-4 py-2 whitespace-nowrap"
        >
          Industry Average: +82%
        </motion.div>
      )}
    </motion.div>
  );
};
