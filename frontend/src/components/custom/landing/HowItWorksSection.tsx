import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
} from "framer-motion";
import {
  FileText,
  VideoIcon,
  BarChart2,
  Share2,
  Quote,
  ArrowRight,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type TestimonialType = {
  id: string;
  content: string;
  author: string;
  position: string;
  company: string;
  rating: number;
  image?: string;
};

type StepType = {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
};

// Subtle animations that feel premium
const fadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const slideIn = (direction: "left" | "right" = "right") => ({
  initial: { x: direction === "left" ? -20 : 20, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
});

const NumberIndicator: React.FC<{
  number: number;
  isActive: boolean;
  color: string;
}> = ({ number, isActive, color }) => {
  return (
    <div className="relative">
      <motion.div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          "shadow-sm transition-all duration-700 font-medium text-lg"
        )}
        style={{
          backgroundColor: isActive ? color : "white",
          color: isActive ? "white" : color,
          boxShadow: isActive ? `0 0 20px ${color}40` : "none",
        }}
        animate={{ scale: isActive ? 1 : 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        {number}
      </motion.div>
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0, scale: 1.3 }}
          animate={{ opacity: [0, 0.5, 0], scale: 1.5 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
};

const StepCard: React.FC<{
  step: StepType;
  index: number;
  activeStep: number;
  setActiveStep: (index: number) => void;
  isLast: boolean;
}> = ({ step, index, activeStep, setActiveStep, isLast }) => {
  const isActive = activeStep === index;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      className="relative"
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      variants={fadeInUp}
      custom={index}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      {!isLast && (
        <div className="absolute top-24 left-1/2 w-full h-0.5 hidden lg:block">
          <div className="relative w-full h-full">
            <motion.div
              className="absolute top-0 left-0 h-full w-full bg-gray-100"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: isActive ? 1 : 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{ transformOrigin: "left" }}
            />

            {/* Animated dot */}
            {isActive && (
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#C14953]"
                initial={{ left: "0%" }}
                animate={{ left: "100%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            )}
          </div>
        </div>
      )}

      <motion.div
        className={cn(
          "bg-white rounded-2xl overflow-hidden group transition-all duration-500",
          "hover:shadow-xl cursor-pointer border border-transparent hover:border-gray-100",
          isActive ? "shadow-lg" : "shadow-md"
        )}
        onClick={() => setActiveStep(index)}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: index * 0.2 }}
      >
        <div
          className="h-2 w-full"
          style={{ backgroundColor: step.accentColor }}
        />

        <div className="p-8">
          <div className="flex items-center space-x-4 mb-6">
            <NumberIndicator
              number={step.number}
              isActive={isActive}
              color={step.accentColor}
            />

            <motion.div
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${step.accentColor}10` }}
              animate={{ rotate: isActive ? [0, -5, 5, 0] : 0 }}
              transition={{
                duration: 1,
                ease: "easeInOut",
                repeat: isActive ? Infinity : 0,
                repeatDelay: 2,
              }}
            >
              {step.icon}
            </motion.div>
          </div>

          <h3
            className="text-xl font-bold mb-3"
            style={{ color: isActive ? step.accentColor : "#2D2D2A" }}
          >
            {step.title}
          </h3>

          <p className="text-gray-600 leading-relaxed text-sm md:text-base">
            {step.description}
          </p>

          <motion.div
            className="mt-5 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: isActive ? "auto" : 0,
              opacity: isActive ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="flex items-center gap-1 font-medium"
              style={{ color: step.accentColor }}
            >
              Learn more <ArrowRight className="w-4 h-4" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const TestimonialCard: React.FC<{
  testimonial: TestimonialType;
  isActive: boolean;
  index: number;
}> = ({ testimonial, isActive }) => {
  return (
    <motion.div
      className="absolute inset-0 rounded-2xl overflow-hidden"
      // initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : 50 }}
      // exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="h-full w-full bg-gradient-to-br from-[#141414] to-[#2D2D2A] p-8 rounded-2xl">
        <div className="flex flex-col h-full justify-between">
          <div>
            <motion.div
              className="mb-6 flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      i < testimonial.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-400"
                    )}
                  />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Quote className="w-12 h-12 text-[#C14953]/20  transform -scale-x-100" />
              <motion.p
                className="text-xl md:text-2xl font-light leading-relaxed text-white/90 relative z-10 pl-6 mt-8"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {testimonial.content}
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {testimonial.image && (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#C14953]">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <p className="font-medium text-white">{testimonial.author}</p>
              <p className="text-sm text-white/60">
                {testimonial.position}, {testimonial.company}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const FloatingElement: React.FC<{ delay: number }> = ({ delay }) => {
  return (
    <motion.div
      className="absolute w-6 h-6 rounded-full bg-[#C14953]/10"
      initial={{ scale: 0 }}
      animate={{
        scale: [0, 1, 0],
        y: [0, -30, 0],
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatDelay: 2,
        delay,
        ease: "easeInOut",
      }}
    />
  );
};

const TestimonialSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.2 });

  // For the floating animated background elements
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  // Auto-advance steps and testimonials
  useEffect(() => {
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);

    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);

    return () => {
      clearInterval(testimonialInterval);
      clearInterval(stepInterval);
    };
  }, []);

  // Color scheme chosen to create a sleek, premium aesthetic
  const steps: StepType[] = [
    {
      number: 1,
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      title: "Import",
      description:
        "Import your existing testimonials from multiple platforms or upload a CSV file. Our system makes organization and filtering simple.",
      accentColor: "#3b82f6",
    },
    {
      number: 2,
      icon: <VideoIcon className="w-6 h-6 text-purple-500" />,
      title: "Collect",
      description:
        "Create custom forms to gather new testimonials. Supports both video and text submissions with automatic transcription.",
      accentColor: "#a855f7",
    },
    {
      number: 3,
      icon: <BarChart2 className="w-6 h-6 text-indigo-600" />,
      title: "Manage & Analyze",
      description:
        "Sort testimonials, analyze sentiment, and enhance them with AI to gain an edge, uncover trends, and showcase top feedback. ",
      accentColor: "#4f46e5",
    },
    {
      number: 4,
      icon: <Share2 className="w-6 h-6 text-slate-700" />,
      title: "Share",
      description:
        "Display testimonials across your digital presence with customizable widgets and integrated sharing tools.",
      accentColor: "#334155",
    },
  ];

  const testimonials: TestimonialType[] = [
    {
      id: "1",
      content:
        "Getting started was incredibly simple - the interface is clean and intuitive. Exactly what we needed for managing our testimonials.",
      author: "Sarah Thompson",
      position: "Marketing Director",
      company: "TechFlow Inc.",
      rating: 5,
      image: "https://randomuser.me/api/portraits/women/22.jpg",
    },
    {
      id: "2",
      content:
        "The analytics capabilities are phenomenal. Being able to track which testimonials convert best has transformed our marketing strategy.",
      author: "James Wilson",
      position: "Growth Lead",
      company: "Spark Digital",
      rating: 5,
      image: "https://randomuser.me/api/portraits/women/40.jpg",
    },
    {
      id: "3",
      content:
        "The video testimonial feature alone has boosted our conversion rates by 37%. Worth every penny!",
      author: "Elena Rodriguez",
      position: "CEO",
      company: "Bright Solutions",
      rating: 5,
      image: "https://randomuser.me/api/portraits/women/44.jpg",
    },
  ];

  return (
    <div ref={sectionRef} className="relative py-24 overflow-hidden bg-gray-50">
      {/* Premium animated background */}
      <div className="absolute inset-0 bg-[#FAFAFA] opacity-90" />

      {/* Background gradient elements */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-blue-400/10 to-transparent -top-40 -right-40 opacity-60 blur-3xl"
        style={{ y: useTransform(smoothProgress, [0, 1], [-50, 50]) }}
      />

      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-500/5 to-transparent -bottom-40 -left-20 opacity-70 blur-3xl"
        style={{ y: useTransform(smoothProgress, [0, 1], [50, -50]) }}
      />

      {/* Animated floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            <FloatingElement delay={i * 0.5} />
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="mx-auto text-center max-w-3xl mb-16"
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          variants={{
            initial: { opacity: 0 },
            animate: { opacity: 1 },
          }}
        >
          <motion.div
            className="inline-block px-4 py-2 bg-purple-500/10 rounded-full mb-6"
            variants={fadeInUp}
          >
            <span className="text-slate-700 font-medium">How it works</span>
          </motion.div>

          <motion.h2
            className="text-5xl font-bold text-[#1A1A1A] leading-tight mb-6"
            variants={fadeInUp}
          >
            Start collecting & sharing testimonials
          </motion.h2>

          <motion.p className="text-xl text-gray-600" variants={fadeInUp}>
            Elevate your brand's credibility with a powerful testimonial
            management system
          </motion.p>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="flex flex-col-reverse lg:flex-row items-center lg:items-stretch gap-16 mb-20">
          <motion.div
            className="lg:w-5/12 w-full"
            variants={slideIn("left")}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
          >
            <div className="relative h-[550px] md:h-full">
              <AnimatePresence mode="wait">
                {testimonials.map(
                  (testimonial, index) =>
                    activeTestimonial === index && (
                      <TestimonialCard
                        key={testimonial.id}
                        testimonial={testimonial}
                        isActive={activeTestimonial === index}
                        index={index}
                      />
                    )
                )}
              </AnimatePresence>
            </div>

            <div className="flex space-x-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className="focus:outline-none"
                  aria-label={`View testimonial ${i + 1}`}
                >
                  <motion.div
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i === activeTestimonial
                        ? "w-12 bg-violet-600"
                        : "w-6 bg-gray-200"
                    }`}
                    whileHover={{ scale: 1.1 }}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="lg:w-7/12 w-full"
            variants={slideIn("right")}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {steps.map((step, i) => (
                <StepCard
                  key={step.number}
                  step={step}
                  index={i}
                  activeStep={activeStep}
                  setActiveStep={setActiveStep}
                  isLast={i === steps.length - 1}
                />
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          className="mt-16 flex justify-center"
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
        >
          <motion.button
            className="px-10 py-4 bg-[#1A1A1A] text-white rounded-xl font-medium flex items-center gap-2 group"
            whileHover={{ scale: 1.03, backgroundColor: "#4f46e5" }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
          >
            Get started for free
            <motion.span
              initial={{ x: 0 }}
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Badge to signify premium, award-winning design */}
        <motion.div
          className="absolute top-0 right-0 md:right-12 transform rotate-12 shadow-xl"
          initial={{ opacity: 0, y: -50, rotate: 0 }}
          animate={{ opacity: 1, y: 0, rotate: 12 }}
          transition={{ delay: 1, duration: 0.7 }}
        >
          <div className="bg-[#1A1A1A] text-white text-xs font-bold uppercase py-1 px-3 rounded-sm">
            Our Process
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TestimonialSection;
