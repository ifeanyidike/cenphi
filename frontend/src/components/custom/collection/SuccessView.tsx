import React, { useEffect, useState, useRef, useCallback, memo } from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  Variants,
} from "framer-motion";
import {
  Star,
  Sparkles,
  Diamond,
  Award,
  BookOpen,
  Crown,
  Heart,
} from "lucide-react";

// Define types for particles
interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
  blurAmount: number;
}

// Define props type
interface SuccessViewProps {
  testimonialType?: "personal" | "professional" | "transformational";
  userName?: string;
  onComplete?: () => void;
}

// A memoized particle component to help reduce re-renders
const ParticleComponent = memo(({ particle }: { particle: Particle }) => {
  return (
    <motion.div
      className="absolute rounded-full mix-blend-screen"
      initial={{
        x: `${particle.x}%`,
        y: `${particle.y}%`,
        opacity: 0,
        scale: 0,
      }}
      animate={{
        opacity: [0, particle.opacity, 0],
        scale: [0, 1, 0],
        x: [`${particle.x}%`, `${particle.x + (Math.random() * 15 - 7.5)}%`],
        y: [`${particle.y}%`, `${particle.y - 15 - Math.random() * 30}%`],
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{
        duration: particle.duration,
        delay: particle.delay,
        ease: "easeInOut",
      }}
      style={{
        width: `${particle.size}px`,
        height: `${particle.size}px`,
        backgroundColor: particle.color,
        filter: `blur(${particle.blurAmount}px)`,
      }}
    />
  );
});

const SuccessView: React.FC<SuccessViewProps> = ({
  testimonialType = "transformational",
  userName,
  onComplete,
}) => {
  // States and refs
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isFullyLoaded, setIsFullyLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRevealControls = useAnimationControls();
  const iconControls = useAnimationControls();
  const accentLightRef = useRef<HTMLDivElement>(null);

  // Dynamic content based on testimonial type
  const getThematicContent = useCallback(() => {
    switch (testimonialType) {
      case "personal":
        return {
          heading: "Extraordinary",
          subheading: "Your journey resonates deeply",
          message:
            "Your personal narrative creates a profound connection, inspiring those who walk similar paths. Thank you for your authentic voice.",
          quote: "Personal stories weave the fabric of our shared experience.",
          iconColor: "from-rose-300 to-amber-300",
          accentColor: "rgba(244,63,94,0.1)",
          gradientText: "from-rose-100 via-amber-50 to-rose-100",
        };
      case "professional":
        return {
          heading: "Distinguished",
          subheading: "Your expertise elevates our community",
          message:
            "Your professional insights add immense value and guide others toward excellence. We are honored by your contribution.",
          quote: "Expertise shared grows into collective wisdom.",
          iconColor: "from-emerald-300 to-teal-300",
          accentColor: "rgba(16,185,129,0.1)",
          gradientText: "from-emerald-100 via-teal-50 to-emerald-100",
        };
      default:
        return {
          heading: "Transcendent",
          subheading: "Your wisdom illuminates paths",
          message:
            "Your perspective transcends ordinary testimonials, sparking transformation in ways beyond measure.",
          quote:
            "Sharing our truth ignites the spark of transformation in others.",
          iconColor: "from-violet-300 to-indigo-300",
          accentColor: "rgba(139,92,246,0.1)",
          gradientText: "from-violet-100 via-indigo-50 to-violet-100",
        };
    }
  }, [testimonialType]);

  const thematicContent = getThematicContent();

  // Preload animation sequence
  const runAnimationSequence = useCallback(async () => {
    await iconControls.start("visible");
    await textRevealControls.start("visible");
    setIsFullyLoaded(true);
    if (onComplete) setTimeout(onComplete, 7000);
  }, [iconControls, textRevealControls, onComplete]);

  // Generate ambient particles (with reduced update frequency)
  useEffect(() => {
    const generateParticles = () => {
      const colors = [
        "#c7d2fe",
        "#ddd6fe",
        "#c4b5fd",
        "#a5b4fc",
        "#818cf8",
        "#93c5fd",
      ];

      const initialParticles: Particle[] = Array(40)
        .fill(null)
        .map(() => ({
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 2 + Math.random() * 8,
          opacity: 0.2 + Math.random() * 0.7,
          duration: 3 + Math.random() * 10,
          delay: Math.random() * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          blurAmount: Math.random() > 0.7 ? 3 : 1,
        }));

      setParticles(initialParticles);
    };

    generateParticles();
    runAnimationSequence();

    // Gradually update particles at a slower interval to minimize flicker
    const interval = setInterval(() => {
      setParticles((prev) => {
        const maxParticles = 60;
        const colors = [
          "#c7d2fe",
          "#ddd6fe",
          "#c4b5fd",
          "#a5b4fc",
          "#818cf8",
          "#93c5fd",
        ];
        let newParticles = [...prev];
        if (newParticles.length >= maxParticles) {
          newParticles.shift();
        }
        newParticles.push({
          id: Math.random().toString(36).substr(2, 9),
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: 2 + Math.random() * 8,
          opacity: 0.2 + Math.random() * 0.7,
          duration: 3 + Math.random() * 10,
          delay: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
          blurAmount: Math.random() > 0.7 ? 3 : 1,
        });
        return newParticles;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [runAnimationSequence]);

  // Simulate dynamic lighting effect (optimized)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!accentLightRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const offsetX = ((x - centerX) / centerX) * 50;
      const offsetY = ((y - centerY) / centerY) * 50;
      accentLightRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Animation variants
  const iconVariants: Variants = {
    hidden: {
      scale: 0,
      opacity: 0,
      rotate: -90,
      filter: "blur(10px)",
    },
    visible: {
      scale: [0, 1.05, 1],
      opacity: 1,
      rotate: 0,
      filter: "blur(0px)",
      transition: {
        duration: 1.2,
        ease: "easeOut",
      },
    },
  };

  const textVariants: Variants = {
    hidden: {
      clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
      opacity: 0,
    },
    visible: {
      clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      opacity: 1,
      transition: {
        duration: 1.2,
        delay: 0.8,
        ease: "easeOut",
      },
    },
  };

  const getIconByType = () => {
    switch (testimonialType) {
      case "personal":
        return <Heart className="w-16 h-16 text-white" strokeWidth={1.5} />;
      case "professional":
        return <Award className="w-16 h-16 text-white" strokeWidth={1.5} />;
      default:
        return <Diamond className="w-16 h-16 text-white" strokeWidth={1.5} />;
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-gray-800 via-gray-900 to-gray-800 rounded-2xl"
    >
      {/* Background layer with softened colors */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-800 to-gray-800 opacity-80" />

      {/* Mesh overlay removed for a cleaner, more professional look */}
      {/*
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.5 0H0V1.5V28.5V30H1.5H28.5H30V28.5V1.5V0H28.5H1.5ZM28.5 28.5H1.5V1.5H28.5V28.5Z' fill='white'/%3E%3C/svg%3E\")",
          backgroundSize: "30px 30px",
          opacity: 0.01,
        }}
      />
      */}

      {/* Accent lighting that follows the cursor */}
      <motion.div
        ref={accentLightRef}
        className="absolute opacity-30 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        transition={{ delay: 1, duration: 2 }}
        style={{
          width: "600px",
          height: "600px",
          borderRadius: "100%",
          background: `radial-gradient(circle, ${thematicContent.accentColor} 0%, transparent 70%)`,
          left: "calc(50% - 300px)",
          top: "calc(50% - 300px)",
          filter: "blur(80px)",
          transform: "translate(0px, 0px)",
        }}
      />

      {/* Ambient particle system */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatePresence>
          {particles.map((particle) => (
            <ParticleComponent key={particle.id} particle={particle} />
          ))}
        </AnimatePresence>
      </div>

      {/* Main content container */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Success icon with layered animations */}
        <motion.div
          className="relative w-52 h-52 mx-auto mb-16"
          style={{ pointerEvents: "none" }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0) 0%, ${thematicContent.accentColor} 50%, rgba(255,255,255,0) 100%)`,
              filter: "blur(30px)",
            }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle animated ring */}
          <motion.div
            className="absolute top-4 left-4 right-4 bottom-4 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${thematicContent.accentColor} 0%, transparent 80%)`,
              backdropFilter: "blur(5px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            animate={{ rotate: [0, -360] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          />

          {/* Pulsing middle layer */}
          <motion.div
            className="absolute top-10 left-10 right-10 bottom-10 rounded-full bg-black/40 backdrop-blur-md"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Inner success circle with icon */}
          <motion.div
            className={`absolute top-16 left-16 right-16 bottom-16 rounded-full bg-gradient-to-br ${thematicContent.iconColor} flex items-center justify-center shadow-lg`}
            style={{
              boxShadow: `0 10px 40px ${thematicContent.accentColor}`,
              pointerEvents: "none",
            }}
            variants={iconVariants}
            initial="hidden"
            animate={iconControls}
          >
            {getIconByType()}

            {/* Central glimmer */}
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
              style={{ filter: "blur(10px)", pointerEvents: "none" }}
            />
          </motion.div>

          {/* Orbiting decorative icons */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <Star className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-5 h-5 text-white/30" />
            <Sparkles className="absolute top-4 -right-4 w-6 h-6 text-white/40" />
            <Crown className="absolute -bottom-4 left-1/3 w-6 h-6 text-white/30" />
            <BookOpen className="absolute top-1/3 -left-6 w-5 h-5 text-white/40" />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <div className="space-y-4 mb-12">
          <motion.div
            className="overflow-hidden relative"
            variants={textVariants}
            initial="hidden"
            animate={textRevealControls}
          >
            <h1
              className={`text-7xl font-serif font-extralight mb-2 text-transparent bg-clip-text bg-gradient-to-r ${thematicContent.gradientText}`}
            >
              {thematicContent.heading}
            </h1>
            <motion.div
              className="h-px w-20 bg-white/40 mx-auto mt-3 mb-4"
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 1.8, duration: 1 }}
            />
          </motion.div>

          <motion.div
            className="overflow-hidden"
            variants={textVariants}
            initial="hidden"
            animate={textRevealControls}
          >
            <p className="text-3xl font-extralight text-white/90 tracking-wide">
              {thematicContent.subheading}
            </p>
          </motion.div>

          {userName && (
            <motion.p
              className="text-xl text-white/60 mt-2 font-light italic"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.2, duration: 1 }}
            >
              Thank you, {userName}
            </motion.p>
          )}
        </div>

        <motion.div
          className="max-w-xl mx-auto mb-12 space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1.2 }}
        >
          <p className="text-xl text-white/80 leading-relaxed font-light">
            {thematicContent.message}
          </p>

          <motion.div
            className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 2.4, duration: 1.5 }}
          />

          <motion.p
            className="text-lg text-white/60 italic font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.8, duration: 1 }}
          >
            "{thematicContent.quote}"
          </motion.p>
        </motion.div>

        <motion.div
          className="absolute -bottom-10 left-0 right-0 h-28 bg-gradient-to-t from-gray-900 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 1 }}
        />
      </div>
    </motion.div>
  );
};

export default SuccessView;
